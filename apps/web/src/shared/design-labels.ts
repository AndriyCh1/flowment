import type {
  Component,
  ComponentKind,
  SequenceScenario,
} from '@flowment/domain';

const kindLabels: Record<ComponentKind, string> = {
  user: 'User',
  client: 'Client',
  service: 'Service',
  database: 'Database',
  queue: 'Queue',
  storage: 'Storage',
  'external-system': 'External system',
  other: 'Other',
};

export function participantName(component: Component): string {
  return component.name.trim() || 'Unnamed component';
}

export function componentKindLabel(kind: ComponentKind): string {
  return kindLabels[kind];
}

export function scenarioTitle(scenario: SequenceScenario): string {
  return scenario.title.trim() || 'Untitled scenario';
}
