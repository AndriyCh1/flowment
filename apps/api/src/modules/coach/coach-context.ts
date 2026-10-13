import {
  coachOutputText,
  designRevision,
  type AssumptionStatus,
  type CoachAction,
  type CoachMode,
  type CoachQuestionPurpose,
  type CoachTurn,
  type Component,
  type ComponentKind,
  type LearnerReplyKind,
  type SequenceScenario,
  type SequenceStep,
  type SystemDesign,
} from '@flowment/domain';

export const MAX_CONTEXT_TURNS = 40;

const UNNAMED_COMPONENT = 'Unnamed component';

export type ContextComponent = {
  name: string;
  kind?: ComponentKind;
  responsibility?: string;
};

export type ContextStep =
  | {
      id: string;
      number: number;
      type: 'interaction';
      from: string;
      to: string;
      text: string;
    }
  | {
      id: string;
      number: number;
      type: 'note';
      component?: string;
      text: string;
    };

export type ContextScenario = {
  id: string;
  title: string;
  description?: string;
  selected: boolean;
  steps: ContextStep[];
};

export type ContextAssumption = {
  statement: string;
  status: AssumptionStatus;
  evidence?: string;
};

export type ContextTurn =
  | {
      role: 'coach';
      kind: 'question';
      purpose: CoachQuestionPurpose;
      text: string;
    }
  | { role: 'coach'; kind: 'next-action'; action: CoachAction; text: string }
  | { role: 'coach'; kind: 'objective-satisfied'; text: string }
  | { role: 'learner'; kind: LearnerReplyKind; text: string };

export type CoachContext = {
  projectId: string;
  mode: CoachMode;
  designRevision: string;
  modelingIntent: string | null;
  components: ContextComponent[];
  scenarios: ContextScenario[];
  assumptions: ContextAssumption[];
  conversation: ContextTurn[];
};

export type CoachContextSource = {
  projectId: string;
  mode: CoachMode;
  modelingIntent: string | null;
  turns: readonly CoachTurn[];
  design: SystemDesign;
  selectedScenarioId: string | null;
};

function componentName(component: Component): string {
  return component.name.trim() || UNNAMED_COMPONENT;
}

function contextComponent(component: Component): ContextComponent {
  return {
    name: componentName(component),
    ...(component.kind ? { kind: component.kind } : {}),
    ...(component.responsibility
      ? { responsibility: component.responsibility }
      : {}),
  };
}

function contextStep(
  step: SequenceStep,
  index: number,
  names: ReadonlyMap<string, string>,
): ContextStep {
  const nameOf = (id: string) => names.get(id) ?? UNNAMED_COMPONENT;
  const number = index + 1;

  if (step.type === 'interaction') {
    return {
      id: step.id,
      number,
      type: 'interaction',
      from: nameOf(step.from),
      to: nameOf(step.to),
      text: step.text,
    };
  }

  return {
    id: step.id,
    number,
    type: 'note',
    ...(step.componentId ? { component: nameOf(step.componentId) } : {}),
    text: step.text,
  };
}

function contextScenario(
  scenario: SequenceScenario,
  names: ReadonlyMap<string, string>,
  selectedScenarioId: string | null,
): ContextScenario {
  return {
    id: scenario.id,
    title: scenario.title,
    ...(scenario.description ? { description: scenario.description } : {}),
    selected: scenario.id === selectedScenarioId,
    steps: scenario.steps.map((step, index) => contextStep(step, index, names)),
  };
}

function contextTurn(turn: CoachTurn): ContextTurn {
  if (turn.role === 'learner') {
    return { role: 'learner', kind: turn.kind, text: turn.text };
  }

  const { output } = turn;
  const text = coachOutputText(output);

  switch (output.type) {
    case 'question':
      return { role: 'coach', kind: 'question', purpose: output.purpose, text };
    case 'next-action':
      return {
        role: 'coach',
        kind: 'next-action',
        action: output.action,
        text,
      };
    case 'objective-satisfied':
      return { role: 'coach', kind: 'objective-satisfied', text };
  }
}

export function buildCoachContext({
  projectId,
  mode,
  modelingIntent,
  turns,
  design,
  selectedScenarioId,
}: CoachContextSource): CoachContext {
  const names = new Map(
    design.components.map((component) => [
      component.id,
      componentName(component),
    ]),
  );

  return {
    projectId,
    mode,
    designRevision: designRevision(design),
    modelingIntent: modelingIntent?.trim() || null,
    components: design.components.map(contextComponent),
    scenarios: design.scenarios.map((scenario) =>
      contextScenario(scenario, names, selectedScenarioId),
    ),
    assumptions: design.assumptions.map(({ statement, status, evidence }) => ({
      statement,
      status,
      ...(evidence ? { evidence } : {}),
    })),
    conversation: turns.slice(-MAX_CONTEXT_TURNS).map(contextTurn),
  };
}
