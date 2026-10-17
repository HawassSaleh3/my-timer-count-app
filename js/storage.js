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

// ===== Initialize Database =====
export function initDB() {
    if (db) {
        return Promise.resolve(db);
    }
    
    if (!dbPromise) {
        dbPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            
            request.onerror = (event) => {
                console.error('Database error:', event.target.error);
                reject(event.target.error);
            };
            
            request.onsuccess = (event) => {
                db = event.target.result;
                resolve(db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create object stores if they don't exist
                if (!db.objectStoreNames.contains(EXERCISE_STORE)) {
                    const store = db.createObjectStore(EXERCISE_STORE, dbSchema.exercises);
                    dbSchema.exercises.indexes.forEach(index => {
                        store.createIndex(index.name, index.keyPath, { unique: index.unique });
                    });
                }
                
                if (!db.objectStoreNames.contains(VIDEO_STORE)) {
                    const store = db.createObjectStore(VIDEO_STORE, dbSchema.videos);
                    dbSchema.videos.indexes.forEach(index => {
                        store.createIndex(index.name, index.keyPath, { unique: index.unique });
                    });
                }
            };
        });
    }
    
    return dbPromise;
}

// ===== Generate Unique ID =====
function generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ===== Exercise CRUD Operations =====

/**
 * Create a new exercise
 * @param {Object} exerciseData - Exercise data
 * @returns {Promise<Object>} Created exercise with ID
 */
export async function createExercise(exerciseData) {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([EXERCISE_STORE], 'readwrite');
        const store = transaction.objectStore(EXERCISE_STORE);
        
        const exercise = {
            id: generateId(),
            name: exerciseData.name,
            description: exerciseData.description || '',
            category: exerciseData.category || '',
            workDuration: parseInt(exerciseData.workDuration) || 30,
            restDuration: parseInt(exerciseData.restDuration) || 10,
            rounds: parseInt(exerciseData.rounds) || 5,
            videoId: exerciseData.videoId || null,
            videoMode: exerciseData.videoMode || 'loop',
            soundEnabled: exerciseData.soundEnabled !== false,
            preparationCountdown: parseInt(exerciseData.preparationCountdown) || 3,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        const request = store.add(exercise);
        
        request.onsuccess = () => resolve(exercise);
        request.onerror = (event) => reject(event.target.error);
    });
}

/**
 * Get all exercises
 * @returns {Promise<Array>} Array of exercises
 */
export async function getAllExercises() {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([EXERCISE_STORE], 'readonly');
        const store = transaction.objectStore(EXERCISE_STORE);
        const request = store.getAll();
        
        request.onsuccess = () => {
            // Sort by updatedAt descending
            const exercises = request.result.sort((a, b) => 
                new Date(b.updatedAt) - new Date(a.updatedAt)
            );
            resolve(exercises);
        };
        
        request.onerror = (event) => reject(event.target.error);
    });
}

/**
 * Get exercise by ID
 * @param {string} id - Exercise ID
 * @returns {Promise<Object|null>} Exercise or null
 */
export async function getExerciseById(id) {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([EXERCISE_STORE], 'readonly');
        const store = transaction.objectStore(EXERCISE_STORE);
        const request = store.get(id);
        
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = (event) => reject(event.target.error);
    });
}

/**
 * Update exercise
 * @param {string} id - Exercise ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated exercise
 */
export async function updateExercise(id, updates) {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([EXERCISE_STORE], 'readwrite');
        const store = transaction.objectStore(EXERCISE_STORE);
        
        const request = store.get(id);
        
        request.onsuccess = () => {
            const exercise = request.result;
            if (!exercise) {
                reject(new Error('Exercise not found'));
                return;
            }
            
            // Update fields
            Object.assign(exercise, updates, {
                updatedAt: new Date().toISOString()
            });
            
            const updateRequest = store.put(exercise);
            
            updateRequest.onsuccess = () => resolve(exercise);
            updateRequest.onerror = (event) => reject(event.target.error);
        };
        
        request.onerror = (event) => reject(event.target.error);
    });
}

