import {
  hasInitialFact,
  type Component,
  type InitialFact,
  type SequenceScenario,
} from '@flowment/domain';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '../../components/ui/button';
import { ErrorMessage } from '../../components/ui/error-message';
import { Input } from '../../components/ui/input';
import { ComponentSelect } from '../design-components';
import { InitialFactFormSchema } from './scenario-form-schemas';

type InitialFactFormProps = {
  components: Component[];
  scenario: SequenceScenario;
  onAdd: (initialFact: InitialFact) => void;
};

export function InitialFactForm({
  components,
  scenario,
  onAdd,
}: InitialFactFormProps) {
  const {
    register,
    handleSubmit,
    resetField,
    setError,
    setFocus,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(InitialFactFormSchema),
    defaultValues: { componentId: '', fact: '' },
  });

  const submit = handleSubmit((initialFact) => {
    if (hasInitialFact(scenario, initialFact)) {
      setError('fact', {
        message: 'This component already has that fact',
      });
      return;
    }
    onAdd(initialFact);
    resetField('fact');
    setFocus('fact');
  });

  return (
    <form onSubmit={submit} className="space-y-1">
      <div className="flex flex-wrap gap-2">
        <div className="w-44">
          <ComponentSelect
            label="Component"
            components={components}
            emptyOption={{ label: 'Choose a component', disabled: true }}
            {...register('componentId')}
          />
        </div>
        <Input
          label="Fact"
          placeholder="Fact, e.g. selectedFile"
          className="basis-40"
          {...register('fact')}
        />
        <Button type="submit" variant="secondary">
          Add fact
        </Button>
      </div>
      {errors.componentId?.message && (
        <ErrorMessage>{errors.componentId.message}</ErrorMessage>
      )}
      {errors.fact?.message && (
        <ErrorMessage>{errors.fact.message}</ErrorMessage>
      )}
    </form>
  );
}
