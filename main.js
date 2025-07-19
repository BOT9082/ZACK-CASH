// Définition des jeux disponibles (reste inchangé)
const JEUX = [
    { id: "aviator", nom: "Aviator", icon: "assets/icons/aviator.avif" },
    { id: "crash", nom: "Crash", icon: "assets/icons/crash.avif" },
    { id: "dice", nom: "Dice", icon: "assets/icons/dice.avif" },
    { id: "luckyjet", nom: "Lucky Jet", icon: "assets/icons/luckyjet.avif" },
];

const jeuxTabsNav = document.getElementById("jeux-tabs-nav");
let currentJeuId = null;
let premiumKeyValidated = localStorage.getItem('premiumKeyValidated') === 'true';

// Récupérer l'élément du spinner de chargement
const loadingSpinner = document.getElementById('loading-spinner');
// Récupérer les éléments de la pop-up Premium
const premiumPopupOverlay = document.getElementById('premium-popup-overlay');
const closePopupBtn = document.querySelector('.premium-popup-content .close-popup-btn'); // Sélecteur plus spécifique

// Get the astuce detail modal elements
const astuceDetailModalOverlay = document.getElementById('astuce-detail-modal');
const closeModalBtn = document.querySelector('.astuce-detail-modal-content .close-modal-btn');
const modalAstuceTitre = document.getElementById('modal-astuce-titre');
const modalAstuceDate = document.getElementById('modal-astuce-date');
const modalAstuceContenu = document.getElementById('modal-astuce-contenu');
const modalAstuceAuteur = document.getElementById('modal-astuce-auteur');

// Initialisation de l'animation Anime.js pour le spinner
if (typeof anime !== 'undefined') {
    anime(['#loading-spinner feTurbulence', '#loading-spinner feDisplacementMap'], {
        baseFrequency: .05,
        scale: 15,
        alternate: true,
        loop: true,
        easing: 'linear',
        duration: 2000
    });

    anime('#loading-spinner polygon', {
        points: [
            { value: '64 128 8.574 96 8.574 32 64 0 119.426 32 119.426 96' },
            { value: '64 68.64 8.574 100 63.446 67.68 64 4 64.554 67.68 119.426 100' }
        ],
        alternate: true,
        loop: true,
        easing: 'easeInOutQuad',
        duration: 1500
    });
} else {
    console.error("Anime.js n'est pas chargé. L'animation ne peut pas démarrer.");
}

// Logique pour les boutons d'onglets
JEUX.forEach(jeu => {
    const btn = document.createElement("button");
    btn.className = "jeu-btn";
    btn.innerHTML = `<img src="${jeu.icon}" alt="${jeu.nom}"> <span>${jeu.nom.toUpperCase()}</span>`;
    btn.onclick = () => {
        document.querySelectorAll('.jeu-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        currentJeuId = jeu.id;
        chargerAstuces(jeu);
    };
    jeuxTabsNav.appendChild(btn);
});

// Affichage de la bannière jeu sélectionné
function showBanniere(jeu) {
    document.getElementById("banniere").innerHTML =
        `<div class="banniere">
            <img src="${jeu.icon}" alt="${jeu.nom}">
            <div>${jeu.nom.toUpperCase()}</div>
        </div>`;
}

// Fonction pour charger les astuces (standard et premium)
async function chargerAstuces(jeu) {
    showBanniere(jeu);
    const astucesDiv = document.getElementById("astuces");
    
    // Afficher le spinner au début du chargement
    loadingSpinner.classList.add('show');
    // Effacer le contenu existant avant de charger, sauf le spinner
    astucesDiv.querySelectorAll('.astuce, .no-tips-message, .premium-access-section, .premium-status').forEach(el => el.remove());

    try {
        const classicAstuces = await fetchAstuces(`data/${jeu.id}`);
        const premiumAstuces = await fetchAstuces(`premium-data/${jeu.id}`, true); // Passer `true` pour marquer comme premium

        let allAstuces = classicAstuces.concat(premiumAstuces);
        
        // Tri par date décroissante pour toutes les astuces
        const astucesOrdonnees = allAstuces.filter(Boolean).sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateB - dateA; // Tri par date décroissante
        });

        // Retarder l'affichage des astuces pour que le spinner soit visible un minimum
        await new Promise(resolve => setTimeout(resolve, 500)); // 0.5 seconde de délai

        afficherAstuces(astucesOrdonnees);

        // Afficher l'option Premium si ce n'est pas déjà validé
        if (!premiumKeyValidated) {
            showPremiumAccessOption(jeu);
        } else {
            astucesDiv.insertAdjacentHTML('beforeend', `<div class="premium-status">🔓 Accès Premium activé pour ce jeu !</div>`);
        }

    } catch (e) {
        astucesDiv.insertAdjacentHTML('beforeend', "<div class='error-message'>⚠️ Impossible de charger les astuces pour ce jeu.</div>");
        console.error("Erreur lors du chargement des astuces:", e);
    } finally {
        // Masquer le spinner à la fin, qu'il y ait eu succès ou erreur
        loadingSpinner.classList.remove('show');
    }
}

