// ===== storage.js - IndexedDB Storage Module =====

const DB_NAME = 'SkillTimerDB';
const DB_VERSION = 1;

// Object store names
const EXERCISE_STORE = 'exercises';
const VIDEO_STORE = 'videos';

// ===== Database Schema =====
const dbSchema = {
    exercises: {
        keyPath: 'id',
        autoIncrement: false,
        indexes: [
            { name: 'name', keyPath: 'name', unique: false },
            { name: 'category', keyPath: 'category', unique: false },
            { name: 'createdAt', keyPath: 'createdAt', unique: false },
            { name: 'updatedAt', keyPath: 'updatedAt', unique: false }
        ]
    },
    videos: {
        keyPath: 'id',
        autoIncrement: false,
        indexes: [
            { name: 'exerciseId', keyPath: 'exerciseId', unique: false },
            { name: 'type', keyPath: 'type', unique: false },
            { name: 'size', keyPath: 'size', unique: false },
            { name: 'uploadedAt', keyPath: 'uploadedAt', unique: false }
        ]
    }
};

// ===== Database Instance =====
let db = null;
let dbPromise = null;

// ===== Helpers =====
function toInt(value, fallback) {
    const parsed = parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function generateId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function transactionError(transaction, fallbackMessage) {
    const error = transaction.error || new Error(fallbackMessage);
    return error;
}

// Some records created by older versions of the app stored a blob URL
// string which is no longer valid after a reload. Always prefer a fresh
// object URL created from the stored Blob.
function withBlobUrl(video) {
    if (!video) return null;

    const result = { ...video };
    let blobUrl = null;

    if (video.blob) {
        try {
            blobUrl = URL.createObjectURL(video.blob);
        } catch (error) {
            console.warn('Could not create an object URL for the video:', error);
        }
    }

    // Legacy fallback (only used if the stored Blob is unavailable)
    if (!blobUrl && typeof video.blobUrl === 'string') {
        blobUrl = video.blobUrl;
    }

    result.blobUrl = blobUrl;
    return result;
}

// ===== Initialize Database =====
export function initDB() {
    if (db) {
        return Promise.resolve(db);
    }

    if (!dbPromise) {
        dbPromise = new Promise((resolve, reject) => {
            if (typeof window === 'undefined' || !window.indexedDB) {
                reject(new Error('IndexedDB is not supported in this browser'));
                return;
            }

            let settled = false;
            let recoveryAttempted = false;
            const timeout = setTimeout(() => {
                if (!settled) {
                    settled = true;
                    dbPromise = null;
                    reject(new Error('IndexedDB open timed out'));
                }
            }, 10000);

            const fail = (error) => {
                clearTimeout(timeout);
                if (!settled) {
                    settled = true;
                    dbPromise = null;
                    reject(error);
                }
            };

            // A corrupted database (common after storage pressure on mobile
            // browsers) previously made the whole app unusable forever. Try to
            // recover once by deleting the broken database and reopening it.
            // The app keeps working; only the previously stored data is lost.
            const tryRecovery = (originalError) => {
                if (recoveryAttempted || !window.indexedDB.deleteDatabase) {
                    fail(originalError);
                    return;
                }
                recoveryAttempted = true;
                console.warn('IndexedDB could not be opened. Attempting one-time recovery.', originalError);

                let deleteSettled = false;
                const deleteTimeout = setTimeout(() => {
                    if (!deleteSettled) {
                        deleteSettled = true;
                        fail(originalError);
                    }
                }, 5000);

                const deleteRequest = window.indexedDB.deleteDatabase(DB_NAME);
                deleteRequest.onerror = () => {
                    if (!deleteSettled) {
                        deleteSettled = true;
                        clearTimeout(deleteTimeout);
                        fail(originalError);
                    }
                };
                deleteRequest.onblocked = () => {
                    // Another tab still holds the old connection; give up quietly.
                    if (!deleteSettled) {
                        deleteSettled = true;
                        clearTimeout(deleteTimeout);
                        fail(originalError);
                    }
                };
                deleteRequest.onsuccess = () => {
                    if (deleteSettled) return;
                    deleteSettled = true;
                    clearTimeout(deleteTimeout);

                    try {
                        attachHandlers(window.indexedDB.open(DB_NAME, DB_VERSION));
                    } catch (retryError) {
                        fail(retryError);
                    }
                };
            };

            const attachHandlers = (req) => {
                req.onerror = () => {
                    tryRecovery(req.error || new Error('Failed to open database'));
                };

                req.onblocked = () => {
                    console.warn('IndexedDB upgrade is blocked by another open tab');
                };

                req.onupgradeneeded = () => {
                    const database = req.result;

                    if (!database.objectStoreNames.contains(EXERCISE_STORE)) {
                        const store = database.createObjectStore(EXERCISE_STORE, {
                            keyPath: dbSchema.exercises.keyPath,
                            autoIncrement: dbSchema.exercises.autoIncrement
                        });
                        dbSchema.exercises.indexes.forEach(index => {
                            store.createIndex(index.name, index.keyPath, { unique: index.unique });
                        });
                    }

                    if (!database.objectStoreNames.contains(VIDEO_STORE)) {
                        const store = database.createObjectStore(VIDEO_STORE, {
                            keyPath: dbSchema.videos.keyPath,
                            autoIncrement: dbSchema.videos.autoIncrement
                        });
                        dbSchema.videos.indexes.forEach(index => {
                            store.createIndex(index.name, index.keyPath, { unique: index.unique });
                        });
                    }
                };

                req.onsuccess = () => {
                    clearTimeout(timeout);
                    db = req.result;

                    db.onversionchange = () => {
                        db.close();
                        db = null;
                        dbPromise = null;
                    };

                    if (!settled) {
                        settled = true;
                        resolve(db);
                    } else {
                        // The timeout already fired; a later successful open can
                        // still be reused without surfacing a stale error.
                        dbPromise = Promise.resolve(db);
                    }
                };
            };

            try {
                attachHandlers(window.indexedDB.open(DB_NAME, DB_VERSION));
            } catch (error) {
                fail(error);
            }
        });
    }

    return dbPromise;
}

// ===== Exercise CRUD Operations =====

/**
 * Create a new exercise
 * @param {Object} exerciseData - Exercise data
 * @returns {Promise<Object>} Created exercise with ID
 */
export async function createExercise(exerciseData = {}) {
    const database = await initDB();

    const exercise = {
        id: generateId(),
        name: String(exerciseData.name || '').trim(),
        description: String(exerciseData.description || '').trim(),
        category: exerciseData.category || '',
        workDuration: clamp(toInt(exerciseData.workDuration, 30), 1, 3600),
        // 0 is a valid value (no rest / no preparation countdown)
        restDuration: clamp(toInt(exerciseData.restDuration, 10), 0, 3600),
        rounds: clamp(toInt(exerciseData.rounds, 5), 1, 99),
        videoId: exerciseData.videoId || null,
        videoMode: exerciseData.videoMode === 'once' ? 'once' : 'loop',
        soundEnabled: exerciseData.soundEnabled !== false,
        preparationCountdown: clamp(toInt(exerciseData.preparationCountdown, 3), 0, 60),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
        const transaction = database.transaction([EXERCISE_STORE], 'readwrite');
        const store = transaction.objectStore(EXERCISE_STORE);

        transaction.oncomplete = () => resolve(exercise);
        transaction.onerror = () => reject(transactionError(transaction, 'Failed to create exercise'));
        transaction.onabort = () => reject(transactionError(transaction, 'Create exercise was aborted'));

        store.add(exercise);
    });
}

