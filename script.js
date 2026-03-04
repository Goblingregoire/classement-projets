// Configuration des projets
const projects = [
    {
        id: 1,
        name: "Site Web E-commerce",
        description: "Développement d'une plateforme de vente en ligne complète"
    },
    {
        id: 2,
        name: "Application Mobile",
        description: "Création d'une app iOS/Android pour les clients"
    },
    {
        id: 3,
        name: "Refonte Infrastructure",
        description: "Modernisation des serveurs et systèmes cloud"
    },
    {
        id: 4,
        name: "Formation Équipe",
        description: "Programme de montée en compétences techniques"
    },
    {
        id: 5,
        name: "Marketing Digital",
        description: "Campagne de promotion sur les réseaux sociaux"
    },
    {
        id: 6,
        name: "Optimisation SEO",
        description: "Amélioration du référencement naturel"
    }
];

// État global
let currentRanking = [...projects];
let draggedElement = null;
let hasSubmitted = false;

// Vérification si l'utilisateur a déjà soumis
function checkSubmissionStatus() {
    const submissionKey = 'hasSubmitted_' + Date.now().toString().slice(0, 8); // Basé sur la journée
    hasSubmitted = localStorage.getItem(submissionKey) === 'true';
    
    if (hasSubmitted) {
        disableForm();
        showAlreadySubmittedMessage();
    }
    
    return submissionKey;
}

// Fonction pour forcer la réinitialisation (appelée depuis l'admin)
function forceResetSubmissions() {
    hasSubmitted = false;
    const formSection = document.querySelector('.form-section');
    const resultsSection = document.getElementById('resultsSection');
    
    // Réactiver le formulaire
    const submitButton = document.querySelector('.btn-primary');
    const projectsContainer = document.getElementById('projectsContainer');
    
    if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Soumettre mon classement';
        submitButton.style.opacity = '1';
        submitButton.style.cursor = 'pointer';
    }
    
    if (projectsContainer) {
        projectsContainer.style.pointerEvents = 'auto';
        projectsContainer.style.opacity = '1';
    }
    
    // Masquer le message de déjà soumis s'il existe
    const existingMessage = document.querySelector('.already-submitted-notice');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Réinitialiser le formulaire
    resetForm();
}

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    initializeProjects();
    setupDragAndDrop();
    setupFormSubmission();
    checkSubmissionStatus();
    
    // Écouter les réinitialisations forcées depuis l'admin
    window.addEventListener('storage', function(e) {
        if (e.key === 'forceReset') {
            forceResetSubmissions();
            localStorage.removeItem('forceReset');
        }
    });
});

// Initialisation des projets
function initializeProjects() {
    const container = document.getElementById('projectsContainer');
    container.innerHTML = '';
    
    currentRanking.forEach((project, index) => {
        const projectElement = createProjectElement(project, index + 1);
        container.appendChild(projectElement);
    });
    
    // Désactiver les boutons de premier/dernier élément
    updateMoveButtons();
}

// Mettre à jour l'état des boutons de déplacement
function updateMoveButtons() {
    const container = document.getElementById('projectsContainer');
    const items = container.querySelectorAll('.project-item');
    
    items.forEach((item, index) => {
        const upBtn = item.querySelector('.move-up-btn');
        const downBtn = item.querySelector('.move-down-btn');
        
        if (upBtn) {
            upBtn.disabled = index === 0;
        }
        if (downBtn) {
            downBtn.disabled = index === items.length - 1;
        }
    });
}

// Création d'un élément projet
function createProjectElement(project, rank) {
    const div = document.createElement('div');
    div.className = 'project-item';
    div.draggable = true;
    div.dataset.projectId = project.id;
    
    div.innerHTML = `
        <div class="project-rank">${rank}</div>
        <div class="project-info">
            <div class="project-name">${project.name}</div>
            <div class="project-description">${project.description}</div>
        </div>
        <div class="project-controls">
            <button class="move-up-btn" onclick="event.preventDefault(); event.stopPropagation(); moveProjectUp(${project.id})" title="Monter">
                ↑
            </button>
            <div class="drag-handle">⋮⋮</div>
            <button class="move-down-btn" onclick="event.preventDefault(); event.stopPropagation(); moveProjectDown(${project.id})" title="Descendre">
                ↓
            </button>
        </div>
    `;
    
    return div;
}