// Fonction utilitaire pour récupérer les astuces d'un chemin donné
async function fetchAstuces(path, isPremium = false) {
    try {
        const indexUrl = `${path}/index.json`;
        const indexResp = await fetch(indexUrl);
        if (!indexResp.ok) {
            console.warn(`Index non trouvé pour ${path}`);
            return []; // Retourne un tableau vide si l'index n'est pas trouvé
        }
        const fichiers = await indexResp.json();
        const astuces = await Promise.all(fichiers.map(async file => {
            const astuceResp = await fetch(`${path}/${file}`);
            if (!astuceResp.ok) return null;
            const astuce = await astuceResp.json();
            if (isPremium) {
                astuce.premium = true; // Marquer l'astuce comme premium
            }
            return astuce;
        }));
        return astuces.filter(Boolean); // Filtrer les nulls
    } catch (e) {
        console.error(`Erreur lors du fetch des astuces depuis ${path}:`, e);
        return []; // Retourne un tableau vide en cas d'erreur
    }
}

// Function to show the astuce detail modal
function showAstuceDetailModal(astuce) {
    modalAstuceTitre.textContent = astuce.titre;
    modalAstuceDate.textContent = (new Date(astuce.date)).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
    modalAstuceContenu.innerHTML = astuce.contenu.replace(/\n/g,'<br>');
    modalAstuceAuteur.textContent = `Par ${astuce.auteur}`;
    astuceDetailModalOverlay.classList.add('show');
}

// Function to hide the astuce detail modal
function hideAstuceDetailModal() {
    astuceDetailModalOverlay.classList.remove('show'); // CORRECTION APPLIQUÉE ICI
}

// Event listeners for the astuce detail modal
closeModalBtn.onclick = hideAstuceDetailModal;
astuceDetailModalOverlay.addEventListener('click', (event) => {
    if (event.target === astuceDetailModalOverlay) {
        hideAstuceDetailModal(); // Close if clicking outside the content
    }
});

// Affichage des astuces dans la page
function afficherAstuces(astuces) {
    const astucesDiv = document.getElementById("astuces");
    astucesDiv.querySelectorAll('.astuce, .no-tips-message, .premium-status').forEach(el => el.remove());

    if (!astuces.length) {
        astucesDiv.insertAdjacentHTML('beforeend', "<div class='no-tips-message'>Pas encore d'astuces pour ce jeu. Revenez bientôt ! 😊</div>");
        return;
    }
    
    astuces.forEach(astuce => {
        const astuceElement = document.createElement('div');
        astuceElement.className = `astuce ${astuce.premium ? 'astuce-premium' : ''} ${astuce.premium && !premiumKeyValidated ? 'locked' : ''}`;

        if (astuce.premium && !premiumKeyValidated) {
            astuceElement.innerHTML = `
                <div class="lock-overlay">
                    <img src="assets/icons/lock.svg" alt="Verrouillé" class="lock-icon">
                    <p>Astuce Premium</p>
                    <p>Débloquez l'accès pour voir !</p>
                </div>
                <div class="titre">${astuce.titre} <span class="premium-badge">PREMIUM</span></div>
                <div class="date">${(new Date(astuce.date)).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                <div class="contenu blur-content">${astuce.contenu.replace(/\n/g,'<br>')}</div>
                <div class="auteur">Par ${astuce.auteur}</div>
            `;
            // If premium and locked, make it clickable to show the popup
            astuceElement.addEventListener('click', (event) => {
                if (!premiumKeyValidated) {
                    showTelegramPopup();
                }
            });
        } else {
            astuceElement.innerHTML = `
                <div class="titre">${astuce.titre} ${astuce.premium ? '<span class="premium-badge">PREMIUM</span>' : ''}</div>
                <div class="date">${(new Date(astuce.date)).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                <div class="contenu">${astuce.contenu.replace(/\n/g,'<br>')}</div>
                <div class="auteur">Par ${astuce.auteur}</div>
            `;
            // Make the entire astuce card clickable to show details
            astuceElement.style.cursor = 'pointer'; // Indicate it's clickable
            astuceElement.addEventListener('click', () => {
                showAstuceDetailModal(astuce);
            });
        }
        astucesDiv.appendChild(astuceElement);
    });
}

