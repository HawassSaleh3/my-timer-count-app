// ===== app.js - Main Application Module =====

import { initI18n, setLanguage, getCurrentLanguage, toggleLanguage, initLanguageSelector, updateElementText, translate } from './i18n.js';
import { initDB, createExercise, getAllExercises, getExerciseById, updateExercise, deleteExercise, deleteAllExercises, storeVideo, getVideoByExerciseId, deleteVideo } from './storage.js';
import { initNotifications, showToast, showConfirmation, showLocalizedToast, showLocalizedConfirmation, enableSounds, isSoundEnabled } from './notifications.js';
import { initVideo, setTrainingVideoSource, setVideoPlaybackMode, getVideoPlaybackMode, cleanupVideoResources, getVideoModeFromForm, setVideoModeInForm, saveVideoForExercise, removeVideoFromExercise } from './video.js';
import { initTimer, configureTraining, startTimer, pauseTimer, resumeTimer, stopTimer, restartTimer, getTimerState, setOnStateChange, setOnTimeUpdate, setOnRoundComplete, setOnSessionComplete, updateStartPauseButton, TimerState } from './timer.js';

// ===== Application State =====
let currentPage = 'home';
let currentExerciseId = null;
let isEditing = false;
let exercises = [];

// ===== DOM Elements =====
const pages = {};
const navLinks = {};

// ===== Initialize Application =====
async function initApp() {
    // Initialize modules
    await initDB();
    initI18n();
    initNotifications();
    initVideo();
    initTimer();
    
    // Cache DOM elements
    cacheDOMElements();
    
    // Setup navigation
    setupNavigation();
    
    // Setup event listeners
    setupEventListeners();
    
    // Load exercises
    await loadExercises();
    
    // Initialize language selector
    initLanguageSelector();
    
    // Setup timer callbacks
    setupTimerCallbacks();
    
    // Update UI
    updateUI();
    
    // Request persistent storage
    try {
        if (navigator.storage && navigator.storage.persist) {
            await navigator.storage.persist();
        }
    } catch (error) {
        console.warn('Persistent storage not granted:', error);
    }
    
    // Register service worker
    registerServiceWorker();
}

// ===== Cache DOM Elements =====
function cacheDOMElements() {
    // Pages
    pages.home = document.getElementById('pageHome');
    pages.createExercise = document.getElementById('pageCreateExercise');
    pages.exerciseDetails = document.getElementById('pageExerciseDetails');
    pages.training = document.getElementById('pageTraining');
    pages.sessionComplete = document.getElementById('pageSessionComplete');
    pages.settings = document.getElementById('pageSettings');
    
    // Navigation
    navLinks.home = document.getElementById('navHome');
    navLinks.settings = document.getElementById('navSettings');
    
    // Other elements
    const exerciseLibrary = document.getElementById('exerciseLibrary');
    const emptyState = document.getElementById('emptyState');
    
    if (exerciseLibrary) {
        exerciseLibrary.addEventListener('click', handleExerciseClick);
    }
}

// ===== Setup Navigation =====
function setupNavigation() {
    // Sidebar menu toggle
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const closeSidebar = document.getElementById('closeSidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.add('open');
            if (sidebarOverlay) {
                sidebarOverlay.classList.add('active');
            }
        });
    }
    
    if (closeSidebar && sidebar) {
        closeSidebar.addEventListener('click', () => {
            sidebar.classList.remove('open');
            if (sidebarOverlay) {
                sidebarOverlay.classList.remove('active');
            }
        });
    }
    
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            sidebarOverlay.classList.remove('active');
        });
    }
    
    // Navigation links
    if (navLinks.home) {
        navLinks.home.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo('home');
            closeMobileMenu();
        });
    }
    
    if (navLinks.settings) {
        navLinks.settings.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo('settings');
            closeMobileMenu();
        });
    }
    
    // Language toggle
    const langToggle = document.getElementById('langToggle');
    if (langToggle) {
        langToggle.addEventListener('click', () => {
            toggleLanguage();
            closeMobileMenu();
        });
    }
    
    // Back buttons
    const backButtons = document.querySelectorAll('[data-action="back"]');
    backButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            navigateBack();
        });
    });
}

// ===== Close Mobile Menu =====
function closeMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    
    if (sidebar) {
        sidebar.classList.remove('open');
    }
    if (sidebarOverlay) {
        sidebarOverlay.classList.remove('active');
    }
}

