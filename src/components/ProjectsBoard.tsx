'use client';

import { useMemo, useState } from 'react';
import { getProjectProgressLabel, initialProjects, type Project } from '@/lib/projects';

export default function ProjectsBoard() {
  const [projects, setProjects] = useState<Project[]>(initialProjects);

  const totalProgress = useMemo(() => {
    if (!projects.length) return 0;
    return Math.round(projects.reduce((sum, project) => sum + project.progress, 0) / projects.length);
  }, [projects]);

  const advanceProject = (id: number) => {
    setProjects((current) =>
      current.map((project) =>
        project.id === id ? { ...project, progress: Math.min(project.progress + 10, 100), status: project.progress >= 90 ? 'Completed' : 'In Progress' } : project
      )
    );
  };

  return (
    <section className="panel-card settings-panel">
      <div className="tasks-header">
        <div>
          <h2>Projects board</h2>
          <p>Track project health and promote the next milestone.</p>
        </div>
        <div className="pill-card">
          <span>Average progress</span>
          <strong>{totalProgress}%</strong>
        </div>
      </div>

      <div className="task-list">
        {projects.map((project) => (
          <div key={project.id} className="project-card">
            <div className="project-main">
              <div>
                <strong>{project.name}</strong>
                <p>{project.owner} • {project.status}</p>
              </div>
              <button type="button" onClick={() => advanceProject(project.id)}>
                Advance
              </button>
            </div>
            <div className="progress-row">
              <div className="progress-bar">
                <div style={{ width: `${project.progress}%` }} />
              </div>
              <span>{project.progress}% • {getProjectProgressLabel(project.progress)}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
