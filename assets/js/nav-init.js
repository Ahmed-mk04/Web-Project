// nav-init.js
// Met à jour la barre de navigation selon l'utilisateur connecté
// À inclure sur toutes les pages

(function () {

    // on remonte d'un niveau si on est dans un sous-dossier (cours/, auth/, contact/)
    function rootPrefix() {
        const dir = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'));
        const last = dir.substring(dir.lastIndexOf('/') + 1);
        return ['cours', 'auth', 'contact'].includes(last) ? '../' : './';
    }

    document.addEventListener('DOMContentLoaded', function () {
        const nav = document.querySelector('.nav');
        if (!nav) return;

        const token   = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');

        // on supprime le lien "Accueil" qui ne sert plus
        const accueil = nav.querySelector('.btn-acceuil, a[href*="index.html"]:not(.logo)');
        if (accueil) accueil.remove();

        // le bouton connexion/déconnexion va toujours à la fin avec un petit séparateur
        const loginStatic = nav.querySelector('.btn-login, a[href*="login.html"]');
        if (loginStatic) {
            nav.appendChild(loginStatic);
            loginStatic.style.marginLeft = '20px';
            loginStatic.style.paddingLeft = '20px';
            loginStatic.style.borderLeft = '1px solid rgba(86,36,208,0.25)';
        }

        // si personne n'est connecté, on s'arrête là
        if (!token || !userStr) return;

        let user;
        try { user = JSON.parse(userStr); } catch (e) { return; }

        const role = user.role; // student / teacher / admin
        const root = rootPrefix();
        const currentPage = window.location.pathname.toLowerCase();

        // les liens utiles
        const URLS = {
            cours:   root + 'cours/listecours.html',
            profil:  root + 'profil.html',
            contact: root + 'contact/contact.html',
            tarifs:  root + 'tarifs.html',
            espace:  role === 'admin' ? root + 'dashboard-admin.html' : root + 'enseignant.html',
        };

        // petite fonction utilitaire pour supprimer un lien s'il existe
        function removeIf(cssClass) {
            const el = nav.querySelector('.' + cssClass);
            if (el) el.remove();
        }

        // -- Cours --
        // on le cache si on est déjà sur la page des cours
        const coursEl = nav.querySelector('.btn-cours, a[href*="listecours"]');
        if (coursEl) {
            if (currentPage.includes('listecours.html')) {
                coursEl.remove();
            } else {
                coursEl.href = URLS.cours;
                coursEl.textContent = 'Cours';
            }
        }

        // -- Mon espace / Admin --
        // visible seulement pour les enseignants et admins, et caché si déjà sur la page
        const roleEl = nav.querySelector('.btn-e, a[href*="enseignant.html"], a[href*="dashboard-admin.html"]');
        if (roleEl) {
            if (role === 'admin') {
                if (currentPage.includes('dashboard-admin.html')) {
                    roleEl.remove();
                } else {
                    roleEl.href = URLS.espace;
                    roleEl.textContent = 'Admin';
                }
            } else if (role === 'teacher') {
                if (currentPage.includes('enseignant.html')) {
                    roleEl.remove();
                } else {
                    roleEl.href = URLS.espace;
                    roleEl.textContent = 'Mon espace';
                }
            } else {
                // les étudiants ne voient pas ce lien
                roleEl.remove();
            }
        }

        // -- Contact --
        const contactEl = nav.querySelector('.btn-contact, a[href*="contact"]');
        if (contactEl) {
            contactEl.href = URLS.contact;
            contactEl.textContent = 'Contact';
        }

        // -- Abonnements --
        // visible seulement pour les étudiants, et caché sur la page abonnements elle-même
        if (role === 'student' && !currentPage.includes('tarifs.html')) {
            let aboEl = nav.querySelector('.btn-tarifs, a[href*="tarifs.html"]');
            if (!aboEl) {
                // on l'insère juste avant le bouton connexion
                const loginRef = nav.querySelector('.btn-login, a[href*="login.html"]');
                aboEl = document.createElement('a');
                aboEl.className = 'btn-tarifs';
                aboEl.style.textDecoration = 'none';
                if (loginRef) loginRef.insertAdjacentElement('beforebegin', aboEl);
                else nav.appendChild(aboEl);
            }
            aboEl.href = URLS.tarifs;
            aboEl.textContent = 'Abonnements';
        } else {
            removeIf('btn-tarifs');
        }

        // -- Profil --
        // caché sur la page profil elle-même, toujours juste avant "Se déconnecter" sinon
        if (currentPage.includes('profil.html')) {
            removeIf('btn-profile');
        } else {
            let profilEl = nav.querySelector('.btn-profile, a[href*="profil.html"]');
            const loginRef = nav.querySelector('.btn-login, a[href*="login.html"]');
            if (!profilEl) {
                profilEl = document.createElement('a');
                profilEl.className = 'btn-profile';
                profilEl.style.textDecoration = 'none';
                if (loginRef) loginRef.insertAdjacentElement('beforebegin', profilEl);
                else nav.appendChild(profilEl);
            } else {
                // on le remet juste avant le bouton de déconnexion si ce n'est pas déjà le cas
                if (loginRef && profilEl.nextElementSibling !== loginRef) {
                    loginRef.insertAdjacentElement('beforebegin', profilEl);
                }
            }
            profilEl.href = URLS.profil;
            profilEl.textContent = 'Profil';
        }

        // -- Se déconnecter --
        // toujours à la fin, on remplace "Se connecter" par "Se déconnecter"
        const loginBtn = nav.querySelector('.btn-login, a[href*="login.html"]');
        if (loginBtn) {
            nav.appendChild(loginBtn);
            if (!loginBtn.dataset.logoutBound) {
                loginBtn.dataset.logoutBound = '1';
                loginBtn.href = '#';
                loginBtn.textContent = 'Se déconnecter';
                loginBtn.addEventListener('click', function (e) {
                    e.preventDefault();
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = root + 'auth/login.html';
                });
            }
        }
    });
})();
