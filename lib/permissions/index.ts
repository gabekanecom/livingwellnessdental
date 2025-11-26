import prisma from '@/lib/prisma';

export interface UserPermissions {
  permissions: Set<string>;
  dataScope: string;
  locationIds: string[];
}

const permissionCache = new Map<string, { data: UserPermissions; expiresAt: number }>();
const CACHE_TTL = 5 * 60 * 1000;

export async function getUserPermissions(userId: string): Promise<UserPermissions> {
  const cached = permissionCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userRoles: {
        where: { isActive: true },
        include: {
          role: {
            include: {
              permissions: {
                where: { granted: true },
                include: { permission: true }
              }
            }
          }
        }
      },
      userPermissions: {
        where: {
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        },
        include: { permission: true }
      },
      locations: {
        where: { isActive: true },
        select: { locationId: true }
      }
    }
  });

  if (!user) {
    return { permissions: new Set(), dataScope: 'SELF', locationIds: [] };
  }

  const permissions = new Set<string>();
  let highestScope = 'SELF';
  const scopePriority: Record<string, number> = {
    SELF: 0,
    LOCATION: 1,
    ALL_LOCATIONS: 2,
    GLOBAL: 3
  };

  for (const userRole of user.userRoles) {
    if (scopePriority[userRole.role.dataScope] > scopePriority[highestScope]) {
      highestScope = userRole.role.dataScope;
    }

    for (const rolePerm of userRole.role.permissions) {
      permissions.add(rolePerm.permission.id);
    }
  }

  for (const userPerm of user.userPermissions) {
    if (userPerm.granted) {
      permissions.add(userPerm.permission.id);
    } else {
      permissions.delete(userPerm.permission.id);
    }
  }

  const result: UserPermissions = {
    permissions,
    dataScope: highestScope,
    locationIds: user.locations.map(l => l.locationId)
  };

  permissionCache.set(userId, {
    data: result,
    expiresAt: Date.now() + CACHE_TTL
  });

  return result;
}

export function clearPermissionCache(userId?: string) {
  if (userId) {
    permissionCache.delete(userId);
  } else {
    permissionCache.clear();
  }
}

export async function hasPermission(userId: string, permissionId: string): Promise<boolean> {
  const userPermissions = await getUserPermissions(userId);
  return userPermissions.permissions.has(permissionId);
}

export async function hasAnyPermission(userId: string, permissionIds: string[]): Promise<boolean> {
  const userPermissions = await getUserPermissions(userId);
  return permissionIds.some(id => userPermissions.permissions.has(id));
}

export async function hasAllPermissions(userId: string, permissionIds: string[]): Promise<boolean> {
  const userPermissions = await getUserPermissions(userId);
  return permissionIds.every(id => userPermissions.permissions.has(id));
}

export async function canAccessLocation(userId: string, locationId: string): Promise<boolean> {
  const userPermissions = await getUserPermissions(userId);
  
  if (userPermissions.dataScope === 'GLOBAL' || userPermissions.dataScope === 'ALL_LOCATIONS') {
    return true;
  }
  
  if (userPermissions.dataScope === 'LOCATION') {
    return userPermissions.locationIds.includes(locationId);
  }
  
  return false;
}

export async function getAccessibleLocationIds(userId: string): Promise<string[] | 'all'> {
  const userPermissions = await getUserPermissions(userId);
  
  if (userPermissions.dataScope === 'GLOBAL' || userPermissions.dataScope === 'ALL_LOCATIONS') {
    return 'all';
  }
  
  return userPermissions.locationIds;
}

export function buildLocationFilter(locationIds: string[] | 'all', fieldName: string = 'locationId') {
  if (locationIds === 'all') {
    return {};
  }
  
  return {
    [fieldName]: { in: locationIds }
  };
}
