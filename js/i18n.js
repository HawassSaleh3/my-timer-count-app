// ===== i18n.js - Internationalization Module =====

const translations = {
    en: {
        // General
        appTitle: 'SkillTimer',
        
        // Navigation
        menuTitle: 'Menu',
        navHome: 'Home',
        navHomeText: 'Home',
        navSettings: 'Settings',
        navSettingsText: 'Settings',
        langText: 'EN',
        bottomNavHomeText: 'Home',
        bottomNavCreateText: 'Create',
        bottomNavSettingsText: 'Settings',
        
        // Home / Exercise Library
        homeTitle: 'Your Exercises',
        homeSubtitle: 'Create and manage your training exercises',
        emptyTitle: 'No exercises yet',
        emptyDescription: 'Get started by creating your first training exercise',
        addFirstExerciseText: 'Create Exercise',
        
        // Create/Edit Exercise
        createExerciseTitle: 'Create Exercise',
        editExerciseTitle: 'Edit Exercise',
        basicInfoTitle: 'Basic Information',
        nameLabel: 'Exercise Name *',
        namePlaceholder: 'e.g., Basketball Dribbling',
        nameError: 'Please enter an exercise name',
        descriptionLabel: 'Description',
        descriptionPlaceholder: 'Describe your exercise...',
        categoryLabel: 'Category',
        categoryNone: 'None',
        categoryFootball: 'Football',
        categoryBasketball: 'Basketball',
        categoryTennis: 'Tennis',
        categoryBoxing: 'Boxing',
        categoryMartialArts: 'Martial Arts',
        categoryDance: 'Dance',
        categoryOther: 'Other',
        
        videoTitle: 'Instructional Video',
        videoHelp: 'Upload a video to guide your training',
        uploadText: 'Drag & drop video here or click to browse',
        uploadHint: 'MP4, WebM (Max size: 50MB)',
        previewTitle: 'Selected Video',
        loopModeText: 'Loop',
        loopModeDesc: 'Video repeats continuously',
        onceModeText: 'Play Once',
        onceModeDesc: 'Video plays once per round',
        videoModeLabel: 'Video Playback Mode',
        
        timerTitle: 'Timer Settings',
        workDurationLabel: 'Work Duration *',
        workDurationError: 'Work duration must be between 1 and 600 seconds',
        secondsUnit: 'seconds',
        roundsLabel: 'Rounds *',
        roundsError: 'Rounds must be between 1 and 50',
        roundsUnit: 'rounds',
        restDurationLabel: 'Rest Duration',
        restDurationError: 'Rest duration must be between 0 and 300 seconds',
        restSecondsUnit: 'seconds',
        prepCountdownLabel: 'Preparation Countdown',
        prepCountdownHelp: 'Countdown before starting the first round',
        prepCountdownError: 'Preparation countdown must be between 0 and 30 seconds',
        prepSecondsUnit: 'seconds',
        soundEnabledLabel: 'Enable Sound Notifications',
        
        cancelBtnText: 'Cancel',
        saveExerciseText: 'Save Exercise',
        
        // Exercise Details
        exerciseDetailsTitle: 'Exercise Details',
        detailName: 'Exercise Name',
        detailCategory: 'Category',
        detailDescription: 'Exercise description goes here...',
        videoLabel: 'Instructional Video',
        noVideoText: 'No video attached',
        settingsLabel: 'Timer Settings',
        workDurationText: 'Work Duration',
        roundsText: 'Rounds',
        restDurationText: 'Rest Duration',
        prepCountdownText: 'Preparation',
        soundText: 'Sound',
        videoModeText: 'Video Mode',
        startTrainingText: 'Start Training',
        
        // Training Session
        trainingTitle: 'Training',
        trainingExerciseName: 'Exercise Name',
        roundLabel: 'Round',
        ofLabel: 'of',
        phaseReady: 'Ready',
        phasePreparation: 'Preparation',
        phaseWork: 'Work',
        phaseRest: 'Rest',
        phasePaused: 'Paused',
        phaseFinished: 'Finished',
        
        // Training Controls
        restartBtnText: 'Restart',
        startPauseText: 'Start',
        pauseText: 'Pause',
        stopBtnText: 'Stop',
        
        // Session Complete
        completeTitle: 'Session Complete!',
        completeSubtitle: 'Great job on completing your training',
        summaryTitle: 'Training Summary',
        exerciseLabel: 'Exercise',
        completedRoundsLabel: 'Completed Rounds',
        totalWorkLabel: 'Total Work Time',
        totalRestLabel: 'Total Rest Time',
        totalSessionLabel: 'Total Session Time',
        repeatBtnText: 'Repeat Session',
        returnHomeText: 'Return to Home',
        
        // Settings
        settingsPageTitle: 'Settings',
        generalSettingsTitle: 'General Settings',
        languageLabel: 'Language',
        languageDesc: 'Change the app language',
        langEnglish: 'English',
        langArabic: 'العربية',
        storageSettingsTitle: 'Storage',
        storageInfoLabel: 'Storage Information',
        storageInfoDesc: 'Exercises and videos are stored locally in your browser',
        clearDataLabel: 'Clear All Data',
        clearDataDesc: 'Remove all exercises and videos',
        clearDataText: 'Clear Data',
        aboutTitle: 'About',
        versionText: 'Version 1.0.0',
        
        // Confirmation Dialog
        confirmTitle: 'Confirm Action',
        confirmMessage: 'Are you sure you want to perform this action?',
        cancelDialogText: 'Cancel',
        confirmDialogText: 'Confirm',
        
        // Toast Messages
        exerciseSaved: 'Exercise saved successfully',
        exerciseDeleted: 'Exercise deleted successfully',
        exerciseUpdated: 'Exercise updated successfully',
        sessionStopped: 'Training session stopped',
        dataCleared: 'All data has been cleared',
        videoRemoved: 'Video removed',
        error: 'Error',
        
        // Specific Confirmations
        confirmDeleteExercise: 'Are you sure you want to delete "{name}"? This will also remove its associated video.',
        confirmStopTraining: 'Are you sure you want to stop the training session? Your progress will be lost.',
        confirmClearData: 'Are you sure you want to clear all data? This action cannot be undone.',
        
        // Errors
        videoUploadError: 'Failed to upload video. Please try a different file.',
        videoSizeError: 'Video size exceeds 50MB limit.',
        videoFormatError: 'Unsupported video format. Please use MP4 or WebM.',
        storageError: 'Storage error. Please try again.',
        storageUnavailable: 'Local storage is unavailable. Please enable storage or use another browser.',
        saveExerciseError: 'Could not save the exercise. Please try again.',
        formHasErrors: 'Please correct the highlighted fields.',
        
        // Timer States
        timerReady: 'Ready to start',
        timerPreparing: 'Get ready...',
        timerWorking: 'Work!',
        timerResting: 'Rest',
        timerPaused: 'Paused',
        timerFinished: 'Session Complete!',
        
        // Sound Labels
        soundOn: 'Sound enabled',
        soundOff: 'Sound disabled',
        
        // Units
        seconds: 's',
        minutes: 'm',
        
        // Format helpers
        formatTime: (seconds) => {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        }
    },
    
    ar: {
        // General
        appTitle: 'سكيلي تايمر',
        
        // Navigation
        menuTitle: 'قائمة',
        navHome: 'الصفحة الرئيسية',
        navHomeText: 'الصفحة الرئيسية',
        navSettings: 'الإعدادات',
        navSettingsText: 'الإعدادات',
        langText: 'AR',
        bottomNavHomeText: 'الرئيسية',
        bottomNavCreateText: 'إنشاء',
        bottomNavSettingsText: 'الإعدادات',
        
        // Home / Exercise Library
        homeTitle: 'تمارينك',
        homeSubtitle: 'أنشئ وادير تمارينك التدريبية',
        emptyTitle: 'لا يوجد تمارين بعد',
        emptyDescription: 'ابدأ بإنشاء أول تمرين تدريبي لك',
        addFirstExerciseText: 'إنشاء تمرين',
        
        // Create/Edit Exercise
        createExerciseTitle: 'إنشاء تمرين',
        editExerciseTitle: 'تعديل التمرين',
        basicInfoTitle: 'المعلومات الأساسية',
        nameLabel: 'اسم التمرين *',
        namePlaceholder: 'مثال: تنطيط كرة السلة',
        nameError: 'يرجى إدخال اسم التمرين',
        descriptionLabel: 'الوصف',
        descriptionPlaceholder: 'اكتب وصف التمرين...',
        categoryLabel: 'الفئة',
        categoryNone: 'لا شيء',
        categoryFootball: 'كرة القدم',
        categoryBasketball: 'كرة السلة',
        categoryTennis: 'التنس',
        categoryBoxing: 'الملاكمة',
        categoryMartialArts: 'فنون قتالية',
        categoryDance: 'الرقص',
        categoryOther: 'أخرى',
        
        videoTitle: 'فيديو تعليمي',
        videoHelp: 'رفع فيديو لإرشاد تدريبك',
        uploadText: 'اسحب وأفلت الفيديو هنا أو انقر للتصفح',
        uploadHint: 'MP4, WebM (الحد الأقصى للحجم: 50 ميجا)',
        previewTitle: 'الفيديو المحدد',
        loopModeText: 'تكرار',
        loopModeDesc: 'يتكرر الفيديو بشكل مستمر',
        onceModeText: 'تشغيل مرة واحدة',
        onceModeDesc: 'يشغل الفيديو مرة واحدة لكل جولة',
        videoModeLabel: 'وضع تشغيل الفيديو',
        
        timerTitle: 'إعدادات المؤقت',
        workDurationLabel: 'مدة العمل *',
        workDurationError: 'يجب أن تتراوح مدة العمل بين ثانية واحدة و600 ثانية',
        secondsUnit: 'ثواني',
        roundsLabel: 'الجولات *',
        roundsError: 'يجب أن تتراوح عدد الجولات بين 1 و50',
        roundsUnit: 'جولات',
        restDurationLabel: 'مدة الراحة',
        restDurationError: 'يجب أن تتراوح مدة الراحة بين 0 و300 ثانية',
        restSecondsUnit: 'ثواني',
        prepCountdownLabel: 'العد التنازلي للإعداد',
        prepCountdownHelp: 'العد التنازلي قبل بدء الجولة الأولى',
        prepCountdownError: 'يجب أن يتراوح العد التنازلي بين 0 و30 ثانية',
        prepSecondsUnit: 'ثواني',
        soundEnabledLabel: 'تمكين إشعارات الصوت',
        
        cancelBtnText: 'إلغاء',
        saveExerciseText: 'حفظ التمرين',
        
        // Exercise Details
        exerciseDetailsTitle: 'تفاصيل التمرين',
        detailName: 'اسم التمرين',
        detailCategory: 'الفئة',
        detailDescription: 'يظهر وصف التمرين هنا...',
        videoLabel: 'الفيديو التعليمي',
        noVideoText: 'لا يوجد فيديو مرفق',
        settingsLabel: 'إعدادات المؤقت',
        workDurationText: 'مدة العمل',
        roundsText: 'الجولات',
        restDurationText: 'مدة الراحة',
        prepCountdownText: 'الإعداد',
        soundText: 'الصوت',
        videoModeText: 'وضع الفيديو',
        startTrainingText: 'بدء التدريب',
        
        // Training Session
        trainingTitle: 'التدريب',
        trainingExerciseName: 'اسم التمرين',
        roundLabel: 'جولة',
        ofLabel: 'من',
        phaseReady: 'مستعد',
        phasePreparation: 'إعداد',
        phaseWork: 'عمل',
        phaseRest: 'راحة',
        phasePaused: 'موقوف مؤقتاً',
        phaseFinished: 'منتهي',
        
        // Training Controls
        restartBtnText: 'إعادة',
        startPauseText: 'بدء',
        pauseText: 'إيقاف مؤقت',
        stopBtnText: 'إيقاف',
        
        // Session Complete
        completeTitle: 'تم الانتهاء من الجلسة!',
        completeSubtitle: 'عمل رائع في إكمال تدريبك',
        summaryTitle: 'ملخص التدريب',
        exerciseLabel: 'التمرين',
        completedRoundsLabel: 'الجولات المكتملة',
        totalWorkLabel: 'إجمالي وقت العمل',
        totalRestLabel: 'إجمالي وقت الراحة',
        totalSessionLabel: 'إجمالي وقت الجلسة',
        repeatBtnText: 'تكرار الجلسة',
        returnHomeText: 'العودة إلى الصفحة الرئيسية',
        
        // Settings
        settingsPageTitle: 'الإعدادات',
        generalSettingsTitle: 'الإعدادات العامة',
        languageLabel: 'اللغة',
        languageDesc: 'تغيير لغة التطبيق',
        langEnglish: 'الإنجليزية',
        langArabic: 'العربية',
        storageSettingsTitle: 'التخزين',
        storageInfoLabel: 'معلومات التخزين',
        storageInfoDesc: 'يتم تخزين التمارين والفيديوهات محلياً في متصفحك',
        clearDataLabel: 'مسح جميع البيانات',
        clearDataDesc: 'إزالة جميع التمارين والفيديوهات',
        clearDataText: 'مسح البيانات',
        aboutTitle: 'عن التطبيق',
        versionText: 'الإصدار 1.0.0',
        
        // Confirmation Dialog
        confirmTitle: 'تأكيد الإجراء',
        confirmMessage: 'هل أنت متأكد من رغبتك في تنفيذ هذا الإجراء؟',
        cancelDialogText: 'إلغاء',
        confirmDialogText: 'تأكيد',
        
        // Toast Messages
        exerciseSaved: 'تم حفظ التمرين بنجاح',
        exerciseDeleted: 'تم حذف التمرين بنجاح',
        exerciseUpdated: 'تم تحديث التمرين بنجاح',
        sessionStopped: 'تم إيقاف جلسة التدريب',
        dataCleared: 'تم مسح جميع البيانات',
        videoRemoved: 'تم إزالة الفيديو',
        error: 'خطأ',
        
        // Specific Confirmations
        confirmDeleteExercise: 'هل أنت متأكد من رغبتك في حذف "{name}"? سيؤدي هذا أيضاً إلى إزالة الفيديو المرتبط به.',
        confirmStopTraining: 'هل أنت متأكد من رغبتك في إيقاف جلسة التدريب؟ سيتم فقدان تقدمك.',
        confirmClearData: 'هل أنت متأكد من رغبتك في مسح جميع البيانات؟ لا يمكن التراجع عن هذا الإجراء.',
        
        // Errors
        videoUploadError: 'فشل رفع الفيديو. يرجى محاولة ملف آخر.',
        videoSizeError: 'حجم الفيديو يتجاوز حد 50 ميجا.',
        videoFormatError: 'تنسيق الفيديو غير مدعوم. يرجى استخدام MP4 أو WebM.',
        storageError: 'خطأ في التخزين. يرجى المحاولة مرة أخرى.',
        storageUnavailable: 'التخزين المحلي غير متاح. يرجى تفعيل التخزين أو استخدام متصفح آخر.',
        saveExerciseError: 'تعذر حفظ التمرين. يرجى المحاولة مرة أخرى.',
        formHasErrors: 'يرجى تصحيح الحقول المظللة.',
        
        // Timer States
        timerReady: 'مستعد للبدء',
        timerPreparing: 'استعد...',
        timerWorking: 'اعمل!',
        timerResting: 'راحة',
        timerPaused: 'موقوف مؤقتاً',
        timerFinished: 'تم الانتهاء من الجلسة!',
        
        // Sound Labels
        soundOn: 'الصوت مفعّل',
        soundOff: 'الصوت معطل',
        
        // Units
        seconds: 'ث',
        minutes: 'د',
        
        // Format helpers
        formatTime: (seconds) => {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        }
    }
};

