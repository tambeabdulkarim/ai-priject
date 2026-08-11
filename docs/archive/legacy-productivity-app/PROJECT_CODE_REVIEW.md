# Project Code Review Snapshot

This file stores the main project source files discussed during review in one place for easy reference.

## 1) Root page
File: src/app/page.tsx

```tsx
import { redirect } from 'next/navigation';
import { defaultLocale } from '@/lib/i18n';

export default function HomePage() {
  redirect(`/${defaultLocale}`);
}
```

## 2) Localized landing page
File: src/app/[lang]/page.tsx

```tsx
import { notFound } from 'next/navigation';
import HomePageContent from '@/components/HomePageContent';
import { defaultLocale, isLocale, type Locale } from '@/lib/i18n';

export function generateStaticParams() {
  return [{ lang: 'ar' }, { lang: 'en' }];
}

type PageProps = {
  params: { lang?: string };
};

export default function LocalePage({ params }: PageProps) {
  const lang = params.lang ?? defaultLocale;

  if (!isLocale(lang)) {
    notFound();
  }

  return <HomePageContent locale={lang as Locale} />;
}
```

## 3) Landing page content
File: src/components/HomePageContent.tsx

```tsx
'use client';

import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { getDictionary, type Locale } from '@/lib/i18n';

type HomePageContentProps = {
  locale: Locale;
};

export default function HomePageContent({ locale }: HomePageContentProps) {
  const dict = getDictionary(locale);

  return (
    <div className={`page-shell ${locale === 'ar' ? 'rtl' : 'ltr'}`}>
      <Navigation locale={locale} />

      <main>
        <section className="hero" id="about">
          <div className="hero-copy">
            <span className="hero-badge">{dict.hero.badge}</span>
            <h1>{dict.hero.title}</h1>
            <p>{dict.hero.description}</p>
            <div className="hero-actions">
              <a href={`/${locale}/workspace`} className="primary-button">
                {dict.hero.primaryCta}
              </a>
              <a href={`/${locale}/projects`} className="secondary-button">
                {dict.hero.secondaryCta}
              </a>
            </div>
            <div className="hero-highlights">
              <span>⚡ Fast workflows</span>
              <span>🧠 Smart organization</span>
              <span>📈 Clear analytics</span>
            </div>
          </div>

          <div className="hero-panel" id="features">
            <div className="panel-card feature-stack">
              <div className="feature-intro">
                <h2>{dict.metrics.title}</h2>
                <p>Everything you need to stay focused, organize work, and move faster.</p>
              </div>
              <div className="metric-list">
                {dict.metrics.items.map((item) => (
                  <div key={item.title} className="metric-item">
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="showcase-grid" aria-label="Product highlights">
          <article className="showcase-card">
            <h3>Plan with clarity</h3>
            <p>Break big goals into manageable actions and keep momentum high.</p>
          </article>
          <article className="showcase-card">
            <h3>Work in one place</h3>
            <p>Tasks, notes, projects, and insights are centralized for smooth execution.</p>
          </article>
          <article className="showcase-card">
            <h3>Stay ahead</h3>
            <p>Use reminders and progress tracking to make informed decisions quickly.</p>
          </article>
        </section>
      </main>

      <Footer locale={locale} />
    </div>
  );
}
```

## 4) Navigation component
File: src/components/Navigation.tsx

