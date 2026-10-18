import { zodResolver } from '@hookform/resolvers/zod';
import { Check } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { ErrorMessage } from '../../components/ui/error-message';
import { IconButton } from '../../components/ui/icon-button';
import { Input } from '../../components/ui/input';
import { errorMessage } from '../../shared/api-error';
import { ProjectNameFormSchema } from './project-form-schemas';
import { useUpdateProject } from './project-queries';

type ProjectNameFormProps = { projectId: string; name: string };

export function ProjectNameForm({ projectId, name }: ProjectNameFormProps) {
  const updateProject = useUpdateProject(projectId);
  const {
    register,
    handleSubmit,
    control,
    formState: { isValid },
  } = useForm({
    resolver: zodResolver(ProjectNameFormSchema),
    defaultValues: { name },
    mode: 'onChange',
  });
  const draft = useWatch({ control, name: 'name' });
  const changed = isValid && draft.trim() !== name;

  const submit = handleSubmit((values) => updateProject.mutate(values));

  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="flex gap-2">
        <Input
          label="Project name"
          className="py-1 text-base font-semibold"
          {...register('name')}
        />
        {changed && (
          <IconButton
            type="submit"
            label="Rename project"
            icon={Check}
            variant="primary"
            disabled={updateProject.isPending}
          />
        )}
      </div>
      {updateProject.isError && (
        <ErrorMessage>{errorMessage(updateProject.error)}</ErrorMessage>
      )}
    </form>
  );
}
