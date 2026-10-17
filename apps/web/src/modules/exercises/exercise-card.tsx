import type { ExerciseDto } from '../../api';
import { Button } from '../../components/ui/button';
import {
  difficultyLabel,
  trainingModeDescriptions,
  trainingModeLabels,
} from './exercise-labels';

type ExerciseCardProps = {
  exercise: ExerciseDto;
  disabled: boolean;
  onStart: () => void;
};

export function ExerciseCard({
  exercise,
  disabled,
  onStart,
}: ExerciseCardProps) {
  const headingId = `exercise-${exercise.id}`;

  return (
    <article
      aria-labelledby={headingId}
      className="space-y-3 rounded-lg border border-zinc-200 bg-white p-4"
    >
      <div className="space-y-1">
        <p className="text-xs font-medium text-zinc-500">
          {trainingModeLabels[exercise.mode]} ·{' '}
          {difficultyLabel(exercise.difficulty)}
        </p>
        <h2 id={headingId} className="font-semibold">
          {exercise.title}
        </h2>
        <p className="text-sm text-zinc-500">
          {trainingModeDescriptions[exercise.mode]}
        </p>
      </div>
      <p className="text-sm">{exercise.prompt}</p>
      <Button disabled={disabled} onClick={onStart}>
        Start exercise
      </Button>
    </article>
  );
}
