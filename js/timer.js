// ===== timer.js - Timer State Machine =====

import { playWorkNotification, playRestNotification, playRoundNotification, playCompleteNotification, isSoundEnabled } from './notifications.js';
import { playTrainingVideo, restartTrainingVideo, pauseTrainingVideo, resetTrainingVideo, setVideoPlaybackMode } from './video.js';
import { formatTime, translate } from './i18n.js';

// ===== Timer State Constants =====
export const TimerState = {
    READY: 'ready',
    PREPARATION: 'preparation',
    WORK: 'work',
    REST: 'rest',
    PAUSED: 'paused',
    FINISHED: 'finished'
};

// ===== Timer State =====
let timerState = TimerState.READY;
let timerInterval = null;
let startTime = 0;
let elapsedTime = 0;
let remainingTime = 0;
let pausedPhase = null;
let pausedRemaining = 0;

// ===== Helpers =====
function toInt(value, fallback) {
    const parsed = parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function getPhaseDuration(state = timerState) {
    switch (state) {
        case TimerState.PREPARATION:
            return trainingConfig.preparationCountdown;
        case TimerState.REST:
            return trainingConfig.restDuration;
        case TimerState.WORK:
            return trainingConfig.workDuration;
        default:
            return trainingConfig.workDuration;
    }
}

function getRemainingForPhase(state = timerState) {
    switch (state) {
        case TimerState.PREPARATION:
            return Math.max(0, trainingProgress.preparationTimeRemaining);
        case TimerState.REST:
            return Math.max(0, trainingProgress.restTimeRemaining);
        case TimerState.WORK:
            return Math.max(0, trainingProgress.workTimeRemaining);
        default:
            return 0;
    }
}

// ===== Training Configuration =====
let trainingConfig = {
    workDuration: 30,
    restDuration: 10,
    rounds: 5,
    preparationCountdown: 3,
    soundEnabled: true,
    videoMode: 'loop'
};

// ===== Training Progress =====
let trainingProgress = {
    currentRound: 1,
    totalRounds: 5,
    currentPhase: TimerState.READY,
    workTimeRemaining: 0,
    restTimeRemaining: 0,
    preparationTimeRemaining: 0,
    totalWorkTime: 0,
    totalRestTime: 0,
    startTimestamp: 0
};

// ===== Callbacks =====
let onStateChange = null;
let onTimeUpdate = null;
let onRoundComplete = null;
let onSessionComplete = null;

// ===== Initialize Timer =====
export function initTimer() {
    try {
        resetTimer();
        updateTimerDisplay();
        updatePhaseIndicator();
        updateRoundCounter();
    } catch (error) {
        console.error('Failed to initialize timer:', error);
    }
}

// ===== Configure Training =====
export function configureTraining(config) {
    // Always start a brand new session, even if the previous one was
    // paused or finished.
    clearTimerInterval();
    timerState = TimerState.READY;
    pausedPhase = null;
    pausedRemaining = 0;
    startTime = 0;
    elapsedTime = 0;
    remainingTime = 0;

    trainingConfig = {
        workDuration: clamp(toInt(config.workDuration, 30), 1, 3600),
        // 0 is a valid value and means "no rest"
        restDuration: clamp(toInt(config.restDuration, 10), 0, 3600),
        rounds: clamp(toInt(config.rounds, 5), 1, 99),
        preparationCountdown: clamp(toInt(config.preparationCountdown, 3), 0, 60),
        soundEnabled: config.soundEnabled !== false,
        videoMode: config.videoMode === 'once' ? 'once' : 'loop'
    };
    
    // Update video playback mode
    setVideoPlaybackMode(trainingConfig.videoMode);
    
    // Reset progress
    trainingProgress = {
        currentRound: 1,
        totalRounds: trainingConfig.rounds,
        currentPhase: TimerState.READY,
        workTimeRemaining: trainingConfig.workDuration,
        restTimeRemaining: trainingConfig.restDuration,
        preparationTimeRemaining: trainingConfig.preparationCountdown,
        totalWorkTime: 0,
        totalRestTime: 0,
        startTimestamp: 0
    };
    
    // Update UI
    updateTimerDisplay();
    updatePhaseIndicator();
    updateRoundCounter();
    updateProgressBar();
}

// ===== Start Timer =====
export function startTimer() {
    if (timerState === TimerState.PAUSED) {
        resumeTimer();
        return;
    }
    
    if (timerState !== TimerState.READY && timerState !== TimerState.FINISHED) {
        return; // Already running
    }
    
    // Reset elapsed time / pause state
    pausedPhase = null;
    pausedRemaining = 0;
    elapsedTime = 0;
    startTime = Date.now();
    trainingProgress.startTimestamp = startTime;
    
    // Start from preparation if configured
    if (trainingConfig.preparationCountdown > 0) {
        timerState = TimerState.PREPARATION;
        remainingTime = trainingConfig.preparationCountdown;
        trainingProgress.preparationTimeRemaining = trainingConfig.preparationCountdown;
    } else {
        // Start directly with work
        timerState = TimerState.WORK;
        remainingTime = trainingConfig.workDuration;
        trainingProgress.workTimeRemaining = trainingConfig.workDuration;
        trainingProgress.currentPhase = TimerState.WORK;
        
        // Play video from the beginning for the first round
        restartTrainingVideo();
    }
    
    // Start timer loop
    startTimerLoop();
    
    // Notify state change
    if (onStateChange) {
        onStateChange(timerState);
    }
    
    // Update UI
    updatePhaseIndicator();
    updateTimerDisplay();
    updateRoundCounter();
}

// ===== Start Timer Loop =====
function startTimerLoop() {
    // Clear any existing interval
    clearTimerInterval();
    
    // Use requestAnimationFrame for smoother updates
    timerInterval = setInterval(() => {
        updateTimer();
    }, 100);
}

// ===== Update Timer =====
function updateTimer() {
    const now = Date.now();
    elapsedTime = now - startTime;
    
    switch (timerState) {
        case TimerState.PREPARATION:
            updatePreparationTimer(elapsedTime);
            break;
        case TimerState.WORK:
            updateWorkTimer(elapsedTime);
            break;
        case TimerState.REST:
            updateRestTimer(elapsedTime);
            break;
        default:
            // Do nothing for other states
            break;
    }
}

// ===== Update Preparation Timer =====
function updatePreparationTimer(elapsedTime) {
    const timePassed = elapsedTime / 1000;
    remainingTime = Math.max(0, trainingConfig.preparationCountdown - timePassed);
    trainingProgress.preparationTimeRemaining = remainingTime;
    
    if (remainingTime <= 0) {
        // Preparation complete, start work
        startWorkPhase();
    }
    
    updateTimerDisplay();
}

// ===== Update Work Timer =====
function updateWorkTimer(elapsedTime) {
    const timePassed = elapsedTime / 1000;
    remainingTime = Math.max(0, trainingConfig.workDuration - timePassed);
    trainingProgress.workTimeRemaining = remainingTime;
    
    if (remainingTime <= 0) {
        // Work complete, start rest or next round
        completeWorkPhase();
    }
    
    updateTimerDisplay();
    updateProgressBar();
}

// ===== Update Rest Timer =====
function updateRestTimer(elapsedTime) {
    const timePassed = elapsedTime / 1000;
    remainingTime = Math.max(0, trainingConfig.restDuration - timePassed);
    trainingProgress.restTimeRemaining = remainingTime;
    
    if (remainingTime <= 0) {
        // Rest complete, start next work
        completeRestPhase();
    }
    
    updateTimerDisplay();
    updateProgressBar();
}

// ===== Start Work Phase =====
function startWorkPhase() {
    timerState = TimerState.WORK;
    trainingProgress.currentPhase = TimerState.WORK;
    
    startTime = Date.now();
    elapsedTime = 0;
    remainingTime = trainingConfig.workDuration;
    trainingProgress.workTimeRemaining = trainingConfig.workDuration;
    
    // Play notification if sound enabled
    if (trainingConfig.soundEnabled && isSoundEnabled()) {
        playRoundNotification();
    }
    
    // Restart the video for every new work round (play-once mode)
    restartTrainingVideo();
    
    // Notify state change
    if (onStateChange) {
        onStateChange(timerState);
    }
    
    updatePhaseIndicator();
    updateTimerDisplay();
    updateRoundCounter();
}

// ===== Complete Work Phase =====
function completeWorkPhase() {
    // Add to total work time
    trainingProgress.totalWorkTime += trainingConfig.workDuration;
    
    // Pause video
    pauseTrainingVideo();
    
    // Play notification
    if (trainingConfig.soundEnabled && isSoundEnabled()) {
        playWorkNotification();
    }
    
    // Check if this is the last round
    if (trainingProgress.currentRound >= trainingProgress.totalRounds) {
        // Session complete
        timerState = TimerState.FINISHED;
        trainingProgress.currentPhase = TimerState.FINISHED;
        
        clearTimerInterval();
        pausedPhase = null;

        if (trainingConfig.soundEnabled && isSoundEnabled()) {
            playCompleteNotification();
        }
        
        // Notify session complete
        if (onSessionComplete) {
            onSessionComplete({
                totalWorkTime: trainingProgress.totalWorkTime,
                totalRestTime: trainingProgress.totalRestTime,
                totalSessionTime: trainingProgress.totalWorkTime + trainingProgress.totalRestTime,
                completedRounds: trainingProgress.currentRound
            });
        }
    } else if (trainingConfig.restDuration > 0) {
        // Start rest phase
        timerState = TimerState.REST;
        trainingProgress.currentPhase = TimerState.REST;
        
        startTime = Date.now();
        elapsedTime = 0;
        remainingTime = trainingConfig.restDuration;
        trainingProgress.restTimeRemaining = trainingConfig.restDuration;
        
        // Play notification
        if (trainingConfig.soundEnabled && isSoundEnabled()) {
            playRestNotification();
        }
    } else {
        // No rest configured: go straight to the next round
        trainingProgress.currentRound++;
        trainingProgress.restTimeRemaining = 0;
        startWorkPhase();

        if (onRoundComplete) {
            onRoundComplete(trainingProgress.currentRound);
        }
    }
    
    // Notify state change
    if (onStateChange) {
        onStateChange(timerState);
    }
    
    updatePhaseIndicator();
    updateTimerDisplay();
    updateRoundCounter();
}

// ===== Complete Rest Phase =====
function completeRestPhase() {
    // Add to total rest time
    trainingProgress.totalRestTime += trainingConfig.restDuration;
    
    // Move to next round
    trainingProgress.currentRound++;
    
    // Start next work phase
    startWorkPhase();
    
    // Notify round complete
    if (onRoundComplete) {
        onRoundComplete(trainingProgress.currentRound);
    }
}

// ===== Pause Timer =====
export function pauseTimer() {
    if (timerState === TimerState.PAUSED || timerState === TimerState.READY || timerState === TimerState.FINISHED) {
        return;
    }

    // Remember the real phase and exact remaining time
    pausedPhase = timerState;
    pausedRemaining = getRemainingForPhase(pausedPhase);
    remainingTime = pausedRemaining;

    timerState = TimerState.PAUSED;
    clearTimerInterval();
    
    // Pause video
    pauseTrainingVideo();
    
    // Notify state change
    if (onStateChange) {
        onStateChange(timerState);
    }
    
    updatePhaseIndicator();
    updateTimerDisplay();
}

// ===== Resume Timer =====
export function resumeTimer() {
    if (timerState !== TimerState.PAUSED) {
        return;
    }

    const phase = pausedPhase || TimerState.WORK;
    const duration = getPhaseDuration(phase);
    const remaining = Math.max(0, Math.min(duration, pausedRemaining));

    timerState = phase;
    trainingProgress.currentPhase = phase;

    // Rebuild the phase start time so the countdown continues from where
    // it was paused instead of restarting the phase.
    startTime = Date.now() - Math.max(0, duration - remaining) * 1000;
    remainingTime = remaining;

    if (phase === TimerState.WORK) {
        playTrainingVideo();
    }

    startTimerLoop();

    if (onStateChange) {
        onStateChange(timerState);
    }

    updatePhaseIndicator();
    updateTimerDisplay();
    updateRoundCounter();
}

// ===== Stop Timer =====
export function stopTimer() {
    if (timerState === TimerState.READY || timerState === TimerState.FINISHED) {
        return;
    }
    
    timerState = TimerState.READY;
    trainingProgress.currentPhase = TimerState.READY;
    pausedPhase = null;
    pausedRemaining = 0;
    
    // Reset everything
    clearTimerInterval();
    resetTimer();
    resetTrainingVideo();
    
    // Notify state change
    if (onStateChange) {
        onStateChange(timerState);
    }
    
    updatePhaseIndicator();
    updateTimerDisplay();
    updateRoundCounter();
}

// ===== Restart Timer =====
export function restartTimer() {
    // Reset to initial state
    timerState = TimerState.READY;
    trainingProgress.currentPhase = TimerState.READY;
    pausedPhase = null;
    pausedRemaining = 0;
    
    clearTimerInterval();
    resetTimer();
    resetTrainingVideo();
    
    // Reset progress
    trainingProgress = {
        currentRound: 1,
        totalRounds: trainingConfig.rounds,
        currentPhase: TimerState.READY,
        workTimeRemaining: trainingConfig.workDuration,
        restTimeRemaining: trainingConfig.restDuration,
        preparationTimeRemaining: trainingConfig.preparationCountdown,
        totalWorkTime: 0,
        totalRestTime: 0,
        startTimestamp: 0
    };
    
    // Notify state change
    if (onStateChange) {
        onStateChange(timerState);
    }
    
    updatePhaseIndicator();
    updateTimerDisplay();
    updateRoundCounter();
    updateProgressBar();
}

// ===== Clear Timer Interval =====
function clearTimerInterval() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

// ===== Reset Timer =====
function resetTimer() {
    timerState = TimerState.READY;
    startTime = 0;
    elapsedTime = 0;
    remainingTime = 0;
    pausedPhase = null;
    pausedRemaining = 0;
    
    clearTimerInterval();
}

// ===== Update Timer Display =====
function updateTimerDisplay() {
    const timerDisplay = document.getElementById('timerDisplay');
    
    if (!timerDisplay) return;
    
    let displayTime = 0;
    
    switch (timerState) {
        case TimerState.PREPARATION:
            displayTime = Math.ceil(trainingProgress.preparationTimeRemaining);
            break;
        case TimerState.WORK:
            displayTime = Math.ceil(trainingProgress.workTimeRemaining);
            break;
        case TimerState.REST:
            displayTime = Math.ceil(trainingProgress.restTimeRemaining);
            break;
        case TimerState.PAUSED:
            displayTime = Math.ceil(pausedRemaining);
            break;
        case TimerState.FINISHED:
            displayTime = 0;
            break;
        default:
            displayTime = trainingConfig.workDuration;
            break;
    }
    
    timerDisplay.textContent = formatTime(displayTime);
    
    // Update progress bar
    updateProgressBar();
    
    // Notify time update
    if (onTimeUpdate) {
        onTimeUpdate({
            state: timerState,
            remainingTime: displayTime,
            currentRound: trainingProgress.currentRound,
            totalRounds: trainingProgress.totalRounds
        });
    }
}

// ===== Update Phase Indicator =====
function updatePhaseIndicator() {
    const phaseText = document.getElementById('phaseText');
    const phaseIndicator = document.getElementById('phaseIndicator');
    
    if (!phaseText) return;
    
    phaseText.textContent = getPhaseText(timerState);
    phaseText.setAttribute('data-phase', timerState);
    
    if (phaseIndicator) {
        phaseIndicator.classList.remove('preparation', 'work', 'rest', 'paused', 'finished');
        phaseIndicator.classList.add(timerState);
    }
}

// ===== Get Phase Text =====
function getPhaseText(state) {
    const keyByState = {
        [TimerState.READY]: 'phaseReady',
        [TimerState.PREPARATION]: 'phasePreparation',
        [TimerState.WORK]: 'phaseWork',
        [TimerState.REST]: 'phaseRest',
        [TimerState.PAUSED]: 'phasePaused',
        [TimerState.FINISHED]: 'phaseFinished'
    };

    return translate(keyByState[state] || 'phaseReady');
}

// ===== Update Round Counter =====
function updateRoundCounter() {
    const currentRound = document.getElementById('currentRound');
    const totalRounds = document.getElementById('totalRounds');
    
    if (currentRound) {
        currentRound.textContent = trainingProgress.currentRound;
    }
    if (totalRounds) {
        totalRounds.textContent = trainingProgress.totalRounds;
    }
}

// ===== Update Progress Bar =====
function updateProgressBar() {
    const progressFill = document.getElementById('progressFill');
    const progressBar = document.getElementById('progressBar');
    
    if (!progressFill || !progressBar) return;
    
    let progress = 0;
    
    switch (timerState) {
        case TimerState.PREPARATION:
            if (trainingConfig.preparationCountdown > 0) {
                progress = 100 - (trainingProgress.preparationTimeRemaining / trainingConfig.preparationCountdown * 100);
            }
            break;
        case TimerState.WORK:
            if (trainingConfig.workDuration > 0) {
                progress = 100 - (trainingProgress.workTimeRemaining / trainingConfig.workDuration * 100);
            }
            break;
        case TimerState.REST:
            if (trainingConfig.restDuration > 0) {
                progress = 100 - (trainingProgress.restTimeRemaining / trainingConfig.restDuration * 100);
            }
            break;
        case TimerState.PAUSED:
            if (getPhaseDuration(pausedPhase) > 0) {
                progress = 100 - (pausedRemaining / getPhaseDuration(pausedPhase) * 100);
            }
            break;
        default:
            progress = 0;
            break;
    }
    
    progressFill.style.width = `${Math.min(100, Math.max(0, progress))}%`;
    
    // Update color based on phase
    if (timerState === TimerState.REST) {
        progressFill.style.background = 'linear-gradient(135deg, #e17055 0%, #d63031 100%)';
    } else {
        progressFill.style.background = 'linear-gradient(135deg, #6c5ce7 0%, #8473fa 100%)';
    }
}

// ===== Enable/disable sound for the current session =====
export function setTrainingSoundEnabled(enabled) {
    trainingConfig.soundEnabled = !!enabled;
}

// ===== Get Timer State =====
export function getTimerState() {
    return timerState;
}

// ===== Get Training Progress =====
export function getTrainingProgress() {
    return { ...trainingProgress };
}

// ===== Get Training Config =====
export function getTrainingConfig() {
    return { ...trainingConfig };
}

// ===== Set State Change Callback =====
export function setOnStateChange(callback) {
    onStateChange = callback;
}

// ===== Set Time Update Callback =====
export function setOnTimeUpdate(callback) {
    onTimeUpdate = callback;
}

// ===== Set Round Complete Callback =====
export function setOnRoundComplete(callback) {
    onRoundComplete = callback;
}

// ===== Set Session Complete Callback =====
export function setOnSessionComplete(callback) {
    onSessionComplete = callback;
}

// ===== Refresh translated timer labels (after language change) =====
export function refreshTimerLabels() {
    updatePhaseIndicator();
    updateStartPauseButton();
    updateTimerDisplay();
    updateRoundCounter();
}

// ===== Update Training UI =====
export function updateTrainingUI() {
    updatePhaseIndicator();
    updateTimerDisplay();
    updateRoundCounter();
    updateProgressBar();
}

// ===== Toggle Start/Pause Button =====
export function updateStartPauseButton() {
    const startPauseBtn = document.getElementById('startPauseBtn');
    const startPauseIcon = document.getElementById('startPauseIcon');
    const startPauseText = document.getElementById('startPauseText');
    
    if (!startPauseBtn) return;
    
    switch (timerState) {
        case TimerState.READY:
        case TimerState.PAUSED:
        case TimerState.FINISHED:
            // Show play icon
            if (startPauseIcon) {
                startPauseIcon.innerHTML = '<polygon points="5,3 19,12 5,21"></polygon>';
            }
            if (startPauseText) {
                startPauseText.textContent = translate('startPauseText');
            }
            startPauseBtn.classList.remove('btn-danger');
            startPauseBtn.classList.add('btn-primary');
            break;
        case TimerState.PREPARATION:
        case TimerState.WORK:
        case TimerState.REST:
            // Show pause icon
            if (startPauseIcon) {
                startPauseIcon.innerHTML = '<rect x="6" y="5" width="5" height="14" rx="1"></rect><rect x="14" y="5" width="5" height="14" rx="1"></rect>';
            }
            if (startPauseText) {
                startPauseText.textContent = translate('pauseText');
            }
            startPauseBtn.classList.remove('btn-primary');
            startPauseBtn.classList.add('btn-danger');
            break;
    }
}

// ===== Format Time for Display =====
export function formatTimeForDisplay(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ===== Export All =====
export default {
    initTimer,
    configureTraining,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    restartTimer,
    getTimerState,
    getTrainingProgress,
    getTrainingConfig,
    setOnStateChange,
    setOnTimeUpdate,
    setOnRoundComplete,
    setOnSessionComplete,
    updateTrainingUI,
    updateStartPauseButton,
    refreshTimerLabels,
    setTrainingSoundEnabled,
    TimerState
};
