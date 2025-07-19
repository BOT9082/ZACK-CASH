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
const modalAstuceFiabilite = document.getElementById('modal-astuce-fiabilite');
const astucesContainer = document.getElementById('astuces');

// Fonction pour afficher le spinner
function showSpinner() {
    loadingSpinner.classList.add('show');
}

// Fonction pour masquer le spinner
function hideSpinner() {
    loadingSpinner.classList.remove('show');
}

// Fonction pour charger les astuces
async function chargerAstuces(jeu) {
    showSpinner();
    currentJeuId = jeu.id; // Met à jour le jeu actuel

    try {
        const response = await fetch(`data/${jeu.id}.json`);
        if (!response.ok) {
            throw new Error(`Erreur de chargement des astuces pour ${jeu.nom}: ${response.statusText}`);
        }
        const astuces = await response.json();

        astucesContainer.innerHTML = ''; // Vide le contenu précédent

        const astucesSection = document.getElementById('astuces');
        const premiumAccessSection = document.querySelector('.premium-access-section');

        // Gérer la visibilité des astuces Standard et de l'accès Premium
        if (!premiumKeyValidated) {
            // Afficher uniquement les astuces Standard
            const standardAstuces = astuces.filter(astuce => astuce.type === 'standard');
            standardAstuces.forEach(astuce => {
                const astuceCard = createAstuceCard(astuce, jeu.id);
                astucesContainer.appendChild(astuceCard);
            });
            premiumAccessSection.style.display = 'block'; // Assure que la section Premium est visible pour la validation
            astucesSection.classList.remove('premium-unlocked');
        } else {
            // Afficher toutes les astuces (Standard et Premium)
            astuces.forEach(astuce => {
                const astuceCard = createAstuceCard(astuce, jeu.id);
                astucesContainer.appendChild(astuceCard);
            });
            premiumAccessSection.style.display = 'none'; // Cache la section de saisie de clé si validée
            astucesSection.classList.add('premium-unlocked');
        }

    } catch (error) {
        console.error("Erreur lors du chargement des astuces:", error);
        astucesContainer.innerHTML = `<p class="error-message">Impossible de charger les astuces pour ${jeu.nom}. Veuillez réessayer plus tard.</p>`;
        const premiumAccessSection = document.querySelector('.premium-access-section');
        premiumAccessSection.style.display = 'block'; // S'assurer que la section premium est visible en cas d'erreur de chargement
    } finally {
        hideSpinner();
    }
}

// Fonction pour créer une carte d'astuce
function createAstuceCard(astuce, jeuId) {
    const card = document.createElement('div');
    card.className = `astuce-card ${astuce.type}`; // Ajoute la classe 'standard' ou 'premium'
    card.dataset.id = astuce.id;
    card.dataset.jeuId = jeuId;

    let fiabiliteText = '';
    let premiumIcon = '';

    if (astuce.type === 'premium') {
        fiabiliteText = 'Fiabilité : 97%';
        premiumIcon = '<img src="assets/icons/premium-icon.png" alt="Premium" class="premium-icon">';
        card.classList.add('premium-locked'); // Ajoute une classe pour le style cadenas
    } else {
        fiabiliteText = 'Fiabilité : 85%';
    }

    card.innerHTML = `
        <div class="card-header">
            <h3>${astuce.titre}</h3>
            ${premiumIcon}
        </div>
        <p class="card-date">Date : ${astuce.date}</p>
        <p class="card-fiabilite">${fiabiliteText}</p>
        <p class="card-apercu">${astuce.contenu.substring(0, 100)}...</p>
        <button class="read-more-btn">Lire la suite</button>
    `;

    // Gestion du clic pour ouvrir la modale de détail
    card.querySelector('.read-more-btn').addEventListener('click', () => {
        if (astuce.type === 'premium' && !premiumKeyValidated) {
            showTelegramPopup();
        } else {
            showAstuceDetail(astuce);
        }
    });

    return card;
}


// Fonction pour afficher le détail de l'astuce dans la modale
function showAstuceDetail(astuce) {
    modalAstuceTitre.textContent = astuce.titre;
    modalAstuceDate.textContent = `Date : ${astuce.date}`;
    modalAstuceContenu.innerHTML = astuce.contenu; // Utilise innerHTML pour les retours à la ligne
    modalAstuceAuteur.textContent = `Auteur : ${astuce.auteur}`;
    modalAstuceFiabilite.textContent = `Fiabilité : ${astuce.type === 'premium' ? '97%' : '85%'}`;
    astuceDetailModalOverlay.classList.add('show');
}

// Écouteurs d'événements pour la modale de détail
closeModalBtn.onclick = () => {
    astuceDetailModalOverlay.classList.remove('show');
};

astuceDetailModalOverlay.addEventListener('click', (event) => {
    if (event.target === astuceDetailModalOverlay) {
        astuceDetailModalOverlay.classList.remove('show');
    }
});


// Générer les onglets des jeux
JEUX.forEach(jeu => {
    const button = document.createElement('button');
    button.className = 'jeu-btn';
    button.dataset.id = jeu.id;
    button.innerHTML = `<img src="${jeu.icon}" alt="${jeu.nom}"> ${jeu.nom}`;
    button.addEventListener('click', () => {
        // Supprime la classe 'active' de tous les boutons
        document.querySelectorAll('.jeu-btn').forEach(btn => btn.classList.remove('active'));
        // Ajoute la classe 'active' au bouton cliqué
        button.classList.add('active');
        chargerAstuces(jeu);
    });
    jeuxTabsNav.appendChild(button);
});

