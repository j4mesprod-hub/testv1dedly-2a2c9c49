import { useEffect, useState } from "react";
import { fr as frLocale, enUS } from "date-fns/locale";
import { useProfile } from "@/hooks/use-profile";

export type Lang = "fr" | "en";

type Entry = { fr: string; en: string };
type Dict = Record<string, Entry>;

const LANG_KEY = "deadly-lang";

export const dict = {
  /* ---------------- nav / common ---------------- */
  "nav.overview": { fr: "Vue d'ensemble", en: "Overview" },
  "nav.calendar": { fr: "Calendrier", en: "Calendar" },
  "nav.deadlines": { fr: "Deadlines", en: "Deadlines" },
  "nav.stats": { fr: "Statistiques", en: "Statistics" },
  "nav.settings": { fr: "Paramètres", en: "Settings" },
  "nav.new": { fr: "Nouvelle", en: "New" },
  "nav.newDeadline": { fr: "Nouvelle deadline", en: "New deadline" },
  "nav.short.home": { fr: "Accueil", en: "Home" },
  "nav.short.assets": { fr: "Actifs", en: "Assets" },
  "nav.short.agenda": { fr: "Agenda", en: "Agenda" },
  "nav.short.stats": { fr: "Stats", en: "Stats" },
  "nav.short.settings": { fr: "Réglages", en: "Settings" },
  "common.search": { fr: "Rechercher…", en: "Search…" },
  "common.upgrade": { fr: "Upgrade", en: "Upgrade" },
  "common.signOut": { fr: "Se déconnecter", en: "Sign out" },
  "common.user": { fr: "Utilisateur", en: "User" },
  "common.save": { fr: "Enregistrer", en: "Save" },
  "common.saving": { fr: "Enregistrement…", en: "Saving…" },
  "common.sending": { fr: "Envoi…", en: "Sending…" },
  "common.loading": { fr: "Chargement…", en: "Loading…" },
  "common.seeAll": { fr: "Tout voir", en: "See all" },
  "common.error": { fr: "Erreur", en: "Error" },
  "common.sendFailed": { fr: "Envoi impossible", en: "Could not send" },
  "common.today": { fr: "Aujourd'hui", en: "Today" },
  "common.days": { fr: "jours", en: "days" },
  "common.deadline": { fr: "Deadline", en: "Deadline" },
  "common.link": { fr: "Lier", en: "Link" },
  "common.notifications": { fr: "Notifications", en: "Notifications" },

  /* ---------------- overview ---------------- */
  "overview.hello": { fr: "Bonjour", en: "Hello" },
  "overview.subtitle": {
    fr: "Voici un aperçu de vos deadlines.",
    en: "Here's an overview of your deadlines.",
  },
  "overview.summaryBtn": { fr: "Recevoir le résumé", en: "Get my summary" },
  "overview.allUnderControl": { fr: "tout est sous contrôle.", en: "everything is under control." },
  "overview.needsAttention": {
    fr: "quelques échéances demandent votre attention.",
    en: "a few deadlines need your attention.",
  },
  "overview.kpi.upcoming": { fr: "À venir", en: "Upcoming" },
  "overview.kpi.inProgress": { fr: "En cours", en: "In progress" },
  "overview.kpi.completed": { fr: "Respectées", en: "Completed" },
  "overview.kpi.overdue": { fr: "En retard", en: "Overdue" },
  "overview.kpi.healthy": { fr: "Tout va bien", en: "All good" },
  "overview.kpi.expired": { fr: "Expirés", en: "Expired" },
  "overview.kpi.healthyText": { fr: "Échéances à plus de 7 jours", en: "Deadlines more than 7 days out" },
  "overview.kpi.upcomingText": { fr: "À traiter prochainement", en: "Coming up soon" },
  "overview.kpi.expiredText": { fr: "Action immédiate requise", en: "Immediate action required" },
  "overview.nextDeadlines": { fr: "Prochaines échéances", en: "Upcoming deadlines" },
  "overview.latest": { fr: "Dernières deadlines", en: "Latest deadlines" },
  "overview.latestSub": { fr: "Vos échéances les plus proches", en: "Your closest deadlines" },
  "overview.progress": { fr: "Progression", en: "Progress" },
  "overview.progressSub": { fr: "Deadlines respectées", en: "Deadlines completed" },
  "overview.completedShort": { fr: "respectées", en: "completed" },
  "overview.activity": { fr: "Activité de la semaine", en: "This week's activity" },
  "overview.activitySub": { fr: "Deadlines respectées par jour", en: "Deadlines completed per day" },
  "overview.priority": { fr: "À traiter en priorité", en: "Top priorities" },
  "overview.allGood": { fr: "Tout est à jour ✨", en: "Everything is up to date ✨" },
  "overview.welcome": { fr: "Bienvenue sur Deadly", en: "Welcome to Deadly" },
  "overview.emptyText": {
    fr: "Votre dashboard est vierge. Créez votre première deadline pour commencer — Deadly s'occupe des rappels.",
    en: "Your dashboard is empty. Create your first deadline to get started — Deadly handles the reminders.",
  },
  "overview.firstDeadline": { fr: "Créer ma première deadline", en: "Create my first deadline" },
  "overview.telegramLinkText": {
    fr: "Liez votre compte pour recevoir vos échéances chaque matin.",
    en: "Link your account to get your deadlines every morning.",
  },
  "overview.summaryEnabled": { fr: "Résumé quotidien activé", en: "Daily summary enabled" },
  "overview.summaryDisabled": { fr: "Résumé quotidien désactivé", en: "Daily summary disabled" },

  /* ---------------- deadlines list ---------------- */
  "tasks.title": { fr: "Deadlines", en: "Deadlines" },
  "tasks.subtitle": {
    fr: "Gérez et faites évoluer le statut de vos échéances.",
    en: "Manage and update the status of your deadlines.",
  },
  "tasks.all": { fr: "Toutes", en: "All" },
  "tasks.searchLabel": { fr: "Recherche", en: "Search" },
  "tasks.noResult": { fr: "Aucun résultat pour", en: "No result for" },
  "tasks.emptyCategory": {
    fr: "Aucune deadline dans cette catégorie.",
    en: "No deadline in this category.",
  },
  "status.upcoming": { fr: "À venir", en: "Upcoming" },
  "status.in_progress": { fr: "En cours", en: "In progress" },
  "status.completed": { fr: "Respectée", en: "Completed" },
  "status.overdue": { fr: "En retard", en: "Overdue" },

  /* ---------------- calendar ---------------- */
  "calendar.title": { fr: "Calendrier", en: "Calendar" },
  "calendar.subtitle": { fr: "Vos deadlines dans le temps.", en: "Your deadlines over time." },

  /* ---------------- stats ---------------- */
  "stats.title": { fr: "Statistiques", en: "Statistics" },
  "stats.subtitle": { fr: "Votre performance en un coup d'œil.", en: "Your performance at a glance." },
  "stats.rate": { fr: "Taux de réussite", en: "Success rate" },
  "stats.total": { fr: "Deadlines totales", en: "Total deadlines" },
  "stats.completed": { fr: "Respectées", en: "Completed" },
  "stats.missed": { fr: "Manquées", en: "Missed" },
  "stats.history": { fr: "Historique 6 mois", en: "Last 6 months" },
  "stats.historySub": { fr: "Respectées vs manquées", en: "Completed vs missed" },
  "stats.breakdown": { fr: "Répartition par statut", en: "Breakdown by status" },
  "stats.breakdownSub": { fr: "Vue d'ensemble de vos deadlines", en: "Overview of your deadlines" },

  /* ---------------- new deadline dialog ---------------- */
  "dialog.title": { fr: "Nouvelle deadline", en: "New deadline" },
  "dialog.desc": {
    fr: "Créez une deadline avec une date, une priorité et des rappels.",
    en: "Create a deadline with a date, a priority and reminders.",
  },
  "dialog.name": { fr: "Titre", en: "Title" },
  "dialog.namePlaceholder": {
    fr: "Renouvellement du domaine acme.com",
    en: "Renew the acme.com domain",
  },
  "dialog.date": { fr: "Date", en: "Date" },
  "dialog.priority": { fr: "Priorité", en: "Priority" },
  "dialog.priority.low": { fr: "Basse", en: "Low" },
  "dialog.priority.medium": { fr: "Moyenne", en: "Medium" },
  "dialog.priority.high": { fr: "Haute", en: "High" },
  "dialog.reminders": { fr: "Rappels", en: "Reminders" },
  "dialog.preset.30": { fr: "30 jours", en: "30 days" },
  "dialog.preset.14": { fr: "14 jours", en: "14 days" },
  "dialog.preset.7": { fr: "7 jours", en: "7 days" },
  "dialog.preset.1": { fr: "24h", en: "24h" },
  "dialog.preset.0": { fr: "Le jour J", en: "On the day" },
  "dialog.cancel": { fr: "Annuler", en: "Cancel" },
  "dialog.create": { fr: "Créer la deadline", en: "Create deadline" },
  "dialog.creating": { fr: "Création…", en: "Creating…" },
  "dialog.required": { fr: "Titre et date requis", en: "Title and date are required" },
  "dialog.created": { fr: "Deadline créée", en: "Deadline created" },

  /* ---------------- settings ---------------- */
  "settings.title": { fr: "Paramètres", en: "Settings" },
  "settings.subtitle": {
    fr: "Gérez votre compte, vos rappels et votre abonnement.",
    en: "Manage your account, reminders and subscription.",
  },
  "settings.tab.profile": { fr: "Profil", en: "Profile" },
  "settings.tab.notifications": { fr: "Notifications", en: "Notifications" },
  "settings.tab.integrations": { fr: "Intégrations", en: "Integrations" },
  "settings.tab.billing": { fr: "Abonnement", en: "Subscription" },
  "settings.personal": { fr: "Informations personnelles", en: "Personal information" },
  "settings.personalSub": { fr: "Personnalisez votre profil.", en: "Customise your profile." },
  "settings.avatarUrl": { fr: "URL avatar", en: "Avatar URL" },
  "settings.displayName": { fr: "Nom d'affichage", en: "Display name" },
  "settings.loginEmail": { fr: "Email de connexion", en: "Login email" },
  "settings.language": { fr: "Langue / Language", en: "Language / Langue" },
  "settings.timezone": { fr: "Fuseau horaire", en: "Time zone" },
  "settings.profileSaved": { fr: "Profil mis à jour", en: "Profile updated" },
  "settings.deleteHint": {
    fr: "La suppression de votre compte efface définitivement vos deadlines et vos réglages.",
    en: "Deleting your account permanently erases your deadlines and settings.",
  },
  "settings.deleteAccount": { fr: "Supprimer mon compte", en: "Delete my account" },
  "settings.deleting": { fr: "Suppression…", en: "Deleting…" },
  "settings.deleteConfirm": {
    fr: "Supprimer définitivement votre compte et toutes vos deadlines ?",
    en: "Permanently delete your account and all your deadlines?",
  },
  "settings.deleteFailed": { fr: "Suppression impossible", en: "Deletion failed" },

  "tg.title": { fr: "Rappels via Telegram", en: "Telegram reminders" },
  "tg.desc": {
    fr: "Deadly vous envoie vos rappels directement dans Telegram.",
    en: "Deadly sends your reminders straight to Telegram.",
  },
  "tg.linked": { fr: "Compte Telegram lié", en: "Telegram account linked" },
  "tg.chatId": { fr: "Chat ID", en: "Chat ID" },
  "tg.sendTest": { fr: "Envoyer un message test", en: "Send a test message" },
  "tg.testSent": { fr: "Message Telegram envoyé", en: "Telegram message sent" },
  "tg.unlink": { fr: "Délier", en: "Unlink" },
  "tg.unlinked": { fr: "Compte Telegram délié", en: "Telegram account unlinked" },
  "tg.step1a": { fr: "Ouvrez Telegram, cherchez", en: "Open Telegram and search for" },
  "tg.botFallback": { fr: "le bot Deadly", en: "the Deadly bot" },
  "tg.step2a": { fr: "Cliquez sur", en: "Tap" },
  "tg.start": { fr: "Démarrer", en: "Start" },
  "tg.step2b": { fr: "(ou envoyez", en: "(or send" },
  "tg.step3": {
    fr: "Copiez le code que le bot vous renvoie et collez-le ci-dessous.",
    en: "Copy the code the bot sends you and paste it below.",
  },
  "tg.codeLabel": { fr: "Code de liaison", en: "Linking code" },
  "tg.linkBtn": { fr: "Lier mon compte", en: "Link my account" },
  "tg.linking": { fr: "Liaison…", en: "Linking…" },
  "tg.linkSuccess": { fr: "Compte Telegram lié 🎉", en: "Telegram account linked 🎉" },
  "tg.linkFailed": { fr: "Liaison impossible", en: "Linking failed" },
  "tg.codeMissing": { fr: "Collez le code reçu dans Telegram", en: "Paste the code you got in Telegram" },
  "tg.footnote": {
    fr: "Les horaires de rappel (J-30, J-7, J-1…) se choisissent au moment de la création de chaque deadline.",
    en: "Reminder offsets (D-30, D-7, D-1…) are chosen when you create each deadline.",
  },

  "summary.title": { fr: "Résumé quotidien", en: "Daily summary" },
  "summary.desc": {
    fr: "Choisissez l'heure à laquelle Deadly vous envoie votre résumé du jour sur Telegram.",
    en: "Choose when Deadly sends your daily summary on Telegram.",
  },
  "summary.enabled": { fr: "Activer le résumé quotidien", en: "Enable the daily summary" },
  "summary.hour": { fr: "Heure", en: "Hour" },
  "summary.minute": { fr: "Minutes", en: "Minutes" },
  "summary.sendNow": { fr: "Recevoir maintenant", en: "Send now" },
  "summary.sent": { fr: "Résumé envoyé sur Telegram", en: "Summary sent on Telegram" },
  "summary.saved": { fr: "Heure du résumé enregistrée", en: "Summary time saved" },
  "summary.scheduledAt": { fr: "Envoi prévu à", en: "Scheduled for" },
  "summary.sentDaily": { fr: "Envoyé chaque jour à", en: "Sent every day at" },

  "integrations.soon": { fr: "Bientôt", en: "Soon" },
  "integrations.soonText": {
    fr: "Les intégrations arrivent prochainement pour tous les abonnés Pro.",
    en: "Integrations are coming soon for all Pro subscribers.",
  },
  "integrations.comingSoon": { fr: "À venir", en: "Coming soon" },
  "integrations.gcal": { fr: "Synchronisez vos échéances", en: "Sync your deadlines" },
  "integrations.slack": { fr: "Alertes dans vos canaux", en: "Alerts in your channels" },
  "integrations.notion": { fr: "Importez vos bases", en: "Import your databases" },
  "integrations.github": { fr: "Suivez vos issues et PR", en: "Track your issues and PRs" },
  "integrations.outlook": { fr: "Synchronisez vos réunions", en: "Sync your meetings" },
  "integrations.zapier": { fr: "Connectez 5000+ apps", en: "Connect 5000+ apps" },

  /* ---------------- billing ---------------- */
  "billing.yourPlan": { fr: "Votre plan", en: "Your plan" },
  "billing.free": { fr: "Gratuit", en: "Free" },
  "billing.perMonth": { fr: "/ mois", en: "/ month" },
  "billing.current": { fr: "Plan actuel", en: "Current plan" },
  "billing.downgrade": { fr: "Rétrograder", en: "Downgrade" },
  "billing.recommended": { fr: "Recommandé", en: "Recommended" },
  "billing.active": { fr: "Abonnement actif", en: "Subscription active" },
  "billing.redirecting": { fr: "Redirection…", en: "Redirecting…" },
  "billing.goPro": { fr: "Passer au Pro — 9 €/mois", en: "Go Pro — €9/month" },
  "billing.welcomePro": { fr: "Bienvenue chez Pro 🎉", en: "Welcome to Pro 🎉" },
  "billing.syncError": { fr: "Sync abonnement", en: "Subscription sync" },
  "billing.cancelled": { fr: "Paiement annulé", en: "Payment cancelled" },
  "billing.checkoutError": { fr: "Impossible d'ouvrir le paiement", en: "Could not open checkout" },
  "billing.free.1": { fr: "5 deadlines par mois", en: "5 deadlines per month" },
  "billing.free.2": { fr: "1 rappel par deadline", en: "1 reminder per deadline" },
  "billing.free.3": { fr: "Tableau de bord personnel", en: "Personal dashboard" },
  "billing.pro.1": { fr: "Deadlines illimitées", en: "Unlimited deadlines" },
  "billing.pro.2": { fr: "Dates d'alerte personnalisables", en: "Custom alert dates" },
  "billing.pro.3": { fr: "Profil entièrement personnalisable", en: "Fully customisable profile" },
  "billing.pro.4": { fr: "Accès aux intégrations (à venir)", en: "Access to integrations (soon)" },

  /* ---------------- notifications bell ---------------- */
  "bell.title": { fr: "Notifications", en: "Notifications" },
  "bell.unread": { fr: "non lue", en: "unread" },
  "bell.unreadPlural": { fr: "non lues", en: "unread" },
  "bell.empty": { fr: "Aucune notification pour l'instant.", en: "No notifications yet." },

  /* ---------------- landing ---------------- */
  "landing.nav.product": { fr: "Produit", en: "Product" },
  "landing.nav.features": { fr: "Fonctionnalités", en: "Features" },
  "landing.nav.pricing": { fr: "Tarif", en: "Pricing" },
  "landing.nav.login": { fr: "Connexion", en: "Log in" },
  "landing.nav.try": { fr: "Essayer gratuitement", en: "Try for free" },
  "landing.badge": { fr: "Vos échéances, enfin sous contrôle", en: "Your deadlines, finally under control" },
  "landing.h1a": { fr: "Renouvelez à temps.", en: "Renew on time." },
  "landing.h1b": { fr: "À chaque fois.", en: "Every single time." },
  "landing.lead": {
    fr: "Deadly centralise les échéances de tous vos clients et prévient votre équipe avant qu'un domaine, un SSL ou un hébergement n'expire.",
    en: "Deadly centralises every client deadline and warns your team before a domain, SSL or hosting plan expires.",
  },
  "landing.ctaStart": { fr: "Commencer maintenant", en: "Get started" },
  "landing.ctaDiscover": { fr: "Découvrir le produit", en: "See the product" },
  "landing.setup": { fr: "Installation en 5 minutes · Sans engagement", en: "5-minute setup · No commitment" },
  "landing.simple": { fr: "Simple par conception", en: "Simple by design" },
  "landing.h2a": { fr: "Moins de surveillance.", en: "Less monitoring." },
  "landing.h2b": { fr: "Plus de sérénité.", en: "More peace of mind." },
  "landing.f1.t": { fr: "Tout est au même endroit", en: "Everything in one place" },
  "landing.f1.d": {
    fr: "Domaines, SSL, hébergements et licences sont rangés par client, sans tableur à maintenir.",
    en: "Domains, SSL, hosting and licences sorted by client — no spreadsheet to maintain.",
  },
  "landing.f2.t": { fr: "Les bonnes alertes, au bon moment", en: "The right alerts, at the right time" },
  "landing.f2.d": {
    fr: "Deadly relance votre équipe à J-30, J-14, J-7 et J-1 sur Telegram.",
    en: "Deadly pings your team at D-30, D-14, D-7 and D-1 on Telegram.",
  },
  "landing.f3.t": { fr: "Une routine qui tourne seule", en: "A routine that runs itself" },
  "landing.f3.d": {
    fr: "Après chaque renouvellement, la prochaine échéance est automatiquement programmée.",
    en: "After each renewal, the next deadline is scheduled automatically.",
  },
  "landing.cta.kicker": {
    fr: "Une équipe prévenue est une équipe sereine",
    en: "A team that knows is a team at ease",
  },
  "landing.cta.h2": {
    fr: "L'oubli ne fait plus partie du workflow.",
    en: "Forgetting is no longer part of the workflow.",
  },
  "landing.cta.text": {
    fr: "Chaque personne sait quoi renouveler, pour quel client et avant quelle date. Deadly fait le suivi, votre équipe fait son travail.",
    en: "Everyone knows what to renew, for which client and by when. Deadly tracks it, your team gets on with the work.",
  },
  "landing.cta.proof": {
    fr: "46 renouvellements sur 46 réalisés à temps",
    en: "46 out of 46 renewals completed on time",
  },
  "landing.price.kicker": { fr: "Un prix simple", en: "Simple pricing" },
  "landing.price.h2": { fr: "Commencez gratuitement.", en: "Start for free." },
  "landing.price.freeSub": { fr: "Pour découvrir Deadly.", en: "To discover Deadly." },
  "landing.price.proSub": {
    fr: "Tout ce qu'il faut pour ne rien manquer.",
    en: "Everything you need to never miss a thing.",
  },
  "landing.price.freeCta": { fr: "Commencer gratuitement", en: "Start for free" },
  "landing.price.proCta": { fr: "Passer au Pro", en: "Go Pro" },
  "landing.footer.privacy": { fr: "Confidentialité", en: "Privacy" },
  "landing.footer.terms": { fr: "Conditions", en: "Terms" },
  "landing.footer.contact": { fr: "Contact", en: "Contact" },

  /* ---------------- auth ---------------- */
  "auth.welcome": { fr: "Bienvenue", en: "Welcome" },
  "auth.sub": {
    fr: "Connectez-vous ou créez votre compte en un clic.",
    en: "Sign in or create your account in one click.",
  },
  "auth.google": { fr: "Continuer avec Google", en: "Continue with Google" },
  "auth.legal": {
    fr: "En continuant, vous acceptez nos conditions d'utilisation et notre politique de confidentialité.",
    en: "By continuing, you agree to our terms of use and privacy policy.",
  },
  "auth.back": { fr: "← Retour à l'accueil", en: "← Back to home" },
  "auth.failed": { fr: "Impossible de se connecter", en: "Could not sign in" },
  "auth.sideText": {
    fr: "Deadly centralise les échéances de tous vos clients et prévient votre équipe avant qu'une seule ne soit oubliée.",
    en: "Deadly centralises every client deadline and warns your team before a single one slips.",
  },
} satisfies Dict;

