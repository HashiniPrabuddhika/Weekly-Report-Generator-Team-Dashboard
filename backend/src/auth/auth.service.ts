import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Role } from '../common/enums/role.enum';

const SALT_ROUNDS = 10;

export interface AuthResult {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const user = await this.usersService.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
      role: dto.role ?? Role.TEAM_MEMBER,
    });

    return this.buildAuthResult(user.id, user.name, user.email, user.role as Role);
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.usersService.findByEmail(dto.email);

    // Deliberately identical error for "no such user" and "wrong password" —
    // never reveal which one it was, that leaks whether an email is registered.
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.buildAuthResult(user.id, user.name, user.email, user.role as Role);
  }

  private async buildAuthResult(
    userId: string,
    name: string,
    email: string,
    role: Role,
  ): Promise<AuthResult> {
    const accessToken = await this.jwtService.signAsync({
      userId,
      email,
      name,
      role,
    });

    return {
      accessToken,
      user: { id: userId, name, email, role },
    };
  }
}
