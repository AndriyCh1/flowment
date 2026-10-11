import { useId, type ReactNode } from 'react';

type EditorPanelProps = {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function EditorPanel({ title, actions, children }: EditorPanelProps) {
  const headingId = useId();

  return (
    <section
      aria-labelledby={headingId}
      className="sticky bottom-0 z-10 max-h-[60vh] space-y-3 overflow-y-auto rounded-lg border border-zinc-200 bg-white p-4 shadow-lg"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id={headingId} className="text-sm font-semibold">
          {title}
        </h3>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      {children}
    </section>
  );
}
