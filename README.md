# GetMeFixed API - Système de gestion de licences

API NestJS pour la gestion de licences logicielles et de plugins, permettant de gérer des clés de licence, des plans, et des plugins pour vos applications.

## Fonctionnalités

- **Authentification** avec JWT et refresh tokens
- **Gestion de licences** avec validation et suivi
- **Plans de licences** configurables avec différents niveaux
- **Gestion de plugins** pour étendre les fonctionnalités
- **Consommation de jetons** pour les fonctionnalités premium 
- **Système de heartbeat** pour surveiller l'activité des licences
- **Documentation Swagger** complète et interactive
- **Mise en cache Redis** pour améliorer les performances
- **Architecture modulaire** pour une maintenance facile

## Prérequis

- Node.js (v14 ou supérieur)
- PostgreSQL
- Redis
- Docker (optionnel)

## Installation

```bash
# Cloner le dépôt
git clone https://votre-repo/getmefixed-api.git
cd getmefixed-api

# Installation des dépendances
npm install

# Configuration de l'environnement
cp .env.example .env
# Puis éditez le fichier .env avec vos configurations

# Migration de la base de données
npm run db:migrate

# Création d'un administrateur par défaut
npm run seed:admin
```

## Configuration

Configurez votre application en modifiant le fichier `.env` :

```
# Base de données
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/getmefixed?schema=public"

# JWT
JWT_SECRET="change-this-to-a-secure-random-string"
JWT_EXPIRES_IN="1h"
REFRESH_TOKEN_EXPIRES_IN="7d"

# Redis
REDIS_URL="redis://localhost:6379"

# Serveur
PORT=3000
NODE_ENV=development
```

## Lancement

```bash
# Mode développement
npm run start:dev

# Mode production
npm run build
npm run start:prod
```

## Docker

Un `docker-compose.yml` est fourni pour faciliter le déploiement :

```bash
# Lancement avec Docker Compose
docker-compose up -d
```

Cela lancera :
- L'API NestJS
- PostgreSQL
- Redis

## Scripts utiles

```bash
# Développement
npm run start:dev    # Lancer en mode développement avec hot reload

# Base de données
npm run db:migrate   # Appliquer les migrations
npm run db:reset     # Réinitialiser la base de données
npm run seed:admin   # Créer un administrateur par défaut

# Production
npm run build        # Construire pour la production
npm run start:prod   # Lancer en mode production
```

## Structure de l'API

L'API est organisée selon une architecture modulaire :

- `/api/v1/auth` - Authentification et gestion des tokens
- `/api/v1/licenses` - Gestion des licences
- `/api/v1/license-plans` - Gestion des plans de licence
- `/api/v1/plugins` - Gestion des plugins
- `/api/v1/public` - Points d'accès publics pour les clients

## Documentation API

La documentation Swagger est disponible à l'adresse : http://localhost:3000/api/docs

## Exemples d'utilisation

### Authentification

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@getmefixed.com","password":"admin123"}'
```

### Générer une licence

```bash
curl -X POST http://localhost:3000/api/v1/licenses/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -d '{
    "planId": "id-du-plan",
    "expirationDate": "2025-12-31T23:59:59Z",
    "customerId": "client-123"
  }'
```

### Valider une licence (endpoint public)

```bash
curl -X POST http://localhost:3000/api/v1/public/validate \
  -H "Content-Type: application/json" \
  -d '{
    "licenseKey": "GMF-2025-BSC-A1B2C3D4",
    "machineId": "machine-123"
  }'
```

## Licence

[MIT](LICENSE)
