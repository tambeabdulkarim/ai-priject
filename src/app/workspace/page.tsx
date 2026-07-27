import TasksSection from '@/components/TasksSection';
import CalendarSection from '@/components/CalendarSection';
import SettingsPanel from '@/components/SettingsPanel';
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
        <TasksSection initialTasks={initialTasks} />
        <CalendarSection />
        <SettingsPanel />
      </section>
    </main>
  );
}
