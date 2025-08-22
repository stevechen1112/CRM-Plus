// API Routes
export const API_ROUTES = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
  },
  CUSTOMERS: {
    BASE: '/customers',
    SEARCH: '/customers/search',
    MERGE: '/customers/merge',
    DUPLICATES: '/customers/duplicates',
    ANALYTICS: '/customers/analytics',
    BY_ID: (id: string) => `/customers/${id}`,
    ORDERS: (id: string) => `/customers/${id}/orders`,
    INTERACTIONS: (id: string) => `/customers/${id}/interactions`,
    TASKS: (id: string) => `/customers/${id}/tasks`,
  },
  ORDERS: {
    BASE: '/orders',
    BY_ID: (id: string) => `/orders/${id}`,
    ITEMS: (id: string) => `/orders/${id}/items`,
  },
  INTERACTIONS: {
    BASE: '/interactions',
    BY_ID: (id: string) => `/interactions/${id}`,
  },
  TASKS: {
    BASE: '/tasks',
    BY_ID: (id: string) => `/tasks/${id}`,
    AUTOMATION_RULES: '/tasks/automation-rules',
  },
  IMPORT: {
    CUSTOMERS: '/import/customers',
    ORDERS: '/import/orders',
    JOBS: '/import/jobs',
    JOB_STATUS: (id: string) => `/import/jobs/${id}`,
  },
  EXPORT: {
    CUSTOMERS: '/export/customers',
    ORDERS: '/export/orders',
    INTERACTIONS: '/export/interactions',
  },
  AUDIT: {
    LOGS: '/audit/logs',
    LOGINS: '/audit/logins',
  },
  ANALYTICS: {
    SALES: '/analytics/sales',
    RFM: '/analytics/rfm',
    DASHBOARD: '/analytics/dashboard',
  },
} as const;

// Default values
export const DEFAULT_PAGINATION = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const DEFAULT_TASK_RULES = {
  NEW_LEAD_FOLLOW_UP_HOURS: 24,
  PROSPECT_INACTIVE_HOURS: 168, // 7 days
  CUSTOMER_INACTIVE_HOURS: 2160, // 90 days
  POST_SALE_CARE_HOURS: 72, // 3 days
  REPURCHASE_REMINDER_HOURS: 720, // 30 days
  BIRTHDAY_REMINDER_DAYS: 7,
} as const;

export const FILE_CONSTRAINTS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_IMPORT_ROWS: 50000,
  ALLOWED_EXTENSIONS: ['.csv', '.xlsx', '.xls'],
  ALLOWED_MIME_TYPES: [
    'text/csv',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
  ],
} as const;

// RFM Analysis Configuration
export const RFM_CONFIG = {
  RECENCY_THRESHOLDS: [30, 90, 180, 365], // days
  FREQUENCY_THRESHOLDS: [1, 2, 5, 10], // number of orders
  MONETARY_THRESHOLDS: [1000, 5000, 20000, 50000], // TWD
  SEGMENTS: {
    '555': 'champions',
    '554': 'champions',
    '544': 'champions',
    '545': 'champions',
    '454': 'loyal_customers',
    '455': 'loyal_customers',
    '445': 'loyal_customers',
    '355': 'potential_loyalists',
    '354': 'potential_loyalists',
    '345': 'potential_loyalists',
    '344': 'potential_loyalists',
    '155': 'new_customers',
    '154': 'new_customers',
    '145': 'new_customers',
    '144': 'new_customers',
    '353': 'promising',
    '343': 'promising',
    '252': 'promising',
    '251': 'promising',
    '553': 'need_attention',
    '543': 'need_attention',
    '442': 'need_attention',
    '441': 'need_attention',
    '352': 'about_to_sleep',
    '351': 'about_to_sleep',
    '342': 'about_to_sleep',
    '341': 'about_to_sleep',
    '452': 'at_risk',
    '451': 'at_risk',
    '443': 'at_risk',
    '453': 'cannot_lose_them',
    '444': 'cannot_lose_them',
  } as Record<string, string>,
} as const;

// Task priorities and types
export const TASK_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;

export const TASK_TYPES = {
  FOLLOW_UP: 'follow_up',
  CARE_CALL: 'care_call',
  REPURCHASE: 'repurchase',
  BIRTHDAY: 'birthday',
  PAYMENT_REMINDER: 'payment_reminder',
  OTHER: 'other',
} as const;

export const TASK_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

// Customer interaction channels
export const INTERACTION_CHANNELS = {
  PHONE: 'phone',
  EMAIL: 'email',
  LINE: 'line',
  FACEBOOK: 'facebook',
  IN_PERSON: 'in_person',
  OTHER: 'other',
} as const;

// Order and payment statuses
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  PARTIAL: 'partial',
} as const;

export const ORDER_STATUS = {
  DRAFT: 'draft',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const;

// User roles
export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  SALES: 'sales',
  SUPPORT: 'support',
} as const;

// Import/Export
export const IMPORT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

