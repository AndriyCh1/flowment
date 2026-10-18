import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react';

export type PanelTab<T extends string> = {
  id: T;
  label: string;
  content: ReactNode;
};

type TabbedPanelProps<T extends string> = {
  label: string;
  tabs: PanelTab<T>[];
  activeTab: T;
  onTabChange: (tab: T) => void;
};

export function TabbedPanel<T extends string>({
  label,
  tabs,
  activeTab,
  onTabChange,
}: TabbedPanelProps<T>) {
  const baseId = useId();
  const tabButtons = useRef(new Map<T, HTMLButtonElement>());

  const selectAdjacentTab = (event: KeyboardEvent, index: number) => {
    const step =
      event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (step === 0) {
      return;
    }
    event.preventDefault();
    const next = tabs[(index + step + tabs.length) % tabs.length].id;
    onTabChange(next);
    tabButtons.current.get(next)?.focus();
  };

  return (
    <section
      aria-label={label}
      className="flex h-full min-h-0 flex-col rounded-lg border border-zinc-200 bg-white"
    >
      <div
        role="tablist"
        aria-label={`${label} views`}
        className="flex gap-1 border-b border-zinc-200 px-2"
      >
        {tabs.map(({ id, label: tabLabel }, index) => {
          const active = id === activeTab;
          return (
            <button
              key={id}
              ref={(button) => {
                if (button) {
                  tabButtons.current.set(id, button);
                } else {
                  tabButtons.current.delete(id);
                }
              }}
              type="button"
              role="tab"
              id={`${baseId}-${id}-tab`}
              aria-selected={active}
              aria-controls={`${baseId}-${id}-panel`}
              tabIndex={active ? 0 : -1}
              onClick={() => onTabChange(id)}
              onKeyDown={(event) => selectAdjacentTab(event, index)}
              className={`-mb-px border-b-2 px-2 py-2 text-xs font-semibold tracking-wide uppercase ${
                active
                  ? 'border-zinc-900 text-zinc-900'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800'
              }`}
            >
              {tabLabel}
            </button>
          );
        })}
      </div>
      {tabs.map(({ id, content }) => (
        <div
          key={id}
          role="tabpanel"
          id={`${baseId}-${id}-panel`}
          aria-labelledby={`${baseId}-${id}-tab`}
          hidden={id !== activeTab}
          className="min-h-0 flex-1 overflow-auto p-4"
        >
          {content}
        </div>
      ))}
    </section>
  );
}
