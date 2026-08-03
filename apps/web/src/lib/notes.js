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
