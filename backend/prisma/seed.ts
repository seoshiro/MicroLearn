import {
  PrismaClient,
  Role,
  Plan,
  CourseStatus,
  LessonType,
  NotificationType,
  ReportStatus,
} from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

const avatar = (seed: string) => `https://picsum.photos/seed/${seed}/200/200`
const cover = (seed: string) => `https://picsum.photos/seed/${seed}/800/450`

const videoLibrary = [
  "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
  "https://media.w3.org/2010/05/sintel/trailer.mp4",
  "https://media.w3.org/2010/05/video/movie_300.mp4",
  "https://media.w3.org/2010/05/sintel/trailer.webm",
  "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm",
]

const courseBlueprints: Record<
  string,
  { description: string; modules: string[]; lessons: string[] }
> = {
  "Intro to Figma": {
    description:
      "Практический старт в Figma: от структуры файла до первого кликабельного прототипа для учебного или коммерческого проекта.",
    modules: ["Рабочее пространство", "Компоненты и стили", "Прототип и передача"],
    lessons: ["Обзор интерфейса", "Сетка и фреймы", "Компоненты", "Контрольный чеклист"],
  },
  "Advanced UI Systems": {
    description:
      "Курс о дизайн-системах: токены, состояния компонентов, документация и поддержка единого интерфейса в продуктовой команде.",
    modules: ["Токены и правила", "Компонентная библиотека", "Документация системы"],
    lessons: ["Аудит интерфейса", "Состояния компонента", "Паттерны экранов", "Разбор кейса"],
  },
  "Full-Stack Next.js": {
    description:
      "Сборка full-stack приложения на Next.js: роутинг, серверные данные, формы, API-интеграция и деплой проекта.",
    modules: ["Архитектура App Router", "Данные и формы", "Деплой и качество"],
    lessons: ["Структура проекта", "Загрузка данных", "Server actions и API", "Мини-проект"],
  },
  "TypeScript Deep Dive": {
    description:
      "Глубокое погружение в TypeScript для реальных приложений: типизация API, generics, narrowing и безопасный рефакторинг.",
    modules: ["База строгой типизации", "Generics и модели", "Типизация приложения"],
    lessons: ["Strict mode", "Narrowing", "Generic helpers", "Практический тест"],
  },
  "Growth Marketing 101": {
    description:
      "Введение в growth marketing: гипотезы, воронки, метрики, эксперименты и связь маркетинга с продуктовой аналитикой.",
    modules: ["Воронка роста", "Эксперименты", "Метрики и выводы"],
    lessons: ["North Star Metric", "Карта гипотез", "A/B тест", "Разбор кампании"],
  },
  "SEO for Founders": {
    description:
      "SEO для основателей и маленьких команд: семантика, структура страниц, контент-план и базовая техническая оптимизация.",
    modules: ["Семантика", "Страницы и контент", "Технический минимум"],
    lessons: ["Поисковый спрос", "Кластеризация", "Контент-бриф", "SEO-аудит"],
  },
}

function textLesson(
  courseTitle: string,
  moduleTitle: string,
  lessonTitle: string,
  m: number,
  l: number,
): string {
  return [
    `${lessonTitle}: учебный материал курса «${courseTitle}».`,
    `В этом разделе разбираем тему «${moduleTitle.toLowerCase()}» через короткий практический сценарий. Сначала зафиксируйте цель урока, затем повторите пример на своем проекте и проверьте результат по чеклисту.`,
    `Практика: откройте рабочий файл или заметку, выпишите 3 наблюдения, 2 решения и 1 вопрос, который стоит обсудить с преподавателем. Такой формат помогает не просто прочитать материал, а превратить его в действие.`,
    `Мини-чеклист ${m}.${l}: цель понятна, пример повторен, один вывод записан, следующий шаг определен.`,
  ].join("\n\n")
}

function quizLesson(courseTitle: string, moduleTitle: string): string {
  return [
    `Проверка модуля курса «${courseTitle}».`,
    `Ответьте письменно на три вопроса: что было главным понятием в модуле «${moduleTitle}», где это применяется в реальном проекте, и какую ошибку теперь можно избежать?`,
    "Если ответы занимают меньше пяти предложений, вернитесь к предыдущим урокам и дополните конспект конкретным примером.",
  ].join("\n\n")
}

