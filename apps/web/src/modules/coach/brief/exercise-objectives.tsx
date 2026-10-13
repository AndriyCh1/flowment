import type { ExerciseObjective } from '@flowment/domain';

type ExerciseObjectivesProps = { objectives: ExerciseObjective[] };

export function ExerciseObjectives({ objectives }: ExerciseObjectivesProps) {
  return (
    <div className="space-y-2 rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm">
      <h3 className="text-xs font-medium text-zinc-500">Exercise objectives</h3>
      <ul className="list-disc space-y-1 pl-5">
        {objectives.map((objective) => (
          <li key={objective.id}>{objective.description}</li>
        ))}
      </ul>
    </div>
  );
}
