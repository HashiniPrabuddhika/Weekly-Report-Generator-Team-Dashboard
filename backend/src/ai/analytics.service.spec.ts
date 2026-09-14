import { AnalyticsService } from './analytics.service';
import { ReportStatus, TaskPriority, TaskStatus } from '../reports/entities/report.enums';

describe('AnalyticsService', () => {
  let prisma: {
    user: { findMany: jest.Mock };
    report: { findMany: jest.Mock };
  };
  let service: AnalyticsService;

  beforeEach(() => {
    prisma = {
      user: { findMany: jest.fn() },
      report: { findMany: jest.fn() },
    };
    service = new AnalyticsService(prisma as never);
  });

  function makeReport(overrides: Partial<Record<string, unknown>> = {}) {
    return {
      userId: 'user-1',
      status: ReportStatus.SUBMITTED,
      user: { name: 'Amal' },
      project: { name: 'Client Portal' },
      blockers: [],
      achievements: [],
      tasks: [],
      ...overrides,
    };
  }

  it('lists team members with no report that week as notStartedMembers', async () => {
    prisma.user.findMany.mockResolvedValue([
      { id: 'user-1', name: 'Amal' },
      { id: 'user-2', name: 'Kasun' },
    ]);
    prisma.report.findMany.mockResolvedValue([makeReport({ userId: 'user-1' })]);

    const result = await service.getTeamWeekContext('2026-09-01');

    expect(result.notStartedMembers).toEqual(['Kasun']);
    expect(result.reportsSubmitted).toBe(1);
  });

  it('sorts key-flagged blockers first', async () => {
    prisma.user.findMany.mockResolvedValue([]);
    prisma.report.findMany.mockResolvedValue([
      makeReport({
        blockers: [
          { description: 'Minor thing', isKeyIssue: false },
          { description: 'Critical outage', isKeyIssue: true },
        ],
      }),
    ]);

    const result = await service.getTeamWeekContext('2026-09-01');

    expect(result.blockers[0]).toMatchObject({ text: 'Critical outage', isKeyIssue: true });
  });

  it('caps blockers at 30 items even when more exist', async () => {
    prisma.user.findMany.mockResolvedValue([]);
    const manyBlockers = Array.from({ length: 45 }, (_, i) => ({
      description: `Blocker ${i}`,
      isKeyIssue: false,
    }));
    prisma.report.findMany.mockResolvedValue([makeReport({ blockers: manyBlockers })]);

    const result = await service.getTeamWeekContext('2026-09-01');

    expect(result.blockers).toHaveLength(30);
  });

  it('truncates blocker text beyond 240 characters', async () => {
    prisma.user.findMany.mockResolvedValue([]);
    const longText = 'x'.repeat(300);
    prisma.report.findMany.mockResolvedValue([
      makeReport({ blockers: [{ description: longText, isKeyIssue: false }] }),
    ]);

    const result = await service.getTeamWeekContext('2026-09-01');

    expect(result.blockers[0].text.length).toBeLessThanOrEqual(241); // 240 chars + ellipsis
    expect(result.blockers[0].text.endsWith('…')).toBe(true);
  });

  it('sums task counts per project across reports', async () => {
    prisma.user.findMany.mockResolvedValue([]);
    prisma.report.findMany.mockResolvedValue([
      makeReport({
        project: { name: 'Client Portal' },
        tasks: [
          { taskName: 'A', priority: TaskPriority.LOW, status: TaskStatus.COMPLETED },
          { taskName: 'B', priority: TaskPriority.LOW, status: TaskStatus.COMPLETED },
        ],
      }),
      makeReport({
        project: { name: 'Client Portal' },
        tasks: [{ taskName: 'C', priority: TaskPriority.LOW, status: TaskStatus.IN_PROGRESS }],
      }),
    ]);

    const result = await service.getTeamWeekContext('2026-09-01');

    expect(result.workloadByProject).toEqual([{ project: 'Client Portal', taskCount: 3 }]);
  });
});
