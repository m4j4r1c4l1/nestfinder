// English translations
export default {
    // Language metadata
    _meta: {
        code: 'en',
        name: 'English',
        nativeName: 'English',
        flag: '🇬🇧'
    },

    // Feedback
    feedback: {
        title: 'Feedback',
        description: 'Report bugs, suggest features, or send feedback',
        placeholder: 'Describe your feedback in detail...',
        send: 'Send Feedback',
        charLimit: 'characters',
        rateApp: 'Rate the App',
        bugReport: 'Bug Report',
        suggestion: 'Suggestion',
        general: 'Feedback'
    },

    // Navigation
    nav: {
        map: 'Map',
        report: 'Report',
        profile: 'Profile',
        inbox: 'Inbox',
        settings: 'Settings'
    },

    // Map View
    map: {
        searchPlaceholder: 'Search location...',
        locateMe: 'Locate Me',
        filters: 'Filters',
        route: 'Route',
        download: 'Download',
        downloadGPX: 'Download GPX',
        downloadKML: 'Download KML',
        downloadJSON: 'Download JSON',
        downloadCSV: 'Download CSV',
        totalPoints: 'total points',
        noResults: 'No results found'
    },

    // Filters
    filters: {
        title: 'Filter Points',
        showConfirmed: 'Show Confirmed',
        showPending: 'Show Pending',
        showDeactivated: 'Show Deactivated',
        done: 'Done',
        reset: 'Reset'
    },

    // Point Status
    status: {
        confirmed: 'Confirmed',
        pending: 'Pending',
        deactivated: 'Deactivated'
    },

    // Point Details
    point: {
        details: 'Point Details',
        status: 'Status',
        address: 'Address',
        notes: 'Notes',
        submittedBy: 'Submitted by',
        confirmations: 'Confirmations',
        deactivations: 'Deactivation reports',
        actions: 'Actions',
        confirmBtn: 'Confirm Active',
        deactivateBtn: 'Report Inactive',
        reactivateBtn: 'Reactivate',
        navigateBtn: 'Navigate',
        close: 'Close',
        anonymous: 'Anonymous',
        confirmedMessage: 'Thanks for confirming!',
        deactivatedMessage: 'Reported as inactive',
        reactivatedMessage: 'Point reactivated!'
    },

    // Submit/Report Form
    submit: {
        title: 'Report Location',
        subtitle: 'Help others by reporting a location',
        addressLabel: 'Address',
        addressPlaceholder: 'Enter address or use map',
        notesLabel: 'Notes (optional)',
        notesPlaceholder: 'Any additional details...',
        submitBtn: 'Submit Report',
        submitting: 'Submitting...',
        success: 'Location reported successfully!',
        error: 'Failed to submit. Please try again.',
        selectOnMap: 'Or tap on the map to select location',
        currentLocation: 'Use Current Location',
        // Mode labels
        gpsMode: 'GPS',
        mapMode: 'Map',
        addressMode: 'Address',
        voiceMode: 'Voice',
        // GPS mode
        currentLocationLabel: 'Current Location',
        tapToLocate: 'Tap button to find location',
        // Map mode
        selectedLocation: 'Selected Location',
        locationSelected: 'Location selected',
        tapMapPrompt: 'Tap on the map to select a location',
        mapInstructions: 'Close this panel, tap on the map where you want to report, and it will open again with that location.',
        // Address mode
        cityLabel: 'City',
        cityPlaceholder: 'e.g., Madrid',
        streetLabel: 'Street',
        streetPlaceholder: 'e.g., Gran Vía',
        numberLabel: 'Number',
        numberPlaceholder: 'e.g., 42',
        findLocation: 'Find Location',
        addressNotFound: 'Address not found. Try a different format.',
        geocodeError: 'Failed to geocode address. Check your connection.',
        addressRequired: 'Please enter at least city and street',
        locationRequired: 'Location is required. Use GPS, click on map, or enter an address.',
        // Tags
        tagsLabel: 'Who\'s there? (Optional)',
        onePerson: 'One person',
        multiple: 'Multiple',
        children: 'Children',
        animals: 'Animals',
        needsLabel: 'What do they need? (Optional)',
        needFood: 'Food',
        needWater: 'Water',
        needClothes: 'Clothes',
        needMedicine: 'Medicine',
        needShelter: 'Shelter'
    },

    // Route Panel  
    route: {
        title: 'Route Planner',
        optimizeRoute: 'Calculate Route',
        clearRoute: 'Clear Route',
        calculating: 'Calculating...',
        distance: 'Distance',
        duration: 'Duration',
        waypoints: 'waypoints',
        noPoints: 'No points available for routing',
        filterByStatus: 'Filter by status',
        includeConfirmed: 'Include Confirmed',
        includePending: 'Include Pending',
        includeDeactivated: 'Include Deactivated',
        pointsSelected: 'Points selected: {n}',
        readyDescription: 'Calculate optimized walking path visiting all selected points.'
    },

    // Notifications/Inbox
    inbox: {
        title: 'Inbox',
        received: 'Received',
        sent: 'Sent',
        compose: 'Compose',
        sendMessage: 'Send a Message',
        sentPlaceholder: 'Sent messages will appear here',
        'empty': 'Your nest is empty',
        'noSent': 'No contributions yet',
        'delete.confirm': 'Delete this message permanently?',
        'delete.cancel': 'Cancel',
        'delete.yes': 'Delete',
        unread: 'unread'
    },

    // Profile
    profile: {
        title: 'Profile',
        nickname: 'Nickname',
        nicknamePlaceholder: 'Enter your nickname',
        language: 'Language',
        pointsSubmitted: 'Points Submitted',
        confirmationsMade: 'Confirmations Made',
        saveChanges: 'Save Changes',
        saving: 'Saving...',
        saved: 'Changes saved!',
        deviceId: 'Device ID',
        memberSince: 'Member since',
        statistics: 'Statistics'
    },

    // Language Picker
    language: {
        title: 'Choose Language',
        subtitle: 'Select your preferred language',
        continue: 'Continue'
    },

    // Settings
    settings: {
        yourProfile: 'Your Profile',
        notifications: 'Notifications',
        popupMessages: 'Real-time Popups',
        popupDescription: 'Show messages immediately as they arrive',
        shareApp: 'Share NestFinder',
        scanToShare: 'Scan to open NestFinder',
        copyLink: 'Copy Link',
        shareLink: 'Share Link',
        linkCopied: 'Link copied!',
        recoveryKey: 'Recovery Key',
        recoveryKeyDescription: 'Save this key to restore your identity at any time.',
        generateKey: 'Generate Recovery Key',
        showKey: 'Show Recovery Key',
        copyKey: 'Copy Key',
        copied: 'Copied!',
        keyGenerated: 'Key Generated & Copied!',
        performance: 'Performance',
        liteMode: 'Lite Mode',
        liteModeDescription: 'Reduce animations for smoother performance',
        scrollInstruction: '🌍 Scroll + Tap or wait 2s to confirm',
        spreadWarmth: 'Spread the warmth! 🐣',
        trustScore: 'Trust Score',
        anonymousUser: 'User',
        statusHatchling: 'Hatchling',
        statusSparrow: 'Sparrow',
        statusOwl: 'Owl',
        statusEagle: 'Eagle',
        // Recovery Key Restore
        // recoveryKeyUsage: Deprecated in favor of explicit options below
        restoreOptionsTitle: 'To restore your account you have 2 options:',
        restoreOption1: '**Login:** Type your 3-word key **with dashes** in the **Nickname** field when you log in to app.',
        restoreOption2: '**New account:** Log in with a new account and restore it from the **Restore Account** section below',
        restoreAccount: 'Restore Account',
        restoreAccountDescription: 'Enter your 3-word recovery key (with spaces or dashes).',
        enterRecoveryKey: 'word-word-word',
        invalidRecoveryKey: 'Invalid recovery key. Please check and try again.',
        accountRestored: 'Account restored! Reloading...',
        restoreButton: 'Restore Account',
        // Restore Warning Dialog
        restoreWarningTitle: 'Warning',
        restoreWarningMessage: 'Restoring another account will disconnect you from your current account. If you haven\'t saved this account\'s recovery key, you will lose access to it permanently. Continue?',
        restoreConfirmButton: 'Yes, Restore',
        sameKeyError: 'This is your current account\'s recovery key. You are already logged in with this account.',
        // Swipe Direction
        swipeDirection: 'Delete Messages',
        swipe: {
            right: '→ Swipe Right',
            left: '← Swipe Left',
            desc: 'Tap on the swiping gesture direction you prefer to delete a message.',
            controlLabel: 'Swipe'
        },
        // Message Retention
        messageRetention: 'Retention Period',
        retention: {
            '1m': '1 Month',
            '3m': '3 Months',
            '6m': '6 Months',
            forever: 'Forever',
            desc: 'Auto-delete messages older than selected period.'
        },
        messages: 'Messages'
    },

    // Welcome Message
    // Welcome Message (Home Page & Modal)
    welcome: {
        // Home Screen
        title: 'NestFinder',
        subtitle: 'Finding Nests ❤️ Bringing Relief',
        nicknameLabel: 'Enter a Nickname or a Recovery Key (optional)',
        nicknamePlaceholder: 'Anonymous Helper',
        buttonStart: 'Start Helping',
        buttonLoading: 'Starting...',

        // Welcome Modal
        modalTitle: 'Welcome to NestFinder!',
        message1: 'Thank you for being the awesome human being you are!',
        message2: 'Every act of kindness matters when we help each other.',
        message3: 'Together we can make a difference in our community.',
        callToAction: 'Help locate and assist those who need it most.',
        button: "Let's Get Started",
        // Recovery error
        invalidRecoveryKey: 'Invalid recovery key. Please check and try again.'
    },

    // Common/Shared
    common: {
        loading: 'Loading...',
        error: 'An error occurred',
        retry: 'Retry',
        cancel: 'Cancel',
        save: 'Save',
        delete: 'Delete',
        confirm: 'Confirm',
        close: 'Close',
        back: 'Back',
        next: 'Next',
        yes: 'Yes',
        no: 'No',
        ok: 'OK'
    },

    // Geolocation
    geo: {
        permissionDenied: 'Location access denied',
        unavailable: 'Location unavailable',
        timeout: 'Location request timed out',
        enableLocation: 'Enable Location',
        requestingLocation: 'Getting your location...',
        // Location banner
        enableTitle: 'Enable Your Location',
        enableSubtitle: 'Tap below to enable location for personalized routes',
        enableButton: '📍 Enable Location',
        locationEnabled: 'Location enabled!',
        locationBlocked: 'Location blocked. Clear browser data and try again.',
        locationDenied: 'Location denied. Check {tip}',
        locationUnavailable: 'Location unavailable. Check your device GPS.',
        locationTimeout: 'Location timed out. Try again or check GPS.',
        // Platform instructions
        iosInstructions: 'iOS: Settings → Privacy → Location Services → Safari → Allow',
        androidInstructions: 'Android: Settings → Apps → Browser → Permissions → Location → Allow',
        desktopInstructions: 'Check your browser settings to enable location access',
        iosTip: 'Settings → Privacy → Location Services → Safari',
        androidTip: 'Settings → Apps → Browser → Permissions → Location',
        browserSettings: 'browser settings'
    },

    // Validation
    validation: {
        required: 'This field is required',
        invalidAddress: 'Please enter a valid address',
        tooShort: 'Too short',
        tooLong: 'Too long'
    },

    // Time/Date
    time: {
        justNow: 'Just now',
        minutesAgo: '{n} minutes ago',
        hoursAgo: '{n} hours ago',
        daysAgo: '{n} days ago',
        today: 'Today',
        yesterday: 'Yesterday'
    }
};
