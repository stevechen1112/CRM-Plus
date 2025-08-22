// Utility functions for CRM system

/**
 * Normalize Taiwan phone number to standard format (09xxxxxxxx)
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';
  
  // Remove all non-digit characters except + at the beginning
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // Handle different formats:
  // +886-9xxxxxxxx -> 09xxxxxxxx
  // 886-9xxxxxxxx -> 09xxxxxxxx
  // 09xxxxxxxx -> 09xxxxxxxx
  if (cleaned.startsWith('+886')) {
    cleaned = '0' + cleaned.substring(4);
  } else if (cleaned.startsWith('886')) {
    cleaned = '0' + cleaned.substring(3);
  }
  
  return cleaned;
}

/**
 * Validate Taiwan phone number format
 */
export function isValidPhoneNumber(phone: string): boolean {
  const normalized = normalizePhoneNumber(phone);
  return /^09\d{8}$/.test(normalized);
}

/**
 * Format phone number for display with dashes
 */
export function formatPhoneNumber(phone: string): string {
  const normalized = normalizePhoneNumber(phone);
  if (normalized.length === 10 && normalized.startsWith('09')) {
    return `${normalized.slice(0, 4)}-${normalized.slice(4, 7)}-${normalized.slice(7)}`;
  }
  return phone;
}

/**
 * Calculate similarity between two strings using Levenshtein distance
 */
export function calculateStringSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  if (str1 === str2) return 1;
  
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1;
  
  const len1 = s1.length;
  const len2 = s2.length;
  
  if (len1 === 0) return len2 === 0 ? 1 : 0;
  if (len2 === 0) return 0;
  
  // Create matrix
  const matrix: number[][] = Array(len2 + 1).fill(null).map(() => Array(len1 + 1).fill(null));
  
  // Initialize first row and column
  for (let i = 0; i <= len1; i++) matrix[0][i] = i;
  for (let j = 0; j <= len2; j++) matrix[j][0] = j;
  
  // Fill the matrix
  for (let j = 1; j <= len2; j++) {
    for (let i = 1; i <= len1; i++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,     // deletion
        matrix[j - 1][i] + 1,     // insertion
        matrix[j - 1][i - 1] + cost // substitution
      );
    }
  }
  
  const maxLen = Math.max(len1, len2);
  return (maxLen - matrix[len2][len1]) / maxLen;
}

/**
 * Check if two customer names are similar enough to be duplicates
 */
export function areNamesSimilar(name1: string, name2: string, threshold: number = 0.8): boolean {
  return calculateStringSimilarity(name1, name2) >= threshold;
}

/**
 * Parse CSV row into object with proper type conversion
 */
export function parseCsvRow(row: string[], headers: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  headers.forEach((header, index) => {
    result[header] = (row[index] || '').trim();
  });
  return result;
}

/**
 * Convert boolean-like strings to actual booleans
 */
export function parseBoolean(value: string | boolean | undefined): boolean {
  if (typeof value === 'boolean') return value;
  if (!value || value === '') return false;
  
  const normalized = value.toString().toLowerCase().trim();
  return normalized === 'true' || 
         normalized === 'yes' || 
         normalized === '1' || 
         normalized === 'on' ||
         normalized === 'checked';
}

/**
 * Parse comma-separated string into array
 */
export function parseCommaSeparated(value: string | undefined): string[] {
  if (!value || value.trim() === '') return [];
  
  return value
    .split(',')
    .map(item => item.trim())
    .filter(item => item.length > 0);
}

/**
 * Generate unique order number
 */
