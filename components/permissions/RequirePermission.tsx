'use client';

import { ReactNode } from 'react';
import { usePermissions } from '@/hooks/usePermissions';

interface RequirePermissionProps {
  children: ReactNode;
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  fallback?: ReactNode;
  showLoading?: boolean;
}

export function RequirePermission({
  children,
  permission,
  permissions = [],
  requireAll = false,
  fallback = null,
  showLoading = false
}: RequirePermissionProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isLoading } = usePermissions();

  if (isLoading) {
    return showLoading ? <div className="animate-pulse bg-gray-200 rounded h-8 w-24" /> : null;
  }

  const permissionList = permission ? [permission, ...permissions] : permissions;

  if (permissionList.length === 0) {
    return <>{children}</>;
  }

  const hasAccess = requireAll
    ? hasAllPermissions(permissionList)
    : hasAnyPermission(permissionList);

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface RequireLocationAccessProps {
  children: ReactNode;
  locationId: string;
  fallback?: ReactNode;
}

export function RequireLocationAccess({
  children,
  locationId,
  fallback = null
}: RequireLocationAccessProps) {
  const { canAccessLocation, isLoading } = usePermissions();

  if (isLoading) {
    return null;
  }

  if (!canAccessLocation(locationId)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