/**
 * Get all exercises
 * @returns {Promise<Array>} Array of exercises
 */
export async function getAllExercises() {
    const database = await initDB();

    return new Promise((resolve, reject) => {
        const transaction = database.transaction([EXERCISE_STORE], 'readonly');
        const store = transaction.objectStore(EXERCISE_STORE);
        const request = store.getAll();

        request.onsuccess = () => {
            const exercises = request.result.sort((a, b) =>
                new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
            );
            resolve(exercises);
        };
        request.onerror = () => reject(request.error || new Error('Failed to load exercises'));
    });
}

/**
 * Get exercise by ID
 * @param {string} id - Exercise ID
 * @returns {Promise<Object|null>} Exercise or null
 */
export async function getExerciseById(id) {
    if (!id) return null;
    const database = await initDB();

    return new Promise((resolve, reject) => {
        const transaction = database.transaction([EXERCISE_STORE], 'readonly');
        const store = transaction.objectStore(EXERCISE_STORE);
        const request = store.get(id);

        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error || new Error('Failed to load exercise'));
    });
}

/**
 * Update exercise
 * @param {string} id - Exercise ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated exercise
 */
export async function updateExercise(id, updates = {}) {
    const database = await initDB();

    return new Promise((resolve, reject) => {
        const transaction = database.transaction([EXERCISE_STORE], 'readwrite');
        const store = transaction.objectStore(EXERCISE_STORE);
        let updatedExercise = null;

        const getRequest = store.get(id);

        getRequest.onsuccess = () => {
            const exercise = getRequest.result;
            if (!exercise) {
                reject(new Error('Exercise not found'));
                try { transaction.abort(); } catch (error) { /* ignore */ }
                return;
            }

            const sanitized = { ...updates };
            if ('workDuration' in sanitized) sanitized.workDuration = clamp(toInt(sanitized.workDuration, 30), 1, 3600);
            if ('restDuration' in sanitized) sanitized.restDuration = clamp(toInt(sanitized.restDuration, 10), 0, 3600);
            if ('rounds' in sanitized) sanitized.rounds = clamp(toInt(sanitized.rounds, 5), 1, 99);
            if ('preparationCountdown' in sanitized) sanitized.preparationCountdown = clamp(toInt(sanitized.preparationCountdown, 3), 0, 60);
            if ('name' in sanitized) sanitized.name = String(sanitized.name || '').trim();
            if ('videoMode' in sanitized) sanitized.videoMode = sanitized.videoMode === 'once' ? 'once' : 'loop';

            updatedExercise = Object.assign(exercise, sanitized, {
                updatedAt: new Date().toISOString()
            });

            store.put(updatedExercise);
        };

        getRequest.onerror = () => reject(getRequest.error || new Error('Failed to load exercise'));

        transaction.oncomplete = () => {
            if (updatedExercise) resolve(updatedExercise);
        };
        transaction.onerror = () => reject(transactionError(transaction, 'Failed to update exercise'));
        transaction.onabort = () => reject(transactionError(transaction, 'Update exercise was aborted'));
    });
}

