'use client';

import { useMemo } from 'react';

type CalendarEvent = {
  title: string;
  time: string;
};

const events: CalendarEvent[] = [
  { title: 'Planning review', time: '09:00' },
  { title: 'Design sync', time: '11:30' },
  { title: 'Launch prep', time: '15:00' }
];

export default function CalendarSection() {
  const dayLabel = useMemo(() => new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }), []);

  return (
    <section className="panel-card calendar-panel">
      <div className="tasks-header">
        <div>
          <h2>Today calendar</h2>
          <p>{dayLabel}</p>
        </div>
      </div>
      <ul className="task-list">
        {events.map((event) => (
          <li key={event.title}>
            <span>{event.time}</span>
            <strong>{event.title}</strong>
          </li>
        ))}
      </ul>
    </section>
  );
}