```tsx
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getDictionary, locales, type Locale } from '@/lib/i18n';

type NavigationProps = {
  locale: Locale;
};

export default function Navigation({ locale }: NavigationProps) {
  const dict = getDictionary(locale);
  const pathname = usePathname();
  const router = useRouter();

  const switchLocale = (nextLocale: Locale) => {
    const segments = pathname.split('/').filter(Boolean);
    const currentLocaleIndex = segments.findIndex((segment) => locales.includes(segment as Locale));

    if (currentLocaleIndex >= 0) {
      segments[currentLocaleIndex] = nextLocale;
    } else {
      segments.unshift(nextLocale);
    }

    const nextPath = `/${segments.join('/')}`;
    router.push(nextPath || '/');
  };

  return (
    <header className="topbar">
      <Link href={`/${locale}`} className="brand-link">
        {dict.nav.brand}
      </Link>

      <nav className="nav-links" aria-label="Primary navigation">
        <Link href={`/${locale}`}>{dict.nav.home}</Link>
        <Link href={`/${locale}#features`}>{dict.nav.features}</Link>
        <Link href={`/${locale}#about`}>{dict.nav.about}</Link>
        <Link href={`/${locale}/workspace`}>{dict.nav.workspace}</Link>
        <Link href={`/${locale}/files`}>{dict.nav.files}</Link>
        <Link href={`/${locale}/projects`}>{dict.nav.projects}</Link>
        <Link href={`/${locale}/analytics`}>{dict.nav.analytics}</Link>
        <Link href={`/${locale}#contact`}>{dict.nav.contact}</Link>
      </nav>

      <div className="lang-switcher" aria-label="Language switcher">
        <button type="button" onClick={() => switchLocale('ar')} className={locale === 'ar' ? 'active' : ''}>
          العربية
        </button>
        <button type="button" onClick={() => switchLocale('en')} className={locale === 'en' ? 'active' : ''}>
          English
        </button>
      </div>
    </header>
  );
}
```

## 5) Localization dictionary
File: src/lib/i18n.ts

```ts
export type Locale = 'ar' | 'en';

export const locales = ['ar', 'en'] as const;
export const defaultLocale: Locale = 'ar';

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export const dictionaries = {
  ar: {
    nav: {
      brand: 'أوبسيف',
      home: 'الرئيسية',
      features: 'المميزات',
      about: 'حولنا',
      contact: 'تواصل',
      workspace: 'المساحة',
      files: 'الملفات',
      projects: 'المشاريع',
      analytics: 'التحليلات'
    },
    hero: {
      badge: 'منصة إنتاجية ذكية',
      title: 'خطط يومك، وابدأ العمل بثقة.',
      description: 'أطلق رحلتك في إدارة المهام والتخطيط مع واجهة احترافية مصممة لتسريع الإنتاجية وتوحيد العمل.',
      primaryCta: 'ابدأ الآن',
      secondaryCta: 'اكتشف المميزات'
    },
    metrics: {
      title: 'ماذا تقدّم لك المنصة؟',
      items: [
        { title: 'تنظيم ذكي', description: 'أدر مهامك اليومية بسهولة عبر لوحة واضحة ومبسطة.' },
        { title: 'تعاون سريع', description: 'شارك العمل مع الفريق دون فقدان الترتيب أو الوضوح.' },
        { title: 'تقدم واضح', description: 'تابع الإنجازات والمؤشرات في لمحة سريعة.' }
      ]
    }
  },
  en: {
    nav: {
      brand: 'Opsive',
      home: 'Home',
      features: 'Features',
      about: 'About',
      contact: 'Contact',
      workspace: 'Workspace',
      files: 'Files',
      projects: 'Projects',
      analytics: 'Analytics'
    },
    hero: {
      badge: 'Smart productivity platform',
      title: 'Plan your day and start working with confidence.',
      description: 'Launch your workflow with a polished experience for task management, planning, and daily execution.',
      primaryCta: 'Get started',
      secondaryCta: 'Explore features'
    },
    metrics: {
      title: 'What the platform offers',
      items: [
        { title: 'Smart organization', description: 'Keep daily tasks in order through a simple and focused workspace.' },
        { title: 'Fast collaboration', description: 'Share work with your team without losing clarity or momentum.' },
        { title: 'Clear progress', description: 'Track achievements and performance in a single glance.' }
      ]
    }
  }
} as const;

