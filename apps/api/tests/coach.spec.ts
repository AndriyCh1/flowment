import {
  designRevision,
  type CoachTurn,
  type ExerciseObjective,
  type SystemDesign,
} from '@flowment/domain';
import { coachSessions, projects } from '../src/infrastructure/database';
import {
  COACH_AI_PROVIDER,
  DISCOVERY_QUESTION,
  type CoachSession,
} from '../src/modules/coach';
import { ScriptedCoachAiProvider } from './scripted-coach-ai-provider';
import { createTestApp, type TestApp } from './test-app';

type ProjectBody = {
  id: string;
  name: string;
  systemDesign: SystemDesign;
  createdAt: string;
  updatedAt: string;
};

type ErrorBody = { statusCode: number; error: string; message: unknown };

type CoachTurnOf<Role extends CoachTurn['role']> = Extract<
  CoachTurn,
  { role: Role }
>;

const emptyDesign: SystemDesign = {
  components: [],
  scenarios: [],
  assumptions: [],
};

const uploadDesign: SystemDesign = {
  components: [
    { id: 'client', name: 'Client', kind: 'client' },
    { id: 'api', name: 'API', responsibility: 'Accepts uploads' },
    { id: 'worker', name: 'Worker' },
  ],
  scenarios: [
    {
      id: 'upload',
      title: 'Successful upload',
      steps: [
        {
          id: 's1',
          type: 'interaction',
          from: 'client',
          to: 'api',
          text: 'Upload CSV',
        },
        { id: 's2', type: 'note', text: 'Some time passes' },
        {
          id: 's3',
          type: 'interaction',
          from: 'worker',
          to: 'worker',
          text: 'Validate rows',
        },
      ],
    },
    { id: 'lookup', title: 'Status lookup', steps: [] },
  ],
  assumptions: [
    { id: 'a1', statement: 'Queue delivers at least once', status: 'assumed' },
  ],
};

const componentsOnlyDesign: SystemDesign = {
  components: [{ id: 'api', name: 'API' }],
  scenarios: [],
  assumptions: [],
};

const objective: ExerciseObjective = {
  id: 'o1',
  description: 'Show how the Worker obtains the file location',
};

const secondObjective: ExerciseObjective = {
  id: 'o2',
  description: 'Show what happens when validation fails',
};

const clarify = (text: string) => ({
  type: 'question',
  purpose: 'clarify',
  text,
});
const guide = (text: string) => ({ type: 'question', purpose: 'guide', text });
const review = (text: string, relatedStepIds?: string[]) => ({
  type: 'question',
  purpose: 'review',
  text,
  relatedStepIds,
});

const MISSING_ID = '00000000-0000-4000-8000-000000000000';

