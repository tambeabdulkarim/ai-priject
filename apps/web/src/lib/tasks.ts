export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'all' | 'active' | 'completed';

export type Task = {
  id: number;
  title: string;
  completed: boolean;
  priority: TaskPriority;
  dueDate?: string;
};

export function filterTasks(tasks: Task[], status: TaskStatus): Task[] {
  if (status === 'active') {
    return tasks.filter((task) => !task.completed);
  }

  if (status === 'completed') {
    return tasks.filter((task) => task.completed);
  }

  return tasks;
}

export function getTaskStats(tasks: Task[]) {
  const completed = tasks.filter((task) => task.completed).length;
  const active = tasks.length - completed;
  const completionRate = tasks.length === 0 ? 0 : Math.round((completed / tasks.length) * 100);

  return { total: tasks.length, completed, active, completionRate };
}
