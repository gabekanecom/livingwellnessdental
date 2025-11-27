import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create a demo user with fixed UUID (for seeding only - real users come from Supabase Auth)
  const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';
  const user = await prisma.user.upsert({
    where: { id: DEMO_USER_ID },
    update: {},
    create: {
      id: DEMO_USER_ID,
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
    { id: 'loc_nyc01', name: 'Manhattan Office', city: 'New York', state: 'NY', address: '123 Main Street', zipCode: '10001', phone: '(212) 555-0100' },
    { id: 'loc_nyc02', name: 'Brooklyn Office', city: 'Brooklyn', state: 'NY', address: '456 Park Avenue', zipCode: '11201', phone: '(718) 555-0200' },
    { id: 'loc_la01', name: 'Los Angeles Office', city: 'Los Angeles', state: 'CA', address: '789 Sunset Blvd', zipCode: '90001', phone: '(310) 555-0300' },
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

  console.log('🎉 Seeding completed successfully!');

  await prisma.$disconnect();
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  });
