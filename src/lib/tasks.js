export function filterTasks(tasks, status) {
  if (status === 'active') {
    return tasks.filter((task) => !task.completed);
  }

  if (status === 'completed') {
    return tasks.filter((task) => task.completed);
  }

  return tasks;
}

export function getTaskStats(tasks) {
  const completed = tasks.filter((task) => task.completed).length;
  const active = tasks.length - completed;
  const completionRate = tasks.length === 0 ? 0 : Math.round((completed / tasks.length) * 100);

  return { total: tasks.length, completed, active, completionRate };
}
