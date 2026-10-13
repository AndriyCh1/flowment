import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../../../components/ui/button';
import { Field } from '../../../components/ui/field';
import { Textarea } from '../../../components/ui/textarea';
import { ModelingIntentFormSchema } from '../coach-form-schemas';

const LABEL = 'What are you trying to model?';
const PLACEHOLDER =
  'e.g. A service that accepts CSV uploads and processes them in the background';

type ModelingIntentFormProps = {
  defaultValue: string;
  submitLabel: string;
  disabled?: boolean;
  focusOnMount?: boolean;
  onSubmit: (modelingIntent: string) => void;
  onCancel?: () => void;
};

export function ModelingIntentForm({
  defaultValue,
  submitLabel,
  disabled,
  focusOnMount,
  onSubmit,
  onCancel,
}: ModelingIntentFormProps) {
  const {
    register,
    handleSubmit,
    setFocus,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(ModelingIntentFormSchema),
    defaultValues: { modelingIntent: defaultValue },
  });

  useEffect(() => {
    if (focusOnMount) {
      setFocus('modelingIntent');
    }
  }, [focusOnMount, setFocus]);

  const submit = handleSubmit(({ modelingIntent }) => onSubmit(modelingIntent));

  return (
    <form onSubmit={submit} className="space-y-3">
      <Field label={LABEL} error={errors.modelingIntent?.message}>
        <Textarea
          label={LABEL}
          rows={3}
          placeholder={PLACEHOLDER}
          {...register('modelingIntent')}
        />
      </Field>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={disabled}>
          {submitLabel}
        </Button>
        {onCancel && (
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
