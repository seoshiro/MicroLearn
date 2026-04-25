"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, CheckCircle2, Loader2, PlayCircle } from "lucide-react"
import { api, ApiError } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { useCourse, useCourseProgress } from "@/lib/hooks"

type LessonContent = {
  id: string
  title: string
  type: string
  order: number
  duration?: number | null
  content?: string | null
  moduleId: string
}

function isVideo(url?: string | null) {
  return !!url && /^https?:\/\/.+\.(mp4|webm|ogg)(\?.*)?$/i.test(url)
}

export function LessonReader({ courseId, lessonId }: { courseId: string; lessonId: string }) {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { data: course } = useCourse(courseId)
  const { data: progress, reload: reloadProgress } = useCourseProgress(courseId)
  const [lesson, setLesson] = useState<LessonContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const lessons = useMemo(
    () =>
      course?.modules.flatMap((module, moduleIndex) =>
        module.lessons.map((item, lessonIndex) => ({
          ...item,
          moduleIndex,
          lessonIndex,
          moduleTitle: module.title,
        })),
      ) ?? [],
    [course?.modules],
  )
  const currentIndex = lessons.findIndex((item) => item.id === lessonId)
  const currentMeta = currentIndex >= 0 ? lessons[currentIndex] : null
  const nextLesson = currentIndex >= 0 ? lessons[currentIndex + 1] : null
  const completed =
    progress?.modules.some((module) =>
      module.lessons.some((item) => item.id === lessonId && item.completed),
    ) ?? false

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (authLoading) return
      if (!user) {
        setError("Войдите или зарегистрируйтесь, чтобы открыть урок.")
        setLoading(false)
        return
      }
      setLoading(true)
      setError(null)
      try {
        const res = await api.get<{ data: LessonContent }>(`/lessons/${lessonId}/content`)
        if (!cancelled) setLesson(res.data)
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Не удалось открыть урок")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [authLoading, lessonId, user])

  async function completeLesson() {
    setBusy(true)
    setError(null)
    try {
      await api.post(`/progress/lesson/${lessonId}/complete`)
      await reloadProgress()
      const target = nextLesson
        ? `/courses/${courseId}?next=${nextLesson.id}#program`
        : `/courses/${courseId}?completed=1#program`
      router.push(target)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось завершить урок")
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="section-rule">
      <div className="mx-auto max-w-[1440px] px-6 md:px-10">
        <div className="grid grid-cols-12 gap-6 py-10 md:py-14">
          <aside className="col-span-12 md:col-span-3">
            <Link
              href={`/courses/${courseId}#program`}
              className="inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.14em] underline underline-offset-4 decoration-accent hover:text-accent"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />К программе
            </Link>
            <div className="mt-8 border border-rule bg-panel p-4">
              <div className="mono-label text-muted">Прогресс</div>
              <div className="mt-3 font-display text-[40px] leading-none tracking-[-0.02em]">
                {progress?.percent ?? 0}%
              </div>
              <div className="mt-3 text-[12px] leading-[1.5] text-muted">
                {progress
                  ? `${progress.completedLessons} из ${progress.totalLessons} уроков завершено`
                  : "Загрузка прогресса"}
              </div>
            </div>
          </aside>

          <article className="col-span-12 md:col-span-9">
            <div className="mono-label text-accent">
              {currentMeta
                ? `${currentMeta.moduleIndex + 1}.${currentMeta.lessonIndex + 1}`
                : "Урок"}
            </div>
            <h1 className="mt-4 font-display text-[44px] leading-[0.98] tracking-[-0.025em] md:text-[72px]">
              {lesson?.title ?? currentMeta?.title ?? "Открываем урок"}
            </h1>
            {course && (
              <p className="mt-5 max-w-[70ch] text-[15px] leading-[1.65] text-muted">
                {course.title} · {currentMeta?.moduleTitle ?? "модуль"}
              </p>
            )}

            {loading ? (
              <div className="mt-10 inline-flex items-center gap-2 text-[14px] text-muted">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Загружаем материалы…
              </div>
            ) : error ? (
              <div
                className="mt-10 border border-accent/60 bg-accent/10 px-4 py-3 text-[14px] text-accent"
                role="alert"
              >
                {error}
              </div>
            ) : lesson ? (
              <div className="mt-10 border-t border-rule pt-8">
                {lesson.type === "VIDEO" && isVideo(lesson.content) ? (
                  <div className="border border-rule bg-panel p-3">
                    <video
                      src={lesson.content ?? undefined}
                      controls
                      preload="metadata"
                      className="aspect-video w-full bg-background object-cover"
                    />
                    <p className="mt-3 text-[13px] leading-[1.55] text-muted">
                      Посмотрите видео и отметьте урок завершенным. После этого MicroLearn вернет
                      вас к программе и подсветит следующий шаг.
                    </p>
                  </div>
                ) : (
                  <div className="max-w-[76ch] whitespace-pre-line text-[16px] leading-[1.75]">
                    {lesson.content || "Материалы урока пока не добавлены."}
                  </div>
                )}

                <div className="mt-8 flex flex-wrap items-center gap-3">
                  {completed ? (
                    <Link
                      href={`/courses/${courseId}?next=${nextLesson?.id ?? lessonId}#program`}
                      className="inline-flex h-11 items-center gap-2 border border-foreground bg-foreground px-5 text-[12px] uppercase tracking-[0.14em] text-background hover:bg-accent hover:border-accent"
                    >
                      <CheckCircle2 className="h-4 w-4" aria-hidden />
                      Вернуться к программе
                    </Link>
                  ) : (
                    <button
                      onClick={completeLesson}
                      disabled={busy}
                      className="inline-flex h-11 items-center gap-2 border border-foreground bg-foreground px-5 text-[12px] uppercase tracking-[0.14em] text-background hover:bg-accent hover:border-accent disabled:opacity-60"
                    >
                      {busy ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      ) : (
                        <PlayCircle className="h-4 w-4" aria-hidden />
                      )}
                      Завершить урок
                    </button>
                  )}
                  {nextLesson && (
                    <Link
                      href={`/courses/${courseId}/lessons/${nextLesson.id}`}
                      className="h-11 border border-rule px-5 text-[12px] uppercase tracking-[0.14em] inline-flex items-center hover:border-foreground"
                    >
                      Следующий урок
                    </Link>
                  )}
                </div>
              </div>
            ) : null}
          </article>
        </div>
      </div>
    </section>
  )
}
