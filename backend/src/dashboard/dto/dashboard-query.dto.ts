import { IsDateString, IsOptional } from 'class-validator';

export class DashboardQueryDto {
  // The Monday of the target week. If omitted, endpoints default to the
  // current week (computed server-side) or return all-time data, per endpoint.
  @IsOptional()
  @IsDateString()
  week?: string;
}
