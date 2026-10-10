import type { IncomingMessage, ServerResponse } from 'node:http';
import { RequestIdMiddleware } from './request-id.middleware';

function run(headers: IncomingMessage['headers']) {
  const request = { headers } as IncomingMessage & { id?: string };
  const setHeader = vi.fn<(name: string, value: string) => void>();
  const next = vi.fn<() => void>();
  new RequestIdMiddleware().use(
    request,
    { setHeader } as unknown as ServerResponse,
    next,
  );
  return { request, setHeader, next };
}

describe('RequestIdMiddleware', () => {
  it('keeps a valid incoming x-request-id', () => {
    const { request, setHeader, next } = run({ 'x-request-id': 'lb-abc.123' });

    expect(request.id).toBe('lb-abc.123');
    expect(setHeader).toHaveBeenCalledWith('x-request-id', 'lb-abc.123');
    expect(next).toHaveBeenCalled();
  });

  it('generates an id when the header is missing', () => {
    const { request, setHeader } = run({});

    expect(request.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(setHeader).toHaveBeenCalledWith('x-request-id', request.id);
  });

  it('replaces an id with unexpected characters', () => {
    const { request } = run({ 'x-request-id': 'bad id\n<script>' });

    expect(request.id).not.toBe('bad id\n<script>');
    expect(request.id).toMatch(/^[0-9a-f-]{36}$/);
  });
});