// Fonctions de déplacement alternatives (boutons)
function moveProjectUp(projectId) {
    const container = document.getElementById('projectsContainer');
    const items = Array.from(container.querySelectorAll('.project-item'));
    const currentIndex = items.findIndex(item => parseInt(item.dataset.projectId) === projectId);
    
    if (currentIndex > 0) {
        const currentItem = items[currentIndex];
        const prevItem = items[currentIndex - 1];
        
        container.insertBefore(currentItem, prevItem);
        updateRanking();
        
        // Animation visuelle
        currentItem.style.animation = 'slideUp 0.3s ease';
        setTimeout(() => {
            currentItem.style.animation = '';
        }, 300);
    }
}

function moveProjectDown(projectId) {
    const container = document.getElementById('projectsContainer');
    const items = Array.from(container.querySelectorAll('.project-item'));
    const currentIndex = items.findIndex(item => parseInt(item.dataset.projectId) === projectId);
    
    if (currentIndex < items.length - 1) {
        const currentItem = items[currentIndex];
        const nextItem = items[currentIndex + 1];
        
        container.insertBefore(nextItem, currentItem);
        updateRanking();
        
        // Animation visuelle
        currentItem.style.animation = 'slideDown 0.3s ease';
        setTimeout(() => {
            currentItem.style.animation = '';
        }, 300);
    }
}

// Configuration du drag and drop
function setupDragAndDrop() {
    const container = document.getElementById('projectsContainer');
    
    // Support pour desktop (mouse events)
    container.addEventListener('dragstart', handleDragStart);
    container.addEventListener('dragover', handleDragOver);
    container.addEventListener('drop', handleDrop);
    container.addEventListener('dragend', handleDragEnd);
    
    // Support pour mobile (touch events) - simplifié
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    // Désactiver le drag natif sur mobile pour éviter les conflits
    container.addEventListener('touchmove', function(e) {
        if (touchItem) {
            e.preventDefault();
        }
    }, { passive: false });
}

// Variables pour le touch mobile
let touchItem = null;
let touchOffset = { x: 0, y: 0 };
let touchClone = null;
let touchStartTime = 0;

// Touch events pour mobile - version simplifiée
function handleTouchStart(e) {
    const touch = e.touches[0];
    const target = e.target.closest('.project-item');
    
    if (!target) return;
    
    touchStartTime = Date.now();
    
    // Vérifier si on clique sur un bouton de déplacement
    if (e.target.closest('.move-up-btn') || e.target.closest('.move-down-btn')) {
        return; // Laisser les boutons fonctionner normalement
    }
    
    touchItem = target;
    const rect = target.getBoundingClientRect();
    touchOffset.x = touch.clientX - rect.left;
    touchOffset.y = touch.clientY - rect.top;
    
    // Créer un clone visuel très simple
    touchClone = target.cloneNode(true);
    touchClone.style.cssText = `
        position: fixed;
        top: ${rect.top}px;
        left: ${rect.left}px;
        width: ${rect.width}px;
        height: ${rect.height}px;
        zIndex: 1000;
        opacity: 0.8;
        pointer-events: none;
        background: var(--primary-color);
        border: 2px solid white;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    `;
    
    // Masquer le contenu du clone pour la performance
    const cloneContent = touchClone.querySelector('.project-info');
    if (cloneContent) {
        cloneContent.style.display = 'none';
    }
    
    document.body.appendChild(touchClone);
    
    // Mettre l'original en évidence
    target.style.opacity = '0.4';
    target.style.border = '2px dashed var(--primary-color)';
    
    e.preventDefault();
}

