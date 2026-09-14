import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from '../../common/enums/role.enum';

export class RegisterDto {
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  name: string;

  @IsEmail({}, { message: 'A valid email address is required' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;

  // Optional: in production, only an ADMIN should be able to set this
  // (see UsersController.updateRole for the admin-only role change endpoint).
  // Left optional here so open self-registration defaults to TEAM_MEMBER.
  @IsOptional()
  @IsEnum(Role, { message: 'role must be one of TEAM_MEMBER, MANAGER, ADMIN' })
  role?: Role;
}
