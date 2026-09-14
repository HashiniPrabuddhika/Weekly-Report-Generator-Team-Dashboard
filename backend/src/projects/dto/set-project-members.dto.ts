import { ArrayMaxSize, IsArray, IsUUID } from 'class-validator';

/**
 * Replace-the-full-set semantics: `userIds` becomes exactly the project's
 * assigned members. This matches how a "manage members" checklist UI
 * naturally works (check/uncheck members, save the resulting set) far
 * better than incremental add/remove endpoints would.
 */
export class SetProjectMembersDto {
  @IsArray()
  @ArrayMaxSize(200)
  @IsUUID('4', { each: true })
  userIds: string[];
}
