<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Biblio Médicale IA

Une application web moderne pour gérer et analyser des bibliothèques de documents PDF médicaux avec l'intelligence artificielle.

## 🚀 Fonctionnalités

- **Gestion de bibliothèques PDF** : Organisez vos documents médicaux par dossiers
- **Prévisualisation PDF** : Visualisez vos documents directement dans l'application
- **Analyse IA** : Utilisez Gemini AI pour analyser et interroger vos documents
- **Interface moderne** : Design responsive et intuitif
- **Stockage local** : IndexedDB pour la persistance des données
- **API File System Access** : Accès direct aux dossiers de votre système

## 🛠️ Technologies

- **Frontend** : React 18 + TypeScript
- **Build Tool** : Vite 6
- **Styling** : Tailwind CSS
- **PDF Processing** : PDF.js + React-PDF
- **AI Integration** : Google Gemini AI API
- **Database** : IndexedDB + localStorage fallback

## 📦 Installation

### Prérequis
- Node.js 18+ 
- npm ou yarn

### Installation locale
```bash
# Cloner le repository
git clone <your-repo-url>
cd biblio-médicale-ia

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp env.example .env
# Éditer .env et ajouter votre clé API Gemini

# Lancer en mode développement
npm run dev
```

## 🌐 Déploiement sur Netlify

### 1. Préparation du projet
```bash
# Construire le projet
npm run build

# Vérifier que le dossier dist/ est créé
ls dist/
```

### 2. Déploiement automatique via Git

1. **Pousser votre code sur GitHub/GitLab/Bitbucket**
2. **Connecter Netlify à votre repository** :
   - Allez sur [netlify.com](https://netlify.com)
   - Cliquez sur "New site from Git"
   - Sélectionnez votre repository
   - Configurez les paramètres de build :
     - Build command : `npm run build`
     - Publish directory : `dist`
     - Node version : `18`

3. **Configurer les variables d'environnement** :
   - Dans Netlify, allez dans Site settings > Environment variables
   - Ajoutez : `GEMINI_API_KEY` avec votre clé API

4. **Déployer** :
   - Netlify détectera automatiquement les changements
   - Chaque push déclenchera un nouveau déploiement

### 3. Déploiement manuel

1. **Construire le projet** :
   ```bash
   npm run build
   ```

2. **Uploader le dossier dist/** :
   - Allez sur [netlify.com](https://netlify.com)
   - Glissez-déposez le dossier `dist/` sur la zone de déploiement

### 4. Configuration des redirections

Le fichier `netlify.toml` est déjà configuré pour :
- Rediriger toutes les routes vers `index.html` (SPA)
- Définir les en-têtes de sécurité
- Spécifier la version de Node.js

## 🔑 Configuration des variables d'environnement

### Variables requises
- `GEMINI_API_KEY` : Votre clé API Google Gemini AI

### Obtention de la clé Gemini AI
1. Allez sur [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Créez un nouveau projet ou sélectionnez un existant
3. Générez une nouvelle clé API
4. Copiez la clé dans vos variables d'environnement Netlify

## 📱 Utilisation

1. **Créer une bibliothèque** : Cliquez sur "Ajouter une bibliothèque" et sélectionnez un dossier
2. **Parcourir les documents** : Cliquez sur une bibliothèque pour voir ses fichiers
3. **Prévisualiser les PDF** : Cliquez sur un fichier pour l'ouvrir
4. **Analyser avec l'IA** : Utilisez le bouton IA pour interroger vos documents

## 🚨 Résolution des problèmes

### Erreurs de base de données
Si vous rencontrez des erreurs IndexedDB :
- Utilisez le bouton "Réinitialiser la base de données" dans l'interface
- L'application tentera automatiquement de récupérer les données

### Problèmes de déploiement
- Vérifiez que la version de Node.js est 18+
- Assurez-vous que `GEMINI_API_KEY` est configurée
- Vérifiez les logs de build dans Netlify

## 🔒 Sécurité

- L'application utilise l'API File System Access pour un accès sécurisé aux fichiers
- Les données sont stockées localement dans IndexedDB
- Aucune donnée n'est envoyée à des serveurs tiers (sauf pour l'analyse IA)

## 📄 Licence

Ce projet est sous licence MIT.

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
- Signaler des bugs
- Proposer des améliorations
- Soumettre des pull requests

## 📞 Support

Pour toute question ou problème :
- Ouvrez une issue sur GitHub
- Consultez la documentation de l'API File System Access
- Vérifiez la documentation de Google Gemini AI
