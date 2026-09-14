import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp, uniqueEmail, VALID_PASSWORD, SAMPLE_REPORT_BODY } from './test-utils';

describe('RBAC (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let projectId: string;

  let userAToken: string;
  let userAId: string;
  let userBToken: string;

  const emailA = uniqueEmail('rbac-user-a');
  const emailB = uniqueEmail('rbac-user-b');

  beforeAll(async () => {
    const setup = await createTestApp();
    app = setup.app;
    prisma = setup.prisma;

    const project = await prisma.project.create({
      data: { name: `E2E RBAC Project ${Date.now()}` },
    });
    projectId = project.id;

    const registerA = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: 'RBAC User A', email: emailA, password: VALID_PASSWORD });
    userAToken = registerA.body.accessToken;
    userAId = registerA.body.user.id;

    const registerB = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: 'RBAC User B', email: emailB, password: VALID_PASSWORD });
    userBToken = registerB.body.accessToken;
  });

  afterAll(async () => {
    await prisma.report.deleteMany({ where: { userId: userAId } });
    await prisma.user.deleteMany({ where: { email: { in: [emailA, emailB] } } });
    await prisma.project.delete({ where: { id: projectId } });
    await app.close();
  });

  it('rejects login with the wrong password (401)', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: emailA, password: 'WrongPassword!' });

    expect(res.status).toBe(401);
  });

  it('rejects any request to a protected route with no token (401)', async () => {
    const res = await request(app.getHttpServer()).get('/auth/me');
    expect(res.status).toBe(401);
  });

  it('a TEAM_MEMBER cannot reach a MANAGER-only endpoint (403)', async () => {
    const res = await request(app.getHttpServer())
      .get('/manager/reports')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(403);
  });

  it('a TEAM_MEMBER cannot create a project — MANAGER/ADMIN only (403)', async () => {
    const res = await request(app.getHttpServer())
      .post('/projects')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ name: 'Should not be allowed' });

    expect(res.status).toBe(403);
  });

  it("User A cannot read User B-owned data: User B cannot access User A's report (403)", async () => {
    const createRes = await request(app.getHttpServer())
      .post('/reports')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        projectId,
        weekStart: '2026-01-05',
        weekEnd: '2026-01-11',
        ...SAMPLE_REPORT_BODY,
      });
    expect(createRes.status).toBe(201);
    const reportId = createRes.body.id;

    const crossAccess = await request(app.getHttpServer())
      .get(`/reports/${reportId}`)
      .set('Authorization', `Bearer ${userBToken}`);

    expect(crossAccess.status).toBe(403);

    // Sanity check: the actual owner CAN read it
    const ownAccess = await request(app.getHttpServer())
      .get(`/reports/${reportId}`)
      .set('Authorization', `Bearer ${userAToken}`);
    expect(ownAccess.status).toBe(200);
  });

  it('a TEAM_MEMBER cannot call the manager review endpoint (403)', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/reports')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        projectId,
        weekStart: '2026-01-12',
        weekEnd: '2026-01-18',
        ...SAMPLE_REPORT_BODY,
      });
    const reportId = createRes.body.id;

    const res = await request(app.getHttpServer())
      .post(`/reports/${reportId}/review`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ action: 'APPROVED' });

    expect(res.status).toBe(403);
  });
});