describe('Coach API', () => {
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

  const createProject = async (systemDesign?: SystemDesign) => {
    const { body } = await api.request<ProjectBody>('POST', '/api/projects', {
      name: 'Uploads',
      systemDesign,
    });
    return body;
  };

  const getProject = async (id: string) => {
    const { body } = await api.request<ProjectBody>(
      'GET',
      `/api/projects/${id}`,
    );
    return body;
  };

  const coach = <T = CoachSession>(
    projectId: string,
    method: string,
    path = '',
    body?: unknown,
  ) => api.request<T>(method, `/api/projects/${projectId}/coach${path}`, body);

  const next = <T = CoachSession>(projectId: string, body: unknown = {}) =>
    coach<T>(projectId, 'POST', '/next', body);

  const reply = <T = CoachSession>(projectId: string, body: unknown) =>
    coach<T>(projectId, 'POST', '/reply', body);

  const setIntent = (projectId: string, modelingIntent: string) =>
    coach(projectId, 'PUT', '/intent', { modelingIntent });

  const startExercise = (projectId: string, objectives: ExerciseObjective[]) =>
    api.db
      .insert(coachSessions)
      .values({ projectId, mode: 'exercise', stage: 'guiding', objectives });

  const coachTurns = (session: CoachSession) =>
    session.turns.filter(
      (turn): turn is CoachTurnOf<'coach'> => turn.role === 'coach',
    );

  const learnerTurns = (session: CoachSession) =>
    session.turns.filter(
      (turn): turn is CoachTurnOf<'learner'> => turn.role === 'learner',
    );

  const lastOutput = (session: CoachSession) => {
    const turn = coachTurns(session).at(-1);
    if (!turn) {
      throw new Error('The session has no coach turn');
    }
    return turn.output;
  };

  const activeQuestionId = (session: CoachSession) => {
    if (!session.activeQuestionId) {
      throw new Error('The session has no active question');
    }
    return session.activeQuestionId;
  };

  describe('GET /api/projects/:projectId/coach', () => {
    it('returns an empty open-project session for a project never coached', async () => {
      const project = await createProject();

      const { status, body } = await coach(project.id, 'GET');

      expect(status).toBe(200);
      expect(body).toEqual({
        projectId: project.id,
        mode: 'open-project',
        modelingIntent: null,
        stage: 'discovering',
        objectives: [],
        turns: [],
        activeQuestionId: null,
        designRevision: null,
      });
      expect(await api.db.$count(coachSessions)).toBe(0);
    });

    it('returns 404 for an unknown project', async () => {
      const { status, body } = await coach<ErrorBody>(MISSING_ID, 'GET');

      expect(status).toBe(404);
      expect(body.error).toBe('NOT_FOUND');
    });

    it('returns 400 for an id that is not a UUID', async () => {
      const { status } = await coach<ErrorBody>('nope', 'GET');

      expect(status).toBe(400);
    });
  });

  describe('PUT /api/projects/:projectId/coach/intent', () => {
    it('saves the trimmed description without touching the design', async () => {
      const project = await createProject(uploadDesign);

      const { status, body } = await setIntent(
        project.id,
        '  A service that processes CSV uploads  ',
      );

      expect(status).toBe(200);
      expect(body.modelingIntent).toBe('A service that processes CSV uploads');
      expect(body.turns).toEqual([]);
      expect(await getProject(project.id)).toEqual(project);
    });

    it('clears the description when it is blank', async () => {
      const project = await createProject();
      await setIntent(project.id, 'A URL shortener');

      const { body } = await setIntent(project.id, '   ');

      expect(body.modelingIntent).toBeNull();
    });

    it('keeps the conversation when the description is revised', async () => {
      const project = await createProject();
      await setIntent(project.id, 'A notification system');
      ai.willRespond(clarify('Sending or receiving?'));
      const asked = (await next(project.id)).body;

      const { body } = await setIntent(project.id, 'Sending notifications');

      expect(body.modelingIntent).toBe('Sending notifications');
      expect(body.turns).toEqual(asked.turns);
      expect(body.activeQuestionId).toBe(asked.activeQuestionId);
    });

    it('rejects a description over the limit', async () => {
      const project = await createProject();

      const { status } = await coach<ErrorBody>(project.id, 'PUT', '/intent', {
        modelingIntent: 'x'.repeat(2001),
      });

      expect(status).toBe(400);
    });

    it('returns 404 for an unknown project', async () => {
      const { status } = await coach<ErrorBody>(MISSING_ID, 'PUT', '/intent', {
        modelingIntent: 'A URL shortener',
      });

      expect(status).toBe(404);
    });
  });

  describe('POST /api/projects/:projectId/coach/next for an open project', () => {
    it('asks what to model when the project is empty and has no description', async () => {
      const project = await createProject();

      const { status, body } = await next(project.id);

      expect(status).toBe(200);
      expect(body.stage).toBe('discovering');
      expect(body.designRevision).toBe(designRevision(emptyDesign));
      expect(body.turns).toHaveLength(1);
      expect(lastOutput(body)).toEqual({
        type: 'question',
        questionId: body.activeQuestionId,
        purpose: 'discover',
        text: DISCOVERY_QUESTION,
      });
      expect(ai.questionInputs).toHaveLength(0);
      expect(ai.evaluationInputs).toHaveLength(0);
    });

    it('takes the answer to that question as the description', async () => {
      const project = await createProject();
      const asked = (await next(project.id)).body;

      const { body } = await reply(project.id, {
        questionId: activeQuestionId(asked),
        kind: 'answer',
        text: 'How a URL shortener handles a new short link',
      });

      expect(body.modelingIntent).toBe(
        'How a URL shortener handles a new short link',
      );
    });

    it('does not take "I don\'t know" or a skip as the description', async () => {
      const project = await createProject();
      const first = (await next(project.id)).body;
      await reply(project.id, {
        questionId: activeQuestionId(first),
        kind: 'unknown',
        text: 'Not sure yet',
      });
      const second = (await next(project.id)).body;

      const { body } = await reply(project.id, {
        questionId: activeQuestionId(second),
        kind: 'skip',
      });

      expect(body.modelingIntent).toBeNull();
      expect(lastOutput(second)).toMatchObject({ purpose: 'discover' });
      expect(ai.questionInputs).toHaveLength(0);
    });

    it('does not replace an existing description with a discovery answer', async () => {
      const project = await createProject();
      const asked = (await next(project.id)).body;
      await setIntent(project.id, 'A URL shortener');

      const { body } = await reply(project.id, {
        questionId: activeQuestionId(asked),
        kind: 'answer',
        text: 'Creating a short link',
      });

      expect(body.modelingIntent).toBe('A URL shortener');
    });

    it('coaches from the description when the project is empty', async () => {
      const project = await createProject();
      await setIntent(project.id, 'How a URL shortener creates a short link');
      ai.willRespond(guide('What triggers the creation of a short link?'));

      const { status, body } = await next(project.id);

      expect(status).toBe(200);
      expect(body.stage).toBe('guiding');
      expect(lastOutput(body)).toEqual({
        type: 'question',
        questionId: body.activeQuestionId,
        purpose: 'guide',
        text: 'What triggers the creation of a short link?',
      });
      expect(ai.questionInputs).toEqual([
        {
          focus: { kind: 'open' },
          context: {
            projectId: project.id,
            mode: 'open-project',
            designRevision: designRevision(emptyDesign),
            modelingIntent: 'How a URL shortener creates a short link',
            components: [],
            scenarios: [],
            assumptions: [],
            conversation: [],
          },
        },
      ]);
    });

    it('carries a clarification and its answer into the next response', async () => {
      const project = await createProject();
      await setIntent(project.id, 'A notification system');
      ai.willRespond(
        clarify('Are you focusing on sending a notification or receiving it?'),
        guide('What event starts that sending flow?'),
      );

      const asked = (await next(project.id)).body;
      const answered = (
        await reply(project.id, {
          questionId: activeQuestionId(asked),
          kind: 'answer',
          text: '  Sending a notification  ',
        })
      ).body;
      const followUp = (await next(project.id)).body;

      expect(asked.stage).toBe('clarifying');
      expect(answered.activeQuestionId).toBeNull();
      expect(learnerTurns(answered)).toEqual([
        expect.objectContaining({
          role: 'learner',
          kind: 'answer',
          text: 'Sending a notification',
          relatedQuestionId: asked.activeQuestionId,
        }),
      ]);
      expect(ai.questionInputs[1].context.conversation).toEqual([
        {
          role: 'coach',
          kind: 'question',
          purpose: 'clarify',
          text: 'Are you focusing on sending a notification or receiving it?',
        },
        { role: 'learner', kind: 'answer', text: 'Sending a notification' },
      ]);
      expect(followUp.stage).toBe('guiding');
      expect(followUp.turns).toHaveLength(3);
      expect(followUp.modelingIntent).toBe('A notification system');
    });

    it('passes an "I don\'t know" answer on and records no assumption itself', async () => {
      const project = await createProject();
      await setIntent(project.id, 'A booking service');
      ai.willRespond(
        clarify('Does a booking need payment before it is confirmed?'),
        {
          type: 'next-action',
          action: 'record-assumption',
          text: 'Pick one for now and record it as an assumption, for example "Assumption: bookings are confirmed without payment".',
        },
      );
      const asked = (await next(project.id)).body;
      await reply(project.id, {
        questionId: activeQuestionId(asked),
        kind: 'unknown',
      });

      const { body } = await next(project.id);

      expect(ai.questionInputs[1].context.conversation.at(-1)).toEqual({
        role: 'learner',
        kind: 'unknown',
        text: '',
      });
      expect(lastOutput(body)).toEqual({
        type: 'next-action',
        action: 'record-assumption',
        text: 'Pick one for now and record it as an assumption, for example "Assumption: bookings are confirmed without payment".',
      });
      expect(body.stage).toBe('guiding');
      expect(body.activeQuestionId).toBeNull();
      expect((await getProject(project.id)).systemDesign).toEqual(emptyDesign);
    });

    it('suggests one first modeling action', async () => {
      const project = await createProject();
      await setIntent(project.id, 'How a URL shortener creates a short link');
      ai.willRespond({
        type: 'next-action',
        action: 'create-scenario',
        text: 'Start with one execution: add a scenario for creating a short link.',
      });

      const { body } = await next(project.id);

      expect(body.stage).toBe('guiding');
      expect(body.activeQuestionId).toBeNull();
      expect(lastOutput(body)).toMatchObject({
        type: 'next-action',
        action: 'create-scenario',
      });
    });

    it('reads the latest design and can return to clarification after edits', async () => {
      const project = await createProject();
      await setIntent(project.id, 'A service that processes CSV uploads');
      ai.willRespond(
        guide('Which component first receives the upload?'),
        clarify(
          'Is the file validated before or after the upload is accepted?',
        ),
      );
      const before = (await next(project.id)).body;
      await api.request('PATCH', `/api/projects/${project.id}`, {
        systemDesign: uploadDesign,
      });

      const { body } = await next(project.id, { scenarioId: 'upload' });

      expect(before.designRevision).toBe(designRevision(emptyDesign));
      expect(body.designRevision).toBe(designRevision(uploadDesign));
      expect(body.stage).toBe('clarifying');
      expect(ai.questionInputs[0].context.components).toEqual([]);
      expect(ai.questionInputs[1].context).toMatchObject({
        designRevision: designRevision(uploadDesign),
        components: [
          { name: 'Client', kind: 'client' },
          { name: 'API', responsibility: 'Accepts uploads' },
          { name: 'Worker' },
        ],
        scenarios: [
          {
            id: 'upload',
            title: 'Successful upload',
            selected: true,
            steps: [
              {
                id: 's1',
                number: 1,
                type: 'interaction',
                from: 'Client',
                to: 'API',
                text: 'Upload CSV',
              },
              { id: 's2', number: 2, type: 'note', text: 'Some time passes' },
              {
                id: 's3',
                number: 3,
                type: 'interaction',
                from: 'Worker',
                to: 'Worker',
                text: 'Validate rows',
              },
            ],
          },
          { id: 'lookup', title: 'Status lookup', selected: false, steps: [] },
        ],
        assumptions: [
          { statement: 'Queue delivers at least once', status: 'assumed' },
        ],
      });
    });

    it('asks the provider when the project has a model but no description', async () => {
      const project = await createProject(componentsOnlyDesign);
      ai.willRespond(guide('Which execution do you want to trace first?'));

      const { body } = await next(project.id);

      expect(lastOutput(body)).toMatchObject({ purpose: 'guide' });
      expect(ai.questionInputs[0].context.modelingIntent).toBeNull();
    });

    it('keeps references to real steps and drops imaginary ones', async () => {
      const project = await createProject(uploadDesign);
      ai.willRespond(
        review('How does the Worker know which rows to validate?', [
          's3',
          'imaginary',
          's3',
        ]),
      );

      const { body } = await next(project.id);

      expect(body.stage).toBe('reviewing');
      expect(lastOutput(body)).toMatchObject({
        purpose: 'review',
        relatedStepIds: ['s3'],
      });
    });

    it('does not review a design that has no steps', async () => {
      const project = await createProject(componentsOnlyDesign);
      ai.willRespond(review('How does the API get the file?', ['s1']));

      const { body } = await next(project.id);

      expect(body.stage).toBe('guiding');
      expect(lastOutput(body)).toEqual({
        type: 'question',
        questionId: body.activeQuestionId,
        purpose: 'guide',
        text: 'How does the API get the file?',
      });
    });

    it('never evaluates an objective or reports one as reached', async () => {
      const project = await createProject(uploadDesign);
      await setIntent(project.id, 'A service that processes CSV uploads');
      ai.willRespond({
        type: 'objective-satisfied',
        evidence: [],
        summary: 'Looks complete.',
      });

      const { status } = await next<ErrorBody>(project.id);
      const { body } = await coach(project.id, 'GET');

      expect(status).toBe(503);
      expect(ai.evaluationInputs).toHaveLength(0);
      expect(body.turns).toEqual([]);
      expect(body.stage).toBe('discovering');
    });

    it('replaces the active question when asked again before an answer', async () => {
      const project = await createProject(componentsOnlyDesign);
      ai.willRespond(
        guide('Which execution do you want to trace first?'),
        guide('What does the API receive first?'),
      );
      const first = (await next(project.id)).body;

      const second = (await next(project.id)).body;
      const late = await reply<ErrorBody>(project.id, {
        questionId: activeQuestionId(first),
        kind: 'answer',
        text: 'The upload',
      });

      expect(second.activeQuestionId).not.toBe(first.activeQuestionId);
      expect(second.turns).toHaveLength(2);
      expect(late.status).toBe(409);
    });

    it('keeps the description and answers when the provider fails', async () => {
      const project = await createProject();
      await setIntent(project.id, 'A notification system');
      ai.willRespond(
        clarify('Sending or receiving?'),
        new Error('upstream timeout'),
      );
      const asked = (await next(project.id)).body;
      const answered = (
        await reply(project.id, {
          questionId: activeQuestionId(asked),
          kind: 'answer',
          text: 'Sending',
        })
      ).body;

      const failed = await next<ErrorBody>(project.id);
      const { body } = await coach(project.id, 'GET');

      expect(failed.status).toBe(503);
      expect(failed.body.error).toBe('UNAVAILABLE');
      expect(failed.body.message).toBe(
        "The coach couldn't respond. Try again.",
      );
      expect(body).toEqual(answered);
    });

    it('rejects provider output that does not match the contract', async () => {
      const project = await createProject(componentsOnlyDesign);
      ai.willRespond({ type: 'question', purpose: 'criticise', text: 'Why?' });

      const { status } = await next<ErrorBody>(project.id);
      const { body } = await coach(project.id, 'GET');

      expect(status).toBe(503);
      expect(body.turns).toEqual([]);
    });

    it('refuses a response made stale by a change during generation', async () => {
      const project = await createProject();
      await setIntent(project.id, 'A notification system');
      ai.willRespond(async () => {
        await setIntent(project.id, 'A payment system');
        return clarify('Sending or receiving?');
      });

      const { status, body } = await next<ErrorBody>(project.id);
      const session = (await coach(project.id, 'GET')).body;

      expect(status).toBe(409);
      expect(body.error).toBe('CONFLICT');
      expect(session.modelingIntent).toBe('A payment system');
      expect(session.turns).toEqual([]);
    });

    it('returns 404 for an unknown project', async () => {
      const { status } = await next<ErrorBody>(MISSING_ID);

      expect(status).toBe(404);
    });
  });

  describe('POST /api/projects/:projectId/coach/reply', () => {
    const askClarification = async () => {
      const project = await createProject(componentsOnlyDesign);
      ai.willRespond(clarify('Is the upload synchronous?'));
      const asked = (await next(project.id)).body;
      return { project, asked, questionId: activeQuestionId(asked) };
    };

    it('rejects a second reply to the same question', async () => {
      const { project, questionId } = await askClarification();
      const answer = { questionId, kind: 'answer', text: 'Yes' };
      await reply(project.id, answer);

      const duplicate = await reply<ErrorBody>(project.id, answer);
      const { body } = await coach(project.id, 'GET');

      expect(duplicate.status).toBe(409);
      expect(duplicate.body.message).toBe('That question is no longer active');
      expect(learnerTurns(body)).toHaveLength(1);
    });

    it('accepts only one of two simultaneous replies', async () => {
      const { project, questionId } = await askClarification();
      const answer = { questionId, kind: 'answer', text: 'Yes' };

      const results = await Promise.all([
        reply<unknown>(project.id, answer),
        reply<unknown>(project.id, answer),
      ]);
      const { body } = await coach(project.id, 'GET');

      expect(results.map(({ status }) => status).sort()).toEqual([200, 409]);
      expect(learnerTurns(body)).toHaveLength(1);
    });

    it('rejects a reply to a question that was never asked', async () => {
      const { project } = await askClarification();

      const { status } = await reply<ErrorBody>(project.id, {
        questionId: 'made-up',
        kind: 'answer',
        text: 'Yes',
      });

      expect(status).toBe(409);
    });

    it('rejects a reply when the project has no conversation', async () => {
      const project = await createProject();

      const { status } = await reply<ErrorBody>(project.id, {
        questionId: 'made-up',
        kind: 'answer',
        text: 'Yes',
      });

      expect(status).toBe(409);
    });

    it('requires text for an answer', async () => {
      const { project, questionId } = await askClarification();

      const { status } = await reply<ErrorBody>(project.id, {
        questionId,
        kind: 'answer',
        text: '   ',
      });
      const { body } = await coach(project.id, 'GET');

      expect(status).toBe(400);
      expect(body.activeQuestionId).toBe(questionId);
    });

    it('lets the learner skip a question', async () => {
      const { project, questionId } = await askClarification();
      ai.willRespond(guide('What does the API do with the file?'));

      const skipped = (await reply(project.id, { questionId, kind: 'skip' }))
        .body;
      await next(project.id);

      expect(skipped.activeQuestionId).toBeNull();
      expect(learnerTurns(skipped)).toEqual([
        expect.objectContaining({
          kind: 'skip',
          text: '',
          relatedQuestionId: questionId,
        }),
      ]);
      expect(ai.questionInputs[1].context.conversation.at(-1)).toEqual({
        role: 'learner',
        kind: 'skip',
        text: '',
      });
    });

    it('lets the learner ask for the question to be rephrased', async () => {
      const { project, questionId } = await askClarification();
      ai.willRespond(clarify('Does the client wait for processing to finish?'));

      await reply(project.id, { questionId, kind: 'rephrase' });
      const { body } = await next(project.id);

      expect(ai.questionInputs[1].context.conversation.at(-1)).toEqual({
        role: 'learner',
        kind: 'rephrase',
        text: '',
      });
      expect(body.stage).toBe('clarifying');
      expect(body.activeQuestionId).not.toBe(questionId);
    });

    it('accepts an answer after the design changed', async () => {
      const { project, asked, questionId } = await askClarification();
      await api.request('PATCH', `/api/projects/${project.id}`, {
        systemDesign: uploadDesign,
      });

      const { status, body } = await reply(project.id, {
        questionId,
        kind: 'answer',
        text: 'No, it is processed in the background',
      });

      expect(status).toBe(200);
      expect(body.designRevision).toBe(asked.designRevision);
      expect(body.designRevision).not.toBe(designRevision(uploadDesign));
    });

    it('returns 404 for an unknown project', async () => {
      const { status } = await reply<ErrorBody>(MISSING_ID, {
        questionId: 'q',
        kind: 'skip',
      });

      expect(status).toBe(404);
    });
  });

  describe('POST /api/projects/:projectId/coach/reset', () => {
    it('clears the conversation and keeps the description and the design', async () => {
      const project = await createProject(uploadDesign);
      await setIntent(project.id, 'A service that processes CSV uploads');
      ai.willRespond(review('Where do the rows come from?', ['s3']));
      await next(project.id);

      const { status, body } = await coach(project.id, 'POST', '/reset');

      expect(status).toBe(200);
      expect(body).toEqual({
        projectId: project.id,
        mode: 'open-project',
        modelingIntent: 'A service that processes CSV uploads',
        stage: 'discovering',
        objectives: [],
        turns: [],
        activeQuestionId: null,
        designRevision: null,
      });
      expect(await getProject(project.id)).toEqual(project);
    });

    it('returns an empty session for a project never coached', async () => {
      const project = await createProject();

      const { status, body } = await coach(project.id, 'POST', '/reset');

      expect(status).toBe(200);
      expect(body.turns).toEqual([]);
      expect(await api.db.$count(coachSessions)).toBe(0);
    });

    it('returns 404 for an unknown project', async () => {
      const { status } = await coach<ErrorBody>(MISSING_ID, 'POST', '/reset');

      expect(status).toBe(404);
    });
  });

  describe('exercise coaching', () => {
    it('reports a satisfied objective and asks nothing further', async () => {
      const project = await createProject(uploadDesign);
      await startExercise(project.id, [objective]);
      ai.willEvaluate({
        status: 'satisfied',
        evidence: ['Successful upload, step 3: the Worker validates the rows'],
        summary: 'The Worker obtains the file location before reading it.',
      });

      const { status, body } = await next(project.id);

      expect(status).toBe(200);
      expect(body.mode).toBe('exercise');
      expect(body.objectives).toEqual([objective]);
      expect(body.stage).toBe('objective-reached');
      expect(body.activeQuestionId).toBeNull();
      expect(lastOutput(body)).toEqual({
        type: 'objective-satisfied',
        evidence: ['Successful upload, step 3: the Worker validates the rows'],
        summary: 'The Worker obtains the file location before reading it.',
      });
      expect(ai.questionInputs).toHaveLength(0);
      expect(ai.evaluationInputs).toEqual([
        {
          objective,
          context: expect.objectContaining({
            mode: 'exercise',
            designRevision: designRevision(uploadDesign),
          }),
        },
      ]);
    });

    it('asks one question about the gap of an unsatisfied objective', async () => {
      const project = await createProject(uploadDesign);
      await startExercise(project.id, [objective]);
      ai.willEvaluate({
        status: 'unsatisfied',
        evidence: ['Successful upload has no step that loads the job'],
        gap: 'The Worker never obtains the file location',
      });
      ai.willRespond(
        guide('What does the Worker know when it starts validating?'),
      );

      const { body } = await next(project.id);

      expect(body.stage).toBe('reviewing');
      expect(body.turns).toHaveLength(1);
      expect(lastOutput(body)).toEqual({
        type: 'question',
        questionId: body.activeQuestionId,
        purpose: 'review',
        text: 'What does the Worker know when it starts validating?',
      });
      expect(ai.questionInputs).toHaveLength(1);
      expect(ai.questionInputs[0].focus).toEqual({
        kind: 'objective-gap',
        objective,
        gap: 'The Worker never obtains the file location',
        evidence: ['Successful upload has no step that loads the job'],
      });
    });

    it('guides instead of reviewing when the exercise has no steps yet', async () => {
      const project = await createProject(componentsOnlyDesign);
      await startExercise(project.id, [objective]);
      ai.willEvaluate({
        status: 'unsatisfied',
        evidence: [],
        gap: 'No sequence has been written',
      });
      ai.willRespond(review('What happens first?'));

      const { body } = await next(project.id);

      expect(body.stage).toBe('guiding');
      expect(lastOutput(body)).toMatchObject({ purpose: 'guide' });
    });

    it('asks for clarification when the objective cannot be judged', async () => {
      const project = await createProject(uploadDesign);
      await startExercise(project.id, [objective]);
      ai.willEvaluate({
        status: 'indeterminate',
        reason: 'It is unclear where the file is stored',
      });
      ai.willRespond(review('Where is the uploaded file stored?'));

      const { body } = await next(project.id);

      expect(body.stage).toBe('clarifying');
      expect(lastOutput(body)).toMatchObject({
        type: 'question',
        purpose: 'clarify',
        text: 'Where is the uploaded file stored?',
      });
      expect(ai.questionInputs[0].focus).toEqual({
        kind: 'objective-unclear',
        objective,
        reason: 'It is unclear where the file is stored',
      });
    });

    it('moves on to the next objective once one is satisfied', async () => {
      const project = await createProject(uploadDesign);
      await startExercise(project.id, [objective, secondObjective]);
      ai.willEvaluate(
        { status: 'satisfied', evidence: ['step 1'], summary: 'First done.' },
        { status: 'unsatisfied', evidence: [], gap: 'No failure path' },
      );
      ai.willRespond(review('What happens when a row is invalid?', ['s3']));

      const { body } = await next(project.id);

      expect(ai.evaluationInputs.map((input) => input.objective)).toEqual([
        objective,
        secondObjective,
      ]);
      expect(ai.questionInputs[0].focus).toMatchObject({
        kind: 'objective-gap',
        objective: secondObjective,
      });
      expect(lastOutput(body)).toMatchObject({
        purpose: 'review',
        relatedStepIds: ['s3'],
      });
    });

    it('reports every objective once all are satisfied', async () => {
      const project = await createProject(uploadDesign);
      await startExercise(project.id, [objective, secondObjective]);
      ai.willEvaluate(
        { status: 'satisfied', evidence: ['step 1'], summary: 'First done.' },
        { status: 'satisfied', evidence: ['step 3'], summary: 'Second done.' },
      );

      const { body } = await next(project.id);

      expect(lastOutput(body)).toEqual({
        type: 'objective-satisfied',
        evidence: ['step 1', 'step 3'],
        summary: 'First done. Second done.',
      });
    });

    it('re-evaluates against the latest design when asked again', async () => {
      const project = await createProject(componentsOnlyDesign);
      await startExercise(project.id, [objective]);
      ai.willEvaluate(
        { status: 'unsatisfied', evidence: [], gap: 'No sequence yet' },
        { status: 'satisfied', evidence: ['step 3'], summary: 'Done.' },
      );
      ai.willRespond(guide('What happens first?'));
      await next(project.id);
      await api.request('PATCH', `/api/projects/${project.id}`, {
        systemDesign: uploadDesign,
      });

      const { body } = await next(project.id);

      expect(ai.evaluationInputs[1].context.designRevision).toBe(
        designRevision(uploadDesign),
      );
      expect(body.stage).toBe('objective-reached');
      expect(body.activeQuestionId).toBeNull();
    });

    it('does not accept a suggested action in place of a question', async () => {
      const project = await createProject(uploadDesign);
      await startExercise(project.id, [objective]);
      ai.willEvaluate({ status: 'unsatisfied', evidence: [], gap: 'A gap' });
      ai.willRespond({
        type: 'next-action',
        action: 'add-step',
        text: 'Add the missing step.',
      });

      const { status } = await next<ErrorBody>(project.id);

      expect(status).toBe(503);
    });

    it('rejects an evaluation that does not match the contract', async () => {
      const project = await createProject(uploadDesign);
      await startExercise(project.id, [objective]);
      ai.willEvaluate({ status: 'unsatisfied', evidence: [] });

      const { status } = await next<ErrorBody>(project.id);
      const { body } = await coach(project.id, 'GET');

      expect(status).toBe(503);
      expect(body.turns).toEqual([]);
    });

    it('keeps the objectives when the conversation is reset', async () => {
      const project = await createProject(uploadDesign);
      await startExercise(project.id, [objective]);
      ai.willEvaluate({ status: 'satisfied', evidence: [], summary: 'Done.' });
      await next(project.id);

      const { body } = await coach(project.id, 'POST', '/reset');

      expect(body).toMatchObject({
        mode: 'exercise',
        stage: 'guiding',
        objectives: [objective],
        turns: [],
      });
    });
  });

  describe('persistence', () => {
    it('returns the stored conversation when the project is reopened', async () => {
      const project = await createProject();
      await setIntent(project.id, 'A notification system');
      ai.willRespond(
        clarify('Sending or receiving?'),
        guide('What starts it?'),
      );
      const asked = (await next(project.id)).body;
      await reply(project.id, {
        questionId: activeQuestionId(asked),
        kind: 'answer',
        text: 'Sending',
      });
      const before = (await next(project.id)).body;

      const { body } = await coach(project.id, 'GET');
      const [stored] = await api.db.select().from(coachSessions);

      expect(body).toEqual(before);
      expect(body.turns).toHaveLength(3);
      expect(body.activeQuestionId).not.toBeNull();
      expect(stored.turns).toEqual(before.turns);
      expect(stored.modelingIntent).toBe('A notification system');
    });

    it('never changes the system design', async () => {
      const project = await createProject(uploadDesign);
      await setIntent(project.id, 'A service that processes CSV uploads');
      ai.willRespond(
        review('Where do the rows come from?', ['s3']),
        {
          type: 'next-action',
          action: 'add-step',
          text: 'Add the step that gives the Worker the file.',
        },
        {
          type: 'next-action',
          action: 'record-assumption',
          text: 'Record how long a file is kept as an assumption.',
        },
      );
      const asked = (await next(project.id)).body;
      await reply(project.id, {
        questionId: activeQuestionId(asked),
        kind: 'answer',
        text: 'From the uploaded file',
      });
      await next(project.id);
      await next(project.id);
      await coach(project.id, 'POST', '/reset');

      expect(await getProject(project.id)).toEqual(project);
    });

    it('removes the session with its project', async () => {
      const project = await createProject();
      await setIntent(project.id, 'A notification system');

      await api.db.delete(projects);

      expect(await api.db.$count(coachSessions)).toBe(0);
    });
  });
});
