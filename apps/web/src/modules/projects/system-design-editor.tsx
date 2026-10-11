import type { SystemDesign } from '@flowment/domain';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '../../components/ui/button';
import { ErrorMessage } from '../../components/ui/error-message';
import { Textarea } from '../../components/ui/textarea';
import { errorMessage } from '../../shared/api-error';
import { fieldErrorMessages } from '../../shared/form-errors';
import { SystemDesignFormSchema } from './project-form-schemas';
import { useUpdateProject } from './project-queries';
import { formatSystemDesign } from './system-design-json';

type SystemDesignEditorProps = { projectId: string; design: SystemDesign };

export function SystemDesignEditor({
  projectId,
  design,
}: SystemDesignEditorProps) {
  const updateProject = useUpdateProject(projectId);
  const {
    register,
    handleSubmit,
    reset,
    formState: { isDirty, isValid, errors },
  } = useForm({
    resolver: zodResolver(SystemDesignFormSchema),
    defaultValues: { json: formatSystemDesign(design) },
    mode: 'onChange',
    criteriaMode: 'all',
  });
  const designErrors = fieldErrorMessages(errors.json);

  const submit = handleSubmit(({ json: systemDesign }) =>
    updateProject.mutate({ systemDesign }),
  );

  return (
    <form
      onSubmit={submit}
      aria-labelledby="system-design-heading"
      className="mt-6 space-y-3"
    >
      <div className="flex items-center justify-between gap-4">
        <h2 id="system-design-heading" className="text-lg font-semibold">
          System design
        </h2>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            disabled={!isDirty || updateProject.isPending}
            onClick={() => reset()}
          >
            Revert
          </Button>
          <Button
            type="submit"
            disabled={!isDirty || !isValid || updateProject.isPending}
          >
            {updateProject.isPending ? 'Saving…' : 'Save design'}
          </Button>
        </div>
      </div>
      <Textarea
        label="System design JSON"
        spellCheck={false}
        rows={24}
        className="font-mono"
        {...register('json')}
      />
      {designErrors.length > 0 && (
        <ErrorMessage>
          <ul className="list-inside list-disc space-y-1">
            {designErrors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </ErrorMessage>
      )}
      {updateProject.isError && (
        <ErrorMessage>{errorMessage(updateProject.error)}</ErrorMessage>
      )}
    </form>
  );
}
