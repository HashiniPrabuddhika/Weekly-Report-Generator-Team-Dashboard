import { Test, TestingModule } from '@nestjs/testing';
import { ManagerService } from './manager.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ManagerService', () => {
  let service: ManagerService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      report: { findMany: jest.fn().mockResolvedValue([]), count: jest.fn().mockResolvedValue(0) },
      user: { findMany: jest.fn(), findUnique: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ManagerService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(ManagerService);
  });

  describe('findAllReports', () => {
    it('applies no filters when the query is empty', async () => {
      await service.findAllReports({});
      expect(prisma.report.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
    });

    it('filters by employeeId, projectId, and status together', async () => {
      await service.findAllReports({
        employeeId: 'user-1',
        projectId: 'proj-1',
        status: 'SUBMITTED' as any,
      });
      expect(prisma.report.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1', projectId: 'proj-1', status: 'SUBMITTED' },
        }),
      );
    });

    it('paginates using page/limit and computes totalPages correctly', async () => {
      prisma.report.count.mockResolvedValue(45);
      const result = await service.findAllReports({ page: 2, limit: 20 });

      expect(prisma.report.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 20 }),
      );
      expect(result.totalPages).toBe(3); // ceil(45 / 20)
    });
  });
});
