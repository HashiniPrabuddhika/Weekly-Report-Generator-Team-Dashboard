import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { PrismaService } from '../src/prisma/prisma.service';

export async function createTestApp(): Promise<{ app: INestApplication; prisma: PrismaService }> {
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();

  // Mirror main.ts exactly — an e2e test that skips this would pass for the
  // wrong reasons (validation errors that should be 400 would slip through).
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.init();

  const prisma = app.get(PrismaService);

  return { app, prisma };
}

/** Generates a unique email per test run so re-running tests never collides on the unique constraint. */
export function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}@e2e-test.local`;
}

export const VALID_PASSWORD = 'Password123!';

export const SAMPLE_REPORT_BODY = {
  tasks: [
    {
      taskName: 'Implement login page',
      priority: 'HIGH',
      plannedPercentage: 100,
      actualPercentage: 100,
      status: 'COMPLETED',
      plannedHours: 8,
      actualHours: 9,
      deliverable: 'PR #1',
    },
  ],
  plannedTasks: [{ taskName: 'Start on settings page', priority: 'MEDIUM' }],
  blockers: [{ description: 'Waiting on API keys from client', isKeyIssue: true }],
  achievements: [{ description: 'Finished login page ahead of schedule', isKeyAchievement: true }],
  timeEntries: [{ taskType: 'DEVELOPMENT', hours: 20 }],
};
