// Arabic translations
export default {
    _meta: {
        code: 'ar',
        name: 'Arabic',
        nativeName: 'العربية',
        flag: '🇸🇦', // Saudi flag or generic
        dir: 'rtl'
    },
    // Feedback (English fallback)
    feedback: {
        description: 'الإبلاغ عن أخطاء، اقتراح ميزات، أو إرسال ملاحظات',
        placeholder: 'صف ملاحظاتك بالتفصيل...',
        send: 'إرسال الملاحظات',
        charLimit: 'أحرف',
        rateApp: 'قيم التطبيق',
        bugReport: 'تقرير خطأ',
        suggestion: 'اقتراح',
        general: 'ملاحظات',
        sentStatus: '✓ تم الإرسال!',
        sending: 'جاري الإرسال...',
        types: {
            bug: '🐛 خطأ',
            suggestion: '💡 فكرة',
            other: '📝 آخر'
        },
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
    nav: {
        map: 'الخريطة',
        report: 'إبلاغ',
        profile: 'الملف الشخصي',
        inbox: 'الوارد',
        settings: 'الإعدادات'
    },
    map: {
        searchPlaceholder: 'بحث عن موقع...',
        locateMe: 'موقعي',
        filters: 'تصفية',
        route: 'مسار',
        download: 'تنزيل',
        downloadGPX: 'تنزيل GPX',
        downloadKML: 'تنزيل KML',
        downloadJSON: 'تنزيل JSON',
        downloadCSV: 'تنزيل CSV',
        totalPoints: 'إجمالي النقاط',
        noResults: 'لا توجد نتائج'
    },
    filters: {
        title: 'تصفية النقاط',
        showConfirmed: 'عرض المؤكدة',
        showPending: 'عرض المعلقة',
        showDeactivated: 'عرض المعطلة',
        done: 'تم',
        reset: 'إعادة تعيين'
    },
    status: {
        confirmed: 'مؤكد',
        pending: 'قيد الانتظار',
        deactivated: 'معطل'
    },
    point: {
        details: 'تفاصيل النقطة',
        status: 'الحالة',
        address: 'العنوان',
        notes: 'ملاحظات',
        submittedBy: 'أرسلت بواسطة',
        confirmations: 'تأكيدات',
        deactivations: 'تقارير التعطيل',
        actions: 'إجراءات',
        confirmBtn: 'تأكيد النشاط',
        deactivateBtn: 'إبلاغ عن عدم النشاط',
        reactivateBtn: 'إعادة التنشيط',
        navigateBtn: 'توجيه',
        close: 'إغلاق',
        anonymous: 'مجهول',
        confirmedMessage: 'شكراً للتأكيد!',
        deactivatedMessage: 'تم الإبلاغ كغير نشط',
        reactivatedMessage: 'تم إعادة التنشيط!'
    },
    submit: {
        foundPrefix: 'Found:',
        locationFound: 'Location found!',
        title: 'الإبلاغ عن موقع',
        subtitle: 'ساعد الآخرين بالإبلاغ عن موقع',
        addressLabel: 'العنوان',
        addressPlaceholder: 'أدخل العنوان أو استخدم الخريطة',
        notesLabel: 'ملاحظات (اختياري)',
        notesPlaceholder: 'تفاصيل إضافية...',
        submitBtn: 'إرسال التقرير',
        submitting: 'جاري الإرسال...',
        success: 'تم الإرسال بنجاح!',
        error: 'فشل الإرسال. حاول مرة أخرى.',
        selectOnMap: 'أو حدد على الخريطة',
        currentLocation: 'استخدام الموقع الحالي',
        gpsMode: 'GPS',
        mapMode: 'خريطة',
        addressMode: 'عنوان',
        currentLocationLabel: 'الموقع الحالي',
        tapToLocate: 'اضغط لتحديد الموقع',
        selectedLocation: 'الموقع المحدد',
        locationSelected: 'تم اختيار الموقع',
        tapMapPrompt: 'اضغط على الخريطة للاختيار',
        mapInstructions: 'أغلق اللوحة، اختر من الخريطة، وسنعود هنا.',
        cityLabel: 'المدينة',
        cityPlaceholder: 'مثال: الرياض',
        streetLabel: 'الشارع',
        streetPlaceholder: 'مثال: الملك فهد',
        numberLabel: 'رقم',
        numberPlaceholder: 'مثال: 42',
        findLocation: 'بحث',
        addressNotFound: 'لم يتم العثور على العنوان.',
        geocodeError: 'خطأ في العنوان.',
        addressRequired: 'المدينة والشارع مطلوبان',
        locationRequired: 'الموقع مطلوب.',
        tagsLabel: 'من هناك؟ (اختياري)',
        onePerson: 'شخص واحد',
        multiple: 'مجموعة',
        children: 'أطفال',
        animals: 'حيوانات'
        ,
        voiceMode: 'صوتي',
        needsLabel: 'ماذا يحتاجون؟ (اختياري)',
        needFood: 'طعام',
        needWater: 'ماء',
        needClothes: 'ملابس',
        needMedicine: 'دواء',
        needShelter: 'مأوى'
    },
    route: {
        needPointsError: 'Need at least 2 points to calculate a route',
        failed: 'Could not calculate route',
        title: 'المسار',
        optimizeRoute: 'حساب المسار',
        clearRoute: 'مسح',
        calculating: 'حساب...',
        distance: 'المسافة',
        duration: 'المدة',
        waypoints: 'نقاط',
        noPoints: 'لا نقاط للمسار',
        filterByStatus: 'تصفية الحالة',
        includeConfirmed: 'مؤكدة',
        includePending: 'معلقة',
        includeDeactivated: 'معطلة',
        pointsSelected: 'النقاط المحددة: {n}',
        readyDescription: 'Calculate optimized walking path visiting all selected points.'
    },
    inbox: {
        noFilterMatch: 'No messages match this filter',
        title: 'الرسائل',
        received: 'الوارد',
        sent: 'المرسل',
        compose: 'إنشاء',
        noMessages: 'لا رسائل',
        markAllRead: 'قراءة الكل',
        unread: 'غير مقروء',
        empty: 'عشك فارغ',
        noSent: 'لا مساهمات بعد',
        'delete.confirm': 'حذف هذه الرسالة نهائياً؟',
        'delete.cancel': 'إلغاء',
        'delete.yes': 'حذف'
    },
    profile: {
        title: 'الملف الشخصي',
        nickname: 'اللقب',
        nicknamePlaceholder: 'لقبك',
        language: 'اللغة',
        pointsSubmitted: 'نقاط مرسلة',
        confirmationsMade: 'تأكيدات',
        saveChanges: 'حفظ',
        saving: 'حفظ...',
        saved: 'تم الحفظ!',
        deviceId: 'معرف الجهاز',
        memberSince: 'عضو منذ',
        statistics: 'إحصائيات'
    },
    language: {
        title: 'اللغة',
        subtitle: 'اختر لغتك',
        continue: 'متابع'
    },
    settings: {
        deleteActions: 'حذف الرسائل',
        yourProfile: 'ملفك الشخصي',
        notifications: 'إشعارات',
        popupMessages: 'نوافذ فورية',
        popupDescription: 'عرض الرسائل فوراً',
        popupEnabledInfo: 'سيتم عرض الرسائل كنوافذ منبثقة عند استلامها.',
        popupDisabledInfo: 'لن يتم عرض الرسائل عند استلامها ولكن سيتم حفظها في صندوق الوارد الخاص بك.',
        shareApp: 'مشاركة NestFinder',
        scanToShare: 'امسح لفتح NestFinder',
        copyLink: 'نسخ الرابط',
        shareLink: 'مشاركة الرابط',
        linkCopied: 'تم نسخ الرابط!',
        recoveryKey: 'مفتاح الاسترداد',
        recoveryKeyDescription: 'احفظ هذا المفتاح لاستعادة هويتك على جهاز جديد.',
        generateKey: 'إنشاء مفتاح الاسترداد',
        showKey: 'عرض مفتاح الاسترداد',
        copyKey: 'نسخ المفتاح',
        copied: 'تم النسخ!',
        keyGenerated: 'تم إنشاء المفتاح ونسخه!',
        performance: 'الأداء',
        liteMode: 'الوضع الخفيف',
        liteModeDescription: 'تقليل الرسوم المتحركة لأداء أكثر سلاسة',
        scrollInstruction: '🌍 مرر + انقر أو انتظر 2 ثانية للتأكيد',
        spreadWarmth: 'انشر الدفء! 🐣',
        trustScore: 'نقاط الثقة',
        anonymousUser: 'مستخدم',
        statusHatchling: 'فرخ',
        statusSparrow: 'عصفور',
        statusOwl: 'بومة',
        statusEagle: 'نسر',
        // Recovery Key Restore
        // recoveryKeyUsage: Deprecated
        restoreOptionsTitle: 'لاستعادة حسابك لديك خياران:',
        restoreOption1: '**تسجيل الدخول:** اكتب مفتاحك المكون من 3 كلمات **مع الفواصل** في حقل **الاسم المستعار** عند تسجيل الدخول.',
        restoreOption2: '**حساب جديد:** سجل الدخول بحساب جديد واستعد حسابك من قسم **استعادة الحساب** أدناه',
        restoreAccount: 'استعادة الحساب',
        restoreAccountDescription: 'أدخل مفتاح الاسترداد لاستعادة هويتك.',
        enterRecoveryKey: 'كلمة-كلمة-كلمة',
        invalidRecoveryKey: 'مفتاح استرداد غير صالح. تحقق وحاول مرة أخرى.',
        accountRestored: 'تمت استعادة الحساب! جاري إعادة التحميل...',
        restoreButton: 'استعادة الحساب',
        // Restore Warning Dialog
        restoreWarningTitle: 'تحذير',
        restoreWarningMessage: 'استعادة حساب آخر ستفصلك عن حسابك الحالي. إذا لم تحفظ مفتاح استرداد هذا الحساب، ستفقد الوصول إليه بشكل دائم. هل تريد المتابعة؟',
        restoreConfirmButton: 'نعم، استعادة',
        sameKeyError: 'هذا هو مفتاح استرداد حسابك الحالي. أنت مسجل الدخول بالفعل بهذا الحساب.',
        // Swipe Direction
        swipeDirection: 'حذف الرسائل',
        deleteSettingDesc: 'حدد كيف تريد حذف رسالة',
        safeDelete: 'حذف آمن',
        tapToSelect: 'انقر لتحديد اتجاه السحب',
        swipe: {
            controlLabel: 'Swipe',
            right: '← سحب لليمين',
            left: '→ سحب لليسار',
            desc: 'اسحب رسالة في هذا الاتجاه لحذفها.'
        },
        // Message Retention
        messageRetention: 'الاحتفاظ بالرسائل',
        retention: {
            '1m': 'شهر واحد',
            '3m': '3 أشهر',
            '6m': '6 أشهر',
            forever: 'للأبد',
            desc: '⚠️ سيتم حذف الرسائل الأقدم نهائياً.'
        },
        retentionHelp: {
            forever: 'يتم الاحتفاظ بالرسائل **لأجل غير مسمى**.',
            read: 'سيتم حذف الرسائل بمجرد **قراءتها**.',
            period: 'سيتم حذف الرسائل الأقدم من **{time}**.',
            unit: {
                d: 'يوم',
                w: 'أسبوع',
                m: 'شهر',
                y: 'سنة',
                h: 'ساعة'
            }
        },
        swipeHelp: {
            left: 'يمكنك الآن السحب إلى <b>اليسار</b> فوق رسالة لحذفها',
            right: 'يمكنك الآن السحب إلى <b>اليمين</b> فوق رسالة لحذفها',
            both: 'يمكنك الآن السحب إلى <b>اليسار</b> أو <b>اليمين</b> فوق رسالة لحذفها'
        },
        safeDeleteHelp: {
            enabled: 'سيظهر زر <delete>حذف</delete> عند التمرير فوق رسالة لحذفها.',
            disabled: 'يمكنك الآن حذف رسالة بمجرد التمرير فوقها.'
        }
    },
    // Welcome Message (Home Page)
    // Welcome Message (Home Page & Modal)
    welcome: {
        // Home Screen
        title: 'NestFinder',
        subtitle: 'إيجاد المأوى ❤️ جلب الراحة',
        nicknameLabel: 'أدخل اسم مستعار للمساهمة (اختياري)',
        nicknamePlaceholder: 'مساعد مجهول',
        buttonStart: 'ابدأ المساعدة',
        buttonLoading: 'جار البدء...',

        // Welcome Modal
        modalTitle: 'مرحبًا في NestFinder!',
        message1: 'شكراً لكونك رائعاً!',
        message2: 'المساعدة تحدث فرقاً.',
        message3: 'معاً نصنع التغيير.',
        callToAction: 'ساعد من يحتاج للمساعدة.',
        button: 'ابدأ',
        // Recovery error
        invalidRecoveryKey: 'مفتاح استرداد غير صالح. تحقق وحاول مرة أخرى.'
    },
    common: {
        loading: 'تحميل...',
        error: 'خطأ',
        retry: 'إعادة',
        cancel: 'إلغاء',
        save: 'حفظ',
        delete: 'حذف',
        confirm: 'تأكيد',
        close: 'إغلاق',
        back: 'رجوع',
        next: 'التالي',
        yes: 'نعم',
        no: 'لا',
        ok: 'تم'
    },
    geo: {
        permissionDenied: 'الوصول للموقع مرفوض',
        unavailable: 'الموقع غير متاح',
        timeout: 'انتهى الوقت',
        enableLocation: 'تشغيل الموقع',
        requestingLocation: 'تحديد الموقع...',
        enableTitle: 'فعّل موقعك',
        enableSubtitle: 'اضغط أدناه لتفعيل الموقع والمسارات المخصصة',
        enableButton: '📍 تشغيل الموقع',
        locationEnabled: 'تم تفعيل الموقع!',
        locationBlocked: 'الموقع محظور. امسح بيانات المتصفح وحاول مجدداً.',
        locationDenied: 'الموقع مرفوض. تحقق من {tip}',
        locationUnavailable: 'الموقع غير متاح. تحقق من GPS.',
        locationTimeout: 'انتهى الوقت. حاول مرة أخرى أو تحقق من GPS.',
        iosInstructions: 'iOS: الإعدادات ← الخصوصية ← خدمات الموقع ← Safari ← السماح',
        androidInstructions: 'Android: الإعدادات ← التطبيقات ← المتصفح ← الأذونات ← الموقع ← السماح',
        desktopInstructions: 'تحقق من إعدادات المتصفح لتفعيل الموقع',
        iosTip: 'الإعدادات ← الخصوصية ← خدمات الموقع ← Safari',
        androidTip: 'الإعدادات ← التطبيقات ← المتصفح ← الأذونات ← الموقع',
        browserSettings: 'إعدادات المتصفح'
    },
    validation: {
        required: 'مطلوب',
        invalidAddress: 'عنوان غير صحيح',
        tooShort: 'قصير',
        tooLong: 'طويل'
    },
    time: {
        justNow: 'الآن',
        minutesAgo: 'منذ {n} د',
        hoursAgo: 'منذ {n} س',
        daysAgo: 'منذ {n} ي',
        today: 'اليوم',
        yesterday: 'أمس'
    }
};
