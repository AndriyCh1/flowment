import type { Component, SequenceScenario } from '@flowment/domain';
import {
  componentKindLabel,
  participantName,
} from '../../shared/design-labels';
import { layoutSequence, type SequenceRow } from './sequence-layout';

const GUTTER_WIDTH = '2.5rem';
const MIN_COLUMN_WIDTH = '10rem';

type SequenceDiagramProps = {
  components: Component[];
  scenario: SequenceScenario;
  selectedStepId: string | null;
  onSelectStep: (stepId: string | null) => void;
};

export function SequenceDiagram({
  components,
  scenario,
  selectedStepId,
  onSelectStep,
}: SequenceDiagramProps) {
  if (components.length === 0) {
    return <p className="text-sm text-zinc-500">No components yet.</p>;
  }

  const rows = layoutSequence(components, scenario);
  const gridStyle = {
    gridTemplateColumns: `${GUTTER_WIDTH} repeat(${components.length}, minmax(${MIN_COLUMN_WIDTH}, 1fr))`,
    minWidth: `calc(${GUTTER_WIDTH} + ${components.length} * ${MIN_COLUMN_WIDTH})`,
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
      <div className="grid" style={gridStyle}>
        <div className="col-span-full grid grid-cols-subgrid pt-3">
          {components.map((component, index) => (
            <div
              key={component.id}
              className="flex flex-col items-center px-2"
              style={{ gridColumn: index + 2 }}
            >
              <div className="w-full rounded-md border border-zinc-300 bg-zinc-50 px-2 py-1.5 text-center">
                <div className="text-sm font-medium wrap-anywhere">
                  {participantName(component)}
                </div>
                {component.kind && (
                  <div className="text-xs text-zinc-500">
                    {componentKindLabel(component.kind)}
                  </div>
                )}
              </div>
              <span className="min-h-3 w-px flex-1 bg-zinc-300" />
            </div>
          ))}
        </div>
        <ol
          aria-label="Sequence steps"
          className="col-span-full grid grid-cols-subgrid"
        >
          {rows.map((row) => (
            <StepRow
              key={row.step.id}
              row={row}
              components={components}
              selected={row.step.id === selectedStepId}
              onSelect={onSelectStep}
            />
          ))}
        </ol>
        <div aria-hidden className="col-span-full grid grid-cols-subgrid">
          {components.map((component, index) => (
            <Lifeline
              key={component.id}
              column={index}
              className={rows.length === 0 ? 'h-12' : 'h-4'}
            />
          ))}
        </div>
      </div>
      {rows.length === 0 && (
        <p className="px-4 pb-3 text-sm text-zinc-500">No steps yet.</p>
      )}
    </div>
  );
}

type StepRowProps = {
  row: SequenceRow;
  components: Component[];
  selected: boolean;
  onSelect: (stepId: string | null) => void;
};

function StepRow({ row, components, selected, onSelect }: StepRowProps) {
  const labelSurface = selected
    ? 'bg-sky-50'
    : 'bg-white group-hover:bg-zinc-50';

  return (
    <li className="col-span-full grid grid-cols-subgrid">
      <button
        type="button"
        aria-pressed={selected}
        aria-label={describeRow(row, components)}
        onClick={() => onSelect(selected ? null : row.step.id)}
        className={`group col-span-full grid grid-cols-subgrid text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-sky-600 ${selected ? 'bg-sky-50' : 'bg-white hover:bg-zinc-50'}`}
      >
        <span
          className="self-center pr-2 text-right text-xs text-zinc-400 tabular-nums"
          style={{ gridColumn: 1, gridRow: 1 }}
        >
          {row.number}
        </span>
        {components.map((component, index) => (
          <Lifeline key={component.id} column={index} />
        ))}
        <StepGraphic row={row} labelSurface={labelSurface} />
      </button>
    </li>
  );
}

function StepGraphic({
  row,
  labelSurface,
}: {
  row: SequenceRow;
  labelSurface: string;
}) {
  if (row.type === 'note') {
    return (
      <span
        className="px-2 py-2"
        style={{
          gridColumn: row.column === null ? '2 / -1' : row.column + 2,
          gridRow: 1,
        }}
      >
        <span className="block rounded border border-amber-300 bg-amber-50 px-2 py-1 text-sm whitespace-pre-wrap text-amber-950 wrap-anywhere">
          {row.step.text}
        </span>
      </span>
    );
  }

  if (row.type === 'self-interaction') {
    return (
      <span
        className="flex flex-col items-center gap-1 py-2"
        style={{ gridColumn: row.column + 2, gridRow: 1 }}
      >
        <Label text={row.step.text} surface={labelSurface} />
        <span className="relative ml-[50%] block h-4 w-8 self-start rounded-r border-y border-r border-zinc-800">
          <ArrowHead className="bottom-0 left-0 translate-y-1/2 rotate-180" />
        </span>
      </span>
    );
  }

  const start = Math.min(row.from, row.to);
  const end = Math.max(row.from, row.to);
  const columnSpan = end - start + 1;

  return (
    <span
      className="flex flex-col items-center gap-1 py-2"
      style={{ gridColumn: `${start + 2} / ${end + 3}`, gridRow: 1 }}
    >
      <Label text={row.step.text} surface={labelSurface} />
      <span
        className="relative block h-px self-stretch bg-zinc-800"
        style={{ marginInline: `${50 / columnSpan}%` }}
      >
        <ArrowHead
          className={`top-1/2 -translate-y-1/2 ${row.to > row.from ? 'right-0' : 'left-0 rotate-180'}`}
        />
      </span>
    </span>
  );
}

function Label({ text, surface }: { text: string; surface: string }) {
  if (!text) {
    return null;
  }

  return (
    <span
      className={`max-w-full rounded px-1 text-center text-sm whitespace-pre-wrap wrap-anywhere ${surface}`}
    >
      {text}
    </span>
  );
}

function ArrowHead({ className }: { className: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 10 10"
      className={`absolute h-2.5 w-2.5 fill-zinc-800 ${className}`}
    >
      <path d="M0 0L10 5L0 10z" />
    </svg>
  );
}

function Lifeline({
  column,
  className = '',
}: {
  column: number;
  className?: string;
}) {
  return (
    <span
      className={`flex justify-center ${className}`}
      style={{ gridColumn: column + 2, gridRow: 1 }}
    >
      <span className="w-px bg-zinc-300" />
    </span>
  );
}

function describeRow(row: SequenceRow, components: Component[]): string {
  const prefix = `Step ${row.number}`;
  const text = row.step.text ? `: ${row.step.text}` : '';

  if (row.type === 'note') {
    const target =
      row.column === null
        ? 'note'
        : `note on ${participantName(components[row.column])}`;
    return `${prefix}, ${target}${text}`;
  }

  const from = participantName(
    components[row.type === 'interaction' ? row.from : row.column],
  );
  const to = participantName(
    components[row.type === 'interaction' ? row.to : row.column],
  );

  return `${prefix}, ${from} to ${to}${text}`;
}
