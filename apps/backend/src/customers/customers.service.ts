import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '../prisma/prisma.single';
import { CreateCustomerDto, UpdateCustomerDto, CustomerQueryDto, DuplicateCheckDto, MergeCustomersDto } from './dto/customer.dto';
import { Customer, PaginatedResponse } from '@crm/shared';

@Injectable()
export class CustomersService {
  constructor() {}

  async create(createCustomerDto: CreateCustomerDto, userId: string, userIp: string): Promise<Customer> {
    // Check if customer already exists by phone
    const existingCustomer = await prisma.customer.findUnique({
      where: { phone: createCustomerDto.phone }
    });

    if (existingCustomer) {
      throw new ConflictException('Customer with this phone number already exists');
    }

    // Check for potential name duplicates
    const nameDuplicates = await this.checkNameDuplicates(createCustomerDto.name);
    if (nameDuplicates.length > 0) {
      // Log potential duplicate warning
      // TODO: Re-enable audit logging after fixing dependency injection
      console.log('Warning: Potential name duplicate detected', {
        similarCustomers: nameDuplicates.map(c => ({ phone: c.phone, name: c.name }))
      });
    }

    const customer = await prisma.customer.create({
      data: {
        ...createCustomerDto,
      },
    });

    // Log creation
    // TODO: Re-enable audit logging after fixing dependency injection
    console.log('Customer created:', { phone: customer.phone, userId });

    return customer;
  }

