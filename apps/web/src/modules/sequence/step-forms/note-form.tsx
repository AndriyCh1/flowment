import type { Component } from '@flowment/domain';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Field } from '../../../components/ui/field';
import { Textarea } from '../../../components/ui/textarea';
import { ComponentSelect } from './component-select';
import { StepFormActions, type StepFormMode } from './step-form-actions';
import { NoteFormSchema, type NoteFormValues } from './step-form-schemas';

type NoteFormProps = {
  mode: StepFormMode;
  components: Component[];
  defaultValues: NoteFormValues;
  onSubmit: (values: NoteFormValues) => void;
  onCancel?: () => void;
};

export function NoteForm({
  mode,
  components,
  defaultValues,
  onSubmit,
  onCancel,
}: NoteFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    setFocus,
    formState: { isDirty },
  } = useForm({
    resolver: zodResolver(NoteFormSchema),
    defaultValues,
  });

  useEffect(() => {
    if (mode === 'create') {
      setFocus('text');
    }
  }, [mode, setFocus]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <Field label="Component">
        <ComponentSelect
          label="Component"
          components={components}
          emptyOption={{ label: 'None (across the diagram)', disabled: false }}
          {...register('componentId')}
        />
      </Field>
      <Field label="Text">
        <Textarea label="Text" rows={3} {...register('text')} />
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
