export type Insight = {
  title: string;
  value: string;
  detail: string;
};

export function getInsights(tasksCompleted: number, projectsCompleted: number): Insight[] {
  return [
    { title: 'Completed tasks', value: `${tasksCompleted}`, detail: 'Tracked from your workspace board.' },
    { title: 'Projects completed', value: `${projectsCompleted}`, detail: 'Healthy delivery pace this month.' },
    { title: 'Focus score', value: '91/100', detail: 'Momentum remains strong and steady.' }
  ];
}
