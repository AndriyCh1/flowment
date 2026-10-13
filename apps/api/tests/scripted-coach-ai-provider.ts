import type { ObjectiveEvaluation } from '@flowment/domain';
import type {
  CoachAiProvider,
  CoachDraft,
  CoachInput,
  ObjectiveEvaluationInput,
} from '../src/modules/coach';

type Scripted = unknown | (() => unknown);

async function play(queue: Scripted[], method: string): Promise<unknown> {
  if (queue.length === 0) {
    throw new Error(`No scripted response left for ${method}`);
  }
  const next = queue.shift();
  if (next instanceof Error) {
    throw next;
  }
  return typeof next === 'function' ? next() : next;
}

export class ScriptedCoachAiProvider implements CoachAiProvider {
  readonly questionInputs: CoachInput[] = [];
  readonly evaluationInputs: ObjectiveEvaluationInput[] = [];
  private readonly questions: Scripted[] = [];
  private readonly evaluations: Scripted[] = [];

  willRespond(...responses: Scripted[]): void {
    this.questions.push(...responses);
  }

  willEvaluate(...responses: Scripted[]): void {
    this.evaluations.push(...responses);
  }

  reset(): void {
    this.questionInputs.length = 0;
    this.evaluationInputs.length = 0;
    this.questions.length = 0;
    this.evaluations.length = 0;
  }

  async generateCoachQuestion(input: CoachInput): Promise<CoachDraft> {
    this.questionInputs.push(structuredClone(input));
    return (await play(this.questions, 'generateCoachQuestion')) as CoachDraft;
  }

  async evaluateObjective(
    input: ObjectiveEvaluationInput,
  ): Promise<ObjectiveEvaluation> {
    this.evaluationInputs.push(structuredClone(input));
    return (await play(
      this.evaluations,
      'evaluateObjective',
    )) as ObjectiveEvaluation;
  }
}
