import type { SystemDesign } from '@flowment/domain';
import { Injectable } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import { InjectDb, projects, type Db } from '../../infrastructure/database';
import type { PaginationQuery } from '../../shared/http';
import type {
  CreateProjectInput,
  Project,
  ProjectList,
  UpdateProjectInput,
} from './projects.dto';
import { ProjectNotFoundError } from './projects.errors';

function emptySystemDesign(): SystemDesign {
  return { components: [], scenarios: [], assumptions: [] };
}

@Injectable()
export class ProjectsService {
  constructor(@InjectDb() private readonly db: Db) {}

  async create(input: CreateProjectInput): Promise<Project> {
    const [project] = await this.db
      .insert(projects)
      .values({
        name: input.name,
        systemDesign: input.systemDesign ?? emptySystemDesign(),
      })
      .returning();
    return project;
  }

  async list({ limit, offset }: PaginationQuery): Promise<ProjectList> {
    const [items, total] = await Promise.all([
      this.db
        .select({
          id: projects.id,
          name: projects.name,
          createdAt: projects.createdAt,
          updatedAt: projects.updatedAt,
        })
        .from(projects)
        .orderBy(desc(projects.updatedAt), desc(projects.id))
        .limit(limit)
        .offset(offset),
      this.db.$count(projects),
    ]);
    return { items, total, limit, offset };
  }

  async get(id: string): Promise<Project> {
    const [project] = await this.db
      .select()
      .from(projects)
      .where(eq(projects.id, id));
    if (!project) {
      throw new ProjectNotFoundError(id);
    }
    return project;
  }

  async update(id: string, input: UpdateProjectInput): Promise<Project> {
    const [project] = await this.db
      .update(projects)
      .set({ name: input.name, systemDesign: input.systemDesign })
      .where(eq(projects.id, id))
      .returning();
    if (!project) {
      throw new ProjectNotFoundError(id);
    }
    return project;
  }
}
