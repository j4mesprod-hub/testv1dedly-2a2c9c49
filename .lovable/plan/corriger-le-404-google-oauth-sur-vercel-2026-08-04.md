# Corriger le 404 Google OAuth sur Vercel

## Ce qui se passe

Le bouton « Continuer avec Google » utilise le connecteur social managé de Lovable (`lovable.auth.signInWithOAuth`). Ce flux passe par des chemins `/~oauth/initiate` et `/~oauth/callback` qui n'existent que sur l'hébergement Lovable (`*.lovable.app` et domaines personnalisés branchés sur Lovable). Sur Vercel, ces chemins ne sont servis par personne → **404 au chargement de l'OAuth**.

Donc : ça marche en preview Lovable, ça casse sur Vercel. Ce n'est pas un bug de code, c'est une dépendance d'hébergement.

## La solution

Basculer le bouton Google vers l'OAuth **direct Supabase** (`supabase.auth.signInWithOAuth`), qui fonctionne sur n'importe quel domaine, y compris Vercel. Cela nécessite un Client ID / Client Secret Google qui t'appartient, à renseigner côté projet.

Pour ne rien casser en preview, le bouton détectera l'hôte :
- sur `*.lovable.app` → flux managé actuel (inchangé)
- ailleurs (Vercel, domaine perso) → `supabase.auth.signInWithOAuth("google", { redirectTo: origin + "/auth/callback" })`

Rien d'autre ne change : aucun changement d'UI, de design, de dashboard, de Stripe, de base de données.

## Ce que je fais

1. Modifier uniquement `src/routes/auth.tsx` : ajout de la branche OAuth directe Supabase selon l'hôte, gestion d'erreur identique.
2. Ajuster `src/routes/auth.callback.tsx` pour laisser le client Supabase consommer le code/hash de retour avant de rediriger (attente de session au lieu d'un simple polling).
3. Ajouter le domaine Vercel à la liste des URLs de redirection autorisées côté auth du backend, et vérifier le Site URL.

## Ce que tu dois remplir toi-même (indispensable)

Je n'ai pas accès à ton compte Google ni à ton compte Vercel :

1. **Google Cloud Console** → APIs & Services → Credentials → *Create OAuth client ID* → type « Web application ».
   - Authorized JavaScript origins : `https://TON-APP.vercel.app`
   - Authorized redirect URI : `https://<projet-backend>.supabase.co/auth/v1/callback` (je te donne l'URL exacte quand on lance l'implémentation)
2. Me communiquer le **Client ID** et le **Client Secret** → je les enregistre comme secrets et configure le fournisseur Google du backend.
3. Me donner l'**URL exacte de ton app Vercel** (et le domaine perso si tu en as un) pour l'allow-list de redirection.
4. Sur Vercel : vérifier que les variables `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID` sont bien définies dans les Environment Variables du projet (sinon l'app ne parle pas au backend).

## Alternative sans rien remplir

Brancher ton domaine personnalisé sur l'hébergement Lovable plutôt que Vercel : le flux managé continue de fonctionner tel quel, zéro configuration Google. À dire si tu préfères cette voie.

## Détails techniques

- Détection d'hôte via `window.location.hostname.endsWith(".lovable.app")`.
- Flux direct : PKCE géré par `@supabase/supabase-js`, `detectSessionInUrl` déjà actif dans le client généré.
- `/auth/callback` reste une route publique ; aucun middleware serveur ajouté.
- Aucune migration SQL, aucune Edge Function touchée.
