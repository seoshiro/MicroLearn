"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { formatKZT } from "@/lib/format"
import { usePlans, type Plan } from "@/lib/hooks"
import { useAuth } from "@/lib/auth-context"
import { api, ApiError } from "@/lib/api"

type TierUi = {
  planId: Plan
  code: string
  name: string
  tagline: string
  monthly: number
  yearly: number
  features: string[]
  cta: string
  featured?: boolean
}

// Таглайны и копирайт-надстройки к планам, пришедшим из API.
const UI: Record<
  Plan,
  {
    code: string
    name: string
    tagline: string
    monthly: number
    yearly: number
    cta: string
    featured?: boolean
  }
> = {
  FREE: {
    code: "№ 01",
    name: "Базовый",
    tagline: "Читать и пробовать",
    monthly: 0,
    yearly: 0,
    cta: "Начать бесплатно",
  },
  PRO: {
    code: "№ 02",
    name: "Читатель",
    tagline: "Один тариф, весь каталог",
    monthly: 9_900,
    yearly: 89_000,
    cta: "Оформить подписку",
    featured: true,
  },
  PREMIUM: {
    code: "№ 03",
    name: "Редакция",
    tagline: "Сертификаты и приоритет",
    monthly: 34_900,
    yearly: 314_000,
    cta: "Перейти на Premium",
  },
}

/**
 * Три тарифа. Описания тянутся из /api/plans, подписка — POST /api/plans/subscribe.
 */
export function PricingTiers() {
  const router = useRouter()
  const { user, refresh } = useAuth()
  const { data: plans } = usePlans()
  const [annual, setAnnual] = useState(false)
  const [busy, setBusy] = useState<Plan | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Собираем финальный список уровней: UI-описания + фичи из API (если прилетели).
  const tiers: TierUi[] = (["FREE", "PRO", "PREMIUM"] as Plan[]).map((id) => {
    const ui = UI[id]
    const fromApi = plans?.find((p) => p.id === id)
    return {
      planId: id,
      ...ui,
      features: fromApi?.features ?? [],
    }
  })

  async function subscribe(plan: Plan) {
    setError(null)
    if (!user) {
      router.push("/register#register")
      return
    }
    setBusy(plan)
    try {
      await api.post("/plans/subscribe", { plan })
      await refresh()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Не удалось оформить подписку")
    } finally {
      setBusy(null)
    }
  }

  return (
    <section className="border-t border-rule">
      <header className="grid grid-cols-12 gap-6 px-4 py-10 md:items-end md:px-8 md:py-14">
        <div className="col-span-12 md:col-span-8">
          <div className="mono-label text-muted">01 / Тарифы</div>
          <h1 className="mt-4 font-display text-[44px] leading-[0.95] tracking-[-0.03em] sm:text-[56px] md:text-[88px]">
            Три колонки
            <span className="block italic font-[450]">одной подписки.</span>
          </h1>
          <p className="mt-6 max-w-[52ch] text-[15px] leading-[1.55] md:text-[16px]">
            Ни одного скрытого платежа. Отмена — одним кликом. Цены указаны в тенге и уже включают
            НДС.
          </p>
        </div>

        <div className="col-span-12 md:col-span-4 md:flex md:justify-end">
          <div
            role="radiogroup"
            aria-label="Период оплаты"
            className="flex w-full items-stretch border border-foreground md:inline-flex md:w-auto"
          >
            <button
              onClick={() => setAnnual(false)}
              aria-checked={!annual}
              role="radio"
              className={[
                "h-11 flex-1 px-4 text-[12px] uppercase tracking-[0.14em] md:h-10 md:flex-none",
                !annual ? "bg-foreground text-background" : "hover:bg-panel",
              ].join(" ")}
            >
              Месяц
            </button>
            <button
              onClick={() => setAnnual(true)}
              aria-checked={annual}
              role="radio"
              className={[
                "h-11 flex-1 border-l border-foreground px-4 text-[12px] uppercase tracking-[0.14em] md:h-10 md:flex-none",
                annual ? "bg-foreground text-background" : "hover:bg-panel",
              ].join(" ")}
            >
              Год · −25%
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div
          className="border-t border-rule bg-accent/10 px-4 py-3 text-[13px] text-accent md:px-8"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 border-t border-rule">
        {tiers.map((tier, index) => {
          const price = annual ? tier.yearly : tier.monthly
          const priceLabel = price === 0 ? "Бесплатно" : formatKZT(price)
          const period = price === 0 ? "" : annual ? " / год" : " / мес"
          const isCurrent = user?.plan === tier.planId
          const isBusy = busy === tier.planId

          return (
            <article
              key={tier.planId}
              className={[
                "flex flex-col px-4 py-10 md:px-8",
                tier.featured ? "bg-foreground text-background" : "",
                index !== 0 ? "border-t border-rule md:border-t-0 md:border-l" : "",
              ].join(" ")}
            >
              <div
                className={["mono-label", tier.featured ? "text-background/60" : "text-muted"].join(
                  " ",
                )}
              >
                {tier.code}
              </div>

              <h2 className="mt-4 font-display text-[34px] md:text-[44px] leading-[1] tracking-[-0.02em]">
                {tier.name}
              </h2>
              <p
                className={[
                  "mt-2 text-[14px]",
                  tier.featured ? "text-background/70" : "text-muted",
                ].join(" ")}
              >
                {tier.tagline}
              </p>

              <div className="mt-8 flex items-baseline gap-2">
                <span className="font-display text-[44px] md:text-[56px] leading-none tracking-[-0.02em]">
                  {priceLabel}
                </span>
                {period && (
                  <span
                    className={[
                      "text-[13px]",
                      tier.featured ? "text-background/70" : "text-muted",
                    ].join(" ")}
                  >
                    {period}
                  </span>
                )}
              </div>

              <ul className="mt-8 space-y-3 flex-1">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-[14px] leading-[1.5]">
                    <span
                      className={[
                        "mt-[9px] h-[1px] w-5 shrink-0",
                        tier.featured ? "bg-background/70" : "bg-foreground",
                      ].join(" ")}
                      aria-hidden="true"
                    />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => subscribe(tier.planId)}
                disabled={isCurrent || isBusy}
                className={[
                  "mt-10 h-12 w-full text-[13px] uppercase tracking-[0.14em] border",
                  tier.featured
                    ? "bg-background text-foreground border-background hover:bg-accent hover:text-background hover:border-accent"
                    : "bg-foreground text-background border-foreground hover:bg-accent hover:border-accent",
                  "disabled:cursor-not-allowed disabled:opacity-60",
                ].join(" ")}
              >
                {isBusy ? "Переключаем…" : isCurrent ? "Ваш тариф" : tier.cta}
              </button>
            </article>
          )
        })}
      </div>
    </section>
  )
}
