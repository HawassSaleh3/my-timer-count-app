// ===== app.js - Main Application Module =====

import { initI18n, getCurrentLanguage, toggleLanguage, initLanguageSelector, translate, translateCategory } from './i18n.js';
import {
    initDB,
    createExercise,
    getAllExercises,
    getExerciseById,
    updateExercise,
    deleteExercise,
    deleteAllExercises,
    deleteVideosForExercise,
    getVideoByExerciseId
} from './storage.js';
import { initNotifications, showToast, showLocalizedToast, showLocalizedConfirmation, enableSounds, isSoundEnabled } from './notifications.js';
import {
    initVideo,
    setTrainingVideoSource,
    cleanupVideoResources,
    getVideoModeFromForm,
    setVideoModeInForm,
    saveVideoForExercise
} from './video.js';
import {
    initTimer,
    configureTraining,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    getTimerState,
    setOnStateChange,
    setOnSessionComplete,
    updateStartPauseButton,
    updateTrainingUI,
    refreshTimerLabels,
    setTrainingSoundEnabled,
    TimerState
} from './timer.js';

// ===== Application State =====
let currentPage = 'home';
let currentExerciseId = null;
let isEditing = false;
let exercises = [];
let isSaving = false;

// ===== DOM Element Cache =====
const pages = {};
const navLinks = {};

// ===== Initialize Application =====
async function initApp() {
    try {
        initI18n();
        initNotifications();
        initVideo();
        initTimer();

        await initDB();

        cacheDOMElements();
        setupNavigation();
        setupEventListeners();
        setupBottomNavigation();
        setupTimerCallbacks();

        await loadExercises();

        initLanguageSelector();
        updateUI();

        try {
            if (navigator.storage && navigator.storage.persist) {
                await navigator.storage.persist();
            }
        } catch (error) {
            console.warn('Persistent storage not granted:', error);
        }

        registerServiceWorker();
    } catch (error) {
        console.error('Failed to initialize app:', error);
        setTimeout(() => {
            showToast(translate('storageUnavailable'), 'error', 10000);
        }, 500);
    }
}

// ===== Cache DOM Elements =====
function cacheDOMElements() {
    pages.home = document.getElementById('pageHome');
    pages.createExercise = document.getElementById('pageCreateExercise');
    pages.exerciseDetails = document.getElementById('pageExerciseDetails');
    pages.training = document.getElementById('pageTraining');
    pages.sessionComplete = document.getElementById('pageSessionComplete');
    pages.settings = document.getElementById('pageSettings');

    navLinks.home = document.getElementById('navHome');
    navLinks.settings = document.getElementById('navSettings');

    const exerciseLibrary = document.getElementById('exerciseLibrary');
    if (exerciseLibrary) {
        exerciseLibrary.addEventListener('click', handleExerciseClick);
        exerciseLibrary.addEventListener('keydown', handleExerciseKeydown);
    }
}

// ===== Setup Navigation =====
function setupNavigation() {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const closeSidebar = document.getElementById('closeSidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.add('open');
            if (sidebarOverlay) sidebarOverlay.classList.add('active');
        });
    }

    if (closeSidebar && sidebar) {
        closeSidebar.addEventListener('click', () => {
            sidebar.classList.remove('open');
            if (sidebarOverlay) sidebarOverlay.classList.remove('active');
        });
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            sidebarOverlay.classList.remove('active');
        });
    }

    if (navLinks.home) {
        navLinks.home.addEventListener('click', async (event) => {
            event.preventDefault();
            if (await confirmLeaveTraining()) {
                navigateTo('home');
                closeMobileMenu();
            }
        });
    }

    if (navLinks.settings) {
        navLinks.settings.addEventListener('click', async (event) => {
            event.preventDefault();
            if (await confirmLeaveTraining()) {
                navigateTo('settings');
                closeMobileMenu();
            }
        });
    }

    const langToggle = document.getElementById('langToggle');
    if (langToggle) {
        langToggle.addEventListener('click', () => {
            toggleLanguage();
            closeMobileMenu();
        });
    }

    document.querySelectorAll('[data-action="back"]').forEach(button => {
        button.addEventListener('click', () => {
            navigateBack();
        });
    });
}

