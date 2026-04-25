import { Router, Request, Response } from "express"
import { Role } from "@prisma/client"
import { prisma } from "../lib/prisma"
import { asyncHandler } from "../lib/asyncHandler"
import { verifyAccess, requireRole } from "../middleware/auth"

const router = Router()

router.get(
  "/teacher",
  verifyAccess,
  requireRole(Role.TEACHER),
  asyncHandler(async (req: Request, res: Response) => {
    const teacherId = req.user!.id

    const [courses, enrollments, reviews, recentReviews] = await Promise.all([
      prisma.course.findMany({
        where: { teacherId },
        select: { id: true, title: true },
      }),
      prisma.enrollment.findMany({
        where: { course: { teacherId } },
        select: { userId: true, enrolledAt: true, courseId: true },
      }),
      prisma.review.findMany({
        where: { course: { teacherId } },
        select: { rating: true },
      }),
      prisma.review.findMany({
        where: { course: { teacherId } },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
          course: { select: { id: true, title: true } },
        },
      }),
    ])

    const uniqueStudents = new Set(enrollments.map((e) => e.userId))
    const avgRating =
      reviews.length > 0
        ? Math.round((reviews.reduce((a, b) => a + b.rating, 0) / reviews.length) * 10) / 10
        : 0

    // weekly enrollments — last 7 days, grouped by day
    const now = new Date()
    const weekly: { date: string; count: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now)
      day.setDate(now.getDate() - i)
      const key = day.toISOString().slice(0, 10)
      const count = enrollments.filter(
        (e) => e.enrolledAt.toISOString().slice(0, 10) === key,
      ).length
      weekly.push({ date: key, count })
    }

    res.json({
      data: {
        totalStudents: uniqueStudents.size,
        totalCourses: courses.length,
        avgRating,
        totalViews: enrollments.length, // enrollments as proxy for views
        weeklyEnrollments: weekly,
        recentReviews,
      },
    })
  }),
)

router.get(
  "/student",
  verifyAccess,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id

    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            coverUrl: true,
            modules: { select: { lessons: { select: { id: true } } } },
          },
        },
      },
    })

    const progressRows = await prisma.lessonProgress.findMany({
      where: { userId, completed: true },
      select: { lessonId: true, completedAt: true },
    })
    const completedLessonIds = new Set(progressRows.map((p) => p.lessonId))

    let inProgress = 0
    let completed = 0
    for (const e of enrollments) {
      const lessons = e.course.modules.flatMap((m) => m.lessons.map((l) => l.id))
      if (lessons.length === 0) {
        inProgress++
        continue
      }
      const done = lessons.filter((id) => completedLessonIds.has(id)).length
      if (done === lessons.length) completed++
      else inProgress++
    }

    // streak: consecutive days with at least one lesson completion, ending today
    const daysWithActivity = new Set(
      progressRows
        .map((p) => p.completedAt?.toISOString().slice(0, 10))
        .filter(Boolean) as string[],
    )
    let streak = 0
    const d = new Date()
    while (true) {
      const key = d.toISOString().slice(0, 10)
      if (daysWithActivity.has(key)) {
        streak++
        d.setDate(d.getDate() - 1)
      } else {
        break
      }
    }

    const recentActivity = await prisma.lessonProgress.findMany({
      where: { userId, completed: true },
      orderBy: { completedAt: "desc" },
      take: 10,
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            module: { select: { course: { select: { id: true, title: true } } } },
          },
        },
      },
    })

    res.json({
      data: {
        coursesInProgress: inProgress,
        coursesCompleted: completed,
        totalLessonsCompleted: progressRows.length,
        currentStreak: streak,
        recentActivity: recentActivity.map((a) => ({
          lessonId: a.lessonId,
          lessonTitle: a.lesson.title,
          courseId: a.lesson.module.course.id,
          courseTitle: a.lesson.module.course.title,
          completedAt: a.completedAt,
        })),
      },
    })
  }),
)

export default router
