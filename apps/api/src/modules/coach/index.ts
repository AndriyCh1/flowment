export {
  COACH_AI_PROVIDER,
  type CoachAiProvider,
  type CoachDraft,
  type CoachFocus,
  type CoachInput,
  type HintDraft,
  type HintInput,
  type ObjectiveEvaluationInput,
} from './coach-ai-provider';
export type { CoachContext } from './coach-context';
export type { CoachSession } from './coach.dto';
export {
  CoachHintsExhaustedError,
  CoachQuestionNotActiveError,
  CoachSessionChangedError,
  CoachUnavailableError,
} from './coach.errors';
export { CoachModule } from './coach.module';
export { CoachService, DISCOVERY_QUESTION } from './coach.service';
