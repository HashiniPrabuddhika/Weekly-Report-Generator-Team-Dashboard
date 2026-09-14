import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { Role } from '../common/enums/role.enum';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUser = {
    id: 'user-1',
    name: 'Hashini',
    email: 'hashini@company.com',
    passwordHash: '',
    role: Role.TEAM_MEMBER,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn().mockResolvedValue('fake.jwt.token'),
          },
        },
      ],
    }).compile();

    authService = module.get(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
  });

  describe('register', () => {
    it('throws ConflictException if the email is already registered', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser as any);

      await expect(
        authService.register({
          name: 'Hashini',
          email: 'hashini@company.com',
          password: 'Password123!',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('hashes the password before storing it (never stores plaintext)', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue({ ...mockUser, passwordHash: 'hashed' } as any);

      await authService.register({
        name: 'Hashini',
        email: 'hashini@company.com',
        password: 'Password123!',
      });

      const createArg = usersService.create.mock.calls[0][0];
      expect(createArg.passwordHash).not.toBe('Password123!');
      expect(createArg.passwordHash.length).toBeGreaterThan(20); // bcrypt hashes are long
    });

    it('defaults new self-registrations to TEAM_MEMBER role', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue(mockUser as any);

      await authService.register({
        name: 'Hashini',
        email: 'hashini@company.com',
        password: 'Password123!',
      });

      const createArg = usersService.create.mock.calls[0][0];
      expect(createArg.role).toBe(Role.TEAM_MEMBER);
    });

    it('returns a signed access token on successful registration', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue(mockUser as any);

      const result = await authService.register({
        name: 'Hashini',
        email: 'hashini@company.com',
        password: 'Password123!',
      });

      expect(result.accessToken).toBe('fake.jwt.token');
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'hashini@company.com' }),
      );
    });
  });

  describe('login', () => {
    it('throws UnauthorizedException when the user does not exist', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        authService.login({ email: 'ghost@company.com', password: 'anything' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when the password is wrong', async () => {
      const realHash = await bcrypt.hash('CorrectPassword1!', 10);
      usersService.findByEmail.mockResolvedValue({ ...mockUser, passwordHash: realHash } as any);

      await expect(
        authService.login({ email: mockUser.email, password: 'WrongPassword!' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when the account is deactivated', async () => {
      usersService.findByEmail.mockResolvedValue({ ...mockUser, isActive: false } as any);

      await expect(
        authService.login({ email: mockUser.email, password: 'whatever' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('returns an access token when credentials are correct', async () => {
      const realHash = await bcrypt.hash('CorrectPassword1!', 10);
      usersService.findByEmail.mockResolvedValue({ ...mockUser, passwordHash: realHash } as any);

      const result = await authService.login({
        email: mockUser.email,
        password: 'CorrectPassword1!',
      });

      expect(result.accessToken).toBe('fake.jwt.token');
      expect(result.user.email).toBe(mockUser.email);
    });
  });
});
