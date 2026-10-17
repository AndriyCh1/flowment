import type { Component, DerivedArchitecture } from '@flowment/domain';
import { useId } from 'react';
import {
  componentKindLabel,
  participantName,
} from '../../shared/design-labels';
import {
  NODE_HEIGHT,
  NODE_WIDTH,
  layoutArchitecture,
  type ArchitectureEdge,
  type ArchitectureNode,
} from './architecture-layout';

const MAX_NAME_LENGTH = 18;

type ArchitectureGraphProps = {
  components: Component[];
  architecture: DerivedArchitecture;
  selectedRelationshipId: string | null;
};

export function ArchitectureGraph({
  components,
  architecture,
  selectedRelationshipId,
}: ArchitectureGraphProps) {
  const markerPrefix = `architecture${useId().replace(/[^\w-]/g, '')}`;
  const { width, height, nodes, edges } = layoutArchitecture(
    components,
    architecture.relationships,
  );
  const selected = architecture.relationships.find(
    ({ id }) => id === selectedRelationshipId,
  );
  const highlighted = new Set(selected?.componentIds ?? []);
  const unconnected = new Set(architecture.unconnectedComponentIds);

  return (
    <figure className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
      <figcaption className="sr-only">
        Architecture graph with {components.length} components and{' '}
        {architecture.relationships.length} relationships, listed below.
      </figcaption>
      <svg
        aria-hidden
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="mx-auto block h-auto max-w-full"
      >
        <defs>
          <ArrowMarker id={`${markerPrefix}-arrow`} className="fill-zinc-500" />
          <ArrowMarker
            id={`${markerPrefix}-arrow-selected`}
            className="fill-sky-600"
          />
        </defs>
        {edges.map((edge) => {
          const isSelected = edge.relationship.id === selectedRelationshipId;
          return (
            <RelationshipEdge
              key={edge.relationship.id}
              edge={edge}
              arrowId={`${markerPrefix}-arrow${isSelected ? '-selected' : ''}`}
              selected={isSelected}
            />
          );
        })}
        {nodes.map((node) => (
          <ComponentNode
            key={node.component.id}
            node={node}
            highlighted={highlighted.has(node.component.id)}
            unconnected={unconnected.has(node.component.id)}
          />
        ))}
      </svg>
    </figure>
  );
}

function ArrowMarker({ id, className }: { id: string; className: string }) {
  return (
    <marker
      id={id}
      viewBox="0 0 10 10"
      refX="9"
      refY="5"
      markerWidth="8"
      markerHeight="8"
      orient="auto-start-reverse"
      markerUnits="userSpaceOnUse"
    >
      <path d="M0 0L10 5L0 10z" className={className} />
    </marker>
  );
}

function RelationshipEdge({
  edge,
  arrowId,
  selected,
}: {
  edge: ArchitectureEdge;
  arrowId: string;
  selected: boolean;
}) {
  const { relationship, x1, y1, x2, y2 } = edge;
  const [first, second] = relationship.componentIds;
  const forward = relationship.directions.some(
    ({ from, to }) => from === first && to === second,
  );
  const backward = relationship.directions.some(
    ({ from, to }) => from === second && to === first,
  );
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  return (
    <g className={selected ? 'text-sky-600' : 'text-zinc-500'}>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        className="stroke-current"
        strokeWidth={selected ? 2.5 : 1.5}
        markerEnd={forward ? `url(#${arrowId})` : undefined}
        markerStart={backward ? `url(#${arrowId})` : undefined}
      />
      <circle
        cx={midX}
        cy={midY}
        r={9}
        className="fill-white stroke-current"
        strokeWidth={1}
      />
      <text
        x={midX}
        y={midY}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-zinc-700 text-[10px] tabular-nums"
      >
        {relationship.interactionCount}
      </text>
    </g>
  );
}

function ComponentNode({
  node,
  highlighted,
  unconnected,
}: {
  node: ArchitectureNode;
  highlighted: boolean;
  unconnected: boolean;
}) {
  const { component, x, y } = node;
  const name = participantName(component);
  const shortName =
    name.length > MAX_NAME_LENGTH
      ? `${name.slice(0, MAX_NAME_LENGTH - 1)}…`
      : name;
  const stroke = highlighted
    ? 'stroke-sky-600'
    : unconnected
      ? 'stroke-zinc-300'
      : 'stroke-zinc-400';

  return (
    <g>
      <title>{name}</title>
      <rect
        x={x - NODE_WIDTH / 2}
        y={y - NODE_HEIGHT / 2}
        width={NODE_WIDTH}
        height={NODE_HEIGHT}
        rx={6}
        className={`${unconnected ? 'fill-white' : 'fill-zinc-50'} ${stroke}`}
        strokeWidth={highlighted ? 2 : 1}
        strokeDasharray={unconnected ? '4 3' : undefined}
      />
      <text
        x={x}
        y={component.kind ? y - 7 : y}
        textAnchor="middle"
        dominantBaseline="central"
        className={`text-[13px] font-medium ${unconnected ? 'fill-zinc-400' : 'fill-zinc-900'}`}
      >
        {shortName}
      </text>
      {component.kind && (
        <text
          x={x}
          y={y + 10}
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-zinc-500 text-[11px]"
        >
          {componentKindLabel(component.kind)}
        </text>
      )}
    </g>
  );
}
