import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp, uniqueEmail, VALID_PASSWORD, SAMPLE_REPORT_BODY } from './test-utils';

describe('Report review/correction workflow (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let projectId: string;
  let managerId: string;
  let managerToken: string;
  let memberId: string;
  let memberToken: string;
  let reportId: string;

  const memberEmail = uniqueEmail('workflow-member');
  const managerEmail = uniqueEmail('workflow-manager');

  beforeAll(async () => {
    const setup = await createTestApp();
    app = setup.app;
    prisma = setup.prisma;

    const project = await prisma.project.create({
      data: { name: `E2E Workflow Project ${Date.now()}` },
    });
    projectId = project.id;

    // A manager account can't be created via self-registration (Phase 3 rule:
    // register always defaults to TEAM_MEMBER), so we create it directly for
    // this test fixture, the same way the seed script does.
    const passwordHash = await bcrypt.hash(VALID_PASSWORD, 10);
    const manager = await prisma.user.create({
      data: { name: 'E2E Manager', email: managerEmail, passwordHash, role: 'MANAGER' },
    });
    managerId = manager.id;

    const managerLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: managerEmail, password: VALID_PASSWORD });
    managerToken = managerLogin.body.accessToken;

    const memberRegister = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: 'E2E Team Member', email: memberEmail, password: VALID_PASSWORD });
    memberToken = memberRegister.body.accessToken;
    memberId = memberRegister.body.user.id;
  });

  afterAll(async () => {
    await prisma.reportReview.deleteMany({ where: { reviewerId: managerId } });
    await prisma.report.deleteMany({ where: { userId: memberId } });
    await prisma.user.deleteMany({ where: { email: { in: [memberEmail, managerEmail] } } });
    await prisma.project.delete({ where: { id: projectId } });
    await app.close();
  });

  it('Step 1: team member creates a draft report', async () => {
    const res = await request(app.getHttpServer())
      .post('/reports')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        projectId,
        weekStart: '2026-02-02',
        weekEnd: '2026-02-08',
        ...SAMPLE_REPORT_BODY,
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('DRAFT');
    reportId = res.body.id;
  });

  it('Step 2: team member submits the report', async () => {
    const res = await request(app.getHttpServer())
      .post(`/reports/${reportId}/submit`)
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('SUBMITTED');
  });

  it("Step 2b: the report now appears in the manager's team-wide list", async () => {
    const res = await request(app.getHttpServer())
      .get('/manager/reports')
      .query({ status: 'SUBMITTED' })
      .set('Authorization', `Bearer ${managerToken}`);

    expect(res.status).toBe(200);
    const ids = res.body.data.map((r: { id: string }) => r.id);
    expect(ids).toContain(reportId);
  });

  it('Step 3: manager requests changes with a comment', async () => {
    const res = await request(app.getHttpServer())
      .post(`/reports/${reportId}/review`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ action: 'CHANGES_REQUESTED', comment: 'Please add the deliverable link.' });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('NEEDS_CORRECTION');
  });

  it('rejects "request changes" with no comment (400)', async () => {
    // Re-submit first so there is a SUBMITTED report to test against
    await request(app.getHttpServer())
      .patch(`/reports/${reportId}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        projectId,
        weekStart: '2026-02-02',
        weekEnd: '2026-02-08',
        ...SAMPLE_REPORT_BODY,
      });
    await request(app.getHttpServer())
      .post(`/reports/${reportId}/submit`)
      .set('Authorization', `Bearer ${memberToken}`);

    const res = await request(app.getHttpServer())
      .post(`/reports/${reportId}/review`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ action: 'CHANGES_REQUESTED' }); // no comment

    expect(res.status).toBe(400);
  });

  it('Step 4: team member sees the correction comment on their report', async () => {
    const res = await request(app.getHttpServer())
      .get(`/reports/${reportId}`)
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('NEEDS_CORRECTION');
    expect(res.body.reviews[0].comment).toBe('Please add the deliverable link.');
  });

  it('Step 5: team member edits the report while NEEDS_CORRECTION', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/reports/${reportId}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        projectId,
        weekStart: '2026-02-02',
        weekEnd: '2026-02-08',
        tasks: [
          {
            ...SAMPLE_REPORT_BODY.tasks[0],
            deliverable: 'https://github.com/example/repo/pull/1',
          },
        ],
        plannedTasks: SAMPLE_REPORT_BODY.plannedTasks,
        blockers: SAMPLE_REPORT_BODY.blockers,
        achievements: SAMPLE_REPORT_BODY.achievements,
        timeEntries: SAMPLE_REPORT_BODY.timeEntries,
      });

    expect(res.status).toBe(200);
    expect(res.body.tasks[0].deliverable).toBe('https://github.com/example/repo/pull/1');
  });

  it('Step 6: team member resubmits — version number increments to 2', async () => {
    const res = await request(app.getHttpServer())
      .post(`/reports/${reportId}/submit`)
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('SUBMITTED');
    expect(res.body.versions[0].versionNumber).toBe(3); // v1 (first submit) + v2 (resubmit in the 400 test) + v3 (this resubmit)
  });

  it('Step 7: manager approves the report', async () => {
    const res = await request(app.getHttpServer())
      .post(`/reports/${reportId}/review`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ action: 'APPROVED' });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('APPROVED');
  });

  it('cannot edit an APPROVED report (400)', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/reports/${reportId}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        projectId,
        weekStart: '2026-02-02',
        weekEnd: '2026-02-08',
        ...SAMPLE_REPORT_BODY,
      });

    expect(res.status).toBe(400);
  });

  it('cannot submit an already-APPROVED report again (400)', async () => {
    const res = await request(app.getHttpServer())
      .post(`/reports/${reportId}/submit`)
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(400);
  });

  it('past versions remain visible on demand after approval', async () => {
    const res = await request(app.getHttpServer())
      .get(`/reports/${reportId}`)
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(200);
    expect(res.body.versions.length).toBe(3);
  });
});
