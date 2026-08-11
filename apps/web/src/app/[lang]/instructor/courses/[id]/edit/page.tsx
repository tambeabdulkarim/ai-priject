'use client';

// Course Management — the consolidated Instructor workspace page for a
// single course: detail edit, workflow transitions, Module Management,
// Lesson Management, and Media upload/attach.
//
// Reuses hooks/useCourses.ts's `useCourse(slug)` (built in an earlier
// phase for the public course-detail view) for the module/lesson tree —
// its documented behavior already includes full unredacted lesson
// bodies for the owning instructor (server-side, per
// packages/api-client/src/resources/courses.ts's comment on
// `getBySlug`). Since `useCourse` takes a slug and this route only has
// the course id (no slug-lookup-by-id endpoint exists), the course is
// first located via `useMyOwnedCourses` to obtain its slug, then
// `useCourse(slug)` is used for the actual detail/module/lesson data.
//
// REAL BACKEND GAPS surfaced and deliberately NOT worked around:
//  - No module-reorder endpoint — Module Management is create/edit only.
//  - No LessonFile-attach endpoint — no downloadable-attachment UI.
//  - Instructor per-course Progress View (enrollment count, completion
//    %, certificates issued) has no backend endpoint at all — shown as
//    an explicit BLOCKED notice, no invented numbers.
//
// Phase 13.3 (Media Frontend): video-lesson media attachment now goes
// through <MediaPicker /> (POST /files/... → real Media row →
// PATCH /lessons/:id { videoMediaId }) instead of the old inline
// upload-only flow — the File→Media gap this used to document (Phase
// 13.2) is closed. See media-implementation-plan.md Phase 13.4.

