import type { ReactNode } from 'react';

export type WorkspaceSections = {
  exercise: ReactNode | null;
  components: ReactNode;
  design: ReactNode;
  coach: ReactNode;
  review: ReactNode;
};
