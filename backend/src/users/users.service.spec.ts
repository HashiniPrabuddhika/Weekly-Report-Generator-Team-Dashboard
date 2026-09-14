import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../common/enums/role.enum';

describe('UsersService (admin methods)', () => {
  let service: UsersService;
  let prisma: any;

  const mockUser = {
    id: 'user-1',
    name: 'Kasun',
    email: 'kasun@company.com',
    passwordHash: 'super-secret-hash',
    role: Role.TEAM_MEMBER,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(UsersService);
  });

  describe('createByAdmin', () => {
    it('rejects a duplicate email', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.createByAdmin({
          name: 'Kasun',
          email: 'kasun@company.com',
          password: 'Password123!',
          role: Role.MANAGER,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('hashes the password and honors the admin-specified role', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({ ...mockUser, role: Role.MANAGER });

      await service.createByAdmin({
        name: 'Kasun',
        email: 'kasun@company.com',
        password: 'Password123!',
        role: Role.MANAGER,
      });

      const createArg = prisma.user.create.mock.calls[0][0].data;
      expect(createArg.role).toBe(Role.MANAGER);
      expect(createArg.passwordHash).not.toBe('Password123!');
    });

    it('never returns passwordHash in the response', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(mockUser);

      const result = await service.createByAdmin({
        name: 'Kasun',
        email: 'kasun@company.com',
        password: 'Password123!',
        role: Role.TEAM_MEMBER,
      });

      expect(result).not.toHaveProperty('passwordHash');
    });
  });

  describe('findAllSanitized', () => {
    it('strips passwordHash from every user in the list', async () => {
      prisma.user.findMany.mockResolvedValue([mockUser, { ...mockUser, id: 'user-2' }]);

      const result = await service.findAllSanitized();

      expect(result).toHaveLength(2);
      result.forEach((u) => expect(u).not.toHaveProperty('passwordHash'));
    });
  });

  describe('updateRole', () => {
    it('throws NotFoundException for a non-existent user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.updateRole('ghost-id', Role.MANAGER)).rejects.toThrow(NotFoundException);
    });

    it('updates the role when the user exists', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue({ ...mockUser, role: Role.MANAGER });

      const result = await service.updateRole('user-1', Role.MANAGER);
      expect(result.role).toBe(Role.MANAGER);
    });
  });

  describe('setActive', () => {
    it('deactivates a user (soft "remove") rather than deleting them', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue({ ...mockUser, isActive: false });

      await service.setActive('user-1', false);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { isActive: false },
      });
    });
  });
});
