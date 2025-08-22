import { z } from 'zod';

// Taiwan phone number validation
const phoneRegex = /^09\d{8}$|^\+886-9\d{8}$|^886-9\d{8}$/;

// Base schemas
export const CustomerSchema = z.object({
  phone: z.string().regex(phoneRegex, 'Invalid Taiwan phone number format'),
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email().optional(),
  lineId: z.string().max(100).optional(),
  facebookUrl: z.string().url().optional(),
  source: z.string().max(50).optional(),
  tags: z.array(z.string()).default([]),
  region: z.string().max(50).optional(),
  preferredProducts: z.array(z.string()).optional(),
  paymentMethods: z.array(z.string()).optional(),
  marketingConsent: z.boolean().default(false),
  notes: z.string().optional(),
});

export const OrderSchema = z.object({
  id: z.string().uuid(),
  orderNo: z.string().min(1),
  customerPhone: z.string().regex(phoneRegex),
  totalAmount: z.number().min(0),
  paymentStatus: z.enum(['pending', 'paid', 'failed', 'refunded', 'partial']),
  paymentMethod: z.string().optional(),
  orderStatus: z.enum(['draft', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']),
  deliveryMethod: z.string().optional(),
  deliveryAddress: z.string().optional(),
  notes: z.string().optional(),
});

export const OrderItemSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid(),
  productName: z.string().min(1),
  quantity: z.number().int().min(1),
  unitPrice: z.number().min(0),
  totalPrice: z.number().min(0),
  notes: z.string().optional(),
});

export const InteractionSchema = z.object({
  id: z.string().uuid(),
  customerPhone: z.string().regex(phoneRegex),
  channel: z.enum(['phone', 'email', 'line', 'facebook', 'in_person', 'other']),
  summary: z.string().min(1).max(500),
  notes: z.string().optional(),
  attachments: z.array(z.string()).optional(),
  userId: z.string().uuid(),
});

export const TaskSchema = z.object({
  id: z.string().uuid(),
  customerPhone: z.string().regex(phoneRegex),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  type: z.enum(['follow_up', 'care_call', 'repurchase', 'birthday', 'payment_reminder', 'other']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']),
  assigneeId: z.string().uuid(),
  dueAt: z.coerce.date(),
  completedAt: z.coerce.date().optional(),
  automationRuleId: z.string().uuid().optional(),
});

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1).max(100),
  role: z.enum(['admin', 'manager', 'sales', 'support']),
  isActive: z.boolean().default(true),
});

// API Request schemas
export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const CreateCustomerRequestSchema = z.object({
  phone: z.string().regex(phoneRegex, 'Invalid Taiwan phone number format'),
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email().optional(),
  lineId: z.string().max(100).optional(),
  facebookUrl: z.string().url().optional(),
  source: z.string().max(50).optional(),
  tags: z.array(z.string()).default([]),
  region: z.string().max(50).optional(),
  marketingConsent: z.boolean().default(false),
  notes: z.string().optional(),
});

export const UpdateCustomerRequestSchema = CreateCustomerRequestSchema.partial().omit({ phone: true });

export const CustomerSearchParamsSchema = z.object({
  query: z.string().optional(),
  tags: z.array(z.string()).optional(),
  source: z.string().optional(),
  region: z.string().optional(),
  rfmSegment: z.enum(['champions', 'loyal_customers', 'potential_loyalists', 'new_customers', 
                      'promising', 'need_attention', 'about_to_sleep', 'at_risk', 'cannot_lose_them', 'hibernating']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const CreateOrderRequestSchema = z.object({
  customerPhone: z.string().regex(phoneRegex),
  items: z.array(z.object({
    productName: z.string().min(1),
    quantity: z.number().int().min(1),
    unitPrice: z.number().min(0),
  })).min(1),
  paymentMethod: z.string().optional(),
  deliveryMethod: z.string().optional(),
  deliveryAddress: z.string().optional(),
  notes: z.string().optional(),
});

export const UpdateOrderRequestSchema = z.object({
  paymentStatus: z.enum(['pending', 'paid', 'failed', 'refunded', 'partial']).optional(),
  orderStatus: z.enum(['draft', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']).optional(),
  notes: z.string().optional(),
});

export const CreateTaskRequestSchema = z.object({
  customerPhone: z.string().regex(phoneRegex),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  type: z.enum(['follow_up', 'care_call', 'repurchase', 'birthday', 'payment_reminder', 'other']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  assigneeId: z.string().uuid().optional(),
  dueAt: z.coerce.date(),
});

export const TaskSearchParamsSchema = z.object({
  assigneeId: z.string().uuid().optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  type: z.enum(['follow_up', 'care_call', 'repurchase', 'birthday', 'payment_reminder', 'other']).optional(),
  dueBefore: z.coerce.date().optional(),
  dueAfter: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const MergeCustomersRequestSchema = z.object({
  primaryPhone: z.string().regex(phoneRegex),
  duplicatePhones: z.array(z.string().regex(phoneRegex)).min(1),
});

// CSV Import schemas
export const CustomerImportRowSchema = z.object({
  phone: z.string().regex(phoneRegex, 'Invalid Taiwan phone number format'),
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email().optional().or(z.literal('')),
  lineId: z.string().max(100).optional().or(z.literal('')),
  source: z.string().max(50).optional().or(z.literal('')),
  tags: z.string().optional().or(z.literal('')), // comma-separated string
  marketingConsent: z.string().transform((val) => {
    if (!val || val === '') return false;
    const normalized = val.toLowerCase().trim();
    return normalized === 'true' || normalized === 'yes' || normalized === '1';
  }),
  notes: z.string().optional().or(z.literal('')),
});

export const OrderImportRowSchema = z.object({
  orderNo: z.string().optional().or(z.literal('')),
  customerPhone: z.string().regex(phoneRegex),
  productName: z.string().min(1),
  quantity: z.coerce.number().int().min(1),
  unitPrice: z.coerce.number().min(0),
  paymentStatus: z.enum(['pending', 'paid', 'failed', 'refunded', 'partial']).optional(),
  orderStatus: z.enum(['draft', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']).optional(),
  orderDate: z.string().optional(), // ISO date string, will be parsed later
});

// Validation utilities
export const validatePhone = (phone: string): boolean => {
  return phoneRegex.test(phone);
};

export const normalizePhone = (phone: string): string => {
  // Convert +886-9xxxxxxxx or 886-9xxxxxxxx to 09xxxxxxxx
  return phone.replace(/^(\+?886-?)/, '0');
};

export const validateEmail = (email: string): boolean => {
  return z.string().email().safeParse(email).success;
};

// Export types inferred from schemas
export type CustomerInput = z.infer<typeof CreateCustomerRequestSchema>;
export type CustomerUpdate = z.infer<typeof UpdateCustomerRequestSchema>;
export type CustomerSearch = z.infer<typeof CustomerSearchParamsSchema>;
export type OrderInput = z.infer<typeof CreateOrderRequestSchema>;
export type OrderUpdate = z.infer<typeof UpdateOrderRequestSchema>;
export type TaskInput = z.infer<typeof CreateTaskRequestSchema>;
export type TaskSearch = z.infer<typeof TaskSearchParamsSchema>;
export type CustomerImportRow = z.infer<typeof CustomerImportRowSchema>;
export type OrderImportRow = z.infer<typeof OrderImportRowSchema>;