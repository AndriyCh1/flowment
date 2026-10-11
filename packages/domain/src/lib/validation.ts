import type { z } from 'zod';

type Path = (string | number)[];

export function reportDuplicateIds(
  items: readonly { id: string }[],
  path: Path,
  label: string,
  ctx: z.RefinementCtx,
): void {
  const seen = new Set<string>();
  items.forEach((item, index) => {
    if (seen.has(item.id)) {
      ctx.addIssue({
        code: 'custom',
        message: `Duplicate ${label} id "${item.id}"`,
        path: [...path, index, 'id'],
      });
    }
    seen.add(item.id);
  });
}

export function reportUnknownComponent(
  componentIds: ReadonlySet<string>,
  componentId: string,
  path: Path,
  ctx: z.RefinementCtx,
): void {
  if (!componentIds.has(componentId)) {
    ctx.addIssue({
      code: 'custom',
      message: `Unknown component "${componentId}"`,
      path,
    });
  }
}
