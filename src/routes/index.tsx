import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Bell, Check, CheckCircle2, Clock3, Globe2, Menu } from "lucide-react";
import { DeadlyLogo } from "@/components/DeadlyLogo";
import { AnimatedDashboardPreview } from "@/components/AnimatedDashboardPreview";
import { useT, type TKey } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Deadly — Suivi de deadlines" },
      { name: "description", content: "Deadly centralise vos échéances domaines, SSL, hébergements et licences avec des rappels Telegram personnalisés." },
      { property: "og:title", content: "Deadly — Suivi de deadlines" },
      { property: "og:description", content: "Gardez le contrôle sur les renouvellements critiques avec un dashboard clair et des alertes automatiques." },
    ],
  }),
  component: Landing,
});

const FEATURES: [TKey, TKey][] = [
  ["landing.f1.t", "landing.f1.d"],
  ["landing.f2.t", "landing.f2.d"],
  ["landing.f3.t", "landing.f3.d"],
];

const FREE_FEATURES: TKey[] = ["billing.free.1", "billing.free.2", "billing.free.3"];
const PRO_FEATURES: TKey[] = ["billing.pro.1", "billing.pro.2", "billing.pro.3", "billing.pro.4"];

function Landing() {
  const { t } = useT();
  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 md:px-6">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between rounded-full border bg-background/90 px-4 shadow-sm backdrop-blur-xl md:px-6" aria-label="Navigation">
          <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <DeadlyLogo/>
          </Link>
          <div className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <a href="#produit" className="transition-colors hover:text-foreground">{t("landing.nav.product")}</a>
            <a href="#fonctionnalites" className="transition-colors hover:text-foreground">{t("landing.nav.features")}</a>
            <a href="#tarif" className="transition-colors hover:text-foreground">{t("landing.nav.pricing")}</a>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/auth" className="hidden rounded-full px-4 py-2 text-sm font-medium sm:block">{t("landing.nav.login")}</Link>
            <Link to="/auth" className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
              {t("landing.nav.try")} <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
            <Menu aria-hidden="true" className="size-5 md:hidden" />
          </div>
        </nav>
      </header>

      <section className="px-4 pb-16 pt-32 md:px-6 md:pb-24 md:pt-40">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-7 text-center">
            <div className="landing-reveal flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm text-muted-foreground shadow-sm">
              <span className="size-2 rounded-full bg-primary" /> {t("landing.badge")}
            </div>
            <h1 className="landing-reveal landing-delay-1 text-balance text-5xl font-semibold leading-none tracking-[-0.055em] md:text-7xl lg:text-8xl">
              {t("landing.h1a")}<br /><span className="text-muted-foreground">{t("landing.h1b")}</span>
            </h1>
            <p className="landing-reveal landing-delay-2 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground md:text-xl">
              {t("landing.lead")}
            </p>
            <div className="landing-reveal landing-delay-3 flex flex-col items-center gap-3 sm:flex-row">
              <Link to="/auth" className="cta-magnetic flex h-12 items-center gap-2 rounded-full bg-primary px-6 font-semibold text-primary-foreground">
                {t("landing.ctaStart")} <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
              <a href="#produit" className="cta-magnetic flex h-12 items-center rounded-full border bg-card px-6 font-semibold">{t("landing.ctaDiscover")}</a>
            </div>
            <p className="landing-reveal landing-delay-4 text-sm text-muted-foreground">{t("landing.setup")}</p>
          </div>

          <div id="produit" className="tablet-stage relative mx-auto mt-16 max-w-6xl md:mt-24">
            <div className="tablet-float relative rounded-[2.4rem] border-[10px] border-primary bg-primary p-1 shadow-[0_42px_100px_-35px_rgba(0,0,0,.55)] md:rounded-[3rem] md:border-[14px]">
              <span className="absolute left-1/2 top-1.5 h-1.5 w-14 -translate-x-1/2 rounded-full bg-background/25 md:top-2" aria-hidden="true" />
              <div className="relative aspect-[1.78/1] overflow-hidden rounded-[1.65rem] bg-card md:rounded-[2rem] p-3 md:p-5">
                <AnimatedDashboardPreview/>
              </div>
            </div>
            <div className="tablet-shadow mx-auto h-8 w-4/5 rounded-[100%] bg-primary/20 blur-xl" aria-hidden="true" />
          </div>
        </div>
      </section>

      <section id="fonctionnalites" className="border-y bg-card px-4 py-20 md:px-6 md:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 max-w-2xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground">{t("landing.simple")}</p>
            <h2 className="text-balance text-4xl font-semibold tracking-[-0.04em] md:text-6xl">{t("landing.h2a")}<br />{t("landing.h2b")}</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {FEATURES.map(([title, description], index) => (
              <article key={title} className="feature-card flex min-h-72 flex-col justify-between rounded-[1.75rem] border bg-background p-7">
                <span className="flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  {index === 0 ? <Globe2 className="size-5" /> : index === 1 ? <Bell className="size-5" /> : <Clock3 className="size-5" />}
                </span>
                <div>
                  <h3 className="mb-3 text-xl font-semibold">{t(title)}</h3>
                  <p className="leading-relaxed text-muted-foreground">{t(description)}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 md:px-6 md:py-28">
        <div className="mx-auto grid max-w-7xl gap-10 rounded-[2rem] bg-primary p-8 text-primary-foreground md:grid-cols-2 md:p-14">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-widest opacity-60">{t("landing.cta.kicker")}</p>
            <h2 className="text-balance text-4xl font-semibold tracking-[-0.04em] md:text-6xl">{t("landing.cta.h2")}</h2>
          </div>
          <div className="flex flex-col justify-end gap-5">
            <p className="text-lg leading-relaxed opacity-70">{t("landing.cta.text")}</p>
            <div className="flex items-center gap-3"><CheckCircle2 className="size-5" /><span>{t("landing.cta.proof")}</span></div>
          </div>
        </div>
      </section>

      <section id="tarif" className="border-t bg-card px-4 py-20 md:px-6 md:py-28">
        <div className="mx-auto max-w-5xl">
          <div className="max-w-2xl mb-12">
            <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground">{t("landing.price.kicker")}</p>
            <h2 className="text-5xl font-semibold tracking-[-0.05em] md:text-6xl">{t("landing.price.h2")}</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex flex-col rounded-[1.75rem] border bg-background p-7">
              <div className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-2">{t("billing.free")}</div>
              <div className="text-5xl font-semibold tracking-[-0.04em]">0 €<span className="text-lg text-muted-foreground"> {t("billing.perMonth")}</span></div>
              <p className="mt-3 text-muted-foreground">{t("landing.price.freeSub")}</p>
              <ul className="mt-6 flex flex-col gap-3 text-sm">
                {FREE_FEATURES.map((i) => (
                  <li key={i} className="flex items-center gap-3">
                    <span className="flex size-6 items-center justify-center rounded-full bg-secondary text-foreground"><Check className="size-3.5"/></span>{t(i)}
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-7">
                <Link to="/auth" className="flex h-12 items-center justify-center gap-2 rounded-full border bg-card font-semibold">
                  {t("landing.price.freeCta")}
                </Link>
              </div>
            </div>
            <div className="relative flex flex-col rounded-[1.75rem] border-2 border-primary bg-background p-7 shadow-sm">
              <div className="absolute -top-3 left-7 rounded-full bg-primary text-primary-foreground text-xs font-semibold px-3 py-1">{t("billing.recommended")}</div>
              <div className="text-sm font-semibold uppercase tracking-widest text-primary mb-2">Pro</div>
              <div className="text-5xl font-semibold tracking-[-0.04em]">9 €<span className="text-lg text-muted-foreground"> {t("billing.perMonth")}</span></div>
              <p className="mt-3 text-muted-foreground">{t("landing.price.proSub")}</p>
              <ul className="mt-6 flex flex-col gap-3 text-sm">
                {PRO_FEATURES.map((i) => (
                  <li key={i} className="flex items-center gap-3">
                    <span className="flex size-6 items-center justify-center rounded-full bg-secondary text-foreground"><Check className="size-3.5"/></span>{t(i)}
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-7">
                <Link to="/auth" className="flex h-12 items-center justify-center gap-2 rounded-full bg-primary font-semibold text-primary-foreground">
                  {t("landing.price.proCta")} <ArrowRight className="size-4"/>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t px-4 py-8 md:px-6">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
          <span>© 2026 Deadly</span>
          <div className="flex gap-5">
            <a href="#">{t("landing.footer.privacy")}</a>
            <a href="#">{t("landing.footer.terms")}</a>
            <a href="#">{t("landing.footer.contact")}</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
