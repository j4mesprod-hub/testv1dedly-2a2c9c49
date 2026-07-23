# Mode test / dryRun depuis l'UI

## Objectif

Ajouter un panneau "Tester l'envoi des rappels" dans **Paramètres → Notifications** qui déclenche l'endpoint `/api/public/hooks/reminders` sur une adresse de test, sans jamais écrire dans `alerts_sent`.

L'endpoint accepte déjà `dryRunTo`, `forceUserId`, `overrideHour`. On garde la logique de matching (`alert_rules` + `alert_hour`) intacte — seule la persistance de la déduplication est court-circuitée en mode dryRun.

## Changements

### 1. Endpoint `src/routes/api/public/hooks/reminders.ts`

- Ajouter un flag `dryRun: boolean` au body accepté.
- Considérer `dryRun` comme vrai dès que `dryRunTo` est fourni (rétro-compat) OU que `dryRun: true` est explicite.
- Lorsque `dryRun` est vrai : envoyer l'email via Brevo comme aujourd'hui mais **ne pas** mettre à jour `alerts_sent`, et **ignorer** le filtre "déjà envoyé" pour que l'utilisateur voie toujours son test partir. Les autres filtres (`alert_rules`, `alert_hour`, `has_active_sub`) restent appliqués tels quels.
- Ajouter un second mode `forceSend: true` (utilisé par l'UI) qui bypasse aussi les vérifications `alert_rules` / `alert_hour` pour envoyer un email d'exemple à partir d'un rappel choisi, toujours sans écrire `alerts_sent`. Utile pour "je veux voir à quoi ressemble l'email tout de suite".
- Accepter `deadlineId?: string` pour cibler un rappel précis (sinon comportement actuel).
- Le retour JSON contient `dryRun: true` et le détail des envois pour affichage.

### 2. Server function `src/lib/email.functions.ts`

Ajouter une nouvelle server function authentifiée `triggerReminderDryRun`, protégée par `requireSupabaseAuth` :

- Entrée : `{ testEmail: string; deadlineId?: string; overrideHour?: number; forceSend?: boolean }`
- Lit `CRON_SECRET` côté serveur et appelle en interne `processReminders` (extrait dans un module partagé `reminders.server.ts`) — plus simple et plus sûr qu'un fetch HTTP self-signé.
- Force `forceUserId = context.userId` : un utilisateur ne peut tester que **ses propres** rappels.
- Retourne `{ sent, details }` pour affichage.

Refacto associé : déplacer `processReminders` + helpers Brevo/temps depuis `reminders.ts` vers `src/lib/reminders.server.ts`. Le route handler devient un simple wrapper qui appelle `processReminders`. Aucun changement de comportement pour le cron.

### 3. UI `src/routes/_authenticated/dashboard.settings.tsx` (onglet Notifications)

Nouvelle carte "Tester l'envoi des rappels" :

```text
┌───────────────────────────────────────────────┐
│ Tester l'envoi des rappels                    │
│ Envoie un email de test sans marquer les      │
│ rappels comme "déjà envoyés".                 │
│                                               │
│ Adresse de test : [ email@…              ]    │
│ Rappel à simuler : [ Sélecteur (optionnel) ▾] │
│ Heure simulée   : [ 09 ▾ ]  (0-23, Paris)     │
│ [x] Forcer l'envoi même si non éligible       │
│                                               │
│ [ Envoyer un test ]                           │
│                                               │
│ ✓ 2 email(s) envoyé(s) à test@…               │
└───────────────────────────────────────────────┘
```

Comportement :

- Champ email pré-rempli avec `reminder_email` du profil, éditable.
- Sélecteur de rappel : liste les `deadlines` non complétés de l'utilisateur ; option "Tous mes rappels".
- Sélecteur d'heure : 0-23, pré-rempli avec l'heure actuelle Paris.
- Case à cocher "forcer l'envoi" : passe `forceSend: true` (envoie un exemple même si aucun `alert_rules` ne matche l'heure).
- Bouton appelle `triggerReminderDryRun` (via `useServerFn`), affiche un toast avec le nombre d'emails envoyés et l'adresse, ou l'erreur Brevo brute en cas d'échec.
- Aucune écriture en base : `alerts_sent` reste inchangé, un vrai déclenchement horaire enverra toujours l'email comme prévu.

### 4. Non-changements

- Le cron horaire (`cron-job.org`) continue d'appeler l'endpoint sans `dryRun` → comportement normal + dedup.
- Schéma DB inchangé.
- `CRON_SECRET` reste requis pour le POST public ; la server function ne l'expose pas au client.

## Détails techniques

- Le refacto dans `reminders.server.ts` conserve les mêmes noms d'options : `overrideHour`, `forceUserId`, `dryRunTo`, plus les nouveaux `dryRun`, `forceSend`, `deadlineId`.
- Ordre des filtres dans `processReminders` :
  1. `has_active_sub` (toujours)
  2. Sélection des deadlines de l'utilisateur (filtrée par `deadlineId` si fourni)
  3. Si `forceSend === false` : `daysAway ∈ alert_rules` ET `currentHour === alert_hour`
  4. Si `dryRun === false` : `combo ∉ alerts_sent`
  5. Envoi Brevo (destinataire = `dryRunTo ?? profile.reminder_email`)
  6. Si `dryRun === false` : `alerts_sent = [...alerts_sent, combo]`
- L'UI n'accède **jamais** à `CRON_SECRET` — elle passe uniquement par la server function authentifiée.
