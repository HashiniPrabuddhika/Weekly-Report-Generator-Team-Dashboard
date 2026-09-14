import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../common/enums/role.enum';
import { CreateUserDto } from './dto/create-user.dto';

const SALT_ROUNDS = 10;

export interface CreateUserData {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
}

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: Date;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  create(data: CreateUserData) {
    return this.prisma.user.create({ data });
  }

  /**
   * Admin-only user creation. Unlike self-registration (AuthService.register),
   * an admin may set the role directly — this is the only place in the app
   * a MANAGER or ADMIN account can legitimately be created.
   */
  async createByAdmin(dto: CreateUserDto): Promise<SafeUser> {
    const existing = await this.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = await this.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
      role: dto.role,
    });

    return this.toSafeUser(user);
  }

  async findAllSanitized(): Promise<SafeUser[]> {
    const users = await this.prisma.user.findMany({ orderBy: { createdAt: 'asc' } });
    return users.map((u: any) => this.toSafeUser(u));
  }

  async updateRole(id: string, role: Role): Promise<SafeUser> {
    await this.assertExists(id);
    const updated = await this.prisma.user.update({ where: { id }, data: { role } });
    return this.toSafeUser(updated);
  }

  /**
   * "Removing" a team member deactivates rather than deletes — hard-deleting
   * a user would either violate the FK on their existing reports or silently
   * destroy report history. Deactivating blocks login while preserving data.
   */
  async setActive(id: string, isActive: boolean): Promise<SafeUser> {
    await this.assertExists(id);
    const updated = await this.prisma.user.update({ where: { id }, data: { isActive } });
    return this.toSafeUser(updated);
  }

  private async assertExists(id: string) {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return user;
  }

  private toSafeUser(user: {
    id: string;
    name: string;
    email: string;
    role: Role;
    isActive: boolean;
    createdAt: Date;
  }): SafeUser {
    const { id, name, email, role, isActive, createdAt } = user;
    return { id, name, email, role, isActive, createdAt };
  }
}
