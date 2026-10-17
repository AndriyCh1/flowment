import {
  TRACE_EXPLICITNESS_OBJECTIVE,
  exerciseObjectives,
  type SystemDesign,
} from '@flowment/domain';
import { coachSessions, projects } from '../src/infrastructure/database';
import { COACH_AI_PROVIDER, type CoachSession } from '../src/modules/coach';
import {
  EXERCISE_CATALOG,
  type ExerciseBrief,
  type ExerciseList,
} from '../src/modules/exercises';
import { ScriptedCoachAiProvider } from './scripted-coach-ai-provider';
import { createTestApp, type TestApp } from './test-app';

type ProjectBody = {
  id: string;
  name: string;
  systemDesign: SystemDesign;
  exerciseId: string | null;
  createdAt: string;
  updatedAt: string;
};

type ErrorBody = { statusCode: number; error: string; message: unknown };

const [traceExercise, completeExercise] = EXERCISE_CATALOG;

function brief({
  id,
  title,
  difficulty,
  mode,
  prompt,
  learningObjectives,
}: (typeof EXERCISE_CATALOG)[number]): ExerciseBrief {
  return { id, title, difficulty, mode, prompt, learningObjectives };
}

describe('Exercises API', () => {
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

  const startExercise = <T = ProjectBody>(exerciseId: string) =>
    api.request<T>('POST', `/api/exercises/${exerciseId}/start`);

  describe('GET /api/exercises', () => {
    it('lists every exercise in the catalog without its starting design', async () => {
      const { status, body } = await api.request<ExerciseList>(
        'GET',
        '/api/exercises',
      );

      expect(status).toBe(200);
      expect(body).toEqual({ items: EXERCISE_CATALOG.map(brief) });
      expect(body.items.map(({ mode }) => mode)).toEqual([
        'trace',
        'complete',
        'repair',
      ]);
    });
  });

  describe('GET /api/exercises/:exerciseId', () => {
    it('returns one exercise', async () => {
      const { status, body } = await api.request<ExerciseBrief>(
        'GET',
        `/api/exercises/${completeExercise.id}`,
      );

      expect(status).toBe(200);
      expect(body).toEqual(brief(completeExercise));
    });

    it('returns 404 for an unknown exercise', async () => {
      const { status, body } = await api.request<ErrorBody>(
        'GET',
        '/api/exercises/no-such-exercise',
      );

      expect(status).toBe(404);
      expect(body.error).toBe('NOT_FOUND');
    });
  });

  describe('POST /api/exercises/:exerciseId/start', () => {
    it('creates a project from the exercise starting design', async () => {
      const { status, body } = await startExercise(traceExercise.id);

      expect(status).toBe(201);
      expect(body).toEqual({
        id: expect.stringMatching(/^[0-9a-f-]{36}$/),
        name: traceExercise.title,
        systemDesign: traceExercise.startingDesign,
        exerciseId: traceExercise.id,
        createdAt: expect.any(String),
        updatedAt: body.createdAt,
      });

      const stored = await api.request<ProjectBody>(
        'GET',
        `/api/projects/${body.id}`,
      );
      expect(stored.body).toEqual(body);
    });

    it('starts an exercise coach session with the learning objectives', async () => {
      const { body: project } = await startExercise(completeExercise.id);

      const { body } = await api.request<CoachSession>(
        'GET',
        `/api/projects/${project.id}/coach`,
      );

      expect(body).toEqual({
        projectId: project.id,
        mode: 'exercise',
        modelingIntent: null,
        stage: 'guiding',
        objectives: completeExercise.learningObjectives,
        turns: [],
        activeQuestionId: null,
        designRevision: null,
      });
    });

    it('creates a separate project each time it is started', async () => {
      const first = await startExercise(traceExercise.id);
      const second = await startExercise(traceExercise.id);

      expect(second.body.id).not.toBe(first.body.id);
      expect(await api.db.$count(projects)).toBe(2);
      expect(await api.db.$count(coachSessions)).toBe(2);
    });

    it('keeps the started project independent of the catalog', async () => {
      const { body: project } = await startExercise(completeExercise.id);
      const changed: SystemDesign = {
        ...project.systemDesign,
        scenarios: [],
      };

      await api.request('PATCH', `/api/projects/${project.id}`, {
        systemDesign: changed,
      });
      const restarted = await startExercise(completeExercise.id);

      expect(restarted.body.systemDesign).toEqual(
        completeExercise.startingDesign,
      );
    });

    it('returns 404 for an unknown exercise and creates nothing', async () => {
      const { status, body } = await startExercise<ErrorBody>(
        'no-such-exercise',
      );

      expect(status).toBe(404);
      expect(body.error).toBe('NOT_FOUND');
      expect(await api.db.$count(projects)).toBe(0);
    });
  });

  describe('coaching a started exercise', () => {
    it('gives the coach the exercise title, mode and prompt', async () => {
      const { body: project } = await startExercise(traceExercise.id);
      ai.willEvaluate(
        ...exerciseObjectives(traceExercise).map(() => ({
          status: 'satisfied',
          evidence: [],
          summary: 'Done.',
        })),
      );

      const { status } = await api.request(
        'POST',
        `/api/projects/${project.id}/coach/next`,
        {},
      );

      expect(status).toBe(200);
      expect(ai.evaluationInputs.map(({ objective }) => objective)).toEqual(
        exerciseObjectives(traceExercise),
      );
      expect(ai.evaluationInputs[0].context.exercise).toEqual({
        title: traceExercise.title,
        mode: 'trace',
        prompt: traceExercise.prompt,
      });
    });

    it('gives the coach no exercise in an open project', async () => {
      const { body: project } = await api.request<ProjectBody>(
        'POST',
        '/api/projects',
        { name: 'Open', systemDesign: completeExercise.startingDesign },
      );
      ai.willRespond({ type: 'question', purpose: 'guide', text: 'Next?' });

      await api.request('POST', `/api/projects/${project.id}/coach/next`, {});

      expect(project.exerciseId).toBeNull();
      expect(ai.questionInputs[0].context.exercise).toBeNull();
    });
  });

  describe('trace exercises', () => {
    type Step = SystemDesign['scenarios'][number]['steps'][number];

    const withSteps = (design: SystemDesign, steps: Step[]): SystemDesign => ({
      ...design,
      scenarios: design.scenarios.map((scenario, index) =>
        index === 0 ? { ...scenario, steps } : scenario,
      ),
    });

    const startWithSteps = async (
      exercise: (typeof EXERCISE_CATALOG)[number],
      steps: Step[],
    ) => {
      const { body: project } = await startExercise(exercise.id);
      await api.request('PATCH', `/api/projects/${project.id}`, {
        systemDesign: withSteps(exercise.startingDesign, steps),
      });
      return project;
    };

    const next = (projectId: string) =>
      api.request<CoachSession>(
        'POST',
        `/api/projects/${projectId}/coach/next`,
        {},
      );

    const satisfied = {
      status: 'satisfied',
      evidence: [],
      summary: 'Done.',
    };

    it('checks explicitness before the learning objectives', async () => {
      const { body: project } = await startExercise(traceExercise.id);

      const { body } = await api.request<CoachSession>(
        'GET',
        `/api/projects/${project.id}/coach`,
      );

      expect(body.objectives).toEqual([
        TRACE_EXPLICITNESS_OBJECTIVE,
        ...traceExercise.learningObjectives,
      ]);
    });

    it('asks about an interaction that says nothing, without calling the AI', async () => {
      const project = await startWithSteps(traceExercise, [
        {
          id: 's1',
          type: 'interaction',
          from: 'client',
          to: 'api',
          text: 'Upload CSV',
        },
        { id: 's2', type: 'note', text: '' },
        { id: 's3', type: 'interaction', from: 'api', to: 'job-db', text: ' ' },
      ]);

      const { status, body } = await next(project.id);

      expect(status).toBe(200);
      expect(body.stage).toBe('reviewing');
      expect(body.turns.at(-1)).toMatchObject({
        role: 'coach',
        output: {
          type: 'question',
          questionId: body.activeQuestionId,
          purpose: 'review',
          text: "Step 3, API → Job DB, doesn't say what is sent. What does API send to Job DB there?",
          relatedStepIds: ['s3'],
        },
      });
      expect(ai.evaluationInputs).toHaveLength(0);
      expect(ai.questionInputs).toHaveLength(0);
    });

    it('asks what a component does in an unlabeled self-interaction', async () => {
      const project = await startWithSteps(traceExercise, [
        { id: 's1', type: 'interaction', from: 'worker', to: 'worker', text: '' },
      ]);

      const { body } = await next(project.id);

      expect(body.turns.at(-1)).toMatchObject({
        output: {
          text: "Step 1 doesn't say what Worker does. What does Worker do there?",
          relatedStepIds: ['s1'],
        },
      });
    });

    it('evaluates the objectives once every interaction says something', async () => {
      const project = await startWithSteps(traceExercise, [
        {
          id: 's1',
          type: 'interaction',
          from: 'client',
          to: 'api',
          text: 'Upload CSV',
        },
      ]);
      ai.willEvaluate(
        ...exerciseObjectives(traceExercise).map(() => satisfied),
      );

      const { body } = await next(project.id);

      expect(body.stage).toBe('objective-reached');
      expect(ai.evaluationInputs[0].objective).toEqual(
        TRACE_EXPLICITNESS_OBJECTIVE,
      );
    });

    it('leaves unlabeled interactions to the evaluator outside trace exercises', async () => {
      const project = await startWithSteps(completeExercise, [
        { id: 's1', type: 'interaction', from: 'api', to: 'queue', text: '' },
      ]);
      ai.willEvaluate(
        ...completeExercise.learningObjectives.map(() => satisfied),
      );

      const { body } = await next(project.id);

      expect(body.stage).toBe('objective-reached');
      expect(ai.evaluationInputs.map(({ objective }) => objective)).toEqual(
        completeExercise.learningObjectives,
      );
    });
  });
});