import { useState, type FormEvent } from 'react';
import { useParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { type Locale } from '@/lib/i18n';
import { RequireRole } from '../../../../../../guards/RequireRole';
import { useAuth } from '../../../../../../hooks/useAuth';
import { useCourse } from '../../../../../../hooks/useCourses';
import {
  useMyOwnedCourses,
  useUpdateCourse,
  useSubmitForReview,
  usePublishCourse,
  useArchiveCourse,
} from '../../../../../../hooks/useInstructorCourses';
import { useCreateModule, useUpdateModule } from '../../../../../../hooks/useModules';
import { useCreateLesson, useUpdateLesson } from '../../../../../../hooks/useInstructorLessons';
import { MediaPicker } from '../../../../../../components/media/MediaPicker';
import { getErrorMessage } from '../../../../../../utils/errors';
import { INSTRUCTOR_ROLES, COURSE_PUBLISH_ROLES } from '../../../../../../constants/routes';

const COPY = {
  ar: {
    loading: 'جارٍ التحميل...',
    notFound: 'لم يتم العثور على الدورة ضمن دوراتك.',
    details: 'تفاصيل الدورة',
    courseTitle: 'العنوان',
    description: 'الوصف',
    categoryId: 'معرّف التصنيف',
    priceCents: 'السعر (سنت)',
    save: 'حفظ التعديلات',
    saving: 'جارٍ الحفظ...',
    saved: 'تم الحفظ.',
    workflow: 'حالة سير العمل',
    status: { draft: 'مسودة', in_review: 'قيد المراجعة', published: 'منشورة', archived: 'مؤرشفة' },
    submitReview: 'إرسال للمراجعة',
    publish: 'نشر',
    archive: 'أرشفة',
    progressTitle: 'إحصاءات التقدّم',
    modules: 'الوحدات',
    newModuleTitle: 'عنوان الوحدة الجديدة',
    addModule: 'إضافة وحدة',
    editModule: 'تعديل',
    lessons: 'الدروس',
    newLessonTitle: 'عنوان الدرس الجديد',
    addLesson: 'إضافة درس',
    editLesson: 'تعديل الدرس',
    lessonBody: 'محتوى الدرس (نصي)',
    contentType: 'نوع المحتوى',
    media: 'الوسائط',
    attachVideo: 'إرفاق فيديو',
    changeVideo: 'تغيير الفيديو',
    videoAttached: 'تم إرفاق فيديو',
    noVideoAttached: 'لم يُرفق أي فيديو بعد',
    progressBlocked:
      'لا توجد واجهة برمجية في الخادم لعرض عدد المسجّلين أو نسبة الإكمال أو الشهادات الصادرة لهذه الدورة.',
    cancel: 'إلغاء',
  },
  en: {
    loading: 'Loading...',
    notFound: 'This course was not found among your owned courses.',
    details: 'Course details',
    courseTitle: 'Title',
    description: 'Description',
    categoryId: 'Category ID',
    priceCents: 'Price (cents)',
    save: 'Save changes',
    saving: 'Saving...',
    saved: 'Saved.',
    workflow: 'Workflow status',
    status: {
      draft: 'Draft',
      in_review: 'In review',
      published: 'Published',
      archived: 'Archived',
    },
    submitReview: 'Submit for review',
    publish: 'Publish',
    archive: 'Archive',
    modules: 'Modules',
    newModuleTitle: 'New module title',
    addModule: 'Add module',
    editModule: 'Edit',
    progressTitle: 'Progress statistics',
    lessons: 'Lessons',
    newLessonTitle: 'New lesson title',
    addLesson: 'Add lesson',
    editLesson: 'Edit lesson',
    lessonBody: 'Lesson body (text)',
    contentType: 'Content type',
    media: 'Media',
    attachVideo: 'Attach video',
    changeVideo: 'Change video',
    videoAttached: 'Video attached',
    noVideoAttached: 'No video attached yet',
    progressBlocked:
      'No backend endpoint exposes enrollment count, completion percentage, or certificates issued for this course.',
    cancel: 'Cancel',
  },
} as const;

function CourseEditContent() {
  const params = useParams<{ lang: string; id: string }>();
  const locale = (params.lang as Locale) ?? 'ar';
  const t = COPY[locale] ?? COPY.ar;
  const courseId = params.id;
  const { user } = useAuth();

  const { data: ownedCourses, isLoading: ownedLoading } = useMyOwnedCourses(user?.id);
  const owned = ownedCourses?.find((c) => c.id === courseId);

  const { data: course, isLoading: courseLoading } = useCourse(owned?.slug ?? '');

  const updateCourse = useUpdateCourse();
  const submitForReview = useSubmitForReview();
  const publishCourse = usePublishCourse();
  const archiveCourse = useArchiveCourse();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [priceCents, setPriceCents] = useState('');
  const [detailsInitialized, setDetailsInitialized] = useState(false);

  if (course && !detailsInitialized) {
    setTitle(course.title);
    setDescription(course.description ?? '');
    setCategoryId(course.categoryId);
    setPriceCents(String(course.priceCents));
    setDetailsInitialized(true);
  }

  const createModule = useCreateModule(owned?.slug ?? '');
  const updateModule = useUpdateModule(owned?.slug ?? '');
  const createLesson = useCreateLesson(owned?.slug ?? '');
  const updateLesson = useUpdateLesson(owned?.slug ?? '');

  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [editModuleTitle, setEditModuleTitle] = useState('');

  const [newLessonModuleId, setNewLessonModuleId] = useState<string | null>(null);
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonContentType, setNewLessonContentType] = useState<'video' | 'text' | 'quiz'>(
    'text',
  );
  const [newLessonBody, setNewLessonBody] = useState('');
  const [newLessonMediaId, setNewLessonMediaId] = useState<string | null>(null);

  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [editLessonTitle, setEditLessonTitle] = useState('');
  const [editLessonBody, setEditLessonBody] = useState('');

  // `pickerLessonId === 'new'` means the picker is selecting media for
  // the not-yet-created lesson in the "Add lesson" form below; any real
  // id means it's attaching to that already-existing lesson.
  const [pickerLessonId, setPickerLessonId] = useState<string | 'new' | null>(null);

  if (ownedLoading || (owned && courseLoading)) {
    return <p className="ph-state">{t.loading}</p>;
  }
  if (!owned) {
    return <p className="ph-state">{t.notFound}</p>;
  }

  function handleSaveDetails(event: FormEvent) {
    event.preventDefault();
    updateCourse.mutate({
      id: courseId,
      title,
      description: description || undefined,
      categoryId,
      priceCents: priceCents ? Number(priceCents) : undefined,
    });
  }

  function handleAddModule(event: FormEvent) {
    event.preventDefault();
    if (!newModuleTitle.trim()) return;
    createModule.mutate(
      { courseId, title: newModuleTitle },
      {
        onSuccess: (result) => {
          if (!result.error) setNewModuleTitle('');
        },
      },
    );
  }

  function startEditModule(moduleId: string, currentTitle: string) {
    setEditingModuleId(moduleId);
    setEditModuleTitle(currentTitle);
  }

  function handleSaveModule(event: FormEvent, moduleId: string) {
    event.preventDefault();
    updateModule.mutate(
      { courseId, moduleId, title: editModuleTitle },
      {
        onSuccess: (result) => {
          if (!result.error) setEditingModuleId(null);
        },
      },
    );
  }

  function handleAddLesson(event: FormEvent, moduleId: string) {
    event.preventDefault();
    if (!newLessonTitle.trim()) return;
    if (newLessonContentType === 'text' && !newLessonBody.trim()) return;
    // Phase 13.3: the real backend requires videoMediaId for a video
    // lesson at creation time (LessonsService.create — the same class of
    // rule as text lessons requiring body, fixed for text in Phase
    // 11.7). Guard here matches that rule instead of round-tripping a
    // real 400.
    if (newLessonContentType === 'video' && !newLessonMediaId) return;
    createLesson.mutate(
      {
        courseId,
        moduleId,
        title: newLessonTitle,
        contentType: newLessonContentType,
        body: newLessonContentType === 'text' ? newLessonBody : undefined,
        videoMediaId:
          newLessonContentType === 'video' ? (newLessonMediaId ?? undefined) : undefined,
      },
      {
        onSuccess: (result) => {
          if (!result.error) {
            setNewLessonTitle('');
            setNewLessonBody('');
            setNewLessonMediaId(null);
            setNewLessonModuleId(null);
          }
        },
      },
    );
  }

  function startEditLesson(lessonId: string, currentTitle: string, currentBody: string | null) {
    setEditingLessonId(lessonId);
    setEditLessonTitle(currentTitle);
    setEditLessonBody(currentBody ?? '');
  }

  function handleSaveLesson(event: FormEvent, lessonId: string) {
    event.preventDefault();
    updateLesson.mutate(
      { id: lessonId, title: editLessonTitle, body: editLessonBody || undefined },
      {
        onSuccess: (result) => {
          if (!result.error) setEditingLessonId(null);
        },
      },
    );
  }

  function handleAttachMedia(lessonId: string, mediaId: string) {
    updateLesson.mutate({ id: lessonId, videoMediaId: mediaId });
    setPickerLessonId(null);
  }

  const canPublish = COURSE_PUBLISH_ROLES.some((role) => user?.roles.includes(role));

  return (
    <div className={locale === 'ar' ? 'rtl' : 'ltr'}>
      <Navigation locale={locale} />
      <main className="ph-page">
        <h1 className="ph-page-title">{owned.title}</h1>

        <section>
          <h2 className="ph-catalogue-card-title">{t.workflow}</h2>
          <p className="ph-page-subtitle">{t.status[owned.status]}</p>
          <div className="ph-form" style={{ flexDirection: 'row', gap: '1rem' }}>
            {owned.status === 'draft' && (
              <button
                type="button"
                className="ph-btn-outline"
                onClick={() => submitForReview.mutate(courseId)}
                disabled={submitForReview.isPending}
              >
                {t.submitReview}
              </button>
            )}
            {owned.status === 'in_review' && canPublish && (
              <button
                type="button"
                className="ph-btn-outline"
                onClick={() => publishCourse.mutate(courseId)}
                disabled={publishCourse.isPending}
              >
                {t.publish}
              </button>
            )}
            {owned.status !== 'archived' && (
              <button
                type="button"
                className="ph-btn-outline"
                onClick={() => archiveCourse.mutate(courseId)}
                disabled={archiveCourse.isPending}
              >
                {t.archive}
              </button>
            )}
          </div>
        </section>

        <section style={{ marginTop: '2rem' }}>
          <h2 className="ph-catalogue-card-title">{t.details}</h2>
          <form className="ph-form" onSubmit={handleSaveDetails} noValidate>
            {updateCourse.error && (
              <div className="ph-form-error" role="alert">
                {getErrorMessage(updateCourse.error)}
              </div>
            )}
            {updateCourse.isSuccess && !updateCourse.data?.error && (
              <div className="ph-form-success" role="status">
                {t.saved}
              </div>
            )}

            <div className="ph-field">
              <label className="ph-label" htmlFor="title">
                {t.courseTitle}
              </label>
              <input
                id="title"
                className="ph-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="ph-field">
              <label className="ph-label" htmlFor="description">
                {t.description}
              </label>
              <textarea
                id="description"
                className="ph-input"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="ph-field">
              <label className="ph-label" htmlFor="categoryId">
                {t.categoryId}
              </label>
              <input
                id="categoryId"
                className="ph-input"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
              />
            </div>
            <div className="ph-field">
              <label className="ph-label" htmlFor="priceCents">
                {t.priceCents}
              </label>
              <input
                id="priceCents"
                type="number"
                min={0}
                className="ph-input"
                value={priceCents}
                onChange={(e) => setPriceCents(e.target.value)}
              />
            </div>
            <button type="submit" className="ph-btn-grad" disabled={updateCourse.isPending}>
              {updateCourse.isPending ? t.saving : t.save}
            </button>
          </form>
        </section>

        <section style={{ marginTop: '2rem' }}>
          <h2 className="ph-catalogue-card-title">{t.modules}</h2>

          {course?.modules.map((mod) => (
            <div
              key={mod.id}
              className="ph-catalogue-card"
              style={{ cursor: 'default', marginBottom: '1rem' }}
            >
              {editingModuleId === mod.id ? (
                <form className="ph-form" onSubmit={(e) => handleSaveModule(e, mod.id)} noValidate>
                  <input
                    className="ph-input"
                    value={editModuleTitle}
                    onChange={(e) => setEditModuleTitle(e.target.value)}
                    required
                  />
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="submit" className="ph-btn-grad" disabled={updateModule.isPending}>
                      {t.save}
                    </button>
                    <button
                      type="button"
                      className="ph-btn-outline"
                      onClick={() => setEditingModuleId(null)}
                    >
                      {t.cancel}
                    </button>
                  </div>
                </form>
              ) : (
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <h3 className="ph-catalogue-card-title">{mod.title}</h3>
                  <button
                    type="button"
                    className="ph-btn-outline"
                    onClick={() => startEditModule(mod.id, mod.title)}
                  >
                    {t.editModule}
                  </button>
                </div>
              )}

              <h4 style={{ marginTop: '1rem' }}>{t.lessons}</h4>
              {mod.lessons.map((lesson) => (
                <div
                  key={lesson.id}
                  style={{
                    borderTop: '1px solid var(--ph-border, #333)',
                    paddingTop: '0.75rem',
                    marginTop: '0.75rem',
                  }}
                >
                  {editingLessonId === lesson.id ? (
                    <form
                      className="ph-form"
                      onSubmit={(e) => handleSaveLesson(e, lesson.id)}
                      noValidate
                    >
                      <input
                        className="ph-input"
                        value={editLessonTitle}
                        onChange={(e) => setEditLessonTitle(e.target.value)}
                        required
                      />
                      {lesson.contentType === 'text' && (
                        <textarea
                          className="ph-input"
                          rows={4}
                          value={editLessonBody}
                          onChange={(e) => setEditLessonBody(e.target.value)}
                          placeholder={t.lessonBody}
                        />
                      )}
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          type="submit"
                          className="ph-btn-grad"
                          disabled={updateLesson.isPending}
                        >
                          {t.save}
                        </button>
                        <button
                          type="button"
                          className="ph-btn-outline"
                          onClick={() => setEditingLessonId(null)}
                        >
                          {t.cancel}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span>
                        {lesson.title} <em>({lesson.contentType})</em>
                      </span>
                      <button
                        type="button"
                        className="ph-btn-outline"
                        onClick={() => startEditLesson(lesson.id, lesson.title, lesson.body)}
                      >
                        {t.editLesson}
                      </button>
                    </div>
                  )}

                  {lesson.contentType === 'video' && (
                    <div
                      style={{
                        marginTop: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                      }}
                    >
                      <span className="ph-catalogue-card-meta">
                        {lesson.videoMediaId ? t.videoAttached : t.noVideoAttached}
                      </span>
                      <button
                        type="button"
                        className="ph-btn-outline"
                        onClick={() => setPickerLessonId(lesson.id)}
                      >
                        {lesson.videoMediaId ? t.changeVideo : t.attachVideo}
                      </button>
                    </div>
                  )}
                  {updateLesson.isError &&
                    editingLessonId !== lesson.id &&
                    lesson.contentType === 'video' && (
                      <div className="ph-form-error" role="alert" style={{ marginTop: '0.5rem' }}>
                        {getErrorMessage(updateLesson.error)}
                      </div>
                    )}
                </div>
              ))}

              {newLessonModuleId === mod.id ? (
                <form
                  className="ph-form"
                  onSubmit={(e) => handleAddLesson(e, mod.id)}
                  noValidate
                  style={{ marginTop: '1rem' }}
                >
                  <input
                    className="ph-input"
                    placeholder={t.newLessonTitle}
                    value={newLessonTitle}
                    onChange={(e) => setNewLessonTitle(e.target.value)}
                    required
                  />
                  <select
                    className="ph-input"
                    value={newLessonContentType}
                    onChange={(e) => {
                      setNewLessonContentType(e.target.value as 'video' | 'text' | 'quiz');
                      setNewLessonMediaId(null);
                    }}
                  >
                    <option value="text">text</option>
                    <option value="video">video</option>
                    <option value="quiz">quiz</option>
                  </select>
                  {newLessonContentType === 'text' && (
                    <textarea
                      className="ph-input"
                      rows={4}
                      value={newLessonBody}
                      onChange={(e) => setNewLessonBody(e.target.value)}
                      placeholder={t.lessonBody}
                      required
                    />
                  )}
                  {newLessonContentType === 'video' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span className="ph-catalogue-card-meta">
                        {newLessonMediaId ? t.videoAttached : t.noVideoAttached}
                      </span>
                      <button
                        type="button"
                        className="ph-btn-outline"
                        onClick={() => setPickerLessonId('new')}
                      >
                        {newLessonMediaId ? t.changeVideo : t.attachVideo}
                      </button>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="submit" className="ph-btn-grad" disabled={createLesson.isPending}>
                      {t.addLesson}
                    </button>
                    <button
                      type="button"
                      className="ph-btn-outline"
                      onClick={() => setNewLessonModuleId(null)}
                    >
                      {t.cancel}
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  className="ph-btn-outline"
                  style={{ marginTop: '1rem' }}
                  onClick={() => setNewLessonModuleId(mod.id)}
                >
                  {t.addLesson}
                </button>
              )}
            </div>
          ))}

          <form className="ph-form" onSubmit={handleAddModule} noValidate>
            {createModule.error && (
              <div className="ph-form-error" role="alert">
                {getErrorMessage(createModule.error)}
              </div>
            )}
            <input
              className="ph-input"
              placeholder={t.newModuleTitle}
              value={newModuleTitle}
              onChange={(e) => setNewModuleTitle(e.target.value)}
              required
            />
            <button type="submit" className="ph-btn-grad" disabled={createModule.isPending}>
              {t.addModule}
            </button>
          </form>
        </section>

        <section style={{ marginTop: '2rem' }}>
          <h2 className="ph-catalogue-card-title">{t.progressTitle}</h2>
          <p className="ph-form-error" role="note">
            {t.progressBlocked}
          </p>
        </section>
      </main>
      <Footer locale={locale} />

      <MediaPicker
        open={pickerLessonId !== null}
        onClose={() => setPickerLessonId(null)}
        onSelect={(media) => {
          if (pickerLessonId === 'new') {
            setNewLessonMediaId(media.id);
            setPickerLessonId(null);
          } else if (pickerLessonId) {
            handleAttachMedia(pickerLessonId, media.id);
          }
        }}
        locale={locale}
        mediaType="video"
        uploadAccept={['video/mp4']}
      />
    </div>
  );
}

export default function CourseEditPage() {
  return (
    <RequireRole roles={[...INSTRUCTOR_ROLES]}>
      <CourseEditContent />
    </RequireRole>
  );
}
