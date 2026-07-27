const test = require('node:test');
const assert = require('node:assert/strict');
const { createNote, getNoteStats, updateNote, deleteNote } = require('../src/lib/notes.js');

test('creates a note with a fallback title and timestamp', () => {
  const note = createNote('', 'Ship the new workspace feature');

  assert.equal(note.title, 'Untitled note');
  assert.equal(note.content, 'Ship the new workspace feature');
  assert.ok(note.id > 0);
  assert.ok(note.createdAt);
});

test('counts notes by total and latest', () => {
  const notes = [
    createNote('Plan', 'Outline the milestone'),
    createNote('Review', 'Check the handoff')
  ];

  const stats = getNoteStats(notes);

  assert.equal(stats.total, 2);
  assert.equal(stats.latestTitle, 'Review');
});

test('updates and deletes notes safely', () => {
  const note = createNote('Draft', 'Initial draft');
  const updated = updateNote(note, { title: 'Updated', content: 'New content' });
  const deleted = deleteNote([note, updated], updated.id);

  assert.equal(updated.title, 'Updated');
  assert.equal(updated.content, 'New content');
  assert.equal(deleted.length, 1);
  assert.equal(deleted[0].id, note.id);
});
