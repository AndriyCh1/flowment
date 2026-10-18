import { ReviewFeedbackSchema, designRevision } from '@flowment/domain';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import {
  InjectDb,
  coachSessions,
  projectReviews,
  type Db,
} from '../../infrastructure/database';
import { ExercisesService } from '../exercises';
import { ProjectsService } from '../projects';
import { callCoachProvider } from './call-coach-provider';
import { COACH_AI_PROVIDER, type CoachAiProvider } from './coach-ai-provider';
import { buildCoachContext } from './coach-context';
import {
  CoachSessionChangedError,
  ReviewDesignEmptyError,
} from './coach.errors';
import { loadCoachedProject } from './coached-project';
import type { Review, ReviewList } from './review.dto';

type ReviewRow = typeof projectReviews.$inferSelect;

function toReview({
  id,
  designRevision: revision,
  createdAt,
  feedback,
}: ReviewRow): Review {
  return { id, designRevision: revision, createdAt, ...feedback };
}

@Injectable()
export class ReviewService {
  private readonly logger = new Logger(ReviewService.name);

  constructor(
    @InjectDb() private readonly db: Db,
    private readonly projects: ProjectsService,
    private readonly exercises: ExercisesService,
    @Inject(COACH_AI_PROVIDER) private readonly ai: CoachAiProvider,
  ) {}

  async listReviews(projectId: string): Promise<ReviewList> {
    await this.projects.get(projectId);
    const rows = await this.db
      .select()
      .from(projectReviews)
      .where(eq(projectReviews.projectId, projectId))
      .orderBy(desc(projectReviews.createdAt), desc(projectReviews.id));
    return { items: rows.map(toReview) };
  }

  async submitForReview(projectId: string): Promise<Review> {
    const project = await loadCoachedProject(
      this.projects,
      this.exercises,
      projectId,
    );
    const [session] = await this.db
      .select()
      .from(coachSessions)
      .where(eq(coachSessions.projectId, projectId));

    const { design } = project;
    if (design.components.length === 0 && design.scenarios.length === 0) {
      throw new ReviewDesignEmptyError();
    }

    const revision = designRevision(design);
    const existing = await this.findReviewRow(projectId, revision);
    if (existing) {
      return toReview(existing);
    }

    const exerciseMode = session?.mode === 'exercise';
    const feedback = await callCoachProvider(
      this.logger,
      'review the project',
      ReviewFeedbackSchema,
      () =>
        this.ai.generateReview({
          context: buildCoachContext({
            projectId,
            mode: session?.mode ?? 'open-project',
            exercise: exerciseMode ? project.exercise : null,
            modelingIntent: session?.modelingIntent ?? null,
            turns: session?.turns ?? [],
            design,
            selectedScenarioId: null,
          }),
          objectives: exerciseMode ? session.objectives : [],
        }),
    );

    const [inserted] = await this.db
      .insert(projectReviews)
      .values({ projectId, designRevision: revision, feedback })
      .onConflictDoNothing()
      .returning();
    const saved = inserted ?? (await this.findReviewRow(projectId, revision));
    if (!saved) {
      throw new CoachSessionChangedError();
    }
    return toReview(saved);
  }

  private async findReviewRow(
    projectId: string,
    revision: string,
  ): Promise<ReviewRow | undefined> {
    const [row] = await this.db
      .select()
      .from(projectReviews)
      .where(
        and(
          eq(projectReviews.projectId, projectId),
          eq(projectReviews.designRevision, revision),
        ),
      );
    return row;
  }
}