// ===== i18n State =====
let currentLanguage = 'en';

// ===== DOM Element Cache =====
const i18nElements = new Map();

// ===== Initialize i18n =====
export function initI18n() {
    try {
        // Load saved language preference (storage can be blocked in
        // private browsing modes)
        try {
            const savedLang = localStorage.getItem('skilltimer-language');
            if (savedLang === 'en' || savedLang === 'ar') {
                currentLanguage = savedLang;
            }
        } catch (error) {
            console.warn('Language preference could not be read:', error);
        }
        
        // Set document direction
        updateDocumentDirection();
        
        // Cache all translation elements
        cacheTranslationElements();
        
        // Apply translations
        translateAll();
    } catch (error) {
        console.error('Failed to initialize i18n:', error);
    }
}

// ===== Cache Translation Elements =====
function cacheTranslationElements() {
    // These ids are filled with user data at runtime and must never be
    // replaced with dictionary values when the language changes.
    const dynamicIds = new Set([
        'detailDescription',
        'detailName',
        'detailCategory',
        'detailWorkDuration',
        'detailRounds',
        'detailRestDuration',
        'detailPrepCountdown',
        'detailSound',
        'detailVideoMode',
        'summaryExerciseName',
        'summaryCompletedRounds',
        'summaryTotalWork',
        'summaryTotalRest',
        'summaryTotalSession',
        'trainingExerciseName',
        'exerciseDetailsTitle',
        'videoName',
        'videoSize',
        'toastMessage',
        'confirmMessage'
    ]);

    const selector = [
        '[id$="Text"]',
        '[id$="Label"]',
        '[id$="Title"]',
        '[id$="Subtitle"]',
        '[id$="Desc"]',
        '[id$="Description"]',
        '[id$="Message"]',
        '[id$="Hint"]',
        '[id$="Help"]'
    ].join(', ');

    document.querySelectorAll(selector).forEach(el => {
        if (el.id && !dynamicIds.has(el.id)) {
            i18nElements.set(el.id, el);
        }
    });

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (key) {
            i18nElements.set(key, el);
        }
    });
}