/**
 * Delete exercise and its videos
 * @param {string} id - Exercise ID
 * @returns {Promise<void>}
 */
export async function deleteExercise(id) {
    if (!id) return;
    const database = await initDB();

    return new Promise((resolve, reject) => {
        const transaction = database.transaction([EXERCISE_STORE, VIDEO_STORE], 'readwrite');
        const exerciseStore = transaction.objectStore(EXERCISE_STORE);
        const videoStore = transaction.objectStore(VIDEO_STORE);

        const getRequest = exerciseStore.get(id);

        getRequest.onsuccess = () => {
            const exercise = getRequest.result;

            if (exercise && exercise.videoId) {
                videoStore.delete(exercise.videoId);
            }

            // Also remove any video attached through the exerciseId index
            const index = videoStore.index('exerciseId');
            const keysRequest = index.getAllKeys(id);
            keysRequest.onsuccess = () => {
                keysRequest.result.forEach(key => videoStore.delete(key));
            };

            exerciseStore.delete(id);
        };

        getRequest.onerror = () => reject(getRequest.error || new Error('Failed to load exercise'));

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transactionError(transaction, 'Failed to delete exercise'));
        transaction.onabort = () => reject(transactionError(transaction, 'Delete exercise was aborted'));
    });
}

/**
 * Delete all exercises and videos
 * @returns {Promise<void>}
 */