// Fonction pour afficher l'option d'accès Premium
function showPremiumAccessOption(jeu) {
    const astucesDiv = document.getElementById("astuces");
    const existingPremiumSection = document.querySelector('.premium-access-section');

    if (existingPremiumSection) {
        // S'il existe, s'assurer qu'il est visible et non affiché par `display: none`
        existingPremiumSection.style.display = 'block'; // Ou 'flex' selon son CSS initial
        return;
    }

    const premiumSection = document.createElement('div');
    premiumSection.className = 'premium-access-section';
    premiumSection.innerHTML = `
        <div class="premium-prompt">
            🔒 Débloquez plus d'astuces pour ${jeu.nom.toUpperCase()} !
            <button id="showPremiumFormBtn">Voir plus d'astuces (Premium)</button>
        </div>
        <div id="premiumForm" class="premium-form"> <input type="password" id="premiumKeyInput" placeholder="Entrez votre clé Premium">
            <button id="validatePremiumKeyBtn">Valider la clé</button>
            <div id="premiumMessage" class="premium-message"></div>
        </div>
    `;
    astucesDiv.appendChild(premiumSection);

    // Initialement, le formulaire est masqué par CSS et s'affiche avec une classe
    const premiumForm = document.getElementById('premiumForm');
    premiumForm.classList.add('hidden-form'); // Ajout d'une classe pour masquer le formulaire initialement

    document.getElementById('showPremiumFormBtn').onclick = () => {
        premiumForm.classList.remove('hidden-form'); // Enlève la classe pour montrer le formulaire
        document.getElementById('showPremiumFormBtn').style.display = 'none'; // Cache le bouton
        document.getElementById('premiumKeyInput').focus();
    };

    document.getElementById('validatePremiumKeyBtn').onclick = () => validatePremiumKey(jeu);
}

// Fonction pour valider la clé Premium
async function validatePremiumKey(jeu) {
    const keyInput = document.getElementById('premiumKeyInput');
    const messageDiv = document.getElementById('premiumMessage');
    const userKey = keyInput.value.trim();

    if (!userKey) {
        messageDiv.className = 'premium-message error';
        messageDiv.textContent = 'Veuillez entrer une clé.';
        return;
    }

    messageDiv.className = 'premium-message info';
    messageDiv.textContent = 'Vérification de la clé...';

    try {
        const response = await fetch('premium-keys/keys.json');
        if (!response.ok) {
            throw new Error('Fichier de clés Premium introuvable. Vérifiez le chemin et les permissions.');
        }
        const validKeys = await response.json();

        if (validKeys.includes(userKey)) {
            premiumKeyValidated = true;
            localStorage.setItem('premiumKeyValidated', 'true');
            messageDiv.className = 'premium-message success';
            messageDiv.textContent = 'Clé Premium validée ! Rechargement des astuces...';
            
            // Cacher le formulaire et la section premium
            const premiumForm = document.getElementById('premiumForm');
            const premiumAccessSection = document.querySelector('.premium-access-section');
            if (premiumForm) premiumForm.classList.add('hidden-form'); // Cache le formulaire
            if (premiumAccessSection) premiumAccessSection.style.display = 'none'; // Cache toute la section

            setTimeout(() => chargerAstuces(jeu), 1000);
        } else {
            messageDiv.className = 'premium-message error';
            messageDiv.textContent = 'Clé invalide.';
            keyInput.value = '';
            showTelegramPopup(); // Afficher la pop-up en cas de clé invalide
        }
    } catch (error) {
        messageDiv.className = 'premium-message error';
        messageDiv.textContent = 'Erreur lors de la vérification : ' + error.message;
        console.error('Erreur de validation clé Premium:', error);
        showTelegramPopup(); // Afficher la pop-up aussi en cas d'erreur
    }
}

// Fonction pour afficher la pop-up Telegram
function showTelegramPopup() {
    premiumPopupOverlay.classList.add('show');
}

// Fonction pour masquer la pop-up Telegram
function hideTelegramPopup() {
    premiumPopupOverlay.classList.remove('show');
}

// Écouteurs d'événements pour la pop-up
closePopupBtn.onclick = hideTelegramPopup;
premiumPopupOverlay.addEventListener('click', (event) => {
    if (event.target === premiumPopupOverlay) {
        hideTelegramPopup(); // Ferme si on clique en dehors du contenu
    }
});

// Option : charger le 1er jeu au démarrage et le sélectionner
document.addEventListener('DOMContentLoaded', () => {
    if (JEUX.length > 0) {
        const firstButton = jeuxTabsNav.querySelector('.jeu-btn');
        if (firstButton) {
            firstButton.click();
        }
    }
});