// ===== Close Mobile Menu =====
function closeMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    if (sidebar) sidebar.classList.remove('open');
    if (sidebarOverlay) sidebarOverlay.classList.remove('active');
}

// ===== Setup Bottom Navigation =====
function setupBottomNavigation() {
    const bottomNavHome = document.getElementById('bottomNavHome');
    const bottomNavCreate = document.getElementById('bottomNavCreate');
    const bottomNavSettings = document.getElementById('bottomNavSettings');

    if (bottomNavHome) {
        bottomNavHome.addEventListener('click', async () => {
            if (await confirmLeaveTraining()) {
                navigateTo('home');
            }
        });
    }

    if (bottomNavCreate) {
        bottomNavCreate.addEventListener('click', async () => {
            if (await confirmLeaveTraining()) {
                openCreateExercise();
            }
        });
    }

    if (bottomNavSettings) {
        bottomNavSettings.addEventListener('click', async () => {
            if (await confirmLeaveTraining()) {
                navigateTo('settings');
            }
        });
    }
}

// ===== Setup Event Listeners =====
function setupEventListeners() {
    const addExerciseBtn = document.getElementById('addExerciseBtn');
    const addFirstExerciseBtn = document.getElementById('addFirstExercise');

    if (addExerciseBtn) {
        addExerciseBtn.addEventListener('click', () => openCreateExercise());
    }

    if (addFirstExerciseBtn) {
        addFirstExerciseBtn.addEventListener('click', () => openCreateExercise());
    }

    const exerciseForm = document.getElementById('exerciseForm');
    if (exerciseForm) {
        exerciseForm.addEventListener('submit', handleFormSubmit);
    }

    const cancelBtn = document.getElementById('cancelCreate');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', handleCreateCancel);
    }

    const editBtn = document.getElementById('editExerciseBtn');
    if (editBtn) {
        editBtn.addEventListener('click', () => {
            if (currentExerciseId) editExercise(currentExerciseId);
        });
    }

    const deleteBtn = document.getElementById('deleteExerciseBtn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            if (currentExerciseId) confirmDeleteExercise(currentExerciseId);
        });
    }

    const startTrainingBtn = document.getElementById('startTrainingBtn');
    if (startTrainingBtn) {
        startTrainingBtn.addEventListener('click', () => {
            if (currentExerciseId) startTraining(currentExerciseId);
        });
    }

    const startPauseBtn = document.getElementById('startPauseBtn');
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

    const stopBtn = document.getElementById('stopTrainingBtn');
    if (stopBtn) {
        stopBtn.addEventListener('click', confirmStopTraining);
    }

    const restartBtn = document.getElementById('restartTrainingBtn');
    if (restartBtn) {
        restartBtn.addEventListener('click', () => {
            if (currentExerciseId) restartTraining(currentExerciseId);
        });
    }

    const soundToggle = document.getElementById('trainingSoundToggle');
    if (soundToggle) {
        soundToggle.addEventListener('click', () => {
            const nextState = !isSoundEnabled();
            enableSounds(nextState);
            setTrainingSoundEnabled(nextState);
            updateSoundIcon(nextState);
        });
    }

    const repeatBtn = document.getElementById('repeatSessionBtn');
    if (repeatBtn) {
        repeatBtn.addEventListener('click', () => {
            if (currentExerciseId) restartTraining(currentExerciseId);
        });
    }

    const returnHomeBtn = document.getElementById('returnToHomeBtn');
    if (returnHomeBtn) {
        returnHomeBtn.addEventListener('click', () => navigateTo('home'));
    }

    const clearDataBtn = document.getElementById('clearDataBtn');
    if (clearDataBtn) {
        clearDataBtn.addEventListener('click', confirmClearData);
    }

    // Refresh dynamic labels whenever the language changes
    document.addEventListener('languagechange', handleLanguageChanged);

    // Keep labels correct when returning to the tab
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            refreshTimerLabels();
        }
    });
}

