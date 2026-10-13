import type { LearnerReplyKind } from '@flowment/domain';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '../../../components/ui/button';
import { Field } from '../../../components/ui/field';
import { Textarea } from '../../../components/ui/textarea';
import { CoachReplyFormSchema } from '../coach-form-schemas';

const LABEL = 'Your answer';

export type CoachReply = { kind: LearnerReplyKind; text: string };

type CoachReplyFormProps = {
  disabled: boolean;
  onReply: (reply: CoachReply) => void;
};

export function CoachReplyForm({ disabled, onReply }: CoachReplyFormProps) {
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(CoachReplyFormSchema),
    defaultValues: { text: '' },
  });

  const answer = handleSubmit(({ text }) => onReply({ kind: 'answer', text }));

  const replyWithout = (kind: Exclude<LearnerReplyKind, 'answer'>) =>
    onReply({ kind, text: kind === 'unknown' ? getValues('text').trim() : '' });

  return (
    <form onSubmit={answer} className="space-y-2">
      <Field label={LABEL} error={errors.text?.message}>
        <Textarea label={LABEL} rows={3} {...register('text')} />
      </Field>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={disabled}>
          Send answer
        </Button>
        <Button
          variant="secondary"
          disabled={disabled}
          onClick={() => replyWithout('unknown')}
        >
          I don't know
        </Button>
        <Button
          variant="secondary"
          disabled={disabled}
          onClick={() => replyWithout('rephrase')}
        >
          Ask differently
        </Button>
        <Button
          variant="secondary"
          disabled={disabled}
          onClick={() => replyWithout('skip')}
        >
          Skip
        </Button>
      </div>
    </form>
  );
}
