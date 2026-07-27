import TasksSection from '@/components/TasksSection';
import CalendarSection from '@/components/CalendarSection';
import SettingsPanel from '@/components/SettingsPanel';
import NotesPanel from '@/components/NotesPanel';
import { type Task } from '@/lib/tasks';

const initialTasks: Task[] = [
  { id: 1, title: 'Review requirements', completed: false, priority: 'high' },
  { id: 2, title: 'Prepare summary', completed: true, priority: 'medium' },
  { id: 3, title: 'Confirm milestone', completed: false, priority: 'low' }
];

export default function WorkspacePage() {
  return (
    <main className="workspace-page">
      <section className="workspace-grid">
        <div className="tasks-panel">
          <TasksSection initialTasks={initialTasks} />
          <NotesPanel />
        </div>
        <div className="calendar-panel">
          <CalendarSection />
          <SettingsPanel />
        </div>
      </section>
    </main>
  );
}
