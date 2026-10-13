import type { CoachOutput, SystemDesign } from '@flowment/domain';
import { actionLabels, purposeLabels, stepReference } from '../coach-labels';

type CoachMessageProps = {
  output: CoachOutput;
  design: SystemDesign;
};

export function CoachMessage({ output, design }: CoachMessageProps) {
  if (output.type === 'objective-satisfied') {
    return (
      <div className="space-y-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-950">
        <p className="font-semibold">✓ Objective reached</p>
        {output.summary && <p>{output.summary}</p>}
        {output.evidence.length > 0 && (
          <ul className="list-disc space-y-1 pl-5 text-emerald-900">
            {output.evidence.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        )}
        <p>No further changes are required for this objective.</p>
      </div>
    );
  }

  const label =
    output.type === 'question'
      ? purposeLabels[output.purpose]
      : actionLabels[output.action];
  const references =
    output.type === 'question'
      ? (output.relatedStepIds ?? []).flatMap((stepId) => {
          const reference = stepReference(design, stepId);
          return reference ? [reference] : [];
        })
      : [];

  return (
    <div className="space-y-1 rounded-md border border-sky-200 bg-sky-50 p-3 text-sm text-sky-950">
      <p className="text-xs font-medium text-sky-700">{label}</p>
      <p className="wrap-anywhere whitespace-pre-wrap">{output.text}</p>
      {references.length > 0 && (
        <p className="text-xs text-sky-700">
          Refers to {references.join(', ')}
        </p>
      )}
    </div>
  );
}
