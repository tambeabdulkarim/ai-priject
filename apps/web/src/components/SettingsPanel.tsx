'use client';

import { useState } from 'react';

export default function SettingsPanel() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [compactMode, setCompactMode] = useState(false);

  return (
    <section className="panel-card settings-panel">
      <h2>Preferences</h2>
      <label className="toggle-row">
        <span>Enable notifications</span>
        <input type="checkbox" checked={notificationsEnabled} onChange={() => setNotificationsEnabled((value) => !value)} />
      </label>
      <label className="toggle-row">
        <span>Compact view</span>
        <input type="checkbox" checked={compactMode} onChange={() => setCompactMode((value) => !value)} />
      </label>
    </section>
  );
}
