import { createContext } from 'react';

export type StepEditorHost = {
  target: HTMLElement;
  showStepEditor: () => void;
};

export const StepEditorHostContext = createContext<StepEditorHost | null>(null);
