import type { Report } from "./report";

export interface ManagerReportListItem extends Report {
  user: { id: string; name: string; email: string };
}

/**
 * Single-report detail as returned by GET /manager/reports/:id. Narrows
 * `user` to required (vs. optional on the base Report) because this
 * endpoint is manager-only and the backend always includes the report's
 * owner — unlike the member-facing GET /reports/:id, which a caller could
 * in principle read without needing to know who "they" are.
 */
export interface ManagerReport extends Report {
  user: { id: string; name: string; email: string };
}

export interface TeamMemberSummary {
  id: string;
  name: string;
  email: string;
  _count: { reports: number };
}

export interface TeamMemberProfile {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
  };
  reports: Report[];
  stats: {
    totalReports: number;
    approvedCount: number;
    correctionCount: number;
  };
}
