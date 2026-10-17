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
    <section
      aria-label="Exercise"
      className="space-y-1 rounded-lg border border-zinc-200 bg-zinc-50 p-4"
    >
      <p className="text-xs font-medium text-zinc-500">
        {trainingModeLabels[mode]} exercise · {difficultyLabel(difficulty)}
      </p>
      <p className="text-sm">{prompt}</p>
      <p className="text-xs text-zinc-500">{trainingModeDescriptions[mode]}</p>
    </section>
  );
}
