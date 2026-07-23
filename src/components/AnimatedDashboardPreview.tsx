import { Bell, Calendar as CalIcon, CheckCircle2, ClipboardCheck, ClipboardList, Clock, Home, Plus, Search, Settings, TrendingUp, AlertTriangle, MousePointer2 } from "lucide-react";

/**
 * Animated dashboard preview shown inside the landing hero tablet.
 * A CSS-driven scene: a cursor moves to "+", opens a "Nouvelle deadline" dialog,
 * fake-types the title, date and reminder, clicks Créer, then the whole preview
 * zooms out with a bounce and loops.
 */
export function AnimatedDashboardPreview() {
  return (
    <div className="adp-root relative h-full w-full">
      <div className="adp-scene h-full w-full">
        <DashboardMock />
        <FakeDialog />
        <Cursor />
      </div>
    </div>
  );
}

function DashboardMock() {
  return (
    <div className="flex h-full w-full gap-3 rounded-[1.4rem] overflow-hidden bg-[#fcfbf8]">
      {/* Sidebar */}
      <aside className="flex w-11 flex-col items-center justify-between rounded-2xl bg-ink py-3">
        <div className="flex flex-col items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-lg bg-cream text-ink">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div id="adp-plus" className="grid h-7 w-7 place-items-center rounded-lg bg-cream/10 text-cream">
            <Plus className="h-4 w-4" />
          </div>
          <SBIcon icon={<Home className="h-3.5 w-3.5" />} active />
          <SBIcon icon={<CalIcon className="h-3.5 w-3.5" />} />
          <SBIcon icon={<ClipboardList className="h-3.5 w-3.5" />} />
          <SBIcon icon={<TrendingUp className="h-3.5 w-3.5" />} />
        </div>
        <SBIcon icon={<Settings className="h-3.5 w-3.5" />} />
      </aside>

      {/* Main */}
      <div className="flex-1 overflow-hidden">
        {/* topbar */}
        <div className="flex items-center gap-2 pb-3">
          <div className="flex-1 flex items-center gap-2 rounded-full bg-white border border-border px-3 h-8 text-[11px] text-muted-foreground">
            <Search className="h-3 w-3" /> Rechercher une deadline, une tâche…
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-ink text-cream px-2.5 h-8 text-[11px] font-semibold">Upgrade</div>
          <div className="relative grid h-8 w-8 place-items-center rounded-full bg-white border border-border">
            <Bell className="h-3.5 w-3.5" />
            <span className="absolute -top-1 -right-1 grid h-3.5 w-3.5 place-items-center rounded-full bg-brand-red text-[8px] font-bold text-white">3</span>
          </div>
          <div className="grid h-8 w-8 place-items-center rounded-full bg-brand-orange text-ink text-[10px] font-bold">MD</div>
        </div>

        {/* header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-display text-xl font-extrabold leading-tight">Bonjour Mathieu 👋</h3>
            <p className="text-[10px] text-muted-foreground">Voici un aperçu de vos deadlines.</p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-ink text-cream px-3 h-8 text-[11px] font-semibold">
            <Plus className="h-3 w-3" /> Nouvelle deadline
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          <KPI label="À venir" value="3" hint="cette semaine" icon={<CalIcon className="h-3 w-3" />} tone="blue" />
          <KPI label="En cours" value="8" hint="+2 vs semaine dernière" icon={<Clock className="h-3 w-3" />} tone="orange" />
          <KPI label="Respectées" value="24" hint="+18% ce mois" icon={<CheckCircle2 className="h-3 w-3" />} tone="green" />
          <KPI label="En retard" value="2" hint="Nécessite votre attention" icon={<AlertTriangle className="h-3 w-3" />} tone="red" />
        </div>

        {/* charts */}
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2 rounded-2xl bg-white border border-border p-3">
            <div className="flex items-start justify-between mb-1">
              <div>
                <div className="text-[11px] font-bold">Activité de la semaine</div>
                <div className="text-[9px] text-muted-foreground">Deadlines terminées par jour</div>
              </div>
              <div className="text-[9px] font-semibold text-brand-green">↗ +35%</div>
            </div>
            <FakeChart />
          </div>
          <div className="rounded-2xl bg-white border border-border p-3">
            <div className="text-[11px] font-bold mb-2">Priorités du jour</div>
            <ul className="space-y-1.5">
              {[
                ["Rapport financier Q2", "brand-red", "Aujourd'hui"],
                ["Validation maquettes", "brand-orange", "Aujourd'hui"],
                ["Sync équipe design", "brand-blue", "16h00"],
                ["Envoi newsletter", "brand-purple", "18h00"],
              ].map(([t, c, d]) => (
                <li key={t} className="flex items-center justify-between text-[10px]">
                  <span className="flex items-center gap-1.5 min-w-0"><span className={`h-1.5 w-1.5 rounded-full bg-${c}`}/><span className="truncate">{t}</span></span>
                  <span className={`text-[9px] font-semibold text-${c}`}>{d}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function SBIcon({ icon, active }: { icon: React.ReactNode; active?: boolean }) {
  return <div className={`grid h-7 w-7 place-items-center rounded-lg ${active ? "bg-cream text-ink" : "text-cream/60"}`}>{icon}</div>;
}

function KPI({ label, value, hint, icon, tone }: { label: string; value: string; hint: string; icon: React.ReactNode; tone: "blue"|"orange"|"green"|"red" }) {
  const map = { blue:"bg-brand-blue/15 text-brand-blue", orange:"bg-brand-orange/15 text-brand-orange", green:"bg-brand-green/15 text-brand-green", red:"bg-brand-red/15 text-brand-red" };
  return (
    <div className="rounded-2xl bg-white border border-border p-2.5">
      <div className="flex items-start justify-between">
        <div className="text-[9px] text-muted-foreground">{label}</div>
        <div className={`h-5 w-5 rounded-md grid place-items-center ${map[tone]}`}>{icon}</div>
      </div>
      <div className="font-display text-2xl font-extrabold leading-tight mt-1">{value}</div>
      <div className="text-[8px] text-muted-foreground">{hint}</div>
    </div>
  );
}

function FakeChart() {
  return (
    <svg viewBox="0 0 200 80" className="w-full h-16">
      <defs>
        <linearGradient id="adpG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--brand-blue)" stopOpacity="0.35"/>
          <stop offset="100%" stopColor="var(--brand-blue)" stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d="M0 60 C 20 55, 35 50, 50 45 S 90 20, 110 15 S 150 45, 170 40 S 195 30, 200 32 L 200 80 L 0 80 Z" fill="url(#adpG)"/>
      <path d="M0 60 C 20 55, 35 50, 50 45 S 90 20, 110 15 S 150 45, 170 40 S 195 30, 200 32" fill="none" stroke="var(--brand-blue)" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

function FakeDialog() {
  return (
    <div className="adp-dialog absolute inset-0 grid place-items-center pointer-events-none">
      <div className="adp-dialog-panel w-[64%] rounded-2xl bg-white border border-border shadow-2xl p-4">
        <div className="mb-3">
          <div className="font-display text-sm font-extrabold">Nouvelle deadline</div>
        </div>
        <div className="space-y-2.5">
          <Field label="Titre">
            <span className="adp-type" data-text="Renouvellement domaine acme.com" />
            <span className="adp-caret" />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Date & heure">
              <span className="adp-type adp-type-2" data-text="15/10/2026 09:00" />
              <span className="adp-caret adp-caret-2" />
            </Field>
            <Field label="Catégorie">
              <span className="text-[10px] text-muted-foreground">Domaine</span>
            </Field>
          </div>
          <div>
            <div className="text-[9px] font-medium text-muted-foreground mb-1">Rappels</div>
            <div className="flex gap-1.5 flex-wrap">
              {[
                { l: "30 jours", cls: "adp-pill-1" },
                { l: "14 jours", cls: "adp-pill-2" },
                { l: "7 jours", cls: "adp-pill-3" },
                { l: "24h", cls: "" },
              ].map((p) => (
                <span key={p.l} className={`adp-pill ${p.cls} px-2 h-5 grid place-items-center rounded-full text-[9px] font-semibold border`}>{p.l}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <span className="px-3 h-7 grid place-items-center rounded-full text-[10px] font-medium border border-border">Annuler</span>
          <span id="adp-create-btn" className="adp-create-btn px-3 h-7 grid place-items-center rounded-full text-[10px] font-semibold bg-ink text-cream">
            <span className="flex items-center gap-1"><ClipboardCheck className="h-3 w-3"/>Créer la deadline</span>
          </span>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[9px] font-medium text-muted-foreground mb-1">{label}</div>
      <div className="relative h-7 rounded-lg border border-border bg-white px-2 flex items-center text-[10px]">
        {children}
      </div>
    </div>
  );
}

function Cursor() {
  return (
    <div className="adp-cursor absolute pointer-events-none z-30 -translate-x-1 -translate-y-1">
      <MousePointer2 className="h-4 w-4 fill-ink text-ink drop-shadow" />
    </div>
  );
}
