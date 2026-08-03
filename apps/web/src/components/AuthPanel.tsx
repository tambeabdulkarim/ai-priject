'use client';

import { useMemo, useState } from 'react';
import { getDemoUser } from '@/lib/auth';

export default function AuthPanel() {
  const [signedIn, setSignedIn] = useState(false);
  const user = useMemo(() => getDemoUser(), []);

  return (
    <section className="panel-card settings-panel">
      <h2>Account</h2>
      <p className="muted-text">{signedIn ? 'Signed in and ready to work.' : 'Sign in to access your workspace.'}</p>
      <div className="auth-card">
        <strong>{signedIn ? user.name : 'Guest'}</strong>
        <span>{signedIn ? user.email : 'No account connected'}</span>
        <button type="button" onClick={() => setSignedIn((value) => !value)}>
          {signedIn ? 'Sign out' : 'Sign in'}
        </button>
      </div>
    </section>
  );
}
