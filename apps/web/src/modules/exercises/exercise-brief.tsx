import { ErrorMessage } from '../../components/ui/error-message';
import { errorMessage } from '../../shared/api-error';
import {
  difficultyLabel,
  trainingModeDescriptions,
  trainingModeLabels,
} from './exercise-labels';
import { useExercise } from './exercise-queries';

type ExerciseBriefProps = { exerciseId: string };

export function ExerciseBrief({ exerciseId }: ExerciseBriefProps) {
  const exercise = useExercise(exerciseId);

  if (exercise.isPending) {
    return <p className="text-sm text-zinc-500">Loading exercise…</p>;
  }

  if (exercise.isError) {
    return <ErrorMessage>{errorMessage(exercise.error)}</ErrorMessage>;
  }

  const { mode, difficulty, prompt } = exercise.data;

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-zinc-500">
        {trainingModeLabels[mode]} exercise · {difficultyLabel(difficulty)}
      </p>
      <p className="text-sm">{prompt}</p>
      <p className="text-xs text-zinc-500">{trainingModeDescriptions[mode]}</p>
    </div>
  );
}
