// English translations
export default {
    // Language metadata
    _meta: {
        code: 'en',
        name: 'English',
        nativeName: 'English',
        flag: '🇬🇧'
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
        downloadGPX: 'Download GPX',
        downloadKML: 'Download KML',
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
        noMessages: 'No messages yet',
        markAllRead: 'Mark all as read',
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
        notifications: 'Notifications',
        popupMessages: 'Real-time Popups',
        popupDescription: 'Show messages immediately as they arrive',
        shareApp: 'Share NestFinder',
        scanToShare: 'Scan to open NestFinder',
        copyLink: 'Copy Link',
        shareLink: 'Share Link',
        linkCopied: 'Link copied!'
    },

    // Welcome Message
    // Welcome Message (Home Page & Modal)
    welcome: {
        // Home Screen
        title: 'NestFinder',
        subtitle: 'Finding Nests ❤️ Bringing Relief',
        nicknameLabel: 'Enter a nickname to contribute (optional)',
        nicknamePlaceholder: 'Anonymous Helper',
        buttonStart: 'Start Helping',
        buttonLoading: 'Starting...',

        // Welcome Modal
        modalTitle: 'Welcome to NestFinder!',
        message1: 'Thank you for being the awesome human being you are!',
        message2: 'Every act of kindness matters when we help each other.',
        message3: 'Together we can make a difference in our community.',
        callToAction: 'Help locate and assist those who need it most.',
        button: "Let's Get Started"
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
