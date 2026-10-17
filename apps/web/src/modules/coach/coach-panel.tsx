import type { SystemDesign } from '@flowment/domain';
import { ErrorMessage } from '../../components/ui/error-message';
import { errorMessage } from '../../shared/api-error';
import { stageLabels } from './coach-labels';
import {
  useCoachSession,
  useReplyToCoach,
  useRequestCoachHint,
  useRequestCoachResponse,
  useRequestPossibleAnswer,
  useResetCoach,
  useSaveModelingIntent,
} from './coach-queries';
import { CoachSessionView } from './coach-session-view';
import type { CoachReply } from './conversation/coach-reply-form';

type CoachPanelProps = {
  projectId: string;
  design: SystemDesign;
  scenarioId: string | undefined;
  designSaving: boolean;
};

export function CoachPanel({
  projectId,
  design,
  scenarioId,
  designSaving,
}: CoachPanelProps) {
  const session = useCoachSession(projectId);
  const saveIntent = useSaveModelingIntent(projectId);
  const requestNext = useRequestCoachResponse(projectId);
  const requestHint = useRequestCoachHint(projectId);
  const requestAnswer = useRequestPossibleAnswer(projectId);
  const sendReply = useReplyToCoach(projectId);
  const resetCoach = useResetCoach(projectId);

  const busy =
    saveIntent.isPending ||
    requestNext.isPending ||
    requestHint.isPending ||
    requestAnswer.isPending ||
    sendReply.isPending ||
    resetCoach.isPending;
  const thinking =
    requestNext.isPending || requestHint.isPending || requestAnswer.isPending;
  const blocked = busy || designSaving;

  const askCoach = () => requestNext.mutate({ scenarioId });

  const requestHintForQuestion = (questionId: string) =>
    requestHint.mutate({ questionId, scenarioId });

  const requestPossibleAnswerForQuestion = (questionId: string) =>
    requestAnswer.mutate({ questionId, scenarioId });

  const start = (modelingIntent: string) => {
    if (modelingIntent) {
      saveIntent.mutate(modelingIntent, { onSuccess: askCoach });
    } else {
      askCoach();
    }
  };

  const reply = (questionId: string, { kind, text }: CoachReply) =>
    sendReply.mutate({ questionId, kind, text }, { onSuccess: askCoach });

  const reset = () => {
    requestNext.reset();
    requestHint.reset();
    requestAnswer.reset();
    sendReply.reset();
    resetCoach.mutate();
  };

  const error = [
    saveIntent,
    requestNext,
    requestHint,
    requestAnswer,
    sendReply,
    resetCoach,
  ].find((mutation) => mutation.isError)?.error;

  return (
    <section aria-labelledby="coach-heading" className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="coach-heading" className="text-lg font-semibold">
          Coach
        </h2>
        {session.data && session.data.turns.length > 0 && (
          <p className="text-xs text-zinc-500">
            {stageLabels[session.data.stage]}
          </p>
        )}
      </div>
      {session.isPending ? (
        <p className="text-sm text-zinc-500">Loading coach…</p>
      ) : session.isError ? (
        <ErrorMessage>{errorMessage(session.error)}</ErrorMessage>
      ) : (
        <CoachSessionView
          session={session.data}
          projectId={projectId}
          design={design}
          blocked={blocked}
          busy={busy}
          onStart={start}
          onAsk={askCoach}
          onHint={requestHintForQuestion}
          onPossibleAnswer={requestPossibleAnswerForQuestion}
          onReply={reply}
          onReset={reset}
        />
      )}
      {thinking && (
        <p aria-live="polite" className="text-sm text-zinc-500">
          The coach is thinking…
        </p>
      )}
      {error && <ErrorMessage>{errorMessage(error)}</ErrorMessage>}
    </section>
  );
}
