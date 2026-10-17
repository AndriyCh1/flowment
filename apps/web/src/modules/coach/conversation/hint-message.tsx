import type { CoachQuestionPurpose, HintTurn } from '@flowment/domain';
import { hintLabel } from '../coach-labels';

type HintMessageProps = {
  turn: HintTurn;
  purpose: CoachQuestionPurpose | undefined;
};

export function HintMessage({ turn, purpose }: HintMessageProps) {
  if (turn.outcome === 'resolved') {
    return (
      <div className="space-y-1 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-950">
        <p className="text-xs font-medium text-emerald-700">
          ✓ Already resolved
        </p>
        <p className="wrap-anywhere whitespace-pre-wrap">{turn.text}</p>
      </div>
    );
  }

  return (
    <div className="space-y-1 rounded-md border border-violet-200 bg-violet-50 p-3 text-sm text-violet-950">
      <p className="text-xs font-medium text-violet-700">
        {purpose ? hintLabel(purpose, turn.level) : 'Hint'}
      </p>
      <p className="wrap-anywhere whitespace-pre-wrap">{turn.text}</p>
    </div>
  );
}
