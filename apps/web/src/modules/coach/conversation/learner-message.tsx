import type { LearnerTurn } from '@flowment/domain';
import { replyKindLabels } from '../coach-labels';

type LearnerMessageProps = { turn: LearnerTurn };

export function LearnerMessage({ turn }: LearnerMessageProps) {
  return (
    <div className="ml-6 space-y-1 rounded-md border border-zinc-200 bg-white p-3 text-sm">
      {turn.kind !== 'answer' && (
        <p className="text-xs font-medium text-zinc-500">
          {replyKindLabels[turn.kind]}
        </p>
      )}
      {turn.text && (
        <p className="wrap-anywhere whitespace-pre-wrap">{turn.text}</p>
      )}
    </div>
  );
}