// ===== Setup Event Listeners =====
function setupEventListeners() {
    // Add exercise button
    const addExerciseBtn = document.getElementById('addExerciseBtn');
    const addFirstExerciseBtn = document.getElementById('addFirstExercise');
    
    if (addExerciseBtn) {
        addExerciseBtn.addEventListener('click', () => {
            navigateTo('create-exercise');
        });
    }
    
    if (addFirstExerciseBtn) {
        addFirstExerciseBtn.addEventListener('click', () => {
            navigateTo('create-exercise');
        });
    }
    
    // Form submission
    const exerciseForm = document.getElementById('exerciseForm');
    if (exerciseForm) {
        exerciseForm.addEventListener('submit', handleFormSubmit);
    }
    
    // Cancel button
    const cancelBtn = document.getElementById('cancelCreate');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            navigateTo('home');
        });
    }
    
    // Edit exercise button
    const editBtn = document.getElementById('editExerciseBtn');
    if (editBtn) {
        editBtn.addEventListener('click', () => {
            if (currentExerciseId) {
                editExercise(currentExerciseId);
            }
        });
    }
    
    // Delete exercise button
    const deleteBtn = document.getElementById('deleteExerciseBtn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            if (currentExerciseId) {
                confirmDeleteExercise(currentExerciseId);
            }
        });
    }
    
    // Start training button
    const startTrainingBtn = document.getElementById('startTrainingBtn');
    if (startTrainingBtn) {
        startTrainingBtn.addEventListener('click', () => {
            if (currentExerciseId) {
                startTraining(currentExerciseId);
            }
        });
    }
    
    // Training controls
    const startPauseBtn = document.getElementById('startPauseBtn');
    const stopBtn = document.getElementById('stopTrainingBtn');
    const restartBtn = document.getElementById('restartTrainingBtn');
    
    if (startPauseBtn) {
        startPauseBtn.addEventListener('click', () => {
            const state = getTimerState();
            if (state === TimerState.PAUSED) {
                resumeTimer();
            } else if (state === TimerState.READY || state === TimerState.FINISHED) {
                startTimer();
            } else {
                pauseTimer();
            }
        });
    }
    
    if (stopBtn) {
        stopBtn.addEventListener('click', () => {
            confirmStopTraining();
        });
    }
    
    if (restartBtn) {
        restartBtn.addEventListener('click', () => {
            restartTimer();
        });
    }
    
    // Sound toggle
    const soundToggle = document.getElementById('trainingSoundToggle');
    if (soundToggle) {
        soundToggle.addEventListener('click', () => {
            const soundEnabled = !isSoundEnabled();
            enableSounds(soundEnabled);
            updateSoundIcon(soundEnabled);
        });
    }
    
    // Session complete buttons
    const repeatBtn = document.getElementById('repeatSessionBtn');
    const returnHomeBtn = document.getElementById('returnToHomeBtn');
    
    if (repeatBtn) {
        repeatBtn.addEventListener('click', () => {
            if (currentExerciseId) {
                restartTraining(currentExerciseId);
            }
        });
    }
    
    if (returnHomeBtn) {
        returnHomeBtn.addEventListener('click', () => {
            navigateTo('home');
        });
    }
    
    // Clear data button
    const clearDataBtn = document.getElementById('clearDataBtn');
    if (clearDataBtn) {
        clearDataBtn.addEventListener('click', () => {
            confirmClearData();
        });
    }
}

