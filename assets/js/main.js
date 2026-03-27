document.addEventListener("scroll", () => {
    document.querySelectorAll(".course-card").forEach(card => {
        const pos = card.getBoundingClientRect().top;
        if (pos < window.innerHeight - 100) {
            card.style.opacity = "1";
            card.style.transform = "translateY(0)";
        }
    });
});
// forum js

// Sélection des éléments
const forumForm = document.querySelector('.forum form');
const forumMessages = document.querySelector('.forum-messages');
const userTypeSelect = document.querySelector('.forum form select[name="user_type"]');
const messageInput = document.querySelector('.forum form textarea[name="message"]');

// Tableau pour stocker les messages (front-end seulement)
let messages = [];

// Fonction pour afficher les messages
function renderMessages() {
    forumMessages.innerHTML = ''; // Vider le conteneur
    messages.forEach(msg => {
        const div = document.createElement('div');
        div.classList.add('message');
        div.classList.add(msg.type); // 'etudiant' ou 'enseignant'
        div.innerHTML = `
            <p><strong>${msg.type === 'enseignant' ? '👨‍🏫 Enseignant' : '👨‍🎓 Étudiant'}</strong></p>
            <p>${msg.text}</p>
            <span class="date">${msg.date}</span>
        `;
        forumMessages.appendChild(div);
    });
    forumMessages.scrollTop = forumMessages.scrollHeight; // scroll en bas
}

// Ajouter classe active au menu
const menuLinks = document.querySelectorAll('.course-menu a');
menuLinks.forEach(link => {
    link.addEventListener('click', () => {
        menuLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
    });
});

// onglet actif dans le menu
document.addEventListener("DOMContentLoaded", () => {
    const menuLinks = document.querySelectorAll(".course-menu ul li a");

    menuLinks.forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();

            // Retirer active de tous les liens
            menuLinks.forEach(l => l.classList.remove("active"));

            // Ajouter active au lien cliqué
            link.classList.add("active");

            // Scroll smooth vers la section correspondante
            const targetId = link.getAttribute("href").substring(1); // retire le #
            const targetSection = document.getElementById(targetId);
            if(targetSection) {
                targetSection.scrollIntoView({ behavior: "smooth" });
            }
        });
    });
});

