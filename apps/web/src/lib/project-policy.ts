import { and, eq, isNull, or } from 'drizzle-orm';
import { projects } from '@/db/schema';

export interface ProjectOwner {
  id?: string;
  username: string;
}

export function ownsProject(
  user: ProjectOwner,
  project: { userId: string | null; repoOwner: string },
) {
  return project.userId
    ? project.userId === user.id
    : project.repoOwner.toLowerCase() === user.username.toLowerCase();
}

export function ownedProjects(user: ProjectOwner) {
  return or(
    user.id ? eq(projects.userId, user.id) : undefined,
    and(isNull(projects.userId), eq(projects.repoOwner, user.username)),
  )!;
}