export async function deleteAllExercises() {
    const database = await initDB();

    return new Promise((resolve, reject) => {
        const transaction = database.transaction([EXERCISE_STORE, VIDEO_STORE], 'readwrite');
        transaction.objectStore(EXERCISE_STORE).clear();
        transaction.objectStore(VIDEO_STORE).clear();

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transactionError(transaction, 'Failed to clear data'));
        transaction.onabort = () => reject(transactionError(transaction, 'Clear data was aborted'));
    });
}

// ===== Video Storage Operations =====

/**
 * Store a video blob. An exercise can only have one video, so any
 * previously stored video for the same exercise is replaced.
 * @param {Blob} blob - Video blob
 * @param {string} exerciseId - Associated exercise ID
 * @returns {Promise<Object>} Video metadata
 */
export async function storeVideo(blob, exerciseId) {
    if (!blob) throw new Error('No video file provided');
    const database = await initDB();

    return new Promise((resolve, reject) => {
        const transaction = database.transaction([VIDEO_STORE], 'readwrite');
        const store = transaction.objectStore(VIDEO_STORE);
        const videoId = generateId();
        let storedVideo = null;

        const video = {
            id: videoId,
            exerciseId: exerciseId || '',
            blob: blob,
            name: blob.name || `video-${videoId}`,
            type: blob.type || 'video/mp4',
            size: blob.size,
            uploadedAt: new Date().toISOString()
        };

        // Remove any existing video for this exercise first
        const index = store.index('exerciseId');
        const keysRequest = index.getAllKeys(exerciseId || '');

        keysRequest.onsuccess = () => {
            keysRequest.result.forEach(key => store.delete(key));
            storedVideo = video;
            store.add(video);
        };

        keysRequest.onerror = () => {
            // If the index lookup fails, still try to save the new video
            storedVideo = video;
            store.add(video);
        };

        transaction.oncomplete = () => resolve(storedVideo || video);
        transaction.onerror = () => reject(transactionError(transaction, 'Failed to store video'));
        transaction.onabort = () => reject(transactionError(transaction, 'Storing the video was aborted'));
    });
}

/**
 * Get video by ID
 * @param {string} id - Video ID
 * @returns {Promise<Object|null>} Video or null
 */
export async function getVideoById(id) {
    if (!id) return null;
    const database = await initDB();

    return new Promise((resolve, reject) => {
        const transaction = database.transaction([VIDEO_STORE], 'readonly');
        const store = transaction.objectStore(VIDEO_STORE);
        const request = store.get(id);

        request.onsuccess = () => resolve(withBlobUrl(request.result));
        request.onerror = () => reject(request.error || new Error('Failed to load video'));
    });
}

/**
 * Get video by exercise ID
 * @param {string} exerciseId - Exercise ID
 * @returns {Promise<Object|null>} Video or null
 */
export async function getVideoByExerciseId(exerciseId) {
    if (!exerciseId) return null;
    const database = await initDB();

    return new Promise((resolve, reject) => {
        const transaction = database.transaction([VIDEO_STORE], 'readonly');
        const store = transaction.objectStore(VIDEO_STORE);
        const index = store.index('exerciseId');
        const request = index.get(exerciseId);

        request.onsuccess = () => resolve(withBlobUrl(request.result));
        request.onerror = () => reject(request.error || new Error('Failed to load video'));
    });
}

/**
 * Update video
 * @param {string} id - Video ID
 * @param {Blob} blob - New video blob
 * @returns {Promise<Object>} Updated video metadata
 */
