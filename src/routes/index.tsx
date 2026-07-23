import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Bell, Check, CheckCircle2, Clock3, Globe2, Menu } from "lucide-react";
import { DeadlyLogo } from "@/components/DeadlyLogo";
import { AnimatedDashboardPreview } from "@/components/AnimatedDashboardPreview";

export const Route = createFileRoute("/")({
  component: Landing,
});

const features: [string, string][] = [
  ["Tout est au même endroit", "Domaines, SSL, hébergements et licences sont rangés par client, sans tableur à maintenir."],
  ["Les bonnes alertes, au bon moment", "Deadly relance votre équipe à J-30, J-14, J-7 et J-1 par email."],
  ["Une routine qui tourne seule", "Après chaque renouvellement, la prochaine échéance est automatiquement programmée."],
];

function Landing() {
  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 md:px-6">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between rounded-full border bg-background/90 px-4 shadow-sm backdrop-blur-xl md:px-6" aria-label="Navigation principale">
          <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <DeadlyLogo/>
          </Link>
          <div className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <a href="#produit" className="transition-colors hover:text-foreground">Produit</a>
            <a href="#fonctionnalites" className="transition-colors hover:text-foreground">Fonctionnalités</a>
            <a href="#tarif" className="transition-colors hover:text-foreground">Tarif</a>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/auth" className="hidden rounded-full px-4 py-2 text-sm font-medium sm:block">Connexion</Link>
            <Link to="/auth" className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
              Essayer gratuitement <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
            <Menu aria-hidden="true" className="size-5 md:hidden" />
          </div>
        </nav>
      </header>

      <section className="px-4 pb-16 pt-32 md:px-6 md:pb-24 md:pt-40">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-7 text-center">
            <div className="landing-reveal flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm text-muted-foreground shadow-sm">
              <span className="size-2 rounded-full bg-primary" /> Vos échéances, enfin sous contrôle
            </div>
            <h1 className="landing-reveal landing-delay-1 text-balance text-5xl font-semibold leading-none tracking-[-0.055em] md:text-7xl lg:text-8xl">
              Renouvelez à temps.<br /><span className="text-muted-foreground">À chaque fois.</span>
            </h1>
            <p className="landing-reveal landing-delay-2 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground md:text-xl">
              Deadly centralise les échéances de tous vos clients et prévient votre équipe avant qu&apos;un domaine, un SSL ou un hébergement n&apos;expire.
            </p>
            <div className="landing-reveal landing-delay-3 flex flex-col items-center gap-3 sm:flex-row">
              <Link to="/auth" className="cta-magnetic flex h-12 items-center gap-2 rounded-full bg-primary px-6 font-semibold text-primary-foreground">
                Commencer maintenant <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
              <a href="#produit" className="cta-magnetic flex h-12 items-center rounded-full border bg-card px-6 font-semibold">Découvrir le produit</a>
            </div>
            <p className="landing-reveal landing-delay-4 text-sm text-muted-foreground">Installation en 5 minutes · Sans engagement</p>
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
            <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground">Simple par conception</p>
            <h2 className="text-balance text-4xl font-semibold tracking-[-0.04em] md:text-6xl">Moins de surveillance.<br />Plus de sérénité.</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {features.map(([title, description], index) => (
              <article key={title} className="feature-card flex min-h-72 flex-col justify-between rounded-[1.75rem] border bg-background p-7">
                <span className="flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  {index === 0 ? <Globe2 className="size-5" /> : index === 1 ? <Bell className="size-5" /> : <Clock3 className="size-5" />}
                </span>
                <div>
                  <h3 className="mb-3 text-xl font-semibold">{title}</h3>
                  <p className="leading-relaxed text-muted-foreground">{description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 md:px-6 md:py-28">
        <div className="mx-auto grid max-w-7xl gap-10 rounded-[2rem] bg-primary p-8 text-primary-foreground md:grid-cols-2 md:p-14">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-widest opacity-60">Une équipe prévenue est une équipe sereine</p>
            <h2 className="text-balance text-4xl font-semibold tracking-[-0.04em] md:text-6xl">L&apos;oubli ne fait plus partie du workflow.</h2>
          </div>
          <div className="flex flex-col justify-end gap-5">
            <p className="text-lg leading-relaxed opacity-70">Chaque personne sait quoi renouveler, pour quel client et avant quelle date. Deadly fait le suivi, votre équipe fait son travail.</p>
            <div className="flex items-center gap-3"><CheckCircle2 className="size-5" /><span>46 renouvellements sur 46 réalisés à temps</span></div>
          </div>
        </div>
      </section>

      <section id="tarif" className="border-t bg-card px-4 py-20 md:px-6 md:py-28">
        <div className="mx-auto max-w-5xl">
          <div className="max-w-2xl mb-12">
            <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground">Un prix simple</p>
            <h2 className="text-5xl font-semibold tracking-[-0.05em] md:text-6xl">Commencez gratuitement.</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-[1.75rem] border bg-background p-7">
              <div className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-2">Gratuit</div>
              <div className="text-5xl font-semibold tracking-[-0.04em]">0 €<span className="text-lg text-muted-foreground"> / mois</span></div>
              <p className="mt-3 text-muted-foreground">Pour découvrir Deadly.</p>
              <ul className="mt-6 flex flex-col gap-3 text-sm">
                {["5 deadlines par mois", "1 rappel par deadline", "Tableau de bord personnel"].map((i) => (
                  <li key={i} className="flex items-center gap-3">
                    <span className="flex size-6 items-center justify-center rounded-full bg-secondary text-foreground"><Check className="size-3.5"/></span>{i}
                  </li>
                ))}
              </ul>
              <Link to="/auth" className="mt-7 flex h-12 items-center justify-center gap-2 rounded-full border bg-card font-semibold">
                Commencer gratuitement
              </Link>
            </div>
            <div className="rounded-[1.75rem] border-2 border-primary bg-background p-7 relative shadow-sm">
              <div className="absolute -top-3 left-7 rounded-full bg-primary text-primary-foreground text-xs font-semibold px-3 py-1">Recommandé</div>
              <div className="text-sm font-semibold uppercase tracking-widest text-primary mb-2">Pro</div>
              <div className="text-5xl font-semibold tracking-[-0.04em]">9 €<span className="text-lg text-muted-foreground"> / mois</span></div>
              <p className="mt-3 text-muted-foreground">Tout ce qu'il faut pour ne rien manquer.</p>
              <ul className="mt-6 flex flex-col gap-3 text-sm">
                {["Deadlines illimitées", "Dates d'alerte personnalisables", "Profil entièrement personnalisable", "Accès aux intégrations (à venir)"].map((i) => (
                  <li key={i} className="flex items-center gap-3">
                    <span className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground"><Check className="size-3.5"/></span>{i}
                  </li>
                ))}
              </ul>
              <Link to="/auth" className="mt-7 flex h-12 items-center justify-center gap-2 rounded-full bg-primary font-semibold text-primary-foreground">
                Passer au Pro <ArrowRight className="size-4"/>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t px-4 py-8 md:px-6">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
          <span>© 2026 Deadly</span>
          <div className="flex gap-5"><a href="#">Confidentialité</a><a href="#">Conditions</a><a href="#">Contact</a></div>
        </div>
      </footer>
    </main>
  );
}

