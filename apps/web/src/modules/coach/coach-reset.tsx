import { RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { InlineConfirmation } from '../../components/inline-confirmation';
import { IconButton } from '../../components/ui/icon-button';

type CoachResetProps = {
  disabled: boolean;
  onReset: () => void;
};

export function CoachReset({ disabled, onReset }: CoachResetProps) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <IconButton
        label="Reset conversation"
        icon={RotateCcw}
        disabled={disabled}
        onClick={() => setConfirming(true)}
      />
    );
  }

  return (
    <InlineConfirmation
      confirmLabel="Reset conversation"
      onConfirm={() => {
        setConfirming(false);
        onReset();
      }}
      onCancel={() => setConfirming(false)}
    >
      <p>
        The conversation will be cleared. Your description and your design stay
        as they are.
      </p>
    </InlineConfirmation>
  );
}
