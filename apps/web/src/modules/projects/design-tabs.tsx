import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react';

export type DesignTab = 'scenarios' | 'architecture';

const tabs: { id: DesignTab; label: string }[] = [
  { id: 'scenarios', label: 'Scenarios' },
  { id: 'architecture', label: 'Architecture' },
];

type DesignTabsProps = {
  activeTab: DesignTab;
  onTabChange: (tab: DesignTab) => void;
  scenarios: ReactNode;
  architecture: ReactNode;
};

export function DesignTabs({
  activeTab,
  onTabChange,
  scenarios,
  architecture,
}: DesignTabsProps) {
  const baseId = useId();
  const tabButtons = useRef(new Map<DesignTab, HTMLButtonElement>());
  const content: Record<DesignTab, ReactNode> = { scenarios, architecture };

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
      aria-label="System design"
      className="flex h-full min-h-0 flex-col rounded-lg border border-zinc-200 bg-white"
    >
      <div
        role="tablist"
        aria-label="System design views"
        className="flex gap-1 border-b border-zinc-200 px-2"
      >
        {tabs.map(({ id, label }, index) => {
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
              {label}
            </button>
          );
        })}
      </div>
      {tabs.map(({ id }) => (
        <div
          key={id}
          role="tabpanel"
          id={`${baseId}-${id}-panel`}
          aria-labelledby={`${baseId}-${id}-tab`}
          hidden={id !== activeTab}
          className="min-h-0 flex-1 overflow-auto p-4"
        >
          {content[id]}
        </div>
      ))}
    </section>
  );
}
