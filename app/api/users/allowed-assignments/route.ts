import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { getUserHierarchyContext } from '@/lib/permissions/hierarchy';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const context = await getUserHierarchyContext(currentUser.id);

    if (!context) {
      return NextResponse.json({
        userTypes: [],
        roles: [],
        locations: [],
        hierarchyLevel: null,
        dataScope: null
      });
    }

    const allowedUserTypes = await prisma.userType.findMany({
      where: {
        id: { in: context.canManageUserTypes },
        isActive: true
      },
      orderBy: { hierarchyLevel: 'asc' }
    });

    const allowedRoles = await prisma.role.findMany({
      where: {
        userTypeId: { in: context.canManageUserTypes },
        isActive: true
      },
      include: {
        userType: true
      },
      orderBy: [
        { userType: { hierarchyLevel: 'asc' } },
        { displayOrder: 'asc' }
      ]
    });

    let allowedLocations;
    if (context.canManageAtLocations === 'ALL') {
      allowedLocations = await prisma.location.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' }
      });
    } else {
      allowedLocations = await prisma.location.findMany({
        where: {
          id: { in: context.canManageAtLocations },
          isActive: true
        },
        orderBy: { name: 'asc' }
      });
    }

    return NextResponse.json({
      userTypes: allowedUserTypes,
      roles: allowedRoles,
      locations: allowedLocations,
      hierarchyLevel: context.hierarchyLevel,
      dataScope: context.dataScope,
      canManageAllLocations: context.canManageAtLocations === 'ALL'
    });
  } catch (error) {
    console.error('Error fetching allowed assignments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch allowed assignments' },
      { status: 500 }
    );
  }
}
