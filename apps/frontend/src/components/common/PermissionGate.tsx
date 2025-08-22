import React from 'react';
import { UserRole, PermissionKey } from '@crm/shared';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';

interface PermissionGateProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  requiredPermissions?: PermissionKey[];
  fallback?: React.ReactNode;
  adminOnly?: boolean;
  managerOnly?: boolean;
  staffOnly?: boolean;
  hideWhenNoPermission?: boolean;
}

/**
 * PermissionGate component for conditional rendering based on user roles and feature-level permissions
 * 
 * @param children - Content to render when user has permission
 * @param requiredRoles - Array of roles that can access the content
 * @param requiredPermissions - Array of feature permissions that can access the content
 * @param fallback - Content to render when user doesn't have permission
 * @param adminOnly - Shorthand for requiring ADMIN role
 * @param managerOnly - Shorthand for requiring MANAGER role  
 * @param staffOnly - Shorthand for requiring STAFF role
 * @param hideWhenNoPermission - If true, renders nothing when no permission (ignores fallback)
 */
const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  requiredRoles = [],
  requiredPermissions = [],
  fallback = null,
  adminOnly = false,
  managerOnly = false,
  staffOnly = false,
  hideWhenNoPermission = false,
}) => {
  const { user, hasRole } = useAuth();
  const { canAny } = usePermissions();

  // If no user is logged in, don't render anything
  if (!user) {
    return hideWhenNoPermission ? null : <>{fallback}</>;
  }

  let hasPermission = false;

  // Check feature-level permissions first (takes precedence)
  if (requiredPermissions.length > 0) {
    hasPermission = canAny(requiredPermissions);
  } else {
    // Fallback to role-based permissions
    let roles: UserRole[] = [...requiredRoles];

    if (adminOnly) {
      roles = ['ADMIN'];
    } else if (managerOnly) {
      roles = ['MANAGER'];
    } else if (staffOnly) {
      roles = ['STAFF'];
    }

    // If no roles specified, allow all authenticated users
    if (roles.length === 0) {
      hasPermission = true;
    } else {
      hasPermission = hasRole(roles);
    }
  }

  if (hasPermission) {
    return <>{children}</>;
  }

  // No permission
  return hideWhenNoPermission ? null : <>{fallback}</>;
};

export default PermissionGate;