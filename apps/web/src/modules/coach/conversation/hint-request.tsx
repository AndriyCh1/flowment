import {
  maxHintsForPurpose,
  nextHintLevel,
  type CoachQuestion,
  type CoachTurn,
} from '@flowment/domain';
import { Lightbulb } from 'lucide-react';
import { Button } from '../../../components/ui/button';

type HintRequestProps = {
  question: CoachQuestion;
  turns: CoachTurn[];
  disabled: boolean;
  onHint: () => void;
};

export function HintRequest({
  question,
  turns,
  disabled,
  onHint,
}: HintRequestProps) {
  const limit = maxHintsForPurpose(question.purpose);
  const level = nextHintLevel(turns, question);

  if (level === null) {
    return limit > 1 ? (
      <p className="text-xs text-zinc-500">
        That was the last hint for this question.
      </p>
    ) : null;
  }

  const label =
    limit === 1
      ? 'Help me answer'
      : level === 1
        ? 'Get a hint'
        : `Another hint (${level} of ${limit})`;

  return (
    <Button
      variant="secondary"
      icon={Lightbulb}
      disabled={disabled}
      onClick={onHint}
    >
      {label}
    </Button>
  );
}
