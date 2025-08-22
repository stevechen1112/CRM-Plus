import { useAuth } from './useAuth';
import { UserRole, PermissionKey, hasPermission, hasAnyPermission, hasAllPermissions } from '@crm/shared';

/**
 * Custom hook for role-based permission checking
 */
export const usePermissions = () => {
  const { user, hasRole, isAdmin, isManager, isStaff } = useAuth();

  // Feature-level permission checking
  const can = (permissionKey: PermissionKey): boolean => {
    return hasPermission(user?.role || null, permissionKey);
  };

  const canAny = (permissionKeys: PermissionKey[]): boolean => {
    return hasAnyPermission(user?.role || null, permissionKeys);
  };

  const canAll = (permissionKeys: PermissionKey[]): boolean => {
    return hasAllPermissions(user?.role || null, permissionKeys);
  };

  // Check if user can access customer management features
  const canManageCustomers = () => hasRole(['ADMIN', 'MANAGER', 'STAFF']);
  
  // Check if user can view customer details
  const canViewCustomers = () => hasRole(['ADMIN', 'MANAGER', 'STAFF']);
  
  // Check if user can edit customers
  const canEditCustomers = () => hasRole(['ADMIN', 'MANAGER', 'STAFF']);
  
  // Check if user can delete customers
  const canDeleteCustomers = () => hasRole(['ADMIN', 'MANAGER']);
  
  // Check if user can merge customers
  const canMergeCustomers = () => hasRole(['ADMIN', 'MANAGER']);

  // Check if user can access statistics and reports
  const canViewReports = () => hasRole(['ADMIN', 'MANAGER']);
  
  // Check if user can access import/export features
  const canImportExport = () => hasRole(['ADMIN', 'MANAGER']);
  
  // Check if user can manage other users
  const canManageUsers = () => isAdmin();
  
  // Check if user can view audit logs
  const canViewAuditLogs = () => hasRole(['ADMIN', 'MANAGER']);
  
  // Check if user can access system settings
  const canManageSettings = () => isAdmin();
  
  // Check if user can manage tasks
  const canManageTasks = () => hasRole(['ADMIN', 'MANAGER', 'STAFF']);
  
  // Check if user can assign tasks to others
  const canAssignTasks = () => hasRole(['ADMIN', 'MANAGER']);

  // Get role display name
  const getRoleDisplayName = () => {
    if (!user) return '';
    
    switch (user.role) {
      case 'ADMIN':
        return '管理員';
      case 'MANAGER':
        return '經理';
      case 'STAFF':
        return '職員';
      default:
        return user.role;
    }
  };

  // Check if current user can perform actions on another user
  const canActOnUser = (targetUserRole: UserRole) => {
    if (!user) return false;
    
    // Admin can act on anyone
    if (isAdmin()) return true;
    
    // Manager can act on staff but not other managers or admins
    if (isManager() && targetUserRole === 'STAFF') return true;
    
    // Staff can't act on anyone else
    return false;
  };

  return {
    user,
    hasRole,
    isAdmin,
    isManager,
    isStaff,
    // Feature-level permissions
    can,
    canAny,
    canAll,
    // Legacy permission methods (kept for backward compatibility)
    canManageCustomers,
    canViewCustomers,
    canEditCustomers,
    canDeleteCustomers,
    canMergeCustomers,
    canViewReports,
    canImportExport,
    canManageUsers,
    canViewAuditLogs,
    canManageSettings,
    canManageTasks,
    canAssignTasks,
    getRoleDisplayName,
    canActOnUser,
  };
};