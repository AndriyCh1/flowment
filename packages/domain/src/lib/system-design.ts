import { z } from 'zod';
import { AssumptionSchema } from './assumption.js';
import { ComponentSchema } from './component.js';
import { SequenceScenarioSchema } from './scenario.js';
import { reportDuplicateIds, reportUnknownComponent } from './validation.js';

export const SystemDesignSchema = z
  .object({
    components: z.array(ComponentSchema),
    scenarios: z.array(SequenceScenarioSchema),
    assumptions: z.array(AssumptionSchema),
  })
  .superRefine((design, ctx) => {
    reportDuplicateIds(design.components, ['components'], 'component', ctx);
    reportDuplicateIds(design.scenarios, ['scenarios'], 'scenario', ctx);
    reportDuplicateIds(design.assumptions, ['assumptions'], 'assumption', ctx);

    const componentIds = new Set(design.components.map((component) => component.id));

    design.scenarios.forEach((scenario, scenarioIndex) => {
      const scenarioPath = ['scenarios', scenarioIndex];

      scenario.initialFacts.forEach((initialFact, factIndex) => {
        reportUnknownComponent(
          componentIds,
          initialFact.componentId,
          [...scenarioPath, 'initialFacts', factIndex, 'componentId'],
          ctx,
        );
      });

      scenario.steps.forEach((step, stepIndex) => {
        const stepPath = [...scenarioPath, 'steps', stepIndex];
        if (step.type === 'interaction') {
          reportUnknownComponent(componentIds, step.from, [...stepPath, 'from'], ctx);
          reportUnknownComponent(componentIds, step.to, [...stepPath, 'to'], ctx);
        } else if (step.componentId !== undefined) {
          reportUnknownComponent(componentIds, step.componentId, [...stepPath, 'componentId'], ctx);
        }
      });
    });
  });

export type SystemDesign = z.infer<typeof SystemDesignSchema>;
