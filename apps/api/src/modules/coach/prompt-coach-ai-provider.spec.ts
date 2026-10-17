import type { ExerciseObjective } from '@flowment/domain';
import { ZodError } from 'zod';
import type { AiClient, GenerateObjectRequest } from '../../infrastructure/ai';
import type { CoachContext } from './coach-context';
import {
  CLARIFICATION_HINT_INSTRUCTIONS,
  HINT_INSTRUCTIONS,
  OBJECTIVE_EVALUATION_INSTRUCTIONS,
  OBJECTIVE_GAP_INSTRUCTIONS,
  OBJECTIVE_UNCLEAR_INSTRUCTIONS,
  OPEN_PROJECT_INSTRUCTIONS,
  POSSIBLE_ANSWER_INSTRUCTIONS,
} from './coach-prompts';
import { PromptCoachAiProvider } from './prompt-coach-ai-provider';

type RecordedRequest = Omit<GenerateObjectRequest<never>, 'schema'>;

const context: CoachContext = {
  projectId: 'project-1',
  mode: 'open-project',
  exercise: null,
  designRevision: 'abc12345',
  modelingIntent: 'A notification system',
  components: [],
  scenarios: [],
  assumptions: [],
  conversation: [],
};

const objective: ExerciseObjective = {
  id: 'o1',
  description: 'Show how the Worker obtains the file location',
};

function setup(modelOutput: unknown) {
  const requests: RecordedRequest[] = [];
  const client: AiClient = {
    generateObject: async ({ schema, ...request }) => {
      requests.push(request);
      return schema.parse(modelOutput);
    },
  };
  return { provider: new PromptCoachAiProvider(client), requests };
}

