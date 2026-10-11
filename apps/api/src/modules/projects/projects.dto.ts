import { ProjectNameSchema, SystemDesignSchema } from '@flowment/domain';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { PaginationQuerySchema, paginatedSchema } from '../../shared/http';
import { isoDate } from '../../shared/zod/openapi-helpers';

export const CreateProjectSchema = z.object({
  name: ProjectNameSchema,
  systemDesign: SystemDesignSchema.optional(),
});

export const UpdateProjectSchema = z
  .object({
    name: ProjectNameSchema.optional(),
    systemDesign: SystemDesignSchema.optional(),
  })
  .refine(
    (update) => update.name !== undefined || update.systemDesign !== undefined,
    'Provide name or systemDesign',
  );

export const ProjectSummarySchema = z.object({
  id: z.uuid(),
  name: z.string(),
  createdAt: isoDate,
  updatedAt: isoDate,
});

export const ProjectSchema = ProjectSummarySchema.extend({
  systemDesign: SystemDesignSchema,
});

export const ProjectListSchema = paginatedSchema(ProjectSummarySchema);

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;
export type Project = z.output<typeof ProjectSchema>;
export type ProjectSummary = z.output<typeof ProjectSummarySchema>;
export type ProjectList = z.output<typeof ProjectListSchema>;

export class CreateProjectDto extends createZodDto(CreateProjectSchema) {}
export class UpdateProjectDto extends createZodDto(UpdateProjectSchema) {}
export class ListProjectsQueryDto extends createZodDto(PaginationQuerySchema) {}
export class ProjectDto extends createZodDto(ProjectSchema, { codec: true }) {}
export class ProjectListDto extends createZodDto(ProjectListSchema, {
  codec: true,
}) {}