// ===== Update Document Direction =====
export function updateDocumentDirection() {
    const html = document.documentElement;
    if (currentLanguage === 'ar') {
        html.setAttribute('dir', 'rtl');
        html.setAttribute('lang', 'ar');
    } else {
        html.setAttribute('dir', 'ltr');
        html.setAttribute('lang', 'en');
    }
}

// ===== Set Language =====
export function setLanguage(lang) {
    if (lang === 'en' || lang === 'ar') {
        currentLanguage = lang;

        try {
            localStorage.setItem('skilltimer-language', lang);
        } catch (error) {
            console.warn('Language preference could not be saved:', error);
        }

        updateDocumentDirection();
        translateAll();
    }
}

// ===== Get Current Language =====
export function getCurrentLanguage() {
    return currentLanguage;
}

// ===== Translate All Elements =====
function translateAll() {
    const t = translations[currentLanguage];
    
    // Translate all cached elements
    i18nElements.forEach((el, id) => {
        if (t[id] !== undefined && typeof t[id] === 'string') {
            el.textContent = t[id];
        }
    });

    // Translate input placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (key && typeof t[key] === 'string') {
            el.setAttribute('placeholder', t[key]);
        }
    });

    // Update specific elements that need special handling
    updateLanguageToggle();
    updateCategoryOptions();
    updatePhaseText();

    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect) {
        languageSelect.value = currentLanguage;
    }

    // Update app title
    const appTitle = document.getElementById('appTitle');
    if (appTitle) {
        appTitle.textContent = t.appTitle;
    }
    document.title = t.appTitle;

    // Let the rest of the app refresh dynamic labels (timer phase, etc.)
    document.dispatchEvent(new CustomEvent('languagechange', {
        detail: { language: currentLanguage }
    }));
}

