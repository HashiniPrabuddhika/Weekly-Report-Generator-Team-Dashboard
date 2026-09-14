// Mirrors the `Role` enum in prisma/schema.prisma exactly.
// Prisma generates enums as a string-literal union under the hood, so this
// type is structurally compatible with `@prisma/client`'s generated Role —
// no casting needed once `npx prisma generate` has been run.

export const Role = {
  TEAM_MEMBER: 'TEAM_MEMBER',
  MANAGER: 'MANAGER',
  ADMIN: 'ADMIN',
} as const;

export type Role = (typeof Role)[keyof typeof Role];
