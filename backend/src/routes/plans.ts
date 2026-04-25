import { Router, Request, Response } from "express"
import { z } from "zod"
import { Plan } from "@prisma/client"
import { prisma } from "../lib/prisma"
import { asyncHandler } from "../lib/asyncHandler"
import { validate } from "../middleware/validate"
import { verifyAccess } from "../middleware/auth"
import { PLANS } from "../services/plan.service"

const router = Router()

router.get(
  "/",
  asyncHandler(async (_req: Request, res: Response) => {
    res.json({ data: Object.values(PLANS) })
  }),
)

const subscribeSchema = z.object({ plan: z.nativeEnum(Plan) })

router.post(
  "/subscribe",
  verifyAccess,
  validate(subscribeSchema),
  asyncHandler(async (req: Request, res: Response) => {
    // Stub: no actual payment — just update plan.
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { plan: req.body.plan },
      select: { id: true, plan: true },
    })
    res.json({ data: user })
  }),
)

export default router
