'use client';

const files = [
  { name: 'Roadmap.pdf', size: '1.2 MB', updated: 'Today' },
  { name: 'Sprint-notes.docx', size: '540 KB', updated: 'Yesterday' },
  { name: 'Design-kit.zip', size: '3.4 MB', updated: '2 days ago' }
];

export default function FilesPanel() {
  return (
    <section className="panel-card settings-panel">
      <h2>Files</h2>
      <ul className="task-list">
        {files.map((file) => (
          <li key={file.name}>
            <div>
              <strong>{file.name}</strong>
              <p className="muted-text">{file.size} • {file.updated}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
