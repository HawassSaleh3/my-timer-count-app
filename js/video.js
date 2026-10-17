// ===== video.js - Video Management Module =====

import { getVideoByExerciseId, storeVideo, deleteVideo, updateVideo } from './storage.js';
import { showLocalizedToast } from './notifications.js';

// ===== Video State =====
let currentVideoElement = null;
let currentVideoBlobUrl = null;
let currentVideoId = null;
let videoPlaybackMode = 'loop';
let isVideoPlaying = false;
let isVideoMuted = false;

// ===== Video Configuration =====
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
const SUPPORTED_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];

// ===== Initialize Video Module =====
export function initVideo() {
    try {
        // Setup video upload area
        setupVideoUpload();
        
        // Setup video preview
        setupVideoPreview();
        
        // Setup training video
        setupTrainingVideo();
    } catch (error) {
        console.error('Failed to initialize video module:', error);
    }
}

// ===== Setup Video Upload Area =====
function setupVideoUpload() {
    const uploadArea = document.getElementById('videoUploadArea');
    const fileInput = document.getElementById('videoFileInput');
    const previewContainer = document.getElementById('videoPreview');
    const placeholder = document.getElementById('uploadPlaceholder');
    const previewVideo = document.getElementById('previewVideo');
    const removeBtn = document.getElementById('removeVideoBtn');
    const videoName = document.getElementById('videoName');
    const videoSize = document.getElementById('videoSize');
    
    if (!uploadArea || !fileInput || !previewContainer || !placeholder || !previewVideo) return;
    
    // Click handler for upload area. Do not open the file picker when the
    // user interacts with video controls or the remove button.
    uploadArea.addEventListener('click', (event) => {
        if (event.target.closest('.video-preview') ||
            event.target.closest('button') ||
            event.target.closest('video')) {
            return;
        }
        fileInput.click();
    });
    
    // Drag and drop handlers
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        placeholder.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        placeholder.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        placeholder.classList.remove('dragover');
        
        if (e.dataTransfer.files.length > 0) {
            handleVideoFile(e.dataTransfer.files[0]);
        }
    });
    
    // File input change handler
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleVideoFile(e.target.files[0]);
        }
    });
    
    // Remove video handler
    if (removeBtn) {
        removeBtn.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            removeVideo();
        });
    }
}

// ===== Handle Video File =====
function handleVideoFile(file) {
    // Validate file
    if (!isValidVideoFile(file)) {
        showLocalizedToast('videoUploadError', 'error');
        return;
    }
    
    // Check size
    if (file.size > MAX_VIDEO_SIZE) {
        showLocalizedToast('videoSizeError', 'error');
        return;
    }
    
    // Check type (allow clips recorded on phones)
    if (!SUPPORTED_TYPES.includes(file.type) && !file.name.match(/\.(mp4|webm|ogg|mov)$/i)) {
        showLocalizedToast('videoFormatError', 'error');
        return;
    }
    
    // Create blob URL for preview
    const blobUrl = URL.createObjectURL(file);
    const previewVideo = document.getElementById('previewVideo');
    const previewContainer = document.getElementById('videoPreview');
    const placeholder = document.getElementById('uploadPlaceholder');
    const videoName = document.getElementById('videoName');
    const videoSize = document.getElementById('videoSize');
    
    if (previewVideo && previewContainer && placeholder) {
        // Update preview
        previewVideo.src = blobUrl;
        previewVideo.load();
        
        // Show preview
        placeholder.style.display = 'none';
        previewContainer.style.display = 'block';
        
        // Update video info
        if (videoName) {
            videoName.textContent = file.name;
        }
        if (videoSize) {
            videoSize.textContent = formatFileSize(file.size);
        }
        
        // Preview owns its own blob URL; the training video manages its own.
        currentVideoElement = previewVideo;

        const oldBlobUrl = previewVideo.getAttribute('data-blob-url');
        if (oldBlobUrl && oldBlobUrl !== blobUrl) {
            URL.revokeObjectURL(oldBlobUrl);
        }
        previewVideo.setAttribute('data-blob-url', blobUrl);
    }
}