/**
 * Delete exercise
 * @param {string} id - Exercise ID
 * @returns {Promise<void>}
 */
export async function deleteExercise(id) {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([EXERCISE_STORE, VIDEO_STORE], 'readwrite');
        const exerciseStore = transaction.objectStore(EXERCISE_STORE);
        const videoStore = transaction.objectStore(VIDEO_STORE);
        
        // First, get the exercise to find its video
        const getRequest = exerciseStore.get(id);
        
        getRequest.onsuccess = () => {
            const exercise = getRequest.result;
            if (!exercise) {
                resolve();
                return;
            }
            
            // Delete the exercise
            const deleteRequest = exerciseStore.delete(id);
            
            deleteRequest.onsuccess = () => {
                // Also delete associated video if it exists
                if (exercise.videoId) {
                    const videoDeleteRequest = videoStore.delete(exercise.videoId);
                    videoDeleteRequest.onsuccess = () => {
                        // Release object URL if it exists
                        if (exercise.videoBlobUrl) {
                            URL.revokeObjectURL(exercise.videoBlobUrl);
                        }
                        resolve();
                    };
                    videoDeleteRequest.onerror = (event) => {
                        // Still resolve even if video deletion fails
                        console.error('Failed to delete video:', event.target.error);
                        resolve();
                    };
                } else {
                    resolve();
                }
            };
            
            deleteRequest.onerror = (event) => reject(event.target.error);
        };
        
        getRequest.onerror = (event) => reject(event.target.error);
    });
}

/**
 * Delete all exercises
 * @returns {Promise<void>}
 */
export async function deleteAllExercises() {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([EXERCISE_STORE, VIDEO_STORE], 'readwrite');
        const exerciseStore = transaction.objectStore(EXERCISE_STORE);
        const videoStore = transaction.objectStore(VIDEO_STORE);
        
        // Get all videos first
        const videoRequest = videoStore.getAll();
        
        videoRequest.onsuccess = () => {
            const videos = videoRequest.result;
            
            // Release all object URLs
            videos.forEach(video => {
                if (video.blobUrl) {
                    URL.revokeObjectURL(video.blobUrl);
                }
            });
            
            // Clear both stores
            const clearExerciseRequest = exerciseStore.clear();
            const clearVideoRequest = videoStore.clear();
            
            clearExerciseRequest.onsuccess = () => {
                clearVideoRequest.onsuccess = () => resolve();
                clearVideoRequest.onerror = (event) => {
                    console.error('Failed to clear videos:', event.target.error);
                    resolve();
                };
            };
            
            clearExerciseRequest.onerror = (event) => {
                console.error('Failed to clear exercises:', event.target.error);
                reject(event.target.error);
            };
        };
        
        videoRequest.onerror = (event) => reject(event.target.error);
    });
}

// ===== Video Storage Operations =====

/**
 * Store a video blob
 * @param {Blob} blob - Video blob
 * @param {string} exerciseId - Associated exercise ID
 * @returns {Promise<Object>} Video metadata
 */
export async function storeVideo(blob, exerciseId) {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([VIDEO_STORE], 'readwrite');
        const store = transaction.objectStore(VIDEO_STORE);
        
        const videoId = generateId();
        const blobUrl = URL.createObjectURL(blob);
        
        const video = {
            id: videoId,
            exerciseId: exerciseId,
            blob: blob,
            blobUrl: blobUrl,
            name: blob.name || `video-${videoId}`,
            type: blob.type || 'video/mp4',
            size: blob.size,
            uploadedAt: new Date().toISOString()
        };
        
        const request = store.add(video);
        
        request.onsuccess = () => resolve(video);
        request.onerror = (event) => {
            URL.revokeObjectURL(blobUrl);
            reject(event.target.error);
        };
    });
}

