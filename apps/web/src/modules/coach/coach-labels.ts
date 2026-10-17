import {
  maxHintsForPurpose,
  type CoachAction,
  type CoachQuestionPurpose,
  type CoachStage,
  type LearnerReplyKind,
  type SystemDesign,
} from '@flowment/domain';
import { scenarioTitle } from '../../shared/design-labels';

export const stageLabels: Record<CoachStage, string> = {
  discovering: 'Discovering',
  clarifying: 'Clarifying',
  guiding: 'Guiding',
  reviewing: 'Reviewing',
  'objective-reached': 'Objective reached',
};

export const purposeLabels: Record<CoachQuestionPurpose, string> = {
  discover: 'Getting started',
  clarify: 'Clarifying question',
  guide: 'Next step',
  review: 'Review question',
};

export const actionLabels: Record<CoachAction, string> = {
  'create-scenario': 'Suggested: add a scenario',
  'create-component': 'Suggested: add a component',
  'add-step': 'Suggested: add a step',
  'record-assumption': 'Suggested: record an assumption',
};

export const replyKindLabels: Record<
  Exclude<LearnerReplyKind, 'answer'>,
  string
> = {
  unknown: "I don't know",
  skip: 'Skipped this question',
  rephrase: 'Asked for the question in other words',
};

export function hintLabel(purpose: CoachQuestionPurpose, level: number): string {
  const limit = maxHintsForPurpose(purpose);
  return limit > 1 ? `Hint ${level} of ${limit}` : 'Hint';
}

export function stepReference(
  design: SystemDesign,
  stepId: string,
): string | undefined {
  for (const scenario of design.scenarios) {
    const index = scenario.steps.findIndex(({ id }) => id === stepId);
    if (index !== -1) {
      return `Step ${index + 1} of “${scenarioTitle(scenario)}”`;
    }
  }
  return undefined;
}
