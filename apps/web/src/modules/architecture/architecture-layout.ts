import type { ArchitectureRelationship, Component } from '@flowment/domain';

export const NODE_WIDTH = 136;
export const NODE_HEIGHT = 44;

const PADDING = 24;
const MIN_RADIUS = 110;
const NODE_SPACING = 176;
const EDGE_GAP = 4;

export type ArchitectureNode = {
  component: Component;
  x: number;
  y: number;
};

export type ArchitectureEdge = {
  relationship: ArchitectureRelationship;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export type ArchitectureLayout = {
  width: number;
  height: number;
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
};

function placeNodes(components: Component[], radius: number) {
  const centerX = PADDING + NODE_WIDTH / 2 + radius;
  const centerY = PADDING + NODE_HEIGHT / 2 + radius;

  if (components.length === 1) {
    return [{ component: components[0], x: centerX, y: centerY }];
  }

  return components.map((component, index) => {
    const angle = -Math.PI / 2 + (2 * Math.PI * index) / components.length;
    return {
      component,
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  });
}

function fractionInsideNode(dx: number, dy: number): number {
  const alongX = dx === 0 ? Infinity : (NODE_WIDTH / 2 + EDGE_GAP) / Math.abs(dx);
  const alongY =
    dy === 0 ? Infinity : (NODE_HEIGHT / 2 + EDGE_GAP) / Math.abs(dy);
  return Math.min(alongX, alongY);
}

function connectNodes(
  relationship: ArchitectureRelationship,
  from: ArchitectureNode,
  to: ArchitectureNode,
): ArchitectureEdge | null {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const inside = fractionInsideNode(dx, dy);
  if (inside >= 0.5) {
    return null;
  }

  return {
    relationship,
    x1: from.x + dx * inside,
    y1: from.y + dy * inside,
    x2: to.x - dx * inside,
    y2: to.y - dy * inside,
  };
}

export function layoutArchitecture(
  components: Component[],
  relationships: ArchitectureRelationship[],
): ArchitectureLayout {
  const radius =
    components.length > 1
      ? Math.max(MIN_RADIUS, (components.length * NODE_SPACING) / (2 * Math.PI))
      : 0;
  const nodes = placeNodes(components, radius);
  const nodesById = new Map(nodes.map((node) => [node.component.id, node]));

  const edges = relationships.flatMap((relationship) => {
    const [fromId, toId] = relationship.componentIds;
    const from = nodesById.get(fromId);
    const to = nodesById.get(toId);
    const edge = from && to ? connectNodes(relationship, from, to) : null;
    return edge ? [edge] : [];
  });

  return {
    width: 2 * (PADDING + radius) + NODE_WIDTH,
    height: 2 * (PADDING + radius) + NODE_HEIGHT,
    nodes,
    edges,
  };
}
