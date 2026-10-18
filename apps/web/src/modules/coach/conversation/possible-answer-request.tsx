import {
  findLatestPossibleAnswer,
  isPossibleAnswerAvailable,
  type CoachTurn,
} from '@flowment/domain';
import { Eye } from 'lucide-react';
import { Button } from '../../../components/ui/button';

type PossibleAnswerRequestProps = {
  questionId: string;
  turns: CoachTurn[];
  currentDesignRevision: string;
  disabled: boolean;
  onRequest: () => void;
};

export function PossibleAnswerRequest({
  questionId,
  turns,
  currentDesignRevision,
  disabled,
  onRequest,
}: PossibleAnswerRequestProps) {
  if (!isPossibleAnswerAvailable(turns, questionId)) {
    return null;
  }

  const shown = findLatestPossibleAnswer(turns, questionId);
  if (shown?.designRevision === currentDesignRevision) {
    return null;
  }

  return (
    <Button
      variant="secondary"
      icon={Eye}
      disabled={disabled}
      onClick={onRequest}
    >
      {shown ? 'Show an updated answer' : 'Show one possible answer'}
    </Button>
  );
}
