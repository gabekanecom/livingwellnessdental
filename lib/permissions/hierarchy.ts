import prisma from '@/lib/prisma';

export interface UserHierarchyContext {
  userId: string;
  hierarchyLevel: number;
  dataScope: 'SELF' | 'LOCATION' | 'ALL_LOCATIONS' | 'GLOBAL';
  locationIds: string[];
  canManageUserTypes: string[];
  canManageAtLocations: string[] | 'ALL';
}

export async function getUserHierarchyContext(userId: string): Promise<UserHierarchyContext | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userRoles: {
        where: { isActive: true },
        include: {
          role: {
            include: {
              userType: true
            }
          },
          location: true
        }
      },
      locations: {
        where: { isActive: true },
        select: { locationId: true }
      }
    }
  });

  if (!user || user.userRoles.length === 0) {
    return null;
  }

  const scopePriority: Record<string, number> = {
    SELF: 0,
    LOCATION: 1,
    ALL_LOCATIONS: 2,
    GLOBAL: 3
  };

  let lowestHierarchyLevel = Infinity;
  let highestDataScope: 'SELF' | 'LOCATION' | 'ALL_LOCATIONS' | 'GLOBAL' = 'SELF';
  const locationIds = new Set<string>();

  for (const userRole of user.userRoles) {
    const role = userRole.role;
    const userType = role.userType;

    if (userType.hierarchyLevel < lowestHierarchyLevel) {
      lowestHierarchyLevel = userType.hierarchyLevel;
    }

    if (scopePriority[role.dataScope] > scopePriority[highestDataScope]) {
      highestDataScope = role.dataScope as typeof highestDataScope;
    }

    if (userRole.locationId) {
      locationIds.add(userRole.locationId);
    }
  }

  for (const loc of user.locations) {
    locationIds.add(loc.locationId);
  }

  const allUserTypes = await prisma.userType.findMany({
    where: { isActive: true },
    orderBy: { hierarchyLevel: 'asc' }
  });

  const canManageUserTypes = allUserTypes
    .filter(ut => ut.hierarchyLevel > lowestHierarchyLevel)
    .map(ut => ut.id);

  let canManageAtLocations: string[] | 'ALL' = Array.from(locationIds);
  if (['GLOBAL', 'ALL_LOCATIONS'].includes(highestDataScope)) {
    canManageAtLocations = 'ALL';
  }

  return {
    userId,
    hierarchyLevel: lowestHierarchyLevel,
    dataScope: highestDataScope,
    locationIds: Array.from(locationIds),
    canManageUserTypes,
    canManageAtLocations
  };
}

export async function canUserCreateWithRole(
  creatorContext: UserHierarchyContext,
  targetRoleId: string,
  targetLocationId?: string
): Promise<{ allowed: boolean; reason?: string }> {
  const targetRole = await prisma.role.findUnique({
    where: { id: targetRoleId },
    include: { userType: true }
  });

  if (!targetRole) {
    return { allowed: false, reason: 'Role not found' };
  }

  if (!creatorContext.canManageUserTypes.includes(targetRole.userTypeId)) {
    return {
      allowed: false,
      reason: `You cannot assign roles from user type "${targetRole.userType.name}". You can only manage user types with lower authority than your own.`
    };
  }

  if (targetRole.dataScope === 'LOCATION' && targetLocationId) {
    if (creatorContext.canManageAtLocations !== 'ALL') {
      if (!creatorContext.canManageAtLocations.includes(targetLocationId)) {
        return {
          allowed: false,
          reason: 'You can only assign users to locations you have access to.'
        };
      }
    }
  }

  return { allowed: true };
}

export async function validateUserCreation(
  creatorUserId: string,
  roleAssignments: Array<{ roleId: string; locationId?: string }>,
  locationIds?: string[]
): Promise<{ valid: boolean; errors: string[] }> {
  const creatorContext = await getUserHierarchyContext(creatorUserId);
  
  if (!creatorContext) {
    return {
      valid: false,
      errors: ['Unable to determine your permissions. Please contact an administrator.']
    };
  }

  const errors: string[] = [];

  for (const assignment of roleAssignments) {
    const check = await canUserCreateWithRole(
      creatorContext,
      assignment.roleId,
      assignment.locationId
    );

    if (!check.allowed) {
      errors.push(check.reason || 'Permission denied for role assignment');
    }
  }

  if (locationIds && locationIds.length > 0) {
    if (creatorContext.canManageAtLocations !== 'ALL') {
      for (const locId of locationIds) {
        if (!creatorContext.canManageAtLocations.includes(locId)) {
          errors.push(`You do not have permission to assign users to this location.`);
          break;
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