// CSV column mappings for import
export const CSV_COLUMN_MAPPINGS = {
  CUSTOMER: {
    phone: ['phone', '電話', '手機', 'mobile', 'telephone'],
    name: ['name', '姓名', '客戶姓名', 'customer_name', 'fullname'],
    email: ['email', '電子郵件', 'e-mail', 'mail'],
    lineId: ['line_id', 'line', 'LINE ID', '賴'],
    source: ['source', '來源', 'lead_source', 'referral'],
    tags: ['tags', '標籤', 'labels', 'categories'],
    marketingConsent: ['marketing_consent', '行銷同意', 'consent', 'marketing'],
    notes: ['notes', '備註', 'remarks', 'memo'],
  },
  ORDER: {
    orderNo: ['order_no', '訂單號碼', 'order_number', 'order_id'],
    customerPhone: ['customer_phone', '客戶電話', 'phone', '手機'],
    productName: ['product_name', '產品名稱', 'product', 'item'],
    quantity: ['quantity', '數量', 'qty', 'amount'],
    unitPrice: ['unit_price', '單價', 'price', '價格'],
    paymentStatus: ['payment_status', '付款狀態', 'payment'],
    orderStatus: ['order_status', '訂單狀態', 'status'],
    orderDate: ['order_date', '訂單日期', 'date', 'created_at'],
  },
} as const;

// Error messages
export const ERROR_MESSAGES = {
  VALIDATION: {
    PHONE_INVALID: 'Invalid Taiwan phone number format (should be 09xxxxxxxx)',
    EMAIL_INVALID: 'Invalid email format',
    REQUIRED_FIELD: (field: string) => `${field} is required`,
    MIN_LENGTH: (field: string, min: number) => `${field} must be at least ${min} characters`,
    MAX_LENGTH: (field: string, max: number) => `${field} must not exceed ${max} characters`,
  },
  AUTH: {
    INVALID_CREDENTIALS: 'Invalid email or password',
    TOKEN_EXPIRED: 'Token has expired',
    UNAUTHORIZED: 'Unauthorized access',
    FORBIDDEN: 'Access forbidden',
  },
  CUSTOMER: {
    NOT_FOUND: 'Customer not found',
    PHONE_EXISTS: 'Phone number already exists',
    CANNOT_DELETE_WITH_ORDERS: 'Cannot delete customer with existing orders',
  },
  ORDER: {
    NOT_FOUND: 'Order not found',
    INVALID_AMOUNT: 'Invalid order amount',
    CANNOT_MODIFY_DELIVERED: 'Cannot modify delivered order',
  },
  TASK: {
    NOT_FOUND: 'Task not found',
    CANNOT_REASSIGN_COMPLETED: 'Cannot reassign completed task',
  },
  IMPORT: {
    FILE_TOO_LARGE: `File size exceeds ${FILE_CONSTRAINTS.MAX_FILE_SIZE / (1024 * 1024)}MB limit`,
    TOO_MANY_ROWS: `File exceeds ${FILE_CONSTRAINTS.MAX_IMPORT_ROWS} rows limit`,
    UNSUPPORTED_FORMAT: 'Unsupported file format',
    PARSING_ERROR: 'Error parsing file',
  },
  GENERAL: {
    INTERNAL_ERROR: 'Internal server error',
    NOT_FOUND: 'Resource not found',
    BAD_REQUEST: 'Bad request',
  },
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  CUSTOMER: {
    CREATED: 'Customer created successfully',
    UPDATED: 'Customer updated successfully',
    DELETED: 'Customer deleted successfully',
    MERGED: 'Customers merged successfully',
  },
  ORDER: {
    CREATED: 'Order created successfully',
    UPDATED: 'Order updated successfully',
    CANCELLED: 'Order cancelled successfully',
  },
  TASK: {
    CREATED: 'Task created successfully',
    UPDATED: 'Task updated successfully',
    COMPLETED: 'Task completed successfully',
  },
  IMPORT: {
    STARTED: 'Import process started',
    COMPLETED: 'Import completed successfully',
  },
  AUTH: {
    LOGIN_SUCCESS: 'Login successful',
    LOGOUT_SUCCESS: 'Logout successful',
  },
} as const;

// Date formats
export const DATE_FORMATS = {
  DISPLAY: 'YYYY-MM-DD HH:mm:ss',
  DATE_ONLY: 'YYYY-MM-DD',
  TIME_ONLY: 'HH:mm:ss',
  ISO: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
} as const;

// Taiwan specific constants
export const TAIWAN_REGIONS = [
  '台北市', '新北市', '桃園市', '台中市', '台南市', '高雄市',
  '基隆市', '新竹市', '嘉義市', '新竹縣', '苗栗縣', '彰化縣',
  '南投縣', '雲林縣', '嘉義縣', '屏東縣', '宜蘭縣', '花蓮縣',
  '台東縣', '澎湖縣', '金門縣', '連江縣'
] as const;

export const COMMON_CUSTOMER_SOURCES = [
  '官方網站', 'Facebook', 'Instagram', 'LINE', 'Google搜尋',
  '朋友介紹', '展覽會', '電話開發', 'Email行銷', '其他'
] as const;