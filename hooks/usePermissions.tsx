'use client';

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';

interface PermissionState {
  permissions: string[];
  dataScope: string;
  locationIds: string[];
  isLoading: boolean;
  error: string | null;
}

interface PermissionContextValue extends PermissionState {
  hasPermission: (permissionId: string) => boolean;
  hasAnyPermission: (permissionIds: string[]) => boolean;
  hasAllPermissions: (permissionIds: string[]) => boolean;
  canAccessLocation: (locationId: string) => boolean;
  refreshPermissions: () => Promise<void>;
}

const PermissionContext = createContext<PermissionContextValue | null>(null);

interface PermissionProviderProps {
  children: ReactNode;
  userId?: string;
}

export function PermissionProvider({ children, userId }: PermissionProviderProps) {
  const [state, setState] = useState<PermissionState>({
    permissions: [],
    dataScope: 'SELF',
    locationIds: [],
    isLoading: true,
    error: null
  });

  const fetchPermissions = useCallback(async () => {
    if (!userId) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch permissions');

      const { user } = await response.json();

      const permissions = new Set<string>();
      let highestScope = 'SELF';
      const scopePriority: Record<string, number> = {
        SELF: 0,
        LOCATION: 1,
        ALL_LOCATIONS: 2,
        GLOBAL: 3
      };

      for (const userRole of user.userRoles || []) {
        if (userRole.role && scopePriority[userRole.role.dataScope] > scopePriority[highestScope]) {
          highestScope = userRole.role.dataScope;
        }
      }

      for (const userPerm of user.userPermissions || []) {
        if (userPerm.granted) {
          permissions.add(userPerm.permission.id);
        }
      }

      setState({
        permissions: Array.from(permissions),
        dataScope: highestScope,
        locationIds: (user.locations || []).map((l: any) => l.location.id),
        isLoading: false,
        error: null
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }, [userId]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const hasPermission = useCallback((permissionId: string) => {
    return state.permissions.includes(permissionId);
  }, [state.permissions]);

  const hasAnyPermission = useCallback((permissionIds: string[]) => {
    return permissionIds.some(id => state.permissions.includes(id));
  }, [state.permissions]);

  const hasAllPermissions = useCallback((permissionIds: string[]) => {
    return permissionIds.every(id => state.permissions.includes(id));
  }, [state.permissions]);

  const canAccessLocation = useCallback((locationId: string) => {
    if (state.dataScope === 'GLOBAL' || state.dataScope === 'ALL_LOCATIONS') {
      return true;
    }
    if (state.dataScope === 'LOCATION') {
      return state.locationIds.includes(locationId);
    }
    return false;
  }, [state.dataScope, state.locationIds]);

  const value: PermissionContextValue = {
    ...state,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccessLocation,
    refreshPermissions: fetchPermissions
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
}

export function useHasPermission(permissionId: string): boolean {
  const { hasPermission, isLoading } = usePermissions();
  return !isLoading && hasPermission(permissionId);
}

export function useCanAccessLocation(locationId: string): boolean {
  const { canAccessLocation, isLoading } = usePermissions();
  return !isLoading && canAccessLocation(locationId);
}
