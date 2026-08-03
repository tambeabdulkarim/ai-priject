'use client';

import { useEffect, useState } from 'react';

export default function LocalStorageSync() {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const storedValue = window.localStorage.getItem('opsive-status');
    if (storedValue) {
      setSaved(true);
    }
  }, []);

  const saveState = () => {
    window.localStorage.setItem('opsive-status', 'workspace-ready');
    setSaved(true);
  };

  return (
    <section className="panel-card settings-panel">
      <h2>Local sync</h2>
      <p className="muted-text">Persist a small state snapshot in your browser.</p>
      <button type="button" onClick={saveState} className="primary-button">
        {saved ? 'State saved' : 'Save state'}
      </button>
    </section>
  );
}
