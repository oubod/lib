<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Medical Library Manager

Une application web moderne pour gérer vos bibliothèques de documents PDF médicaux avec une interface intuitive et des fonctionnalités avancées.

## 🚀 Fonctionnalités

### 📚 Gestion des Bibliothèques
- **Création de bibliothèques** à partir de dossiers locaux
- **Organisation intelligente** des fichiers PDF
- **Recherche et navigation** rapide dans vos documents
- **Interface moderne** avec design responsive

### 💾 Persistance Locale Avancée
- **Sauvegarde automatique** de toutes vos données localement
- **Double sauvegarde** : IndexedDB + localStorage pour une fiabilité maximale
- **Persistance entre sessions** : vos données restent sauvegardées même après fermeture de l'application
- **Récupération automatique** des bibliothèques au redémarrage
- **Système de backup** en couches multiples

### 🔒 Sécurité et Confidentialité
- **Toutes les données restent sur votre appareil** - aucune transmission externe
- **Gestion des permissions** de fichiers sécurisée
- **API File System Access** moderne pour un accès sécurisé aux dossiers

### 🤖 Intelligence Artificielle
- **Intégration Gemini** pour l'analyse de documents PDF
- **Recherche sémantique** dans vos documents
- **Extraction intelligente** d'informations médicales

## 🛠️ Technologies Utilisées

- **Frontend** : React 18 + TypeScript
- **Styling** : Tailwind CSS
- **Stockage** : IndexedDB + localStorage
- **API** : File System Access API
- **IA** : Google Gemini API
- **Build** : Vite

## 📱 Compatibilité

- **Navigateurs modernes** : Chrome 86+, Edge 86+, Firefox 85+
- **Mobile** : Support complet des appareils mobiles
- **Desktop** : Interface optimisée pour ordinateurs
- **PWA** : Installation possible comme application native

## 🚀 Installation et Utilisation

### Prérequis
- Node.js 16+ 
- Un navigateur moderne supportant les APIs File System

### Installation
```bash
# Cloner le repository
git clone [url-du-repo]
cd medical-library-manager

# Installer les dépendances
npm install

# Lancer en mode développement
npm run dev

# Build pour production
npm run build
```

### Utilisation
1. **Ouvrir l'application** dans votre navigateur
2. **Sélectionner un dossier** contenant vos PDF médicaux
3. **Créer votre première bibliothèque** en quelques clics
4. **Naviguer et gérer** vos documents facilement
5. **Vos données sont automatiquement sauvegardées** localement

## 💾 Système de Persistance

### Sauvegarde Automatique
- **IndexedDB** : Stockage principal haute performance
- **localStorage** : Backup de sécurité et compatibilité
- **Métadonnées enrichies** : Suivi des sauvegardes et accès

### Récupération Intelligente
- **Restoration automatique** des bibliothèques au démarrage
- **Gestion des erreurs** avec fallback automatique
- **Reconnexion des dossiers** si nécessaire

### Monitoring de Santé
- **Vérification automatique** de l'intégrité des données
- **Récupération automatique** en cas de corruption
- **Statistiques de persistance** en temps réel

## 🔧 Configuration

### Variables d'Environnement
```bash
# Créer un fichier .env basé sur .env.example
VITE_GEMINI_API_KEY=your_api_key_here
```

### Personnalisation
- **Thèmes** : Support des thèmes sombres/clairs
- **Langues** : Interface en français (extensible)
- **Mise en page** : Adaptative selon la taille d'écran

## 🚨 Dépannage

### Problèmes de Persistance
Si vos données ne persistent pas :
1. **Vérifier la console** pour les erreurs
2. **Utiliser le bouton de réinitialisation** si nécessaire
3. **Vérifier les permissions** du navigateur
4. **Contacter le support** avec les logs d'erreur

### Problèmes de Performance
- **Nettoyer les anciens handles** : Utiliser la fonction de nettoyage
- **Vérifier l'espace disque** : Assurez-vous d'avoir suffisamment d'espace
- **Redémarrer l'application** : Peut résoudre les problèmes de cache

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
- **Signaler des bugs** via les issues
- **Proposer des améliorations** via les pull requests
- **Améliorer la documentation**
- **Ajouter de nouvelles fonctionnalités**

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier LICENSE pour plus de détails.

## 🆘 Support

Pour toute question ou problème :
1. **Consulter la documentation** ci-dessus
2. **Vérifier les issues existantes**
3. **Créer une nouvelle issue** avec les détails du problème
4. **Joindre les logs d'erreur** de la console

---

**Note** : Cette application utilise des technologies web modernes et nécessite un navigateur à jour pour fonctionner correctement. Toutes vos données restent sur votre appareil et ne sont jamais transmises à des serveurs externes.
