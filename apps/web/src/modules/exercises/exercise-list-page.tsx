import { Link, useNavigate } from 'react-router-dom';
import { Page } from '../../components/page';
import { ErrorMessage } from '../../components/ui/error-message';
import { errorMessage } from '../../shared/api-error';
import { ExerciseCard } from './exercise-card';
import { useExerciseList, useStartExercise } from './exercise-queries';

export function ExerciseListPage() {
  const navigate = useNavigate();
  const exercises = useExerciseList();
  const start = useStartExercise();

  const startExercise = (exerciseId: string) =>
    start.mutate(exerciseId, {
      onSuccess: (project) => navigate(`/projects/${project.id}`),
    });

  return (
    <Page>
      <Link to="/projects" className="text-sm text-zinc-600 hover:underline">
        ← Projects
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">Exercises</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Starting an exercise creates a new project with its starting design.
      </p>
      {start.isError && (
        <div className="mt-4">
          <ErrorMessage>{errorMessage(start.error)}</ErrorMessage>
        </div>
      )}
      {exercises.isPending ? (
        <p className="mt-8 text-sm text-zinc-500">Loading exercises…</p>
      ) : exercises.isError ? (
        <div className="mt-8">
          <ErrorMessage>{errorMessage(exercises.error)}</ErrorMessage>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {exercises.data.items.map((exercise) => (
            <li key={exercise.id}>
              <ExerciseCard
                exercise={exercise}
                disabled={start.isPending}
                onStart={() => startExercise(exercise.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </Page>
  );
}