export type TKey = keyof typeof dict;

export function translate(key: TKey, lang: Lang): string {
  return dict[key][lang] ?? dict[key].fr;
}

function storedLang(): Lang | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(LANG_KEY);
  return v === "en" || v === "fr" ? v : null;
}

/**
 * Langue courante : profil connecté en priorité, sinon dernière langue connue
 * (persistée) pour que les pages publiques restent cohérentes.
 */
export function useLang(): Lang {
  const { data: profile } = useProfile();
  const [fallback, setFallback] = useState<Lang>("fr");
  const profileLang: Lang | null =
    profile?.language === "en" ? "en" : profile?.language === "fr" ? "fr" : null;

  // Lu après hydratation pour éviter tout mismatch SSR.
  useEffect(() => {
    const s = storedLang();
    if (s) setFallback(s);
  }, []);

  useEffect(() => {
    if (profileLang && typeof window !== "undefined") {
      window.localStorage.setItem(LANG_KEY, profileLang);
    }
  }, [profileLang]);

  return profileLang ?? fallback;
}


export function useT() {
  const lang = useLang();
  return {
    lang,
    t: (key: TKey) => translate(key, lang),
    dateLocale: lang === "en" ? enUS : frLocale,
  };
}

export function useDateLocale() {
  return useT().dateLocale;
}
