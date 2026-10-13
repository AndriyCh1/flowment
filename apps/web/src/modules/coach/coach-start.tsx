import { ModelingIntentForm } from './brief/modeling-intent-form';

type CoachStartProps = {
  disabled: boolean;
  onStart: (modelingIntent: string) => void;
};

export function CoachStart({ disabled, onStart }: CoachStartProps) {
  return (
    <div className="space-y-3">
      <ModelingIntentForm
        defaultValue=""
        submitLabel="Start with coach"
        disabled={disabled}
        onSubmit={onStart}
      />
      <p className="text-sm text-zinc-500">
        You can also add components or a scenario manually.
      </p>
    </div>
  );
}
