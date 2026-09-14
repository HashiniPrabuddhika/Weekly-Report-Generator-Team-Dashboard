import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(includeInactive = false) {
    return this.prisma.project.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) {
      throw new NotFoundException(`Project ${id} not found`);
    }
    return project;
  }

  async create(dto: CreateProjectDto) {
    const existing = await this.prisma.project.findUnique({ where: { name: dto.name } });
    if (existing) {
      throw new ConflictException(`A project named "${dto.name}" already exists`);
    }
    return this.prisma.project.create({ data: dto });
  }

  async update(id: string, dto: UpdateProjectDto) {
    await this.findOne(id); // 404s cleanly if it doesn't exist
    return this.prisma.project.update({ where: { id }, data: dto });
  }

  /**
   * Soft delete: projects are usually referenced by historical reports,
   * so a hard DELETE would either fail on the FK constraint or silently
   * orphan report history. Deactivating preserves everything and simply
   * hides the project from "active" pickers going forward.
   */
  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.project.update({ where: { id }, data: { isActive: false } });
  }

  /** The team members currently assigned to this project. */
  async getMembers(id: string) {
    await this.findOne(id); // 404s cleanly if the project doesn't exist

    const links = await this.prisma.userProject.findMany({
      where: { projectId: id },
      include: {
        user: { select: { id: true, name: true, email: true, isActive: true } },
      },
      orderBy: { user: { name: 'asc' } },
    });

    return links.map(
      (link: { user: { id: string; name: string; email: string; isActive: boolean } }) => link.user,
    );
  }

  /**
   * Replaces the project's full member set in one transaction: clears the
   * existing assignments and inserts the given userIds. De-duped so a
   * repeated id in the request body can't cause a unique-constraint error.
   */
  async setMembers(id: string, userIds: string[]) {
    await this.findOne(id);

    const uniqueIds = [...new Set(userIds)];

    if (uniqueIds.length > 0) {
      const existingCount = await this.prisma.user.count({
        where: { id: { in: uniqueIds } },
      });
      if (existingCount !== uniqueIds.length) {
        throw new NotFoundException('One or more users were not found');
      }
    }

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.userProject.deleteMany({ where: { projectId: id } });
      if (uniqueIds.length > 0) {
        await tx.userProject.createMany({
          data: uniqueIds.map((userId) => ({ projectId: id, userId })),
        });
      }
    });

    return this.getMembers(id);
  }
}
