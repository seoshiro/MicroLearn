import { Router, Request, Response } from "express"
import path from "path"
import fs from "fs"
import { Plan } from "@prisma/client"
import { prisma } from "../lib/prisma"
import { asyncHandler } from "../lib/asyncHandler"
import { HttpError } from "../lib/httpError"
import { verifyAccess } from "../middleware/auth"
import { issueCertificate } from "../services/certificate.service"
import { courseProgressPercent } from "../services/progress.service"
import { env } from "../lib/env"

const router = Router()

router.get(
  "/my",
  verifyAccess,
  asyncHandler(async (req: Request, res: Response) => {
    const certs = await prisma.certificate.findMany({
      where: { userId: req.user!.id },
      orderBy: { issuedAt: "desc" },
      include: { course: { select: { id: true, title: true, coverUrl: true } } },
    })
    res.json({ data: certs })
  }),
)

router.get(
  "/:id/download",
  verifyAccess,
  asyncHandler(async (req: Request, res: Response) => {
    const cert = await prisma.certificate.findUnique({ where: { id: req.params.id } })
    if (!cert) throw new HttpError(404, "Certificate not found")
    if (cert.userId !== req.user!.id) throw new HttpError(403, "Not your certificate")

    const rel = cert.fileUrl.replace(/^\/uploads\//, "")
    const abs = path.resolve(env.UPLOAD_DIR, rel)
    if (!fs.existsSync(abs)) throw new HttpError(404, "Certificate file missing")

    res.setHeader("Content-Type", "application/pdf")
    res.setHeader("Content-Disposition", `attachment; filename="certificate-${cert.id}.pdf"`)
    fs.createReadStream(abs).pipe(res)
  }),
)

router.post(
  "/generate/:courseId",
  verifyAccess,
  asyncHandler(async (req: Request, res: Response) => {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id } })
    if (user.plan !== Plan.PREMIUM) {
      throw new HttpError(403, "Certificates are a PREMIUM feature")
    }
    const percent = await courseProgressPercent(user.id, req.params.courseId)
    if (percent < 100) throw new HttpError(400, "Course not fully completed yet")

    const fileUrl = await issueCertificate(user.id, req.params.courseId)
    res.status(201).json({ data: { fileUrl } })
  }),
)

export default router
