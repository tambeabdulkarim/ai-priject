import type { Task } from '@/lib/tasks';

export function createTask(title: string, priority: Task['priority']): Task {
  return {
    id: Date.now(),
    title: title.trim() || 'Untitled task',
    completed: false,
    priority
  };
}

export function removeTask(tasks: Task[], taskId: number): Task[] {
  return tasks.filter((task) => task.id !== taskId);
}
