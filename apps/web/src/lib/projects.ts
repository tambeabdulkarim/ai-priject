export type Project = {
  id: number;
  name: string;
  status: 'Planning' | 'In Progress' | 'Completed';
  progress: number;
  owner: string;
};

export const initialProjects: Project[] = [
  { id: 1, name: 'Product launch', status: 'In Progress', progress: 72, owner: 'Amina' },
  { id: 2, name: 'Client onboarding', status: 'Planning', progress: 24, owner: 'Sarah' },
  { id: 3, name: 'Team training', status: 'Completed', progress: 100, owner: 'Omar' }
];

export function getProjectProgressLabel(progress: number) {
  if (progress >= 100) return 'Completed';
  if (progress >= 70) return 'Nearly done';
  if (progress >= 40) return 'On track';
  return 'Starting';
}