function handleTouchMove(e) {
    if (!touchItem || !touchClone) return;
    
    e.preventDefault();
    
    const touch = e.touches[0];
    touchClone.style.left = `${touch.clientX - touchOffset.x}px`;
    touchClone.style.top = `${touch.clientY - touchOffset.y}px`;
    
    // Trouver l'élément sous le doigt
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    const droppableBelow = elementBelow?.closest('.project-item');
    
    if (droppableBelow && droppableBelow !== touchItem) {
        const container = document.getElementById('projectsContainer');
        
        // Supprimer tous les indicateurs
        document.querySelectorAll('.project-item').forEach(item => {
            item.style.borderTop = '';
            item.style.transform = '';
        });
        
        // Ajouter un indicateur simple
        droppableBelow.style.borderTop = '4px solid var(--primary-color)';
        
        // Insérer avant ou après
        const rect = droppableBelow.getBoundingClientRect();
        if (touch.clientY < rect.top + rect.height / 2) {
            container.insertBefore(touchItem, droppableBelow);
        } else {
            container.insertBefore(touchItem, droppableBelow.nextSibling);
        }
        
        updateRanking();
    }
}

function handleTouchEnd(e) {
    if (!touchItem || !touchClone) return;
    
    e.preventDefault();
    
    // Nettoyer
    if (touchClone) {
        document.body.removeChild(touchClone);
        touchClone = null;
    }
    
    if (touchItem) {
        touchItem.style.opacity = '1';
        touchItem.style.border = '2px solid var(--border-color)';
        touchItem = null;
    }
    
    // Nettoyer les indicateurs
    document.querySelectorAll('.project-item').forEach(item => {
        item.style.borderTop = '';
        item.style.transform = '';
    });
    
    updateRanking();
}

function handleDragStart(e) {
    if (e.target.classList.contains('project-item')) {
        draggedElement = e.target;
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    }
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    const afterElement = getDragAfterElement(e.currentTarget, e.clientY);
    if (afterElement == null) {
        e.currentTarget.appendChild(draggedElement);
    } else {
        e.currentTarget.insertBefore(draggedElement, afterElement);
    }
}

function handleDrop(e) {
    e.preventDefault();
    updateRanking();
}