async function main() {
  console.log("Seeding MicroLearn database...")

  // Clean up (order matters due to FK)
  await prisma.notification.deleteMany()
  await prisma.moderationReport.deleteMany()
  await prisma.certificate.deleteMany()
  await prisma.lessonProgress.deleteMany()
  await prisma.favorite.deleteMany()
  await prisma.review.deleteMany()
  await prisma.enrollment.deleteMany()
  await prisma.lesson.deleteMany()
  await prisma.module.deleteMany()
  await prisma.course.deleteMany()
  await prisma.user.deleteMany()

  const password = await bcrypt.hash("Password123!", 10)

  // Teachers
  const admin = await prisma.user.create({
    data: {
      name: "MicroLearn Admin",
      email: "admin@microlearn.io",
      passwordHash: password,
      role: Role.ADMIN,
      plan: Plan.PREMIUM,
      avatarUrl: avatar("admin"),
      bio: "Moderator account for reviewing users, courses, reports, and platform health.",
      country: "Kazakhstan",
    },
  })

  // Teachers
  const teachers = await Promise.all(
    [
      {
        name: "Aigerim Bekova",
        email: "aigerim@microlearn.io",
        bio: "Senior UI/UX designer, 8+ years.",
        seed: "teacher1",
      },
      {
        name: "Daniyar Tulegenov",
        email: "daniyar@microlearn.io",
        bio: "Full-stack engineer, ex-FAANG.",
        seed: "teacher2",
      },
      {
        name: "Saule Zhumabek",
        email: "saule@microlearn.io",
        bio: "Growth marketer and strategist.",
        seed: "teacher3",
      },
    ].map((t) =>
      prisma.user.create({
        data: {
          name: t.name,
          email: t.email,
          passwordHash: password,
          role: Role.TEACHER,
          plan: Plan.PREMIUM,
          avatarUrl: avatar(t.seed),
          bio: t.bio,
          country: "Kazakhstan",
        },
      }),
    ),
  )

  // Students
  const students = await Promise.all(
    [
      { name: "Temir Student", email: "temir@microlearn.io", plan: Plan.PREMIUM, seed: "s1" },
      { name: "Madina Learner", email: "madina@microlearn.io", plan: Plan.FREE, seed: "s2" },
    ].map((s) =>
      prisma.user.create({
        data: {
          name: s.name,
          email: s.email,
          passwordHash: password,
          role: Role.STUDENT,
          plan: s.plan,
          avatarUrl: avatar(s.seed),
          age: 22,
          country: "Kazakhstan",
          education: "Bachelor's",
          learningGoal: "Land a job in tech",
        },
      }),
    ),
  )

  // Courses
  const courseDefs = [
    { title: "Intro to Figma", category: "Design", price: 0, isFree: true, teacher: 0 },
    { title: "Advanced UI Systems", category: "Design", price: 39.99, isFree: false, teacher: 0 },
    { title: "Full-Stack Next.js", category: "Dev", price: 49.99, isFree: false, teacher: 1 },
    { title: "TypeScript Deep Dive", category: "Dev", price: 0, isFree: true, teacher: 1 },
    {
      title: "Growth Marketing 101",
      category: "Marketing",
      price: 19.99,
      isFree: false,
      teacher: 2,
    },
    { title: "SEO for Founders", category: "Marketing", price: 0, isFree: true, teacher: 2 },
  ]

  const courses = []
  for (let i = 0; i < courseDefs.length; i++) {
    const c = courseDefs[i]
    const course = await prisma.course.create({
      data: {
        title: c.title,
        description: courseBlueprints[c.title].description,
        category: c.category,
        price: c.price,
        isFree: c.isFree,
        status: CourseStatus.PUBLISHED,
        coverUrl: cover(`course${i}`),
        teacherId: teachers[c.teacher].id,
      },
    })

    // 3 modules × 4 lessons
    const blueprint = courseBlueprints[c.title]
    for (let m = 1; m <= 3; m++) {
      const moduleTitle = blueprint.modules[m - 1]
      const mod = await prisma.module.create({
        data: { title: `${m}. ${moduleTitle}`, order: m, courseId: course.id },
      })
      for (let l = 1; l <= 4; l++) {
        const type = l === 1 ? LessonType.VIDEO : l === 4 ? LessonType.QUIZ : LessonType.TEXT
        const lessonTitle = blueprint.lessons[l - 1]
        await prisma.lesson.create({
          data: {
            title: `${m}.${l} ${lessonTitle}`,
            type,
            content:
              type === LessonType.VIDEO
                ? videoLibrary[(i + m + l) % videoLibrary.length]
                : type === LessonType.TEXT
                  ? textLesson(c.title, moduleTitle, lessonTitle, m, l)
                  : quizLesson(c.title, moduleTitle),
            order: l,
            duration: type === LessonType.VIDEO ? 300 : null,
            moduleId: mod.id,
          },
        })
      }
    }
    courses.push(course)
  }

  // Enrollments for students
  for (const s of students) {
    for (const c of courses.slice(0, 3)) {
      await prisma.enrollment.create({ data: { userId: s.id, courseId: c.id } })
    }
  }

  // Reviews — 15
  const reviewers = students
  let reviewCount = 0
  for (const c of courses) {
    for (let i = 0; i < 3 && reviewCount < 15; i++) {
      const user = reviewers[i % reviewers.length]
      try {
        await prisma.review.create({
          data: {
            rating: 3 + ((i + reviewCount) % 3),
            comment: `Great content for ${c.title}! Really enjoyed module ${i + 1}.`,
            userId: user.id,
            courseId: c.id,
          },
        })
        reviewCount++
      } catch {
        /* unique constraint — skip */
      }
    }
  }

  // Notifications
  for (const u of [...teachers, ...students]) {
    await prisma.notification.createMany({
      data: [
        {
          userId: u.id,
          type: NotificationType.SYSTEM,
          title: "Welcome to MicroLearn",
          body: "Your account is ready. Explore courses now.",
        },
        {
          userId: u.id,
          type: NotificationType.ENROLLMENT,
          title: "New enrollment",
          body: "A student just enrolled in one of your courses.",
          read: true,
        },
      ],
    })
  }

  await prisma.moderationReport.createMany({
    data: [
      {
        reporterId: students[0].id,
        courseId: courses[1].id,
        assignedToId: admin.id,
        reason: "Проверить описание курса",
        details: "Студент просит уточнить, какие навыки нужны перед началом курса.",
        status: ReportStatus.REVIEWING,
      },
      {
        reporterId: students[1].id,
        courseId: courses[2].id,
        assignedToId: admin.id,
        reason: "Непонятный материал урока",
        details: "В одном из модулей не хватает пояснения к практическому заданию.",
        status: ReportStatus.OPEN,
      },
      {
        reporterId: students[0].id,
        courseId: courses[3].id,
        assignedToId: admin.id,
        reason: "Проверить видео",
        details: "Видео открывается, но студент предлагает добавить краткий конспект под роликом.",
        status: ReportStatus.RESOLVED,
        resolution: "Добавлен текстовый конспект в материалы урока.",
      },
    ],
  })

  console.log("✅ Seed complete")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