// ===== Validate Video File =====
function isValidVideoFile(file) {
    if (!file) return false;

    // Some mobile browsers report an empty MIME type, so also check the name
    if (file.type && file.type.startsWith('video/')) return true;
    if (file.name && file.name.match(/\.(mp4|webm|ogg|mov)$/i)) return true;

    return false;
}

// ===== Format File Size =====
function formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// ===== Remove Video =====
function removeVideo() {
    const previewContainer = document.getElementById('videoPreview');
    const placeholder = document.getElementById('uploadPlaceholder');
    const previewVideo = document.getElementById('previewVideo');
    const fileInput = document.getElementById('videoFileInput');
    const videoName = document.getElementById('videoName');
    const videoSize = document.getElementById('videoSize');
    
    if (previewContainer && placeholder) {
        // Hide preview
        previewContainer.style.display = 'none';
        placeholder.style.display = 'block';
    }
    
    // Clear video
    if (previewVideo) {
        const blobUrl = previewVideo.getAttribute('data-blob-url');
        if (blobUrl) {
            URL.revokeObjectURL(blobUrl);
            previewVideo.removeAttribute('data-blob-url');
        }
        previewVideo.src = '';
    }
    
    // Clear file input
    if (fileInput) {
        fileInput.value = '';
    }
    
    // Clear info
    if (videoName) videoName.textContent = '';
    if (videoSize) videoSize.textContent = '';
    
    // Clear current video
    currentVideoBlobUrl = null;
    currentVideoId = null;
    
    showLocalizedToast('videoRemoved');
}

// ===== Setup Video Preview =====
function setupVideoPreview() {
    const previewVideo = document.getElementById('previewVideo');
    const videoModeLoop = document.getElementById('videoModeLoop');
    const videoModeOnce = document.getElementById('videoModeOnce');
    
    if (!previewVideo) return;
    
    // Update playback mode based on radio buttons
    function updatePlaybackMode() {
        if (videoModeLoop && videoModeLoop.checked) {
            videoPlaybackMode = 'loop';
            previewVideo.loop = true;
        } else if (videoModeOnce && videoModeOnce.checked) {
            videoPlaybackMode = 'once';
            previewVideo.loop = false;
        }
    }
    
    if (videoModeLoop) {
        videoModeLoop.addEventListener('change', updatePlaybackMode);
    }
    if (videoModeOnce) {
        videoModeOnce.addEventListener('change', updatePlaybackMode);
    }
    
    // Initialize
    updatePlaybackMode();
}

// ===== Setup Training Video =====
function setupTrainingVideo() {
    const trainingVideo = document.getElementById('trainingVideo');
    const videoToggle = document.getElementById('videoToggle');
    const videoOverlay = document.getElementById('videoOverlay');
    const fullscreenBtn = document.getElementById('fullscreenVideoBtn');
    
    if (!trainingVideo) return;
    
    currentVideoElement = trainingVideo;
    
    // Handle video toggle
    if (videoToggle) {
        videoToggle.addEventListener('click', () => {
            toggleTrainingVideo();
        });
    }
    
    // Handle video overlay click
    if (videoOverlay) {
        videoOverlay.addEventListener('click', () => {
            toggleTrainingVideo();
        });
    }
    
    // Handle video end
    trainingVideo.addEventListener('ended', () => {
        if (videoPlaybackMode === 'loop') {
            trainingVideo.currentTime = 0;
            trainingVideo.play().catch(() => {});
        }
    });
    
    // Handle fullscreen button
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', () => {
            toggleFullscreen(trainingVideo);
        });
    }
    
    // Show fullscreen button only when a real video is loaded
    trainingVideo.addEventListener('loadedmetadata', () => {
        if (fullscreenBtn) {
            fullscreenBtn.style.display = 'flex';
        }
    });

    trainingVideo.addEventListener('error', () => {
        console.warn('Training video could not be loaded');
        if (fullscreenBtn) {
            fullscreenBtn.style.display = 'none';
        }
    });
}

