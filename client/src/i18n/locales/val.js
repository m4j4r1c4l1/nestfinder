// Valencian translations
export default {
    _meta: {
        code: 'val',
        name: 'Valencian',
        nativeName: 'Valencià',
        flag: '🥘'
    },
    nav: {
        map: 'Mapa',
        report: 'Reportar',
        profile: 'Perfil',
        inbox: 'Missatges',
        settings: 'Ajustos'
    },
    map: {
        searchPlaceholder: 'Cercar ubicació...',
        locateMe: 'La meua ubicació',
        filters: 'Filtres',
        route: 'Ruta',
        download: 'Descarregar',
        downloadGPX: 'Descarregar GPX',
        downloadKML: 'Descarregar KML',
        downloadJSON: 'Descarregar JSON',
        downloadCSV: 'Descarregar CSV',
        downloadGPX: 'Descarregar GPX',
        downloadKML: 'Descarregar KML',
        totalPoints: 'punts totals',
        noResults: "No s'han trobat resultats"
    },
    filters: {
        title: 'Filtrar Punts',
        showConfirmed: 'Mostrar Confirmats',
        showPending: 'Mostrar Pendents',
        showDeactivated: 'Mostrar Desactivats',
        done: 'Fet',
        reset: 'Reiniciar'
    },
    status: {
        confirmed: 'Confirmat',
        pending: 'Pendent',
        deactivated: 'Desactivat'
    },
    point: {
        details: 'Detalls del Punt',
        status: 'Estat',
        address: 'Adreça',
        notes: 'Notes',
        submittedBy: 'Enviat per',
        confirmations: 'Confirmacions',
        deactivations: 'Reports de desactivació',
        actions: 'Accions',
        confirmBtn: 'Confirmar Actiu',
        deactivateBtn: 'Reportar Inactiu',
        reactivateBtn: 'Reactivar',
        navigateBtn: 'Navegar',
        close: 'Tancar',
        anonymous: 'Anònim',
        confirmedMessage: 'Gràcies per confirmar!',
        deactivatedMessage: 'Reportat com inactiu',
        reactivatedMessage: 'Punt reactivat!'
    },
    submit: {
        title: 'Reportar Ubicació',
        subtitle: 'Ajuda als altres reportant un lloc',
        addressLabel: 'Adreça',
        addressPlaceholder: 'Introdueix adreça o usa el mapa',
        notesLabel: 'Notes (opcional)',
        notesPlaceholder: 'Detalls addicionals...',
        submitBtn: 'Enviar Report',
        submitting: 'Enviant...',
        success: 'Ubicació reportada amb èxit!',
        error: "Error a l'enviar. Torna a intentar-ho.",
        selectOnMap: 'O toca el mapa per seleccionar ubicació',
        currentLocation: 'Usar Ubicació Actual',
        gpsMode: 'GPS',
        mapMode: 'Mapa',
        addressMode: 'Adreça',
        currentLocationLabel: 'Ubicació Actual',
        tapToLocate: 'Toca el botó per trobar ubicació',
        selectedLocation: 'Ubicació Seleccionada',
        locationSelected: 'Ubicació seleccionada',
        tapMapPrompt: 'Toca el mapa per seleccionar una ubicació',
        mapInstructions: "Tanca aquest panell, toca en el mapa on vulgues reportar, i s'obrirà de nou amb eixa ubicació.",
        cityLabel: 'Ciutat',
        cityPlaceholder: 'ex: València',
        streetLabel: 'Carrer',
        streetPlaceholder: 'ex: Carrer de Colón',
        numberLabel: 'Número',
        numberPlaceholder: 'ex: 42',
        findLocation: 'Cercar Ubicació',
        addressNotFound: 'Adreça no trobada.',
        geocodeError: 'Error al cercar adreça.',
        addressRequired: 'Introdueix almenys ciutat i carrer',
        locationRequired: 'Ubicació requerida. Usa GPS, toca el mapa o una adreça.',
        tagsLabel: 'Etiquetes Ràpides',
        onePerson: 'Una persona',
        multiple: 'Vàries',
        children: 'Xiquets',
        animals: 'Animals'
    },
    route: {
        title: 'Planificador de Ruta',
        optimizeRoute: 'Calcular Ruta',
        clearRoute: 'Netejar Ruta',
        calculating: 'Calculant...',
        distance: 'Distància',
        duration: 'Durada',
        waypoints: 'punts de ruta',
        noPoints: 'No hi ha punts disponibles',
        filterByStatus: "Filtrar per estat",
        includeConfirmed: 'Incloure Confirmats',
        includePending: 'Incloure Pendents',
        includeDeactivated: 'Incloure Desactivats',
        pointsSelected: 'Punts seleccionats: {n}',
        readyDescription: 'Calcula una ruta a peu optimitzada visitant tots els punts seleccionats.'
    },
    inbox: {
        title: "Bústia d'entrada",
        noMessages: 'No hi ha missatges encara',
        markAllRead: 'Marcar tot com llegit',
        unread: 'sense llegir'
    },
    profile: {
        title: 'Perfil',
        nickname: 'Aliàs',
        nicknamePlaceholder: 'El teu aliàs',
        language: 'Idioma',
        pointsSubmitted: 'Punts Enviats',
        confirmationsMade: 'Confirmacions Fetes',
        saveChanges: 'Guardar Canvis',
        saving: 'Guardant...',
        saved: 'Canvis guardats!',
        deviceId: 'ID de Dispositiu',
        memberSince: 'Membre des de',
        statistics: 'Estadístiques'
    },
    language: {
        title: 'Triar Idioma',
        subtitle: 'Selecciona el teu idioma preferit',
        continue: 'Continuar'
    },
    settings: {
        notifications: 'Notificacions',
        popupMessages: 'Popups en Temps Real',
        popupDescription: 'Mostrar missatges immediatament'
    },
    // Welcome Message (Home Page)
    // Welcome Message (Home Page & Modal)
    welcome: {
        // Home Screen
        title: 'NestFinder',
        subtitle: 'Trobant Nius ❤️ Portant Alleujament',
        nicknameLabel: 'Introdueix un sobrenom per a contribuir (opcional)',
        nicknamePlaceholder: 'Ajudant Anònim',
        buttonStart: 'Començar a Ajudar',
        buttonLoading: 'Iniciant...',

        // Welcome Modal
        modalTitle: 'Benvingut a NestFinder!',
        message1: "Gràcies per ser la persona meravellosa que eres!",
        message2: "Cada acte de bondat compta quan ens ajudem mútuament.",
        message3: 'Junts podem fer la diferència en la nostra comunitat.',
        callToAction: 'Ajuda a localitzar i assistir a qui més ho necessita.',
        button: 'Començar'
    },
    common: {
        loading: 'Carregant...',
        error: 'Ha ocorregut un error',
        retry: 'Reintentar',
        cancel: 'Cancel·lar',
        save: 'Guardar',
        delete: 'Eliminar',
        confirm: 'Confirmar',
        close: 'Tancar',
        back: 'Arrere',
        next: 'Següent',
        yes: 'Sí',
        no: 'No',
        ok: 'D\'acord'
    },
    geo: {
        permissionDenied: "Accés a ubicació denegat",
        unavailable: 'Ubicació no disponible',
        timeout: "Temps d'espera esgotat",
        enableLocation: 'Activar Ubicació',
        requestingLocation: 'Obtenint la teua ubicació...',
        enableTitle: 'Activa la teua Ubicació',
        enableSubtitle: 'Prem a baix per a activar la ubicació i rutes personalitzades',
        enableButton: '📍 Activar Ubicació',
        locationEnabled: 'Ubicació activada!',
        locationBlocked: 'Ubicació bloquejada. Esborra les dades del navegador i torna a intentar-ho.',
        locationDenied: 'Ubicació denegada. Revisa {tip}',
        locationUnavailable: 'Ubicació no disponible. Revisa el GPS del teu dispositiu.',
        locationTimeout: "Temps esgotat. Torna a intentar-ho o revisa el GPS.",
        iosInstructions: 'iOS: Ajustos → Privacitat → Servicis de Localització → Safari → Permetre',
        androidInstructions: 'Android: Ajustos → Apps → Navegador → Permisos → Ubicació → Permetre',
        desktopInstructions: 'Revisa la configuració del teu navegador per a activar la ubicació',
        iosTip: 'Ajustos → Privacitat → Servicis de Localització → Safari',
        androidTip: 'Ajustos → Apps → Navegador → Permisos → Ubicació',
        browserSettings: 'configuració del navegador'
    },
    validation: {
        required: 'Aquest camp és requerit',
        invalidAddress: 'Introdueix una adreça vàlida',
        tooShort: 'Massa curt',
        tooLong: 'Massa llarg'
    },
    time: {
        justNow: 'Ara mateix',
        minutesAgo: 'Fa {n} minuts',
        hoursAgo: 'Fa {n} hores',
        daysAgo: 'Fa {n} dies',
        today: 'Hui',
        yesterday: 'Ahir'
    }
};
