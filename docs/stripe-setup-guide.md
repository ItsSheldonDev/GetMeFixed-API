# Guide de configuration de Stripe pour GetMeFixed API

Ce guide vous explique comment configurer Stripe pour votre API GetMeFixed afin de permettre les paiements par carte bancaire et la génération automatique de licences.

## Prérequis

- Un compte Stripe (vous pouvez en créer un gratuitement sur [stripe.com](https://stripe.com))
- Votre API GetMeFixed installée et fonctionnelle
- Accès à votre fichier `.env` de configuration

## 1. Créer un compte Stripe

Si vous n'avez pas encore de compte Stripe :

1. Visitez [stripe.com](https://stripe.com) et cliquez sur "Commencer"
2. Remplissez le formulaire d'inscription
3. Confirmez votre adresse email

## 2. Récupérer vos clés API Stripe

Une fois connecté à votre tableau de bord Stripe :

1. Allez dans Développeurs > Clés API
2. Vous verrez deux types de clés : **Publique** et **Secrète**
3. Pour le développement, utilisez les clés de test (`pk_test_...` et `sk_test_...`)
4. Pour la production, utilisez les clés réelles (`pk_live_...` et `sk_live_...`)

## 3. Configurer les variables d'environnement

Ajoutez les clés Stripe dans votre fichier `.env` :

```
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_YourSecretKeyHere
STRIPE_WEBHOOK_SECRET=whsec_YourWebhookSecretHere
```

**Important** : Ne commitez jamais vos clés API réelles dans votre code source. Utilisez les variables d'environnement et ajoutez `.env` à votre fichier `.gitignore`.

## 4. Configurer les webhooks Stripe

Les webhooks permettent à Stripe de notifier votre API lorsqu'un paiement est complété.

### Configuration en développement local

1. Installez l'outil CLI Stripe :
   ```bash
   npm install -g stripe-cli
   ```

2. Connectez-vous avec votre compte Stripe :
   ```bash
   stripe login
   ```

3. Lancez le forwarding vers votre API locale :
   ```bash
   stripe listen --forward-to localhost:3000/api/v1/payments/webhook
   ```

4. L'outil affichera une clé webhook de test. Copiez-la et ajoutez-la à votre fichier `.env` :
   ```
   STRIPE_WEBHOOK_SECRET=whsec_YourTestWebhookSecretHere
   ```

### Configuration en production

1. Dans le tableau de bord Stripe, allez à **Développeurs > Webhooks**
2. Cliquez sur **Ajouter un endpoint**
3. Entrez l'URL de votre API : `https://votre-api.com/api/v1/payments/webhook`
4. Sélectionnez l'événement `checkout.session.completed`
5. Cliquez sur **Ajouter un endpoint**
6. Une fois créé, cliquez sur votre webhook et trouvez "Clé secrète de signature"
7. Cliquez sur "Révéler" et copiez cette clé dans votre fichier `.env` de production :
   ```
   STRIPE_WEBHOOK_SECRET=whsec_YourProductionWebhookSecretHere
   ```

## 5. Créer des produits Stripe (optionnel)

Vous pouvez pré-configurer des produits dans Stripe pour une meilleure gestion :

1. Dans le tableau de bord Stripe, allez à **Produits**
2. Cliquez sur **Ajouter un produit**
3. Créez un produit pour chaque plan de licence (Basic, Professional, Enterprise)
4. Dans chaque produit, notez l'ID du produit et du prix

## 6. Tester l'intégration

Pour tester que l'intégration fonctionne correctement :

1. Assurez-vous que votre API est en cours d'exécution
2. Effectuez une requête vers `/api/v1/payments/create-checkout` avec un planId et un email
3. Vous devriez recevoir une URL de session Stripe
4. Ouvrez cette URL et effectuez un paiement de test avec les informations suivantes :
   - Numéro de carte : `4242 4242 4242 4242`
   - Date d'expiration : n'importe quelle date future
   - CVC : n'importe quels trois chiffres
   - Code postal : n'importe quel code postal valide

5. Une fois le paiement effectué, si les webhooks sont correctement configurés, votre API devrait :
   - Créer automatiquement une licence
   - Envoyer un email avec les détails de la licence

## 7. Dépannage

Si vous rencontrez des problèmes avec l'intégration Stripe :

### Les paiements ne sont pas traités

- Vérifiez les logs de votre API pour les erreurs Stripe
- Assurez-vous que les webhooks sont correctement configurés
- Vérifiez que les plans de licence existent dans votre base de données

### Erreurs d'authentification

- Vérifiez que les clés API sont correctement configurées dans `.env`
- Assurez-vous d'utiliser les bonnes clés (test vs production)

### Emails non envoyés

- Vérifiez que les paramètres SMTP sont correctement configurés
- Regardez dans le dossier `emails` pour voir si les emails ont été enregistrés localement

## 8. Passage en production

Lorsque vous êtes prêt à passer en production :

1. Mettez à jour votre configuration pour utiliser les clés API de production
2. Configurez les webhooks de production comme indiqué précédemment
3. Assurez-vous que votre domaine est vérifié dans Stripe
4. Complétez votre profil commercial dans Stripe pour activer les paiements réels

## Variables d'environnement requises

Résumé des variables d'environnement requises pour Stripe :

```
# Configuration Stripe
STRIPE_SECRET_KEY=sk_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
FRONTEND_URL=https://votre-frontend.com

# Configuration Email (pour les notifications de licence)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-password
EMAIL_FROM=noreply@getmefixed.com
DOCUMENTATION_URL=https://docs.getmefixed.com
```

---

En suivant ce guide, vous disposerez d'une intégration Stripe complète qui permettra à vos clients d'acheter des licences facilement et en toute sécurité, avec génération et envoi automatiques des licences par email.