// ===== Update Language Toggle =====
function updateLanguageToggle() {
    const langText = document.getElementById('langText');
    if (langText) {
        langText.textContent = currentLanguage === 'ar' ? 'AR' : 'EN';
    }
}

// ===== Update Category Options =====
function updateCategoryOptions() {
    const t = translations[currentLanguage];
    const categorySelect = document.getElementById('exerciseCategory');
    if (categorySelect) {
        const options = categorySelect.querySelectorAll('option');
        options.forEach(opt => {
            const key = opt.id.replace('category', '');
            if (key && typeof t[`category${key}`] === 'string') {
                opt.textContent = t[`category${key}`];
            }
        });
    }
}

// ===== Update Phase Text =====
function updatePhaseText() {
    const t = translations[currentLanguage];
    const phaseText = document.getElementById('phaseText');
    if (phaseText) {
        const phase = phaseText.getAttribute('data-phase');
        if (phase && t[`phase${phase.charAt(0).toUpperCase() + phase.slice(1)}`]) {
            phaseText.textContent = t[`phase${phase.charAt(0).toUpperCase() + phase.slice(1)}`];
        }
    }
}

// ===== Translate with Key =====
export function translate(key, replacements = {}) {
    const t = translations[currentLanguage];
    const entry = t[key];
    let text = typeof entry === 'string' ? entry : key;
    
    // Replace all occurrences of each placeholder
    for (const [placeholder, value] of Object.entries(replacements)) {
        text = text.split(`{${placeholder}}`).join(String(value));
    }
    
    return text;
}

