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
