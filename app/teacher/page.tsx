import { PageShell } from "@/components/ml/page-shell"
import { DashboardShell } from "@/components/ml/dashboard/shell"
import { TeacherStats } from "@/components/ml/teacher/stats"
import { CoursesTable } from "@/components/ml/teacher/courses-table"
import { TeacherActivity } from "@/components/ml/teacher/activity"

export const metadata = {
  title: "Кабинет преподавателя · MicroLearn",
}

const teacherNav = [
  { label: "Сводка", href: "/teacher" },
  { label: "Курсы", href: "/teacher/courses" },
  { label: "Создать курс", href: "/teacher/new" },
  { label: "Профиль", href: "/profile/teacher" },
]

export default function TeacherDashboardPage() {
  return (
    <PageShell>
      <DashboardShell
        edition="Кабинет"
        role="Преподаватель"
        title="Анна Ковалёва"
        subtitle="Продуктовый дизайн · 2 847 студентов"
        nav={teacherNav}
      >
        <TeacherStats />
        <CoursesTable />
        <TeacherActivity />
      </DashboardShell>
    </PageShell>
  )
}