// ===== Setup Timer Callbacks =====
function setupTimerCallbacks() {
    // State change callback
    setOnStateChange((state) => {
        updateStartPauseButton();
        
        // Update video based on state
        switch (state) {
            case TimerState.WORK:
                // Video should play
                break;
            case TimerState.REST:
                // Video should pause
                break;
            case TimerState.PAUSED:
                // Video should pause
                break;
            case TimerState.FINISHED:
                // Navigate to completion page
                navigateTo('session-complete');
                break;
        }
        
        // Update UI
        updateTrainingUI();
    });
    
    // Session complete callback
    setOnSessionComplete((stats) => {
        // Store stats for display on completion page
        const summaryExerciseName = document.getElementById('summaryExerciseName');
        const summaryCompletedRounds = document.getElementById('summaryCompletedRounds');
        const summaryTotalWork = document.getElementById('summaryTotalWork');
        const summaryTotalRest = document.getElementById('summaryTotalRest');
        const summaryTotalSession = document.getElementById('summaryTotalSession');
        
        if (summaryExerciseName) {
            const exercise = exercises.find(e => e.id === currentExerciseId);
            if (exercise) {
                summaryExerciseName.textContent = exercise.name;
            }
        }
        
        if (summaryCompletedRounds) {
            summaryCompletedRounds.textContent = stats.completedRounds;
        }
        
        if (summaryTotalWork) {
            summaryTotalWork.textContent = formatDuration(stats.totalWorkTime);
        }
        
        if (summaryTotalRest) {
            summaryTotalRest.textContent = formatDuration(stats.totalRestTime);
        }
        
        if (summaryTotalSession) {
            summaryTotalSession.textContent = formatDuration(stats.totalSessionTime);
        }
        
        // Play completion sound
        if (isSoundEnabled()) {
            // Will be played by timer module
        }
    });
}

// ===== Format Duration =====
function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ===== Update Sound Icon =====
function updateSoundIcon(enabled) {
    const soundIcon = document.getElementById('soundIcon');
    const soundToggle = document.getElementById('trainingSoundToggle');
    
    if (soundIcon) {
        if (enabled) {
            soundIcon.innerHTML = `
                <path d="M11 5L6 9H2v6h4l5 4V9z"></path>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
            `;
            soundToggle.classList.remove('sound-off');
        } else {
            soundIcon.innerHTML = `
                <line x1="1" y1="1" x2="23" y2="23"></line>
            `;
            soundToggle.classList.add('sound-off');
        }
    }
}

