# QCM App

Application web de quiz interactif (QCM) construite avec Next.js + Tailwind CSS. Déployable sur Vercel en un clic.

## Modifier le contenu du quiz

Tout le contenu est dans **`data/qcm.json`**. C'est le seul fichier à modifier pour changer les questions.

### Structure du fichier

```json
{
  "meta": {
    "title": "Titre du quiz affiché en haut de page"
  },
  "questions": [
    {
      "id": 1,
      "question": "Texte de la question",
      "image": null,
      "multiple": false,
      "answers": [
        {
          "id": "A",
          "text": "Texte de la réponse",
          "correct": false,
          "feedback": "Explication affichée après validation"
        }
      ]
    }
  ]
}
```

### Règles

| Champ | Type | Description |
|---|---|---|
| `id` | `number` | Identifiant unique de la question (entier) |
| `question` | `string` | Énoncé de la question |
| `image` | `string \| null` | Nom du fichier image (ex: `"schema.png"`) ou `null` |
| `multiple` | `boolean` | `true` = cases à cocher, `false` = bouton radio |
| `answers[].id` | `string` | Identifiant de la réponse (ex: `"A"`, `"B"`) |
| `answers[].correct` | `boolean` | `true` si cette réponse est correcte |
| `answers[].feedback` | `string` | Explication affichée après validation |

### Ajouter une image

1. Placez le fichier image dans `public/images/` (ex: `public/images/carte.png`)
2. Dans le JSON, renseignez le champ `image` avec le nom du fichier : `"image": "carte.png"`

---

## Lancer en local

```bash
# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm run dev
```

L'app est accessible sur [http://localhost:3000](http://localhost:3000).

---

## Déployer sur Vercel

### Option 1 — Via l'interface Vercel (recommandé)

1. Poussez ce dossier sur un dépôt GitHub (le dossier `app/` est la racine du projet Next.js)
2. Connectez-vous sur [vercel.com](https://vercel.com) et cliquez sur **"Add New Project"**
3. Importez le dépôt GitHub
4. Dans **"Root Directory"**, sélectionnez le dossier `app/` si le projet ne se trouve pas à la racine du repo
5. Vercel détecte automatiquement Next.js — laissez les paramètres par défaut
6. Cliquez sur **"Deploy"**

### Option 2 — Via Vercel CLI

```bash
npm install -g vercel
vercel
```

Suivez les instructions du CLI. Aucune configuration supplémentaire n'est requise — `vercel.json` n'est pas nécessaire pour un projet Next.js standard.

---

## Structure du projet

```
app/
├── app/
│   ├── layout.tsx       # Layout racine (métadonnées)
│   ├── page.tsx         # Page d'accueil (charge le JSON)
│   └── globals.css      # Styles globaux Tailwind
├── components/
│   └── QCMQuiz.tsx      # Composant principal du quiz
├── data/
│   └── qcm.json         # ← CONTENU DU QUIZ (à modifier)
├── public/
│   └── images/          # Images référencées dans le JSON
├── package.json
└── README.md
```
