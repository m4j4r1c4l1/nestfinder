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
        tagsLabel: 'Quick Tags',
        onePerson: 'One person',
        multiple: 'Multiple',
        children: 'Children',
        animals: 'Animals'
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
        pointsSelected: '{n} points selected'
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
        popupDescription: 'Show messages immediately as they arrive'
    },

    // Welcome Message
    welcome: {
        title: 'Welcome to NestFinder!',
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
        requestingLocation: 'Getting your location...'
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
