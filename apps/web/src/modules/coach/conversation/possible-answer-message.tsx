import type { PossibleAnswerTurn } from '@flowment/domain';

type PossibleAnswerMessageProps = {
  turn: PossibleAnswerTurn;
  stale: boolean;
};

export function PossibleAnswerMessage({
  turn,
  stale,
}: PossibleAnswerMessageProps) {
  const { approach, rationale, suggestedInteractions } = turn;

  return (
    <div className="space-y-2 rounded-md border border-sky-200 bg-sky-50 p-3 text-sm text-sky-950">
      <p className="text-xs font-medium text-sky-700">One possible approach</p>
      {stale && (
        <p className="text-xs text-amber-800">
          Shown for an earlier version of your design.
        </p>
      )}
      <p className="wrap-anywhere whitespace-pre-wrap">{approach}</p>
      {suggestedInteractions.length > 0 && (
        <ol
          aria-label="Suggested interactions"
          className="space-y-1 rounded border border-sky-100 bg-white p-2 text-xs"
        >
          {suggestedInteractions.map(({ from, to, text }, index) => (
            <li key={index} className="wrap-anywhere">
              <span className="font-medium">
                {from} → {to}
              </span>
              {text && <span>: {text}</span>}
            </li>
          ))}
        </ol>
      )}
      <div className="space-y-0.5">
        <p className="text-xs font-medium text-sky-700">Why it works</p>
        <p className="wrap-anywhere whitespace-pre-wrap">{rationale}</p>
      </div>
      <p className="text-xs text-sky-700">
        This is one way to resolve it, not the only correct one. Your design
        hasn't been changed.
      </p>
    </div>
  );
}