  async findAll(query: CustomerQueryDto): Promise<PaginatedResponse<Customer>> {
    const { page = 1, limit = 20, search, status, source, company } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } },
      ];
    }

    if (source) where.source = source;

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: {
          _count: {
            select: {
              orders: true,
              interactions: true,
              tasks: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.customer.count({ where }),
    ]);

    return {
      data: customers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  async findOne(phone: string): Promise<Customer> {
    const customer = await prisma.customer.findUnique({
      where: { phone },
      include: {
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 10, // Latest 10 orders
        },
        interactions: {
          orderBy: { createdAt: 'desc' },
          take: 10, // Latest 10 interactions
        },
        tasks: {
          where: { status: { in: ['PENDING', 'IN_PROGRESS'] } },
          orderBy: { dueAt: 'asc' },
        },
        _count: {
          select: {
            orders: true,
            interactions: true,
            tasks: true,
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  async update(phone: string, updateCustomerDto: UpdateCustomerDto, userId: string, userIp: string): Promise<Customer> {
    const existingCustomer = await prisma.customer.findUnique({
      where: { phone }
    });

    if (!existingCustomer) {
      throw new NotFoundException('Customer not found');
    }

    const customer = await prisma.customer.update({
      where: { phone },
      data: {
        ...updateCustomerDto,
      },
    });

    // Log update
    // TODO: Re-enable audit logging after fixing dependency injection
    console.log('Customer updated:', {
      action: 'update_customer',
      entity: 'Customer',
      entityId: phone,
      userId,
      userIp,
      changes: {
        before: existingCustomer,
        after: updateCustomerDto,
      },
      status: 'success'
    });

    return customer;
  }

  async remove(phone: string, userId: string, userIp: string): Promise<void> {
    const existingCustomer = await prisma.customer.findUnique({
      where: { phone },
      include: {
        _count: {
          select: {
            orders: true,
            interactions: true,
            tasks: true,
          },
        },
      },
    });

    if (!existingCustomer) {
      throw new NotFoundException('Customer not found');
    }

    // Check if customer has related data
    if (existingCustomer._count.orders > 0 || existingCustomer._count.interactions > 0 || existingCustomer._count.tasks > 0) {
      throw new BadRequestException('Cannot delete customer with existing orders, interactions, or tasks');
    }

    await prisma.customer.delete({
      where: { phone }
    });

    // Log deletion
    // TODO: Re-enable audit logging after fixing dependency injection
    console.log('Customer deleted:', {
      action: 'delete_customer',
      entity: 'Customer',
      entityId: phone,
      userId,
      userIp,
      changes: { deletedCustomer: existingCustomer },
      status: 'success'
    });
  }

  async checkDuplicates(duplicateCheckDto: DuplicateCheckDto): Promise<{ nameDuplicates: Customer[] }> {
    const nameDuplicates = await this.checkNameDuplicates(duplicateCheckDto.name, duplicateCheckDto.excludePhone);
    
    return {
      nameDuplicates,
    };
  }

  private async checkNameDuplicates(name: string, excludePhone?: string): Promise<Customer[]> {
    // Use Levenshtein distance or similar name matching
    // For now, using simple contains search
    const where: any = {
      name: {
        contains: name,
      },
    };

    if (excludePhone) {
      where.phone = {
        not: excludePhone,
      };
    }

    const customers = await prisma.customer.findMany({
      where,
      select: {
        phone: true,
        name: true,
        email: true,
        createdAt: true,
        tags: true,
        marketingConsent: true,
        updatedAt: true,
        lineId: true,
        facebookUrl: true,
        source: true,
        region: true,
        preferredProducts: true,
        paymentMethods: true,
        notes: true,
      },
    });
    return customers as any;
  }

  async mergeCustomers(mergeDto: MergeCustomersDto, userId: string, userIp: string): Promise<Customer> {
    const { primaryPhone, secondaryPhones, mergeFields } = mergeDto;

    // Validate all customers exist
    const primaryCustomer = await prisma.customer.findUnique({
      where: { phone: primaryPhone }
    });

    if (!primaryCustomer) {
      throw new NotFoundException(`Primary customer ${primaryPhone} not found`);
    }

    const secondaryCustomers = await prisma.customer.findMany({
      where: {
        phone: {
          in: secondaryPhones,
        },
      },
      include: {
        orders: true,
        interactions: true,
        tasks: true,
      },
    });

    if (secondaryCustomers.length !== secondaryPhones.length) {
      throw new NotFoundException('One or more secondary customers not found');
    }

    // Start transaction for merge operation
    return prisma.$transaction(async (tx) => {
      // Prepare merge data
      const updateData: any = {};
      
      if (mergeFields) {
        // Merge specific fields from secondary customers
        for (const secondary of secondaryCustomers) {
          if (mergeFields.email && secondary.email && !primaryCustomer.email) {
            updateData.email = secondary.email;
          }
          // Address, company, and title fields don't exist in current Customer model
          if (mergeFields.notes && secondary.notes) {
            updateData.notes = primaryCustomer.notes 
              ? `${primaryCustomer.notes}\n---\n${secondary.notes}`
              : secondary.notes;
          }
          if (mergeFields.tags && secondary.tags) {
            const primaryTags = primaryCustomer.tags || [];
            const secondaryTags = secondary.tags || [];
            updateData.tags = [...new Set([...primaryTags, ...secondaryTags])];
          }
        }
      }

      // Update primary customer with merged data
      const updatedPrimary = await tx.customer.update({
        where: { phone: primaryPhone },
        data: updateData,
      });

      // Move all related records to primary customer
      for (const secondary of secondaryCustomers) {
        // Move orders
        await tx.order.updateMany({
          where: { customerPhone: secondary.phone },
          data: { customerPhone: primaryPhone },
        });

        // Move interactions
        await tx.interaction.updateMany({
          where: { customerPhone: secondary.phone },
          data: { customerPhone: primaryPhone },
        });

        // Move tasks
        await tx.task.updateMany({
          where: { customerPhone: secondary.phone },
          data: { customerPhone: primaryPhone },
        });

        // Delete secondary customer
        await tx.customer.delete({
          where: { phone: secondary.phone },
        });
      }

      // Log merge operation
      // TODO: Re-enable audit logging after fixing dependency injection
      console.log('Customers merged:', {
        action: 'merge_customers',
        entity: 'Customer',
        entityId: primaryPhone,
        userId,
        userIp,
        changes: {
          primaryPhone,
          secondaryPhones,
          mergeFields,
          mergedData: updateData,
        },
        status: 'success'
      });

      return updatedPrimary;
    });
  }

  async getCustomerStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    potential: number;
    blacklisted: number;
    bySource: Record<string, number>;
  }> {
    const [
      total,
      active,
      inactive,
      potential,
      blacklisted,
      sourceStats,
    ] = await Promise.all([
      prisma.customer.count(),
      prisma.customer.count(), // No status field in current model
      prisma.customer.count(), // No status field in current model
      prisma.customer.count(), // No status field in current model
      prisma.customer.count(), // No status field in current model
      prisma.customer.groupBy({
        by: ['source'],
        _count: {
          _all: true,
        },
      }),
    ]);

    const bySource: Record<string, number> = {};
    sourceStats.forEach(stat => {
      bySource[stat.source] = stat._count._all;
    });

    return {
      total,
      active,
      inactive,
      potential,
      blacklisted,
      bySource,
    };
  }
}