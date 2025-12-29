// German translations
export default {
    _meta: {
        code: 'de',
        name: 'German',
        nativeName: 'Deutsch',
        flag: '🇩🇪'
    },
    nav: {
        map: 'Karte',
        report: 'Melden',
        profile: 'Profil',
        inbox: 'Posteingang',
        settings: 'Einstellungen'
    },
    map: {
        searchPlaceholder: 'Ort suchen...',
        locateMe: 'Mein Standort',
        filters: 'Filter',
        route: 'Route',
        download: 'Herunterladen',
        downloadGPX: 'GPX herunterladen',
        downloadKML: 'KML herunterladen',
        downloadJSON: 'JSON herunterladen',
        downloadCSV: 'CSV herunterladen',
        totalPoints: 'Gesamtpunkte',
        noResults: 'Keine Ergebnisse gefunden'
    },
    filters: {
        title: 'Punkte filtern',
        showConfirmed: 'Bestätigte anzeigen',
        showPending: 'Ausstehende anzeigen',
        showDeactivated: 'Deaktivierte anzeigen',
        done: 'Fertig',
        reset: 'Zurücksetzen'
    },
    status: {
        confirmed: 'Bestätigt',
        pending: 'Ausstehend',
        deactivated: 'Deaktiviert'
    },
    point: {
        details: 'Punkt-Details',
        status: 'Status',
        address: 'Adresse',
        notes: 'Notizen',
        submittedBy: 'Gemeldet von',
        confirmations: 'Bestätigungen',
        deactivations: 'Deaktivierungsmeldungen',
        actions: 'Aktionen',
        confirmBtn: 'Bestätigen',
        deactivateBtn: 'Als inaktiv melden',
        reactivateBtn: 'Reaktivieren',
        navigateBtn: 'Navigieren',
        close: 'Schließen',
        anonymous: 'Anonym',
        confirmedMessage: 'Danke für die Bestätigung!',
        deactivatedMessage: 'Als inaktiv gemeldet',
        reactivatedMessage: 'Punkt reaktiviert!'
    },
    submit: {
        title: 'Ort melden',
        subtitle: 'Helfen Sie anderen, indem Sie einen Ort melden',
        addressLabel: 'Adresse',
        addressPlaceholder: 'Adresse eingeben oder Karte nutzen',
        notesLabel: 'Notizen (optional)',
        notesPlaceholder: 'Zusätzliche Details...',
        submitBtn: 'Meldung absenden',
        submitting: 'Wird gesendet...',
        success: 'Ort erfolgreich gemeldet!',
        error: 'Fehler beim Senden. Bitte erneut versuchen.',
        selectOnMap: 'Oder auf Karte tippen',
        currentLocation: 'Aktuellen Standort nutzen',
        gpsMode: 'GPS',
        mapMode: 'Karte',
        addressMode: 'Adresse',
        currentLocationLabel: 'Aktueller Standort',
        tapToLocate: 'Tippen zum Lokalisieren',
        selectedLocation: 'Ausgewählter Ort',
        locationSelected: 'Ort ausgewählt',
        tapMapPrompt: 'Tippen Sie auf die Karte, um einen Ort zu wählen',
        mapInstructions: 'Schließen Sie dieses Panel, tippen Sie auf die Karte, und es öffnet sich wieder mit dem Ort.',
        cityLabel: 'Stadt',
        cityPlaceholder: 'z.B. Berlin',
        streetLabel: 'Straße',
        streetPlaceholder: 'z.B. Unter den Linden',
        numberLabel: 'Nummer',
        numberPlaceholder: 'z.B. 42',
        findLocation: 'Ort suchen',
        addressNotFound: 'Adresse nicht gefunden.',
        geocodeError: 'Geocoding-Fehler.',
        addressRequired: 'Bitte Stadt und Straße eingeben',
        locationRequired: 'Ort erforderlich. Nutzen Sie GPS, Karte oder Adresse.',
        tagsLabel: 'Schnell-Tags',
        onePerson: 'Eine Person',
        multiple: 'Mehrere',
        children: 'Kinder',
        animals: 'Tiere'
    },
    route: {
        title: 'Routenplaner',
        optimizeRoute: 'Route berechnen',
        clearRoute: 'Route löschen',
        calculating: 'Berechne...',
        distance: 'Distanz',
        duration: 'Dauer',
        waypoints: 'Wegpunkte',
        noPoints: 'Keine Punkte für Route verfügbar',
        filterByStatus: 'Nach Status filtern',
        includeConfirmed: 'Bestätigte einbeziehen',
        includePending: 'Ausstehende einbeziehen',
        includeDeactivated: 'Deaktivierte einbeziehen',
        pointsSelected: 'Ausgewählte Punkte: {n}'
    },
    inbox: {
        title: 'Nachrichten',
        noMessages: 'Keine Nachrichten',
        markAllRead: 'Alle als gelesen markieren',
        unread: 'ungelesen'
    },
    profile: {
        title: 'Profil',
        nickname: 'Spitzname',
        nicknamePlaceholder: 'Ihr Spitzname',
        language: 'Sprache',
        pointsSubmitted: 'Gemeldete Punkte',
        confirmationsMade: 'Bestätigungen',
        saveChanges: 'Änderungen speichern',
        saving: 'Speichert...',
        saved: 'Änderungen gespeichert!',
        deviceId: 'Geräte-ID',
        memberSince: 'Mitglied seit',
        statistics: 'Statistiken'
    },
    language: {
        title: 'Sprache wählen',
        subtitle: 'Wählen Sie Ihre bevorzugte Sprache',
        continue: 'Weiter'
    },
    settings: {
        notifications: 'Benachrichtigungen',
        popupMessages: 'Echtzeit-Popups',
        popupDescription: 'Nachrichten sofort anzeigen'
    },
    // Welcome Message (Home Page)
    // Welcome Message (Home Page & Modal)
    welcome: {
        // Home Screen
        title: 'NestFinder',
        subtitle: 'Nester Finden ❤️ Linderung Bringen',
        nicknameLabel: 'Gib einen Spitznamen ein, um beizutragen (optional)',
        nicknamePlaceholder: 'Anonymer Helfer',
        buttonStart: 'Helfen Starten',
        buttonLoading: 'Starte...',

        // Welcome Modal
        modalTitle: 'Willkommen bei NestFinder!',
        message1: 'Danke, dass Sie so ein toller Mensch sind!',
        message2: 'Jeder Akt der Freundlichkeit zählt.',
        message3: 'Gemeinsam können wir einen Unterschied machen.',
        callToAction: 'Helfen Sie, Bedürftige zu finden und zu unterstützen.',
        button: 'Los geht\'s'
    },
    common: {
        loading: 'Laden...',
        error: 'Ein Fehler ist aufgetreten',
        retry: 'Wiederholen',
        cancel: 'Abbrechen',
        save: 'Speichern',
        delete: 'Löschen',
        confirm: 'Bestätigen',
        close: 'Schließen',
        back: 'Zurück',
        next: 'Weiter',
        yes: 'Ja',
        no: 'Nein',
        ok: 'OK'
    },
    geo: {
        permissionDenied: 'Standortzugriff verweigert',
        unavailable: 'Standort nicht verfügbar',
        timeout: 'Zeitüberschreitung',
        enableLocation: 'Standort aktivieren',
        requestingLocation: 'Standort wird ermittelt...',
        enableTitle: 'Aktiviere deinen Standort',
        enableSubtitle: 'Tippe unten, um Standort und personalisierte Routen zu aktivieren',
        enableButton: '📍 Standort aktivieren',
        locationEnabled: 'Standort aktiviert!',
        locationBlocked: 'Standort blockiert. Browserdaten löschen und erneut versuchen.',
        locationDenied: 'Standort verweigert. Prüfe {tip}',
        locationUnavailable: 'Standort nicht verfügbar. GPS prüfen.',
        locationTimeout: 'Zeitüberschreitung. Erneut versuchen oder GPS prüfen.',
        iosInstructions: 'iOS: Einstellungen → Datenschutz → Ortungsdienste → Safari → Erlauben',
        androidInstructions: 'Android: Einstellungen → Apps → Browser → Berechtigungen → Standort → Erlauben',
        desktopInstructions: 'Browsereinstellungen prüfen, um Standort zu aktivieren',
        iosTip: 'Einstellungen → Datenschutz → Ortungsdienste → Safari',
        androidTip: 'Einstellungen → Apps → Browser → Berechtigungen → Standort',
        browserSettings: 'Browsereinstellungen'
    },
    validation: {
        required: 'Dieses Feld ist erforderlich',
        invalidAddress: 'Bitte eine gültige Adresse eingeben',
        tooShort: 'Zu kurz',
        tooLong: 'Zu lang'
    },
    time: {
        justNow: 'Gerade eben',
        minutesAgo: 'Vor {n} Minuten',
        hoursAgo: 'Vor {n} Stunden',
        daysAgo: 'Vor {n} Tagen',
        today: 'Heute',
        yesterday: 'Gestern'
    }
};
