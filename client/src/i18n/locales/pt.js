// Portuguese translations
export default {
    _meta: {
        code: 'pt',
        name: 'Portuguese',
        nativeName: 'Português',
        flag: '🇵🇹'
    },
    nav: {
        map: 'Mapa',
        report: 'Reportar',
        profile: 'Perfil',
        inbox: 'Caixa de Entrada',
        settings: 'Definições'
    },
    map: {
        searchPlaceholder: 'Pesquisar local...',
        locateMe: 'Minha localização',
        filters: 'Filtros',
        route: 'Rota',
        download: 'Descarregar',
        downloadGPX: 'Descarregar GPX',
        downloadKML: 'Descarregar KML',
        downloadJSON: 'Descarregar JSON',
        downloadCSV: 'Descarregar CSV',
        downloadGPX: 'Descarregar GPX',
        downloadKML: 'Descarregar KML',
        totalPoints: 'pontos totais',
        noResults: 'Nenhum resultado encontrado'
    },
    filters: {
        title: 'Filtrar Pontos',
        showConfirmed: 'Mostrar Confirmados',
        showPending: 'Mostrar Pendentes',
        showDeactivated: 'Mostrar Desativados',
        done: 'Concluído',
        reset: 'Repor'
    },
    status: {
        confirmed: 'Confirmado',
        pending: 'Pendente',
        deactivated: 'Desativado'
    },
    point: {
        details: 'Detalhes do Ponto',
        status: 'Estado',
        address: 'Morada',
        notes: 'Notas',
        submittedBy: 'Enviado por',
        confirmations: 'Confirmações',
        deactivations: 'Relatórios de inatividade',
        actions: 'Ações',
        confirmBtn: 'Confirmar Ativo',
        deactivateBtn: 'Reportar Inativo',
        reactivateBtn: 'Reativar',
        navigateBtn: 'Navegar',
        close: 'Fechar',
        anonymous: 'Anônimo',
        confirmedMessage: 'Obrigado por confirmar!',
        deactivatedMessage: 'Reportado como inativo',
        reactivatedMessage: 'Ponto reativado!'
    },
    submit: {
        title: 'Reportar Localização',
        subtitle: 'Ajude os outros reportando um local',
        addressLabel: 'Morada',
        addressPlaceholder: 'Insira morada ou use o mapa',
        notesLabel: 'Notas (opcional)',
        notesPlaceholder: 'Detalhes adicionais...',
        submitBtn: 'Enviar Relatório',
        submitting: 'A enviar...',
        success: 'Localização reportada com sucesso!',
        error: 'Falha ao enviar. Tente novamente.',
        selectOnMap: 'Ou toque no mapa para selecionar',
        currentLocation: 'Usar Local Atual',
        gpsMode: 'GPS',
        mapMode: 'Mapa',
        addressMode: 'Morada',
        currentLocationLabel: 'Local Atual',
        tapToLocate: 'Toque para localizar',
        selectedLocation: 'Local Selecionado',
        locationSelected: 'Local selecionado',
        tapMapPrompt: 'Toque no mapa para selecionar um local',
        mapInstructions: 'Feche este painel, toque no mapa onde quer reportar, e ele abrirá novamente com esse local.',
        cityLabel: 'Cidade',
        cityPlaceholder: 'ex: Lisboa',
        streetLabel: 'Rua',
        streetPlaceholder: 'ex: Avenida da Liberdade',
        numberLabel: 'Número',
        numberPlaceholder: 'ex: 42',
        findLocation: 'Procurar Local',
        addressNotFound: 'Morada não encontrada.',
        geocodeError: 'Erro de geocodificação.',
        addressRequired: 'Insira pelo menos cidade e rua',
        locationRequired: 'Localização necessária. Use GPS, mapa ou morada.',
        tagsLabel: 'Tags Rápidas',
        onePerson: 'Uma pessoa',
        multiple: 'Várias',
        children: 'Crianças',
        animals: 'Animais'
    },
    route: {
        title: 'Planeador de Rota',
        optimizeRoute: 'Calcular Rota',
        clearRoute: 'Limpar Rota',
        calculating: 'A calcular...',
        distance: 'Distância',
        duration: 'Duração',
        waypoints: 'pontos de passagem',
        noPoints: 'Sem pontos disponíveis para rota',
        filterByStatus: 'Filtrar por estado',
        includeConfirmed: 'Incluir Confirmados',
        includePending: 'Incluir Pendentes',
        includeDeactivated: 'Incluir Desativados',
        pointsSelected: 'Pontos selecionados: {n}'
    },
    inbox: {
        title: 'Mensagens',
        noMessages: 'Sem mensagens',
        markAllRead: 'Marcar tudo como lido',
        unread: 'não lidas'
    },
    profile: {
        title: 'Perfil',
        nickname: 'Alcunha',
        nicknamePlaceholder: 'Sua alcunha',
        language: 'Idioma',
        pointsSubmitted: 'Pontos Enviados',
        confirmationsMade: 'Confirmações Feitas',
        saveChanges: 'Guardar Alterações',
        saving: 'A guardar...',
        saved: 'Alterações guardadas!',
        deviceId: 'ID do Dispositivo',
        memberSince: 'Membro desde',
        statistics: 'Estatísticas'
    },
    language: {
        title: 'Escolher Idioma',
        subtitle: 'Selecione o seu idioma preferido',
        continue: 'Continuar'
    },
    settings: {
        notifications: 'Notificações',
        popupMessages: 'Popups em Tempo Real',
        popupDescription: 'Mostrar mensagens assim que chegam'
    },
    // Welcome Message (Home Page)
    // Welcome Message (Home Page & Modal)
    welcome: {
        // Home Screen
        title: 'NestFinder',
        subtitle: 'Encontrando Ninhos ❤️ Trazendo Alívio',
        nicknameLabel: 'Digite um apelido para contribuir (opcional)',
        nicknamePlaceholder: 'Ajudante Anônimo',
        buttonStart: 'Começar a Ajudar',
        buttonLoading: 'Iniciando...',

        // Welcome Modal
        modalTitle: 'Bem-vindo ao NestFinder!',
        message1: 'Obrigado por ser o ser humano incrível que é!',
        message2: 'Cada ato de bondade conta quando nos ajudamos.',
        message3: 'Juntos podemos fazer a diferença na comunidade.',
        callToAction: 'Ajude a localizar e assistir quem mais precisa.',
        button: 'Começar'
    },
    common: {
        loading: 'A carregar...',
        error: 'Ocorreu um erro',
        retry: 'Tentar novamente',
        cancel: 'Cancelar',
        save: 'Guardar',
        delete: 'Eliminar',
        confirm: 'Confirmar',
        close: 'Fechar',
        back: 'Voltar',
        next: 'Seguinte',
        yes: 'Sim',
        no: 'Não',
        ok: 'OK'
    },
    geo: {
        permissionDenied: 'Acesso à localização negado',
        unavailable: 'Localização indisponível',
        timeout: 'Tempo limite excedido',
        enableLocation: 'Ativar Localização',
        requestingLocation: 'A obter localização...',
        enableTitle: 'Ative a sua Localização',
        enableSubtitle: 'Toque abaixo para ativar a localização e rotas personalizadas',
        enableButton: '📍 Ativar Localização',
        locationEnabled: 'Localização ativada!',
        locationBlocked: 'Localização bloqueada. Limpe os dados do navegador e tente novamente.',
        locationDenied: 'Localização negada. Verifique {tip}',
        locationUnavailable: 'Localização indisponível. Verifique o GPS do dispositivo.',
        locationTimeout: 'Tempo esgotado. Tente novamente ou verifique o GPS.',
        iosInstructions: 'iOS: Definições → Privacidade → Serviços de Localização → Safari → Permitir',
        androidInstructions: 'Android: Definições → Apps → Navegador → Permissões → Localização → Permitir',
        desktopInstructions: 'Verifique as definições do navegador para ativar a localização',
        iosTip: 'Definições → Privacidade → Serviços de Localização → Safari',
        androidTip: 'Definições → Apps → Navegador → Permissões → Localização',
        browserSettings: 'definições do navegador'
    },
    validation: {
        required: 'Este campo é obrigatório',
        invalidAddress: 'Insira uma morada válida',
        tooShort: 'Demasiado curto',
        tooLong: 'Demasiado longo'
    },
    time: {
        justNow: 'Agora mesmo',
        minutesAgo: 'Há {n} minutos',
        hoursAgo: 'Há {n} horas',
        daysAgo: 'Há {n} dias',
        today: 'Hoje',
        yesterday: 'Ontem'
    }
};
