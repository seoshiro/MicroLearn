import { PageShell } from "@/components/ml/page-shell"
import { DashboardShell } from "@/components/ml/dashboard/shell"
import { StudentStats } from "@/components/ml/student/stats"
import { ActiveCourses } from "@/components/ml/student/active-courses"
import { Schedule } from "@/components/ml/student/schedule"
import { StudentLibrary } from "@/components/ml/student/library"

export const metadata = {
  title: "Кабинет студента · MicroLearn",
}

const studentNav = [
  { label: "Сводка", href: "/student" },
  { label: "Мои курсы", href: "/student/courses" },
  { label: "Расписание", href: "/student/schedule" },
  { label: "Профиль", href: "/profile/student" },
]

export default function StudentDashboardPage() {
  return (
    <PageShell>
      <DashboardShell edition="Кабинет" role="Студент" nav={studentNav}>
        <StudentStats />
        <ActiveCourses />
        <Schedule />
        <StudentLibrary />
      </DashboardShell>
    </PageShell>
  )
}
