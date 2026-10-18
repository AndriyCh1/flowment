import type { ObjectiveEvaluation, ReviewFeedback } from '@flowment/domain';
import type {
  CoachAiProvider,
  CoachDraft,
  CoachInput,
  HintDraft,
  HintInput,
  ObjectiveEvaluationInput,
  PossibleAnswerDraft,
  PossibleAnswerInput,
  ReviewInput,
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
  readonly hintInputs: HintInput[] = [];
  readonly possibleAnswerInputs: PossibleAnswerInput[] = [];
  readonly evaluationInputs: ObjectiveEvaluationInput[] = [];
  readonly reviewInputs: ReviewInput[] = [];
  private readonly questions: Scripted[] = [];
  private readonly hints: Scripted[] = [];
  private readonly possibleAnswers: Scripted[] = [];
  private readonly evaluations: Scripted[] = [];
  private readonly reviews: Scripted[] = [];

  willRespond(...responses: Scripted[]): void {
    this.questions.push(...responses);
  }

  willHint(...responses: Scripted[]): void {
    this.hints.push(...responses);
  }

  willAnswer(...responses: Scripted[]): void {
    this.possibleAnswers.push(...responses);
  }

  willEvaluate(...responses: Scripted[]): void {
    this.evaluations.push(...responses);
  }

  willReview(...responses: Scripted[]): void {
    this.reviews.push(...responses);
  }

  reset(): void {
    this.questionInputs.length = 0;
    this.hintInputs.length = 0;
    this.possibleAnswerInputs.length = 0;
    this.evaluationInputs.length = 0;
    this.reviewInputs.length = 0;
    this.questions.length = 0;
    this.hints.length = 0;
    this.possibleAnswers.length = 0;
    this.evaluations.length = 0;
    this.reviews.length = 0;
  }

  async generateCoachQuestion(input: CoachInput): Promise<CoachDraft> {
    this.questionInputs.push(structuredClone(input));
    return (await play(this.questions, 'generateCoachQuestion')) as CoachDraft;
  }

  async generateHint(input: HintInput): Promise<HintDraft> {
    this.hintInputs.push(structuredClone(input));
    return (await play(this.hints, 'generateHint')) as HintDraft;
  }

  async generatePossibleAnswer(
    input: PossibleAnswerInput,
  ): Promise<PossibleAnswerDraft> {
    this.possibleAnswerInputs.push(structuredClone(input));
    return (await play(
      this.possibleAnswers,
      'generatePossibleAnswer',
    )) as PossibleAnswerDraft;
  }

  async generateReview(input: ReviewInput): Promise<ReviewFeedback> {
    this.reviewInputs.push(structuredClone(input));
    return (await play(this.reviews, 'generateReview')) as ReviewFeedback;
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
