import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

function getMonday(date: Date): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d;
}

function weeksAgo(n: number): { weekStart: Date; weekEnd: Date } {
  const monday = getMonday(new Date());
  monday.setUTCDate(monday.getUTCDate() - 7 * n);
  const sunday = new Date(monday);
  sunday.setUTCDate(sunday.getUTCDate() + 6);
  return { weekStart: monday, weekEnd: sunday };
}

// Content is deliberately varied per member, per week, and per project
// domain — not copy-pasted. The whole point of the seed data is to make
// features like the cross-team section view (blockers/achievements/notes
// side by side) look like a real team, not five clones of the same report.
// Some entries are intentionally left empty (a blank blockers list, blank
// notes) so the "No blockers reported" / "No notes added" empty states in
// the UI get exercised too, not just the happy path.
// ---------------------------------------------------------------------------

type Blocker = { description: string; isKeyIssue: boolean };
type Achievement = { description: string; isKeyAchievement: boolean };
type Task = {
  taskName: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  plannedPercentage: number;
  actualPercentage: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
  plannedHours: number;
  actualHours: number;
  deliverable: string | null;
};
type PlannedTask = {
  taskName: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string | null;
};

const PROJECT_TASKS: Record<string, { tasks: Task[]; plannedTasks: PlannedTask[] }> = {
  'Client Portal': {
    tasks: [
      {
        taskName: 'Implement multi-factor authentication',
        priority: 'HIGH',
        plannedPercentage: 100,
        actualPercentage: 100,
        status: 'COMPLETED',
        plannedHours: 14,
        actualHours: 16,
        deliverable: 'PR #142 merged to main',
      },
      {
        taskName: 'Responsive redesign of the billing page',
        priority: 'MEDIUM',
        plannedPercentage: 70,
        actualPercentage: 85,
        status: 'IN_PROGRESS',
        plannedHours: 10,
        actualHours: 9,
        deliverable: null,
      },
    ],
    plannedTasks: [
      { taskName: 'Add session-timeout warning modal', priority: 'MEDIUM', description: null },
      {
        taskName: 'Write E2E tests for MFA flow',
        priority: 'HIGH',
        description: 'Blocking release sign-off',
      },
    ],
  },
  'Internal Tooling': {
    tasks: [
      {
        taskName: 'Reduce CI pipeline build time',
        priority: 'MEDIUM',
        plannedPercentage: 100,
        actualPercentage: 100,
        status: 'COMPLETED',
        plannedHours: 8,
        actualHours: 7,
        deliverable: 'Build time down from 9 min to 4 min',
      },
      {
        taskName: 'Build internal analytics dashboard',
        priority: 'HIGH',
        plannedPercentage: 60,
        actualPercentage: 55,
        status: 'IN_PROGRESS',
        plannedHours: 16,
        actualHours: 14,
        deliverable: null,
      },
    ],
    plannedTasks: [
      { taskName: 'Automate dependency-update PRs', priority: 'LOW', description: null },
      { taskName: 'Investigate dashboard cache staleness', priority: 'HIGH', description: null },
    ],
  },
  'AI Research': {
    tasks: [
      {
        taskName: 'Train baseline classification model',
        priority: 'HIGH',
        plannedPercentage: 100,
        actualPercentage: 100,
        status: 'COMPLETED',
        plannedHours: 20,
        actualHours: 24,
        deliverable: '87% validation accuracy — see internal writeup',
      },
      {
        taskName: 'Evaluate embedding model candidates',
        priority: 'MEDIUM',
        plannedPercentage: 50,
        actualPercentage: 40,
        status: 'IN_PROGRESS',
        plannedHours: 12,
        actualHours: 9,
        deliverable: null,
      },
    ],
    plannedTasks: [
      { taskName: 'Reduce classifier false-positive rate', priority: 'HIGH', description: null },
      {
        taskName: 'Write up embedding comparison for the team',
        priority: 'LOW',
        description: null,
      },
    ],
  },
  'Marketing Automation': {
    tasks: [
      {
        taskName: 'Build cart-abandonment email sequence',
        priority: 'HIGH',
        plannedPercentage: 100,
        actualPercentage: 100,
        status: 'COMPLETED',
        plannedHours: 10,
        actualHours: 11,
        deliverable: 'Live — early lift observed',
      },
      {
        taskName: 'A/B test framework for subject lines',
        priority: 'MEDIUM',
        plannedPercentage: 90,
        actualPercentage: 90,
        status: 'COMPLETED',
        plannedHours: 6,
        actualHours: 6,
        deliverable: '+6% open rate on variant B',
      },
    ],
    plannedTasks: [
      {
        taskName: 'Build referral-program landing page',
        priority: 'MEDIUM',
        description: 'Pending legal approval on copy',
      },
      { taskName: 'Set up post-purchase drip campaign', priority: 'LOW', description: null },
    ],
  },
};