// Gestion de la section d'accès Premium
const premiumAccessSection = document.querySelector('.premium-access-section');
const premiumForm = document.getElementById('premium-form');
const keyInput = document.getElementById('premium-key-input');
const messageDiv = document.getElementById('premium-message');
const unlockPremiumButton = document.getElementById('unlock-premium-btn');

// Vérifie si la clé Premium est déjà validée au chargement
function checkStoredPremiumKey() {
    const storedKey = localStorage.getItem('premiumKey');
    if (storedKey) {
        validatePremiumKey(storedKey, true); // Tente de valider la clé stockée silencieusement
    }
}

// Écouteur pour le bouton "Débloquer l'accès Premium"
unlockPremiumButton.addEventListener('click', () => {
    premiumAccessSection.classList.add('expanded');
    unlockPremiumButton.style.display = 'none'; // Cache le bouton une fois la section étendue
});

// Écouteur pour la soumission du formulaire Premium
premiumForm.addEventListener('submit', (event) => {
    event.preventDefault(); // Empêche le rechargement de la page
    const enteredKey = keyInput.value.trim();
    if (enteredKey) {
        validatePremiumKey(enteredKey);
    } else {
        messageDiv.className = 'premium-message error';
        messageDiv.textContent = 'Veuillez entrer une clé.';
    }
});

// Fonction de validation de la clé Premium
async function validatePremiumKey(key, isStoredCheck = false) {
    messageDiv.textContent = ''; // Réinitialise le message
    messageDiv.className = 'premium-message'; // Réinitialise la classe

    try {
        const response = await fetch('premium-keys/keys.json');
        if (!response.ok) {
            throw new Error(`Impossible de charger les clés Premium: ${response.statusText}`);
        }
        // MODIFICATION ICI POUR LIRE LE NOUVEAU FORMAT JSON
        const keyObjects = await response.json(); 
        const validKeys = keyObjects.map(obj => obj.key); // Extrait seulement les valeurs des clés

        if (validKeys.includes(key)) {
            premiumKeyValidated = true;
            localStorage.setItem('premiumKeyValidated', 'true');
            localStorage.setItem('premiumKey', key); // Stocke la clé validée
            messageDiv.className = 'premium-message success';
            messageDiv.textContent = 'Clé Premium validée ! Accès débloqué.';
            
            // Masquer la section premium et recharger les astuces
            const astucesSection = document.getElementById('astuces');
            premiumAccessSection.style.display = 'none';
            astucesSection.classList.add('premium-unlocked'); // Ajoute la classe pour le style CSS
            
            // Masquer la pop-up Telegram si elle est ouverte
            hideTelegramPopup(); 

            // Recharger les astuces pour le jeu actuel si une clé est validée
            // On utilise currentJeuId pour s'assurer qu'un jeu est sélectionné
            const selectedJeu = JEUX.find(jeu => jeu.id === currentJeuId);
            if (selectedJeu) {
                 // Cache le spinner avant le setTimeout pour éviter un flash
                loadingSpinner.style.display = 'none'; // Temporairement cacher
                setTimeout(() => {
                    loadingSpinner.style.display = ''; // Rétablir après le chargement
                    chargerAstuces(selectedJeu);
                }, 1000); // Délai pour permettre la transition visuelle
            } else {
                // Si aucun jeu n'est sélectionné, charger le premier par défaut
                if (JEUX.length > 0) {
                    const firstButton = jeuxTabsNav.querySelector('.jeu-btn');
                    if (firstButton) {
                        firstButton.click(); // Simule un clic sur le premier bouton
                    }
                }
            }
        } else {
            premiumKeyValidated = false;
            localStorage.removeItem('premiumKeyValidated'); // Supprime l'état si la clé n'est plus valide
            localStorage.removeItem('premiumKey'); // Supprime la clé stockée
            messageDiv.className = 'premium-message error';
            messageDiv.textContent = 'Clé invalide.';
            keyInput.value = ''; // Efface la clé incorrecte
            // Si la validation échoue, s'assurer que la section premium est visible
            premiumAccessSection.style.display = 'block'; 
            const astucesSection = document.getElementById('astuces');
            astucesSection.classList.remove('premium-unlocked'); // Retire la classe de débloquage

            if (!isStoredCheck) { // N'affiche la pop-up que si ce n'est pas une vérification au démarrage
                showTelegramPopup();
            }
        }
    } catch (error) {
        messageDiv.className = 'premium-message error';
        messageDiv.textContent = 'Erreur lors de la vérification : ' + error.message;
        console.error('Erreur de validation clé Premium:', error);
        premiumAccessSection.style.display = 'block'; // S'assurer que la section premium est visible en cas d'erreur
        const astucesSection = document.getElementById('astuces');
        astucesSection.classList.remove('premium-unlocked'); // Retire la classe de débloquage

        if (!isStoredCheck) { // N'affiche la pop-up que si ce n'est pas une vérification au démarrage
            showTelegramPopup();
        }
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
    checkStoredPremiumKey(); // Vérifie la clé stockée après le chargement du DOM
});
