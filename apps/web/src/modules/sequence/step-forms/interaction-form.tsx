import type { Component } from '@flowment/domain';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Field } from '../../../components/ui/field';
import { Input } from '../../../components/ui/input';
import { ComponentSelect } from './component-select';
import { StepFormActions, type StepFormMode } from './step-form-actions';
import {
  InteractionFormSchema,
  type InteractionFormValues,
} from './step-form-schemas';

type InteractionFormProps = {
  mode: StepFormMode;
  components: Component[];
  defaultValues: InteractionFormValues;
  onSubmit: (values: InteractionFormValues) => void;
  onCancel?: () => void;
};

export function InteractionForm({
  mode,
  components,
  defaultValues,
  onSubmit,
  onCancel,
}: InteractionFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    setFocus,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(InteractionFormSchema),
    defaultValues,
  });

  useEffect(() => {
    if (mode === 'create') {
      setFocus('from');
    }
  }, [mode, setFocus]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Sender" error={errors.from?.message}>
          <ComponentSelect
            label="Sender"
            components={components}
            emptyOption={{ label: 'Choose a sender', disabled: true }}
            {...register('from')}
          />
        </Field>
        <Field label="Receiver" error={errors.to?.message}>
          <ComponentSelect
            label="Receiver"
            components={components}
            emptyOption={{ label: 'Choose a receiver', disabled: true }}
            {...register('to')}
          />
        </Field>
      </div>
      <Field label="Text">
        <Input label="Text" className="w-full" {...register('text')} />
      </Field>
      <StepFormActions
        mode={mode}
        isDirty={isDirty}
        onRevert={() => reset()}
        onCancel={onCancel}
      />
    </form>
  );
}
