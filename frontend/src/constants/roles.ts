export type RoleOption = {
  id: string;
  label: string;
  description: string;
  authority: number;
};

export const ROLE_OPTIONS: RoleOption[] = [
  {
    id: 'portfolio_admin',
    label: 'Portfolio Admin',
    description: 'Owns the workspace, billing, and org-wide governance.',
    authority: 5,
  },
  {
    id: 'program_manager',
    label: 'Program Manager',
    description: 'Controls templates, approvals, and team assignments.',
    authority: 4,
  },
  {
    id: 'product_manager',
    label: 'Product Manager',
    description: 'Leads planning, feasibility, and requirements decisions.',
    authority: 3,
  },
  {
    id: 'business_analyst',
    label: 'Business Analyst',
    description: 'Documents analyses, risks, and compliance evidence.',
    authority: 2,
  },
  {
    id: 'developer',
    label: 'Developer',
    description: 'Executes tasks, builds features, and updates estimates.',
    authority: 1,
  },
  {
    id: 'qa',
    label: 'QA / Validation',
    description: 'Runs validation, testing, and approval checklists.',
    authority: 1,
  },
];

export const MIN_TEAM_ADMIN_AUTHORITY = 4;
