import {
  CoachActionSchema,
  HintOutcomeSchema,
  ObjectiveEvaluationSchema,
  type ObjectiveEvaluation,
} from '@flowment/domain';
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { InjectAiClient, type AiClient } from '../../infrastructure/ai';
import {
  CoachDraftSchema,
  HintDraftSchema,
  PossibleAnswerDraftSchema,
  type CoachAiProvider,
  type CoachDraft,
  type CoachInput,
  type HintDraft,
  type HintInput,
  type ObjectiveEvaluationInput,
  type PossibleAnswerDraft,
  type PossibleAnswerInput,
} from './coach-ai-provider';
import {
  CLARIFICATION_HINT_INSTRUCTIONS,
  HINT_INSTRUCTIONS,
  OBJECTIVE_EVALUATION_INSTRUCTIONS,
  OBJECTIVE_GAP_INSTRUCTIONS,
  OBJECTIVE_UNCLEAR_INSTRUCTIONS,
  OPEN_PROJECT_INSTRUCTIONS,
  POSSIBLE_ANSWER_INSTRUCTIONS,
} from './coach-prompts';

const OpenResponseFormat = z.object({
  type: z.enum(['question', 'next-action']),
  purpose: z.enum(['clarify', 'guide', 'review']).nullable(),
  action: CoachActionSchema.nullable(),
  text: z.string(),
  relatedStepIds: z.array(z.string()),
});

const ObjectiveQuestionFormat = z.object({
  text: z.string(),
  relatedStepIds: z.array(z.string()),
});

const HintFormat = z.object({
  outcome: HintOutcomeSchema,
  text: z.string(),
});

const PossibleAnswerFormat = z.object({
  approach: z.string(),
  rationale: z.string(),
  suggestedInteractions: z.array(
    z.object({ from: z.string(), to: z.string(), text: z.string() }),
  ),
});

const ObjectiveEvaluationFormat = z.object({
  status: z.enum(['satisfied', 'unsatisfied', 'indeterminate']),
  evidence: z.array(z.string()),
  summary: z.string().nullable(),
  gap: z.string().nullable(),
  reason: z.string().nullable(),
});

@Injectable()
export class PromptCoachAiProvider implements CoachAiProvider {
  constructor(@InjectAiClient() private readonly ai: AiClient) {}

  async generateCoachQuestion({
    context,
    focus,
  }: CoachInput): Promise<CoachDraft> {
    if (focus.kind === 'open') {
      const { type, purpose, action, text, relatedStepIds } =
        await this.ai.generateObject({
          name: 'coach_response',
          instructions: OPEN_PROJECT_INSTRUCTIONS,
          input: JSON.stringify({ context }),
          schema: OpenResponseFormat,
        });

      return CoachDraftSchema.parse(
        type === 'question'
          ? { type, purpose, text, relatedStepIds }
          : { type, action, text },
      );
    }

    const { kind, ...details } = focus;
    const { text, relatedStepIds } = await this.ai.generateObject({
      name: 'coach_question',
      instructions:
        kind === 'objective-gap'
          ? OBJECTIVE_GAP_INSTRUCTIONS
          : OBJECTIVE_UNCLEAR_INSTRUCTIONS,
      input: JSON.stringify({ context, ...details }),
      schema: ObjectiveQuestionFormat,
    });

    return CoachDraftSchema.parse({
      type: 'question',
      purpose: kind === 'objective-gap' ? 'review' : 'clarify',
      text,
      relatedStepIds,
    });
  }

  async generateHint({
    context,
    question,
    level,
    previousHints,
    objectives,
  }: HintInput): Promise<HintDraft> {
    const clarification =
      question.purpose === 'discover' || question.purpose === 'clarify';
    const output = await this.ai.generateObject({
      name: 'coach_hint',
      instructions: clarification
        ? CLARIFICATION_HINT_INSTRUCTIONS
        : HINT_INSTRUCTIONS,
      input: JSON.stringify({
        context,
        question,
        level,
        previousHints,
        ...(objectives.length > 0 ? { objectives } : {}),
      }),
      schema: HintFormat,
    });

    return HintDraftSchema.parse(output);
  }

  async generatePossibleAnswer({
    context,
    question,
    previousHints,
    objectives,
  }: PossibleAnswerInput): Promise<PossibleAnswerDraft> {
    const output = await this.ai.generateObject({
      name: 'coach_possible_answer',
      instructions: POSSIBLE_ANSWER_INSTRUCTIONS,
      input: JSON.stringify({
        context,
        question,
        previousHints,
        ...(objectives.length > 0 ? { objectives } : {}),
      }),
      schema: PossibleAnswerFormat,
    });

    return PossibleAnswerDraftSchema.parse(output);
  }

  async evaluateObjective({
    context,
    objective,
  }: ObjectiveEvaluationInput): Promise<ObjectiveEvaluation> {
    const { status, evidence, summary, gap, reason } =
      await this.ai.generateObject({
        name: 'objective_evaluation',
        instructions: OBJECTIVE_EVALUATION_INSTRUCTIONS,
        input: JSON.stringify({ context, objective }),
        schema: ObjectiveEvaluationFormat,
      });

    switch (status) {
      case 'satisfied':
        return ObjectiveEvaluationSchema.parse({ status, evidence, summary });
      case 'unsatisfied':
        return ObjectiveEvaluationSchema.parse({ status, evidence, gap });
      case 'indeterminate':
        return ObjectiveEvaluationSchema.parse({ status, reason });
    }
  }
}