// ===== Navigate To Page =====
function navigateTo(page) {
    // Hide all pages
    Object.values(pages).forEach(p => {
        if (p) p.classList.remove('active');
    });
    
    // Show target page
    switch (page) {
        case 'home':
            if (pages.home) pages.home.classList.add('active');
            currentPage = 'home';
            break;
        case 'create-exercise':
            if (pages.createExercise) pages.createExercise.classList.add('active');
            currentPage = 'create-exercise';
            prepareCreateExercisePage();
            break;
        case 'exercise-details':
            if (pages.exerciseDetails) pages.exerciseDetails.classList.add('active');
            currentPage = 'exercise-details';
            break;
        case 'training':
            if (pages.training) pages.training.classList.add('active');
            currentPage = 'training';
            break;
        case 'session-complete':
            if (pages.sessionComplete) pages.sessionComplete.classList.add('active');
            currentPage = 'session-complete';
            break;
        case 'settings':
            if (pages.settings) pages.settings.classList.add('active');
            currentPage = 'settings';
            break;
    }
    
    // Update nav links
    updateNavLinks();
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== Navigate Back =====
function navigateBack() {
    switch (currentPage) {
        case 'create-exercise':
        case 'exercise-details':
        case 'settings':
            navigateTo('home');
            break;
        case 'training':
            // Stop timer and go back
            stopTimer();
            cleanupVideoResources();
            navigateTo('exercise-details');
            break;
        case 'session-complete':
            navigateTo('home');
            break;
        default:
            navigateTo('home');
            break;
    }
}

// ===== Update Navigation Links =====
function updateNavLinks() {
    Object.values(navLinks).forEach(link => {
        if (link) {
            link.classList.remove('active');
        }
    });
    
    switch (currentPage) {
        case 'home':
            if (navLinks.home) navLinks.home.classList.add('active');
            break;
        case 'settings':
            if (navLinks.settings) navLinks.settings.classList.add('active');
            break;
    }
}

// ===== Load Exercises =====
async function loadExercises() {
    try {
        exercises = await getAllExercises();
        renderExercises();
    } catch (error) {
        console.error('Failed to load exercises:', error);
        showLocalizedToast('storageError', 'error');
    }
}

// ===== Render Exercises =====
function renderExercises() {
    const exerciseLibrary = document.getElementById('exerciseLibrary');
    const emptyState = document.getElementById('emptyState');
    
    if (!exerciseLibrary) return;
    
    if (exercises.length === 0) {
        // Show empty state
        if (emptyState) {
            emptyState.style.display = 'block';
        }
        exerciseLibrary.innerHTML = '';
        return;
    }
    
    // Hide empty state
    if (emptyState) {
        emptyState.style.display = 'none';
    }
    
    // Clear existing exercises
    exerciseLibrary.innerHTML = '';
    
    // Render each exercise
    exercises.forEach(exercise => {
        const card = createExerciseCard(exercise);
        exerciseLibrary.appendChild(card);
    });
}

// ===== Create Exercise Card =====
function createExerciseCard(exercise) {
    const card = document.createElement('div');
    card.className = 'exercise-card';
    card.dataset.exerciseId = exercise.id;
    
    const categoryText = exercise.category || translate('categoryNone');
    
    card.innerHTML = `
        <div class="exercise-card-header">
            <div class="exercise-card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
                    <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
                    <line x1="6" y1="1" x2="6" y2="4"></line>
                    <line x1="10" y1="1" x2="10" y2="4"></line>
                    <line x1="14" y1="1" x2="14" y2="4"></line>
                </svg>
            </div>
            <div class="exercise-card-info">
                <h3>${escapeHtml(exercise.name)}</h3>
                <p>${escapeHtml(exercise.description || '')}</p>
            </div>
        </div>
        <div class="exercise-card-settings">
            <span class="setting-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12,6 12,12 16,14"></polyline>
                </svg>
                ${formatDuration(exercise.workDuration)}
            </span>
            <span class="setting-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2v4"></path>
                    <path d="M12 18v4"></path>
                    <path d="M4.93 4.93l2.83 2.83"></path>
                    <path d="M16.24 16.24l2.83 2.83"></path>
                    <path d="M2 12h4"></path>
                    <path d="M18 12h4"></path>
                    <path d="M4.93 19.07l2.83-2.83"></path>
                    <path d="M16.24 7.76l2.83-2.83"></path>
                </svg>
                ${exercise.rounds}
            </span>
            <span class="setting-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"></path>
                    <path d="M12 6v6l4 2"></path>
                </svg>
                ${formatDuration(exercise.restDuration)}
            </span>
        </div>
    `;
    
    return card;
}

// ===== Escape HTML =====
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== Handle Exercise Click =====
function handleExerciseClick(e) {
    const card = e.target.closest('.exercise-card');
    if (card) {
        const exerciseId = card.dataset.exerciseId;
        if (exerciseId) {
            showExerciseDetails(exerciseId);
        }
    }
}

// ===== Show Exercise Details =====
async function showExerciseDetails(exerciseId) {
    try {
        const exercise = await getExerciseById(exerciseId);
        if (!exercise) {
            showLocalizedToast('storageError', 'error');
            return;
        }
        
        currentExerciseId = exerciseId;
        isEditing = false;
        
        // Update page title
        const title = document.getElementById('exerciseDetailsTitle');
        if (title) {
            title.textContent = exercise.name;
        }
        
        // Update details
        const detailName = document.getElementById('detailName');
        const detailCategory = document.getElementById('detailCategory');
        const detailDescription = document.getElementById('detailDescription');
        const detailWorkDuration = document.getElementById('detailWorkDuration');
        const detailRounds = document.getElementById('detailRounds');
        const detailRestDuration = document.getElementById('detailRestDuration');
        const detailPrepCountdown = document.getElementById('detailPrepCountdown');
        const detailSound = document.getElementById('detailSound');
        const detailVideoMode = document.getElementById('detailVideoMode');
        
        if (detailName) detailName.textContent = exercise.name;
        if (detailCategory) detailCategory.textContent = exercise.category || translate('categoryNone');
        if (detailDescription) {
            detailDescription.textContent = exercise.description || translate('detailDescription');
        }
        
        if (detailWorkDuration) detailWorkDuration.textContent = `${formatDuration(exercise.workDuration)}`;
        if (detailRounds) detailRounds.textContent = exercise.rounds;
        if (detailRestDuration) detailRestDuration.textContent = `${formatDuration(exercise.restDuration)}`;
        if (detailPrepCountdown) detailPrepCountdown.textContent = `${exercise.preparationCountdown}s`;
        if (detailSound) detailSound.textContent = exercise.soundEnabled ? translate('soundOn') : translate('soundOff');
        if (detailVideoMode) detailVideoMode.textContent = exercise.videoMode === 'loop' ? translate('loopModeText') : translate('onceModeText');
        
        // Load video if exists
        const videoContainer = document.getElementById('detailsVideoContainer');
        const detailsVideo = document.getElementById('detailsVideo');
        const noVideoText = document.getElementById('noVideoText');
        
        if (detailsVideo && videoContainer && noVideoText) {
            if (exercise.videoId) {
                const video = await getVideoByExerciseId(exercise.id);
                if (video && video.blobUrl) {
                    detailsVideo.src = video.blobUrl;
                    detailsVideo.style.display = 'block';
                    noVideoText.style.display = 'none';
                } else {
                    detailsVideo.style.display = 'none';
                    noVideoText.style.display = 'block';
                }
            } else {
                detailsVideo.style.display = 'none';
                noVideoText.style.display = 'block';
            }
        }
        
        navigateTo('exercise-details');
    } catch (error) {
        console.error('Failed to show exercise details:', error);
        showLocalizedToast('storageError', 'error');
    }
}

// ===== Prepare Create Exercise Page =====
function prepareCreateExercisePage() {
    // Reset form
    const form = document.getElementById('exerciseForm');
    if (form) {
        form.reset();
    }
    
    // Clear video preview
    const previewContainer = document.getElementById('videoPreview');
    const placeholder = document.getElementById('uploadPlaceholder');
    const previewVideo = document.getElementById('previewVideo');
    
    if (previewContainer && placeholder) {
        previewContainer.style.display = 'none';
        placeholder.style.display = 'block';
    }
    
    if (previewVideo) {
        const blobUrl = previewVideo.getAttribute('data-blob-url');
        if (blobUrl) {
            URL.revokeObjectURL(blobUrl);
            previewVideo.removeAttribute('data-blob-url');
        }
        previewVideo.src = '';
    }
    
    // Clear file input
    const fileInput = document.getElementById('videoFileInput');
    if (fileInput) {
        fileInput.value = '';
    }
    
    // Update title
    const title = document.getElementById('createExerciseTitle');
    if (title) {
        title.textContent = isEditing ? translate('editExerciseTitle') : translate('createExerciseTitle');
    }
    
    // Update button text
    const saveBtn = document.getElementById('saveExerciseBtn');
    if (saveBtn) {
        saveBtn.textContent = isEditing ? translate('saveExerciseText') : translate('saveExerciseText');
    }
}

// ===== Edit Exercise =====
async function editExercise(exerciseId) {
    try {
        const exercise = await getExerciseById(exerciseId);
        if (!exercise) {
            showLocalizedToast('storageError', 'error');
            return;
        }
        
        currentExerciseId = exerciseId;
        isEditing = true;
        
        // Set form values
        const form = document.getElementById('exerciseForm');
        if (!form) return;
        
        const nameInput = document.getElementById('exerciseName');
        const descriptionInput = document.getElementById('exerciseDescription');
        const categorySelect = document.getElementById('exerciseCategory');
        const workDurationInput = document.getElementById('workDuration');
        const restDurationInput = document.getElementById('restDuration');
        const roundsInput = document.getElementById('rounds');
        const prepCountdownInput = document.getElementById('preparationCountdown');
        const soundEnabledInput = document.getElementById('soundEnabled');
        
        if (nameInput) nameInput.value = exercise.name;
        if (descriptionInput) descriptionInput.value = exercise.description || '';
        if (categorySelect) categorySelect.value = exercise.category || '';
        if (workDurationInput) workDurationInput.value = exercise.workDuration;
        if (restDurationInput) restDurationInput.value = exercise.restDuration;
        if (roundsInput) roundsInput.value = exercise.rounds;
        if (prepCountdownInput) prepCountdownInput.value = exercise.preparationCountdown;
        if (soundEnabledInput) soundEnabledInput.checked = exercise.soundEnabled;
        
        // Set video mode
        setVideoModeInForm(exercise.videoMode || 'loop');
        
        // Load video preview if exists
        if (exercise.videoId) {
            const video = await getVideoByExerciseId(exercise.id);
            if (video && video.blobUrl) {
                const previewVideo = document.getElementById('previewVideo');
                const previewContainer = document.getElementById('videoPreview');
                const placeholder = document.getElementById('uploadPlaceholder');
                const videoName = document.getElementById('videoName');
                const videoSize = document.getElementById('videoSize');
                
                if (previewVideo && previewContainer && placeholder) {
                    previewVideo.src = video.blobUrl;
                    previewVideo.load();
                    previewContainer.style.display = 'block';
                    placeholder.style.display = 'none';
                    
                    if (videoName) videoName.textContent = video.name;
                    if (videoSize) videoSize.textContent = formatFileSize(video.size);
                    
                    // Store blob URL for cleanup
                    const oldBlobUrl = previewVideo.getAttribute('data-blob-url');
                    if (oldBlobUrl) {
                        URL.revokeObjectURL(oldBlobUrl);
                    }
                    previewVideo.setAttribute('data-blob-url', video.blobUrl);
                }
            }
        }
        
        navigateTo('create-exercise');
    } catch (error) {
        console.error('Failed to edit exercise:', error);
        showLocalizedToast('storageError', 'error');
    }
}

// ===== Format File Size =====
function formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// ===== Handle Form Submit =====
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    
    // Validate form
    const name = formData.get('exerciseName');
    const workDuration = parseInt(formData.get('workDuration'));
    const rounds = parseInt(formData.get('rounds'));
    
    if (!name || name.trim() === '') {
        showLocalizedToast('nameError', 'error');
        return;
    }
    
    if (isNaN(workDuration) || workDuration < 1) {
        showLocalizedToast('workDurationError', 'error');
        return;
    }
    
    if (isNaN(rounds) || rounds < 1) {
        showLocalizedToast('roundsError', 'error');
        return;
    }
    
    // Get video mode
    const videoMode = getVideoModeFromForm();
    
    // Prepare exercise data
    const exerciseData = {
        name: name.trim(),
        description: formData.get('exerciseDescription') || '',
        category: formData.get('exerciseCategory') || '',
        workDuration: workDuration,
        restDuration: parseInt(formData.get('restDuration')) || 0,
        rounds: rounds,
        videoMode: videoMode,
        soundEnabled: formData.get('soundEnabled') === 'on',
        preparationCountdown: parseInt(formData.get('preparationCountdown')) || 0,
        videoId: null
    };
    
    try {
        // Handle video upload
        const fileInput = document.getElementById('videoFileInput');
        let video = null;
        
        if (fileInput && fileInput.files.length > 0) {
            video = await saveVideoForExercise(fileInput.files[0], currentExerciseId || '');
            if (video) {
                exerciseData.videoId = video.id;
            }
        } else if (isEditing && currentExerciseId) {
            // Keep existing video if not changed
            const existingExercise = await getExerciseById(currentExerciseId);
            if (existingExercise && existingExercise.videoId) {
                exerciseData.videoId = existingExercise.videoId;
            }
        }
        
        // Save exercise
        if (isEditing && currentExerciseId) {
            // Update existing exercise
            await updateExercise(currentExerciseId, exerciseData);
            showLocalizedToast('exerciseUpdated');
        } else {
            // Create new exercise
            const newExercise = await createExercise(exerciseData);
            currentExerciseId = newExercise.id;
            showLocalizedToast('exerciseSaved');
        }
        
        // Reload exercises
        await loadExercises();
        
        // Navigate back
        navigateTo('home');
        
        // Reset state
        isEditing = false;
        currentExerciseId = null;
    } catch (error) {
        console.error('Failed to save exercise:', error);
        showLocalizedToast('storageError', 'error');
    }
}

