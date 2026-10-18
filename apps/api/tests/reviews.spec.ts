import {
  exerciseObjectives,
  type ReviewFeedback,
  type SystemDesign,
} from '@flowment/domain';
import { projectReviews, projects } from '../src/infrastructure/database';
import {
  COACH_AI_PROVIDER,
  type CoachSession,
  type Review,
  type ReviewList,
} from '../src/modules/coach';
import { EXERCISE_CATALOG } from '../src/modules/exercises';
import { ScriptedCoachAiProvider } from './scripted-coach-ai-provider';
import { createTestApp, type TestApp } from './test-app';

type ProjectBody = { id: string; systemDesign: SystemDesign };

type ErrorBody = { statusCode: number; error: string; message: unknown };

const [traceExercise, completeExercise] = EXERCISE_CATALOG;

const feedback: ReviewFeedback = {
  strongestReasoning: 'Step 2 records the month before the Worker needs it.',
  missedIssue: {
    issue: 'The Worker never loads the month.',
    whyItMatters: 'It cannot tell which report to write.',
  },
  alternative: 'Put the month in the queue message.',
  nextSkill: 'Information provenance, because the gap was a missing lookup.',
};

const MISSING_PROJECT = '00000000-0000-4000-8000-000000000000';

describe('Reviews API', () => {
  const ai = new ScriptedCoachAiProvider();
  let api: TestApp;

  beforeAll(async () => {
    api = await createTestApp({
      configure: (builder) =>
        builder.overrideProvider(COACH_AI_PROVIDER).useValue(ai),
    });
  });

  afterAll(async () => {
    await api.close();
  });

  beforeEach(async () => {
    await api.db.delete(projects);
    ai.reset();
  });

  const startExercise = async (exerciseId = completeExercise.id) => {
    const { body } = await api.request<ProjectBody>(
      'POST',
      `/api/exercises/${exerciseId}/start`,
    );
    return body;
  };

  const submit = <T = Review>(projectId: string) =>
    api.request<T>('POST', `/api/projects/${projectId}/reviews`);

  const listReviews = <T = ReviewList>(projectId: string) =>
    api.request<T>('GET', `/api/projects/${projectId}/reviews`);

  const changeDesign = (project: ProjectBody) =>
    api.request('PATCH', `/api/projects/${project.id}`, {
      systemDesign: {
        ...project.systemDesign,
        assumptions: [
          { id: 'a1', statement: 'Reports are small', status: 'assumed' },
        ],
      },
    });

  describe('POST /api/projects/:projectId/reviews', () => {
    it('reviews the exercise as it is, even before the objectives are met', async () => {
      const project = await startExercise();
      ai.willReview(feedback);

      const { status, body } = await submit(project.id);

      expect(status).toBe(200);
      expect(body).toEqual({
        id: expect.stringMatching(/^[0-9a-f-]{36}$/),
        designRevision: expect.any(String),
        createdAt: expect.any(String),
        ...feedback,
      });
      expect(ai.reviewInputs).toHaveLength(1);
      expect(ai.reviewInputs[0].objectives).toEqual(
        exerciseObjectives(completeExercise),
      );
      expect(ai.reviewInputs[0].context).toMatchObject({
        mode: 'exercise',
        exercise: { title: completeExercise.title, mode: 'complete' },
      });
      expect(ai.evaluationInputs).toHaveLength(0);
    });

    it('gives the reviewer the coaching conversation', async () => {
      const project = await startExercise();
      const { body: session } = await api.request<CoachSession>(
        'POST',
        `/api/projects/${project.id}/coach/next`,
        {},
      );
      await api.request('POST', `/api/projects/${project.id}/coach/reply`, {
        questionId: session.activeQuestionId,
        kind: 'answer',
        text: 'The Worker loads the request by reportId.',
      });
      ai.willReview(feedback);

      await submit(project.id);

      expect(ai.reviewInputs[0].context.conversation).toEqual([
        expect.objectContaining({ role: 'coach', kind: 'question' }),
        {
          role: 'learner',
          kind: 'answer',
          text: 'The Worker loads the request by reportId.',
        },
      ]);
    });

    it('accepts a review with no missed issue and no alternative', async () => {
      const project = await startExercise();
      ai.willReview({ ...feedback, missedIssue: null, alternative: null });

      const { body } = await submit(project.id);

      expect(body).toMatchObject({ missedIssue: null, alternative: null });
    });

    it('returns the same review while the design is unchanged', async () => {
      const project = await startExercise();
      ai.willReview(feedback);

      const first = await submit(project.id);
      const second = await submit(project.id);

      expect(second.status).toBe(200);
      expect(second.body).toEqual(first.body);
      expect(ai.reviewInputs).toHaveLength(1);
    });

    it('reviews again after the design changes and keeps both reviews', async () => {
      const project = await startExercise();
      ai.willReview(feedback, { ...feedback, missedIssue: null });

      const first = await submit(project.id);
      await changeDesign(project);
      const second = await submit(project.id);

      expect(second.body.id).not.toBe(first.body.id);
      expect(second.body.designRevision).not.toBe(first.body.designRevision);
      expect(second.body.missedIssue).toBeNull();
      expect(ai.reviewInputs[1].context.assumptions).toEqual([
        { statement: 'Reports are small', status: 'assumed' },
      ]);

      const { body } = await listReviews(project.id);
      expect(body.items.map(({ id }) => id)).toEqual([
        second.body.id,
        first.body.id,
      ]);
    });

    it('stores one review when the same design is submitted twice at once', async () => {
      const project = await startExercise();
      ai.willReview(feedback, feedback);

      const results = await Promise.all([
        submit(project.id),
        submit(project.id),
      ]);

      expect(results.map(({ status }) => status)).toEqual([200, 200]);
      expect(results[1].body.id).toBe(results[0].body.id);
      expect(await api.db.$count(projectReviews)).toBe(1);
    });

    it('leaves the coach session and the design unchanged', async () => {
      const project = await startExercise(traceExercise.id);
      const before = await api.request<CoachSession>(
        'GET',
        `/api/projects/${project.id}/coach`,
      );
      ai.willReview(feedback);

      await submit(project.id);

      const after = await api.request<CoachSession>(
        'GET',
        `/api/projects/${project.id}/coach`,
      );
      const stored = await api.request<ProjectBody>(
        'GET',
        `/api/projects/${project.id}`,
      );
      expect(after.body).toEqual(before.body);
      expect(stored.body.systemDesign).toEqual(traceExercise.startingDesign);
    });

    it('keeps the reviews when the conversation is reset', async () => {
      const project = await startExercise();
      ai.willReview(feedback);
      await submit(project.id);

      await api.request('POST', `/api/projects/${project.id}/coach/reset`);

      const { body } = await listReviews(project.id);
      expect(body.items).toHaveLength(1);
    });

    it('reviews an open project with its description and no objectives', async () => {
      const { body: project } = await api.request<ProjectBody>(
        'POST',
        '/api/projects',
        { name: 'Open', systemDesign: completeExercise.startingDesign },
      );
      await api.request('PUT', `/api/projects/${project.id}/coach/intent`, {
        modelingIntent: 'Monthly reports built in the background',
      });
      ai.willReview(feedback);

      const { status, body } = await submit(project.id);

      expect(status).toBe(200);
      expect(body).toMatchObject(feedback);
      expect(ai.reviewInputs[0].objectives).toEqual([]);
      expect(ai.reviewInputs[0].context).toMatchObject({
        mode: 'open-project',
        exercise: null,
        modelingIntent: 'Monthly reports built in the background',
      });
    });

    it('reviews an open project that was never coached', async () => {
      const { body: project } = await api.request<ProjectBody>(
        'POST',
        '/api/projects',
        { name: 'Open', systemDesign: completeExercise.startingDesign },
      );
      ai.willReview(feedback);

      const { status } = await submit(project.id);

      expect(status).toBe(200);
      expect(ai.reviewInputs[0].context).toMatchObject({
        mode: 'open-project',
        modelingIntent: null,
        conversation: [],
      });
    });

    it('refuses an empty design without calling the AI', async () => {
      const { body: project } = await api.request<ProjectBody>(
        'POST',
        '/api/projects',
        { name: 'Empty' },
      );

      const { status, body } = await submit<ErrorBody>(project.id);

      expect(status).toBe(409);
      expect(body.message).toBe(
        'Add something to the design before submitting it for review',
      );
      expect(ai.reviewInputs).toHaveLength(0);
    });

    it('returns 503 and stores nothing when the provider fails', async () => {
      const project = await startExercise();
      ai.willReview(new Error('timeout'));

      const { status } = await submit<ErrorBody>(project.id);

      expect(status).toBe(503);
      expect(await api.db.$count(projectReviews)).toBe(0);
    });

    it('returns 503 and stores nothing for an invalid review', async () => {
      const project = await startExercise();
      ai.willReview({ ...feedback, strongestReasoning: ' ' });

      const { status } = await submit<ErrorBody>(project.id);

      expect(status).toBe(503);
      expect(await api.db.$count(projectReviews)).toBe(0);
    });

    it('returns 404 for a missing project', async () => {
      const { status } = await submit<ErrorBody>(MISSING_PROJECT);

      expect(status).toBe(404);
    });
  });

  describe('GET /api/projects/:projectId/reviews', () => {
    it('lists no reviews before the first submission', async () => {
      const project = await startExercise();

      const { status, body } = await listReviews(project.id);

      expect(status).toBe(200);
      expect(body).toEqual({ items: [] });
    });

    it('returns 404 for a missing project', async () => {
      const { status } = await listReviews<ErrorBody>(MISSING_PROJECT);

      expect(status).toBe(404);
    });
  });
});
