# Dedly

Je configure ce projet (Deadly, SaaS de suivi d'échéances domaines/hébergement/SSL) de zéro. Utilise uniquement le Cloud natif Lovable pour tout ce qui suit — n'importe ni ne configure de client Supabase séparé/manuel en parallèle, ni de logique d'authentification personnalisée qui contournerait le système natif. Utilise les fonctions et intégrations natives de Lovable Cloud pour l'auth, la base de données et les Edge Functions. Fais les 3 points suivants d'un coup, sans étapes intermédiaires ni confirmations :

1) Authentification Google (OAuth)
Active le fournisseur Google via le système d'authentification natif de Lovable Cloud (pas de configuration manuelle parallèle).Vérifie que l'URI de redirection utilisée correspond bien à celle générée par le Cloud natif Lovable, pas une URL Supabase manuelle. y'a déja la page de connexion google tu n'as plus qu'a la faire fonctionner

2) Paiement Stripe
Recrée le flux Stripe Checkout pour l'abonnement Pro à 9€/mois. Sur la page de retour après paiement (success_url), récupère le session_id dans l'URL, vérifie via l'API Stripe (checkout.sessions.retrieve) que la session est bien payée, puis mets hasActiveSub à true pour l'utilisateur correspondant. Utilise le secret STRIPE_SECRET_KEY.

3) Envoi d'email via Brevo — spécifications complètes

Modèle de données à vérifier/créer sur la table reminders :

alertRules : tableau des seuils choisis par l'utilisateur en jours avant l'échéance (ex. [30, 7, 1, 0], où 0 = le jour même de dueDate)

alertHour : l'heure à laquelle l'utilisateur veut recevoir la notification pour ce rappel, au format 24h (ex. 9 pour 9h, 14 pour 14h) — champ à ajouter s'il n'existe pas déjà, avec un sélecteur d'heure dans le formulaire "Ajouter/Éditer un rappel"

alertsSent : tableau des combinaisons déjà envoyées, au format "joursRestants-heure" (ex. ["30-9", "7-14"]) pour éviter les doublons — pas juste le nombre de jours seul, car il faut aussi tenir compte de l'heure choisie

Logique de la fonction (à exécuter toutes les heures, pas une fois par jour) :

Récupérer l'heure actuelle (heure de Paris) et la date du jour

Récupérer tous les reminders dont l'utilisateur associé a hasActiveSub == true

Pour chaque rappel : calculer joursRestants = dueDate - dateDuJour

Vérifier que joursRestants est présent dans alertRules

Vérifier que l'heure actuelle correspond à alertHour de ce rappel

Vérifier que la combinaison "joursRestants-alertHour" n'est PAS déjà présente dans alertsSent

Si les 3 conditions sont réunies : envoyer l'email via Brevo, puis ajouter "joursRestants-alertHour" dans alertsSent

Contenu de l'email : objet = "⚠️ ACTION REQUISE : [titre] expire dans [X] jours (Client: [nom client])", corps = rappel du service concerné, du client, et de la date d'expiration exacte

Envoi via l'API Brevo (https://api.brevo.com/v3/smtp/email, méthode POST, header api-key avec le secret BREVO_API_KEY, champ sender.email avec le secret SENDER_EMAIL qui doit être exactement l'adresse vérifiée dans Brevo)

Protège l'endpoint avec un header Authorization vérifié contre le secret CRON_SECRET.

Teste toi-même l'envoi avec un rappel factice défini pour l'heure actuelle et confirme que l'email arrive bien avant de me répondre.

Changement important côté cron-job.org : comme les utilisateurs choisissent leur propre heure, ton job doit maintenant se déclencher toutes les heures (pas une seule fois par jour à 8h comme prévu avant) — dans la planification cron-job.org, choisis "Every hour" plutôt que "Every day".

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/10c0b03e-5833-4c50-90ad-4680b5c5ae99).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
