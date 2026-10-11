import type { Component } from '@flowment/domain';
import type { ComponentProps } from 'react';
import { Select } from '../../../components/ui/select';
import { participantName } from '../sequence-layout';

type ComponentSelectProps = ComponentProps<typeof Select> & {
  components: Component[];
  emptyOption: { label: string; disabled: boolean };
};

export function ComponentSelect({
  components,
  emptyOption,
  ...props
}: ComponentSelectProps) {
  return (
    <Select {...props}>
      <option value="" disabled={emptyOption.disabled}>
        {emptyOption.label}
      </option>
      {components.map((component) => (
        <option key={component.id} value={component.id}>
          {participantName(component)}
        </option>
      ))}
    </Select>
  );
}