export function generateOrderNumber(prefix: string = 'ORD'): string {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${timestamp}${random}`;
}

/**
 * Calculate RFM scores
 */
export function calculateRFMScore(
  recencyDays: number, 
  frequency: number, 
  monetary: number
): { rScore: number; fScore: number; mScore: number; rfmScore: string } {
  // Recency scoring (reverse: lower is better)
  let rScore = 1;
  if (recencyDays <= 30) rScore = 5;
  else if (recencyDays <= 90) rScore = 4;
  else if (recencyDays <= 180) rScore = 3;
  else if (recencyDays <= 365) rScore = 2;
  
  // Frequency scoring
  let fScore = 1;
  if (frequency >= 10) fScore = 5;
  else if (frequency >= 5) fScore = 4;
  else if (frequency >= 2) fScore = 3;
  else if (frequency >= 1) fScore = 2;
  
  // Monetary scoring
  let mScore = 1;
  if (monetary >= 50000) mScore = 5;
  else if (monetary >= 20000) mScore = 4;
  else if (monetary >= 5000) mScore = 3;
  else if (monetary >= 1000) mScore = 2;
  
  return {
    rScore,
    fScore,
    mScore,
    rfmScore: `${rScore}${fScore}${mScore}`
  };
}

/**
 * Get RFM segment from RFM score
 */
export function getRFMSegment(rfmScore: string): string {
  const segmentMap: Record<string, string> = {
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
  };
  
  return segmentMap[rfmScore] || 'hibernating';
}

/**
 * Format currency amount in TWD
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string, format: 'full' | 'date' | 'time' | 'relative' = 'full'): string {
  const d = new Date(date);
  
  if (isNaN(d.getTime())) return 'Invalid Date';
  
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Taipei',
  };
  
  switch (format) {
    case 'date':
      options.year = 'numeric';
      options.month = '2-digit';
      options.day = '2-digit';
      break;
    case 'time':
      options.hour = '2-digit';
      options.minute = '2-digit';
      options.second = '2-digit';
      break;
    case 'relative':
      return getRelativeTime(d);
    default:
      options.year = 'numeric';
      options.month = '2-digit';
      options.day = '2-digit';
      options.hour = '2-digit';
      options.minute = '2-digit';
      options.second = '2-digit';
  }
  
  return d.toLocaleDateString('zh-TW', options);
}

/**
 * Get relative time string
 */
export function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMins < 1) return '剛剛';
  if (diffMins < 60) return `${diffMins} 分鐘前`;
  if (diffHours < 24) return `${diffHours} 小時前`;
  if (diffDays < 30) return `${diffDays} 天前`;
  
  return formatDate(date, 'date');
}

/**
 * Debounce function for search
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), wait);
  };
}

/**
 * Generate random color for tags/labels
 */
export function generateTagColor(tag: string): string {
  const colors = [
    'bg-blue-100 text-blue-800',
    'bg-green-100 text-green-800',
    'bg-yellow-100 text-yellow-800',
    'bg-red-100 text-red-800',
    'bg-indigo-100 text-indigo-800',
    'bg-purple-100 text-purple-800',
    'bg-pink-100 text-pink-800',
    'bg-gray-100 text-gray-800',
  ];
  
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}

/**
 * Validate and sanitize file upload
 */
export function validateFileUpload(file: File, allowedTypes: string[], maxSize: number): string | null {
  if (!file) return 'No file selected';
  
  if (file.size > maxSize) {
    return `File size exceeds ${Math.round(maxSize / (1024 * 1024))}MB limit`;
  }
  
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!allowedTypes.includes(fileExtension)) {
    return `File type not supported. Allowed types: ${allowedTypes.join(', ')}`;
  }
  
  return null; // Valid file
}

/**
 * Calculate task urgency based on due date and priority
 */
export function calculateTaskUrgency(dueDate: Date, priority: string): 'overdue' | 'due_soon' | 'normal' {
  const now = new Date();
  const diffHours = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  if (diffHours < 0) return 'overdue';
  if (diffHours < 24 || priority === 'urgent') return 'due_soon';
  return 'normal';
}

/**
 * Mask sensitive data (phone numbers, emails) for logs
 */
export function maskSensitiveData(data: any): any {
  if (typeof data === 'string') {
    // Mask phone numbers
    if (isValidPhoneNumber(data)) {
      return data.slice(0, 4) + '****' + data.slice(-2);
    }
    // Mask emails
    if (data.includes('@')) {
      const [username, domain] = data.split('@');
      const maskedUsername = username.slice(0, 2) + '***' + username.slice(-1);
      return `${maskedUsername}@${domain}`;
    }
    return data;
  }
  
  if (Array.isArray(data)) {
    return data.map(maskSensitiveData);
  }
  
  if (data && typeof data === 'object') {
    const masked: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (['phone', 'email', 'password'].includes(key.toLowerCase())) {
        masked[key] = maskSensitiveData(value);
      } else {
        masked[key] = value;
      }
    }
    return masked;
  }
  
  return data;
}

/**
 * Create structured log entry
 */
export function createLogEntry(
  requestId: string,
  userId: string,
  userIp: string,
  action: string,
  entity: string,
  entityId: string,
  status: 'success' | 'error',
  latencyMs: number,
  changes?: Record<string, any>
): any {
  return {
    timestamp: new Date().toISOString(),
    requestId,
    userId,
    userIp,
    action,
    entity,
    entityId,
    changes: changes ? maskSensitiveData(changes) : undefined,
    status,
    latencyMs,
  };
}