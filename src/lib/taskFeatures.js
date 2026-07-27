export function searchTasks(tasks, query) {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return tasks;
  }

  return tasks.filter((task) => task.title.toLowerCase().includes(normalized));
}

export function reorderTasks(tasks, taskId, targetIndex) {
  const list = [...tasks];
  const currentIndex = list.findIndex((task) => task.id === taskId);

  if (currentIndex === -1) {
    return list;
  }

  const [task] = list.splice(currentIndex, 1);
  const safeIndex = Math.max(0, Math.min(targetIndex, list.length));
  list.splice(safeIndex, 0, task);

  return list;
}

export function getReminderAlerts(tasks) {
  const today = new Date();
  const todayString = today.toISOString().slice(0, 10);
  const upcomingLimit = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  return tasks
    .filter((task) => task.dueDate)
    .filter((task) => !task.completed)
    .filter((task) => task.dueDate <= upcomingLimit)
    .map((task) => ({
      id: task.id,
      title: task.title,
      dueDate: task.dueDate,
      priority: task.priority,
      type: task.dueDate < todayString ? 'overdue' : 'upcoming'
    }))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}
