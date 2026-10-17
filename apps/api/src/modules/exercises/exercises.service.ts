import {
  exerciseObjectives,
  initialCoachStage,
  type Exercise,
} from '@flowment/domain';
import { Injectable } from '@nestjs/common';
import {
  InjectDb,
  coachSessions,
  projects,
  type Db,
} from '../../infrastructure/database';
import type { Project } from '../projects';
import { EXERCISE_CATALOG } from './exercise-catalog';
import type { ExerciseBrief, ExerciseList } from './exercises.dto';
import { ExerciseNotFoundError } from './exercises.errors';

function toExerciseBrief({
  id,
  title,
  difficulty,
  mode,
  prompt,
  learningObjectives,
}: Exercise): ExerciseBrief {
  return { id, title, difficulty, mode, prompt, learningObjectives };
}

@Injectable()
export class ExercisesService {
  constructor(@InjectDb() private readonly db: Db) {}

  listExercises(): ExerciseList {
    return { items: EXERCISE_CATALOG.map(toExerciseBrief) };
  }

  getExercise(id: string): ExerciseBrief {
    return toExerciseBrief(this.findExerciseOrThrow(id));
  }

  findExercise(id: string): Exercise | undefined {
    return EXERCISE_CATALOG.find((exercise) => exercise.id === id);
  }

  async startExercise(id: string): Promise<Project> {
    const exercise = this.findExerciseOrThrow(id);

    return this.db.transaction(async (tx) => {
      const [project] = await tx
        .insert(projects)
        .values({
          name: exercise.title,
          systemDesign: exercise.startingDesign,
          exerciseId: exercise.id,
        })
        .returning();

      await tx.insert(coachSessions).values({
        projectId: project.id,
        mode: 'exercise',
        stage: initialCoachStage('exercise'),
        objectives: exerciseObjectives(exercise),
      });

      return project;
    });
  }

  private findExerciseOrThrow(id: string): Exercise {
    const exercise = this.findExercise(id);
    if (!exercise) {
      throw new ExerciseNotFoundError(id);
    }
    return exercise;
  }
}
