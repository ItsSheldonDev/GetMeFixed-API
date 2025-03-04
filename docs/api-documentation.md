# GetMeFixed API Documentation

## Table des matières

- [Introduction](#introduction)
- [Base URL](#base-url)
- [Authentification](#authentification)
- [Endpoints](#endpoints)
  - [Santé](#santé)
  - [Authentification](#endpoints-authentification)
  - [Licences](#licences)
  - [Plans de licence](#plans-de-licence)
  - [Plugins](#plugins)
  - [API Publique](#api-publique)
  - [Paiements](#paiements)
- [Modèles de données](#modèles-de-données)
- [Codes d'erreur](#codes-derreur)

## Introduction

L'API GetMeFixed permet de gérer un système complet de licences logicielles, y compris l'authentification, la création et validation de licences, la gestion des plans et des plugins, et le traitement des paiements.

## Base URL

```
https://proto.cloudyshell.fr/api/v1
```

## Authentification

L'API utilise JWT (JSON Web Tokens) pour l'authentification. La plupart des endpoints nécessitent un token d'accès valide.

Pour obtenir un token, faites une requête à l'endpoint `/auth/login`. Le token doit ensuite être inclus dans l'en-tête `Authorization` de toutes les requêtes ultérieures avec le préfixe `Bearer`:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6...
```

Les tokens: number
description: string
price: number
isActive: boolean
features: JSON
createdAt: DateTime
updatedAt: DateTime
```

### License
```
id: UUID
key: string
status: string (ACTIVE, EXPIRED, REVOKED)
planId: UUID
expirationDate: DateTime
tokensRemaining: number
customerId: string
metadata: JSON
createdAt: DateTime
updatedAt: DateTime
```

### Plugin
```
id: UUID
name: string
identifier: string
description: string
isActive: boolean
createdAt: DateTime
updatedAt: DateTime
```

### PluginVersion
```
id: UUID
pluginId: UUID
version: string
description: string
price: number
isActive: boolean
createdAt: DateTime
updatedAt: DateTime
```

### PluginLicense
```
id: UUID
licenseId: UUID
pluginId: UUID
versionId: UUID
expirationDate: DateTime
createdAt: DateTime
updatedAt: DateTime
```

### LicenseUsage
```
id: UUID
licenseId: UUID
action: string (VALIDATE, CONSUME_TOKEN, HEARTBEAT)
machine_id: string
tokens: number
metadata: JSON
createdAt: DateTime
```

## Codes d'erreur

| Code | Message | Description |
|------|---------|-------------|
| INVALID_LICENSE | Licence invalide | La licence n'existe pas ou n'est pas valide |
| LICENSE_EXPIRED | Licence expirée | La licence a expiré |
| LICENSE_REVOKED | Licence révoquée | La licence a été révoquée par un administrateur |
| NO_TOKENS | Jetons insuffisants | Il ne reste plus assez de jetons sur la licence |
| PLUGIN_NOT_FOUND | Plugin non trouvé | Le plugin demandé n'existe pas |
| INVALID_PLUGIN_VERSION | Version de plugin invalide | La version du plugin demandée n'est pas valide | expirent après 1 heure. Utilisez l'endpoint `/auth/refresh-token` pour obtenir un nouveau token sans avoir à vous reconnecter.

## Endpoints

### Santé

#### GET /health

Vérifie l'état de l'API et de ses dépendances.

**Authentification requise**: Non

**Réponse**:
```json
{
  "status": "ok",
  "timestamp": "2025-03-01T14:30:00.000Z",
  "uptime": 3600,
  "services": {
    "database": "ok",
    "redis": "ok"
  }
}
```

### Endpoints Authentification

#### POST /auth/login

Authentifie un administrateur et renvoie un token JWT.

**Authentification requise**: Non

**Corps de la requête**:
```json
{
  "email": "admin@getmefixed.com",
  "password": "admin123"
}
```

**Réponse**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "b1e3e4d5-9e7f-4b9c-8e2d-f3c4b2a1e0d9",
    "email": "admin@getmefixed.com"
  }
}
```

#### POST /auth/refresh-token

Obtient un nouveau token JWT à partir d'un refresh token.

**Authentification requise**: Non

**Corps de la requête**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Réponse**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Licences

#### POST /licenses/generate

Génère une nouvelle licence.

**Authentification requise**: Oui

**Corps de la requête**:
```json
{
  "planId": "b1e3e4d5-9e7f-4b9c-8e2d-f3c4b2a1e0d9",
  "expirationDate": "2025-12-31T23:59:59.000Z",
  "customerId": "client-123",
  "metadata": {
    "company": "Acme Inc.",
    "contact": "john@example.com"
  }
}
```

**Réponse**:
```json
{
  "id": "c2d3e4f5-8b7a-6c5d-4e3f-2a1b0c9d8e7f",
  "key": "GMF-2025-BSC-A1B2C3D4",
  "status": "ACTIVE",
  "planId": "b1e3e4d5-9e7f-4b9c-8e2d-f3c4b2a1e0d9",
  "expirationDate": "2025-12-31T23:59:59.000Z",
  "tokensRemaining": 100,
  "customerId": "client-123",
  "metadata": {
    "company": "Acme Inc.",
    "contact": "john@example.com"
  },
  "createdAt": "2025-03-01T14:30:00.000Z",
  "updatedAt": "2025-03-01T14:30:00.000Z",
  "plan": {
    "id": "b1e3e4d5-9e7f-4b9c-8e2d-f3c4b2a1e0d9",
    "name": "Basic",
    "identifier": "BSC",
    "tokens": 100,
    "price": 9.99
  }
}
```

#### GET /licenses

Récupère une liste paginée de licences.

**Authentification requise**: Oui

**Paramètres de requête**:
- `page` (optionnel): Numéro de page, par défaut: 1
- `limit` (optionnel): Nombre d'éléments par page, par défaut: 10
- `status` (optionnel): Filtrer par statut (ACTIVE, EXPIRED, REVOKED)
- `planId` (optionnel): Filtrer par ID de plan

**Réponse**:
```json
{
  "data": [
    {
      "id": "c2d3e4f5-8b7a-6c5d-4e3f-2a1b0c9d8e7f",
      "key": "GMF-2025-BSC-A1B2C3D4",
      "status": "ACTIVE",
      "expirationDate": "2025-12-31T23:59:59.000Z",
      "tokensRemaining": 100,
      "plan": {
        "name": "Basic",
        "identifier": "BSC"
      }
    }
  ],
  "total": 50,
  "page": 1,
  "pageSize": 10,
  "totalPages": 5
}
```

#### GET /licenses/validate/:key

Valide une licence par sa clé.

**Authentification requise**: Non

**Paramètres de chemin**:
- `key`: Clé de licence à valider

**Réponse**:
```json
{
  "isValid": true,
  "type": "BSC",
  "tokensRemaining": 95,
  "expirationDate": "2025-12-31T23:59:59.000Z",
  "plugins": [
    {
      "id": "d4e5f6g7-1a2b-3c4d-5e6f-7g8h9i0j1k2l",
      "version": "1.0.0",
      "status": "ACTIVE"
    }
  ]
}
```

#### GET /licenses/:id

Récupère les détails d'une licence spécifique.

**Authentification requise**: Oui

**Paramètres de chemin**:
- `id`: ID de la licence

**Réponse**:
```json
{
  "id": "c2d3e4f5-8b7a-6c5d-4e3f-2a1b0c9d8e7f",
  "key": "GMF-2025-BSC-A1B2C3D4",
  "status": "ACTIVE",
  "planId": "b1e3e4d5-9e7f-4b9c-8e2d-f3c4b2a1e0d9",
  "expirationDate": "2025-12-31T23:59:59.000Z",
  "tokensRemaining": 95,
  "customerId": "client-123",
  "metadata": {
    "company": "Acme Inc.",
    "contact": "john@example.com"
  },
  "createdAt": "2025-03-01T14:30:00.000Z",
  "updatedAt": "2025-03-01T15:45:30.000Z",
  "plan": {
    "id": "b1e3e4d5-9e7f-4b9c-8e2d-f3c4b2a1e0d9",
    "name": "Basic",
    "identifier": "BSC",
    "tokens": 100,
    "price": 9.99
  },
  "pluginLicenses": [
    {
      "plugin": {
        "id": "d4e5f6g7-1a2b-3c4d-5e6f-7g8h9i0j1k2l",
        "name": "Premium Features"
      },
      "version": {
        "version": "1.0.0",
        "isActive": true
      }
    }
  ]
}
```

#### GET /licenses/:id/history

Récupère l'historique d'utilisation d'une licence.

**Authentification requise**: Oui

**Paramètres de chemin**:
- `id`: ID de la licence

**Réponse**:
```json
{
  "history": [
    {
      "id": "f6g7h8i9-2b3c-4d5e-6f7g-8h9i0j1k2l3m",
      "action": "VALIDATE",
      "machine_id": "MACHINE-123",
      "tokens": null,
      "metadata": {
        "timestamp": "2025-03-01T15:30:00.000Z",
        "success": true
      },
      "createdAt": "2025-03-01T15:30:00.000Z"
    },
    {
      "id": "g7h8i9j0-3c4d-5e6f-7g8h-9i0j1k2l3m4n",
      "action": "CONSUME_TOKEN",
      "machine_id": "MACHINE-123",
      "tokens": 5,
      "metadata": {
        "reason": "Feature usage",
        "timestamp": "2025-03-01T15:45:00.000Z"
      },
      "createdAt": "2025-03-01T15:45:00.000Z"
    }
  ]
}
```

#### PUT /licenses/:id/revoke

Révoque une licence.

**Authentification requise**: Oui

**Paramètres de chemin**:
- `id`: ID de la licence

**Corps de la requête**:
```json
{
  "reason": "Customer requested cancellation"
}
```

**Réponse**:
```json
{
  "id": "c2d3e4f5-8b7a-6c5d-4e3f-2a1b0c9d8e7f",
  "key": "GMF-2025-BSC-A1B2C3D4",
  "status": "REVOKED",
  "planId": "b1e3e4d5-9e7f-4b9c-8e2d-f3c4b2a1e0d9",
  "expirationDate": "2025-12-31T23:59:59.000Z",
  "tokensRemaining": 95,
  "plan": {
    "name": "Basic",
    "identifier": "BSC"
  }
}
```

#### POST /licenses/free-trial

Crée une licence d'essai gratuit.

**Authentification requise**: Non

**Corps de la requête**:
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "planId": "b1e3e4d5-9e7f-4b9c-8e2d-f3c4b2a1e0d9",
  "durationDays": 14,
  "additionalInfo": "Discovered via website"
}
```

**Réponse**:
```json
{
  "licenseKey": "GMF-2025-BSC-A1B2C3D4",
  "expirationDate": "2025-03-15T14:30:00.000Z",
  "plan": "Basic",
  "tokens": 100,
  "durationDays": 14
}
```

### Plans de licence

#### GET /license-plans

Récupère tous les plans de licence.

**Authentification requise**: Oui

**Réponse**:
```json
[
  {
    "id": "b1e3e4d5-9e7f-4b9c-8e2d-f3c4b2a1e0d9",
    "name": "Basic",
    "identifier": "BSC",
    "tokens": 100,
    "description": "Basic license plan",
    "price": 9.99,
    "isActive": true,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  },
  {
    "id": "c2d3e4f5-8b7a-6c5d-4e3f-2a1b0c9d8e7f",
    "name": "Professional",
    "identifier": "PRO",
    "tokens": 500,
    "description": "Professional license plan",
    "price": 29.99,
    "isActive": true,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
]
```

#### GET /license-plans/:id

Récupère un plan de licence spécifique.

**Authentification requise**: Oui

**Paramètres de chemin**:
- `id`: ID du plan de licence

**Réponse**:
```json
{
  "id": "b1e3e4d5-9e7f-4b9c-8e2d-f3c4b2a1e0d9",
  "name": "Basic",
  "identifier": "BSC",
  "tokens": 100,
  "description": "Basic license plan",
  "price": 9.99,
  "isActive": true,
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

#### POST /license-plans

Crée un nouveau plan de licence.

**Authentification requise**: Oui

**Corps de la requête**:
```json
{
  "name": "Enterprise",
  "identifier": "ENT",
  "tokens": 2000,
  "description": "Enterprise license plan",
  "price": 99.99,
  "isActive": true
}
```

**Réponse**:
```json
{
  "id": "d3e4f5g6-9c0b-1a2b-3c4d-5e6f7g8h9i0j",
  "name": "Enterprise",
  "identifier": "ENT",
  "tokens": 2000,
  "description": "Enterprise license plan",
  "price": 99.99,
  "isActive": true,
  "createdAt": "2025-03-01T14:30:00.000Z",
  "updatedAt": "2025-03-01T14:30:00.000Z"
}
```

#### PUT /license-plans/:id

Met à jour un plan de licence existant.

**Authentification requise**: Oui

**Paramètres de chemin**:
- `id`: ID du plan de licence

**Corps de la requête**:
```json
{
  "price": 119.99,
  "tokens": 2500,
  "description": "Enhanced Enterprise license plan"
}
```

**Réponse**:
```json
{
  "id": "d3e4f5g6-9c0b-1a2b-3c4d-5e6f7g8h9i0j",
  "name": "Enterprise",
  "identifier": "ENT",
  "tokens": 2500,
  "description": "Enhanced Enterprise license plan",
  "price": 119.99,
  "isActive": true,
  "createdAt": "2025-03-01T14:30:00.000Z",
  "updatedAt": "2025-03-01T15:45:00.000Z"
}
```

#### DELETE /license-plans/:id

Supprime un plan de licence.

**Authentification requise**: Oui

**Paramètres de chemin**:
- `id`: ID du plan de licence

**Réponse**:
```
Status: 204 No Content
```

### Plugins

#### GET /plugins

Récupère tous les plugins.

**Authentification requise**: Non

**Réponse**:
```json
[
  {
    "id": "d4e5f6g7-1a2b-3c4d-5e6f-7g8h9i0j1k2l",
    "name": "Premium Features",
    "identifier": "PREMIUM",
    "description": "Adds premium features to the application",
    "isActive": true,
    "versions": [
      {
        "id": "e5f6g7h8-2b3c-4d5e-6f7g-8h9i0j1k2l3m",
        "version": "1.0.0",
        "description": "Initial release",
        "price": 19.99,
        "isActive": true,
        "createdAt": "2025-01-15T00:00:00.000Z"
      },
      {
        "id": "f6g7h8i9-3c4d-5e6f-7g8h-9i0j1k2l3m4n",
        "version": "1.1.0",
        "description": "Bug fixes and improvements",
        "price": 19.99,
        "isActive": true,
        "createdAt": "2025-02-01T00:00:00.000Z"
      }
    ]
  }
]
```

#### GET /plugins/:id

Récupère un plugin spécifique.

**Authentification requise**: Oui

**Paramètres de chemin**:
- `id`: ID du plugin

**Réponse**:
```json
{
  "id": "d4e5f6g7-1a2b-3c4d-5e6f-7g8h9i0j1k2l",
  "name": "Premium Features",
  "identifier": "PREMIUM",
  "description": "Adds premium features to the application",
  "isActive": true,
  "versions": [
    {
      "id": "e5f6g7h8-2b3c-4d5e-6f7g-8h9i0j1k2l3m",
      "version": "1.0.0",
      "description": "Initial release",
      "price": 19.99,
      "isActive": true,
      "createdAt": "2025-01-15T00:00:00.000Z"
    },
    {
      "id": "f6g7h8i9-3c4d-5e6f-7g8h-9i0j1k2l3m4n",
      "version": "1.1.0",
      "description": "Bug fixes and improvements",
      "price": 19.99,
      "isActive": true,
      "createdAt": "2025-02-01T00:00:00.000Z"
    }
  ]
}
```

#### POST /plugins

Crée un nouveau plugin.

**Authentification requise**: Oui

**Corps de la requête**:
```json
{
  "name": "Advanced Analytics",
  "identifier": "ANALYTICS",
  "description": "Advanced analytics and reporting",
  "versions": [
    {
      "version": "1.0.0",
      "description": "Initial release",
      "price": 49.99,
      "isActive": true
    }
  ]
}
```

**Réponse**:
```json
{
  "id": "g7h8i9j0-4d5e-6f7g-8h9i-0j1k2l3m4n5o",
  "name": "Advanced Analytics",
  "identifier": "ANALYTICS",
  "description": "Advanced analytics and reporting",
  "isActive": true,
  "versions": [
    {
      "id": "h8i9j0k1-5e6f-7g8h-9i0j-1k2l3m4n5o6p",
      "version": "1.0.0",
      "description": "Initial release",
      "price": 49.99,
      "isActive": true,
      "createdAt": "2025-03-01T14:30:00.000Z"
    }
  ],
  "createdAt": "2025-03-01T14:30:00.000Z",
  "updatedAt": "2025-03-01T14:30:00.000Z"
}
```

#### PUT /plugins/:id

Met à jour un plugin existant.

**Authentification requise**: Oui

**Paramètres de chemin**:
- `id`: ID du plugin

**Corps de la requête**:
```json
{
  "name": "Advanced Analytics Pro",
  "description": "Professional analytics and reporting tool",
  "versions": [
    {
      "version": "1.1.0",
      "description": "New features and improvements",
      "price": 59.99,
      "isActive": true
    }
  ]
}
```

**Réponse**:
```json
{
  "id": "g7h8i9j0-4d5e-6f7g-8h9i-0j1k2l3m4n5o",
  "name": "Advanced Analytics Pro",
  "identifier": "ANALYTICS",
  "description": "Professional analytics and reporting tool",
  "isActive": true,
  "versions": [
    {
      "id": "h8i9j0k1-5e6f-7g8h-9i0j-1k2l3m4n5o6p",
      "version": "1.0.0",
      "description": "Initial release",
      "price": 49.99,
      "isActive": true,
      "createdAt": "2025-03-01T14:30:00.000Z"
    },
    {
      "id": "i9j0k1l2-6f7g-8h9i-0j1k-2l3m4n5o6p7q",
      "version": "1.1.0",
      "description": "New features and improvements",
      "price": 59.99,
      "isActive": true,
      "createdAt": "2025-03-01T15:45:00.000Z"
    }
  ],
  "createdAt": "2025-03-01T14:30:00.000Z",
  "updatedAt": "2025-03-01T15:45:00.000Z"
}
```

#### DELETE /plugins/:id

Supprime un plugin.

**Authentification requise**: Oui

**Paramètres de chemin**:
- `id`: ID du plugin

**Réponse**:
```
Status: 204 No Content
```

#### POST /plugins/activate

Active un plugin pour une licence.

**Authentification requise**: Oui

**Corps de la requête**:
```json
{
  "licenseKey": "GMF-2025-BSC-A1B2C3D4",
  "pluginId": "d4e5f6g7-1a2b-3c4d-5e6f-7g8h9i0j1k2l"
}
```

**Réponse**:
```json
{
  "id": "j0k1l2m3-7g8h-9i0j-1k2l-3m4n5o6p7q8r",
  "licenseId": "c2d3e4f5-8b7a-6c5d-4e3f-2a1b0c9d8e7f",
  "pluginId": "d4e5f6g7-1a2b-3c4d-5e6f-7g8h9i0j1k2l",
  "versionId": "f6g7h8i9-3c4d-5e6f-7g8h-9i0j1k2l3m4n",
  "expirationDate": "2025-12-31T23:59:59.000Z",
  "createdAt": "2025-03-01T14:30:00.000Z",
  "updatedAt": "2025-03-01T14:30:00.000Z",
  "plugin": {
    "name": "Premium Features",
    "identifier": "PREMIUM"
  },
  "version": {
    "version": "1.1.0",
    "isActive": true
  }
}
```

#### GET /plugins/status/:licenseKey/:pluginId

Vérifie le statut d'un plugin pour une licence.

**Authentification requise**: Non

**Paramètres de chemin**:
- `licenseKey`: Clé de licence
- `pluginId`: ID du plugin

**Réponse**:
```json
{
  "isActive": true,
  "version": "1.1.0",
  "expirationDate": "2025-12-31T23:59:59.000Z"
}
```

### API Publique

#### POST /public/validate

Valide une licence (endpoint client).

**Authentification requise**: Non

**Corps de la requête**:
```json
{
  "licenseKey": "GMF-2025-BSC-A1B2C3D4",
  "machineId": "MACHINE-123"
}
```

**Réponse**:
```json
{
  "isValid": true,
  "type": "BSC",
  "tokensRemaining": 95,
  "expirationDate": "2025-12-31T23:59:59.999Z",
  "features": {
    "premium": false,
    "maxProjects": 10
  },
  "plugins": [
    {
      "id": "d4e5f6g7-1a2b-3c4d-5e6f-7g8h9i0j1k2l",
      "name": "Premium Features",
      "version": "1.1.0",
      "status": "ACTIVE"
    }
  ]
}
```

#### POST /public/heartbeat

Envoie un heartbeat pour une licence.

**Authentification requise**: Non

**Corps de la requête**:
```json
{
  "licenseKey": "GMF-2025-BSC-A1B2C3D4",
  "machineId": "MACHINE-123"
}
```

**Réponse**:
```json
{
  "status": "ok"
}
```

#### POST /public/consume-token

Consomme des jetons d'une licence.

**Authentification requise**: Non

**Corps de la requête**:
```json
{
  "licenseKey": "GMF-2025-BSC-A1B2C3D4",
  "machineId": "MACHINE-123",
  "tokens": 5,
  "reason": "Feature usage"
}
```

**Réponse**:
```json
{
  "tokensConsumed": 5,
  "tokensRemaining": 90
}
```

#### POST /public/info

Obtient des informations sur une licence sans consommer de jetons.

**Authentification requise**: Non

**Corps de la requête**:
```json
{
  "licenseKey": "GMF-2025-BSC-A1B2C3D4",
  "machineId": "MACHINE-123"
}
```

**Réponse**:
```json
{
  "isValid": true,
  "type": "BSC",
  "tokensRemaining": 90,
  "expirationDate": "2025-12-31T23:59:59.999Z",
  "features": {
    "premium": false,
    "maxProjects": 10
  },
  "plugins": [
    {
      "id": "d4e5f6g7-1a2b-3c4d-5e6f-7g8h9i0j1k2l",
      "name": "Premium Features",
      "version": "1.1.0"
    }
  ]
}
```

### Paiements

#### POST /payments/create-checkout

Crée une session de paiement Stripe.

**Authentification requise**: Oui

**Corps de la requête**:
```json
{
  "planId": "b1e3e4d5-9e7f-4b9c-8e2d-f3c4b2a1e0d9",
  "email": "customer@example.com"
}
```

**Réponse**:
```json
{
  "sessionId": "cs_test_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0",
  "url": "https://checkout.stripe.com/pay/cs_test_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0"
}
```

#### POST /payments/webhook

Webhook pour les événements Stripe.

**Authentification requise**: Non

**En-têtes**:
- `stripe-signature`: Signature fournie par Stripe

**Corps de la requête**:
Corps raw de l'événement Stripe

**Réponse**:
```json
{
  "received": true
}
```

## Modèles de données

### Admin
```
id: UUID
email: string
password: string (hashed)
createdAt: DateTime
updatedAt: DateTime
```

### LicensePlan
```
id: UUID
name: string
identifier: string
tokens