// ===== Toggle Training Video =====
function toggleTrainingVideo() {
    const trainingVideo = document.getElementById('trainingVideo');
    const videoToggle = document.getElementById('videoToggle');
    const videoOverlay = document.getElementById('videoOverlay');
    
    if (!trainingVideo || !hasTrainingVideoSource(trainingVideo)) return;
    
    if (isVideoPlaying) {
        trainingVideo.pause();
        isVideoPlaying = false;
        if (videoToggle) {
            videoToggle.classList.add('paused');
        }
        if (videoOverlay) {
            videoOverlay.classList.add('visible');
        }
    } else {
        trainingVideo.play().catch(() => {});
        isVideoPlaying = true;
        if (videoToggle) {
            videoToggle.classList.remove('paused');
        }
        if (videoOverlay) {
            videoOverlay.classList.remove('visible');
        }
    }
}

// ===== Toggle Fullscreen =====
function toggleFullscreen(element) {
    if (!element) return;

    // iOS Safari exposes a non-standard fullscreen API on <video>
    if (typeof element.webkitEnterFullscreen === 'function' && !element.webkitSupportsFullscreen) {
        try {
            element.webkitEnterFullscreen();
            return;
        } catch (error) {
            // Fall through to the standard API below
        }
    }

    if (!document.fullscreenElement) {
        const request = element.requestFullscreen ||
            element.webkitRequestFullscreen ||
            element.msRequestFullscreen;

        if (request) {
            const result = request.call(element);
            if (result && result.catch) {
                result.catch(error => console.warn('Fullscreen failed:', error));
            }
        } else if (typeof element.webkitEnterFullscreen === 'function') {
            element.webkitEnterFullscreen();
        }
    } else {
        const exit = document.exitFullscreen ||
            document.webkitExitFullscreen ||
            document.msExitFullscreen;
        if (exit) exit.call(document);
    }
}

// ===== Does the training video have a source? =====
function hasTrainingVideoSource(video) {
    return !!(video && (video.getAttribute('src') || video.currentSrc));
}

// ===== Play Training Video =====
export function playTrainingVideo() {
    const trainingVideo = document.getElementById('trainingVideo');
    const videoToggle = document.getElementById('videoToggle');
    const videoOverlay = document.getElementById('videoOverlay');
    
    if (!trainingVideo || !hasTrainingVideoSource(trainingVideo)) return;

    // Browsers only allow autoplay after a gesture; if it is blocked the
    // overlay stays visible so the user can start the video with one tap.
    // Apply playback mode
    trainingVideo.loop = videoPlaybackMode === 'loop';
    
    trainingVideo.play().then(() => {
        isVideoPlaying = true;
        if (videoToggle) {
            videoToggle.classList.remove('paused');
        }
        if (videoOverlay) {
            videoOverlay.classList.remove('visible', 'hidden-overlay');
        }
    }).catch(error => {
        // Autoplay can be blocked on mobile; keep a tappable overlay so the
        // athlete can start the video with one touch.
        isVideoPlaying = false;
        if (videoToggle) {
            videoToggle.classList.add('paused');
        }
        if (videoOverlay) {
            videoOverlay.classList.remove('hidden-overlay');
            videoOverlay.classList.add('visible');
        }
        console.warn('Video playback was blocked:', error && error.name);
    });
}

// ===== Restart Training Video (new work round) =====
export function restartTrainingVideo() {
    const trainingVideo = document.getElementById('trainingVideo');

    if (!trainingVideo || !hasTrainingVideoSource(trainingVideo)) return;

    try {
        trainingVideo.currentTime = 0;
    } catch (error) {
        // Metadata might not be ready yet
    }

    playTrainingVideo();
}

