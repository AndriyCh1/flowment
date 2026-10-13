import { useState } from 'react';
import { InlineConfirmation } from '../../components/inline-confirmation';
import { Button } from '../../components/ui/button';

type CoachResetProps = {
  disabled: boolean;
  onReset: () => void;
};

export function CoachReset({ disabled, onReset }: CoachResetProps) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <Button
        variant="secondary"
        disabled={disabled}
        onClick={() => setConfirming(true)}
      >
        Reset conversation
      </Button>
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
