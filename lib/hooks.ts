"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { api, ApiError } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"

// -------- Generic SWR-lite --------

type State<T> = {
  data: T | null
  loading: boolean
  error: string | null
}

export function useFetch<T>(
  path: string | null,
  deps: unknown[] = [],
): State<T> & { reload: () => void } {
  const [state, setState] = useState<State<T>>({ data: null, loading: !!path, error: null })
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const load = useCallback(async () => {
    if (!path) {
      setState({ data: null, loading: false, error: null })
      return
    }
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const res = await api.get<{ data: T }>(path)
      if (mounted.current) setState({ data: res.data, loading: false, error: null })
    } catch (err) {
      if (!mounted.current) return
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Ошибка запроса"
      setState({ data: null, loading: false, error: msg })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, ...deps])

  useEffect(() => {
    load()
  }, [load])

  return { ...state, reload: load }
}

function useProtectedFetch<T>(path: string | null): State<T> & { reload: () => void } {
  const { user, loading } = useAuth()
  return useFetch<T>(!loading && user ? path : null, [loading, user?.id ?? ""])
}

// -------- Типы ответов --------

export type AuthRole = "USER" | "STUDENT" | "TEACHER" | "ADMIN"
export type Plan = "FREE" | "PRO" | "PREMIUM"
export type ReportStatus = "OPEN" | "REVIEWING" | "RESOLVED" | "DISMISSED"

export type TeacherPublic = {
  id: string
  name: string
  email: string
  role: AuthRole
  avatarUrl?: string | null
  bio?: string | null
  country?: string | null
  courseCount: number
  avgRating: number
}

export type CourseListItem = {
  id: string
  title: string
  description: string
  category: string
  price: number
  isFree: boolean
  coverUrl?: string | null
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED"
  createdAt: string
  teacherId: string
  teacher: { id: string; name: string; avatarUrl?: string | null }
  avgRating: number
  _count: { enrollments: number; reviews: number }
}

export type CourseDetail = CourseListItem & {
  modules: {
    id: string
    title: string
    order: number
    lessons: { id: string; title: string; type: string; order: number; duration?: number | null }[]
  }[]
  isEnrolled: boolean
  isTeacher: boolean
  teacher: { id: string; name: string; avatarUrl?: string | null; bio?: string | null }
}

export type CourseProgressDetail = {
  percent: number
  totalLessons: number
  completedLessons: number
  modules: {
    id: string
    title: string
    order: number
    lessons: {
      id: string
      title: string
      order: number
      completed: boolean
      completedAt: string | null
    }[]
  }[]
}

export type EnrollmentItem = {
  id: string
  userId: string
  courseId: string
  enrolledAt: string
  progressPercent: number
  course: CourseListItem & { _count: { modules: number } }
}

export type FavoriteItem = {
  id: string
  courseId: string
  course: CourseListItem
}

export type CertificateItem = {
  id: string
  fileUrl: string
  issuedAt: string
  course: { id: string; title: string; coverUrl?: string | null }
}

export type NotificationItem = {
  id: string
  type: string
  title: string
  body: string
  read: boolean
  createdAt: string
}

export type PlanDef = {
  id: Plan
  name: string
  priceUSD: number
  features: string[]
  maxEnrollments: number
  maxCoursePrice: number
  certificates: boolean
  searchBoost: boolean
  adBanner: boolean
}

export type StudentDashboard = {
  coursesInProgress: number
  coursesCompleted: number
  totalLessonsCompleted: number
  currentStreak: number
  recentActivity: {
    lessonId: string
    lessonTitle: string
    courseId: string
    courseTitle: string
    completedAt: string
  }[]
}

export type TeacherDashboard = {
  totalStudents: number
  totalCourses: number
  avgRating: number
  totalViews: number
  weeklyEnrollments: { date: string; count: number }[]
  recentReviews: {
    id: string
    rating: number
    comment?: string | null
    createdAt: string
    user: { id: string; name: string; avatarUrl?: string | null }
    course: { id: string; title: string }
  }[]
}

export type AdminOverview = {
  usersByRole: { role: AuthRole; count: number }[]
  coursesByStatus: { status: string; count: number }[]
  reportsByStatus: { status: ReportStatus; count: number }[]
  totals: {
    users: number
    courses: number
    enrollments: number
    completedLessons: number
    reports: number
  }
  recentReports: AdminReport[]
  popularCourses: (CourseListItem & { _count: { enrollments: number; reviews: number } })[]
}

export type AdminUser = {
  id: string
  name: string
  email: string
  role: AuthRole
  plan: Plan
  createdAt: string
  _count: { enrollments: number; taughtCourses: number; reviews: number; certificates: number }
}

export type AdminCourse = CourseListItem & {
  teacher: { id: string; name: string; email: string }
  updatedAt: string
  _count: { modules: number; enrollments: number; reviews: number; reports: number }
}

export type AdminReport = {
  id: string
  reason: string
  details?: string | null
  status: ReportStatus
  resolution?: string | null
  createdAt: string
  updatedAt: string
  reporter?: { id: string; name: string; email: string } | null
  assignedTo?: { id: string; name: string; email: string } | null
  course?: { id: string; title: string; status: string } | null
}

// -------- Именованные хуки --------

export const useStudentDashboard = () => useProtectedFetch<StudentDashboard>("/dashboard/student")
export const useTeacherDashboard = () => useProtectedFetch<TeacherDashboard>("/dashboard/teacher")
export const useAdminOverview = () => useProtectedFetch<AdminOverview>("/admin/overview")
export const useAdminUsers = (qs = "") => useProtectedFetch<AdminUser[]>(`/admin/users${qs}`)
export const useAdminCourses = (qs = "") => useProtectedFetch<AdminCourse[]>(`/admin/courses${qs}`)
export const useAdminReports = (qs = "") => useProtectedFetch<AdminReport[]>(`/admin/reports${qs}`)
export const useMyEnrollments = () => useProtectedFetch<EnrollmentItem[]>("/enrollments/my")
export const useMyFavorites = () => useProtectedFetch<FavoriteItem[]>("/favorites/my")
export const useMyCertificates = () => useProtectedFetch<CertificateItem[]>("/certificates/my")
export const useMyNotifications = () => useProtectedFetch<NotificationItem[]>("/notifications/my")

export const usePlans = () => useFetch<PlanDef[]>("/plans")

export const useTeachers = () => useFetch<TeacherPublic[]>("/users")

export function useCourses(params?: {
  category?: string
  search?: string
  sort?: "rating" | "newest" | "price_asc" | "price_desc"
  page?: number
  limit?: number
  teacherId?: string
}) {
  const qs = params
    ? "?" +
      new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== undefined && v !== "")
          .map(([k, v]) => [k, String(v)]),
      ).toString()
    : ""
  return useFetch<CourseListItem[]>(`/courses${qs}`, [qs])
}

export const useCourse = (id?: string | null) =>
  useFetch<CourseDetail>(id ? `/courses/${id}` : null, [id ?? ""])

export const useCourseProgress = (id?: string | null) =>
  useProtectedFetch<CourseProgressDetail>(id ? `/progress/course/${id}` : null)

export const useUser = (id?: string | null) =>
  useFetch<unknown>(id ? `/users/${id}` : null, [id ?? ""])
