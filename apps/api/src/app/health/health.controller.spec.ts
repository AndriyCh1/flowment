import type { DatabaseHealth } from '../../infrastructure/database';
import type { RedisHealth } from '../../infrastructure/redis';
import { HealthController } from './health.controller';

function setup({ redisDown = false } = {}) {
  const database = {
    ping: vi.fn<DatabaseHealth['ping']>().mockResolvedValue(undefined),
  };
  const redis = {
    ping: redisDown
      ? vi
          .fn<RedisHealth['ping']>()
          .mockRejectedValue(new Error('connect ECONNREFUSED'))
      : vi.fn<RedisHealth['ping']>().mockResolvedValue(undefined),
  };
  const response = { status: vi.fn<(code: number) => void>() };
  const controller = new HealthController(
    database as unknown as DatabaseHealth,
    redis as unknown as RedisHealth,
  );
  return { controller, response };
}

describe('HealthController', () => {
  it('reports liveness without checking dependencies', () => {
    const { controller } = setup();

    expect(controller.check()).toEqual({ status: 'ok' });
  });

  it('is ready when every dependency answers', async () => {
    const { controller, response } = setup();

    await expect(controller.ready(response)).resolves.toEqual({
      status: 'ok',
      checks: { database: { status: 'up' }, redis: { status: 'up' } },
    });
    expect(response.status).not.toHaveBeenCalled();
  });

  it('returns 503 with the failing check when a dependency is down', async () => {
    const { controller, response } = setup({ redisDown: true });

    await expect(controller.ready(response)).resolves.toEqual({
      status: 'error',
      checks: {
        database: { status: 'up' },
        redis: { status: 'down', error: 'connect ECONNREFUSED' },
      },
    });
    expect(response.status).toHaveBeenCalledWith(503);
  });
});
