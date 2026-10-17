// ===== i18n.js - Internationalization Module =====

const translations = {
    en: {
        // General
        appTitle: 'SkillTimer',
        
        // Navigation
        menuTitle: 'Menu',
        navHome: 'Home',
        navSettings: 'Settings',
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
        nameError: 'Please enter an exercise name',
        descriptionLabel: 'Description',
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
        workDurationError: 'Work duration must be at least 1 second',
        secondsUnit: 'seconds',
        roundsLabel: 'Rounds *',
        roundsError: 'Rounds must be at least 1',
        roundsUnit: 'rounds',
        restDurationLabel: 'Rest Duration',
        restSecondsUnit: 'seconds',
        prepCountdownLabel: 'Preparation Countdown',
        prepCountdownHelp: 'Countdown before starting the first round',
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
        navSettings: 'الإعدادات',
        langText: 'AR',
        bottomNavHomeText: 'الصفحة الرئيسية',
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
        nameError: 'يرجى إدخال اسم التمرين',
        descriptionLabel: 'الوصف',
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
        workDurationError: 'يجب أن تكون مدة العمل ثانية واحدة على الأقل',
        secondsUnit: 'ثواني',
        roundsLabel: 'الجولات *',
        roundsError: 'يجب أن تكون الجولات واحدة على الأقل',
        roundsUnit: 'جولات',
        restDurationLabel: 'مدة الراحة',
        restSecondsUnit: 'ثواني',
        prepCountdownLabel: 'العد التنازلي للإعداد',
        prepCountdownHelp: 'العد التنازلي قبل بدء الجولة الأولى',
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
        
        // Timer States
        timerReady: 'مستعد للبدء',
        timerPreparing: 'استعد...',
        timerWorking: 'اعمل!',
        timerResting: 'اراح',
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
        // Load saved language preference
        const savedLang = localStorage.getItem('skilltimer-language');
        if (savedLang && (savedLang === 'en' || savedLang === 'ar')) {
            currentLanguage = savedLang;
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
    const elements = document.querySelectorAll('[id^="navHomeText"], [id^="navSettingsText"], [id$="Text"], [id$="Label"], [id$="Title"], [id$="Desc"], [id$="Message"], [id$="Hint"]');
    
    elements.forEach(el => {
        if (el.id) {
            i18nElements.set(el.id, el);
        }
    });
    
    // Also cache elements with data-i18n attribute
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
        localStorage.setItem('skilltimer-language', lang);
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
        if (t[id] !== undefined) {
            el.textContent = t[id];
        }
    });
    
    // Update specific elements that need special handling
    updateLanguageToggle();
    updateCategoryOptions();
    updatePhaseText();
    
    // Update app title
    document.getElementById('appTitle').textContent = t.appTitle;
    document.title = t.appTitle;
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
            if (key && t[`category${key}`]) {
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
    let text = t[key] || key;
    
    // Replace placeholders
    for (const [placeholder, value] of Object.entries(replacements)) {
        text = text.replace(`{${placeholder}}`, value);
    }
    
    return text;
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
    formatTime,
    formatDuration,
    toggleLanguage,
    updateDocumentDirection,
    updateElementText,
    initLanguageSelector
};