// ===== Pause Training Video =====
export function pauseTrainingVideo() {
    const trainingVideo = document.getElementById('trainingVideo');
    const videoToggle = document.getElementById('videoToggle');
    const videoOverlay = document.getElementById('videoOverlay');
    
    if (!trainingVideo) return;
    
    trainingVideo.pause();
    isVideoPlaying = false;
    if (videoToggle) {
        videoToggle.classList.add('paused');
    }
    if (videoOverlay) {
        videoOverlay.classList.add('visible');
    }
}

// ===== Stop Training Video =====
export function stopTrainingVideo() {
    const trainingVideo = document.getElementById('trainingVideo');
    
    if (!trainingVideo) return;
    
    trainingVideo.pause();
    trainingVideo.currentTime = 0;
    isVideoPlaying = false;
}

// ===== Reset Training Video =====
export function resetTrainingVideo() {
    const trainingVideo = document.getElementById('trainingVideo');
    const videoToggle = document.getElementById('videoToggle');
    const videoOverlay = document.getElementById('videoOverlay');
    
    if (!trainingVideo) return;
    
    trainingVideo.pause();
    trainingVideo.currentTime = 0;
    isVideoPlaying = false;
    
    if (videoToggle) {
        videoToggle.classList.add('paused');
    }
    if (videoOverlay) {
        videoOverlay.classList.add(hasTrainingVideoSource(trainingVideo) ? 'visible' : 'hidden-overlay');
    }
}

// ===== Set Training Video Source =====
export async function setTrainingVideoSource(exerciseId) {
    const trainingVideo = document.getElementById('trainingVideo');
    const trainingVideoContainer = document.getElementById('trainingVideoContainer');
    const fullscreenBtn = document.getElementById('fullscreenVideoBtn');
    const videoOverlay = document.getElementById('videoOverlay');

    if (!trainingVideo) return null;

    try {
        const video = await getVideoByExerciseId(exerciseId);

        if (video && video.blobUrl) {
            // Release the previous training URL before replacing it
            if (currentVideoBlobUrl && currentVideoBlobUrl !== video.blobUrl) {
                URL.revokeObjectURL(currentVideoBlobUrl);
            }

            trainingVideo.src = video.blobUrl;
            trainingVideo.load();

            currentVideoBlobUrl = video.blobUrl;
            currentVideoId = video.id;

            if (trainingVideoContainer) trainingVideoContainer.classList.remove('no-video');
            if (fullscreenBtn) fullscreenBtn.style.display = 'none';
            if (videoOverlay) {
                videoOverlay.classList.remove('hidden-overlay');
                videoOverlay.classList.add('visible');
            }

            return video;
        }

        // No video for this exercise: clean everything and hide the area
        if (currentVideoBlobUrl) {
            URL.revokeObjectURL(currentVideoBlobUrl);
        }
        currentVideoBlobUrl = null;
        currentVideoId = null;

        trainingVideo.pause();
        trainingVideo.removeAttribute('src');
        trainingVideo.load();

        if (trainingVideoContainer) trainingVideoContainer.classList.add('no-video');
        if (fullscreenBtn) fullscreenBtn.style.display = 'none';
        if (videoOverlay) videoOverlay.classList.remove('visible');

        return null;
    } catch (error) {
        console.warn('Failed to load video:', error);

        trainingVideo.pause();
        trainingVideo.removeAttribute('src');
        trainingVideo.load();

        if (trainingVideoContainer) trainingVideoContainer.classList.add('no-video');
        if (fullscreenBtn) fullscreenBtn.style.display = 'none';
        if (videoOverlay) videoOverlay.classList.remove('visible');

        currentVideoBlobUrl = null;
        currentVideoId = null;

        return null;
    }
}

// ===== Set Video Playback Mode =====
export function setVideoPlaybackMode(mode) {
    videoPlaybackMode = mode;
    const trainingVideo = document.getElementById('trainingVideo');
    
    if (trainingVideo) {
        trainingVideo.loop = mode === 'loop';
    }
}

