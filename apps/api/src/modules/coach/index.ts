export {
  COACH_AI_PROVIDER,
  type CoachAiProvider,
  type CoachDraft,
  type CoachFocus,
  type CoachInput,
  type ObjectiveEvaluationInput,
} from './coach-ai-provider';
export type { CoachContext } from './coach-context';
export type { CoachSession } from './coach.dto';
export {
  CoachQuestionNotActiveError,
  CoachSessionChangedError,
  CoachUnavailableError,
} from './coach.errors';
export { CoachModule } from './coach.module';
export { CoachService, DISCOVERY_QUESTION } from './coach.service';