// ===== Language Changed =====
function handleLanguageChanged() {
    updateUI();
    refreshTimerLabels();

    rendersDynamicLanguageLabels();

    if (currentPage === 'exercise-details' && currentExerciseId) {
        const exercise = exercises.find(item => item.id === currentExerciseId);
        if (exercise) {
            const detailCategory = document.getElementById('detailCategory');
            const detailSound = document.getElementById('detailSound');
            const detailVideoMode = document.getElementById('detailVideoMode');
            if (detailCategory) detailCategory.textContent = translateCategory(exercise.category);
            if (detailSound) detailSound.textContent = exercise.soundEnabled ? translate('soundOn') : translate('soundOff');
            if (detailVideoMode) detailVideoMode.textContent = exercise.videoMode === 'once' ? translate('onceModeText') : translate('loopModeText');
        }
    }
}

function rendersDynamicLanguageLabels() {
    const title = document.getElementById('createExerciseTitle');
    if (title) {
        title.textContent = isEditing ? translate('editExerciseTitle') : translate('createExerciseTitle');
    }
}

// ===== Setup Timer Callbacks =====
function setupTimerCallbacks() {
    setOnStateChange((state) => {
        updateStartPauseButton();
        updateTrainingUI();

        if (state === TimerState.FINISHED) {
            navigateTo('session-complete');
        }
    });

    setOnSessionComplete((stats) => {
        const exercise = exercises.find(item => item.id === currentExerciseId);

        const setName = document.getElementById('summaryExerciseName');
        const setRounds = document.getElementById('summaryCompletedRounds');
        const setWork = document.getElementById('summaryTotalWork');
        const setRest = document.getElementById('summaryTotalRest');
        const setTotal = document.getElementById('summaryTotalSession');

        if (setName && exercise) setName.textContent = exercise.name;
        if (setRounds) setRounds.textContent = stats.completedRounds;
        if (setWork) setWork.textContent = formatDuration(stats.totalWorkTime);
        if (setRest) setRest.textContent = formatDuration(stats.totalRestTime);
        if (setTotal) setTotal.textContent = formatDuration(stats.totalSessionTime);
    });
}