// ===== Confirm Delete Exercise =====
async function confirmDeleteExercise(exerciseId) {
    try {
        const exercise = await getExerciseById(exerciseId);
        if (!exercise) return;
        
        const confirmed = await showLocalizedConfirmation(
            'confirmTitle',
            'confirmDeleteExercise',
            { name: exercise.name }
        );
        
        if (confirmed) {
            await deleteExercise(exerciseId);
            showLocalizedToast('exerciseDeleted');
            await loadExercises();
            navigateTo('home');
        }
    } catch (error) {
        console.error('Failed to delete exercise:', error);
        showLocalizedToast('storageError', 'error');
    }
}

// ===== Start Training =====
async function startTraining(exerciseId) {
    try {
        const exercise = await getExerciseById(exerciseId);
        if (!exercise) {
            showLocalizedToast('storageError', 'error');
            return;
        }
        
        currentExerciseId = exerciseId;
        
        // Configure timer
        configureTraining({
            workDuration: exercise.workDuration,
            restDuration: exercise.restDuration,
            rounds: exercise.rounds,
            preparationCountdown: exercise.preparationCountdown,
            soundEnabled: exercise.soundEnabled,
            videoMode: exercise.videoMode
        });
        
        // Set video source
        await setTrainingVideoSource(exerciseId);
        
        // Update training page
        const trainingTitle = document.getElementById('trainingExerciseName');
        if (trainingTitle) {
            trainingTitle.textContent = exercise.name;
        }
        
        // Navigate to training page
        navigateTo('training');
        
        // Reset timer UI
        updateStartPauseButton();
        
        // Start timer
        startTimer();
    } catch (error) {
        console.error('Failed to start training:', error);
        showLocalizedToast('storageError', 'error');
    }
}

