import {
  SystemDesignSchema,
  type Exercise,
  type SystemDesign,
} from '@flowment/domain';
import type { ExercisesService } from '../exercises';
import type { ProjectsService } from '../projects';

export type CoachedProject = {
  design: SystemDesign;
  exercise: Exercise | null;
};

export async function loadCoachedProject(
  projects: ProjectsService,
  exercises: ExercisesService,
  projectId: string,
): Promise<CoachedProject> {
  const project = await projects.get(projectId);
  return {
    design: SystemDesignSchema.parse(project.systemDesign),
    exercise: project.exerciseId
      ? (exercises.findExercise(project.exerciseId) ?? null)
      : null,
  };
}