// ===== Get Video Playback Mode =====
export function getVideoPlaybackMode() {
    return videoPlaybackMode;
}

// ===== Get Current Video Info =====
export function getCurrentVideoInfo() {
    return {
        blobUrl: currentVideoBlobUrl,
        id: currentVideoId,
        element: currentVideoElement
    };
}

// ===== Save Video for Exercise =====
export async function saveVideoForExercise(file, exerciseId) {
    try {
        // Validate file
        if (!isValidVideoFile(file)) {
            showLocalizedToast('videoUploadError', 'error');
            return null;
        }
        
        // Check size
        if (file.size > MAX_VIDEO_SIZE) {
            showLocalizedToast('videoSizeError', 'error');
            return null;
        }
        
        // Store video
        const video = await storeVideo(file, exerciseId);
        
        // Update exercise with video ID
        return video;
    } catch (error) {
        console.error('Failed to save video:', error);
        showLocalizedToast('videoUploadError', 'error');
        return null;
    }
}

// ===== Update Video for Exercise =====
export async function updateVideoForExercise(file, videoId, exerciseId) {
    try {
        // Validate file
        if (!isValidVideoFile(file)) {
            showLocalizedToast('videoUploadError', 'error');
            return null;
        }
        
        // Check size
        if (file.size > MAX_VIDEO_SIZE) {
            showLocalizedToast('videoSizeError', 'error');
            return null;
        }
        
        // Update video
        const video = await updateVideo(videoId, file);
        return video;
    } catch (error) {
        console.error('Failed to update video:', error);
        showLocalizedToast('videoUploadError', 'error');
        return null;
    }
}

// ===== Remove Video from Exercise =====
export async function removeVideoFromExercise(videoId) {
    try {
        await deleteVideo(videoId);
        return true;
    } catch (error) {
        console.error('Failed to delete video:', error);
        return false;
    }
}

// ===== Cleanup Video Resources =====
export function cleanupVideoResources() {
    const trainingVideo = document.getElementById('trainingVideo');

    // Release the URL owned by the training player
    if (currentVideoBlobUrl) {
        URL.revokeObjectURL(currentVideoBlobUrl);
        currentVideoBlobUrl = null;
    }

    if (trainingVideo) {
        trainingVideo.pause();
        if (trainingVideo.getAttribute('src') && trainingVideo.getAttribute('src').startsWith('blob:')) {
            trainingVideo.removeAttribute('src');
            trainingVideo.load();
        }
    }

    // Reset state
    currentVideoId = null;
    currentVideoElement = null;
    isVideoPlaying = false;
}

// ===== Get Video Mode from Form =====
export function getVideoModeFromForm() {
    const loopRadio = document.getElementById('videoModeLoop');
    const onceRadio = document.getElementById('videoModeOnce');
    
    if (loopRadio && loopRadio.checked) {
        return 'loop';
    } else if (onceRadio && onceRadio.checked) {
        return 'once';
    }
    
    return 'loop'; // Default
}

// ===== Set Video Mode in Form =====
export function setVideoModeInForm(mode) {
    const loopRadio = document.getElementById('videoModeLoop');
    const onceRadio = document.getElementById('videoModeOnce');
    
    if (loopRadio && onceRadio) {
        loopRadio.checked = mode === 'loop';
        onceRadio.checked = mode === 'once';
    }
}

// ===== Export All =====
export default {
    initVideo,
    playTrainingVideo,
    restartTrainingVideo,
    pauseTrainingVideo,
    stopTrainingVideo,
    resetTrainingVideo,
    setTrainingVideoSource,
    setVideoPlaybackMode,
    getVideoPlaybackMode,
    getCurrentVideoInfo,
    saveVideoForExercise,
    updateVideoForExercise,
    removeVideoFromExercise,
    cleanupVideoResources,
    getVideoModeFromForm,
    setVideoModeInForm
};