// ===== Restart Training =====
async function restartTraining(exerciseId) {
    try {
        const exercise = await getExerciseById(exerciseId);
        if (!exercise) {
            showLocalizedToast('storageError', 'error');
            return;
        }
        
        // Configure timer
        configureTraining({
            workDuration: exercise.workDuration,
            restDuration: exercise.restDuration,
            rounds: exercise.rounds,
            preparationCountdown: exercise.preparationCountdown,
            soundEnabled: exercise.soundEnabled,
            videoMode: exercise.videoMode
        });
        
        // Set video source
        await setTrainingVideoSource(exerciseId);
        
        // Reset timer
        restartTimer();
        
        // Navigate to training page
        navigateTo('training');
        
        // Start timer
        startTimer();
    } catch (error) {
        console.error('Failed to restart training:', error);
        showLocalizedToast('storageError', 'error');
    }
}

// ===== Confirm Stop Training =====
async function confirmStopTraining() {
    const confirmed = await showLocalizedConfirmation(
        'confirmTitle',
        'confirmStopTraining'
    );
    
    if (confirmed) {
        stopTimer();
        cleanupVideoResources();
        navigateTo('home');
        showLocalizedToast('sessionStopped');
    }
}

// ===== Confirm Clear Data =====
async function confirmClearData() {
    const confirmed = await showLocalizedConfirmation(
        'confirmTitle',
        'confirmClearData'
    );
    
    if (confirmed) {
        try {
            await deleteAllExercises();
            exercises = [];
            showLocalizedToast('dataCleared');
            renderExercises();
        } catch (error) {
            console.error('Failed to clear data:', error);
            showLocalizedToast('storageError', 'error');
        }
    }
}