// Per-member, per-week qualitative content (blockers / achievements / notes).
// Keys are weeksAgo values: 3 (oldest) -> 0 (current week).
type WeekContent = { blockers: Blocker[]; achievements: Achievement[]; notes: string };

const MEMBER_CONTENT: Record<string, Partial<Record<number, WeekContent>>> = {
  Hashini: {
    3: {
      blockers: [
        { description: 'Waiting on SSL certificate renewal for staging', isKeyIssue: false },
      ],
      achievements: [
        { description: 'Completed the password-reset flow end-to-end', isKeyAchievement: true },
      ],
      notes: 'Smooth week overall, no major surprises.',
    },
    2: {
      blockers: [
        {
          description: 'Design sign-off pending for the new onboarding screens',
          isKeyIssue: true,
        },
      ],
      achievements: [
        {
          description: 'Migrated the login page to the new component library',
          isKeyAchievement: false,
        },
      ],
      notes: 'Paired with Tharindu on the shared auth module for most of Thursday.',
    },
    1: {
      blockers: [
        {
          description:
            'Third-party OAuth provider had an outage on Tuesday, blocked social-login testing',
          isKeyIssue: true,
        },
        {
          description: 'Waiting on legal review for the updated terms-of-service copy',
          isKeyIssue: false,
        },
      ],
      achievements: [
        {
          description: 'Shipped the multi-factor authentication flow a day ahead of schedule',
          isKeyAchievement: true,
        },
      ],
      notes: 'MFA rollout is the big win this week — see achievements.',
    },
    0: {
      blockers: [
        {
          description: 'Need clarification from product on session-timeout duration',
          isKeyIssue: false,
        },
      ],
      achievements: [],
      notes: 'Mid-week — MFA rollout monitoring still in progress.',
    },
  },
  Kasun: {
    3: {
      blockers: [{ description: 'CI pipeline flaky on the Windows runners', isKeyIssue: false }],
      achievements: [
        {
          description: 'Cut average CI build time from 9 minutes to 4 minutes',
          isKeyAchievement: true,
        },
      ],
      notes: 'Good week for infra work.',
    },
    2: {
      blockers: [
        {
          description:
            'Waiting on DevOps to provision a new staging database for the tooling dashboard',
          isKeyIssue: true,
        },
      ],
      achievements: [
        {
          description: 'Automated the weekly dependency-update pull requests',
          isKeyAchievement: false,
        },
      ],
      notes: '',
    },
    1: {
      blockers: [
        {
          description: 'Internal dashboard API returning stale cache — root cause not yet found',
          isKeyIssue: true,
        },
      ],
      achievements: [
        {
          description: 'Rolled out the new internal analytics dashboard to the whole team',
          isKeyAchievement: true,
        },
      ],
      notes: 'One nagging bug alongside a solid launch this week.',
    },
    0: {
      blockers: [],
      achievements: [
        { description: 'Fixed the stale-cache bug from last week', isKeyAchievement: false },
      ],
      notes: 'Early in the week — more to report soon.',
    },
  },
  Amal: {
    3: {
      blockers: [
        {
          description: 'GPU cluster over capacity, experiments queued for 2 days',
          isKeyIssue: true,
        },
      ],
      achievements: [
        {
          description: 'Baseline model reached 87% accuracy on the validation set',
          isKeyAchievement: true,
        },
      ],
      notes: 'Good progress despite the compute constraints.',
    },
    2: {
      blockers: [],
      achievements: [
        {
          description: 'Published an internal writeup comparing three embedding models',
          isKeyAchievement: false,
        },
      ],
      notes: 'Quieter week, mostly research reading.',
    },
    1: {
      // Deliberately empty — this is the report the manager sent back for
      // correction, asking why a known rate-limit issue wasn't logged here.
      blockers: [],
      achievements: [
        {
          description: 'Narrowed down the classifier false-positive rate by 15%',
          isKeyAchievement: true,
        },
      ],
      notes: 'Solid improvement on precision this week.',
    },
  },
  Nimal: {
    3: {
      blockers: [
        { description: 'Waiting on brand assets from the design agency', isKeyIssue: false },
      ],
      achievements: [
        {
          description: 'Launched the automated cart-abandonment email sequence',
          isKeyAchievement: true,
        },
      ],
      notes: 'Cart-abandonment sequence is already showing an early lift.',
    },
    2: {
      blockers: [
        {
          description: 'Marketing automation platform hit its monthly API call limit',
          isKeyIssue: true,
        },
      ],
      achievements: [
        {
          description: 'A/B test on subject lines improved open rate by 6%',
          isKeyAchievement: false,
        },
      ],
      notes: '',
    },
    1: {
      blockers: [
        {
          description: 'Waiting on legal approval for the new customer referral program copy',
          isKeyIssue: true,
        },
      ],
      achievements: [
        {
          description: 'Referral program landing page built and ready pending approval',
          isKeyAchievement: false,
        },
      ],
      notes: 'Everything is ready to go, just waiting on the green light.',
    },
  },
  Tharindu: {
    3: {
      blockers: [
        {
          description: 'Local dev environment kept crashing after the dependency upgrade',
          isKeyIssue: false,
        },
      ],
      achievements: [
        {
          description: 'Fixed the crashing dev environment and documented the fix for the team',
          isKeyAchievement: true,
        },
      ],
      notes: '',
    },
    1: {
      blockers: [],
      achievements: [
        {
          description: 'Completed the responsive redesign of the billing page',
          isKeyAchievement: true,
        },
      ],
      notes: 'Billing page redesign is done and looks great on mobile now.',
    },
  },
};
interface SeedUser {
  id: string;
  name: string;
}
interface SeedProject {
  id: string;
  name: string;
}

