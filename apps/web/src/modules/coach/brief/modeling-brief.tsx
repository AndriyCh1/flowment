import { Pencil } from 'lucide-react';
import { useState } from 'react';
import { ErrorMessage } from '../../../components/ui/error-message';
import { IconButton } from '../../../components/ui/icon-button';
import { errorMessage } from '../../../shared/api-error';
import { useSaveModelingIntent } from '../coach-queries';
import { ModelingIntentForm } from './modeling-intent-form';

type ModelingBriefProps = {
  projectId: string;
  modelingIntent: string | null;
};

export function ModelingBrief({
  projectId,
  modelingIntent,
}: ModelingBriefProps) {
  const [editing, setEditing] = useState(false);
  const saveIntent = useSaveModelingIntent(projectId);

  const save = (next: string) =>
    saveIntent.mutate(next, { onSuccess: () => setEditing(false) });

  const cancel = () => {
    saveIntent.reset();
    setEditing(false);
  };

  return (
    <div className="space-y-2 rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm">
      <h3 className="text-xs font-medium text-zinc-500">
        What you're modeling
      </h3>
      {editing ? (
        <ModelingIntentForm
          defaultValue={modelingIntent ?? ''}
          submitLabel="Save description"
          disabled={saveIntent.isPending}
          focusOnMount
          onSubmit={save}
          onCancel={cancel}
        />
      ) : (
        <div className="flex items-start justify-between gap-2">
          <p className="wrap-anywhere whitespace-pre-wrap">
            {modelingIntent ?? (
              <span className="text-zinc-500">No description yet.</span>
            )}
          </p>
          <IconButton
            label={modelingIntent ? 'Edit description' : 'Add description'}
            icon={Pencil}
            onClick={() => setEditing(true)}
          />
        </div>
      )}
      {saveIntent.isError && (
        <ErrorMessage>{errorMessage(saveIntent.error)}</ErrorMessage>
      )}
    </div>
  );
}
