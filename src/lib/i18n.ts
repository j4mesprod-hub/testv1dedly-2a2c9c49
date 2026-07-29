import { useProfile } from "@/hooks/use-profile";

export type Lang = "fr" | "en";

type Dict = Record<string, { fr: string; en: string }>;

export const dict = {
  "nav.overview": { fr: "Vue d'ensemble", en: "Overview" },
  "nav.calendar": { fr: "Calendrier", en: "Calendar" },
  "nav.deadlines": { fr: "Deadlines", en: "Deadlines" },
  "nav.stats": { fr: "Statistiques", en: "Statistics" },
  "nav.settings": { fr: "Paramètres", en: "Settings" },
  "nav.new": { fr: "Nouvelle", en: "New" },
  "nav.newDeadline": { fr: "Nouvelle deadline", en: "New deadline" },
  "common.search": { fr: "Rechercher…", en: "Search…" },
  "common.upgrade": { fr: "Upgrade", en: "Upgrade" },
  "common.signOut": { fr: "Se déconnecter", en: "Sign out" },
  "common.user": { fr: "Utilisateur", en: "User" },
  "common.save": { fr: "Enregistrer", en: "Save" },
  "common.saving": { fr: "Enregistrement…", en: "Saving…" },
  "common.sending": { fr: "Envoi…", en: "Sending…" },
  "overview.hello": { fr: "Bonjour", en: "Hello" },
  "overview.subtitle": { fr: "Voici un aperçu de vos deadlines.", en: "Here's an overview of your deadlines." },
  "overview.summaryBtn": { fr: "Recevoir le résumé", en: "Get my summary" },
  "overview.kpi.upcoming": { fr: "À venir", en: "Upcoming" },
  "overview.kpi.inProgress": { fr: "En cours", en: "In progress" },
  "overview.kpi.completed": { fr: "Respectées", en: "Completed" },
  "overview.kpi.overdue": { fr: "En retard", en: "Overdue" },
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
  "settings.title": { fr: "Paramètres", en: "Settings" },
  "settings.subtitle": {
    fr: "Gérez votre compte, vos rappels et votre abonnement.",
    en: "Manage your account, reminders and subscription.",
  },
  "settings.tab.profile": { fr: "Profil", en: "Profile" },
  "settings.tab.notifications": { fr: "Notifications", en: "Notifications" },
  "settings.tab.integrations": { fr: "Intégrations", en: "Integrations" },
  "settings.tab.billing": { fr: "Abonnement", en: "Subscription" },
  "settings.language": { fr: "Langue", en: "Language" },
  "settings.lang.fr": { fr: "Français", en: "French" },
  "settings.lang.en": { fr: "Anglais", en: "English" },
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
} satisfies Dict;

export type TKey = keyof typeof dict;

export function translate(key: TKey, lang: Lang): string {
  return dict[key][lang] ?? dict[key].fr;
}

export function useLang(): Lang {
  const { data: profile } = useProfile();
  return profile?.language === "en" ? "en" : "fr";
}

export function useT() {
  const lang = useLang();
  return { lang, t: (key: TKey) => translate(key, lang) };
}
