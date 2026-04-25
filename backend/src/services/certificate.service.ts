import { PDFDocument, StandardFonts, rgb } from "pdf-lib"
import fs from "fs/promises"
import path from "path"
import { env } from "../lib/env"
import { prisma } from "../lib/prisma"

export async function generateCertificatePdf(opts: {
  userName: string
  courseTitle: string
  teacherName: string
  issuedAt: Date
}): Promise<{ filePath: string; fileUrl: string }> {
  const { userName, courseTitle, teacherName, issuedAt } = opts

  const pdf = await PDFDocument.create()
  const page = pdf.addPage([842, 595]) // A4 landscape
  const { width, height } = page.getSize()

  const title = await pdf.embedFont(StandardFonts.HelveticaBold)
  const body = await pdf.embedFont(StandardFonts.Helvetica)

  // Border
  page.drawRectangle({
    x: 20,
    y: 20,
    width: width - 40,
    height: height - 40,
    borderColor: rgb(0.2, 0.3, 0.8),
    borderWidth: 3,
  })

  page.drawText("Certificate of Completion", {
    x: width / 2 - 200,
    y: height - 120,
    size: 36,
    font: title,
    color: rgb(0.1, 0.15, 0.45),
  })

  page.drawText("This is proudly presented to", {
    x: width / 2 - 110,
    y: height - 180,
    size: 16,
    font: body,
  })

  page.drawText(userName, {
    x: width / 2 - (userName.length * 10) / 2,
    y: height - 240,
    size: 32,
    font: title,
  })

  const line = `for successfully completing "${courseTitle}"`
  page.drawText(line, {
    x: width / 2 - line.length * 4.2,
    y: height - 290,
    size: 16,
    font: body,
  })

  page.drawText(`Instructor: ${teacherName}`, { x: 80, y: 100, size: 12, font: body })
  page.drawText(`Issued: ${issuedAt.toISOString().slice(0, 10)}`, {
    x: width - 220,
    y: 100,
    size: 12,
    font: body,
  })
  page.drawText("MicroLearn", {
    x: width / 2 - 40,
    y: 60,
    size: 14,
    font: title,
    color: rgb(0.2, 0.3, 0.8),
  })

  const bytes = await pdf.save()

  const dir = path.resolve(env.UPLOAD_DIR, "certificates")
  await fs.mkdir(dir, { recursive: true })
  const filename = `cert-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.pdf`
  const filePath = path.join(dir, filename)
  await fs.writeFile(filePath, bytes)

  return { filePath, fileUrl: `/uploads/certificates/${filename}` }
}

export async function issueCertificate(userId: string, courseId: string): Promise<string> {
  const existing = await prisma.certificate.findUnique({
    where: { userId_courseId: { userId, courseId } },
  })
  if (existing) return existing.fileUrl

  const [user, course] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    prisma.course.findUniqueOrThrow({
      where: { id: courseId },
      include: { teacher: true },
    }),
  ])

  const { fileUrl } = await generateCertificatePdf({
    userName: user.name,
    courseTitle: course.title,
    teacherName: course.teacher.name,
    issuedAt: new Date(),
  })

  await prisma.certificate.create({
    data: { userId, courseId, fileUrl },
  })

  return fileUrl
}
