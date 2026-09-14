export const Role = {
  TEAM_MEMBER: 'TEAM_MEMBER',
  MANAGER: 'MANAGER',
  ADMIN: 'ADMIN',
} as const;

export type Role = (typeof Role)[keyof typeof Role];
