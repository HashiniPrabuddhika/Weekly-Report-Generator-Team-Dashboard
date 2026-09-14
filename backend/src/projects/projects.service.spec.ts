import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let prisma: {
    project: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    user: {
      count: jest.Mock;
    };
    userProject: {
      findMany: jest.Mock;
      deleteMany: jest.Mock;
      createMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  const mockProject = {
    id: 'proj-1',
    name: 'Client A',
    description: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      project: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      user: {
        count: jest.fn(),
      },
      userProject: {
        findMany: jest.fn(),
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
      $transaction: jest.fn((cb) => cb(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ProjectsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(ProjectsService);
  });

  describe('findAll', () => {
    it('filters to active projects by default', async () => {
      prisma.project.findMany.mockResolvedValue([mockProject]);
      await service.findAll();
      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { isActive: true } }),
      );
    });

    it('includes inactive projects when explicitly requested', async () => {
      prisma.project.findMany.mockResolvedValue([mockProject]);
      await service.findAll(true);
      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: undefined }),
      );
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when the project does not exist', async () => {
      prisma.project.findUnique.mockResolvedValue(null);
      await expect(service.findOne('missing-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('throws ConflictException when a project with that name already exists', async () => {
      prisma.project.findUnique.mockResolvedValue(mockProject);
      await expect(service.create({ name: 'Client A' })).rejects.toThrow(ConflictException);
    });

    it('creates the project when the name is unique', async () => {
      prisma.project.findUnique.mockResolvedValue(null);
      prisma.project.create.mockResolvedValue(mockProject);

      const result = await service.create({ name: 'Client A' });
      expect(result).toEqual(mockProject);
    });
  });

  describe('remove', () => {
    it('soft-deletes by setting isActive to false, never hard-deletes', async () => {
      prisma.project.findUnique.mockResolvedValue(mockProject);
      prisma.project.update.mockResolvedValue({ ...mockProject, isActive: false });

      await service.remove('proj-1');

      expect(prisma.project.update).toHaveBeenCalledWith({
        where: { id: 'proj-1' },
        data: { isActive: false },
      });
    });
  });

  describe('getMembers', () => {
    it('throws NotFoundException when the project does not exist', async () => {
      prisma.project.findUnique.mockResolvedValue(null);
      await expect(service.getMembers('missing-id')).rejects.toThrow(NotFoundException);
    });

    it('returns the assigned users, unwrapped from the join rows', async () => {
      prisma.project.findUnique.mockResolvedValue(mockProject);
      prisma.userProject.findMany.mockResolvedValue([
        { user: { id: 'user-1', name: 'Amal', email: 'amal@test.com', isActive: true } },
        { user: { id: 'user-2', name: 'Kasun', email: 'kasun@test.com', isActive: true } },
      ]);

      const result = await service.getMembers('proj-1');

      expect(prisma.userProject.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { projectId: 'proj-1' } }),
      );
      expect(result).toEqual([
        { id: 'user-1', name: 'Amal', email: 'amal@test.com', isActive: true },
        { id: 'user-2', name: 'Kasun', email: 'kasun@test.com', isActive: true },
      ]);
    });
  });

  describe('setMembers', () => {
    it('throws NotFoundException when the project does not exist', async () => {
      prisma.project.findUnique.mockResolvedValue(null);
      await expect(service.setMembers('missing-id', ['user-1'])).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when a given userId does not exist', async () => {
      prisma.project.findUnique.mockResolvedValue(mockProject);
      prisma.user.count.mockResolvedValue(1); // only 1 of the 2 requested ids is real

      await expect(service.setMembers('proj-1', ['user-1', 'user-2'])).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.userProject.deleteMany).not.toHaveBeenCalled();
    });

    it('de-dupes repeated ids before validating and inserting', async () => {
      prisma.project.findUnique.mockResolvedValue(mockProject);
      prisma.user.count.mockResolvedValue(1);
      prisma.userProject.findMany.mockResolvedValue([]);

      await service.setMembers('proj-1', ['user-1', 'user-1', 'user-1']);

      expect(prisma.user.count).toHaveBeenCalledWith({ where: { id: { in: ['user-1'] } } });
      expect(prisma.userProject.createMany).toHaveBeenCalledWith({
        data: [{ projectId: 'proj-1', userId: 'user-1' }],
      });
    });

    it('replaces the full member set: deletes existing links before inserting new ones', async () => {
      prisma.project.findUnique.mockResolvedValue(mockProject);
      prisma.user.count.mockResolvedValue(2);
      prisma.userProject.findMany.mockResolvedValue([]);

      await service.setMembers('proj-1', ['user-1', 'user-2']);

      expect(prisma.userProject.deleteMany).toHaveBeenCalledWith({
        where: { projectId: 'proj-1' },
      });
      expect(prisma.userProject.createMany).toHaveBeenCalledWith({
        data: [
          { projectId: 'proj-1', userId: 'user-1' },
          { projectId: 'proj-1', userId: 'user-2' },
        ],
      });
    });

    it('clears all members when given an empty array, without a createMany call', async () => {
      prisma.project.findUnique.mockResolvedValue(mockProject);
      prisma.userProject.findMany.mockResolvedValue([]);

      await service.setMembers('proj-1', []);

      expect(prisma.user.count).not.toHaveBeenCalled();
      expect(prisma.userProject.deleteMany).toHaveBeenCalledWith({
        where: { projectId: 'proj-1' },
      });
      expect(prisma.userProject.createMany).not.toHaveBeenCalled();
    });
  });
});
