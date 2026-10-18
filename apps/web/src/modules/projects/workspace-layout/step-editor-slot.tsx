import type { Ref } from 'react';

type StepEditorSlotProps = { ref: Ref<HTMLDivElement> };

export function StepEditorSlot({ ref }: StepEditorSlotProps) {
  return (
    <>
      <div ref={ref} className="peer" />
      <p className="hidden text-sm text-zinc-500 peer-empty:block">
        Select a step in the sequence to edit it, or add an interaction or a
        note.
      </p>
    </>
  );
}
