import type { TrainingMode } from '@flowment/domain';

export const trainingModeLabels: Record<TrainingMode, string> = {
  trace: 'Trace',
  complete: 'Complete',
  repair: 'Repair',
};

export const trainingModeDescriptions: Record<TrainingMode, string> = {
  trace: 'You get the components and a scenario. Write the sequence.',
  complete: 'You get a sequence with a missing part. Fill it in.',
  repair: 'You get a flawed sequence. Find the flaw and fix it.',
};

const difficultyLabels: Record<number, string> = {
  1: 'Beginner',
  2: 'Intermediate',
  3: 'Advanced',
};

export function difficultyLabel(difficulty: number): string {
  return difficultyLabels[difficulty] ?? `Difficulty ${difficulty}`;
}
