// Spanish translations
export default {
    // Language metadata
    _meta: {
        code: 'es',
        name: 'Spanish',
        nativeName: 'Español',
        flag: '🇪🇸'
    },

    // Navigation
    nav: {
        map: 'Mapa',
        report: 'Reportar',
        profile: 'Perfil',
        inbox: 'Mensajes',
        settings: 'Ajustes'
    },

    // Map View
    map: {
        searchPlaceholder: 'Buscar ubicación...',
        locateMe: 'Mi ubicación',
        filters: 'Filtros',
        route: 'Ruta',
        download: 'Descargar',
        downloadGPX: 'Descargar GPX',
        downloadKML: 'Descargar KML',
        downloadJSON: 'Descargar JSON',
        downloadCSV: 'Descargar CSV',
        downloadGPX: 'Descargar GPX',
        downloadKML: 'Descargar KML',
        totalPoints: 'puntos totales',
        noResults: 'No se encontraron resultados'
    },

    // Filters
    filters: {
        title: 'Filtrar Puntos',
        showConfirmed: 'Mostrar Confirmados',
        showPending: 'Mostrar Pendientes',
        showDeactivated: 'Mostrar Desactivados',
        done: 'Listo',
        reset: 'Reiniciar'
    },

    // Point Status
    status: {
        confirmed: 'Confirmado',
        pending: 'Pendiente',
        deactivated: 'Desactivado'
    },

    // Point Details
    point: {
        details: 'Detalles del Punto',
        status: 'Estado',
        address: 'Dirección',
        notes: 'Notas',
        submittedBy: 'Enviado por',
        confirmations: 'Confirmaciones',
        deactivations: 'Reportes de desactivación',
        actions: 'Acciones',
        confirmBtn: 'Confirmar Activo',
        deactivateBtn: 'Reportar Inactivo',
        reactivateBtn: 'Reactivar',
        navigateBtn: 'Navegar',
        close: 'Cerrar',
        anonymous: 'Anónimo',
        confirmedMessage: '¡Gracias por confirmar!',
        deactivatedMessage: 'Reportado como inactivo',
        reactivatedMessage: '¡Punto reactivado!'
    },

    // Submit/Report Form
    submit: {
        title: 'Reportar Ubicación',
        subtitle: 'Ayuda a otros reportando una ubicación',
        addressLabel: 'Dirección',
        addressPlaceholder: 'Ingresa dirección o usa el mapa',
        notesLabel: 'Notas (opcional)',
        notesPlaceholder: 'Detalles adicionales...',
        submitBtn: 'Enviar Reporte',
        submitting: 'Enviando...',
        success: '¡Ubicación reportada exitosamente!',
        error: 'Error al enviar. Intenta de nuevo.',
        selectOnMap: 'O toca el mapa para seleccionar ubicación',
        currentLocation: 'Usar Ubicación Actual',
        // Mode labels
        gpsMode: 'GPS',
        mapMode: 'Mapa',
        addressMode: 'Dirección',
        // GPS mode
        currentLocationLabel: 'Ubicación Actual',
        tapToLocate: 'Toca el botón para encontrar ubicación',
        // Map mode
        selectedLocation: 'Ubicación Seleccionada',
        locationSelected: 'Ubicación seleccionada',
        tapMapPrompt: 'Toca el mapa para seleccionar una ubicación',
        mapInstructions: 'Cierra este panel, toca en el mapa donde quieras reportar, y se abrirá de nuevo con esa ubicación.',
        // Address mode
        cityLabel: 'Ciudad',
        cityPlaceholder: 'ej., Madrid',
        streetLabel: 'Calle',
        streetPlaceholder: 'ej., Gran Vía',
        numberLabel: 'Número',
        numberPlaceholder: 'ej., 42',
        findLocation: 'Buscar Ubicación',
        addressNotFound: 'Dirección no encontrada. Intenta otro formato.',
        geocodeError: 'Error al buscar dirección. Verifica tu conexión.',
        addressRequired: 'Ingresa al menos ciudad y calle',
        locationRequired: 'Ubicación requerida. Usa GPS, toca el mapa, o ingresa una dirección.',
        // Tags
        tagsLabel: '¿Quién está ahí? (Opcional)',
        onePerson: 'Una persona',
        multiple: 'Varias',
        children: 'Niños',
        animals: 'Animales',
        needsLabel: '¿Qué necesitan? (Opcional)',
        needFood: 'Comida',
        needWater: 'Agua',
        needClothes: 'Ropa',
        needMedicine: 'Medicina',
        needShelter: 'Refugio'
    },

    // Route Panel
    route: {
        title: 'Planificador de Ruta',
        optimizeRoute: 'Calcular Ruta',
        clearRoute: 'Limpiar Ruta',
        calculating: 'Calculando...',
        distance: 'Distancia',
        duration: 'Duración',
        waypoints: 'puntos de ruta',
        noPoints: 'No hay puntos disponibles para la ruta',
        filterByStatus: 'Filtrar por estado',
        includeConfirmed: 'Incluir Confirmados',
        includePending: 'Incluir Pendientes',
        includeDeactivated: 'Incluir Desactivados',
        pointsSelected: 'Puntos seleccionados: {n}',
        readyDescription: 'Calcula una ruta a pie optimizada visitando todos los puntos seleccionados.'
    },

    // Notifications/Inbox
    inbox: {
        title: 'Bandeja de Entrada',
        noMessages: 'No hay mensajes aún',
        markAllRead: 'Marcar todo como leído',
        unread: 'sin leer'
    },

    // Profile
    profile: {
        title: 'Perfil',
        nickname: 'Apodo',
        nicknamePlaceholder: 'Ingresa tu apodo',
        language: 'Idioma',
        pointsSubmitted: 'Puntos Enviados',
        confirmationsMade: 'Confirmaciones Realizadas',
        saveChanges: 'Guardar Cambios',
        saving: 'Guardando...',
        saved: '¡Cambios guardados!',
        deviceId: 'ID de Dispositivo',
        memberSince: 'Miembro desde',
        statistics: 'Estadísticas'
    },

    // Language Picker
    language: {
        title: 'Elegir Idioma',
        subtitle: 'Selecciona tu idioma preferido',
        continue: 'Continuar'
    },

    // Settings
    settings: {
        notifications: 'Notificaciones',
        popupMessages: 'Popups en Tiempo Real',
        popupDescription: 'Mostrar mensajes inmediatamente al recibirlos'
    },

    // Welcome Message
    // Welcome Message (Home Page)
    // Welcome Message (Home Page & Modal)
    welcome: {
        // Home Screen
        title: 'NestFinder',
        subtitle: 'Encontrando Nidos ❤️ Trayendo Alivio',
        nicknameLabel: 'Ingresa un apodo para contribuir (opcional)',
        nicknamePlaceholder: 'Ayudante Anónimo',
        buttonStart: 'Empezar a Ayudar',
        buttonLoading: 'Iniciando...',

        // Welcome Modal
        modalTitle: '¡Bienvenido a NestFinder!',
        message1: '¡Gracias por ser el maravilloso ser humano que eres!',
        message2: 'Cada acto de bondad cuenta cuando nos ayudamos mutuamente.',
        message3: 'Juntos podemos hacer la diferencia en nuestra comunidad.',
        callToAction: 'Ayuda a localizar y asistir a quienes más lo necesitan.',
        button: 'Comenzar'
    },

    // Common/Shared
    common: {
        loading: 'Cargando...',
        error: 'Ocurrió un error',
        retry: 'Reintentar',
        cancel: 'Cancelar',
        save: 'Guardar',
        delete: 'Eliminar',
        confirm: 'Confirmar',
        close: 'Cerrar',
        back: 'Atrás',
        next: 'Siguiente',
        yes: 'Sí',
        no: 'No',
        ok: 'OK'
    },

    // Geolocation
    geo: {
        permissionDenied: 'Acceso a ubicación denegado',
        unavailable: 'Ubicación no disponible',
        timeout: 'Tiempo de espera agotado',
        enableLocation: 'Activar Ubicación',
        requestingLocation: 'Obteniendo tu ubicación...',
        // Location banner
        enableTitle: 'Activa tu Ubicación',
        enableSubtitle: 'Toca abajo para activar la ubicación y rutas personalizadas',
        enableButton: '📍 Activar Ubicación',
        locationEnabled: '¡Ubicación activada!',
        locationBlocked: 'Ubicación bloqueada. Borra datos del navegador e intenta de nuevo.',
        locationDenied: 'Ubicación denegada. Revisa {tip}',
        locationUnavailable: 'Ubicación no disponible. Revisa el GPS de tu dispositivo.',
        locationTimeout: 'Tiempo agotado. Intenta de nuevo o revisa el GPS.',
        // Platform instructions
        iosInstructions: 'iOS: Ajustes → Privacidad → Localización → Safari → Permitir',
        androidInstructions: 'Android: Ajustes → Apps → Navegador → Permisos → Ubicación → Permitir',
        desktopInstructions: 'Revisa la configuración de tu navegador para activar la ubicación',
        iosTip: 'Ajustes → Privacidad → Localización → Safari',
        androidTip: 'Ajustes → Apps → Navegador → Permisos → Ubicación',
        browserSettings: 'configuración del navegador'
    },

    // Validation
    validation: {
        required: 'Este campo es requerido',
        invalidAddress: 'Ingresa una dirección válida',
        tooShort: 'Muy corto',
        tooLong: 'Muy largo'
    },

    // Time/Date
    time: {
        justNow: 'Ahora mismo',
        minutesAgo: 'Hace {n} minutos',
        hoursAgo: 'Hace {n} horas',
        daysAgo: 'Hace {n} días',
        today: 'Hoy',
        yesterday: 'Ayer'
    }
};
