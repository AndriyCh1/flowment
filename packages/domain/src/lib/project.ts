import { z } from 'zod';

export const ProjectNameSchema = z
  .string()
  .trim()
  .min(1, 'Enter a project name');

export type ProjectName = z.infer<typeof ProjectNameSchema>;
