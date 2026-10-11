import { z } from 'zod';

export const FactSchema = z
  .string()
  .refine((value) => value.trim().length > 0, 'Fact must not be blank');

export type Fact = z.infer<typeof FactSchema>;

export function normalizeFact(fact: string): string {
  return fact.trim().toLowerCase();
}

export function factsMatch(a: string, b: string): boolean {
  return normalizeFact(a) === normalizeFact(b);
}
