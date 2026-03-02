# 🛡️ Protocole de Test de Sécurité — Shark Bot

> **Version** : 1.0.0
> **Date** : 2 mars 2026
> **Basé sur** : Skill `SECURITY-BEST-PRACTICES` + OWASP Top 10
> **Scope** : API Express (bot) + Dashboard Next.js

---

## Table des matières

1. [Prérequis](#1-prérequis)
2. [T1 — Headers de sécurité (Helmet)](#t1--headers-de-sécurité-helmet)
3. [T2 — Redirection HTTPS](#t2--redirection-https)
4. [T3 — Rate Limiting](#t3--rate-limiting)
5. [T4 — Protection CSRF](#t4--protection-csrf)
6. [T5 — Validation des entrées (Zod)](#t5--validation-des-entrées-zod)
7. [T6 — Authentification & Contrôle d'accès](#t6--authentification--contrôle-daccès)
8. [T7 — Gestion des secrets](#t7--gestion-des-secrets)
9. [T8 — Headers de sécurité Dashboard (Next.js)](#t8--headers-de-sécurité-dashboard-nextjs)
10. [T9 — Audit des dépendances](#t9--audit-des-dépendances)
11. [T10 — Checklist OWASP Top 10](#t10--checklist-owasp-top-10)
12. [Grille de résultats](#grille-de-résultats)

---

## 1. Prérequis

### Environnement

```bash
# Lancer le projet en dev (Docker)
pnpm docker:dev

# Ou manuellement
# Terminal 1 : Bot + API
pnpm dev

# Terminal 2 : Dashboard
cd dashboard && pnpm dev
```

### Variables d'environnement requises

Vérifier que `.env` contient au minimum :
```
SESSION_SECRET=<clé aléatoire de 32+ caractères>
DISCORD_CLIENT_ID=<id>
DISCORD_CLIENT_SECRET=<secret>
DISCORD_TOKEN=<token>
```

### Outils nécessaires

| Outil | Usage | Installation |
|-------|-------|-------------|
| **curl** | Tests HTTP manuels | Pré-installé macOS |
| **jq** | Parser les réponses JSON | `brew install jq` |
| **Navigateur DevTools** | Inspecter headers/cookies | Chrome/Firefox |

### Variables de test (à adapter)

```bash
export API=http://localhost:3001
export DASH=http://localhost:3000
export GUILD_ID=<votre_guild_id_de_test>
```

---

## T1 — Headers de sécurité (Helmet)

> **Objectif** : Vérifier que les headers de sécurité sont présents sur toutes les réponses API.
> **Référence OWASP** : A05 Security Misconfiguration

### T1.1 — Présence des headers Helmet

```bash
curl -sI "$API/api/health" | grep -iE "x-content-type|x-frame|strict-transport|x-dns|content-security-policy|x-powered-by"
```

**Résultat attendu** :

| Header | Valeur attendue | Critique |
|--------|----------------|----------|
| `Content-Security-Policy` | `default-src 'self'; script-src 'self'; ...` | ✅ |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` | ✅ |
| `X-Content-Type-Options` | `nosniff` | ✅ |
| `X-Frame-Options` | `SAMEORIGIN` | ✅ |
| `X-Powered-By` | **Absent** (Helmet le supprime) | ✅ |
| `X-DNS-Prefetch-Control` | `off` | ⚠️ |

### T1.2 — CSP bloque les sources non autorisées

```bash
# Vérifier que seul cdn.discordapp.com est autorisé pour les images
curl -s "$API/api/health" -D - -o /dev/null | grep -i "content-security-policy"
```

**Vérifier** : `img-src 'self' data: https://cdn.discordapp.com`

### T1.3 — X-Powered-By supprimé

```bash
curl -sI "$API/api/health" | grep -i "x-powered-by"
```

**Résultat attendu** : Aucune sortie (header absent) → ✅ PASS

---

## T2 — Redirection HTTPS

> **Objectif** : Vérifier la redirection HTTP → HTTPS en production.
> **Référence OWASP** : A02 Cryptographic Failures

### T2.1 — Redirection en production

```bash
# Simuler une requête HTTP avec header x-forwarded-proto
curl -sI -H "x-forwarded-proto: http" "$API/api/health"
```

**Résultat attendu (NODE_ENV=production)** :
- Status `301 Moved Permanently`
- Header `Location: https://...`

**Résultat attendu (NODE_ENV=development)** :
- Status `200 OK` (pas de redirection)

### T2.2 — HSTS header présent

```bash
curl -sI "$API/api/health" | grep -i "strict-transport"
```

**Résultat attendu** : `strict-transport-security: max-age=31536000; includeSubDomains; preload`

---

## T3 — Rate Limiting

> **Objectif** : Vérifier les limites de requêtes (DDoS prevention).
> **Référence OWASP** : A05 Security Misconfiguration

### T3.1 — Rate limit global (100 req/min)

```bash
# Envoyer 105 requêtes rapidement
for i in $(seq 1 105); do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API/api/health")
  echo "Requête $i: $STATUS"
done
```

**Résultat attendu** :
- Requêtes 1–100 : `200`
- Requêtes 101+ : `429 Too Many Requests`
- Headers `RateLimit-Limit: 100` et `RateLimit-Remaining: X` présents

### T3.2 — Rate limit auth (5 req/15min)

```bash
# Envoyer 6 requêtes sur l'endpoint auth
for i in $(seq 1 6); do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API/api/auth/discord")
  echo "Auth requête $i: $STATUS"
done
```

**Résultat attendu** :
- Requêtes 1–5 : `302` (redirect vers Discord)
- Requête 6 : `429`

### T3.3 — Vérifier les headers RateLimit standards

```bash
curl -sI "$API/api/health" | grep -iE "ratelimit"
```

**Résultat attendu** :
```
RateLimit-Limit: 100
RateLimit-Remaining: 99
RateLimit-Reset: <timestamp>
```

---

## T4 — Protection CSRF

> **Objectif** : Vérifier que les requêtes mutantes (POST/PUT/DELETE) sont protégées par CSRF.
> **Référence OWASP** : A08 Data Integrity Failures

### T4.1 — Obtenir un token CSRF

```bash
# Récupérer un token CSRF (doit aussi setter le cookie __csrf)
curl -s -c cookies.txt "$API/api/csrf-token" | jq .
```

**Résultat attendu** :
```json
{ "csrfToken": "<token_string>" }
```
- Le fichier `cookies.txt` contient un cookie `__csrf`

### T4.2 — Requête POST sans token CSRF → REJETÉE

```bash
# Tenter un POST sans header x-csrf-token (avec une session valide)
curl -s -b cookies.txt \
  -X POST "$API/api/guilds/$GUILD_ID/level-roles" \
  -H "Content-Type: application/json" \
  -d '{"roleId":"123456789012345678","levelReq":5}'
```

**Résultat attendu** : `403 Forbidden` avec message d'erreur CSRF

### T4.3 — Requête POST avec token CSRF invalide → REJETÉE

```bash
curl -s -b cookies.txt \
  -X POST "$API/api/guilds/$GUILD_ID/level-roles" \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: invalid-token-12345" \
  -d '{"roleId":"123456789012345678","levelReq":5}'
```

**Résultat attendu** : `403 Forbidden`

### T4.4 — Requête POST avec token CSRF valide → ACCEPTÉE

```bash
# 1. Obtenir le token
CSRF=$(curl -s -c cookies.txt "$API/api/csrf-token" | jq -r .csrfToken)

# 2. Utiliser le token (nécessite aussi une session auth valide)
curl -s -b cookies.txt \
  -X POST "$API/api/guilds/$GUILD_ID/level-roles" \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: $CSRF" \
  -d '{"roleId":"123456789012345678","levelReq":5}'
```

**Résultat attendu** : `201 Created` (ou `401` si pas authentifié, mais PAS `403` CSRF)

### T4.5 — Requête GET non protégée par CSRF

```bash
curl -s "$API/api/health" | jq .
```

**Résultat attendu** : `200 OK` sans besoin de token CSRF (GET est ignoré)

### T4.6 — Protection CSRF sur logout

```bash
# POST logout sans CSRF → doit être rejeté
curl -s -b cookies.txt -X POST "$API/api/auth/logout"
```

**Résultat attendu** : `403 Forbidden`

---

## T5 — Validation des entrées (Zod)

> **Objectif** : Vérifier que toutes les entrées utilisateur sont validées.
> **Référence OWASP** : A03 Injection

### T5.1 — Config : types invalides rejetés

```bash
CSRF=$(curl -s -c cookies.txt "$API/api/csrf-token" | jq -r .csrfToken)

# Envoyer des strings au lieu de nombres
curl -s -b cookies.txt \
  -X PUT "$API/api/guilds/$GUILD_ID/config" \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: $CSRF" \
  -d '{"xpCooldown":"abc","xpPerMessage":-5}'
```

**Résultat attendu** :
```json
{
  "error": "Validation failed",
  "details": [
    { "path": "xpCooldown", "message": "Expected number, received string" },
    { "path": "xpPerMessage", "message": "Number must be greater than 0" }
  ]
}
```
Status : `400 Bad Request`

### T5.2 — Config : snowflake ID invalide rejeté

```bash
curl -s -b cookies.txt \
  -X PUT "$API/api/guilds/$GUILD_ID/config" \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: $CSRF" \
  -d '{"xpChannelId":"not-a-snowflake"}'
```

**Résultat attendu** : `400` avec erreur `Invalid Discord snowflake ID`

### T5.3 — Level Roles : champs manquants rejetés

```bash
curl -s -b cookies.txt \
  -X POST "$API/api/guilds/$GUILD_ID/level-roles" \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: $CSRF" \
  -d '{}'
```

**Résultat attendu** : `400` avec erreurs sur `roleId` (Required) et `levelReq` (Required)

### T5.4 — Level Roles : snowflake trop court rejeté

```bash
curl -s -b cookies.txt \
  -X POST "$API/api/guilds/$GUILD_ID/level-roles" \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: $CSRF" \
  -d '{"roleId":"123","levelReq":5}'
```

**Résultat attendu** : `400` avec erreur `Invalid Discord snowflake ID`

### T5.5 — Reaction Roles : emoji trop long rejeté

```bash
curl -s -b cookies.txt \
  -X POST "$API/api/guilds/$GUILD_ID/reaction-roles" \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: $CSRF" \
  -d "{\"messageId\":\"123456789012345678\",\"emoji\":\"$(python3 -c "print('A'*101)")\",\"roleId\":\"123456789012345678\"}"
```

**Résultat attendu** : `400` avec erreur sur `emoji` (max 100 chars)

### T5.6 — Users : XP négatif rejeté

```bash
curl -s -b cookies.txt \
  -X PUT "$API/api/guilds/$GUILD_ID/users/123456789012345678" \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: $CSRF" \
  -d '{"xpTotal":-100}'
```

**Résultat attendu** : `400` avec erreur `Number must be greater than or equal to 0`

### T5.7 — Users : level 0 rejeté

```bash
curl -s -b cookies.txt \
  -X PUT "$API/api/guilds/$GUILD_ID/users/123456789012345678" \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: $CSRF" \
  -d '{"level":0}'
```

**Résultat attendu** : `400` avec erreur `Number must be greater than or equal to 1`

### T5.8 — Injection SQL via Prisma (parameterized queries)

```bash
# Tenter d'injecter du SQL dans un paramètre URL
curl -s -b cookies.txt \
  "$API/api/guilds/$GUILD_ID/users?page=1;DROP TABLE users--"
```

**Résultat attendu** : `200` avec page=1 (le paramètre est parsé en Number, NaN → default 1). Prisma utilise des requêtes paramétrées, pas de risque d'injection.

---

## T6 — Authentification & Contrôle d'accès

> **Objectif** : Vérifier que les routes sont protégées par auth + permissions.
> **Référence OWASP** : A01 Broken Access Control, A07 Authentication Failures

### T6.1 — Accès sans authentification → 401

```bash
# Tester toutes les routes protégées sans cookie de session
curl -s "$API/api/guilds" | jq .
curl -s "$API/api/guilds/$GUILD_ID/config" | jq .
curl -s "$API/api/guilds/$GUILD_ID/level-roles" | jq .
curl -s "$API/api/guilds/$GUILD_ID/users" | jq .
```

**Résultat attendu** pour chaque :
```json
{ "error": "Non authentifié" }
```
Status : `401`

### T6.2 — Accès à un guild sans permissions admin → 403

> Ce test nécessite un utilisateur authentifié qui n'est PAS admin du guild ciblé.

```bash
# Avec un cookie de session d'un utilisateur non-admin
curl -s -b session_nonadmin.txt "$API/api/guilds/$GUILD_ID/config" | jq .
```

**Résultat attendu** :
```json
{ "error": "Vous n'êtes pas administrateur de ce serveur" }
```
Status : `403`

### T6.3 — Route /api/auth/me sans session → 401

```bash
curl -s "$API/api/auth/me" | jq .
```

**Résultat attendu** :
```json
{ "authenticated": false }
```
Status : `401`

### T6.4 — Route /api/auth/me avec session → données filtrées

```bash
curl -s -b cookies.txt "$API/api/auth/me" | jq .
```

**Résultat attendu** : Seuls `id`, `username`, `discriminator`, `avatar` sont retournés.
- ❌ `accessToken` ne doit PAS être exposé
- ❌ `refreshToken` ne doit PAS être exposé
- ❌ `guilds` ne doit PAS être exposé

### T6.5 — Session SECRET manquant → l'API refuse de démarrer

```bash
# Temporairement supprimer SESSION_SECRET
unset SESSION_SECRET
pnpm start 2>&1 | grep -i "SESSION_SECRET"
```

**Résultat attendu** : Message `[API] SESSION_SECRET must be set` et l'API ne démarre pas.

---

## T7 — Gestion des secrets

> **Objectif** : Vérifier qu'aucun secret n'est exposé.
> **Référence OWASP** : A02 Cryptographic Failures

### T7.1 — .env dans .gitignore

```bash
cat .gitignore | grep -E "^\.env"
```

**Résultat attendu** :
```
.env
.env.prod
.env.local
.env.*.local
```

### T7.2 — Aucun secret hardcodé dans le code

```bash
# Rechercher des patterns suspects dans le code source
grep -rn "password\s*=\s*['\"]" src/ --include="*.ts" || echo "✅ Aucun mot de passe hardcodé"
grep -rn "secret\s*=\s*['\"][^$]" src/ --include="*.ts" || echo "✅ Aucun secret hardcodé"
grep -rn "DISCORD_TOKEN\s*=\s*['\"]" src/ --include="*.ts" || echo "✅ Aucun token hardcodé"
```

**Résultat attendu** : Aucune correspondance trouvée pour chaque commande.

### T7.3 — .env non committé dans git

```bash
git ls-files --cached | grep -E "^\.env" || echo "✅ Aucun fichier .env dans le repo"
```

**Résultat attendu** : Seul `.env.example` peut être présent.

### T7.4 — Vérifier que les env vars obligatoires sont validées au démarrage

Les variables suivantes doivent provoquer un crash explicite si absentes :

| Variable | Vérifié dans | Comportement |
|----------|-------------|-------------|
| `SESSION_SECRET` | `server.ts` + `csrf.ts` | `console.error` + return / throw |
| `DISCORD_CLIENT_ID` | `server.ts` | `console.error` + return |
| `DISCORD_CLIENT_SECRET` | `server.ts` | `console.error` + return |

---

## T8 — Headers de sécurité Dashboard (Next.js)

> **Objectif** : Vérifier les headers de sécurité ajoutés au dashboard Next.js.
> **Référence OWASP** : A05 Security Misconfiguration

### T8.1 — Présence des headers

```bash
curl -sI "$DASH" | grep -iE "x-content-type|x-frame|strict-transport|referrer-policy|permissions-policy|x-dns"
```

**Résultat attendu** :

| Header | Valeur attendue |
|--------|----------------|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |
| `X-DNS-Prefetch-Control` | `on` |

### T8.2 — iframe bloqué

Créer un fichier HTML temporaire :

```html
<!-- test-iframe.html -->
<iframe src="http://localhost:3000/guilds" width="800" height="600"></iframe>
```

**Résultat attendu** : L'iframe refuse de charger le dashboard (X-Frame-Options: DENY).

---

## T9 — Audit des dépendances

> **Objectif** : Identifier les vulnérabilités connues dans les dépendances.
> **Référence OWASP** : A06 Vulnerable and Outdated Components

### T9.1 — Audit bot

```bash
cd /Users/rosen/PhpstormProjects/shark-bot
pnpm audit
```

**Résultat attendu** : Liste des CVE connues. Documenter les résultats ci-dessous.

### T9.2 — Audit dashboard

```bash
cd /Users/rosen/PhpstormProjects/shark-bot/dashboard
pnpm audit
```

### T9.3 — Documenter les vulnérabilités

| Package | Sévérité | CVE | Chemin | Corrigé ? |
|---------|----------|-----|--------|-----------|
| | | | | |

> **Note** : Les vulnérabilités dans des dépendances transitives (ex: `nodemon > minimatch`) ne sont pas corrigibles directement. Suivre les mises à jour upstream.

---

## T10 — Checklist OWASP Top 10

> Cocher chaque item une fois le test réussi.

| # | Catégorie | Mesures implémentées | Test(s) | Status |
|---|-----------|---------------------|---------|--------|
| A01 | **Broken Access Control** | `requireAuth`, `requireGuildAdmin`, RBAC permissions Discord | T6.1, T6.2, T6.3 | ☐ |
| A02 | **Cryptographic Failures** | HTTPS redirect, HSTS, secure cookies, secrets en env vars | T2.1, T2.2, T7.1–T7.4 | ☐ |
| A03 | **Injection** | Validation Zod, Prisma parameterized queries | T5.1–T5.8 | ☐ |
| A04 | **Insecure Design** | Security by design, validation en couches | Architecture review | ☐ |
| A05 | **Security Misconfiguration** | Helmet (CSP, HSTS, etc.), no default secrets | T1.1–T1.3, T6.5 | ☐ |
| A06 | **Vulnerable Components** | `pnpm audit`, dépendances à jour | T9.1–T9.3 | ☐ |
| A07 | **Authentication Failures** | OAuth2 Discord, rate limit auth (5/15min) | T3.2, T6.1 | ☐ |
| A08 | **Data Integrity Failures** | CSRF double-submit cookie (`csrf-csrf`) | T4.1–T4.6 | ☐ |
| A09 | **Logging Failures** | `console.error` sur toutes les erreurs catch | Review manuelle | ☐ |
| A10 | **SSRF** | Pas de fetch vers des URLs user-controlled | Review manuelle | ☐ |

---

## Grille de résultats

### Récapitulatif des tests

| Section | Total tests | Pass | Fail | N/A |
|---------|------------|------|------|-----|
| T1 — Headers Helmet | 3 | | | |
| T2 — HTTPS | 2 | | | |
| T3 — Rate Limiting | 3 | | | |
| T4 — CSRF | 6 | | | |
| T5 — Validation (Zod) | 8 | | | |
| T6 — Auth & Access Control | 5 | | | |
| T7 — Secrets | 4 | | | |
| T8 — Headers Dashboard | 2 | | | |
| T9 — Audit dépendances | 3 | | | |
| T10 — OWASP Checklist | 10 | | | |
| **Total** | **46** | | | |

### Classification des sévérités

| Sévérité | Signification | Action requise |
|----------|--------------|----------------|
| 🔴 **Critique** | Faille exploitable immédiatement | Corriger avant tout déploiement |
| 🟠 **Haute** | Risque significatif | Corriger dans les 24h |
| 🟡 **Moyenne** | Risque modéré | Corriger dans la semaine |
| 🟢 **Basse** | Amélioration recommandée | Planifier |

### Testeur & Approbation

| Champ | Valeur |
|-------|--------|
| **Testeur** | |
| **Date d'exécution** | |
| **Environnement** | `development` / `production` |
| **Version testée** | |
| **Approuvé par** | |
| **Prochaine revue** | |

---

## Fréquence recommandée

| Action | Fréquence |
|--------|-----------|
| Exécution complète du protocole | À chaque release majeure |
| `pnpm audit` (T9) | Hebdomadaire |
| Review des secrets (T7) | À chaque PR |
| Test CSRF + Rate Limiting (T3, T4) | Après modification API |
| Mise à jour des dépendances | Mensuelle |