// ===== Translate a category value stored in the database =====
export function translateCategory(category) {
    if (!category) return translate('categoryNone');

    const key = `category${String(category).replace(/\s+/g, '')}`;
    const t = translations[currentLanguage];
    return typeof t[key] === 'string' ? t[key] : category;
}

// ===== Format Time =====
export function formatTime(seconds) {
    const t = translations[currentLanguage];
    if (t.formatTime) {
        return t.formatTime(seconds);
    }
    // Fallback
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ===== Format Duration =====
export function formatDuration(seconds) {
    const t = translations[currentLanguage];
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    
    if (mins > 0) {
        return `${mins}${t.minutes} ${secs}${t.seconds}`;
    }
    return `${secs}${t.seconds}`;
}

// ===== Toggle Language =====
export function toggleLanguage() {
    const newLang = currentLanguage === 'en' ? 'ar' : 'en';
    setLanguage(newLang);
}

// ===== Re-translate specific element =====
export function retranslateElement(elementId) {
    const t = translations[currentLanguage];
    const el = document.getElementById(elementId);
    if (el && t[elementId]) {
        el.textContent = t[elementId];
    }
}

// ===== Update Element Text =====
export function updateElementText(elementId, key, replacements = {}) {
    const el = document.getElementById(elementId);
    if (el) {
        el.textContent = translate(key, replacements);
    }
}

// ===== Initialize language selector =====
export function initLanguageSelector() {
    const langSelect = document.getElementById('languageSelect');
    if (langSelect) {
        langSelect.value = currentLanguage;
        langSelect.addEventListener('change', (e) => {
            setLanguage(e.target.value);
        });
    }
}

export default {
    initI18n,
    setLanguage,
    getCurrentLanguage,
    translate,
    translateCategory,
    formatTime,
    formatDuration,
    toggleLanguage,
    updateDocumentDirection,
    updateElementText,
    initLanguageSelector
};
