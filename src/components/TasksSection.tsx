'use client';

import { useMemo, useState } from 'react';
import { filterTasks, getTaskStats, type Task, type TaskStatus } from '@/lib/tasks';

type TasksSectionProps = {
  initialTasks: Task[];
};

export default function TasksSection({ initialTasks }: TasksSectionProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const [status, setStatus] = useState<TaskStatus>('all');

  const visibleTasks = useMemo(() => filterTasks(tasks, status), [tasks, status]);
  const stats = useMemo(() => getTaskStats(tasks), [tasks]);

  const toggleTask = (id: number) => {
    setTasks((current) =>
      current.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task))
    );
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

      <ul className="task-list">
        {visibleTasks.map((task) => (
          <li key={task.id}>
            <label>
              <input type="checkbox" checked={task.completed} onChange={() => toggleTask(task.id)} />
              <span className={task.completed ? 'task-completed' : ''}>{task.title}</span>
            </label>
            <span className={`priority-pill ${task.priority}`}>{task.priority}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
