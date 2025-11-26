import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create a demo user
  const user = await prisma.user.upsert({
    where: { email: 'admin@livingwellness.dental' },
    update: {},
    create: {
      email: 'admin@livingwellness.dental',
      name: 'Admin User',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
    },
  });

  console.log('✅ Created demo user:', user.email);

  // Create categories
  const categories = [
    {
      name: 'Getting Started',
      slug: 'getting-started',
      description: 'Essential information for new team members',
      icon: 'AcademicCapIcon',
      order: 0,
    },
    {
      name: 'Human Resources',
      slug: 'human-resources',
      description: 'HR policies, benefits, and procedures',
      icon: 'UsersIcon',
      order: 1,
    },
    {
      name: 'Clinical Procedures',
      slug: 'clinical-procedures',
      description: 'Medical and clinical guidelines',
      icon: 'HeartIcon',
      order: 2,
    },
    {
      name: 'Operations',
      slug: 'operations',
      description: 'Daily operations and workflows',
      icon: 'CogIcon',
      order: 3,
    },
    {
      name: 'Safety & Compliance',
      slug: 'safety-compliance',
      description: 'Safety protocols and compliance requirements',
      icon: 'ShieldCheckIcon',
      order: 4,
    },
    {
      name: 'Technology',
      slug: 'technology',
      description: 'IT systems and software guides',
      icon: 'ComputerDesktopIcon',
      order: 5,
    },
  ];

  const createdCategories = [];
  for (const category of categories) {
    const created = await prisma.wikiCategory.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
    createdCategories.push(created);
    console.log('✅ Created category:', created.name);
  }

  // Create sample articles
  const articles = [
    {
      title: 'Welcome to Living Wellness Dental',
      slug: 'welcome-to-living-wellness-dental',
      content: `
        <h2>Welcome to Our Team!</h2>
        <p>We're thrilled to have you join Living Wellness Dental. This wiki is your central resource for all training materials, policies, and procedures.</p>

        <h3>Getting Started</h3>
        <p>Here are some key resources to help you get started:</p>
        <ul>
          <li>Review our mission and values</li>
          <li>Complete your onboarding checklist</li>
          <li>Familiarize yourself with our systems</li>
          <li>Meet your team members</li>
        </ul>

        <h3>What You'll Find Here</h3>
        <p>This wiki contains comprehensive documentation on:</p>
        <ul>
          <li>Clinical procedures and protocols</li>
          <li>HR policies and benefits</li>
          <li>Operational workflows</li>
          <li>Safety and compliance guidelines</li>
          <li>Technology systems and tools</li>
        </ul>

        <h3>Need Help?</h3>
        <p>If you can't find what you're looking for, use the search bar in the sidebar or reach out to your supervisor.</p>
      `,
      contentPlain: 'Welcome to Our Team! We\'re thrilled to have you join Living Wellness Dental. This wiki is your central resource for all training materials, policies, and procedures.',
      excerpt: 'Welcome guide for new team members at Living Wellness Dental',
      status: 'PUBLISHED' as const,
      categoryId: createdCategories[0].id,
      authorId: user.id,
      publishedAt: new Date(),
    },
    {
      title: 'Using the Wiki System',
      slug: 'using-the-wiki-system',
      content: `
        <h2>How to Use This Wiki</h2>
        <p>Our wiki is designed to be intuitive and easy to navigate. Here's how to make the most of it.</p>

        <h3>Navigation</h3>
        <p>Use the sidebar to browse categories and find articles. Categories are organized hierarchically for easy navigation.</p>

        <h3>Search</h3>
        <p>The search bar at the top of the sidebar allows you to quickly find articles by keyword. Just type and press Enter.</p>

        <h3>Reading Articles</h3>
        <p>Articles include:</p>
        <ul>
          <li>Estimated reading time</li>
          <li>Last updated date</li>
          <li>Related articles</li>
          <li>Tags for cross-referencing</li>
        </ul>

        <h3>Creating Articles</h3>
        <p>If you have permission to create articles, click the "New Article" button and use our rich text editor to create comprehensive documentation.</p>
      `,
      contentPlain: 'How to Use This Wiki. Our wiki is designed to be intuitive and easy to navigate.',
      excerpt: 'Learn how to navigate and use the wiki system effectively',
      status: 'PUBLISHED' as const,
      categoryId: createdCategories[0].id,
      authorId: user.id,
      publishedAt: new Date(),
    },
    {
      title: 'Employee Handbook Overview',
      slug: 'employee-handbook-overview',
      content: `
        <h2>Employee Handbook</h2>
        <p>This handbook outlines the policies, procedures, and benefits for all Living Wellness Dental employees.</p>

        <h3>Core Values</h3>
        <ul>
          <li><strong>Patient-Centered Care:</strong> Always prioritize patient comfort and well-being</li>
          <li><strong>Excellence:</strong> Maintain the highest standards in everything we do</li>
          <li><strong>Teamwork:</strong> Collaborate and support each other</li>
          <li><strong>Integrity:</strong> Act ethically and transparently</li>
          <li><strong>Innovation:</strong> Embrace new technologies and methods</li>
        </ul>

        <h3>Working Hours</h3>
        <p>Standard office hours are Monday through Friday, 8:00 AM to 5:00 PM. Specific schedules vary by role and will be discussed during your orientation.</p>

        <h3>Benefits</h3>
        <p>We offer comprehensive benefits including health insurance, dental coverage, retirement plans, and professional development opportunities.</p>
      `,
      contentPlain: 'Employee Handbook. This handbook outlines the policies, procedures, and benefits for all Living Wellness Dental employees.',
      excerpt: 'Overview of employment policies, values, and benefits',
      status: 'PUBLISHED' as const,
      categoryId: createdCategories[1].id,
      authorId: user.id,
      publishedAt: new Date(),
    },
    {
      title: 'Infection Control Protocols',
      slug: 'infection-control-protocols',
      content: `
        <h2>Infection Control Protocols</h2>
        <p>Maintaining a sterile environment is critical to patient safety and regulatory compliance.</p>

        <h3>Hand Hygiene</h3>
        <p>Proper hand hygiene is the single most important measure to prevent the spread of infection:</p>
        <ul>
          <li>Wash hands before and after patient contact</li>
          <li>Use alcohol-based hand sanitizer when soap is not available</li>
          <li>Wash for at least 20 seconds with proper technique</li>
        </ul>

        <h3>Personal Protective Equipment (PPE)</h3>
        <p>Always wear appropriate PPE:</p>
        <ul>
          <li>Gloves for all patient contact</li>
          <li>Masks and eye protection during procedures</li>
          <li>Gowns when splatter is expected</li>
        </ul>

        <h3>Sterilization</h3>
        <p>All instruments must be properly sterilized using approved autoclaves. Follow manufacturer guidelines and document all sterilization cycles.</p>

        <h3>Environmental Cleaning</h3>
        <p>Treatment rooms must be thoroughly cleaned and disinfected between patients using EPA-approved disinfectants.</p>
      `,
      contentPlain: 'Infection Control Protocols. Maintaining a sterile environment is critical to patient safety and regulatory compliance.',
      excerpt: 'Essential infection control and sterilization procedures',
      status: 'PUBLISHED' as const,
      categoryId: createdCategories[4].id,
      authorId: user.id,
      publishedAt: new Date(),
    },
  ];

  for (const article of articles) {
    const created = await prisma.wikiArticle.upsert({
      where: { slug: article.slug },
      update: {},
      create: article,
    });

    // Create initial version
    await prisma.wikiArticleVersion.create({
      data: {
        articleId: created.id,
        title: created.title,
        content: created.content,
        authorId: user.id,
      },
    });

    console.log('✅ Created article:', created.title);
  }

  // Create some tags
  const tags = [
    { name: 'Onboarding', slug: 'onboarding' },
    { name: 'Training', slug: 'training' },
    { name: 'Safety', slug: 'safety' },
    { name: 'Quick Reference', slug: 'quick-reference' },
  ];

  for (const tag of tags) {
    await prisma.wikiTag.upsert({
      where: { slug: tag.slug },
      update: {},
      create: tag,
    });
    console.log('✅ Created tag:', tag.name);
  }

  // Create User Types
  const userTypes = [
    { id: 'super_admin', name: 'Super Admin', description: 'Full system access across all locations', displayOrder: 0 },
    { id: 'corporate', name: 'Corporate Staff', description: 'Corporate-level access (HR, Finance, Operations)', displayOrder: 1 },
    { id: 'location_staff', name: 'Location Staff', description: 'Staff assigned to specific dental locations', displayOrder: 2 },
  ];

  for (const type of userTypes) {
    await prisma.userType.upsert({
      where: { id: type.id },
      update: {},
      create: type,
    });
    console.log('✅ Created user type:', type.name);
  }

  // Create Roles
  const roles = [
    { id: 'super_admin', name: 'Super Administrator', userTypeId: 'super_admin', dataScope: 'GLOBAL' as const, isProtected: true, displayOrder: 0 },
    { id: 'corporate_admin', name: 'Corporate Admin', userTypeId: 'corporate', dataScope: 'ALL_LOCATIONS' as const, displayOrder: 0 },
    { id: 'hr_manager', name: 'HR Manager', userTypeId: 'corporate', dataScope: 'ALL_LOCATIONS' as const, displayOrder: 1 },
    { id: 'finance_manager', name: 'Finance Manager', userTypeId: 'corporate', dataScope: 'ALL_LOCATIONS' as const, displayOrder: 2 },
    { id: 'operations_manager', name: 'Operations Manager', userTypeId: 'corporate', dataScope: 'ALL_LOCATIONS' as const, displayOrder: 3 },
    { id: 'practice_manager', name: 'Practice Manager', userTypeId: 'location_staff', dataScope: 'LOCATION' as const, displayOrder: 0 },
    { id: 'dentist', name: 'Dentist', userTypeId: 'location_staff', dataScope: 'LOCATION' as const, displayOrder: 1 },
    { id: 'hygienist', name: 'Hygienist', userTypeId: 'location_staff', dataScope: 'LOCATION' as const, displayOrder: 2 },
    { id: 'dental_assistant', name: 'Dental Assistant', userTypeId: 'location_staff', dataScope: 'LOCATION' as const, displayOrder: 3 },
    { id: 'front_desk', name: 'Front Desk', userTypeId: 'location_staff', dataScope: 'LOCATION' as const, isDefault: true, displayOrder: 4 },
    { id: 'office_manager', name: 'Office Manager', userTypeId: 'location_staff', dataScope: 'LOCATION' as const, displayOrder: 5 },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { id: role.id },
      update: {},
      create: role,
    });
    console.log('✅ Created role:', role.name);
  }

  // Create Permissions
  const permissions = [
    // Users
    { id: 'users.view', name: 'View Users', category: 'Users' },
    { id: 'users.create', name: 'Create Users', category: 'Users' },
    { id: 'users.edit', name: 'Edit Users', category: 'Users' },
    { id: 'users.delete', name: 'Delete Users', category: 'Users' },
    { id: 'users.assign_roles', name: 'Assign Roles', category: 'Users' },
    // Locations
    { id: 'locations.view', name: 'View Locations', category: 'Locations' },
    { id: 'locations.create', name: 'Create Locations', category: 'Locations' },
    { id: 'locations.edit', name: 'Edit Locations', category: 'Locations' },
    { id: 'locations.delete', name: 'Delete Locations', category: 'Locations' },
    // Courses
    { id: 'courses.view', name: 'View Courses', category: 'Courses' },
    { id: 'courses.create', name: 'Create Courses', category: 'Courses' },
    { id: 'courses.edit', name: 'Edit Courses', category: 'Courses' },
    { id: 'courses.delete', name: 'Delete Courses', category: 'Courses' },
    { id: 'courses.enroll', name: 'Enroll in Courses', category: 'Courses' },
    // Wiki
    { id: 'wiki.view', name: 'View Wiki Articles', category: 'Wiki' },
    { id: 'wiki.create', name: 'Create Wiki Articles', category: 'Wiki' },
    { id: 'wiki.edit', name: 'Edit Wiki Articles', category: 'Wiki' },
    { id: 'wiki.delete', name: 'Delete Wiki Articles', category: 'Wiki' },
    // Reports
    { id: 'reports.view', name: 'View Reports', category: 'Reports' },
    { id: 'reports.export', name: 'Export Reports', category: 'Reports' },
    // Admin
    { id: 'admin.access', name: 'Access Admin Panel', category: 'Admin' },
    { id: 'admin.manage_roles', name: 'Manage Roles & Permissions', category: 'Admin' },
    { id: 'admin.manage_settings', name: 'Manage System Settings', category: 'Admin' },
  ];

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { id: permission.id },
      update: {},
      create: permission,
    });
    console.log('✅ Created permission:', permission.name);
  }

  // Assign all permissions to super_admin role
  const allPermissions = await prisma.permission.findMany();
  for (const permission of allPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: 'super_admin', permissionId: permission.id } },
      update: {},
      create: { roleId: 'super_admin', permissionId: permission.id, granted: true },
    });
  }
  console.log('✅ Assigned all permissions to Super Admin role');

  // Create sample locations
  const locations = [
    { code: 'NYC01', name: 'Manhattan Office', city: 'New York', state: 'NY', address: '123 Main Street', zipCode: '10001', phone: '(212) 555-0100' },
    { code: 'NYC02', name: 'Brooklyn Office', city: 'Brooklyn', state: 'NY', address: '456 Park Avenue', zipCode: '11201', phone: '(718) 555-0200' },
    { code: 'LA01', name: 'Los Angeles Office', city: 'Los Angeles', state: 'CA', address: '789 Sunset Blvd', zipCode: '90001', phone: '(310) 555-0300' },
  ];

  for (const location of locations) {
    await prisma.location.upsert({
      where: { code: location.code },
      update: {},
      create: location,
    });
    console.log('✅ Created location:', location.name);
  }

  // Assign super admin role to admin user
  const superAdminRole = await prisma.role.findUnique({ where: { id: 'super_admin' } });
  if (superAdminRole) {
    const existingUserRole = await prisma.userRole.findFirst({
      where: { userId: user.id, roleId: 'super_admin', locationId: null }
    });
    if (!existingUserRole) {
      await prisma.userRole.create({
        data: { userId: user.id, roleId: 'super_admin' },
      });
    }
    console.log('✅ Assigned Super Admin role to admin user');
  }

  console.log('🎉 Seeding completed successfully!');

  await prisma.$disconnect();
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  });
