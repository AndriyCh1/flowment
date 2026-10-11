import { QueryClient } from '@tanstack/react-query';
import { isClientError } from './api-error';

const MAX_RETRIES = 3;

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error) =>
          !isClientError(error) && failureCount < MAX_RETRIES,
      },
    },
  });
}
