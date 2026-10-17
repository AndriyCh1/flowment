import {
  designRevision,
  findCoachQuestion,
  type CoachTurn,
  type SystemDesign,
} from '@flowment/domain';
import { useEffect, useRef } from 'react';
import { CoachMessage } from './coach-message';
import { HintMessage } from './hint-message';
import { LearnerMessage } from './learner-message';
import { PossibleAnswerMessage } from './possible-answer-message';

type CoachConversationProps = {
  turns: CoachTurn[];
  design: SystemDesign;
};

export function CoachConversation({ turns, design }: CoachConversationProps) {
  const listRef = useRef<HTMLOListElement>(null);
  const currentRevision = designRevision(design);

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
          ) : turn.role === 'hint' ? (
            <HintMessage
              turn={turn}
              purpose={findCoachQuestion(turns, turn.questionId)?.purpose}
            />
          ) : turn.role === 'possible-answer' ? (
            <PossibleAnswerMessage
              turn={turn}
              stale={turn.designRevision !== currentRevision}
            />
          ) : (
            <LearnerMessage turn={turn} />
          )}
        </li>
      ))}
    </ol>
  );
}
