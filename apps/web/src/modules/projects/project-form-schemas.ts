import { ProjectNameSchema } from '@flowment/domain';
import { z } from 'zod';
import { parseSystemDesign } from './system-design-json';

export const ProjectNameFormSchema = z.object({ name: ProjectNameSchema });

export const SystemDesignFormSchema = z.object({
  json: z.string().transform((text, ctx) => {
    const result = parseSystemDesign(text);

    if (!result.success) {
      for (const message of result.errors) {
        ctx.addIssue({ code: 'custom', message });
      }

      return z.NEVER;
    }

    return result.design;
  }),
});
