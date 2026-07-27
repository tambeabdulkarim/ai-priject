'use client';

import { useMemo } from 'react';
import { getInsights } from '@/lib/analytics';

export default function AnalyticsPanel() {
  const insights = useMemo(() => getInsights(12, 3), []);

  return (
    <section className="panel-card settings-panel">
      <div className="tasks-header">
        <div>
          <h2>Performance overview</h2>
          <p>A quick snapshot of delivery health and momentum.</p>
        </div>
      </div>
      <div className="stats-grid compact-grid">
        {insights.map((insight) => (
          <article key={insight.title} className="stat-card">
            <h3>{insight.title}</h3>
            <p>{insight.value}</p>
            <span>{insight.detail}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
