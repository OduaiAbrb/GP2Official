export type WorkspacePreset = {
  id: string;
  label: string;
  description: string;
  layout: {
    showSummary: boolean;
    showAiRuns: boolean;
    condensePhases: boolean;
  };
};

export const workspacePresets: WorkspacePreset[] = [
  {
    id: 'default',
    label: 'Standard',
    description: 'Navigation, summary metrics, and AI insights stay pinned for every phase.',
    layout: { showSummary: true, showAiRuns: true, condensePhases: false },
  },
  {
    id: 'focus',
    label: 'Focus',
    description: 'Hides sidebar noise for heads-down execution.',
    layout: { showSummary: false, showAiRuns: false, condensePhases: true },
  },
  {
    id: 'review',
    label: 'Review',
    description: 'Highlights status and AI audit info for stakeholders.',
    layout: { showSummary: true, showAiRuns: true, condensePhases: false },
  },
  {
    id: 'condensed',
    label: 'Condensed',
    description: 'Compact layout for small screens or quick scanning.',
    layout: { showSummary: false, showAiRuns: true, condensePhases: true },
  },
];
