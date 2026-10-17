// ===== notifications.js - Sound Notifications Module =====

import { translate } from './i18n.js';

// ===== Sound Configuration =====
const defaultSoundConfig = {
    work: { enabled: true, volume: 0.55 },
    rest: { enabled: true, volume: 0.5 },
    round: { enabled: true, volume: 0.5 },
    complete: { enabled: true, volume: 0.65 }
};

const soundConfig = {
    work: { ...defaultSoundConfig.work },
    rest: { ...defaultSoundConfig.rest },
    round: { ...defaultSoundConfig.round },
    complete: { ...defaultSoundConfig.complete }
};

// ===== Audio Context =====
let audioContext = null;
let audioUnlocked = false;

// Beep patterns (frequency in Hz, start offset in seconds, duration)
const SOUND_PATTERNS = {
    work: [
        [880, 0, 0.14],
        [880, 0.2, 0.14]
    ],
    rest: [
        [523.25, 0, 0.18],
        [392, 0.2, 0.32]
    ],
    round: [
        [1046.5, 0, 0.09],
        [1318.5, 0.11, 0.09],
        [1568, 0.22, 0.16]
    ],
    complete: [
        [659.25, 0, 0.16],
        [783.99, 0.17, 0.16],
        [1046.5, 0.34, 0.2],
        [1318.5, 0.55, 0.45]
    ]
};

// ===== Initialize Notifications =====
export function initNotifications() {
    try {
        const unlock = () => {
            initAudioContext();
            audioUnlocked = true;
        };

        // Browsers (especially iOS Safari) require a user gesture before audio
        document.addEventListener('pointerdown', unlock, { passive: true });
        document.addEventListener('touchstart', unlock, { passive: true });
        document.addEventListener('keydown', unlock);

        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && audioContext && audioContext.state === 'suspended') {
                audioContext.resume().catch(() => {});
            }
        });
    } catch (error) {
        console.error('Failed to initialize notifications:', error);
    }
}

// ===== Initialize Audio Context =====
function initAudioContext() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) {
        return null;
    }

    if (!audioContext) {
        try {
            audioContext = new AudioContextClass();
        } catch (error) {
            console.error('Web Audio API is not available:', error);
            return null;
        }
    }

    if (audioContext.state === 'suspended') {
        audioContext.resume().catch(() => {});
    }

    return audioContext;
}

// ===== Schedule one tone =====
function scheduleTone(context, frequency, startOffset, duration, volume) {
    const startAt = context.currentTime + startOffset;
    const endAt = startAt + duration;

    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, startAt);

    gainNode.gain.setValueAtTime(0.0001, startAt);
    gainNode.gain.exponentialRampToValueAtTime(Math.max(volume, 0.0001), startAt + 0.015);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, endAt);

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.start(startAt);
    oscillator.stop(endAt + 0.02);
}

// ===== Play Sound =====
function playSound(type) {
    const config = soundConfig[type];
    if (!config || !config.enabled) return;

    const context = initAudioContext();
    if (!context) return;

    const pattern = SOUND_PATTERNS[type];
    if (!pattern) return;

    const start = () => {
        pattern.forEach(([frequency, offset, duration]) => {
            scheduleTone(context, frequency, offset, duration, config.volume);
        });
    };

    if (context.state === 'running') {
        start();
    } else {
        context.resume().then(start).catch(() => {
            // Audio was blocked before the user interacted with the page.
        });
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
    Object.values(soundConfig).forEach(config => {
        config.enabled = enabled;
    });
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

// ===== Check if audio has been unlocked by a gesture =====
export function isAudioUnlocked() {
    return audioUnlocked || (audioContext ? audioContext.state === 'running' : false);
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

    if (toastTimeout) {
        clearTimeout(toastTimeout);
    }

    toastMessage.textContent = message;

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

    toast.classList.add('visible');

    toastTimeout = setTimeout(() => {
        toast.classList.remove('visible');
    }, duration);
}

// ===== Confirmation Dialog =====

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
        const confirmTitle = document.getElementById('confirmTitle');
        const confirmMessage = document.getElementById('confirmMessage');
        const confirmBtn = document.getElementById('confirmDialogBtn');
        const cancelBtn = document.getElementById('cancelDialogBtn');
        const closeBtn = document.getElementById('closeDialog');

        if (!dialogOverlay) {
            resolve(false);
            return;
        }

        if (confirmTitle) confirmTitle.textContent = title;
        if (confirmMessage) confirmMessage.textContent = message;
        if (confirmBtn) confirmBtn.textContent = confirmText;
        if (cancelBtn) cancelBtn.textContent = cancelText;

        dialogOverlay.classList.add('visible');

        let settled = false;

        const cleanup = () => {
            if (confirmBtn) confirmBtn.removeEventListener('click', onConfirm);
            if (cancelBtn) cancelBtn.removeEventListener('click', onCancel);
            if (closeBtn) closeBtn.removeEventListener('click', onCancel);
            dialogOverlay.removeEventListener('click', onOverlayClick);
            document.removeEventListener('keydown', onKeyDown);
        };

        const finish = (result) => {
            if (settled) return;
            settled = true;
            dialogOverlay.classList.remove('visible');
            cleanup();
            resolve(result);
        };

        const onConfirm = () => finish(true);
        const onCancel = () => finish(false);

        const onOverlayClick = (event) => {
            if (event.target === dialogOverlay) {
                finish(false);
            }
        };

        const onKeyDown = (event) => {
            if (event.key === 'Escape') {
                finish(false);
            }
        };

        if (confirmBtn) confirmBtn.addEventListener('click', onConfirm);
        if (cancelBtn) cancelBtn.addEventListener('click', onCancel);
        if (closeBtn) closeBtn.addEventListener('click', onCancel);
        dialogOverlay.addEventListener('click', onOverlayClick);
        document.addEventListener('keydown', onKeyDown);
    });
}

// ===== Localized Notifications =====

/**
 * Show localized toast
 * @param {string} key - Translation key
 * @param {string} type - 'success' or 'error'
 */
export function showLocalizedToast(key, type = 'success') {
    showToast(translate(key), type);
}

/**
 * Show localized confirmation
 * @param {string} titleKey - Title translation key
 * @param {string} messageKey - Message translation key
 * @param {Object} replacements - Replacements for message
 * @returns {Promise<boolean>}
 */
export function showLocalizedConfirmation(titleKey, messageKey, replacements = {}) {
    const title = translate(titleKey);
    const message = translate(messageKey, replacements);

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
    isAudioUnlocked,
    setSoundVolume,
    enableSoundType,
    showToast,
    showConfirmation,
    showLocalizedToast,
    showLocalizedConfirmation
};
