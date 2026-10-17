import {
  designRevision,
  findCoachQuestion,
  type SystemDesign,
} from '@flowment/domain';
import type { CoachSessionDto } from '../../api';
import { Button } from '../../components/ui/button';
import { ExerciseObjectives } from './brief/exercise-objectives';
import { ModelingBrief } from './brief/modeling-brief';
import { CoachReset } from './coach-reset';
import { CoachStart } from './coach-start';
import { CoachConversation } from './conversation/coach-conversation';
import {
  CoachReplyForm,
  type CoachReply,
} from './conversation/coach-reply-form';
import { HintRequest } from './conversation/hint-request';

type CoachSessionViewProps = {
  session: CoachSessionDto;
  projectId: string;
  design: SystemDesign;
  blocked: boolean;
  busy: boolean;
  onStart: (modelingIntent: string) => void;
  onAsk: () => void;
  onHint: (questionId: string) => void;
  onReply: (questionId: string, reply: CoachReply) => void;
  onReset: () => void;
};

export function CoachSessionView({
  session,
  projectId,
  design,
  blocked,
  busy,
  onStart,
  onAsk,
  onHint,
  onReply,
  onReset,
}: CoachSessionViewProps) {
  const { mode, modelingIntent, objectives, turns, activeQuestionId } = session;
  const exercise = mode === 'exercise';

  if (!exercise && turns.length === 0 && !modelingIntent) {
    return <CoachStart disabled={blocked} onStart={onStart} />;
  }

  const activeQuestion = activeQuestionId
    ? findCoachQuestion(turns, activeQuestionId)
    : undefined;
  const designChanged =
    session.designRevision !== null &&
    session.designRevision !== designRevision(design);
  const askLabel =
    turns.length === 0
      ? 'Ask the coach'
      : session.stage === 'objective-reached'
        ? 'Check again'
        : 'Continue';

  return (
    <div className="space-y-3">
      {exercise ? (
        <ExerciseObjectives objectives={objectives} />
      ) : (
        <ModelingBrief projectId={projectId} modelingIntent={modelingIntent} />
      )}
      {turns.length > 0 && <CoachConversation turns={turns} design={design} />}
      {activeQuestionId ? (
        <div className="space-y-2">
          {designChanged && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900">
              <p>You've changed the design since this question was asked.</p>
              <Button variant="secondary" disabled={blocked} onClick={onAsk}>
                Ask again
              </Button>
            </div>
          )}
          {activeQuestion && (
            <HintRequest
              question={activeQuestion}
              turns={turns}
              disabled={blocked}
              onHint={() => onHint(activeQuestion.questionId)}
            />
          )}
          <CoachReplyForm
            key={activeQuestionId}
            disabled={blocked}
            onReply={(reply) => onReply(activeQuestionId, reply)}
          />
        </div>
      ) : (
        <Button disabled={blocked} onClick={onAsk}>
          {askLabel}
        </Button>
      )}
      {turns.length > 0 && <CoachReset disabled={busy} onReset={onReset} />}
    </div>
  );
}
