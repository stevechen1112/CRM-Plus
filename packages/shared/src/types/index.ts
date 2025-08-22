// Core Entity Types
export interface Customer {
  phone: string; // Primary key - Taiwan phone format
  name: string;
  email?: string;
  lineId?: string;
  facebookUrl?: string;
  source?: string;
  tags: string[];
  region?: string;
  preferredProducts?: string[];
  paymentMethods?: string[];
  marketingConsent: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  // Computed fields
  totalSpent?: number;
  orderCount?: number;
  lastOrderDate?: Date;
  rfmSegment?: RFMSegment;
}

export interface Order {
  id: string;
  orderNo: string; // Unique order number
  customerPhone: string;
  items: OrderItem[];
  totalAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  orderStatus: OrderStatus;
  deliveryMethod?: string;
  deliveryAddress?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

export interface Interaction {
  id: string;
  customerPhone: string;
  channel: InteractionChannel;
  summary: string;
  notes?: string;
  attachments?: string[];
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  customerPhone: string;
  title: string;
  description?: string;
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  assigneeId: string;
  dueAt: Date;
  completedAt?: Date;
  automationRuleId?: string; // For auto-generated tasks
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditLog {
  id: string;
  requestId: string;
  userId: string;
  userIp: string;
  action: string;
  entity: string;
  entityId: string;
  changes?: Record<string, any>;
  status: 'success' | 'error';
  latencyMs: number;
  createdAt: Date;
}

export interface ImportJob {
  id: string;
  userId: string;
  type: 'customers' | 'orders';
  fileName: string;
  totalRows: number;
  processedRows: number;
  successRows: number;
  errorRows: number;
  status: ImportStatus;
  errors?: ImportError[];
  createdAt: Date;
  completedAt?: Date;
}

export interface ImportError {
  row: number;
  field: string;
  value: any;
  message: string;
}

// Enums and Union Types
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'PARTIAL';
export type OrderStatus = 'DRAFT' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
export type InteractionChannel = 'PHONE' | 'EMAIL' | 'LINE' | 'FACEBOOK' | 'IN_PERSON' | 'OTHER';
export type TaskType = 'FOLLOW_UP' | 'CARE_CALL' | 'REPURCHASE' | 'BIRTHDAY' | 'PAYMENT_REMINDER' | 'OTHER';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type UserRole = 'ADMIN' | 'MANAGER' | 'STAFF';
export type ImportStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type RFMSegment = 'CHAMPIONS' | 'LOYAL_CUSTOMERS' | 'POTENTIAL_LOYALISTS' | 'NEW_CUSTOMERS' | 
                        'PROMISING' | 'NEED_ATTENTION' | 'ABOUT_TO_SLEEP' | 'AT_RISK' | 'CANNOT_LOSE_THEM' | 'HIBERNATING';

// API Request/Response Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: Omit<User, 'password'>;
}

export interface CreateCustomerRequest {
  phone: string;
  name: string;
  email?: string;
  lineId?: string;
  facebookUrl?: string;
  source?: string;
  tags?: string[];
  region?: string;
  marketingConsent?: boolean;
  notes?: string;
}

export interface UpdateCustomerRequest {
  name?: string;
  email?: string;
  lineId?: string;
  facebookUrl?: string;
  source?: string;
  tags?: string[];
  region?: string;
  marketingConsent?: boolean;
  notes?: string;
}

export interface CustomerSearchParams {
  query?: string;
  tags?: string[];
  source?: string;
  region?: string;
  rfmSegment?: RFMSegment;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateOrderRequest {
  customerPhone: string;
  items: Omit<OrderItem, 'id' | 'orderId'>[];
  paymentMethod?: string;
  deliveryMethod?: string;
  deliveryAddress?: string;
  notes?: string;
}

export interface UpdateOrderRequest {
  paymentStatus?: PaymentStatus;
  orderStatus?: OrderStatus;
  notes?: string;
}

export interface CreateTaskRequest {
  customerPhone: string;
  title: string;
  description?: string;
  type: TaskType;
  priority?: TaskPriority;
  assigneeId?: string;
  dueAt: Date;
}

export interface TaskSearchParams {
  assigneeId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  type?: TaskType;
  dueBefore?: Date;
  dueAfter?: Date;
  page?: number;
  limit?: number;
}

export interface MergeCustomersRequest {
  primaryPhone: string;
  duplicatePhones: string[];
}

export interface DuplicateDetectionResult {
  suspectedDuplicates: {
    phone: string;
    name: string;
    similarTo: {
      phone: string;
      name: string;
      similarity: number;
    }[];
  }[];
}

// Analytics Types
export interface RFMAnalysis {
  customerPhone: string;
  recency: number; // days since last order
  frequency: number; // total orders
  monetary: number; // total spent
  rScore: number; // 1-5
  fScore: number; // 1-5
  mScore: number; // 1-5
  rfmScore: string; // e.g., "555"
  segment: RFMSegment;
}

export interface SalesReport {
  period: string;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  newCustomers: number;
  returningCustomers: number;
  conversionRate: number;
  topProducts: {
    name: string;
    quantity: number;
    revenue: number;
  }[];
  revenueBySource: {
    source: string;
    revenue: number;
    percentage: number;
  }[];
}

// Pagination and API Response Types
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface ApiError {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path: string;
}

// Configuration Types
export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: 'new_lead' | 'no_interaction' | 'post_sale' | 'payment_overdue' | 'birthday';
  conditions: {
    customerType?: 'prospect' | 'customer';
    hoursAfterEvent?: number;
    daysBeforeEvent?: number;
  };
  action: {
    taskType: TaskType;
    taskTitle: string;
    taskDescription: string;
    priority: TaskPriority;
    assignToUserId?: string;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SystemSettings {
  rules: {
    newLeadFollowUpHours: number;
    prospectsInactiveHours: number;
    customersInactiveHours: number;
    postSaleCareHours: number;
    repurchaseReminderHours: number;
    birthdayReminderDays: number;
  };
  email: {
    enabled: boolean;
    fromAddress: string;
    smtpHost: string;
    smtpPort: number;
  };
  import: {
    maxFileSize: number;
    maxRows: number;
    allowedFormats: string[];
  };
}

// CSV Import/Export Types (schemas define the actual validation types)

export interface ExportOptions {
  format: 'csv' | 'excel';
  dateRange?: {
    start: Date;
    end: Date;
  };
  customerFilter?: CustomerSearchParams;
}

// WebSocket/Real-time Types
export interface TaskNotification {
  type: 'task_created' | 'task_due_soon' | 'task_overdue';
  task: Task;
  customer: Customer;
}

export interface ImportProgressUpdate {
  jobId: string;
  processedRows: number;
  totalRows: number;
  currentRow?: number;
  status: ImportStatus;
  errors?: ImportError[];
}