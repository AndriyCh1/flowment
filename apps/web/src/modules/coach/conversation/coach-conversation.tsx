import type { CoachTurn, SystemDesign } from '@flowment/domain';
import { useEffect, useRef } from 'react';
import { CoachMessage } from './coach-message';
import { LearnerMessage } from './learner-message';

type CoachConversationProps = {
  turns: CoachTurn[];
  design: SystemDesign;
};

export function CoachConversation({ turns, design }: CoachConversationProps) {
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const list = listRef.current;
    if (list) {
      list.scrollTop = list.scrollHeight;
    }
  }, [turns.length]);

  return (
    <ol
      ref={listRef}
      aria-label="Coach conversation"
      className="max-h-[50vh] space-y-2 overflow-y-auto"
    >
      {turns.map((turn) => (
        <li key={turn.id}>
          {turn.role === 'coach' ? (
            <CoachMessage output={turn.output} design={design} />
          ) : (
            <LearnerMessage turn={turn} />
          )}
        </li>
      ))}
    </ol>
  );
}
