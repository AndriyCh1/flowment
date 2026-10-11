import type { SequenceScenario } from '@flowment/domain';
import { Button } from '../../components/ui/button';
import { scenarioTitle } from '../../shared/design-labels';

type ScenarioTabsProps = {
  scenarios: SequenceScenario[];
  activeId: string | undefined;
  adding: boolean;
  onSelect: (scenarioId: string) => void;
  onAdd: () => void;
};

export function ScenarioTabs({
  scenarios,
  activeId,
  adding,
  onSelect,
  onAdd,
}: ScenarioTabsProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-b border-zinc-200">
      {scenarios.length > 0 && (
        <fieldset className="flex flex-wrap gap-1">
          <legend className="sr-only">Scenario</legend>
          {scenarios.map((scenario) => (
            <button
              key={scenario.id}
              type="button"
              aria-pressed={scenario.id === activeId}
              onClick={() => onSelect(scenario.id)}
              className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium wrap-anywhere ${scenario.id === activeId ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-zinc-500 hover:text-zinc-800'}`}
            >
              {scenarioTitle(scenario)}
            </button>
          ))}
        </fieldset>
      )}
      <Button
        variant="secondary"
        className="mb-2"
        disabled={adding}
        onClick={onAdd}
      >
        Add scenario
      </Button>
    </div>
  );
}
