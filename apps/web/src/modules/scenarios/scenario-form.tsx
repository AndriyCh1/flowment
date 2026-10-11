import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FormActions, type FormMode } from '../../components/form-actions';
import { Field } from '../../components/ui/field';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import {
  ScenarioFormSchema,
  type ScenarioFormValues,
} from './scenario-form-schemas';

type ScenarioFormProps = {
  mode: FormMode;
  defaultValues: ScenarioFormValues;
  onSubmit: (values: ScenarioFormValues) => void;
  onCancel?: () => void;
};

export function ScenarioForm({
  mode,
  defaultValues,
  onSubmit,
  onCancel,
}: ScenarioFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    setFocus,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(ScenarioFormSchema),
    defaultValues,
  });

  useEffect(() => {
    setFocus('title');
  }, [setFocus]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <Field label="Title" error={errors.title?.message}>
        <Input label="Title" className="w-full" {...register('title')} />
      </Field>
      <Field label="Description">
        <Textarea label="Description" rows={2} {...register('description')} />
      </Field>
      <FormActions
        mode={mode}
        noun="scenario"
        isDirty={isDirty}
        onRevert={() => reset()}
        onCancel={onCancel}
      />
    </form>
  );
}
