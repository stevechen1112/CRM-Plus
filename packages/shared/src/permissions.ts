import { UserRole } from './types';

/**
 * Feature-level permissions mapping
 * Maps permission keys to allowed roles
 */
export const PERMISSIONS = {
  // Customer management
  'customers.view': ['ADMIN', 'MANAGER', 'STAFF'] as UserRole[],
  'customers.create': ['ADMIN', 'MANAGER', 'STAFF'] as UserRole[],
  'customers.edit': ['ADMIN', 'MANAGER', 'STAFF'] as UserRole[],
  'customers.delete': ['ADMIN', 'MANAGER'] as UserRole[],
  'customers.merge': ['ADMIN', 'MANAGER'] as UserRole[],
  'customers.export': ['ADMIN', 'MANAGER'] as UserRole[],
  
  // Order management
  'orders.view': ['ADMIN', 'MANAGER', 'STAFF'] as UserRole[],
  'orders.create': ['ADMIN', 'MANAGER', 'STAFF'] as UserRole[],
  'orders.edit': ['ADMIN', 'MANAGER', 'STAFF'] as UserRole[],
  'orders.update': ['ADMIN', 'MANAGER', 'STAFF'] as UserRole[],
  'orders.delete': ['ADMIN', 'MANAGER'] as UserRole[],
  'orders.import': ['ADMIN', 'MANAGER'] as UserRole[],
  'orders.export': ['ADMIN', 'MANAGER'] as UserRole[],
  
  // Task management
  'tasks.view': ['ADMIN', 'MANAGER', 'STAFF'] as UserRole[],
  'tasks.create': ['ADMIN', 'MANAGER', 'STAFF'] as UserRole[],
  'tasks.edit': ['ADMIN', 'MANAGER', 'STAFF'] as UserRole[],
  'tasks.assign': ['ADMIN', 'MANAGER'] as UserRole[],
  'tasks.delete': ['ADMIN', 'MANAGER'] as UserRole[],
  'tasks.complete': ['ADMIN', 'MANAGER', 'STAFF'] as UserRole[],
  'tasks.defer': ['ADMIN', 'MANAGER', 'STAFF'] as UserRole[],
  
  // Interaction management
  'interactions.view': ['ADMIN', 'MANAGER', 'STAFF'] as UserRole[],
  'interactions.create': ['ADMIN', 'MANAGER', 'STAFF'] as UserRole[],
  'interactions.edit': ['ADMIN', 'MANAGER', 'STAFF'] as UserRole[],
  'interactions.delete': ['ADMIN', 'MANAGER'] as UserRole[],
  'interactions.export': ['ADMIN', 'MANAGER'] as UserRole[],
  
  // Import/Export
  'import.export': ['ADMIN', 'MANAGER'] as UserRole[],
  
  // Reports and analytics
  'reports.view': ['ADMIN', 'MANAGER'] as UserRole[],
  'analytics.view': ['ADMIN', 'MANAGER'] as UserRole[],
  
  // Audit logs
  'audit.view': ['ADMIN', 'MANAGER'] as UserRole[],
  'audit.export': ['ADMIN'] as UserRole[],
  
  // User management
  'users.view': ['ADMIN'] as UserRole[],
  'users.manage': ['ADMIN'] as UserRole[],
  'users.create': ['ADMIN'] as UserRole[],
  'users.edit': ['ADMIN'] as UserRole[],
  'users.delete': ['ADMIN'] as UserRole[],
  'users.reset_password': ['ADMIN'] as UserRole[],
  'users.revoke_sessions': ['ADMIN'] as UserRole[],
  
  // System settings
  'settings.view': ['ADMIN'] as UserRole[],
  'settings.edit': ['ADMIN'] as UserRole[],
  
  // Dashboard
  'dashboard.view': ['ADMIN', 'MANAGER', 'STAFF'] as UserRole[],
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;

/**
 * Check if a user role has permission for a specific feature
 */
export const hasPermission = (userRole: UserRole | null, permissionKey: PermissionKey): boolean => {
  if (!userRole) return false;
  
  const allowedRoles = PERMISSIONS[permissionKey];
  return allowedRoles.includes(userRole);
};

/**
 * Get all permission keys for a specific role
 */
export const getPermissionsForRole = (userRole: UserRole): PermissionKey[] => {
  return (Object.keys(PERMISSIONS) as PermissionKey[]).filter(
    key => PERMISSIONS[key].includes(userRole)
  );
};

/**
 * Check if a user role has any of the specified permissions
 */
export const hasAnyPermission = (userRole: UserRole | null, permissionKeys: PermissionKey[]): boolean => {
  if (!userRole) return false;
  
  return permissionKeys.some(key => hasPermission(userRole, key));
};

/**
 * Check if a user role has all of the specified permissions
 */
export const hasAllPermissions = (userRole: UserRole | null, permissionKeys: PermissionKey[]): boolean => {
  if (!userRole) return false;
  
  return permissionKeys.every(key => hasPermission(userRole, key));
};