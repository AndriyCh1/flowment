import { Separator } from 'react-resizable-panels';

const orientations = {
  horizontal: 'w-2 before:inset-y-0 before:left-1/2 before:w-px',
  vertical: 'h-2 before:inset-x-0 before:top-1/2 before:h-px',
};

type ResizeSeparatorProps = {
  orientation: keyof typeof orientations;
};

export function ResizeSeparator({ orientation }: ResizeSeparatorProps) {
  return (
    <Separator
      className={`relative shrink-0 outline-none before:absolute before:bg-transparent data-[separator=active]:before:bg-sky-500 data-[separator=focus]:before:bg-sky-500 data-[separator=hover]:before:bg-zinc-400 ${orientations[orientation]}`}
    />
  );
}
