// ===== notifications.js - Sound Notifications Module =====

import { getCurrentLanguage, translate } from './i18n.js';

// ===== Sound Configuration =====
const soundConfig = {
    work: {
        enabled: true,
        volume: 0.8
    },
    rest: {
        enabled: true,
        volume: 0.8
    },
    round: {
        enabled: true,
        volume: 0.8
    },
    complete: {
        enabled: true,
        volume: 1.0
    }
};

// ===== Audio Context =====
let audioContext = null;
let audioElements = {};
let oscillators = {};

// ===== Initialize Notifications =====
export function initNotifications() {
    // Create audio elements
    createAudioElements();
    
    // Request audio context on first user interaction
    document.addEventListener('click', initAudioContext, { once: true });
    document.addEventListener('touchstart', initAudioContext, { once: true });
}

// ===== Create Audio Elements =====
function createAudioElements() {
    // Work sound (beep)
    audioElements.work = document.getElementById('workSound');
    
    // Rest sound (different beep)
    audioElements.rest = document.getElementById('restSound');
    
    // Round sound (short beep)
    audioElements.round = document.getElementById('roundSound');
    
    // Complete sound (long beep or chime)
    audioElements.complete = document.getElementById('completeSound');
    
    // Fallback: Create Web Audio API tones if audio files are missing
    if (!audioElements.work) {
        audioElements.work = createToneElement(800, 0.2);
    }
    if (!audioElements.rest) {
        audioElements.rest = createToneElement(400, 0.2);
    }
    if (!audioElements.round) {
        audioElements.round = createToneElement(1000, 0.1);
    }
    if (!audioElements.complete) {
        audioElements.complete = createToneElement(1200, 0.5);
    }
}

// ===== Create Tone Element using Web Audio API =====
function createToneElement(frequency, duration) {
    const element = document.createElement('audio');
    element.id = `tone-${frequency}`;
    document.body.appendChild(element);
    return element;
}

// ===== Initialize Audio Context =====
function initAudioContext() {
    if (!audioContext) {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            // Create tone generators
            createToneGenerators();
        } catch (error) {
            console.error('Web Audio API not supported:', error);
        }
    }
}

// ===== Create Tone Generators =====
function createToneGenerators() {
    // Work tone (800Hz)
    oscillators.work = createOscillator(800, 'sine');
    
    // Rest tone (400Hz)
    oscillators.rest = createOscillator(400, 'sine');
    
    // Round tone (1000Hz)
    oscillators.round = createOscillator(1000, 'sine');
    
    // Complete tone (1200Hz)
    oscillators.complete = createOscillator(1200, 'sine');
}

// ===== Create Oscillator =====
function createOscillator(frequency, type) {
    if (!audioContext) return null;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gainNode.gain.value = 0;
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    return { oscillator, gainNode };
}

// ===== Play Sound =====
function playSound(type) {
    const config = soundConfig[type];
    if (!config || !config.enabled) return;
    
    // Try HTML5 audio first
    if (audioElements[type]) {
        try {
            audioElements[type].currentTime = 0;
            audioElements[type].volume = config.volume;
            audioElements[type].play().catch(error => {
                console.warn(`Failed to play ${type} sound:`, error);
                // Fallback to Web Audio API
                playTone(type);
            });
        } catch (error) {
            console.warn(`Failed to play ${type} sound:`, error);
            playTone(type);
        }
    } else {
        playTone(type);
    }
}

// ===== Play Tone using Web Audio API =====
function playTone(type) {
    if (!audioContext) {
        // Try to initialize audio context
        initAudioContext();
        if (!audioContext) return;
    }
    
    const oscillator = oscillators[type];
    if (!oscillator) return;
    
    const now = audioContext.currentTime;
    const config = soundConfig[type];
    
    // Set gain
    oscillator.gainNode.gain.cancelScheduledValues(now);
    oscillator.gainNode.gain.setValueAtTime(0, now);
    oscillator.gainNode.gain.linearRampToValueAtTime(config.volume, now + 0.01);
    
    // Set duration based on type
    let duration = 0.2;
    if (type === 'complete') duration = 0.5;
    if (type === 'rest') duration = 0.3;
    
    // Schedule stop
    oscillator.gainNode.gain.linearRampToValueAtTime(0, now + duration);
    
    // Start oscillator if not already running
    if (oscillator.oscillator.state !== 'running') {
        oscillator.oscillator.start(now);
    }
}

// ===== Notification Types =====
export function playWorkNotification() {
    playSound('work');
}

export function playRestNotification() {
    playSound('rest');
}

export function playRoundNotification() {
    playSound('round');
}

export function playCompleteNotification() {
    playSound('complete');
}

// ===== Enable/Disable Sounds =====
export function enableSounds(enabled) {
    soundConfig.work.enabled = enabled;
    soundConfig.rest.enabled = enabled;
    soundConfig.round.enabled = enabled;
    soundConfig.complete.enabled = enabled;
}

export function isSoundEnabled() {
    return soundConfig.work.enabled;
}

