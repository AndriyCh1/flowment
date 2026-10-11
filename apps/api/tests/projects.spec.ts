import type { SystemDesign } from '@flowment/domain';
import { projects } from '../src/infrastructure/database';
import { createTestApp, type TestApp } from './test-app';

type ProjectBody = {
  id: string;
  name: string;
  systemDesign: SystemDesign;
  createdAt: string;
  updatedAt: string;
};

type ProjectListBody = {
  items: Omit<ProjectBody, 'systemDesign'>[];
  total: number;
  limit: number;
  offset: number;
};

type ErrorBody = { statusCode: number; error: string; message: unknown };

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
  ],
  assumptions: [
    { id: 'a1', statement: 'Queue delivers at least once', status: 'assumed' },
  ],
};

const brokenDesign: SystemDesign = {
  ...uploadDesign,
  scenarios: [
    {
      id: 'upload',
      title: 'Broken',
      steps: [
        { id: 's1', type: 'interaction', from: 'ghost', to: 'api', text: 'x' },
      ],
    },
  ],
};

const MISSING_ID = '00000000-0000-4000-8000-000000000000';

describe('Projects API', () => {
  let api: TestApp;

  beforeAll(async () => {
    api = await createTestApp();
  });

  afterAll(async () => {
    await api.close();
  });

  beforeEach(async () => {
    await api.db.delete(projects);
  });

  function createProject(body: unknown) {
    return api.request<ProjectBody>('POST', '/api/projects', body);
  }

  function getProject(id: string) {
    return api.request<ProjectBody>('GET', `/api/projects/${id}`);
  }

  function listProjects(query = '') {
    return api.request<ProjectListBody>('GET', `/api/projects${query}`);
  }

  function updateProject(id: string, body: unknown) {
    return api.request<ProjectBody>('PATCH', `/api/projects/${id}`, body);
  }

  describe('POST /api/projects', () => {
    it('creates a project with an empty design', async () => {
      const { status, body } = await createProject({ name: '  CSV import ' });

      expect(status).toBe(201);
      expect(body).toEqual({
        id: expect.stringMatching(/^[0-9a-f-]{36}$/),
        name: 'CSV import',
        systemDesign: { components: [], scenarios: [], assumptions: [] },
        createdAt: expect.any(String),
        updatedAt: body.createdAt,
      });
      expect(new Date(body.createdAt).toISOString()).toBe(body.createdAt);
    });

    it('stores a provided design unchanged', async () => {
      const created = await createProject({
        name: 'CSV import',
        systemDesign: uploadDesign,
      });

      expect(created.status).toBe(201);
      const loaded = await getProject(created.body.id);
      expect(loaded.body.systemDesign).toEqual(uploadDesign);
    });

    it.each([
      ['a missing name', {}],
      ['a blank name', { name: '   ' }],
      [
        'a design with an unknown component',
        { name: 'x', systemDesign: brokenDesign },
      ],
      [
        'a design missing a collection',
        { name: 'x', systemDesign: { components: [] } },
      ],
    ])('rejects %s without storing it', async (_case, payload) => {
      const { status } = await createProject(payload);

      expect(status).toBe(400);
      expect((await listProjects()).body.total).toBe(0);
    });
  });

  describe('GET /api/projects', () => {
    it('lists summaries, most recently updated first', async () => {
      const first = await createProject({
        name: 'First',
        systemDesign: uploadDesign,
      });
      const second = await createProject({ name: 'Second' });

      const { status, body } = await listProjects();

      expect(status).toBe(200);
      expect(body).toEqual({
        items: [
          {
            id: second.body.id,
            name: 'Second',
            createdAt: second.body.createdAt,
            updatedAt: second.body.updatedAt,
          },
          {
            id: first.body.id,
            name: 'First',
            createdAt: first.body.createdAt,
            updatedAt: first.body.updatedAt,
          },
        ],
        total: 2,
        limit: 20,
        offset: 0,
      });
    });

    it('moves a project to the top when it is updated', async () => {
      const first = await createProject({ name: 'First' });
      await createProject({ name: 'Second' });

      await updateProject(first.body.id, { name: 'First, renamed' });

      const { body } = await listProjects();
      expect(body.items.map((item) => item.name)).toEqual([
        'First, renamed',
        'Second',
      ]);
    });

    it('paginates with limit and offset', async () => {
      for (const name of ['One', 'Two', 'Three']) {
        await createProject({ name });
      }

      const { body } = await listProjects('?limit=1&offset=1');

      expect(body.items.map((item) => item.name)).toEqual(['Two']);
      expect(body).toMatchObject({ total: 3, limit: 1, offset: 1 });
    });

    it('rejects an out-of-range limit', async () => {
      const { status } = await listProjects('?limit=0');

      expect(status).toBe(400);
    });
  });

  describe('GET /api/projects/:id', () => {
    it('loads the full project', async () => {
      const created = await createProject({
        name: 'CSV import',
        systemDesign: uploadDesign,
      });

      const { status, body } = await getProject(created.body.id);

      expect(status).toBe(200);
      expect(body).toEqual(created.body);
    });

    it('returns 404 for an unknown id', async () => {
      const { status, body } = await api.request<ErrorBody>(
        'GET',
        `/api/projects/${MISSING_ID}`,
      );

      expect(status).toBe(404);
      expect(body).toMatchObject({ statusCode: 404, error: 'NOT_FOUND' });
    });

    it('returns 400 for an id that is not a UUID', async () => {
      const { status } = await getProject('not-a-uuid');

      expect(status).toBe(400);
    });
  });

  describe('PATCH /api/projects/:id', () => {
    it('saves a design and keeps the name', async () => {
      const created = await createProject({ name: 'CSV import' });

      const { status, body } = await updateProject(created.body.id, {
        systemDesign: uploadDesign,
      });

      expect(status).toBe(200);
      expect(body).toMatchObject({
        name: 'CSV import',
        systemDesign: uploadDesign,
      });
      expect(body.createdAt).toBe(created.body.createdAt);
      expect(Date.parse(body.updatedAt)).toBeGreaterThan(
        Date.parse(created.body.updatedAt),
      );
      expect((await getProject(created.body.id)).body).toEqual(body);
    });

    it('renames and keeps the design', async () => {
      const created = await createProject({
        name: 'Draft',
        systemDesign: uploadDesign,
      });

      const { body } = await updateProject(created.body.id, {
        name: 'CSV import',
      });

      expect(body).toMatchObject({
        name: 'CSV import',
        systemDesign: uploadDesign,
      });
    });

    it.each([
      ['an empty update', {}],
      ['a blank name', { name: ' ' }],
      ['a design with an unknown component', { systemDesign: brokenDesign }],
    ])('rejects %s and keeps the stored project', async (_case, payload) => {
      const created = await createProject({
        name: 'CSV import',
        systemDesign: uploadDesign,
      });

      const { status } = await updateProject(created.body.id, payload);

      expect(status).toBe(400);
      expect((await getProject(created.body.id)).body).toEqual(created.body);
    });

    it('returns 404 for an unknown id', async () => {
      const { status } = await updateProject(MISSING_ID, { name: 'x' });

      expect(status).toBe(404);
    });
  });
});
