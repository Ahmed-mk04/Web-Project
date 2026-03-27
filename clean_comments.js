const fs = require('fs');
const path = require('path');

const BASE = 'c:/frontend-project';

// Maps common ===== banner names to simple human comments
const map = {
    'HEADER': 'en-tête',
    'HERO': 'intro',
    'HERO TARIFS': 'titre tarifs',
    'HERO ENSEIGNANT': 'infos enseignant',
    'FOOTER': 'pied de page',
    'ABOUT': 'à propos',
    'SERVICES': 'contenu',
    'CONTACT': 'contact',
    'COURSES': 'Cours',
    'PRICING': 'grille tarifs',
    'PRICING HERO': 'titre tarifs',
    'FONTS': 'polices',
    'COURSE LAYOUT': 'structure page',
    'SIDEBAR': 'menu latéral',
    'MAIN CONTENT': 'contenu principal',
    'VIDEO': 'vidéos',
    'DOCUMENTS': 'fichiers',
    'FORUM': 'forum',
    'QUIZ': 'quiz',
    'RESPONSIVE': 'mobile',
    'ANIMATION': 'animations',
    'FILTRE PAR ENSEIGNANT': 'filtre',
    'LISTE DES COURS': 'cours',
    'FILTRE PAR SPECIALITE': 'filtre',
    'BADGE CLE D\'INSCRIPTION': 'badge',
    'CONTENU DU COURS': 'contenu',
    'MENU LATERAL': 'menu',
    'CONTENU PRINCIPAL': 'contenu',
    'ADD COURSE MODAL': 'modal ajout cours',
    'ADD MODALS': 'modals ajout',
    'EDIT MODALS': 'modals modification',
    'Onglets': 'onglets',
    'Gestion Etudiants': 'étudiants',
    'Gestion Enseignants': 'enseignants',
    'Gestion Cours': 'cours',
    'PROFIL': 'profil',
    'PROFILS': 'profil',
    'Cours 1': 'cours 1',
    'Cours 2': 'cours 2',
    "COURS DE L'ENSEIGNANT": 'ses cours',
    'RENDER': 'affichage',
    'TEACHER VIEW': 'vue enseignant',
    'STUDENT VIEW': 'vue étudiant',
    'TOGGLE': 'interactions',
    'TEACHER ACTIONS': 'actions enseignant',
    'STUDENT SUBMIT': 'soumission étudiant',
    'Css progrssion dashboard': 'progression',
    'enseignant': 'section enseignant',
    'Enseignant': 'section enseignant',
    'profils': 'profil',
    'CONTACT ===': 'contact',
    'PRICING ===': 'tarifs',
    'COURSES ===': 'cours',
    'HERO ENSEIGNANT': 'carte enseignant',
};

function humanize(raw) {
    const key = raw.trim();
    if (map[key]) return map[key];
    if (map[key.toUpperCase()]) return map[key.toUpperCase()];
    return key.toLowerCase();
}

function processFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // <!-- word -->
    content = content.replace(/<!--\s*={2,}\s*(.*?)\s*={2,}\s*-->/g, (m, p1) => {
        changed = true;
        return `<!-- ${humanize(p1)} -->`;
    });

    // /* word */
    content = content.replace(/\/\*\s*={2,}\s*(.*?)\s*={2,}\s*\*\//g, (m, p1) => {
        changed = true;
        return `/* ${humanize(p1)} */`;
    });

    // // word
    content = content.replace(/\/\/\s*={3,}\s*(.*?)\s*={3,}/g, (m, p1) => {
        changed = true;
        return `// ${humanize(p1)}`;
    });

    if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('  updated:', path.basename(filePath));
    }
}

// Walk all HTML, CSS, JS files recursively
function walk(dir, exts) {
    fs.readdirSync(dir).forEach(name => {
        const full = path.join(dir, name);
        const stat = fs.statSync(full);
        if (stat.isDirectory() && !['node_modules', '.git', 'backend'].includes(name)) {
            walk(full, exts);
        } else if (stat.isFile() && exts.includes(path.extname(name).toLowerCase())) {
            processFile(full);
        }
    });
}

console.log('Cleaning comments...');
walk(BASE, ['.html', '.css', '.js']);
console.log('Done!');