// ===== Set Sound Volume =====
export function setSoundVolume(type, volume) {
    if (soundConfig[type]) {
        soundConfig[type].volume = Math.min(1, Math.max(0, volume));
    }
}

// ===== Enable/Disable Specific Sound =====
export function enableSoundType(type, enabled) {
    if (soundConfig[type]) {
        soundConfig[type].enabled = enabled;
    }
}

// ===== Toast Notifications =====

let toastTimeout = null;

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} type - 'success' or 'error'
 * @param {number} duration - Duration in milliseconds
 */
export function showToast(message, type = 'success', duration = 3000) {
    const toast = document.getElementById('toastNotification');
    const toastMessage = document.getElementById('toastMessage');
    const toastIcon = document.getElementById('toastIcon');
    
    if (!toast || !toastMessage) return;
    
    // Clear existing timeout
    if (toastTimeout) {
        clearTimeout(toastTimeout);
    }
    
    // Update content
    toastMessage.textContent = message;
    
    // Update icon based on type
    if (toastIcon) {
        if (type === 'error') {
            toastIcon.innerHTML = `
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            `;
            toast.classList.add('error');
            toast.classList.remove('success');
        } else {
            toastIcon.innerHTML = `
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22,4 12,14.01 9,11.01"></polyline>
            `;
            toast.classList.add('success');
            toast.classList.remove('error');
        }
    }
    
    // Show toast
    toast.classList.add('visible');
    
    // Hide after duration
    toastTimeout = setTimeout(() => {
        toast.classList.remove('visible');
    }, duration);
}

// ===== Confirmation Dialog =====

let confirmCallback = null;
let cancelCallback = null;

/**
 * Show confirmation dialog
 * @param {string} title - Dialog title
 * @param {string} message - Dialog message
 * @param {string} confirmText - Confirm button text
 * @param {string} cancelText - Cancel button text
 * @returns {Promise<boolean>} True if confirmed, false if cancelled
 */
export function showConfirmation(title, message, confirmText = 'Confirm', cancelText = 'Cancel') {
    return new Promise((resolve) => {
        const dialogOverlay = document.getElementById('confirmationDialog');
        const dialogBox = document.getElementById('confirmationDialogBox');
        const confirmTitle = document.getElementById('confirmTitle');
        const confirmMessage = document.getElementById('confirmMessage');
        const confirmBtn = document.getElementById('confirmDialogBtn');
        const cancelBtn = document.getElementById('cancelDialogBtn');
        
        if (!dialogOverlay || !dialogBox) {
            resolve(false);
            return;
        }
        
        // Set content
        if (confirmTitle) confirmTitle.textContent = title;
        if (confirmMessage) confirmMessage.textContent = message;
        if (confirmBtn) confirmBtn.textContent = confirmText;
        if (cancelBtn) cancelBtn.textContent = cancelText;
        
        // Show dialog
        dialogOverlay.classList.add('visible');
        
        // Handle buttons
        const onConfirm = () => {
            dialogOverlay.classList.remove('visible');
            cleanup();
            resolve(true);
        };
        
        const onCancel = () => {
            dialogOverlay.classList.remove('visible');
            cleanup();
            resolve(false);
        };
        
        const cleanup = () => {
            if (confirmBtn) confirmBtn.removeEventListener('click', onConfirm);
            if (cancelBtn) cancelBtn.removeEventListener('click', onCancel);
            const closeBtn = document.getElementById('closeDialog');
            if (closeBtn) closeBtn.removeEventListener('click', onCancel);
            dialogOverlay.removeEventListener('click', onOverlayClick);
        };
        
        const onOverlayClick = (e) => {
            if (e.target === dialogOverlay) {
                onCancel();
            }
        };
        
        if (confirmBtn) confirmBtn.addEventListener('click', onConfirm);
        if (cancelBtn) cancelBtn.addEventListener('click', onCancel);
        
        const closeBtn = document.getElementById('closeDialog');
        if (closeBtn) closeBtn.addEventListener('click', onCancel);
        
        dialogOverlay.addEventListener('click', onOverlayClick);
    });
}

// ===== Localized Notifications =====

/**
 * Show localized toast
 * @param {string} key - Translation key
 * @param {string} type - 'success' or 'error'
 */
export function showLocalizedToast(key, type = 'success') {
    const message = translate(key);
    showToast(message, type);
}

/**
 * Show localized confirmation
 * @param {string} titleKey - Title translation key
 * @param {string} messageKey - Message translation key
 * @param {Object} replacements - Replacements for message
 * @returns {Promise<boolean>}
 */
export async function showLocalizedConfirmation(titleKey, messageKey, replacements = {}) {
    const title = translate(titleKey);
    let message = translate(messageKey, replacements);
    
    return showConfirmation(title, message, translate('confirmDialogText'), translate('cancelDialogText'));
}

// ===== Export All =====
export default {
    initNotifications,
    playWorkNotification,
    playRestNotification,
    playRoundNotification,
    playCompleteNotification,
    enableSounds,
    isSoundEnabled,
    setSoundVolume,
    enableSoundType,
    showToast,
    showConfirmation,
    showLocalizedToast,
    showLocalizedConfirmation
};
