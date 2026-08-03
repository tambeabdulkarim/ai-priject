// POST/PATCH /courses/:courseId/modules(/:moduleId) — verified real and
// functional against apps/api/src/modules/lessons/{lessons.controller.ts,
// lessons.service.ts,dto/create-module.dto.ts}, but NOT documented
// anywhere in docs/16-API-CONTRACT.md (create-module.dto.ts's own header
// comment says so explicitly: "no endpoint for creating a Module is
// specified anywhere... this is the minimal endpoint needed to make the
// documented Lesson endpoints usable"). Used here because it's real and
// necessary for Module Management, not because it's documented — flagged
// as a real backend gap (missing docs, not missing code) in this phase's
// report.
//
// There is no module-REORDER endpoint anywhere in the real backend
// (verified: lessons.controller.ts only exposes create/update for
// Modules) — Module Management in this frontend is therefore
// create/edit only, matching exactly what exists.

export interface ModuleRecord {
  id: string;
  courseId: string;
  title: string;
  position: number;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateModuleRequest {
  title: string;
  description?: string;
}
