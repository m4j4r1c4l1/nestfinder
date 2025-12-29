// Arabic translations
export default {
    _meta: {
        code: 'ar',
        name: 'Arabic',
        nativeName: 'العربية',
        flag: '🇸🇦', // Saudi flag or generic
        dir: 'rtl'
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
        tagsLabel: 'وسوم',
        onePerson: 'شخص',
        multiple: 'أشخاص',
        children: 'أطفال',
        animals: 'حيوانات'
    },
    route: {
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
        pointsSelected: 'النقاط المحددة: {n}'
    },
    inbox: {
        title: 'الرسائل',
        noMessages: 'لا رسائل',
        markAllRead: 'قراءة الكل',
        unread: 'غير مقروء'
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
        notifications: 'إشعارات',
        popupMessages: 'نوافذ فورية',
        popupDescription: 'عرض الرسائل فوراً'
    },
    welcome: {
        title: 'مرحبًا في NestFinder!',
        message1: 'شكراً لكونك رائعاً!',
        message2: 'المساعدة تحدث فرقاً.',
        message3: 'معاً نصنع التغيير.',
        callToAction: 'ساعد من يحتاج للمساعدة.',
        button: 'ابدأ'
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