/**
 * Get video by ID
 * @param {string} id - Video ID
 * @returns {Promise<Object|null>} Video or null
 */
export async function getVideoById(id) {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([VIDEO_STORE], 'readonly');
        const store = transaction.objectStore(VIDEO_STORE);
        const request = store.get(id);
        
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = (event) => reject(event.target.error);
    });
}

/**
 * Get video by exercise ID
 * @param {string} exerciseId - Exercise ID
 * @returns {Promise<Object|null>} Video or null
 */
export async function getVideoByExerciseId(exerciseId) {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([VIDEO_STORE], 'readonly');
        const store = transaction.objectStore(VIDEO_STORE);
        const index = store.index('exerciseId');
        const request = index.get(exerciseId);
        
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = (event) => reject(event.target.error);
    });
}

/**
 * Update video
 * @param {string} id - Video ID
 * @param {Blob} blob - New video blob
 * @returns {Promise<Object>} Updated video metadata
 */
export async function updateVideo(id, blob) {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([VIDEO_STORE], 'readwrite');
        const store = transaction.objectStore(VIDEO_STORE);
        
        const request = store.get(id);
        
        request.onsuccess = () => {
            const video = request.result;
            if (!video) {
                reject(new Error('Video not found'));
                return;
            }
            
            // Release old blob URL
            if (video.blobUrl) {
                URL.revokeObjectURL(video.blobUrl);
            }
            
            // Update with new blob
            const newBlobUrl = URL.createObjectURL(blob);
            Object.assign(video, {
                blob: blob,
                blobUrl: newBlobUrl,
                name: blob.name || video.name,
                type: blob.type || video.type,
                size: blob.size,
                uploadedAt: new Date().toISOString()
            });
            
            const updateRequest = store.put(video);
            
            updateRequest.onsuccess = () => resolve(video);
            updateRequest.onerror = (event) => {
                URL.revokeObjectURL(newBlobUrl);
                reject(event.target.error);
            };
        };
        
        request.onerror = (event) => reject(event.target.error);
    });
}

/**
 * Delete video
 * @param {string} id - Video ID
 * @returns {Promise<void>}
 */
export async function deleteVideo(id) {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([VIDEO_STORE], 'readwrite');
        const store = transaction.objectStore(VIDEO_STORE);
        
        const request = store.get(id);
        
        request.onsuccess = () => {
            const video = request.result;
            if (!video) {
                resolve();
                return;
            }
            
            // Release blob URL
            if (video.blobUrl) {
                URL.revokeObjectURL(video.blobUrl);
            }
            
            const deleteRequest = store.delete(id);
            
            deleteRequest.onsuccess = () => resolve();
            deleteRequest.onerror = (event) => reject(event.target.error);
        };
        
        request.onerror = (event) => reject(event.target.error);
    });
}

/**
 * Check storage quota
 * @returns {Promise<Object>} Quota information
 */
export async function checkStorageQuota() {
    return new Promise((resolve) => {
        if (navigator.storage && navigator.storage.estimate) {
            navigator.storage.estimate().then(estimate => {
                resolve({
                    usage: estimate.usage,
                    quota: estimate.quota,
                    percentage: (estimate.usage / estimate.quota) * 100,
                    available: estimate.quota - estimate.usage
                });
            }).catch(() => {
                // Fallback for browsers without storage API
                resolve({
                    usage: 0,
                    quota: 0,
                    percentage: 0,
                    available: 0
                });
            });
        } else {
            resolve({
                usage: 0,
                quota: 0,
                percentage: 0,
                available: 0
            });
        }
    });
}

/**
 * Request persistent storage
 * @returns {Promise<boolean>} Whether persistence was granted
 */
export async function requestPersistentStorage() {
    if (navigator.storage && navigator.storage.persist) {
        return navigator.storage.persist();
    }
    return true; // Assume granted if API not available
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
    checkStorageQuota,
    requestPersistentStorage
};