function handleDragEnd(e) {
    if (e.target.classList.contains('project-item')) {
        e.target.classList.remove('dragging');
    }
    draggedElement = null;
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.project-item:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// Fonctions pour la gestion de la soumission unique
function disableForm() {
    const submitButton = document.querySelector('.btn-primary');
    const projectsContainer = document.getElementById('projectsContainer');
    
    submitButton.disabled = true;
    submitButton.textContent = 'Déjà soumis';
    submitButton.style.opacity = '0.5';
    submitButton.style.cursor = 'not-allowed';
    
    // Désactiver le drag & drop
    projectsContainer.style.pointerEvents = 'none';
    projectsContainer.style.opacity = '0.7';
}

function showAlreadySubmittedMessage() {
    const formSection = document.querySelector('.form-section');
    const message = document.createElement('div');
    message.className = 'already-submitted-notice';
    message.innerHTML = `
        <div style="background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; text-align: center;">
            <strong>⚠️ Vous avez déjà soumis votre classement</strong><br>
            <span style="color: #6b7280;">Une seule soumission est autorisée.</span>
        </div>
    `;
    formSection.insertBefore(message, formSection.querySelector('form'));
}

function markAsSubmitted() {
    const submissionKey = 'hasSubmitted_' + Date.now().toString().slice(0, 8);
    localStorage.setItem(submissionKey, 'true');
}

// Mise à jour du classement
function updateRanking() {
    const container = document.getElementById('projectsContainer');
    const projectElements = container.querySelectorAll('.project-item');
    
    // Mettre à jour les numéros affichés
    projectElements.forEach((element, index) => {
        const rankElement = element.querySelector('.project-rank');
        rankElement.textContent = index + 1;
    });
    
    // Reconstruire le tableau currentRanking dans le bon ordre
    const newRanking = [];
    projectElements.forEach((element, index) => {
        const projectId = parseInt(element.dataset.projectId);
        const project = projects.find(p => p.id === projectId);
        if (project) {
            newRanking.push({
                ...project,
                currentRank: index + 1
            });
        }
    });
    
    currentRanking = newRanking;
    
    // Mettre à jour les boutons de déplacement
    updateMoveButtons();
}

// Configuration du formulaire
function setupFormSubmission() {
    const form = document.getElementById('rankingForm');
    form.addEventListener('submit', handleFormSubmit);
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    // Vérifier si déjà soumis
    if (hasSubmitted) {
        alert('Vous avez déjà soumis votre classement.');
        return;
    }
    
    // S'assurer que le classement est à jour avant la soumission
    updateRanking();
    
    const formData = {
        timestamp: new Date().toISOString(),
        ranking: currentRanking.map((project, index) => ({
            ...project,
            rank: index + 1
        }))
    };
    
    try {
        // Sauvegarde locale (sans téléchargement)
        saveToLocalStorage(formData);
        
        // Envoi par email (simulation)
        await sendEmail(formData);
        
        // Marquer comme soumis
        markAsSubmitted();
        
        // Affichage des résultats
        showResults(formData);
        
    } catch (error) {
        console.error('Erreur lors de la soumission:', error);
        alert('Une erreur est survenue. Veuillez réessayer.');
    }
}

// Sauvegarde locale (sans téléchargement)
function saveToLocalStorage(data) {
    const existingData = localStorage.getItem('projectRankings');
    const rankings = existingData ? JSON.parse(existingData) : [];
    
    rankings.push(data);
    localStorage.setItem('projectRankings', JSON.stringify(rankings));
}

// Envoi par email (simulation)
async function sendEmail(data) {
    // Dans une vraie application, vous utiliseriez un service backend
    // Pour la démo, nous simulons l'envoi
    
    const emailContent = `
        Nouveau classement de priorité soumis anonymement
        
        Date: ${new Date(data.timestamp).toLocaleString('fr-FR')}
        
        Classement:
        ${data.ranking.map(item => `${item.rank}. ${item.name}`).join('\n')}
        
        Données complètes: ${JSON.stringify(data, null, 2)}
    `;
    
    console.log('Email simulé:', emailContent);
    
    // Simulation d'un délai d'envoi
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return true;
}

// Affichage des résultats
function showResults(data) {
    const formSection = document.querySelector('.form-section');
    const resultsSection = document.getElementById('resultsSection');
    const submittedRanking = document.getElementById('submittedRanking');
    
    submittedRanking.innerHTML = `
        <h3>Votre classement enregistré:</h3>
        <ol style="text-align: left; max-width: 400px; margin: 0 auto;">
            ${data.ranking.map(item => `<li><strong>${item.name}</strong></li>`).join('')}
        </ol>
        <p style="margin-top: 1rem; color: #6b7280;">
            Un fichier JSON a été téléchargé avec vos données.
        </p>
    `;
    
    formSection.style.display = 'none';
    resultsSection.style.display = 'block';
    
    // Scroll vers le haut
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Réinitialisation du formulaire
function resetForm() {
    if (hasSubmitted) {
        alert('Impossible de réinitialiser : vous avez déjà soumis votre classement.');
        return;
    }
    
    document.getElementById('rankingForm').reset();
    currentRanking = [...projects];
    initializeProjects();
    
    const formSection = document.querySelector('.form-section');
    const resultsSection = document.getElementById('resultsSection');
    
    formSection.style.display = 'block';
    resultsSection.style.display = 'none';
}

// Fonction utilitaire pour voir tous les classements (admin)
function viewAllRankings() {
    const rankings = localStorage.getItem('projectRankings');
    if (rankings) {
        const data = JSON.parse(rankings);
        console.log('Tous les classements:', data);
        return data;
    }
    return [];
}

// Fonction pour exporter tous les classements
function exportAllRankings() {
    const rankings = viewAllRankings();
    if (rankings.length > 0) {
        const dataStr = JSON.stringify(rankings, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `all_rankings_${Date.now()}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
    } else {
        alert('Aucun classement à exporter');
    }
}

// Raccourcis clavier
document.addEventListener('keydown', function(e) {
    // Ctrl+E pour exporter tous les classements
    if (e.ctrlKey && e.key === 'e') {
        e.preventDefault();
        exportAllRankings();
    }
    
    // Ctrl+R pour réinitialiser
    if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        resetForm();
    }
});
