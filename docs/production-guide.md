# Guide de mise en production de l'API GetMeFixed

Ce guide détaille les étapes nécessaires pour déployer l'API GetMeFixed en production, soit avec Docker Compose (recommandé), soit manuellement.

## Table des matières

1. [Prérequis](#prérequis)
2. [Préparation du déploiement](#préparation-du-déploiement)
3. [Déploiement avec Docker Compose](#déploiement-avec-docker-compose)
4. [Déploiement manuel](#déploiement-manuel)
5. [Configuration HTTPS](#configuration-https)
6. [Configuration des emails](#configuration-des-emails)
7. [Surveillance et maintenance](#surveillance-et-maintenance)
8. [Sauvegarde et restauration](#sauvegarde-et-restauration)
9. [Dépannage](#dépannage)

## Prérequis

### Matériel recommandé
- **CPU** : 2 cœurs minimum (4 recommandés pour la production)
- **RAM** : 2 Go minimum (4 Go recommandés pour la production)
- **Stockage** : 20 Go minimum

### Logiciels requis

#### Pour le déploiement avec Docker Compose
- Docker Engine (version 20.10.0+)
- Docker Compose (version 2.0.0+)
- Git

#### Pour le déploiement manuel
- Node.js (version 16.x ou 18.x)
- PostgreSQL (version 14+)
- Redis (version 6+)
- Git
- Nginx (pour le proxy inverse)

## Préparation du déploiement

### 1. Cloner le dépôt

```bash
git clone https://github.com/votre-utilisateur/get-me-auth.git
cd get-me-auth
```

### 2. Installer les dépendances

Pour le déploiement avec Docker, cette étape sera gérée automatiquement. Pour le déploiement manuel :

```bash
npm install
# Pour ajouter les fonctionnalités d'envoi d'email
npm install --save nodemailer
npm install --save-dev @types/nodemailer
```

### 3. Configurer les variables d'environnement

Créez un fichier `.env` à la racine du projet avec les variables suivantes :

```env
# Configuration générale
PORT=3000
NODE_ENV=production

# Base de données
DATABASE_URL=postgresql://username:password@localhost:5432/getmefixed

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=votre_secret_très_long_et_complexe
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_EXPIRES_IN=7d

# Stripe (si utilisé)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (si configuré)
SMTP_HOST=smtp.votre-service.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre-utilisateur
SMTP_PASSWORD=votre-mot-de-passe
EMAIL_FROM=noreply@getmefixed.com
DOCUMENTATION_URL=https://docs.getmefixed.com

# Frontend
FRONTEND_URL=https://votre-frontend.com
```

## Déploiement avec Docker Compose

Le déploiement avec Docker Compose est la méthode recommandée car elle simplifie la gestion des dépendances et garantit un environnement cohérent.

### 1. Créer le fichier docker-compose.yml

```yaml
version: '3.8'

services:
  # Application API
  api:
    build:
      context: .
      dockerfile: Dockerfile
    restart: always
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:postgres_password@postgres:5432/getmefixed
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
      - JWT_EXPIRES_IN=${JWT_EXPIRES_IN}
      - REFRESH_TOKEN_EXPIRES_IN=${REFRESH_TOKEN_EXPIRES_IN}
      - STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
      - STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET}
      - FRONTEND_URL=${FRONTEND_URL}
      - SMTP_HOST=${SMTP_HOST}
      - SMTP_PORT=${SMTP_PORT}
      - SMTP_SECURE=${SMTP_SECURE}
      - SMTP_USER=${SMTP_USER}
      - SMTP_PASSWORD=${SMTP_PASSWORD}
      - EMAIL_FROM=${EMAIL_FROM}
      - DOCUMENTATION_URL=${DOCUMENTATION_URL}
    volumes:
      - ./templates:/app/templates
      - ./emails:/app/emails
    networks:
      - getmefixed-network
  
  # Base de données PostgreSQL
  postgres:
    image: postgres:14-alpine
    restart: always
    environment:
      - POSTGRES_PASSWORD=postgres_password
      - POSTGRES_USER=postgres
      - POSTGRES_DB=getmefixed
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - getmefixed-network
  
  # Cache Redis
  redis:
    image: redis:6-alpine
    restart: always
    volumes:
      - redis_data:/data
    networks:
      - getmefixed-network
  
  # Proxy NGINX (optionnel mais recommandé pour la production)
  nginx:
    image: nginx:alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d
      - ./nginx/ssl:/etc/nginx/ssl
      - ./nginx/certbot/conf:/etc/letsencrypt
      - ./nginx/certbot/www:/var/www/certbot
    depends_on:
      - api
    networks:
      - getmefixed-network

volumes:
  postgres_data:
  redis_data:

networks:
  getmefixed-network:
    driver: bridge
```

### 2. Créer un Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copie et installation des dépendances
COPY package*.json ./
RUN npm ci --only=production

# Si vous avez besoin de nodemailer pour les emails
RUN npm install --save nodemailer

# Copie du code source
COPY . .

# Génération du build TypeScript
RUN npm run build

# Exécution des migrations Prisma
RUN npx prisma generate
RUN npx prisma migrate deploy

# Démarrage de l'application
CMD ["npm", "run", "start:prod"]
```

### 3. Configurer Nginx

Créez le répertoire pour la configuration Nginx :

```bash
mkdir -p nginx/conf.d
```

Créez le fichier `nginx/conf.d/default.conf` :

```nginx
server {
    listen 80;
    server_name api.votre-domaine.com;
    
    # Redirection vers HTTPS (à activer après avoir configuré SSL)
    # location / {
    #     return 301 https://$host$request_uri;
    # }
    
    # Pour Let's Encrypt
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Redirection de tout le reste vers l'API
    location / {
        proxy_pass http://api:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Décommentez cette section après avoir configuré SSL
# server {
#     listen 443 ssl;
#     server_name api.votre-domaine.com;
#     
#     ssl_certificate /etc/letsencrypt/live/api.votre-domaine.com/fullchain.pem;
#     ssl_certificate_key /etc/letsencrypt/live/api.votre-domaine.com/privkey.pem;
#     include /etc/letsencrypt/options-ssl-nginx.conf;
#     ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
#     
#     location / {
#         proxy_pass http://api:3000;
#         proxy_set_header Host $host;
#         proxy_set_header X-Real-IP $remote_addr;
#         proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
#         proxy_set_header X-Forwarded-Proto $scheme;
#     }
# }
```

### 4. Démarrer les services

```bash
# Construction et démarrage des containers
docker-compose up -d

# Vérifier l'état des containers
docker-compose ps

# Consulter les logs
docker-compose logs -f api
```

### 5. Initialiser la base de données

Pour créer un administrateur et des plans de licence par défaut :

```bash
docker-compose exec api npx ts-node prisma/seed.ts
```

## Déploiement manuel

Si vous préférez un déploiement sans Docker, suivez ces étapes :

### 1. Préparer l'environnement

```bash
# Installer Node.js (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Installer PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib

# Installer Redis
sudo apt-get install -y redis-server
```

### 2. Configurer PostgreSQL

```bash
# Se connecter en tant qu'utilisateur postgres
sudo -u postgres psql

# Créer la base de données et l'utilisateur
CREATE USER getmefixed WITH PASSWORD 'votre_mot_de_passe';
CREATE DATABASE getmefixed;
GRANT ALL PRIVILEGES ON DATABASE getmefixed TO getmefixed;
\q

# Vérifier la connexion
psql -U getmefixed -d getmefixed -h localhost
```

### 3. Configurer l'application

```bash
# Créer un utilisateur système pour l'application
sudo useradd -m -s /bin/bash getmefixed

# Cloner le dépôt dans le répertoire de l'utilisateur
sudo -u getmefixed git clone https://github.com/votre-utilisateur/get-me-auth.git /home/getmefixed/app
cd /home/getmefixed/app

# Installer les dépendances
sudo -u getmefixed npm install
sudo -u getmefixed npm install --save nodemailer

# Créer le fichier .env
sudo -u getmefixed nano .env
# Ajouter les variables d'environnement comme indiqué précédemment

# Construire l'application
sudo -u getmefixed npm run build

# Exécuter les migrations Prisma
sudo -u getmefixed npx prisma generate
sudo -u getmefixed npx prisma migrate deploy

# Initialiser la base de données avec un admin
sudo -u getmefixed npx ts-node prisma/seed.ts
```

### 4. Configurer le service systemd

Créez un fichier de service systemd pour gérer l'application :

```bash
sudo nano /etc/systemd/system/getmefixed-api.service
```

Contenu du fichier :

```
[Unit]
Description=GetMeFixed API
After=network.target postgresql.service redis.service

[Service]
User=getmefixed
WorkingDirectory=/home/getmefixed/app
ExecStart=/usr/bin/npm run start:prod
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=getmefixed-api
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Activez et démarrez le service :

```bash
sudo systemctl enable getmefixed-api
sudo systemctl start getmefixed-api
sudo systemctl status getmefixed-api
```

### 5. Configurer Nginx comme proxy inverse

```bash
# Installer Nginx
sudo apt-get install -y nginx

# Configurer le site
sudo nano /etc/nginx/sites-available/getmefixed-api
```

Contenu du fichier :

```nginx
server {
    listen 80;
    server_name api.votre-domaine.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Activez la configuration :

```bash
sudo ln -s /etc/nginx/sites-available/getmefixed-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Configuration HTTPS

Pour sécuriser votre API en production avec HTTPS, utilisez Let's Encrypt :

### Docker Compose

```bash
# Créer les répertoires pour Certbot
mkdir -p nginx/certbot/conf nginx/certbot/www

# Obtenir un certificat
docker-compose run --rm certbot certonly --webroot -w /var/www/certbot \
  -d api.votre-domaine.com --email votre-email@example.com --agree-tos --no-eff-email

# Ensuite, modifiez nginx/conf.d/default.conf pour décommenter la partie HTTPS
# Redémarrez Nginx
docker-compose restart nginx
```

### Installation manuelle

```bash
# Installer Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Obtenir un certificat avec Nginx
sudo certbot --nginx -d api.votre-domaine.com
```

## Configuration des emails

Pour activer l'envoi d'emails après les paiements, vous devez configurer les variables SMTP dans votre fichier `.env` :

```env
SMTP_HOST=smtp.votre-service.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre-utilisateur
SMTP_PASSWORD=votre-mot-de-passe
EMAIL_FROM=noreply@getmefixed.com
DOCUMENTATION_URL=https://docs.getmefixed.com
```

Assurez-vous d'installer les dépendances nécessaires :

```bash
# Pour Docker, ajoutez-le au Dockerfile
# Pour installation manuelle, exécutez :
npm install --save nodemailer
```

## Surveillance et maintenance

### Logs

Pour accéder aux logs de l'application :

```bash
# Docker Compose
docker-compose logs -f api

# Installation manuelle
sudo journalctl -u getmefixed-api -f
```

### Mise à jour de l'application

#### Docker Compose

```bash
# Récupérer les derniers changements
git pull

# Reconstruire et redémarrer les containers
docker-compose down
docker-compose build
docker-compose up -d
```

#### Installation manuelle

```bash
# Récupérer les derniers changements
cd /home/getmefixed/app
sudo -u getmefixed git pull

# Installer les dépendances et reconstruire
sudo -u getmefixed npm install
sudo -u getmefixed npm run build

# Exécuter les migrations si nécessaire
sudo -u getmefixed npx prisma migrate deploy

# Redémarrer le service
sudo systemctl restart getmefixed-api
```

## Sauvegarde et restauration

### Sauvegarde de la base de données

#### Docker Compose

```bash
# Créer un répertoire pour les sauvegardes
mkdir -p backups

# Sauvegarder la base de données
docker-compose exec postgres pg_dump -U postgres getmefixed > backups/getmefixed_$(date +%Y%m%d).sql
```

#### Installation manuelle

```bash
# Créer un répertoire pour les sauvegardes
mkdir -p /home/getmefixed/backups

# Sauvegarder la base de données
sudo -u postgres pg_dump getmefixed > /home/getmefixed/backups/getmefixed_$(date +%Y%m%d).sql
```

### Restauration de la base de données

#### Docker Compose

```bash
# Restaurer à partir d'une sauvegarde
cat backups/getmefixed_20250301.sql | docker-compose exec -T postgres psql -U postgres getmefixed
```

#### Installation manuelle

```bash
# Restaurer à partir d'une sauvegarde
sudo -u postgres psql getmefixed < /home/getmefixed/backups/getmefixed_20250301.sql
```

## Dépannage

### Problèmes courants

#### L'API ne démarre pas

Vérifiez les logs pour identifier l'erreur :

```bash
# Docker Compose
docker-compose logs api

# Installation manuelle
sudo journalctl -u getmefixed-api -n 100
```

#### Erreurs de connexion à la base de données

Vérifiez l'URL de connexion dans `.env` et assurez-vous que PostgreSQL fonctionne :

```bash
# Docker Compose
docker-compose exec postgres pg_isready

# Installation manuelle
sudo systemctl status postgresql
```

#### Problèmes avec Redis

Vérifiez que Redis est accessible :

```bash
# Docker Compose
docker-compose exec redis redis-cli ping

# Installation manuelle
redis-cli ping
```

#### Erreurs de permission

Pour l'installation manuelle, vérifiez que l'utilisateur `getmefixed` a les permissions nécessaires :

```bash
sudo chown -R getmefixed:getmefixed /home/getmefixed/app
```

#### Les webhooks Stripe ne fonctionnent pas

Assurez-vous que votre API est accessible depuis Internet et que les clés sont correctement configurées.

---

Ce guide couvre les principaux aspects du déploiement de l'API GetMeFixed en production. Adaptez-le selon vos besoins spécifiques et votre environnement d'hébergement. Pour toute assistance supplémentaire, consultez la documentation technique ou contactez l'équipe de développement.