interface SeedReportOptions {
  userId: string;
  memberName: string;
  projectId: string;
  projectName: string;
  weekStart: Date;
  weekEnd: Date;
  weeksAgoIndex: number;
  status: 'DRAFT' | 'SUBMITTED' | 'NEEDS_CORRECTION' | 'APPROVED';
  reviewerId?: string;
  reviewComment?: string;
}

async function seedReport(opts: SeedReportOptions) {
  const { tasks, plannedTasks } = PROJECT_TASKS[opts.projectName];
  const weekContent = MEMBER_CONTENT[opts.memberName]?.[opts.weeksAgoIndex] ?? {
    blockers: [],
    achievements: [],
    notes: '',
  };

  const report = await prisma.report.create({
    data: {
      userId: opts.userId,
      projectId: opts.projectId,
      weekStart: opts.weekStart,
      weekEnd: opts.weekEnd,
      status: opts.status,
      notes: weekContent.notes || null,
      tasks: { create: tasks },
      plannedTasks: { create: plannedTasks },
      blockers: { create: weekContent.blockers },
      achievements: { create: weekContent.achievements },
      timeEntries: {
        create: [
          { taskType: 'DEVELOPMENT', hours: 18 + Math.round(Math.random() * 6) },
          { taskType: 'TESTING', hours: 4 + Math.round(Math.random() * 4) },
          { taskType: 'MEETINGS', hours: 3 + Math.round(Math.random() * 3) },
          { taskType: 'DOCUMENTATION', hours: 1 + Math.round(Math.random() * 3) },
        ],
      },
    },
    include: {
      tasks: true,
      plannedTasks: true,
      blockers: true,
      achievements: true,
      timeEntries: true,
    },
  });

  if (opts.status === 'DRAFT') {
    return report;
  }

  const version = await prisma.reportVersion.create({
    data: {
      reportId: report.id,
      versionNumber: 1,
      contentSnapshot: {
        projectId: report.projectId,
        weekStart: report.weekStart,
        weekEnd: report.weekEnd,
        notes: report.notes,
        tasks: report.tasks,
        plannedTasks: report.plannedTasks,
        blockers: report.blockers,
        achievements: report.achievements,
        timeEntries: report.timeEntries,
      },
    },
  });

  if (opts.status === 'NEEDS_CORRECTION' && opts.reviewerId) {
    await prisma.reportReview.create({
      data: {
        reportId: report.id,
        versionId: version.id,
        reviewerId: opts.reviewerId,
        action: 'CHANGES_REQUESTED',
        comment:
          opts.reviewComment ?? 'Please add the actual deliverable link for each completed task.',
      },
    });
  }

  if (opts.status === 'APPROVED' && opts.reviewerId) {
    await prisma.reportReview.create({
      data: {
        reportId: report.id,
        versionId: version.id,
        reviewerId: opts.reviewerId,
        action: 'APPROVED',
        comment: 'Looks good, thanks!',
      },
    });
  }

  return report;
}

