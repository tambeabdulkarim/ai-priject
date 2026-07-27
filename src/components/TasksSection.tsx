'use client';

import { useMemo, useState } from 'react';
import { createTask, removeTask } from '@/lib/taskManager';
import { getReminderAlerts, reorderTasks, searchTasks } from '@/lib/taskFeatures';
import { filterTasks, getTaskStats, type Task, type TaskStatus } from '@/lib/tasks';

type TasksSectionProps = {
  initialTasks: Task[];
};

export default function TasksSection({ initialTasks }: TasksSectionProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const [status, setStatus] = useState<TaskStatus>('all');
  const [draftTitle, setDraftTitle] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [query, setQuery] = useState('');

  const visibleTasks = useMemo(() => {
    const filteredByStatus = filterTasks(tasks, status);
    return searchTasks(filteredByStatus, query);
  }, [tasks, status, query]);
  const stats = useMemo(() => getTaskStats(tasks), [tasks]);
  const reminders = useMemo(() => getReminderAlerts(tasks), [tasks]);

  const toggleTask = (id: number) => {
    setTasks((current) =>
      current.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task))
    );
  };

  const addTask = () => {
    const trimmedTitle = draftTitle.trim();

    if (!trimmedTitle) {
      return;
    }

    setTasks((current) => [createTask(trimmedTitle, priority), ...current]);
    setDraftTitle('');
    setPriority('medium');
  };

  const deleteTask = (id: number) => {
    setTasks((current) => removeTask(current, id));
  };

  const moveTask = (taskId: number, direction: 'up' | 'down') => {
    const currentIndex = tasks.findIndex((task) => task.id === taskId);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (currentIndex === -1) {
      return;
    }

    setTasks((current) => reorderTasks(current, taskId, targetIndex));
  };

  return (
    <section className="panel-card tasks-panel">
      <div className="tasks-header">
        <div>
          <h2>Task board</h2>
          <p>Organize your next actions with simple priority tracking.</p>
        </div>
        <div className="task-filters">
          <button type="button" className={status === 'all' ? 'active' : ''} onClick={() => setStatus('all')}>
            All
          </button>
          <button type="button" className={status === 'active' ? 'active' : ''} onClick={() => setStatus('active')}>
            Active
          </button>
          <button type="button" className={status === 'completed' ? 'active' : ''} onClick={() => setStatus('completed')}>
            Completed
          </button>
        </div>
      </div>

      <div className="stats-grid compact-grid">
        <article className="stat-card">
          <h3>Total</h3>
          <p>{stats.total}</p>
        </article>
        <article className="stat-card">
          <h3>Active</h3>
          <p>{stats.active}</p>
        </article>
        <article className="stat-card">
          <h3>Completed</h3>
          <p>{stats.completed}</p>
        </article>
      </div>

      <div className="auth-card">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search tasks"
          className="secondary-button"
        />
        <input
          value={draftTitle}
          onChange={(event) => setDraftTitle(event.target.value)}
          placeholder="Add a new task"
          className="secondary-button"
        />
        <select value={priority} onChange={(event) => setPriority(event.target.value as Task['priority'])}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <button type="button" onClick={addTask} className="primary-button">
          Add task
        </button>
      </div>

      {reminders.length > 0 && (
        <div className="auth-card">
          <strong>Reminders</strong>
          <ul className="task-list">
            {reminders.map((reminder: { id: number; title: string; priority: Task['priority']; type: string }) => (
              <li key={reminder.id}>
                <span>{reminder.title}</span>
                <span className={`priority-pill ${reminder.priority}`}>{reminder.type}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ul className="task-list">
        {visibleTasks.map((task: Task) => (
          <li key={task.id}>
            <label>
              <input type="checkbox" checked={task.completed} onChange={() => toggleTask(task.id)} />
              <span className={task.completed ? 'task-completed' : ''}>{task.title}</span>
            </label>
            <div className="task-filters">
              <button type="button" onClick={() => moveTask(task.id, 'up')}>
                ↑
              </button>
              <button type="button" onClick={() => moveTask(task.id, 'down')}>
                ↓
              </button>
              <span className={`priority-pill ${task.priority}`}>{task.priority}</span>
              <button type="button" onClick={() => deleteTask(task.id)}>
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