export async function updateVideo(id, blob) {
    if (!blob) throw new Error('No video file provided');
    const database = await initDB();

    return new Promise((resolve, reject) => {
        const transaction = database.transaction([VIDEO_STORE], 'readwrite');
        const store = transaction.objectStore(VIDEO_STORE);
        let updatedVideo = null;

        const request = store.get(id);

        request.onsuccess = () => {
            const video = request.result;
            if (!video) {
                reject(new Error('Video not found'));
                try { transaction.abort(); } catch (error) { /* ignore */ }
                return;
            }

            updatedVideo = Object.assign(video, {
                blob: blob,
                name: blob.name || video.name,
                type: blob.type || video.type,
                size: blob.size,
                uploadedAt: new Date().toISOString()
            });
            delete updatedVideo.blobUrl;

            store.put(updatedVideo);
        };

        request.onerror = () => reject(request.error || new Error('Failed to load video'));

        transaction.oncomplete = () => {
            if (updatedVideo) resolve(updatedVideo);
        };
        transaction.onerror = () => reject(transactionError(transaction, 'Failed to update video'));
        transaction.onabort = () => reject(transactionError(transaction, 'Update video was aborted'));
    });
}

/**
 * Delete video
 * @param {string} id - Video ID
 * @returns {Promise<void>}
 */
export async function deleteVideo(id) {
    if (!id) return;
    const database = await initDB();

    return new Promise((resolve, reject) => {
        const transaction = database.transaction([VIDEO_STORE], 'readwrite');
        transaction.objectStore(VIDEO_STORE).delete(id);

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transactionError(transaction, 'Failed to delete video'));
        transaction.onabort = () => reject(transactionError(transaction, 'Delete video was aborted'));
    });
}

/**
 * Delete all videos belonging to an exercise
 * @param {string} exerciseId - Exercise ID
 * @returns {Promise<void>}
 */
export async function deleteVideosForExercise(exerciseId) {
    if (!exerciseId) return;
    const database = await initDB();

    return new Promise((resolve, reject) => {
        const transaction = database.transaction([VIDEO_STORE], 'readwrite');
        const store = transaction.objectStore(VIDEO_STORE);
        const index = store.index('exerciseId');
        const keysRequest = index.getAllKeys(exerciseId);

        keysRequest.onsuccess = () => {
            keysRequest.result.forEach(key => store.delete(key));
        };

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transactionError(transaction, 'Failed to delete video'));
        transaction.onabort = () => reject(transactionError(transaction, 'Deleting the video was aborted'));
    });
}

/**
 * Check storage quota
 * @returns {Promise<Object>} Quota information
 */
export async function checkStorageQuota() {
    if (navigator.storage && navigator.storage.estimate) {
        try {
            const estimate = await navigator.storage.estimate();
            const quota = estimate.quota || 0;
            const usage = estimate.usage || 0;
            return {
                usage,
                quota,
                percentage: quota > 0 ? (usage / quota) * 100 : 0,
                available: Math.max(0, quota - usage)
            };
        } catch (error) {
            console.warn('Storage estimate failed:', error);
        }
    }

    return {
        usage: 0,
        quota: 0,
        percentage: 0,
        available: 0
    };
}

/**
 * Request persistent storage
 * @returns {Promise<boolean>} Whether persistence was granted
 */
export async function requestPersistentStorage() {
    if (navigator.storage && navigator.storage.persist) {
        try {
            return await navigator.storage.persist();
        } catch (error) {
            console.warn('Persistent storage request failed:', error);
        }
    }
    return false;
}

// ===== Export All =====
export default {
    initDB,
    createExercise,
    getAllExercises,
    getExerciseById,
    updateExercise,
    deleteExercise,
    deleteAllExercises,
    storeVideo,
    getVideoById,
    getVideoByExerciseId,
    updateVideo,
    deleteVideo,
    deleteVideosForExercise,
    checkStorageQuota,
    requestPersistentStorage
};
