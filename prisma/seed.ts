import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create a demo user with fixed UUID (for seeding only - real users come from Supabase Auth)
  const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';
  const DEMO_USER_EMAIL = 'demo.admin@livingwellness.dental';

  // First, check if a user with the demo email already exists and update it, or create new
  let user = await prisma.user.findUnique({ where: { email: DEMO_USER_EMAIL } });
  if (!user) {
    user = await prisma.user.findUnique({ where: { id: DEMO_USER_ID } });
  }

  if (user) {
    // Update existing user
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: 'Demo Admin',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
      },
    });
  } else {
    // Create new demo user
    user = await prisma.user.create({
      data: {
        id: DEMO_USER_ID,
        email: DEMO_USER_EMAIL,
        name: 'Demo Admin',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
      },
    });
  }

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
      authorId: user.id,
      publishedAt: new Date(),
      _categoryIndex: 0,
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
      authorId: user.id,
      publishedAt: new Date(),
      _categoryIndex: 0,
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
      authorId: user.id,
      publishedAt: new Date(),
      _categoryIndex: 1,
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
      authorId: user.id,
      publishedAt: new Date(),
      _categoryIndex: 4,
    },
  ];

  for (const article of articles) {
    // Extract category index and remove it from article data
    const { _categoryIndex, ...articleData } = article;

    const created = await prisma.wikiArticle.upsert({
      where: { slug: articleData.slug },
      update: {},
      create: articleData,
    });

    // Create category relationship
    if (_categoryIndex !== undefined && createdCategories[_categoryIndex]) {
      await prisma.wikiArticleCategory.upsert({
        where: {
          articleId_categoryId: {
            articleId: created.id,
            categoryId: createdCategories[_categoryIndex].id,
          },
        },
        update: {},
        create: {
          articleId: created.id,
          categoryId: createdCategories[_categoryIndex].id,
        },
      });
    }

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
    { id: 'super_admin', name: 'Super Admin', description: 'Full system access across all locations', hierarchyLevel: 0 },
    { id: 'corporate', name: 'Corporate Staff', description: 'Corporate-level access (HR, Finance, Operations)', hierarchyLevel: 1 },
    { id: 'location_staff', name: 'Location Staff', description: 'Staff assigned to specific dental locations', hierarchyLevel: 2 },
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
    { id: 'wiki.submit_for_review', name: 'Submit Articles for Review', category: 'Wiki' },
    { id: 'wiki.view_review_queue', name: 'View Review Queue', category: 'Wiki' },
    { id: 'wiki.review_articles', name: 'Review and Approve/Reject Articles', category: 'Wiki' },
    { id: 'wiki.publish_directly', name: 'Publish Articles Directly (Skip Review)', category: 'Wiki' },
    { id: 'wiki.assign_reviewers', name: 'Assign Reviewers to Articles', category: 'Wiki' },
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

  // Assign wiki review permissions to Corporate Admin
  const corporateAdminWikiPermissions = [
    'wiki.view', 'wiki.create', 'wiki.edit', 'wiki.delete', 'wiki.submit_for_review',
    'wiki.view_review_queue', 'wiki.review_articles', 'wiki.publish_directly', 'wiki.assign_reviewers'
  ];
  for (const permId of corporateAdminWikiPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: 'corporate_admin', permissionId: permId } },
      update: {},
      create: { roleId: 'corporate_admin', permissionId: permId, granted: true },
    });
  }
  console.log('✅ Assigned wiki permissions to Corporate Admin role');

  // Assign wiki review permissions to Practice Manager (can review but not publish directly)
  const practiceManagerWikiPermissions = [
    'wiki.view', 'wiki.create', 'wiki.edit', 'wiki.submit_for_review',
    'wiki.view_review_queue', 'wiki.review_articles'
  ];
  for (const permId of practiceManagerWikiPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: 'practice_manager', permissionId: permId } },
      update: {},
      create: { roleId: 'practice_manager', permissionId: permId, granted: true },
    });
  }
  console.log('✅ Assigned wiki permissions to Practice Manager role');

  // Assign basic wiki permissions to all location staff roles (can create/edit and submit for review)
  const locationStaffRoles = ['dentist', 'hygienist', 'dental_assistant', 'front_desk', 'office_manager'];
  const staffWikiPermissions = ['wiki.view', 'wiki.create', 'wiki.edit', 'wiki.submit_for_review'];
  for (const roleId of locationStaffRoles) {
    for (const permId of staffWikiPermissions) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId, permissionId: permId } },
        update: {},
        create: { roleId, permissionId: permId, granted: true },
      });
    }
  }
  console.log('✅ Assigned wiki permissions to location staff roles');

  // Create production locations (Northland and Dorchester)
  const locations = [
    { id: 'loc_northland', name: 'Northland', city: 'Columbus', state: 'OH', address: '1234 Northland Blvd', zipCode: '43229', phone: '(614) 555-0100' },
    { id: 'loc_dorchester', name: 'Dorchester', city: 'Columbus', state: 'OH', address: '5678 Dorchester Way', zipCode: '43214', phone: '(614) 555-0200' },
  ];

  for (const location of locations) {
    await prisma.location.upsert({
      where: { id: location.id },
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

  // Create Course Categories
  const courseCategories = [
    { name: 'Compliance', slug: 'compliance', description: 'Regulatory compliance and safety training', color: '#EF4444' },
    { name: 'Clinical Skills', slug: 'clinical-skills', description: 'Clinical procedures and patient care', color: '#10B981' },
    { name: 'Professional Development', slug: 'professional-development', description: 'Career growth and soft skills', color: '#8B5CF6' },
    { name: 'Onboarding', slug: 'onboarding', description: 'New employee orientation', color: '#F59E0B' },
  ];

  const createdCourseCategories: Record<string, string> = {};
  for (const category of courseCategories) {
    const created = await prisma.courseCategory.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
    createdCourseCategories[category.slug] = created.id;
    console.log('✅ Created course category:', created.name);
  }

  // Create Demo Course 1: HIPAA Compliance Training
  const hipaaCourse = await prisma.course.upsert({
    where: { slug: 'hipaa-compliance-training' },
    update: {},
    create: {
      title: 'HIPAA Compliance Training',
      slug: 'hipaa-compliance-training',
      description: 'This comprehensive course covers all aspects of HIPAA compliance for healthcare professionals. Learn about patient privacy rights, protected health information (PHI), and your responsibilities as a healthcare worker.',
      shortDescription: 'Essential HIPAA training for all healthcare staff',
      difficulty: 'BEGINNER',
      duration: 90,
      learningObjectives: [
        'Understand the basics of HIPAA regulations',
        'Identify protected health information (PHI)',
        'Apply privacy and security rules in daily work',
        'Recognize and report potential HIPAA violations'
      ],
      tags: ['compliance', 'hipaa', 'privacy', 'required'],
      categoryId: createdCourseCategories['compliance'],
      isPublished: true,
      isFeatured: true,
      createdById: user.id,
    },
  });
  console.log('✅ Created course:', hipaaCourse.title);

  // HIPAA Course - Module 1
  const hipaaModule1 = await prisma.courseModule.create({
    data: {
      title: 'Introduction to HIPAA',
      description: 'Overview of HIPAA regulations and why they matter',
      order: 1,
      courseId: hipaaCourse.id,
    },
  });

  // Module 1 Lessons
  const hipaaLesson1 = await prisma.lesson.create({
    data: {
      title: 'What is HIPAA?',
      content: `
        <h2>Understanding HIPAA</h2>
        <p>The Health Insurance Portability and Accountability Act (HIPAA) was enacted in 1996 to protect sensitive patient health information.</p>
        
        <h3>Key Components of HIPAA</h3>
        <ul>
          <li><strong>Privacy Rule:</strong> Establishes national standards for the protection of health information</li>
          <li><strong>Security Rule:</strong> Sets standards for protecting electronic health information</li>
          <li><strong>Breach Notification Rule:</strong> Requires notification following a breach of unsecured PHI</li>
        </ul>
        
        <h3>Why HIPAA Matters</h3>
        <p>HIPAA protects patients' fundamental right to privacy. When patients share personal health information with healthcare providers, they trust that this information will be kept confidential.</p>
        
        <p>Violations of HIPAA can result in:</p>
        <ul>
          <li>Civil penalties up to $50,000 per violation</li>
          <li>Criminal penalties including fines and imprisonment</li>
          <li>Loss of patient trust</li>
          <li>Damage to organizational reputation</li>
        </ul>
      `,
      lessonType: 'TEXT',
      duration: 15,
      order: 1,
      moduleId: hipaaModule1.id,
    },
  });

  const hipaaLesson2 = await prisma.lesson.create({
    data: {
      title: 'Protected Health Information (PHI)',
      content: `
        <h2>What is PHI?</h2>
        <p>Protected Health Information (PHI) is any information about health status, provision of health care, or payment for health care that can be linked to a specific individual.</p>
        
        <h3>18 HIPAA Identifiers</h3>
        <p>The following identifiers are considered PHI when combined with health information:</p>
        <ol>
          <li>Names</li>
          <li>Geographic data smaller than a state</li>
          <li>Dates (except year) related to an individual</li>
          <li>Phone numbers</li>
          <li>Fax numbers</li>
          <li>Email addresses</li>
          <li>Social Security numbers</li>
          <li>Medical record numbers</li>
          <li>Health plan beneficiary numbers</li>
          <li>Account numbers</li>
          <li>Certificate/license numbers</li>
          <li>Vehicle identifiers and serial numbers</li>
          <li>Device identifiers and serial numbers</li>
          <li>Web URLs</li>
          <li>IP addresses</li>
          <li>Biometric identifiers</li>
          <li>Full-face photographs</li>
          <li>Any other unique identifying number or code</li>
        </ol>
      `,
      lessonType: 'TEXT',
      duration: 20,
      order: 2,
      moduleId: hipaaModule1.id,
    },
  });

  // Module 1 Quiz
  const hipaaQuizLesson = await prisma.lesson.create({
    data: {
      title: 'Module 1 Quiz: HIPAA Basics',
      content: 'Test your knowledge of HIPAA fundamentals',
      lessonType: 'QUIZ',
      duration: 10,
      order: 3,
      moduleId: hipaaModule1.id,
    },
  });

  const hipaaQuiz1 = await prisma.quiz.create({
    data: {
      title: 'HIPAA Basics Quiz',
      description: 'Test your understanding of HIPAA fundamentals',
      lessonId: hipaaQuizLesson.id,
      passingScore: 70,
      timeLimit: 15,
    },
  });

  // Quiz Questions
  const q1 = await prisma.quizQuestion.create({
    data: {
      quizId: hipaaQuiz1.id,
      question: 'When was HIPAA enacted?',
      questionType: 'MULTIPLE_CHOICE',
      order: 1,
      points: 1,
      explanation: 'HIPAA was enacted in 1996 to protect patient health information.',
    },
  });
  await prisma.quizAnswer.createMany({
    data: [
      { questionId: q1.id, text: '1996', isCorrect: true, order: 1 },
      { questionId: q1.id, text: '2000', isCorrect: false, order: 2 },
      { questionId: q1.id, text: '1990', isCorrect: false, order: 3 },
      { questionId: q1.id, text: '2005', isCorrect: false, order: 4 },
    ],
  });

  const q2 = await prisma.quizQuestion.create({
    data: {
      quizId: hipaaQuiz1.id,
      question: 'Which of the following is considered PHI?',
      questionType: 'MULTIPLE_CHOICE',
      order: 2,
      points: 1,
      explanation: 'A patient\'s name combined with their diagnosis is PHI because it links health information to an identifiable individual.',
    },
  });
  await prisma.quizAnswer.createMany({
    data: [
      { questionId: q2.id, text: 'A patient\'s name combined with their diagnosis', isCorrect: true, order: 1 },
      { questionId: q2.id, text: 'General health statistics', isCorrect: false, order: 2 },
      { questionId: q2.id, text: 'De-identified medical research data', isCorrect: false, order: 3 },
      { questionId: q2.id, text: 'Published medical journal articles', isCorrect: false, order: 4 },
    ],
  });

  const q3 = await prisma.quizQuestion.create({
    data: {
      quizId: hipaaQuiz1.id,
      question: 'HIPAA violations can result in criminal penalties.',
      questionType: 'TRUE_FALSE',
      order: 3,
      points: 1,
      explanation: 'Yes, serious HIPAA violations can result in criminal penalties including fines and imprisonment.',
    },
  });
  await prisma.quizAnswer.createMany({
    data: [
      { questionId: q3.id, text: 'True', isCorrect: true, order: 1 },
      { questionId: q3.id, text: 'False', isCorrect: false, order: 2 },
    ],
  });

  // HIPAA Course - Module 2
  const hipaaModule2 = await prisma.courseModule.create({
    data: {
      title: 'HIPAA in Practice',
      description: 'Applying HIPAA rules in your daily work',
      order: 2,
      courseId: hipaaCourse.id,
    },
  });

  await prisma.lesson.create({
    data: {
      title: 'Safeguarding Patient Information',
      content: `
        <h2>Best Practices for Protecting PHI</h2>
        
        <h3>Physical Safeguards</h3>
        <ul>
          <li>Keep patient files in locked cabinets</li>
          <li>Position computer screens away from public view</li>
          <li>Shred documents containing PHI before disposal</li>
          <li>Use sign-in sheets that don't reveal patient conditions</li>
        </ul>
        
        <h3>Technical Safeguards</h3>
        <ul>
          <li>Use strong passwords and change them regularly</li>
          <li>Log out of systems when stepping away</li>
          <li>Never share login credentials</li>
          <li>Use encrypted email for sending PHI</li>
        </ul>
        
        <h3>Administrative Safeguards</h3>
        <ul>
          <li>Complete all required HIPAA training</li>
          <li>Report suspected breaches immediately</li>
          <li>Follow the minimum necessary principle</li>
          <li>Know your organization's privacy policies</li>
        </ul>
      `,
      lessonType: 'TEXT',
      duration: 20,
      order: 1,
      moduleId: hipaaModule2.id,
    },
  });

  await prisma.lesson.create({
    data: {
      title: 'Reporting Violations',
      content: `
        <h2>What to Do When You Suspect a Violation</h2>
        
        <h3>Signs of a Potential Breach</h3>
        <ul>
          <li>Unauthorized access to patient records</li>
          <li>Lost or stolen devices containing PHI</li>
          <li>Discussing patient information in public areas</li>
          <li>Sending PHI to wrong recipients</li>
        </ul>
        
        <h3>Reporting Process</h3>
        <ol>
          <li>Document what you observed</li>
          <li>Report to your supervisor immediately</li>
          <li>Contact the Privacy Officer if needed</li>
          <li>Cooperate with any investigation</li>
        </ol>
        
        <h3>Whistleblower Protections</h3>
        <p>HIPAA protects employees who report violations in good faith. You cannot be retaliated against for reporting suspected breaches.</p>
      `,
      lessonType: 'TEXT',
      duration: 15,
      order: 2,
      moduleId: hipaaModule2.id,
    },
  });

  console.log('✅ Created HIPAA course modules and lessons');

  // Create Demo Course 2: New Employee Orientation
  const orientationCourse = await prisma.course.upsert({
    where: { slug: 'new-employee-orientation' },
    update: {},
    create: {
      title: 'New Employee Orientation',
      slug: 'new-employee-orientation',
      description: 'Welcome to Living Wellness Dental! This course will introduce you to our organization, culture, and everything you need to know to get started in your new role.',
      shortDescription: 'Essential orientation for all new team members',
      difficulty: 'BEGINNER',
      duration: 60,
      learningObjectives: [
        'Understand our mission, vision, and values',
        'Navigate our facilities and systems',
        'Know your benefits and resources',
        'Connect with your team and key contacts'
      ],
      tags: ['onboarding', 'orientation', 'new-hire', 'required'],
      categoryId: createdCourseCategories['onboarding'],
      isPublished: true,
      isFeatured: true,
      createdById: user.id,
    },
  });
  console.log('✅ Created course:', orientationCourse.title);

  // Orientation Course - Module 1
  const orientModule1 = await prisma.courseModule.create({
    data: {
      title: 'Welcome to Living Wellness',
      description: 'Learn about our organization and culture',
      order: 1,
      courseId: orientationCourse.id,
    },
  });

  await prisma.lesson.create({
    data: {
      title: 'Our Story',
      content: `
        <h2>Welcome to Living Wellness Dental</h2>
        
        <p>Living Wellness Dental was founded with a simple mission: to provide exceptional dental care while treating every patient like family.</p>
        
        <h3>Our Mission</h3>
        <p>To improve the oral health and overall wellness of our community through compassionate, patient-centered care.</p>
        
        <h3>Our Vision</h3>
        <p>To be the most trusted dental care provider in every community we serve.</p>
        
        <h3>Our Values</h3>
        <ul>
          <li><strong>Compassion:</strong> We treat every patient with kindness and understanding</li>
          <li><strong>Excellence:</strong> We strive for the highest quality in everything we do</li>
          <li><strong>Integrity:</strong> We are honest and ethical in all our actions</li>
          <li><strong>Teamwork:</strong> We support each other to achieve our best</li>
          <li><strong>Innovation:</strong> We embrace new technologies and methods</li>
        </ul>
      `,
      lessonType: 'TEXT',
      duration: 10,
      order: 1,
      moduleId: orientModule1.id,
    },
  });

  await prisma.lesson.create({
    data: {
      title: 'Your First Day Checklist',
      content: `
        <h2>Getting Started</h2>
        
        <h3>Day 1 Tasks</h3>
        <ul>
          <li>☐ Complete new hire paperwork with HR</li>
          <li>☐ Set up your computer and email account</li>
          <li>☐ Get your employee badge and access cards</li>
          <li>☐ Tour your location</li>
          <li>☐ Meet your team members</li>
          <li>☐ Review your schedule</li>
        </ul>
        
        <h3>First Week Goals</h3>
        <ul>
          <li>☐ Complete all required training courses</li>
          <li>☐ Set up direct deposit</li>
          <li>☐ Enroll in benefits</li>
          <li>☐ Learn our scheduling system</li>
          <li>☐ Shadow experienced team members</li>
        </ul>
        
        <h3>Questions?</h3>
        <p>Your supervisor and HR team are here to help! Don't hesitate to ask questions - we all want you to succeed.</p>
      `,
      lessonType: 'TEXT',
      duration: 10,
      order: 2,
      moduleId: orientModule1.id,
    },
  });

  // Orientation Quiz
  const orientQuizLesson = await prisma.lesson.create({
    data: {
      title: 'Orientation Check-In Quiz',
      content: 'Quick check to ensure you understand our organization',
      lessonType: 'QUIZ',
      duration: 5,
      order: 3,
      moduleId: orientModule1.id,
    },
  });

  const orientQuiz = await prisma.quiz.create({
    data: {
      title: 'Orientation Quiz',
      description: 'Test your knowledge of Living Wellness Dental',
      lessonId: orientQuizLesson.id,
      passingScore: 70,
      timeLimit: 10,
    },
  });

  const oq1 = await prisma.quizQuestion.create({
    data: {
      quizId: orientQuiz.id,
      question: 'Which of the following is one of our core values?',
      questionType: 'MULTIPLE_CHOICE',
      order: 1,
      points: 1,
    },
  });
  await prisma.quizAnswer.createMany({
    data: [
      { questionId: oq1.id, text: 'Compassion', isCorrect: true, order: 1 },
      { questionId: oq1.id, text: 'Speed', isCorrect: false, order: 2 },
      { questionId: oq1.id, text: 'Profit', isCorrect: false, order: 3 },
      { questionId: oq1.id, text: 'Competition', isCorrect: false, order: 4 },
    ],
  });

  const oq2 = await prisma.quizQuestion.create({
    data: {
      quizId: orientQuiz.id,
      question: 'You should complete all required training courses during your first week.',
      questionType: 'TRUE_FALSE',
      order: 2,
      points: 1,
    },
  });
  await prisma.quizAnswer.createMany({
    data: [
      { questionId: oq2.id, text: 'True', isCorrect: true, order: 1 },
      { questionId: oq2.id, text: 'False', isCorrect: false, order: 2 },
    ],
  });

  // Orientation Course - Module 2
  const orientModule2 = await prisma.courseModule.create({
    data: {
      title: 'Benefits & Resources',
      description: 'Understanding your employee benefits',
      order: 2,
      courseId: orientationCourse.id,
    },
  });

  await prisma.lesson.create({
    data: {
      title: 'Your Benefits Package',
      content: `
        <h2>Employee Benefits Overview</h2>
        
        <h3>Health Insurance</h3>
        <p>We offer comprehensive health coverage including medical, dental, and vision plans. You become eligible after 30 days of employment.</p>
        
        <h3>Retirement Plan</h3>
        <p>Our 401(k) plan includes company matching up to 4% of your salary. You become eligible after 90 days.</p>
        
        <h3>Paid Time Off</h3>
        <ul>
          <li>Vacation days (accrued based on tenure)</li>
          <li>Sick leave</li>
          <li>Paid holidays</li>
          <li>Personal days</li>
        </ul>
        
        <h3>Professional Development</h3>
        <p>We invest in your growth! Benefits include:</p>
        <ul>
          <li>Continuing education allowance</li>
          <li>Conference attendance</li>
          <li>Certification support</li>
          <li>Internal training programs</li>
        </ul>
        
        <h3>Additional Perks</h3>
        <ul>
          <li>Free dental care for you and your family</li>
          <li>Uniform allowance</li>
          <li>Employee assistance program</li>
          <li>Wellness programs</li>
        </ul>
      `,
      lessonType: 'TEXT',
      duration: 15,
      order: 1,
      moduleId: orientModule2.id,
    },
  });

  await prisma.lesson.create({
    data: {
      title: 'Key Contacts & Resources',
      content: `
        <h2>Who to Contact</h2>
        
        <h3>Human Resources</h3>
        <p>For questions about benefits, payroll, policies, or HR matters:</p>
        <ul>
          <li>Email: hr@livingwellness.dental</li>
          <li>HR Portal: Available in our internal system</li>
        </ul>
        
        <h3>IT Support</h3>
        <p>For computer issues, system access, or technical help:</p>
        <ul>
          <li>Email: it@livingwellness.dental</li>
          <li>Submit a ticket through the IT portal</li>
        </ul>
        
        <h3>Your Supervisor</h3>
        <p>For day-to-day questions, scheduling, and work-related matters, always start with your direct supervisor.</p>
        
        <h3>Training Resources</h3>
        <ul>
          <li>This LMS platform for online courses</li>
          <li>Wiki for policies and procedures</li>
          <li>In-person training sessions</li>
        </ul>
      `,
      lessonType: 'TEXT',
      duration: 10,
      order: 2,
      moduleId: orientModule2.id,
    },
  });

  console.log('✅ Created Orientation course modules and lessons');

  // Create Demo Course 3: Patient Communication Excellence
  const communicationCourse = await prisma.course.upsert({
    where: { slug: 'patient-communication-excellence' },
    update: {},
    create: {
      title: 'Patient Communication Excellence',
      slug: 'patient-communication-excellence',
      description: 'Master the art of patient communication to build trust, reduce anxiety, and deliver exceptional patient experiences. This course covers verbal and non-verbal communication, handling difficult conversations, and creating lasting patient relationships.',
      shortDescription: 'Build stronger patient relationships through effective communication',
      difficulty: 'INTERMEDIATE',
      duration: 75,
      learningObjectives: [
        'Apply active listening techniques with patients',
        'Communicate treatment plans clearly and compassionately',
        'Handle difficult conversations and patient concerns',
        'Use non-verbal communication to build rapport'
      ],
      tags: ['communication', 'patient-care', 'soft-skills', 'professional-development'],
      categoryId: createdCourseCategories['professional-development'],
      isPublished: true,
      isFeatured: true,
      createdById: user.id,
    },
  });
  console.log('✅ Created course:', communicationCourse.title);

  // Communication Course - Module 1
  const commModule1 = await prisma.courseModule.create({
    data: {
      title: 'Foundations of Patient Communication',
      description: 'Core principles for effective patient interactions',
      order: 1,
      courseId: communicationCourse.id,
    },
  });

  await prisma.lesson.create({
    data: {
      title: 'The Power of First Impressions',
      content: `
        <h2>Making Every Introduction Count</h2>
        
        <p>Research shows that patients form lasting impressions within the first 7 seconds of meeting a healthcare provider. These initial moments set the tone for the entire patient relationship.</p>
        
        <h3>Key Elements of a Positive First Impression</h3>
        <ul>
          <li><strong>Eye Contact:</strong> Make genuine eye contact when greeting patients</li>
          <li><strong>Smile:</strong> A warm, authentic smile immediately puts patients at ease</li>
          <li><strong>Name Usage:</strong> Use the patient's name - it's the sweetest sound to their ears</li>
          <li><strong>Body Language:</strong> Open posture signals you're approachable and attentive</li>
          <li><strong>Undivided Attention:</strong> Put away distractions and focus fully on the patient</li>
        </ul>
        
        <h3>The Greeting Formula</h3>
        <ol>
          <li>Stand up or move toward the patient</li>
          <li>Make eye contact and smile</li>
          <li>Introduce yourself with your name and role</li>
          <li>Use the patient's name in your greeting</li>
          <li>Ask how they're doing today</li>
        </ol>
        
        <h3>Example Greetings</h3>
        <p><em>"Good morning, Mrs. Johnson! I'm Sarah, and I'll be your hygienist today. How are you feeling?"</em></p>
        <p><em>"Hi, Michael! Welcome back. I'm Dr. Chen. It's great to see you again."</em></p>
      `,
      lessonType: 'TEXT',
      duration: 12,
      order: 1,
      moduleId: commModule1.id,
    },
  });

  await prisma.lesson.create({
    data: {
      title: 'Active Listening Skills',
      content: `
        <h2>Becoming an Active Listener</h2>
        
        <p>Active listening is one of the most powerful tools in patient communication. When patients feel truly heard, trust develops naturally.</p>
        
        <h3>The HEAR Framework</h3>
        <ul>
          <li><strong>H - Halt:</strong> Stop what you're doing and give full attention</li>
          <li><strong>E - Engage:</strong> Show interest through nodding and verbal cues ("I see," "Go on")</li>
          <li><strong>A - Anticipate:</strong> Listen to understand, not just to respond</li>
          <li><strong>R - Reflect:</strong> Summarize what you heard to confirm understanding</li>
        </ul>
        
        <h3>Common Listening Barriers</h3>
        <ul>
          <li>Thinking about your response while the patient is speaking</li>
          <li>Interrupting to offer solutions too quickly</li>
          <li>Multitasking (checking charts, computer) while listening</li>
          <li>Making assumptions about what the patient will say</li>
        </ul>
        
        <h3>Reflective Listening Phrases</h3>
        <ul>
          <li>"So what I'm hearing is..."</li>
          <li>"It sounds like you're concerned about..."</li>
          <li>"Let me make sure I understand..."</li>
          <li>"That must be frustrating for you..."</li>
        </ul>
        
        <h3>Practice Exercise</h3>
        <p>This week, practice the HEAR framework with at least 3 patients. Notice how the quality of your conversations changes when you focus entirely on listening.</p>
      `,
      lessonType: 'TEXT',
      duration: 15,
      order: 2,
      moduleId: commModule1.id,
    },
  });

  await prisma.lesson.create({
    data: {
      title: 'Non-Verbal Communication',
      content: `
        <h2>What You Don't Say Matters Most</h2>
        
        <p>Studies suggest that up to 93% of communication is non-verbal. In healthcare settings, patients are especially attuned to body language cues.</p>
        
        <h3>Positive Non-Verbal Signals</h3>
        <ul>
          <li><strong>Open Posture:</strong> Uncrossed arms, facing the patient directly</li>
          <li><strong>Appropriate Eye Contact:</strong> Shows engagement without staring</li>
          <li><strong>Nodding:</strong> Indicates you're following along</li>
          <li><strong>Leaning In:</strong> Shows interest and attentiveness</li>
          <li><strong>Facial Expressions:</strong> Match the tone of the conversation</li>
        </ul>
        
        <h3>Negative Signals to Avoid</h3>
        <ul>
          <li>Crossing arms (defensive, closed off)</li>
          <li>Looking at watch or clock (impatient)</li>
          <li>Turning away or toward the door (wanting to leave)</li>
          <li>Frowning or looking concerned (can increase patient anxiety)</li>
          <li>Fidgeting (nervous, distracted)</li>
        </ul>
        
        <h3>Mirroring Technique</h3>
        <p>Subtly matching your patient's body language can build rapport. If they lean forward, you lean forward slightly. If they speak slowly, slow your pace. This creates subconscious connection.</p>
        
        <h3>The Dental Chair Challenge</h3>
        <p>When patients are lying back in the dental chair, communication becomes harder. Strategies include:</p>
        <ul>
          <li>Get to their eye level when discussing important information</li>
          <li>Touch their arm or shoulder gently for reassurance</li>
          <li>Establish hand signals for "stop" or "I need a break"</li>
        </ul>
      `,
      lessonType: 'TEXT',
      duration: 12,
      order: 3,
      moduleId: commModule1.id,
    },
  });

  // Module 1 Quiz
  const commQuizLesson = await prisma.lesson.create({
    data: {
      title: 'Communication Foundations Quiz',
      content: 'Test your understanding of communication fundamentals',
      lessonType: 'QUIZ',
      duration: 8,
      order: 4,
      moduleId: commModule1.id,
    },
  });

  const commQuiz1 = await prisma.quiz.create({
    data: {
      title: 'Communication Foundations Quiz',
      description: 'Test your knowledge of patient communication basics',
      lessonId: commQuizLesson.id,
      passingScore: 70,
      timeLimit: 10,
    },
  });

  const cq1 = await prisma.quizQuestion.create({
    data: {
      quizId: commQuiz1.id,
      question: 'How long does it typically take for a patient to form a first impression?',
      questionType: 'MULTIPLE_CHOICE',
      order: 1,
      points: 1,
      explanation: 'Research shows first impressions are formed within approximately 7 seconds.',
    },
  });
  await prisma.quizAnswer.createMany({
    data: [
      { questionId: cq1.id, text: '7 seconds', isCorrect: true, order: 1 },
      { questionId: cq1.id, text: '30 seconds', isCorrect: false, order: 2 },
      { questionId: cq1.id, text: '2 minutes', isCorrect: false, order: 3 },
      { questionId: cq1.id, text: '5 minutes', isCorrect: false, order: 4 },
    ],
  });

  const cq2 = await prisma.quizQuestion.create({
    data: {
      quizId: commQuiz1.id,
      question: 'What does the "H" stand for in the HEAR framework?',
      questionType: 'MULTIPLE_CHOICE',
      order: 2,
      points: 1,
      explanation: 'H stands for Halt - stop what you\'re doing and give full attention.',
    },
  });
  await prisma.quizAnswer.createMany({
    data: [
      { questionId: cq2.id, text: 'Halt', isCorrect: true, order: 1 },
      { questionId: cq2.id, text: 'Help', isCorrect: false, order: 2 },
      { questionId: cq2.id, text: 'Hear', isCorrect: false, order: 3 },
      { questionId: cq2.id, text: 'Hurry', isCorrect: false, order: 4 },
    ],
  });

  const cq3 = await prisma.quizQuestion.create({
    data: {
      quizId: commQuiz1.id,
      question: 'Crossing your arms while talking to a patient sends a positive, open signal.',
      questionType: 'TRUE_FALSE',
      order: 3,
      points: 1,
      explanation: 'Crossing arms is generally perceived as defensive or closed off body language.',
    },
  });
  await prisma.quizAnswer.createMany({
    data: [
      { questionId: cq3.id, text: 'True', isCorrect: false, order: 1 },
      { questionId: cq3.id, text: 'False', isCorrect: true, order: 2 },
    ],
  });

  // Communication Course - Module 2
  const commModule2 = await prisma.courseModule.create({
    data: {
      title: 'Handling Difficult Conversations',
      description: 'Navigate challenging patient interactions with confidence',
      order: 2,
      courseId: communicationCourse.id,
    },
  });

  await prisma.lesson.create({
    data: {
      title: 'Managing Patient Anxiety',
      content: `
        <h2>Helping Anxious Patients Feel at Ease</h2>
        
        <p>Dental anxiety affects an estimated 36% of the population. Learning to recognize and address anxiety is essential for patient comfort.</p>
        
        <h3>Signs of Dental Anxiety</h3>
        <ul>
          <li>Visible tension (clenched fists, rigid posture)</li>
          <li>Sweating or pale complexion</li>
          <li>Rapid breathing or heart rate</li>
          <li>Excessive talking or complete silence</li>
          <li>Rescheduling or canceling appointments</li>
          <li>Difficulty making eye contact</li>
        </ul>
        
        <h3>The CALM Approach</h3>
        <ul>
          <li><strong>C - Connect:</strong> Acknowledge their feelings ("I understand this can be stressful")</li>
          <li><strong>A - Ask:</strong> Find out specific concerns ("What worries you most?")</li>
          <li><strong>L - Listen:</strong> Let them express fears without judgment</li>
          <li><strong>M - Manage:</strong> Offer solutions and coping strategies</li>
        </ul>
        
        <h3>Comfort Strategies</h3>
        <ul>
          <li>Explain procedures before starting (the "tell-show-do" method)</li>
          <li>Offer breaks during longer procedures</li>
          <li>Establish a stop signal (raised hand)</li>
          <li>Use calming language ("pressure" instead of "pain")</li>
          <li>Provide headphones for music or podcasts</li>
          <li>Offer a stress ball to squeeze</li>
        </ul>
        
        <h3>Words That Help vs. Words That Hurt</h3>
        <table>
          <tr><th>Avoid</th><th>Use Instead</th></tr>
          <tr><td>"This will hurt"</td><td>"You may feel some pressure"</td></tr>
          <tr><td>"Sharp"</td><td>"A small pinch"</td></tr>
          <tr><td>"Drill"</td><td>"Handpiece"</td></tr>
          <tr><td>"Shot"</td><td>"We'll get you comfortable"</td></tr>
        </table>
      `,
      lessonType: 'TEXT',
      duration: 15,
      order: 1,
      moduleId: commModule2.id,
    },
  });

  await prisma.lesson.create({
    data: {
      title: 'Discussing Treatment Plans',
      content: `
        <h2>Explaining Treatment Options Clearly</h2>
        
        <p>Patients need to understand their treatment options to make informed decisions. Clear communication builds trust and improves treatment acceptance.</p>
        
        <h3>The LAYMAN Principle</h3>
        <p>Always explain in terms a layperson can understand:</p>
        <ul>
          <li>Avoid jargon and technical terms</li>
          <li>Use analogies and comparisons</li>
          <li>Visual aids (images, models) are powerful tools</li>
          <li>Check understanding by asking questions</li>
        </ul>
        
        <h3>The 3-Part Treatment Explanation</h3>
        <ol>
          <li><strong>The What:</strong> What is the condition/problem?</li>
          <li><strong>The Why:</strong> Why does it need treatment? What happens if untreated?</li>
          <li><strong>The How:</strong> What are the treatment options and what do they involve?</li>
        </ol>
        
        <h3>Discussing Costs</h3>
        <ul>
          <li>Be transparent about costs upfront</li>
          <li>Explain insurance coverage clearly</li>
          <li>Present payment options without pressure</li>
          <li>Focus on value and long-term benefits</li>
        </ul>
        
        <h3>Handling "I Need to Think About It"</h3>
        <p>When patients hesitate:</p>
        <ul>
          <li>Acknowledge their need for time</li>
          <li>Ask what specific concerns they have</li>
          <li>Offer additional information or resources</li>
          <li>Set a follow-up time to check in</li>
        </ul>
      `,
      lessonType: 'TEXT',
      duration: 12,
      order: 2,
      moduleId: commModule2.id,
    },
  });

  await prisma.lesson.create({
    data: {
      title: 'Handling Complaints and Concerns',
      content: `
        <h2>Turning Complaints into Opportunities</h2>
        
        <p>Every complaint is an opportunity to demonstrate excellent patient care and build loyalty. How you respond matters more than the original issue.</p>
        
        <h3>The LEARN Method for Complaints</h3>
        <ul>
          <li><strong>L - Listen:</strong> Let them fully express their concern without interrupting</li>
          <li><strong>E - Empathize:</strong> Acknowledge their feelings ("I understand your frustration")</li>
          <li><strong>A - Apologize:</strong> Sincerely apologize for their experience</li>
          <li><strong>R - Resolve:</strong> Offer a solution or explain what you'll do</li>
          <li><strong>N - Notify:</strong> Follow up to ensure satisfaction</li>
        </ul>
        
        <h3>What NOT to Do</h3>
        <ul>
          <li>Don't get defensive or argue</li>
          <li>Don't blame others or make excuses</li>
          <li>Don't minimize their concerns</li>
          <li>Don't make promises you can't keep</li>
        </ul>
        
        <h3>Sample Response Script</h3>
        <p><em>"Mrs. Garcia, I'm so sorry you had to wait longer than expected today. I completely understand how frustrating that must be when you have a busy schedule. We had an emergency this morning that put us behind. What I can do is [offer solution]. Again, I truly apologize, and we'll do better to respect your time."</em></p>
        
        <h3>When to Escalate</h3>
        <p>Involve your supervisor when:</p>
        <ul>
          <li>The patient becomes verbally abusive</li>
          <li>You cannot resolve the issue yourself</li>
          <li>The complaint involves clinical care</li>
          <li>The patient requests to speak with management</li>
        </ul>
      `,
      lessonType: 'TEXT',
      duration: 15,
      order: 3,
      moduleId: commModule2.id,
    },
  });

  console.log('✅ Created Patient Communication course modules and lessons');

  // Create Demo Enrollments with realistic progress data
  console.log('📚 Creating demo enrollments...');

  // Get all lessons for each course
  const hipaaLessons = await prisma.lesson.findMany({
    where: { module: { courseId: hipaaCourse.id } },
    orderBy: [{ module: { order: 'asc' } }, { order: 'asc' }],
  });

  const orientationLessons = await prisma.lesson.findMany({
    where: { module: { courseId: orientationCourse.id } },
    orderBy: [{ module: { order: 'asc' } }, { order: 'asc' }],
  });

  const communicationLessons = await prisma.lesson.findMany({
    where: { module: { courseId: communicationCourse.id } },
    orderBy: [{ module: { order: 'asc' } }, { order: 'asc' }],
  });

  // Enrollment 1: Demo user completed HIPAA course
  const hipaaEnrollment = await prisma.enrollment.upsert({
    where: {
      userId_courseId: {
        userId: user.id,
        courseId: hipaaCourse.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      courseId: hipaaCourse.id,
      status: 'COMPLETED',
      progress: 100,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      completedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
      lastAccessedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
    },
  });

  // Create lesson progress for all HIPAA lessons (all completed)
  for (const lesson of hipaaLessons) {
    await prisma.lessonProgress.upsert({
      where: {
        enrollmentId_lessonId: {
          enrollmentId: hipaaEnrollment.id,
          lessonId: lesson.id,
        },
      },
      update: {},
      create: {
        lessonId: lesson.id,
        enrollmentId: hipaaEnrollment.id,
        isCompleted: true,
        completedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
        timeSpent: lesson.duration ? lesson.duration * 60 : 600, // in seconds
      },
    });
  }
  console.log('✅ Created HIPAA enrollment (completed) for demo user');

  // Enrollment 2: Demo user in progress on Orientation course
  const orientEnrollment = await prisma.enrollment.upsert({
    where: {
      userId_courseId: {
        userId: user.id,
        courseId: orientationCourse.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      courseId: orientationCourse.id,
      status: 'ACTIVE',
      progress: 60,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      lastAccessedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // yesterday
    },
  });

  // Create lesson progress for first 3 of 5 lessons (60%)
  const completedOrientLessons = orientationLessons.slice(0, 3);
  for (const lesson of completedOrientLessons) {
    await prisma.lessonProgress.upsert({
      where: {
        enrollmentId_lessonId: {
          enrollmentId: orientEnrollment.id,
          lessonId: lesson.id,
        },
      },
      update: {},
      create: {
        lessonId: lesson.id,
        enrollmentId: orientEnrollment.id,
        isCompleted: true,
        completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        timeSpent: lesson.duration ? lesson.duration * 60 : 600,
      },
    });
  }
  console.log('✅ Created Orientation enrollment (in progress, 60%) for demo user');

  // Enrollment 3: Demo user just started Communication course
  const commEnrollment = await prisma.enrollment.upsert({
    where: {
      userId_courseId: {
        userId: user.id,
        courseId: communicationCourse.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      courseId: communicationCourse.id,
      status: 'ACTIVE',
      progress: 17,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      lastAccessedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    },
  });

  // Create lesson progress for first lesson only (1 of 6 = ~17%)
  if (communicationLessons.length > 0) {
    await prisma.lessonProgress.upsert({
      where: {
        enrollmentId_lessonId: {
          enrollmentId: commEnrollment.id,
          lessonId: communicationLessons[0].id,
        },
      },
      update: {},
      create: {
        lessonId: communicationLessons[0].id,
        enrollmentId: commEnrollment.id,
        isCompleted: true,
        completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        timeSpent: communicationLessons[0].duration ? communicationLessons[0].duration * 60 : 720,
      },
    });
  }
  console.log('✅ Created Communication enrollment (in progress, 17%) for demo user');

  // Create additional demo users with various enrollment states for realistic admin dashboard
  const demoUsers = [
    { id: '00000000-0000-0000-0000-000000000002', name: 'Sarah Chen', email: 'sarah.chen@livingwellness.dental', role: 'Hygienist' },
    { id: '00000000-0000-0000-0000-000000000003', name: 'Michael Torres', email: 'michael.torres@livingwellness.dental', role: 'Dental Assistant' },
    { id: '00000000-0000-0000-0000-000000000004', name: 'Emily Johnson', email: 'emily.johnson@livingwellness.dental', role: 'Front Desk' },
    { id: '00000000-0000-0000-0000-000000000005', name: 'James Williams', email: 'james.williams@livingwellness.dental', role: 'Dental Assistant' },
    { id: '00000000-0000-0000-0000-000000000006', name: 'Lisa Anderson', email: 'lisa.anderson@livingwellness.dental', role: 'Hygienist' },
  ];

  // Get the default location
  const defaultLocation = await prisma.location.findFirst();

  for (let i = 0; i < demoUsers.length; i++) {
    const demoUser = demoUsers[i];

    const createdUser = await prisma.user.upsert({
      where: { email: demoUser.email },
      update: {},
      create: {
        id: demoUser.id,
        name: demoUser.name,
        email: demoUser.email,
        emailVerified: new Date(),
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(demoUser.name)}`,
      },
    });

    // Assign to default location if available
    if (defaultLocation) {
      await prisma.userLocation.upsert({
        where: {
          userId_locationId: {
            userId: createdUser.id,
            locationId: defaultLocation.id,
          },
        },
        update: {},
        create: {
          userId: createdUser.id,
          locationId: defaultLocation.id,
          isActive: true,
        },
      });
    }

    // Create varied enrollments for each demo user
    // User 0: Completed HIPAA, active on both others
    // User 1: All completed
    // User 2: Stalled learner (low progress, no activity for 14+ days)
    // User 3: Active on HIPAA only
    // User 4: Never accessed (enrolled but 0 progress)

    const enrollmentConfigs: Array<{
      course: typeof hipaaCourse;
      lessons: typeof hipaaLessons;
      status: 'ACTIVE' | 'COMPLETED' | 'PAUSED' | 'CANCELLED';
      progress: number;
      createdDaysAgo: number;
      lastAccessDaysAgo: number | null;
      completedDaysAgo: number | null;
      lessonsCompleted: number;
    }> = [];

    if (i === 0) {
      // Sarah: Completed HIPAA, 40% Orientation, 33% Communication
      enrollmentConfigs.push(
        { course: hipaaCourse, lessons: hipaaLessons, status: 'COMPLETED', progress: 100, createdDaysAgo: 45, lastAccessDaysAgo: 40, completedDaysAgo: 40, lessonsCompleted: hipaaLessons.length },
        { course: orientationCourse, lessons: orientationLessons, status: 'ACTIVE', progress: 40, createdDaysAgo: 20, lastAccessDaysAgo: 5, completedDaysAgo: null, lessonsCompleted: 2 },
        { course: communicationCourse, lessons: communicationLessons, status: 'ACTIVE', progress: 33, createdDaysAgo: 10, lastAccessDaysAgo: 3, completedDaysAgo: null, lessonsCompleted: 2 },
      );
    } else if (i === 1) {
      // Michael: All completed - model employee
      enrollmentConfigs.push(
        { course: hipaaCourse, lessons: hipaaLessons, status: 'COMPLETED', progress: 100, createdDaysAgo: 60, lastAccessDaysAgo: 55, completedDaysAgo: 55, lessonsCompleted: hipaaLessons.length },
        { course: orientationCourse, lessons: orientationLessons, status: 'COMPLETED', progress: 100, createdDaysAgo: 55, lastAccessDaysAgo: 50, completedDaysAgo: 50, lessonsCompleted: orientationLessons.length },
        { course: communicationCourse, lessons: communicationLessons, status: 'COMPLETED', progress: 100, createdDaysAgo: 40, lastAccessDaysAgo: 35, completedDaysAgo: 35, lessonsCompleted: communicationLessons.length },
      );
    } else if (i === 2) {
      // Emily: Stalled learner - enrolled but not progressing
      enrollmentConfigs.push(
        { course: hipaaCourse, lessons: hipaaLessons, status: 'ACTIVE', progress: 20, createdDaysAgo: 30, lastAccessDaysAgo: 18, completedDaysAgo: null, lessonsCompleted: 1 },
        { course: orientationCourse, lessons: orientationLessons, status: 'ACTIVE', progress: 20, createdDaysAgo: 25, lastAccessDaysAgo: 20, completedDaysAgo: null, lessonsCompleted: 1 },
      );
    } else if (i === 3) {
      // James: Active only on HIPAA, 80% complete
      enrollmentConfigs.push(
        { course: hipaaCourse, lessons: hipaaLessons, status: 'ACTIVE', progress: 80, createdDaysAgo: 14, lastAccessDaysAgo: 2, completedDaysAgo: null, lessonsCompleted: 4 },
      );
    } else if (i === 4) {
      // Lisa: Enrolled but never accessed
      enrollmentConfigs.push(
        { course: hipaaCourse, lessons: hipaaLessons, status: 'ACTIVE', progress: 0, createdDaysAgo: 21, lastAccessDaysAgo: null, completedDaysAgo: null, lessonsCompleted: 0 },
        { course: communicationCourse, lessons: communicationLessons, status: 'ACTIVE', progress: 0, createdDaysAgo: 14, lastAccessDaysAgo: null, completedDaysAgo: null, lessonsCompleted: 0 },
      );
    }

    for (const config of enrollmentConfigs) {
      const enrollment = await prisma.enrollment.upsert({
        where: {
          userId_courseId: {
            userId: createdUser.id,
            courseId: config.course.id,
          },
        },
        update: {},
        create: {
          userId: createdUser.id,
          courseId: config.course.id,
          status: config.status,
          progress: config.progress,
          createdAt: new Date(Date.now() - config.createdDaysAgo * 24 * 60 * 60 * 1000),
          lastAccessedAt: config.lastAccessDaysAgo !== null
            ? new Date(Date.now() - config.lastAccessDaysAgo * 24 * 60 * 60 * 1000)
            : null,
          completedAt: config.completedDaysAgo !== null
            ? new Date(Date.now() - config.completedDaysAgo * 24 * 60 * 60 * 1000)
            : null,
        },
      });

      // Create lesson progress for completed lessons
      const lessonsToComplete = config.lessons.slice(0, config.lessonsCompleted);
      for (const lesson of lessonsToComplete) {
        await prisma.lessonProgress.upsert({
          where: {
            enrollmentId_lessonId: {
              enrollmentId: enrollment.id,
              lessonId: lesson.id,
            },
          },
          update: {},
          create: {
            lessonId: lesson.id,
            enrollmentId: enrollment.id,
            isCompleted: true,
            completedAt: config.lastAccessDaysAgo !== null
              ? new Date(Date.now() - config.lastAccessDaysAgo * 24 * 60 * 60 * 1000)
              : new Date(),
            timeSpent: lesson.duration ? lesson.duration * 60 : 600,
          },
        });
      }
    }

    console.log(`✅ Created demo user: ${demoUser.name} with enrollments`);
  }

  // Seed default email templates
  console.log('📧 Seeding email templates...');

  const emailTemplates = [
    {
      name: 'Welcome Email',
      slug: 'welcome',
      subject: 'Welcome to Living Wellness Dental, {{name}}!',
      description: 'Sent to new users when they join the platform',
      category: 'TRANSACTIONAL' as const,
      isSystem: true,
      variables: { name: 'User\'s name', email: 'User\'s email' },
      htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #3ec972 0%, #2db362 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
    .button { display: inline-block; background: #3ec972; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to Living Wellness Dental!</h1>
    </div>
    <div class="content">
      <p>Hi {{name}},</p>
      <p>Welcome to the Living Wellness Dental team! We're excited to have you on board.</p>
      <p>Your account has been created with the email: <strong>{{email}}</strong></p>
      <p>Here's what you can do next:</p>
      <ul>
        <li>Complete your profile</li>
        <li>Explore the knowledge base</li>
        <li>Start your assigned training courses</li>
      </ul>
      <a href="{{appUrl}}" class="button">Get Started</a>
      <p>If you have any questions, don't hesitate to reach out to your manager or the HR team.</p>
      <p>Best regards,<br>The Living Wellness Dental Team</p>
    </div>
    <div class="footer">
      <p>Living Wellness Dental<br>{{unsubscribeLink}}</p>
    </div>
  </div>
</body>
</html>`,
    },
    {
      name: 'Password Reset',
      slug: 'password-reset',
      subject: 'Reset your Living Wellness Dental password',
      description: 'Sent when a user requests a password reset',
      category: 'TRANSACTIONAL' as const,
      isSystem: true,
      variables: { name: 'User\'s name', resetLink: 'Password reset URL' },
      htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #3ec972; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
    .button { display: inline-block; background: #3ec972; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
    .warning { background: #fef3cd; border: 1px solid #ffc107; padding: 10px; border-radius: 4px; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Password Reset Request</h1>
    </div>
    <div class="content">
      <p>Hi {{name}},</p>
      <p>We received a request to reset your password. Click the button below to set a new password:</p>
      <a href="{{resetLink}}" class="button">Reset Password</a>
      <div class="warning">
        <strong>Note:</strong> This link will expire in 1 hour.
      </div>
      <p>If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.</p>
      <p>Best regards,<br>The Living Wellness Dental Team</p>
    </div>
    <div class="footer">
      <p>Living Wellness Dental</p>
    </div>
  </div>
</body>
</html>`,
    },
    {
      name: 'Notification Email',
      slug: 'notification',
      subject: '{{title}}',
      description: 'Generic notification email template',
      category: 'NOTIFICATION' as const,
      isSystem: true,
      variables: { name: 'User\'s name', title: 'Notification title', message: 'Notification message', actionUrl: 'Optional action URL', actionText: 'Optional button text' },
      htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #3ec972; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
    .button { display: inline-block; background: #3ec972; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>{{title}}</h1>
    </div>
    <div class="content">
      <p>Hi {{name}},</p>
      <p>{{message}}</p>
      {{#if actionUrl}}
      <a href="{{actionUrl}}" class="button">{{actionText}}</a>
      {{/if}}
      <p>Best regards,<br>The Living Wellness Dental Team</p>
    </div>
    <div class="footer">
      <p>Living Wellness Dental<br>{{unsubscribeLink}}</p>
    </div>
  </div>
</body>
</html>`,
    },
    {
      name: 'Course Assigned',
      slug: 'course-assigned',
      subject: 'New Course Assigned: {{courseName}}',
      description: 'Sent when a course is assigned to a user',
      category: 'NOTIFICATION' as const,
      isSystem: true,
      variables: { name: 'User\'s name', courseName: 'Course title', courseDescription: 'Course description', courseUrl: 'Link to course' },
      htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #6366f1; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
    .course-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .button { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>New Course Assigned</h1>
    </div>
    <div class="content">
      <p>Hi {{name}},</p>
      <p>You've been assigned a new training course to complete:</p>
      <div class="course-card">
        <h2 style="margin-top: 0;">{{courseName}}</h2>
        <p>{{courseDescription}}</p>
      </div>
      <a href="{{courseUrl}}" class="button">Start Course</a>
      <p>Best regards,<br>The Living Wellness Dental Team</p>
    </div>
    <div class="footer">
      <p>Living Wellness Dental<br>{{unsubscribeLink}}</p>
    </div>
  </div>
</body>
</html>`,
    },
  ];

  for (const template of emailTemplates) {
    await prisma.emailTemplate.upsert({
      where: { slug: template.slug },
      update: {},
      create: template,
    });
    console.log(`✅ Created email template: ${template.name}`);
  }

  // Seed default SMS templates
  console.log('📱 Seeding SMS templates...');

  const smsTemplates = [
    {
      name: 'Verification Code',
      slug: 'verification-code',
      content: 'Your Living Wellness Dental verification code is: {{code}}. This code expires in 10 minutes.',
      description: 'SMS verification code for phone number verification',
      category: 'TRANSACTIONAL' as const,
      isSystem: true,
      variables: { code: 'Verification code' },
    },
    {
      name: 'General Notification',
      slug: 'notification',
      content: 'Living Wellness Dental: {{message}}',
      description: 'Generic SMS notification template',
      category: 'NOTIFICATION' as const,
      isSystem: true,
      variables: { message: 'Notification message' },
    },
    {
      name: 'Course Reminder',
      slug: 'course-reminder',
      content: 'Living Wellness Dental: Reminder to complete your course "{{courseName}}". Start now: {{courseUrl}}',
      description: 'Reminder to complete assigned courses',
      category: 'REMINDER' as const,
      isSystem: true,
      variables: { courseName: 'Course name', courseUrl: 'Link to course' },
    },
  ];

  for (const template of smsTemplates) {
    await prisma.smsTemplate.upsert({
      where: { slug: template.slug },
      update: {},
      create: template,
    });
    console.log(`✅ Created SMS template: ${template.name}`);
  }

  // Seed default messaging settings
  console.log('⚙️ Seeding messaging settings...');

  await prisma.messagingSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      emailEnabled: false,
      smsEnabled: false,
      defaultEmailOptIn: true,
      defaultSmsOptIn: false,
      emailRateLimitPerHour: 100,
      smsRateLimitPerHour: 50,
    },
  });
  console.log('✅ Created default messaging settings');

  console.log('🎉 Seeding completed successfully!');

  await prisma.$disconnect();
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  });