// ===== Format Duration =====
function formatDuration(seconds) {
    const safeSeconds = Math.max(0, Math.round(Number(seconds) || 0));
    const mins = Math.floor(safeSeconds / 60);
    const secs = safeSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ===== Compact duration for cards =====
function formatCompactDuration(seconds) {
    const safeSeconds = Math.max(0, Math.round(Number(seconds) || 0));
    if (safeSeconds < 60) {
        return `${safeSeconds}${translate('seconds')}`;
    }
    const mins = Math.floor(safeSeconds / 60);
    const secs = safeSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ===== Update Sound Icon =====
function updateSoundIcon(enabled) {
    const soundIcon = document.getElementById('soundIcon');
    const soundToggle = document.getElementById('trainingSoundToggle');

    if (!soundIcon || !soundToggle) return;

    if (enabled) {
        soundIcon.innerHTML = `
            <path d="M11 5L6 9H2v6h4l5 4V9z"></path>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
        `;
        soundToggle.classList.remove('sound-off');
        soundToggle.setAttribute('aria-label', translate('soundOn'));
    } else {
        soundIcon.innerHTML = `
            <path d="M11 5L6 9H2v6h4l5 4V9z"></path>
            <line x1="23" y1="9" x2="17" y2="15"></line>
            <line x1="17" y1="9" x2="23" y2="15"></line>
        `;
        soundToggle.classList.add('sound-off');
        soundToggle.setAttribute('aria-label', translate('soundOff'));
    }
}

// ===== Navigate To Page =====
function navigateTo(page) {
    const previousPage = currentPage;

    Object.values(pages).forEach(section => {
        if (section) section.classList.remove('active');
    });

    switch (page) {
        case 'home':
            if (pages.home) pages.home.classList.add('active');
            currentPage = 'home';
            break;
        case 'create-exercise':
            if (pages.createExercise) pages.createExercise.classList.add('active');
            currentPage = 'create-exercise';
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
        default:
            if (pages.home) pages.home.classList.add('active');
            currentPage = 'home';
            break;
    }

    // Release the details player URL when leaving that page
    if (previousPage === 'exercise-details' && page !== 'exercise-details') {
        cleanupDetailsVideo();
    }

    updateNavLinks();
    window.scrollTo({ top: 0, behavior: 'auto' });
}

// ===== Release the details video URL =====
function cleanupDetailsVideo() {
    const detailsVideo = document.getElementById('detailsVideo');
    if (!detailsVideo) return;

    if (detailsVideo.dataset.objectUrl) {
        URL.revokeObjectURL(detailsVideo.dataset.objectUrl);
        delete detailsVideo.dataset.objectUrl;
    }

    detailsVideo.pause();
    detailsVideo.removeAttribute('src');
    detailsVideo.load();
}

// ===== Navigate Back =====
async function navigateBack() {
    switch (currentPage) {
        case 'create-exercise':
            if (isEditing && currentExerciseId) {
                navigateTo('exercise-details');
            } else {
                navigateTo('home');
            }
            break;
        case 'exercise-details':
        case 'settings':
            navigateTo('home');
            break;
        case 'training':
            await confirmStopTraining();
            break;
        case 'session-complete':
            navigateTo('home');
            break;
        default:
            navigateTo('home');
            break;
    }
}

// ===== Confirm leaving a running training session =====
async function confirmLeaveTraining() {
    if (currentPage !== 'training') return true;

    const confirmed = await showLocalizedConfirmation('confirmTitle', 'confirmStopTraining');
    if (confirmed) {
        stopTimer();
        cleanupVideoResources();
    }
    return confirmed;
}

// ===== Update Navigation Links =====
function updateNavLinks() {
    Object.values(navLinks).forEach(link => {
        if (link) link.classList.remove('active');
    });

    const bottomNavHome = document.getElementById('bottomNavHome');
    const bottomNavCreate = document.getElementById('bottomNavCreate');
    const bottomNavSettings = document.getElementById('bottomNavSettings');

    if (bottomNavHome) bottomNavHome.classList.remove('active');
    if (bottomNavCreate) bottomNavCreate.classList.remove('active');
    if (bottomNavSettings) bottomNavSettings.classList.remove('active');

    switch (currentPage) {
        case 'home':
            if (navLinks.home) navLinks.home.classList.add('active');
            if (bottomNavHome) bottomNavHome.classList.add('active');
            break;
        case 'create-exercise':
            if (bottomNavCreate) bottomNavCreate.classList.add('active');
            break;
        case 'settings':
            if (navLinks.settings) navLinks.settings.classList.add('active');
            if (bottomNavSettings) bottomNavSettings.classList.add('active');
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

// ===== Render Exercises (without destroying the empty state) =====
function renderExercises() {
    const exerciseLibrary = document.getElementById('exerciseLibrary');
    const emptyState = document.getElementById('emptyState');

    if (!exerciseLibrary) return;

    exerciseLibrary.querySelectorAll('.exercise-card').forEach(card => card.remove());

    if (exercises.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';

    const fragment = document.createDocumentFragment();
    exercises.forEach(exercise => {
        fragment.appendChild(createExerciseCard(exercise));
    });
    exerciseLibrary.appendChild(fragment);
}

// ===== Create Exercise Card =====
function createExerciseCard(exercise) {
    const card = document.createElement('div');
    card.className = 'exercise-card';
    card.dataset.exerciseId = exercise.id;
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', exercise.name);

    card.innerHTML = `
        <div class="exercise-card-header">
            <div class="exercise-card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                    <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
                    <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
                    <line x1="6" y1="1" x2="6" y2="4"></line>
                    <line x1="10" y1="1" x2="10" y2="4"></line>
                    <line x1="14" y1="1" x2="14" y2="4"></line>
                </svg>
            </div>
            <div class="exercise-card-info">
                <h3>${escapeHtml(exercise.name)}</h3>
                <p>${escapeHtml(exercise.description || translateCategory(exercise.category))}</p>
            </div>
        </div>
        <div class="exercise-card-settings">
            <span class="setting-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12,6 12,12 16,14"></polyline>
                </svg>
                ${formatCompactDuration(exercise.workDuration)}
            </span>
            <span class="setting-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
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
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"></path>
                    <path d="M12 6v6l4 2"></path>
                </svg>
                ${formatCompactDuration(exercise.restDuration)}
            </span>
        </div>
    `;

    return card;
}

// ===== Escape HTML =====
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

// ===== Handle Exercise Click / Keyboard =====
function handleExerciseClick(event) {
    const card = event.target.closest('.exercise-card');
    if (card && card.dataset.exerciseId) {
        showExerciseDetails(card.dataset.exerciseId);
    }
}

function handleExerciseKeydown(event) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const card = event.target.closest('.exercise-card');
    if (card && card.dataset.exerciseId) {
        event.preventDefault();
        showExerciseDetails(card.dataset.exerciseId);
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

        const title = document.getElementById('exerciseDetailsTitle');
        if (title) title.textContent = exercise.name;

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
        if (detailCategory) detailCategory.textContent = translateCategory(exercise.category);
        if (detailDescription) {
            detailDescription.textContent = exercise.description || translate('detailDescription');
        }
        if (detailWorkDuration) detailWorkDuration.textContent = formatDuration(exercise.workDuration);
        if (detailRounds) detailRounds.textContent = exercise.rounds;
        if (detailRestDuration) detailRestDuration.textContent = formatDuration(exercise.restDuration);
        if (detailPrepCountdown) detailPrepCountdown.textContent = `${exercise.preparationCountdown}s`;
        if (detailSound) detailSound.textContent = exercise.soundEnabled ? translate('soundOn') : translate('soundOff');
        if (detailVideoMode) detailVideoMode.textContent = exercise.videoMode === 'once' ? translate('onceModeText') : translate('loopModeText');

        await loadDetailsVideo(exercise);

        navigateTo('exercise-details');
    } catch (error) {
        console.error('Failed to show exercise details:', error);
        showLocalizedToast('storageError', 'error');
    }
}

// ===== Load Video on Details Page =====
async function loadDetailsVideo(exercise) {
    const detailsVideo = document.getElementById('detailsVideo');
    const noVideoText = document.getElementById('noVideoText');

    if (!detailsVideo) return;

    // Revoke a previously generated URL before replacing the source
    if (detailsVideo.dataset.objectUrl) {
        URL.revokeObjectURL(detailsVideo.dataset.objectUrl);
        delete detailsVideo.dataset.objectUrl;
    }

    detailsVideo.pause();
    detailsVideo.removeAttribute('src');
    detailsVideo.load();

    let video = null;
    try {
        video = await getVideoByExerciseId(exercise.id);
    } catch (error) {
        console.warn('Could not load video:', error);
    }

    if (video && video.blobUrl) {
        detailsVideo.src = video.blobUrl;
        detailsVideo.dataset.objectUrl = video.blobUrl;
        detailsVideo.style.display = 'block';
        if (noVideoText) noVideoText.style.display = 'none';
    } else {
        detailsVideo.style.display = 'none';
        if (noVideoText) noVideoText.style.display = 'block';
    }
}

// ===== Reset Exercise Form =====
function resetExerciseForm() {
    const form = document.getElementById('exerciseForm');
    if (form) form.reset();

    clearFormErrors();

    const previewContainer = document.getElementById('videoPreview');
    const placeholder = document.getElementById('uploadPlaceholder');
    const previewVideo = document.getElementById('previewVideo');
    const fileInput = document.getElementById('videoFileInput');
    const videoName = document.getElementById('videoName');
    const videoSize = document.getElementById('videoSize');
    const uploadArea = document.getElementById('videoUploadArea');

    if (previewVideo) {
        const blobUrl = previewVideo.getAttribute('data-blob-url');
        if (blobUrl) URL.revokeObjectURL(blobUrl);
        previewVideo.removeAttribute('data-blob-url');
        previewVideo.pause();
        previewVideo.removeAttribute('src');
        previewVideo.load();
    }

    if (previewContainer) previewContainer.style.display = 'none';
    if (placeholder) placeholder.style.display = 'block';
    if (fileInput) fileInput.value = '';
    if (videoName) videoName.textContent = '';
    if (videoSize) videoSize.textContent = '';
    if (uploadArea) uploadArea.classList.remove('dragover');

    setVideoModeInForm('loop');

    const title = document.getElementById('createExerciseTitle');
    if (title) {
        title.textContent = isEditing ? translate('editExerciseTitle') : translate('createExerciseTitle');
    }

    const saveText = document.getElementById('saveExerciseText');
    if (saveText) {
        saveText.textContent = translate('saveExerciseText');
    }
}

// ===== Clear Form Errors =====
function clearFormErrors() {
    document.querySelectorAll('.form-input.invalid, .form-textarea.invalid').forEach(input => {
        input.classList.remove('invalid');
        input.removeAttribute('aria-invalid');
    });
    ['nameError', 'workDurationError', 'roundsError', 'restDurationError', 'prepCountdownError'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = '';
    });
}

function setFieldError(field, errorId, message) {
    if (field) {
        field.classList.add('invalid');
        field.setAttribute('aria-invalid', 'true');
    }
    const errorEl = document.getElementById(errorId);
    if (errorEl) errorEl.textContent = message;
}

// ===== Open Create Exercise =====
function openCreateExercise() {
    isEditing = false;
    currentExerciseId = null;
    resetExerciseForm();
    navigateTo('create-exercise');
}

// ===== Handle Cancel =====
function handleCreateCancel() {
    if (isEditing && currentExerciseId) {
        navigateTo('exercise-details');
    } else {
        navigateTo('home');
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

        // Reset first (also clears any old preview/countdown), then fill the form
        resetExerciseForm();

        const setValue = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.value = value;
        };

        setValue('exerciseName', exercise.name);
        setValue('exerciseDescription', exercise.description || '');
        setValue('exerciseCategory', exercise.category || '');
        setValue('workDuration', exercise.workDuration);
        setValue('restDuration', exercise.restDuration);
        setValue('rounds', exercise.rounds);
        setValue('preparationCountdown', exercise.preparationCountdown);

        const soundEnabledInput = document.getElementById('soundEnabled');
        if (soundEnabledInput) soundEnabledInput.checked = exercise.soundEnabled;

        setVideoModeInForm(exercise.videoMode || 'loop');

        const video = await getVideoByExerciseIdSafe(exercise.id);
        if (video && video.blobUrl) {
            showVideoPreview(video);
        }

        const title = document.getElementById('createExerciseTitle');
        if (title) title.textContent = translate('editExerciseTitle');

        navigateTo('create-exercise');
    } catch (error) {
        console.error('Failed to edit exercise:', error);
        showLocalizedToast('storageError', 'error');
    }
}

async function getVideoByExerciseIdSafe(exerciseId) {
    try {
        return await getVideoByExerciseId(exerciseId);
    } catch (error) {
        console.warn('Could not load video:', error);
        return null;
    }
}

// ===== Show Existing Video in the Form =====
function showVideoPreview(video) {
    const previewVideo = document.getElementById('previewVideo');
    const previewContainer = document.getElementById('videoPreview');
    const placeholder = document.getElementById('uploadPlaceholder');
    const videoName = document.getElementById('videoName');
    const videoSize = document.getElementById('videoSize');

    if (!previewVideo || !previewContainer || !placeholder) return;

    previewVideo.src = video.blobUrl;
    previewVideo.load();

    previewContainer.style.display = 'block';
    placeholder.style.display = 'none';

    if (videoName) videoName.textContent = video.name || '';
    if (videoSize) videoSize.textContent = formatFileSize(video.size || 0);

    const oldBlobUrl = previewVideo.getAttribute('data-blob-url');
    if (oldBlobUrl) URL.revokeObjectURL(oldBlobUrl);
    previewVideo.setAttribute('data-blob-url', video.blobUrl);
}

// ===== Format File Size =====
function formatFileSize(bytes) {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// ===== Read and validate form values =====
function readFormValues() {
    const nameInput = document.getElementById('exerciseName');
    const descriptionInput = document.getElementById('exerciseDescription');
    const categoryInput = document.getElementById('exerciseCategory');
    const workInput = document.getElementById('workDuration');
    const roundsInput = document.getElementById('rounds');
    const restInput = document.getElementById('restDuration');
    const prepInput = document.getElementById('preparationCountdown');
    const soundInput = document.getElementById('soundEnabled');

    clearFormErrors();

    const name = (nameInput ? nameInput.value : '').trim();
    const workDuration = parseInt(workInput ? workInput.value : '', 10);
    const rounds = parseInt(roundsInput ? roundsInput.value : '', 10);
    const restDuration = restInput && restInput.value !== '' ? parseInt(restInput.value, 10) : 0;
    const preparationCountdown = prepInput && prepInput.value !== '' ? parseInt(prepInput.value, 10) : 0;

    let firstInvalid = null;

    if (!name) {
        setFieldError(nameInput, 'nameError', translate('nameError'));
        firstInvalid = firstInvalid || nameInput;
    }

    if (!Number.isFinite(workDuration) || workDuration < 1 || workDuration > 600) {
        setFieldError(workInput, 'workDurationError', translate('workDurationError'));
        firstInvalid = firstInvalid || workInput;
    }

    if (!Number.isFinite(rounds) || rounds < 1 || rounds > 50) {
        setFieldError(roundsInput, 'roundsError', translate('roundsError'));
        firstInvalid = firstInvalid || roundsInput;
    }

    if (!Number.isFinite(restDuration) || restDuration < 0 || restDuration > 300) {
        setFieldError(restInput, 'restDurationError', translate('restDurationError'));
        firstInvalid = firstInvalid || restInput;
    }

    if (!Number.isFinite(preparationCountdown) || preparationCountdown < 0 || preparationCountdown > 30) {
        setFieldError(prepInput, 'prepCountdownError', translate('prepCountdownError'));
        firstInvalid = firstInvalid || prepInput;
    }

    if (firstInvalid) {
        firstInvalid.focus();
        showToast(translate('formHasErrors'), 'error');
        return null;
    }

    return {
        name,
        description: descriptionInput ? descriptionInput.value.trim() : '',
        category: categoryInput ? categoryInput.value : '',
        workDuration,
        restDuration,
        rounds,
        preparationCountdown,
        videoMode: getVideoModeFromForm(),
        soundEnabled: soundInput ? soundInput.checked : true
    };
}

// ===== Handle Form Submit =====
async function handleFormSubmit(event) {
    event.preventDefault();

    if (isSaving) return;

    const values = readFormValues();
    if (!values) return;

    const saveBtn = document.getElementById('saveExerciseBtn');
    const saveText = document.getElementById('saveExerciseText');
    const originalSaveText = saveText ? saveText.textContent : '';

    isSaving = true;
    if (saveBtn) saveBtn.disabled = true;
    if (saveText) saveText.textContent = translate('saveExerciseText') + '…';

    try {
        let exerciseId = currentExerciseId;
        let savedExercise;

        if (isEditing && exerciseId) {
            savedExercise = await updateExercise(exerciseId, values);
        } else {
            savedExercise = await createExercise(values);
            exerciseId = savedExercise.id;
            currentExerciseId = exerciseId;
        }

        const fileInput = document.getElementById('videoFileInput');
        const file = fileInput && fileInput.files ? fileInput.files[0] : null;
        const previewContainer = document.getElementById('videoPreview');
        const previewVisible = !!previewContainer && previewContainer.style.display !== 'none';

        if (file) {
            // storeVideo replaces any previous video for this exercise
            const savedVideo = await saveVideoForExercise(file, exerciseId);
            if (savedVideo) {
                await updateExercise(exerciseId, { videoId: savedVideo.id });
            }
        } else if (isEditing) {
            // If an existing video was removed in the form, delete it
            if (!previewVisible) {
                await deleteVideosForExercise(exerciseId);
                await updateExercise(exerciseId, { videoId: null });
            }
        }

        showLocalizedToast(isEditing ? 'exerciseUpdated' : 'exerciseSaved');

        await loadExercises();
        navigateTo('home');

        isEditing = false;
        currentExerciseId = null;
    } catch (error) {
        console.error('Failed to save exercise:', error);
        showToast(translate('saveExerciseError'), 'error', 5000);
    } finally {
        isSaving = false;
        if (saveBtn) saveBtn.disabled = false;
        if (saveText) saveText.textContent = originalSaveText || translate('saveExerciseText');
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
            currentExerciseId = null;
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

        configureTraining({
            workDuration: exercise.workDuration,
            restDuration: exercise.restDuration,
            rounds: exercise.rounds,
            preparationCountdown: exercise.preparationCountdown,
            soundEnabled: exercise.soundEnabled,
            videoMode: exercise.videoMode
        });

        enableSounds(exercise.soundEnabled !== false);
        setTrainingSoundEnabled(exercise.soundEnabled !== false);
        updateSoundIcon(exercise.soundEnabled !== false);

        const trainingTitle = document.getElementById('trainingExerciseName');
        if (trainingTitle) trainingTitle.textContent = exercise.name;

        const trainingTitleHeader = document.getElementById('trainingTitle');
        if (trainingTitleHeader) trainingTitleHeader.textContent = translate('trainingTitle');

        // Load the video before showing the page so the layout is correct
        await setTrainingVideoSource(exerciseId);

        navigateTo('training');
        refreshTimerLabels();
        updateStartPauseButton();

        // Small delay lets the training page paint before the first tick
        setTimeout(() => startTimer(), 50);
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

        currentExerciseId = exerciseId;

        configureTraining({
            workDuration: exercise.workDuration,
            restDuration: exercise.restDuration,
            rounds: exercise.rounds,
            preparationCountdown: exercise.preparationCountdown,
            soundEnabled: exercise.soundEnabled,
            videoMode: exercise.videoMode
        });

        enableSounds(exercise.soundEnabled !== false);
        setTrainingSoundEnabled(exercise.soundEnabled !== false);
        updateSoundIcon(exercise.soundEnabled !== false);

        await setTrainingVideoSource(exerciseId);

        navigateTo('training');
        refreshTimerLabels();
        updateStartPauseButton();

        setTimeout(() => startTimer(), 50);
    } catch (error) {
        console.error('Failed to restart training:', error);
        showLocalizedToast('storageError', 'error');
    }
}

// ===== Confirm Stop Training =====
async function confirmStopTraining() {
    const confirmed = await showLocalizedConfirmation('confirmTitle', 'confirmStopTraining');

    if (confirmed) {
        stopTimer();
        cleanupVideoResources();

        const trainingVideo = document.getElementById('trainingVideo');
        if (trainingVideo) {
            trainingVideo.pause();
            trainingVideo.removeAttribute('src');
            trainingVideo.load();
        }

        navigateTo(currentExerciseId ? 'exercise-details' : 'home');
        showLocalizedToast('sessionStopped');
    }
}

// ===== Confirm Clear Data =====
async function confirmClearData() {
    const confirmed = await showLocalizedConfirmation('confirmTitle', 'confirmClearData');

    if (confirmed) {
        try {
            await deleteAllExercises();
            exercises = [];
            currentExerciseId = null;
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
    const langText = document.getElementById('langText');
    if (langText) {
        langText.textContent = getCurrentLanguage() === 'ar' ? 'AR' : 'EN';
    }

    updateStartPauseButton();
    updateSoundIcon(isSoundEnabled());
}

// ===== Register Service Worker =====
function registerServiceWorker() {
    if (!('serviceWorker' in navigator) || window.location.protocol === 'file:') return;

    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js', { updateViaCache: 'none' })
            .then(registration => {
                // Check for updates once per load
                registration.update().catch(() => {});

                // When a new worker takes control (for example after a
                // deployment) reload once so the fresh HTML/CSS/JS is used.
                if (navigator.serviceWorker.controller) {
                    let reloading = false;
                    navigator.serviceWorker.addEventListener('controllerchange', () => {
                        if (reloading) return;
                        reloading = true;
                        window.location.reload();
                    });
                }
            })
            .catch(error => {
                console.warn('ServiceWorker registration failed:', error);
            });
    });
}

// ===== Keyboard Shortcuts =====
function handleKeyboardShortcuts() {
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            const sidebar = document.getElementById('sidebar');
            if (sidebar && sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
                const overlay = document.getElementById('sidebarOverlay');
                if (overlay) overlay.classList.remove('active');
            }
        }

        if (event.key === ' ' && event.target === document.body) {
            event.preventDefault();
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
    handleKeyboardShortcuts();
});

// ===== Handle Before Unload =====
window.addEventListener('beforeunload', () => {
    cleanupVideoResources();
});