async function main() {
  console.log('🌱 Seeding database...');

  const passwordHash = await bcrypt.hash('Password123!', 10);

  const manager = await prisma.user.upsert({
    where: { email: 'sarah.manager@company.com' },
    update: {},
    create: {
      name: 'Sarah Manager',
      email: 'sarah.manager@company.com',
      passwordHash,
      role: Role.MANAGER,
    },
  });

  await prisma.user.upsert({
    where: { email: 'admin@company.com' },
    update: {},
    create: {
      name: 'System Admin',
      email: 'admin@company.com',
      passwordHash,
      role: Role.ADMIN,
    },
  });

  const teamMemberNames = ['Hashini', 'Kasun', 'Amal', 'Nimal', 'Tharindu'];
  const teamMembers: SeedUser[] = [];
  for (const name of teamMemberNames) {
    const user = await prisma.user.upsert({
      where: { email: `${name.toLowerCase()}@company.com` },
      update: {},
      create: {
        name,
        email: `${name.toLowerCase()}@company.com`,
        passwordHash,
        role: Role.TEAM_MEMBER,
      },
    });
    teamMembers.push(user);
  }

  const projectDefs = ['Client Portal', 'Internal Tooling', 'AI Research', 'Marketing Automation'];
  const projects: SeedProject[] = [];
  for (const name of projectDefs) {
    const project = await prisma.project.upsert({
      where: { name },
      update: {},
      create: { name, description: `${name} workstream` },
    });
    projects.push(project);
  }

  // Assign each member to their primary project (also exercises the
  // project-members relation used by the "assign members to projects" feature).
  const [hashini, kasun, amal, nimal, tharindu] = teamMembers;
  const [clientPortal, internalTooling, aiResearch, marketing] = projects;

  const membership: Array<[SeedUser, SeedProject]> = [
    [hashini, clientPortal],
    [kasun, internalTooling],
    [amal, aiResearch],
    [nimal, marketing],
    [tharindu, clientPortal],
  ];
  for (const [member, project] of membership) {
    await prisma.userProject.upsert({
      where: { userId_projectId: { userId: member.id, projectId: project.id } },
      update: {},
      create: { userId: member.id, projectId: project.id },
    });
  }

  await prisma.report.deleteMany({ where: { userId: { in: teamMembers.map((m) => m.id) } } });

  async function seed(
    member: SeedUser,
    project: SeedProject,
    weeksAgoIndex: number,
    status: SeedReportOptions['status'],
    extra: Partial<Pick<SeedReportOptions, 'reviewerId' | 'reviewComment'>> = {},
  ) {
    return seedReport({
      userId: member.id,
      memberName: member.name,
      projectId: project.id,
      projectName: project.name,
      ...weeksAgo(weeksAgoIndex),
      weeksAgoIndex,
      status,
      ...extra,
    });
  }

  await seed(hashini, clientPortal, 3, 'APPROVED', { reviewerId: manager.id });
  await seed(kasun, internalTooling, 3, 'APPROVED', { reviewerId: manager.id });
  await seed(amal, aiResearch, 3, 'APPROVED', { reviewerId: manager.id });
  await seed(nimal, marketing, 3, 'APPROVED', { reviewerId: manager.id });
  await seed(tharindu, clientPortal, 3, 'APPROVED', { reviewerId: manager.id });

  await seed(hashini, clientPortal, 2, 'APPROVED', { reviewerId: manager.id });
  await seed(kasun, internalTooling, 2, 'NEEDS_CORRECTION', {
    reviewerId: manager.id,
    reviewComment: 'Please clarify the testing coverage for the new CI pipeline changes.',
  });
  await seed(amal, aiResearch, 2, 'APPROVED', { reviewerId: manager.id });
  await seed(nimal, marketing, 2, 'APPROVED', { reviewerId: manager.id });
  await seed(hashini, clientPortal, 1, 'SUBMITTED');
  await seed(kasun, internalTooling, 1, 'SUBMITTED');
  await seed(amal, aiResearch, 1, 'NEEDS_CORRECTION', {
    reviewerId: manager.id,
    reviewComment:
      'The blockers section is empty but the daily standup mentioned an API rate-limit issue — please add it.',
  });
  await seed(nimal, marketing, 1, 'SUBMITTED');
  await seed(tharindu, clientPortal, 1, 'APPROVED', { reviewerId: manager.id });

  await seed(hashini, clientPortal, 0, 'SUBMITTED');
  await seed(kasun, internalTooling, 0, 'NEEDS_CORRECTION', {
    reviewerId: manager.id,
    reviewComment: 'Please add actual hours spent, not just the planned estimate.',
  });
  await seed(amal, aiResearch, 0, 'APPROVED', { reviewerId: manager.id });
  await seed(nimal, marketing, 0, 'DRAFT');

  console.log('✅ Seed complete.');
  console.log('   Admin login:        admin@company.com / Password123!');
  console.log('   Manager login:      sarah.manager@company.com / Password123!');
  console.log('   Team member login:  hashini@company.com / Password123!');
  console.log('   (all seeded accounts use the same password: Password123!)');
  console.log('');
  console.log('   Try the cross-team section view on "1 week ago" for BLOCKERS or');
  console.log('   ACHIEVEMENTS — each member has different content, including one');
  console.log('   empty state and one multi-item, key-flagged entry.');
  console.log('');
  console.log('   The AI team summary / chat (GET /ai/team-summary, POST /ai/chat) use');
  console.log('   this same seeded data — set ANTHROPIC_API_KEY to try them.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