// ===== Update UI =====
function updateUI() {
    // Update language toggle
    const langText = document.getElementById('langText');
    if (langText) {
        langText.textContent = getCurrentLanguage() === 'ar' ? 'AR' : 'EN';
    }
    
    // Update start/pause button
    updateStartPauseButton();
    
    // Update sound icon
    updateSoundIcon(isSoundEnabled());
}

// ===== Register Service Worker =====
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js')
                .then(registration => {
                    console.log('ServiceWorker registration successful');
                })
                .catch(err => {
                    console.log('ServiceWorker registration failed: ', err);
                });
        });
    }
}

// ===== Handle Back Button =====
function handleBackButton() {
    // Listen for back button on mobile
    window.addEventListener('popstate', (e) => {
        e.preventDefault();
        navigateBack();
    });
}

// ===== Handle Keyboard Shortcuts =====
function handleKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Escape key
        if (e.key === 'Escape') {
            // Close sidebar
            const sidebar = document.getElementById('sidebar');
            if (sidebar && sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
                const overlay = document.getElementById('sidebarOverlay');
                if (overlay) overlay.classList.remove('active');
            }
            
            // Close dialog
            const dialog = document.getElementById('confirmationDialog');
            if (dialog && dialog.classList.contains('visible')) {
                dialog.classList.remove('visible');
            }
        }
        
        // Space bar for start/pause in training
        if (e.key === ' ' && e.target === document.body) {
            e.preventDefault();
            if (currentPage === 'training') {
                const state = getTimerState();
                if (state === TimerState.PAUSED) {
                    resumeTimer();
                } else if (state === TimerState.READY || state === TimerState.FINISHED) {
                    startTimer();
                } else {
                    pauseTimer();
                }
            }
        }
    });
}

// ===== Initialize on DOM Load =====
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    handleBackButton();
    handleKeyboardShortcuts();
});

// ===== Handle Before Unload =====
window.addEventListener('beforeunload', () => {
    // Cleanup resources
    cleanupVideoResources();
});

// ===== Export for testing =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initApp,
        loadExercises,
        navigateTo,
        navigateBack
    };
}