export function getDictionary(locale: Locale) {
  return dictionaries[locale];
}
```

## 6) Task board component
File: src/components/TasksSection.tsx

```tsx
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
```

## 7) Task management helpers
File: src/lib/taskManager.ts

```ts
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
```

## 8) Task features helpers
File: src/lib/taskFeatures.js

```js
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
```

## 9) Task model
File: src/lib/tasks.ts

```ts
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
```

## 10) Notes panel
File: src/components/NotesPanel.tsx

```tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { createNote, deleteNote, getNoteStats, updateNote } from '@/lib/notes';
import { readStorage, writeStorage } from '@/lib/storage';

type Note = ReturnType<typeof createNote>;

export default function NotesPanel() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  const stats = useMemo(() => getNoteStats(notes), [notes]);

  useEffect(() => {
    const storedNotes = readStorage<Note[]>('opsive-notes', []);
    setNotes(storedNotes);
  }, []);

  useEffect(() => {
    writeStorage('opsive-notes', notes);
  }, [notes]);

  const addNote = () => {
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    if (!trimmedContent) {
      return;
    }

    if (editingId) {
      setNotes((current) => current.map((note) => (note.id === editingId ? updateNote(note, { title: trimmedTitle, content: trimmedContent }) : note)));
      setEditingId(null);
    } else {
      const note = createNote(trimmedTitle, trimmedContent);
      setNotes((current) => [note, ...current]);
    }

    setTitle('');
    setContent('');
  };

  const startEditing = (note: Note) => {
    setEditingId(note.id);
    setTitle(note.title);
    setContent(note.content);
  };

  const removeNote = (noteId: number) => {
    setNotes((current) => deleteNote(current, noteId));
    if (editingId === noteId) {
      setEditingId(null);
      setTitle('');
      setContent('');
    }
  };

  return (
    <section className="panel-card">
      <div className="tasks-header">
        <div>
          <h2>Quick notes</h2>
          <p>Capture ideas and follow-ups without leaving your workspace.</p>
        </div>
      </div>

      <div className="stats-grid compact-grid">
        <article className="stat-card">
          <h3>Total notes</h3>
          <p>{stats.total}</p>
        </article>
        <article className="stat-card">
          <h3>Latest</h3>
          <p>{stats.latestTitle}</p>
        </article>
      </div>

      <div className="auth-card">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Note title"
          className="secondary-button"
        />
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Write a quick note..."
          rows={4}
        />
        <button type="button" onClick={addNote} className="primary-button">
          {editingId ? 'Save changes' : 'Save note'}
        </button>
      </div>

      <ul className="task-list">
        {notes.map((note) => (
          <li key={note.id}>
            <div style={{ flex: 1 }}>
              <strong>{note.title}</strong>
              <p>{note.content}</p>
            </div>
            <div className="task-filters">
              <button type="button" onClick={() => startEditing(note)}>
                Edit
              </button>
              <button type="button" onClick={() => removeNote(note.id)}>
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

## 11) Notes logic
File: src/lib/notes.js

```js
export function createNote(title, content) {
  const safeTitle = title.trim() || 'Untitled note';
  const safeContent = content.trim();

  return {
    id: Date.now(),
    title: safeTitle,
    content: safeContent,
    createdAt: new Date().toISOString()
  };
}

export function updateNote(note, updates) {
  return {
    ...note,
    title: updates.title?.trim() || note.title,
    content: updates.content?.trim() || note.content
  };
}

export function deleteNote(notes, noteId) {
  const index = notes.findIndex((note) => note.id === noteId);

  if (index === -1) {
    return notes;
  }

  return [...notes.slice(0, index), ...notes.slice(index + 1)];
}

export function getNoteStats(notes) {
  const latest = notes[notes.length - 1];

  return {
    total: notes.length,
    latestTitle: latest ? latest.title : 'No notes yet'
  };
}
```

## 12) Storage helpers
File: src/lib/storage.ts

```ts
export function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') {
    return fallback;
  }

  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeStorage<T>(key: string, value: T) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}
```
