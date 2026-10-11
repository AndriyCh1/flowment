import { ComponentKindSchema } from '@flowment/domain';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FormActions, type FormMode } from '../../components/form-actions';
import { Field } from '../../components/ui/field';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { componentKindLabel } from '../../shared/design-labels';
import {
  ComponentFormSchema,
  type ComponentFormValues,
} from './component-form-schemas';

type ComponentFormProps = {
  mode: FormMode;
  defaultValues: ComponentFormValues;
  onSubmit: (values: ComponentFormValues) => void;
  onCancel?: () => void;
};

export function ComponentForm({
  mode,
  defaultValues,
  onSubmit,
  onCancel,
}: ComponentFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    setFocus,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(ComponentFormSchema),
    defaultValues,
  });

  useEffect(() => {
    if (mode === 'create') {
      setFocus('name');
    }
  }, [mode, setFocus]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <Field label="Name" error={errors.name?.message}>
        <Input label="Name" className="w-full" {...register('name')} />
      </Field>
      <Field label="Kind">
        <Select label="Kind" {...register('kind')}>
          <option value="">No kind</option>
          {ComponentKindSchema.options.map((kind) => (
            <option key={kind} value={kind}>
              {componentKindLabel(kind)}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Responsibility">
        <Textarea
          label="Responsibility"
          rows={3}
          {...register('responsibility')}
        />
      </Field>
      <FormActions
        mode={mode}
        noun="component"
        isDirty={isDirty}
        onRevert={() => reset()}
        onCancel={onCancel}
      />
    </form>
  );
}
