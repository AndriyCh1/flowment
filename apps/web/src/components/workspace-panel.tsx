import { useId, type ReactNode } from 'react';

type WorkspacePanelProps = {
  title: string;
  children: ReactNode;
};

export function WorkspacePanel({ title, children }: WorkspacePanelProps) {
  const headingId = useId();

  return (
    <section
      aria-labelledby={headingId}
      className="flex h-full min-h-0 flex-col rounded-lg border border-zinc-200 bg-white"
    >
      <h2
        id={headingId}
        className="border-b border-zinc-200 px-4 py-2 text-xs font-semibold tracking-wide text-zinc-600 uppercase"
      >
        {title}
      </h2>
      <div className="min-h-0 flex-1 overflow-auto p-4">{children}</div>
    </section>
  );
}
