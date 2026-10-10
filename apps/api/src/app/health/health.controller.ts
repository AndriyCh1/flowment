import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { ZodSerializerDto } from 'nestjs-zod';
import { DatabaseHealth } from '../../infrastructure/database';
import { RedisHealth } from '../../infrastructure/redis';
import {
  DependencyCheck,
  HealthResponseDto,
  ReadinessResponseDto,
} from './health.dto';

const PING_TIMEOUT_MS = 2_000;

// The only thing readiness needs from the response.
type StatusSetter = { status(code: number): unknown };

// Probes must never be rate limited, or an orchestrator could restart healthy pods.
@SkipThrottle()
@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly database: DatabaseHealth,
    private readonly redis: RedisHealth,
  ) {}

  /** Liveness: the process is up and serving HTTP. Checks no dependencies. */
  @Get()
  @ApiOkResponse({ type: HealthResponseDto })
  @ZodSerializerDto(HealthResponseDto)
  check(): HealthResponseDto {
    return { status: 'ok' };
  }

  /** Readiness: every dependency answers, so the instance can take traffic. */
  @Get('ready')
  @ApiOkResponse({ type: ReadinessResponseDto })
  @ApiServiceUnavailableResponse({ type: ReadinessResponseDto })
  @ZodSerializerDto(ReadinessResponseDto)
  async ready(
    @Res({ passthrough: true }) response: StatusSetter,
  ): Promise<ReadinessResponseDto> {
    const [database, redis] = await Promise.all([
      probe(() => this.database.ping(PING_TIMEOUT_MS)),
      probe(() => this.redis.ping(PING_TIMEOUT_MS)),
    ]);
    const ok = database.status === 'up' && redis.status === 'up';
    if (!ok) {
      response.status(HttpStatus.SERVICE_UNAVAILABLE);
    }
    return { status: ok ? 'ok' : 'error', checks: { database, redis } };
  }
}

async function probe(ping: () => Promise<void>): Promise<DependencyCheck> {
  try {
    await ping();
    return { status: 'up' };
  } catch (error) {
    return { status: 'down', error: rootMessage(error) };
  }
}

// Drizzle wraps driver errors ("Failed query: …"); the cause says what broke.
// A refused connection is an AggregateError with an empty message (one inner
// error per address tried), so fall back to the inner errors.
function rootMessage(error: unknown): string {
  let current = error;
  while (current instanceof Error && current.cause !== undefined) {
    current = current.cause;
  }
  if (current instanceof AggregateError && !current.message) {
    return current.errors.map(rootMessage).join('; ');
  }
  return current instanceof Error ? current.message : String(current);
}