describe('PromptCoachAiProvider', () => {
  describe('generateCoachQuestion for an open project', () => {
    it('sends the context with the open-project instructions', async () => {
      const { provider, requests } = setup({
        type: 'question',
        purpose: 'clarify',
        action: null,
        text: 'Sending or receiving?',
        relatedStepIds: [],
      });

      await provider.generateCoachQuestion({
        context,
        focus: { kind: 'open' },
      });

      expect(requests).toEqual([
        {
          name: 'coach_response',
          instructions: OPEN_PROJECT_INSTRUCTIONS,
          input: JSON.stringify({ context }),
        },
      ]);
    });

    it('returns a question draft', async () => {
      const { provider } = setup({
        type: 'question',
        purpose: 'review',
        action: null,
        text: 'How does the Worker get the key?',
        relatedStepIds: ['s3'],
      });

      const draft = await provider.generateCoachQuestion({
        context,
        focus: { kind: 'open' },
      });

      expect(draft).toEqual({
        type: 'question',
        purpose: 'review',
        text: 'How does the Worker get the key?',
        relatedStepIds: ['s3'],
      });
    });

    it('returns a suggested action draft', async () => {
      const { provider } = setup({
        type: 'next-action',
        purpose: null,
        action: 'create-scenario',
        text: 'Add a scenario for sending one notification.',
        relatedStepIds: [],
      });

      const draft = await provider.generateCoachQuestion({
        context,
        focus: { kind: 'open' },
      });

      expect(draft).toEqual({
        type: 'next-action',
        action: 'create-scenario',
        text: 'Add a scenario for sending one notification.',
      });
    });

    it('rejects a question without a purpose', async () => {
      const { provider } = setup({
        type: 'question',
        purpose: null,
        action: null,
        text: 'Why?',
        relatedStepIds: [],
      });

      await expect(
        provider.generateCoachQuestion({ context, focus: { kind: 'open' } }),
      ).rejects.toThrow(ZodError);
    });

    it('rejects an action without a kind', async () => {
      const { provider } = setup({
        type: 'next-action',
        purpose: null,
        action: null,
        text: 'Do something.',
        relatedStepIds: [],
      });

      await expect(
        provider.generateCoachQuestion({ context, focus: { kind: 'open' } }),
      ).rejects.toThrow(ZodError);
    });

    it('rejects blank text', async () => {
      const { provider } = setup({
        type: 'question',
        purpose: 'guide',
        action: null,
        text: '   ',
        relatedStepIds: [],
      });

      await expect(
        provider.generateCoachQuestion({ context, focus: { kind: 'open' } }),
      ).rejects.toThrow(ZodError);
    });
  });

  describe('generateCoachQuestion for an exercise objective', () => {
    it('asks a review question about a gap', async () => {
      const { provider, requests } = setup({
        text: 'What does the Worker know at step 3?',
        relatedStepIds: ['s3'],
      });

      const draft = await provider.generateCoachQuestion({
        context,
        focus: {
          kind: 'objective-gap',
          objective,
          gap: 'The Worker never obtains the file location',
          evidence: ['No step loads the job'],
        },
      });

      expect(requests).toEqual([
        {
          name: 'coach_question',
          instructions: OBJECTIVE_GAP_INSTRUCTIONS,
          input: JSON.stringify({
            context,
            objective,
            gap: 'The Worker never obtains the file location',
            evidence: ['No step loads the job'],
          }),
        },
      ]);
      expect(draft).toEqual({
        type: 'question',
        purpose: 'review',
        text: 'What does the Worker know at step 3?',
        relatedStepIds: ['s3'],
      });
    });

    it('asks a clarifying question when the objective is unclear', async () => {
      const { provider, requests } = setup({
        text: 'Where is the file stored?',
        relatedStepIds: [],
      });

      const draft = await provider.generateCoachQuestion({
        context,
        focus: {
          kind: 'objective-unclear',
          objective,
          reason: 'Storage is not described',
        },
      });

      expect(requests).toEqual([
        {
          name: 'coach_question',
          instructions: OBJECTIVE_UNCLEAR_INSTRUCTIONS,
          input: JSON.stringify({
            context,
            objective,
            reason: 'Storage is not described',
          }),
        },
      ]);
      expect(draft).toMatchObject({ type: 'question', purpose: 'clarify' });
    });
  });

  describe('generateHint', () => {
    const reviewQuestion = {
      purpose: 'review' as const,
      text: 'How does the Worker get the file key?',
      relatedStepIds: ['s3'],
    };

    it('sends a reasoning question with the leveled hint instructions', async () => {
      const { provider, requests } = setup({
        outcome: 'hint',
        text: 'Look at step 3.',
      });

      const draft = await provider.generateHint({
        context,
        question: reviewQuestion,
        level: 2,
        previousHints: ['Look at the Worker.'],
        objectives: [],
      });

      expect(requests).toEqual([
        {
          name: 'coach_hint',
          instructions: HINT_INSTRUCTIONS,
          input: JSON.stringify({
            context,
            question: reviewQuestion,
            level: 2,
            previousHints: ['Look at the Worker.'],
          }),
        },
      ]);
      expect(draft).toEqual({ outcome: 'hint', text: 'Look at step 3.' });
    });

    it('sends a clarification with the interpretation instructions', async () => {
      const { provider, requests } = setup({
        outcome: 'hint',
        text: 'It asks which half of the flow to start with.',
      });

      await provider.generateHint({
        context,
        question: { purpose: 'clarify', text: 'Sending or receiving?' },
        level: 1,
        previousHints: [],
        objectives: [],
      });

      expect(requests[0].instructions).toBe(CLARIFICATION_HINT_INSTRUCTIONS);
    });

    it('includes the objectives in an exercise', async () => {
      const { provider, requests } = setup({
        outcome: 'resolved',
        text: 'Step 2 settles it.',
      });

      const draft = await provider.generateHint({
        context,
        question: reviewQuestion,
        level: 1,
        previousHints: [],
        objectives: [objective],
      });

      expect(JSON.parse(requests[0].input)).toMatchObject({
        objectives: [objective],
      });
      expect(draft).toEqual({ outcome: 'resolved', text: 'Step 2 settles it.' });
    });

    it('rejects blank text', async () => {
      const { provider } = setup({ outcome: 'hint', text: ' ' });

      await expect(
        provider.generateHint({
          context,
          question: reviewQuestion,
          level: 1,
          previousHints: [],
          objectives: [],
        }),
      ).rejects.toThrow(ZodError);
    });
  });

  describe('generatePossibleAnswer', () => {
    const reviewQuestion = {
      purpose: 'review' as const,
      text: 'How does the Worker get the file key?',
      relatedStepIds: ['s3'],
    };

    const previousHints = [
      'Look at step 3.',
      'The Worker has a job id. What does it need?',
      'Consider loading the stored job first.',
    ];

    const modelOutput = {
      approach: 'Before step 3, the Worker loads the job from the Job DB.',
      rationale: 'The stored job holds the file key the Worker needs.',
      suggestedInteractions: [
        { from: 'Worker', to: 'Job DB', text: 'Load job(jobId)' },
        { from: 'Job DB', to: 'Worker', text: 'Job { sourceFileKey }' },
      ],
    };

    it('sends the question and the hints with the possible answer instructions', async () => {
      const { provider, requests } = setup(modelOutput);

      const draft = await provider.generatePossibleAnswer({
        context,
        question: reviewQuestion,
        previousHints,
        objectives: [],
      });

      expect(requests).toEqual([
        {
          name: 'coach_possible_answer',
          instructions: POSSIBLE_ANSWER_INSTRUCTIONS,
          input: JSON.stringify({
            context,
            question: reviewQuestion,
            previousHints,
          }),
        },
      ]);
      expect(draft).toEqual(modelOutput);
    });

    it('includes the objectives in an exercise', async () => {
      const { provider, requests } = setup(modelOutput);

      await provider.generatePossibleAnswer({
        context,
        question: reviewQuestion,
        previousHints,
        objectives: [objective],
      });

      expect(JSON.parse(requests[0].input)).toMatchObject({
        objectives: [objective],
      });
    });

    it('accepts an answer without a suggested sequence', async () => {
      const { provider } = setup({ ...modelOutput, suggestedInteractions: [] });

      const draft = await provider.generatePossibleAnswer({
        context,
        question: reviewQuestion,
        previousHints,
        objectives: [],
      });

      expect(draft.suggestedInteractions).toEqual([]);
    });

    it('rejects a blank rationale', async () => {
      const { provider } = setup({ ...modelOutput, rationale: ' ' });

      await expect(
        provider.generatePossibleAnswer({
          context,
          question: reviewQuestion,
          previousHints,
          objectives: [],
        }),
      ).rejects.toThrow(ZodError);
    });

    it('rejects a suggested interaction without a receiver', async () => {
      const { provider } = setup({
        ...modelOutput,
        suggestedInteractions: [{ from: 'Worker', to: '', text: 'Load job' }],
      });

      await expect(
        provider.generatePossibleAnswer({
          context,
          question: reviewQuestion,
          previousHints,
          objectives: [],
        }),
      ).rejects.toThrow(ZodError);
    });
  });

  describe('evaluateObjective', () => {
    it('sends the context and the objective', async () => {
      const { provider, requests } = setup({
        status: 'indeterminate',
        evidence: [],
        summary: null,
        gap: null,
        reason: 'No steps yet',
      });

      await provider.evaluateObjective({ context, objective });

      expect(requests).toEqual([
        {
          name: 'objective_evaluation',
          instructions: OBJECTIVE_EVALUATION_INSTRUCTIONS,
          input: JSON.stringify({ context, objective }),
        },
      ]);
    });

    it('returns each status in its own shape', async () => {
      const satisfied = setup({
        status: 'satisfied',
        evidence: ['step 2'],
        summary: 'Done',
        gap: null,
        reason: null,
      });
      const unsatisfied = setup({
        status: 'unsatisfied',
        evidence: ['step 2'],
        summary: null,
        gap: 'No lookup',
        reason: null,
      });
      const indeterminate = setup({
        status: 'indeterminate',
        evidence: [],
        summary: null,
        gap: null,
        reason: 'No steps yet',
      });

      expect(
        await satisfied.provider.evaluateObjective({ context, objective }),
      ).toEqual({ status: 'satisfied', evidence: ['step 2'], summary: 'Done' });
      expect(
        await unsatisfied.provider.evaluateObjective({ context, objective }),
      ).toEqual({
        status: 'unsatisfied',
        evidence: ['step 2'],
        gap: 'No lookup',
      });
      expect(
        await indeterminate.provider.evaluateObjective({ context, objective }),
      ).toEqual({ status: 'indeterminate', reason: 'No steps yet' });
    });

    it('rejects a satisfied evaluation without a summary', async () => {
      const { provider } = setup({
        status: 'satisfied',
        evidence: [],
        summary: null,
        gap: null,
        reason: null,
      });

      await expect(
        provider.evaluateObjective({ context, objective }),
      ).rejects.toThrow(ZodError);
    });
  });
});
