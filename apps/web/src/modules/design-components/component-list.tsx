import type { Component } from '@flowment/domain';
import {
  componentKindLabel,
  participantName,
} from '../../shared/design-labels';

type ComponentListProps = {
  components: Component[];
  selectedId: string | null;
  onSelect: (componentId: string | null) => void;
};

export function ComponentList({
  components,
  selectedId,
  onSelect,
}: ComponentListProps) {
  return (
    <ul className="space-y-1">
      {components.map((component) => {
        const selected = component.id === selectedId;

        return (
          <li key={component.id}>
            <button
              type="button"
              aria-pressed={selected}
              onClick={() => onSelect(selected ? null : component.id)}
              className={`block w-full rounded-md border px-3 py-2 text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-sky-600 ${selected ? 'border-sky-300 bg-sky-50' : 'border-transparent hover:bg-zinc-50'}`}
            >
              <span className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-medium wrap-anywhere">
                  {participantName(component)}
                </span>
                {component.kind && (
                  <span className="shrink-0 text-xs text-zinc-500">
                    {componentKindLabel(component.kind)}
                  </span>
                )}
              </span>
              {component.responsibility && (
                <span className="mt-0.5 block text-xs whitespace-pre-wrap text-zinc-600 wrap-anywhere">
                  {component.responsibility}
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
