/**
 * TripCraft — Intelligent Travel Planner & Itinerary Studio
 * Master Client Application Script
 * Compliant with Tripcraft_instruction.txt.docx specifications
 */

(function() {
  'use strict';

  // ==========================================================================
  // 1. Currency & Conversion
  // ==========================================================================
  const CURRENCIES = {
    USD: { symbol: '$', rate: 1.0 },
    EUR: { symbol: '€', rate: 0.92 },
    GBP: { symbol: '£', rate: 0.79 },
    JPY: { symbol: '¥', rate: 152.0 },
    SAR: { symbol: 'ر.س', rate: 3.75 }
  };

  let currentCurrency = localStorage.getItem('tripcraft_currency') || 'USD';

  function formatMoney(amountInUSD) {
    const curr = CURRENCIES[currentCurrency] || CURRENCIES.USD;
    const converted = Math.round(amountInUSD * curr.rate);
    if (currentCurrency === 'JPY') {
      return `${curr.symbol}${converted.toLocaleString()}`;
    }
    if (currentCurrency === 'SAR') {
      return `${converted.toLocaleString()} ${curr.symbol}`;
    }
    return `${curr.symbol}${converted.toLocaleString()}`;
  }

  // ==========================================================================
  // 2. Multilingual Localization Engine
  // ==========================================================================
  const TRANSLATIONS = {
    en: {
      tagline: "Personal Travel Planner",
      selectTrip: "Select Trip",
      navNewTrip: "Plan New Trip",
      labelTravelers: "Travelers",
      labelStay: "Recommended Stay",
      labelBudget: "Est. Daily Spending",
      labelNeighborhood: "Current District",
      tabItinerary: "Day-by-Day Itinerary",
      tabStays: "Recommended Stays",
      tabBudget: "Cost Estimates & Budget",
      tabCustomize: "Modify & Customize",
      tabPacking: "Packing Checklist",
      btnAdjustPace: "Adjust Pace",
      btnPrint: "Print / PDF",
      labelNeighborhoodCluster: "Geographic Neighborhood Cluster",
      transitOptimizedSubtext: "Activities grouped within 1.2km to minimize walking and transit time for families.",
      labelWeatherAdaptation: "Weather Adaptation Plan",
      customizePlanTitle: "Customize or Fine-Tune This Day",
      customizePlanSubtitle: "Easily swap an activity, change a food recommendation, adjust pacing, or request direct booking guidance.",
      actionSwapActivity: "Swap an Activity",
      actionSwapActivityDesc: "Browse curated alternate sights in this district",
      actionChangeRestaurant: "Change Restaurant",
      actionChangeRestaurantDesc: "Pick vegetarian, halal, or child-friendly local eateries",
      actionAdjustPace: "Adjust Daily Pace",
      actionAdjustPaceDesc: "Switch between Relaxed, Balanced, and Fast-Paced",
      actionBookingGuide: "Booking Guidance & Links",
      actionBookingGuideDesc: "Official entry passes, transit cards & reservations",
      staysHeaderTitle: "Recommended Places to Stay",
      staysHeaderSubtitle: "Curated accommodations tailored to your group size, traveler ages, accessibility needs, and budget preference.",
      filterBy: "Filter by:",
      filterAll: "All Recommendations",
      filterFamilySuites: "Family Suites",
      filterAccessible: "Wheelchair / Stroller Ready",
      filterCentral: "Transit Centric",
      budgetHeaderTitle: "Cost Estimates & Budget Planning",
      budgetHeaderSubtitle: "Clear cost breakdowns for accommodations, local food, entry admissions, and neighborhood transit.",
      budgetTierLabel: "Budget Tier:",
      totalEstTripCost: "Total Estimated Trip Cost",
      dailySpendAverage: "Average Daily Spend",
      perPersonEstimate: "Per Person Estimate",
      budgetStatus: "Budget Health",
      onTrack: "On Track",
      includesAllExpenses: "Includes lodging, dining, transit & tickets",
      perTravelerTotal: "All-inclusive per traveler estimate",
      alignedWithTier: "Aligned with your selected comfort tier",
      categoryBreakdownTitle: "Expense Category Breakdown",
      catLodging: "Lodging",
      catDining: "Local Dining",
      catTickets: "Attractions & Entry",
      catTransit: "Neighborhood Transit",
      dailyCostBreakdownTitle: "Daily Spending Breakdown",
      thDay: "Day",
      thNeighborhood: "Neighborhood Cluster",
      thMeals: "Meals & Street Food",
      thTickets: "Attractions & Entries",
      thTransit: "Transit",
      thDailyTotal: "Daily Total",
      customizeHeaderTitle: "TripCraft Customization Studio",
      customizeHeaderSubtitle: "Modify your itinerary to suit your changing energy levels, dietary desires, and travel tempo.",
      paceControlTitle: "Daily Pace & Tempo",
      paceControlSubtitle: "Adapt the itinerary density to fit family stamina and personal travel philosophy.",
      paceRelaxedName: "🌿 Relaxed & Unhurried",
      paceRelaxedTag: "Family & Seniors",
      paceRelaxedDesc: "Late mornings, maximum 2 activities per day, generous cafe breaks, and early dinners.",
      paceBalancedName: "⚖️ Balanced & Curated",
      paceBalancedTag: "Recommended",
      paceBalancedDesc: "Structured morning and afternoon exploration with flexible evenings and neighborhood grouping.",
      pacePackedName: "⚡ Fast-Paced & Immersive",
      pacePackedTag: "Active Explorers",
      pacePackedDesc: "Early start, 4-5 major sights, night tours, and maximized discovery for high energy travelers.",
      btnApplyPace: "Apply Pace to Itinerary",
      swapConsoleTitle: "Swap Activities or Dining Spots",
      swapConsoleSubtitle: "Select any day slot to view instant smart alternatives in the same neighborhood cluster.",
      labelTargetDay: "Select Day to Modify",
      labelTimeSlot: "Time Block to Swap",
      slotMorning: "Morning Activity",
      slotLunch: "Lunch & Local Food Spot",
      slotAfternoon: "Afternoon Activity",
      slotEvening: "Evening Activity & Dinner",
      labelCuratedAlternates: "Curated Alternatives for Selected Slot:",
      bookingGuidanceTitle: "Direct Booking Guidance & Official Links",
      bookingGuidanceSubtitle: "Avoid overpriced third-party reseller markups with TripCraft's official reservation portals and passes.",
      packingHeaderTitle: "Smart Packing & Travel Preparation",
      packingHeaderSubtitle: "Checklist tailored to your destination's seasonal weather, group age composition, and activity types.",
      packed: "Packed",
      footerText: "Crafting personalized, weather-adaptive journeys worldwide.",
      footerLangSupport: "Compatible with all languages • Family & Accessibility Centered",
      modalNewTripTitle: "Plan a New Personalized Journey",
      formLabelDestination: "Destination City & Country *",
      formLabelDuration: "Duration (Days) *",
      formSectionTravelers: "Who is traveling? (Group size & age breakdown)",
      formLabelAdults: "Adults (Ages 18-64)",
      formLabelChildren: "Children / Teens (0-17)",
      formLabelSeniors: "Seniors (Ages 65+)",
      formLabelTripType: "Type of Visit *",
      typeFamily: "Family Vacation (Balanced & Child Friendly)",
      typeCulture: "Cultural Exploration & Heritage",
      typeRelaxation: "Relaxation, Scenery & Wellness",
      typeCelebration: "Celebration, Romance & Honeymoon",
      typeAdventure: "Adventure, Hiking & Active",
      formLabelBudgetPref: "Budget Preference *",
      budgetOptionEconomy: "Budget / Economy (Hostels, Street Eats, Transit)",
      budgetOptionModerate: "Moderate / Comfort (Family Hotels, Casual Dining, Passports)",
      budgetOptionLuxury: "Luxury / Premium (5-Star Stays, Fine Dining, Private Cars)",
      formLabelStartDate: "Start Date",
      formLabelSpecialNotes: "Special Preferences / Accessibility",
      btnCancel: "Cancel",
      btnGeneratePlan: "Generate Complete Trip Plan",
      completed: "Completed",
      markCompleted: "Mark Done",
      btnSwap: "Swap",
      btnBook: "Booking Info",
      btnSelectThis: "Select Alternative",
      perNight: "/ night",
      authLoginRegister: "Login / Register",
      authTitle: "Welcome to TripCraft",
      authLogin: "Login",
      authRegister: "Register",
      authEmail: "Email Address",
      authPassword: "Password",
      authName: "Full Name",
      destSearchPlaceholder: "Search city or country…",
      destLoading: "Searching destinations…",
      destNoResults: "No destinations found",
      destError: "Unable to load destinations",
      destImageError: "Unable to load destination image",
      destRetry: "Retry",
      weatherLoading: "Loading weather…",
      weatherError: "Weather unavailable",
      weatherFeels: "Feels",
      weatherClear: "Clear",
      weatherMainlyClear: "Mainly clear",
      weatherPartlyCloudy: "Partly cloudy",
      weatherOvercast: "Overcast",
      weatherFog: "Fog",
      weatherDrizzle: "Drizzle",
      weatherRain: "Rain",
      weatherHeavyRain: "Heavy rain",
      weatherShowers: "Showers",
      weatherHeavyShowers: "Heavy showers",
      weatherSnow: "Snow",
      weatherHeavySnow: "Heavy snow",
      weatherSnowShowers: "Snow showers",
      weatherThunderstorm: "Thunderstorm",
      weatherUnknown: "Unknown"
    },
    ar: {
      tagline: "مساعد التخطيط الشخصي للرحلات",
      selectTrip: "اختر الرحلة",
      navNewTrip: "خطط لرحلة جديدة",
      labelTravelers: "المسافرون",
      labelStay: "الإقامة الموصى بها",
      labelBudget: "الإنفاق اليومي التقديري",
      labelNeighborhood: "الحي الحالي",
      tabItinerary: "جدول الأيام خطوة بخطوة",
      tabStays: "خيارات الإقامة الموصى بها",
      tabBudget: "تقديرات التكلفة والميزانية",
      tabCustomize: "تعديل وتخصيص الخطة",
      tabPacking: "قائمة تجهيز الحقائب",
      btnAdjustPace: "تعديل سرعة اليوم",
      btnPrint: "طباعة / PDF",
      labelNeighborhoodCluster: "التجمع الجغرافي للحي",
      transitOptimizedSubtext: "تم تجميع الأنشطة في نطاق 1.2 كم لتقليل وقت التنقل والمشي للعائلات.",
      labelWeatherAdaptation: "خطة التكيف مع الطقس",
      customizePlanTitle: "تخصيص وتعديل خطة هذا اليوم",
      customizePlanSubtitle: "يمكنك بسهولة تبديل نشاط، تغيير مطعم محلي، تعديل وتيرة اليوم، أو طلب روابط الحجز المباشرة.",
      actionSwapActivity: "تبديل نشاط",
      actionSwapActivityDesc: "استعرض معالم بديلة ومميزة في نفس الحي",
      actionChangeRestaurant: "تغيير المطعم",
      actionChangeRestaurantDesc: "اختر مطاعم محلية مناسبة للأطفال أو خيارات نباتية وحلال",
      actionAdjustPace: "تعديل سرعة اليوم",
      actionAdjustPaceDesc: "التنقل بين نمط هادئ، متوازن، وسريع ومكثف",
      actionBookingGuide: "دليل وروابط الحجز المباشر",
      actionBookingGuideDesc: "التذاكر الرسمية، بطاقات المواصلات والحجوزات المؤكدة",
      staysHeaderTitle: "أماكن الإقامة الموصى بها",
      staysHeaderSubtitle: "أماكن إقامة مختارة بعناية لتناسب حجم مجموعتك وأعمار المسافرين وسهولة الوصول وميزانيتك.",
      filterBy: "تصفية حسب:",
      filterAll: "جميع التوصيات",
      filterFamilySuites: "أجنحة عائلية",
      filterAccessible: "مناسب للعربات والكراسي المتحركة",
      filterCentral: "قريب من المواصلات",
      budgetHeaderTitle: "تقديرات التكاليف وتخطيط الميزانية",
      budgetHeaderSubtitle: "تفصيل واضح للتكاليف يشمل الإقامة، الوجبات المحلية، تذاكر الدخول، والمواصلات.",
      budgetTierLabel: "مستوى الميزانية:",
      totalEstTripCost: "إجمالي التكلفة التقديرية للرحلة",
      dailySpendAverage: "متوسط الإنفاق اليومي",
      perPersonEstimate: "التقدير لكل شخص",
      budgetStatus: "حالة الميزانية",
      onTrack: "ضمن الميزانية",
      includesAllExpenses: "يشمل السكن، الطعام، المواصلات والتذاكر",
      perTravelerTotal: "تقدير شامل لكل مسافر",
      alignedWithTier: "متوافق تماماً مع مستوى الراحة المحدد",
      categoryBreakdownTitle: "توزيع فئات النفقات",
      catLodging: "الإقامة الفندقية",
      catDining: "المطاعم المحلية",
      catTickets: "المعالم وتذاكر الدخول",
      catTransit: "المواصلات الداخلية",
      dailyCostBreakdownTitle: "تفصيل الإنفاق اليومي",
      thDay: "اليوم",
      thNeighborhood: "تجمع الحي",
      thMeals: "الوجبات والأكلات الشعبية",
      thTickets: "المعالم والتذاكر",
      thTransit: "المواصلات",
      thDailyTotal: "المجموع اليومي",
      customizeHeaderTitle: "استوديو تخصيص TripCraft",
      customizeHeaderSubtitle: "عدل جدولك ليناسب طاقة العائلة ورغباتك الغذائية ووتيرة سفرك المفضلة.",
      paceControlTitle: "وتيرة وسرعة اليوم",
      paceControlSubtitle: "اضبط كثافة الأنشطة لتناسب راحة الأطفال وكبار السن.",
      paceRelaxedName: "🌿 مريح وغير مستعجل",
      paceRelaxedTag: "عائلات وكبار السن",
      paceRelaxedDesc: "صباح متأخر، نشاطان كحد أقصى يومياً، استراحات طويلة في المقاهي، وعشاء مبكر.",
      paceBalancedName: "⚖️ متوازن ومثالي",
      paceBalancedTag: "موصى به",
      paceBalancedDesc: "استكشاف منظم صباحاً وبعد الظهر مع أمسيات مرنة وتجميع ذكي للمواقع.",
      pacePackedName: "⚡ مكثف وسريع",
      pacePackedTag: "مستكشفون نشطون",
      pacePackedDesc: "انطلاق مبكر، 4-5 معالم رئيسية يومياً، جولات ليلية، واكتشاف أقصى قدر ممكن.",
      btnApplyPace: "تطبيق الوتيرة على الجدول",
      swapConsoleTitle: "تبديل الأنشطة أو المطاعم",
      swapConsoleSubtitle: "حدد أي فترة زمنية لعرض خيارات ذكية فورية في نفس الحي.",
      labelTargetDay: "اختر اليوم المراد تعديله",
      labelTimeSlot: "الفترة الزمنية للتبديل",
      slotMorning: "نشاط الصباح",
      slotLunch: "الغداء والأكل المحلي",
      slotAfternoon: "نشاط بعد الظهر",
      slotEvening: "نشاط المساء والعشاء",
      labelCuratedAlternates: "بدائل ممتازة لهذه الفترة:",
      bookingGuidanceTitle: "إرشادات وروابط الحجز المباشر",
      bookingGuidanceSubtitle: "تجنب الرسوم الإضافية عبر بوابات الحجز الرسمية وبطاقات السفر المعتمدة.",
      packingHeaderTitle: "تجهيز الحقائب الذكي",
      packingHeaderSubtitle: "قائمة مخصصة تعتمد على طقس وجهتك، أعمار المسافرين، ونوع الأنشطة المخططة.",
      packed: "تم تجهيزه",
      footerText: "نصمم رحلات مخصصة ومتكيفة مع الطقس حول العالم.",
      footerLangSupport: "متوافق مع جميع اللغات • تركيز على العائلة وسهولة الوصول",
      modalNewTripTitle: "تخطيط رحلة جديدة ومخصصة",
      formLabelDestination: "المدينة والدولة *",
      formLabelDuration: "المدة (بالأيام) *",
      formSectionTravelers: "من سيسافر؟ (عدد الأشخاص وفئات الأعمار)",
      formLabelAdults: "البالغون (18-64 سنة)",
      formLabelChildren: "الأطفال والمراهقون (0-17 سنة)",
      formLabelSeniors: "كبار السن (65+ سنة)",
      formLabelTripType: "نوع الرحلة *",
      typeFamily: "إجازة عائلية (متوازنة ومناسبة للأطفال)",
      typeCulture: "استكشاف ثقافي وتاريخي",
      typeRelaxation: "استرخاء ونقاهة وطبيعة",
      typeCelebration: "احتفال، شهر عسل ورومانسية",
      typeAdventure: "مغامرة ومسارات مشي ونشاط",
      formLabelBudgetPref: "الميزانية المفضلة *",
      budgetOptionEconomy: "اقتصادية (أماكن إقامة بسيطة، أكل شارع ومواصلات عامة)",
      budgetOptionModerate: "متوسطة / مريحة (فنادق عائلية، مطاعم ممتازة، بطاقات سياحية)",
      budgetOptionLuxury: "فاخرة / مميزة (فنادق 5 نجوم، تجارب راقية، سيارات خاصة)",
      formLabelStartDate: "تاريخ البداية",
      formLabelSpecialNotes: "تفضيلات خاصة / متطلبات سهولة الوصول",
      btnCancel: "إلغاء",
      btnGeneratePlan: "توليد خطة الرحلة المتكاملة",
      completed: "مكتمل",
      markCompleted: "تحديد كمكتمل",
      btnSwap: "تبديل",
      btnBook: "معلومات الحجز",
      btnSelectThis: "اختيار هذا البديل",
      perNight: "/ ليلة",
      authLoginRegister: "تسجيل الدخول / إنشاء حساب",
      authTitle: "مرحباً بك في TripCraft",
      authLogin: "تسجيل الدخول",
      authRegister: "إنشاء حساب",
      authEmail: "البريد الإلكتروني",
      authPassword: "كلمة المرور",
      authName: "الاسم الكامل",
      destSearchPlaceholder: "ابحث عن مدينة أو دولة…",
      destLoading: "جارٍ البحث عن الوجهات…",
      destNoResults: "لم يتم العثور على وجهات",
      destError: "تعذر تحميل الوجهات",
      destImageError: "تعذر تحميل صورة الوجهة",
      destRetry: "إعادة المحاولة",
      weatherLoading: "جارٍ تحميل الطقس…",
      weatherError: "الطقس غير متوفر",
      weatherFeels: "الإحساس الفعلي",
      weatherClear: "صافٍ",
      weatherMainlyClear: "صافٍ غالباً",
      weatherPartlyCloudy: "غائم جزئياً",
      weatherOvercast: "غائم",
      weatherFog: "ضباب",
      weatherDrizzle: "رذاذ خفيف",
      weatherRain: "أمطار",
      weatherHeavyRain: "أمطار غزيرة",
      weatherShowers: "زخات مطرية",
      weatherHeavyShowers: "زخات غزيرة",
      weatherSnow: "ثلوج",
      weatherHeavySnow: "ثلوج كثيفة",
      weatherSnowShowers: "زخات ثلجية",
      weatherThunderstorm: "عاصفة رعدية",
      weatherUnknown: "غير معروف"
    },
    es: {
      tagline: "Planificador Personal de Viajes",
      selectTrip: "Seleccionar Viaje",
      navNewTrip: "Planificar Nuevo Viaje",
      labelTravelers: "Viajeros",
      labelStay: "Alojamiento Recomendado",
      labelBudget: "Gasto Diario Estimado",
      labelNeighborhood: "Barrio Actual",
      tabItinerary: "Itinerario Día a Día",
      tabStays: "Alojamientos Recomendados",
      tabBudget: "Presupuesto y Costos",
      tabCustomize: "Modificar y Personalizar",
      tabPacking: "Lista de Equipaje",
      btnAdjustPace: "Ajustar Ritmo",
      btnPrint: "Imprimir / PDF",
      labelNeighborhoodCluster: "Agrupación Geográfica del Barrio",
      transitOptimizedSubtext: "Actividades agrupadas en 1.2 km para minimizar traslados familiares.",
      labelWeatherAdaptation: "Plan de Adaptación al Clima",
      customizePlanTitle: "Personalizar Este Día",
      customizePlanSubtitle: "Cambia actividades, sustituye restaurantes o consulta enlaces de reserva.",
      actionSwapActivity: "Cambiar Actividad",
      actionSwapActivityDesc: "Descubre atracciones alternativas en este barrio",
      actionChangeRestaurant: "Cambiar Restaurante",
      actionChangeRestaurantDesc: "Elige opciones locales, vegetarianas o aptas para niños",
      actionAdjustPace: "Ajustar Ritmo del Día",
      actionAdjustPaceDesc: "Elige entre relajado, equilibrado o intenso",
      actionBookingGuide: "Guía y Enlaces de Reserva",
      actionBookingGuideDesc: "Pases oficiales, tarjetas de transporte y reservas directas",
      staysHeaderTitle: "Lugares Recomendados para Hospedarse",
      staysHeaderSubtitle: "Alojamientos seleccionados según tamaño del grupo, edades y presupuesto.",
      filterBy: "Filtrar por:",
      filterAll: "Todas las recomendaciones",
      filterFamilySuites: "Suites Familiares",
      filterAccessible: "Accesible para sillas y carriolas",
      filterCentral: "Cerca del Transporte",
      budgetHeaderTitle: "Estimación de Costos y Presupuesto",
      budgetHeaderSubtitle: "Desglose claro de hotel, gastronomía local, entradas y transporte.",
      budgetTierLabel: "Nivel de Presupuesto:",
      totalEstTripCost: "Costo Total Estimado del Viaje",
      dailySpendAverage: "Gasto Promedio Diario",
      perPersonEstimate: "Estimado por Persona",
      budgetStatus: "Estado del Presupuesto",
      onTrack: "En Orden",
      includesAllExpenses: "Incluye alojamiento, comidas, transporte y entradas",
      perTravelerTotal: "Estimado integral por viajero",
      alignedWithTier: "Alineado con tu nivel de confort seleccionado",
      categoryBreakdownTitle: "Distribución por Categorías",
      catLodging: "Alojamiento",
      catDining: "Comida Local",
      catTickets: "Atracciones y Entradas",
      catTransit: "Transporte Local",
      dailyCostBreakdownTitle: "Desglose de Gasto Diario",
      thDay: "Día",
      thNeighborhood: "Zona / Barrio",
      thMeals: "Comidas y Gastronomía",
      thTickets: "Atracciones y Boletos",
      thTransit: "Transporte",
      thDailyTotal: "Total Diario",
      customizeHeaderTitle: "Estudio de Personalización TripCraft",
      customizeHeaderSubtitle: "Adapta el itinerario a la energía y preferencias de tu grupo.",
      paceControlTitle: "Ritmo y Frecuencia",
      paceControlSubtitle: "Ajusta la densidad de actividades para el bienestar de todos.",
      paceRelaxedName: "🌿 Relajado y sin prisas",
      paceRelaxedTag: "Familias y Mayores",
      paceRelaxedDesc: "Mañanas tardías, máximo 2 actividades diarias y descansos en cafés.",
      paceBalancedName: "⚖️ Equilibrado y Curado",
      paceBalancedTag: "Recomendado",
      paceBalancedDesc: "Exploración matutina y vespertina con tardes flexibles y cercanía.",
      pacePackedName: "⚡ Intenso y Dinámico",
      pacePackedTag: "Exploradores Activos",
      pacePackedDesc: "Comienzo temprano, 4-5 visitas principales y máxima aventura.",
      btnApplyPace: "Aplicar Ritmo al Itinerario",
      swapConsoleTitle: "Cambiar Actividades o Restaurantes",
      swapConsoleSubtitle: "Selecciona cualquier horario para ver alternativas en la misma zona.",
      labelTargetDay: "Seleccionar Día a Modificar",
      labelTimeSlot: "Horario a Cambiar",
      slotMorning: "Actividad Matutina",
      slotLunch: "Almuerzo y Comida Local",
      slotAfternoon: "Actividad de Tarde",
      slotEvening: "Paseo Nocturno y Cena",
      labelCuratedAlternates: "Alternativas Seleccionadas:",
      bookingGuidanceTitle: "Guía de Reserva Oficial",
      bookingGuidanceSubtitle: "Evita sobreprecios de intermediarios con enlaces oficiales.",
      packingHeaderTitle: "Equipaje Inteligente",
      packingHeaderSubtitle: "Lista adaptada al clima, edades del grupo y actividades.",
      packed: "Empacado",
      footerText: "Diseñando viajes personalizados y adaptados al clima en todo el mundo.",
      footerLangSupport: "Compatible con todos los idiomas • Enfoque familiar y accesible",
      modalNewTripTitle: "Planificar un Nuevo Viaje Personalizado",
      formLabelDestination: "Ciudad y País de Destino *",
      formLabelDuration: "Duración (Días) *",
      formSectionTravelers: "¿Quiénes viajan? (Cantidad y edades)",
      formLabelAdults: "Adultos (18-64 años)",
      formLabelChildren: "Niños / Jóvenes (0-17 años)",
      formLabelSeniors: "Adultos Mayores (65+ años)",
      formLabelTripType: "Tipo de Visita *",
      typeFamily: "Vacaciones Familiares (Apto para niños)",
      typeCulture: "Exploración Cultural e Historia",
      typeRelaxation: "Relajación y Naturaleza",
      typeCelebration: "Celebración y Luna de Miel",
      typeAdventure: "Aventura y Senderismo",
      formLabelBudgetPref: "Preferencia de Presupuesto *",
      budgetOptionEconomy: "Económico (Hostales, comida callejera, metro)",
      budgetOptionModerate: "Moderado / Confort (Hoteles familiares, buenos restaurantes)",
      budgetOptionLuxury: "Lujo / Premium (Hoteles 5 estrellas, alta cocina, traslados)",
      formLabelStartDate: "Fecha de Inicio",
      formLabelSpecialNotes: "Preferencias especiales / Accesibilidad",
      btnCancel: "Cancelar",
      btnGeneratePlan: "Generar Plan Completo",
      completed: "Completado",
      markCompleted: "Marcar Listo",
      btnSwap: "Cambiar",
      btnBook: "Info Reserva",
      btnSelectThis: "Elegir este",
      perNight: "/ noche",
      authLoginRegister: "Iniciar sesión / Registrarse",
      authTitle: "Bienvenido a TripCraft",
      authLogin: "Iniciar sesión",
      authRegister: "Registrarse",
      authEmail: "Correo electrónico",
      authPassword: "Contraseña",
      authName: "Nombre completo",
      destSearchPlaceholder: "Buscar ciudad o país…",
      destLoading: "Buscando destinos…",
      destNoResults: "No se encontraron destinos",
      destError: "No se pudieron cargar los destinos",
      destImageError: "No se pudo cargar la imagen del destino",
      destRetry: "Reintentar",
      weatherLoading: "Cargando clima…",
      weatherError: "Clima no disponible",
      weatherFeels: "Sensación",
      weatherClear: "Despejado",
      weatherMainlyClear: "Mayormente despejado",
      weatherPartlyCloudy: "Parcialmente nublado",
      weatherOvercast: "Nublado",
      weatherFog: "Niebla",
      weatherDrizzle: "Llovizna",
      weatherRain: "Lluvia",
      weatherHeavyRain: "Lluvia intensa",
      weatherShowers: "Chubascos",
      weatherHeavyShowers: "Chubascos fuertes",
      weatherSnow: "Nieve",
      weatherHeavySnow: "Nieve intensa",
      weatherSnowShowers: "Chubascos de nieve",
      weatherThunderstorm: "Tormenta eléctrica",
      weatherUnknown: "Desconocido"
    },
    fr: {
      tagline: "Planificateur de Voyage Personnel",
      selectTrip: "Sélectionner le Voyage",
      navNewTrip: "Nouveau Voyage",
      labelTravelers: "Voyageurs",
      labelStay: "Hébergement Recommandé",
      labelBudget: "Dépense Quotidienne Estimée",
      labelNeighborhood: "Quartier Actuel",
      tabItinerary: "Itinéraire Jour par Jour",
      tabStays: "Hébergements Recommandés",
      tabBudget: "Estimations & Budget",
      tabCustomize: "Modifier & Personnaliser",
      tabPacking: "Liste de Bagages",
      btnAdjustPace: "Ajuster le Rythme",
      btnPrint: "Imprimer / PDF",
      labelNeighborhoodCluster: "Regroupement Géographique du Quartier",
      transitOptimizedSubtext: "Activités regroupées à moins de 1,2 km pour limiter les trajets en famille.",
      labelWeatherAdaptation: "Plan d'Adaptation Météorologique",
      customizePlanTitle: "Personnaliser Cette Journée",
      customizePlanSubtitle: "Changez une activité, remplacez un restaurant ou consultez les liens de réservation.",
      actionSwapActivity: "Remplacer une Activité",
      actionSwapActivityDesc: "Consultez les alternatives dans le même quartier",
      actionChangeRestaurant: "Changer de Restaurant",
      actionChangeRestaurantDesc: "Choisissez un restaurant local adapté aux enfants ou végétarien",
      actionAdjustPace: "Ajuster le Rythme",
      actionAdjustPaceDesc: "Passez d'un rythme détendu à équilibré ou intense",
      actionBookingGuide: "Guide & Liens de Réservation",
      actionBookingGuideDesc: "Pass officiels, cartes de transport et réservations directes",
      staysHeaderTitle: "Hébergements Recommandés",
      staysHeaderSubtitle: "Logements adaptés à la taille de votre groupe, aux âges et au budget.",
      filterBy: "Filtrer par :",
      filterAll: "Toutes les recommandations",
      filterFamilySuites: "Suites Familiales",
      filterAccessible: "Poussettes & Fauteuils Roulants",
      filterCentral: "Proche des Transports",
      budgetHeaderTitle: "Estimations des Coûts & Budget",
      budgetHeaderSubtitle: "Détail clair des coûts d'hébergement, repas locaux, billets et transports.",
      budgetTierLabel: "Niveau de Budget :",
      totalEstTripCost: "Coût Total Estimé du Voyage",
      dailySpendAverage: "Dépense Moyenne Quotidienne",
      perPersonEstimate: "Estimation par Personne",
      budgetStatus: "Santé du Budget",
      onTrack: "En Bonne Voie",
      includesAllExpenses: "Comprend hébergement, repas, transports et billets",
      perTravelerTotal: "Estimation complète par voyageur",
      alignedWithTier: "Conforme à votre niveau de confort choisi",
      categoryBreakdownTitle: "Répartition par Catégorie",
      catLodging: "Hébergement",
      catDining: "Restauration Locale",
      catTickets: "Attractions & Visites",
      catTransit: "Transports Locaux",
      dailyCostBreakdownTitle: "Détail des Dépenses par Jour",
      thDay: "Jour",
      thNeighborhood: "Quartier",
      thMeals: "Repas & Spécialités",
      thTickets: "Attractions & Billets",
      thTransit: "Transports",
      thDailyTotal: "Total Journalier",
      customizeHeaderTitle: "Studio de Personnalisation TripCraft",
      customizeHeaderSubtitle: "Ajustez le voyage selon l'énergie de votre famille et vos envies.",
      paceControlTitle: "Rythme & Cadence Quotidienne",
      paceControlSubtitle: "Adaptez la densité des visites au bien-être de chacun.",
      paceRelaxedName: "🌿 Détendu & Serein",
      paceRelaxedTag: "Famille & Aînés",
      paceRelaxedDesc: "Matinées calmes, 2 visites par jour maximum et pauses gourmandes.",
      paceBalancedName: "⚖️ Équilibré & Soigné",
      paceBalancedTag: "Recommandé",
      paceBalancedDesc: "Exploration matin et après-midi avec soirées libres et visites proches.",
      pacePackedName: "⚡ Intense & Actif",
      pacePackedTag: "Explorateurs Énergiques",
      pacePackedDesc: "Départ matinal, 4 à 5 visites majeures par jour et découverte maximale.",
      btnApplyPace: "Appliquer le Rythme",
      swapConsoleTitle: "Remplacer Activités ou Restaurants",
      swapConsoleSubtitle: "Sélectionnez un créneau pour voir des alternatives immédiates dans le quartier.",
      labelTargetDay: "Sélectionner le Jour",
      labelTimeSlot: "Créneau à Remplacer",
      slotMorning: "Activité du Matin",
      slotLunch: "Déjeuner & Spécialités",
      slotAfternoon: "Activité de l'Après-midi",
      slotEvening: "Soirée & Dîner",
      labelCuratedAlternates: "Alternatives Recommandées :",
      bookingGuidanceTitle: "Conseils & Liens de Réservation Directe",
      bookingGuidanceSubtitle: "Évitez les surcoûts des intermédiaires avec les portails officiels.",
      packingHeaderTitle: "Préparation des Bagages Intelligente",
      packingHeaderSubtitle: "Liste adaptée à la météo, à l'âge des voyageurs et aux visites prévues.",
      packed: "Préparé",
      footerText: "Création de voyages personnalisés et adaptés à la météo dans le monde entier.",
      footerLangSupport: "Compatible avec toutes les langues • Axé sur la famille et l'accessibilité",
      modalNewTripTitle: "Créer un Nouveau Voyage Personnalisé",
      formLabelDestination: "Ville & Pays de Destination *",
      formLabelDuration: "Durée (Jours) *",
      formSectionTravelers: "Qui voyage ? (Composition du groupe & âges)",
      formLabelAdults: "Adultes (18-64 ans)",
      formLabelChildren: "Enfants / Ados (0-17 ans)",
      formLabelSeniors: "Seniors (65+ ans)",
      formLabelTripType: "Type de Séjour *",
      typeFamily: "Vacances en Famille (Adapté aux enfants)",
      typeCulture: "Découverte Culturelle & Histoire",
      typeRelaxation: "Détente, Paysages & Bien-être",
      typeCelebration: "Célébration & Voyage de Noces",
      typeAdventure: "Aventure & Randonnée",
      formLabelBudgetPref: "Préférence Budgétaire *",
      budgetOptionEconomy: "Économique (Auberges, cuisine de rue, métro)",
      budgetOptionModerate: "Modéré / Confort (Hôtels familiaux, bons restaurants)",
      budgetOptionLuxury: "Luxe / Prestige (Hôtels 5 étoiles, gastronomie, transferts)",
      formLabelStartDate: "Date de Début",
      formLabelSpecialNotes: "Préférences particulières / Accessibilité",
      btnCancel: "Annuler",
      btnGeneratePlan: "Générer le Plan Complet",
      completed: "Effectué",
      markCompleted: "Marquer comme fait",
      btnSwap: "Remplacer",
      btnBook: "Info Réservation",
      btnSelectThis: "Choisir cet élément",
      perNight: "/ nuit",
      authLoginRegister: "Connexion / Inscription",
      authTitle: "Bienvenue sur TripCraft",
      authLogin: "Connexion",
      authRegister: "Inscription",
      authEmail: "Adresse e-mail",
      authPassword: "Mot de passe",
      authName: "Nom complet",
      destSearchPlaceholder: "Rechercher une ville ou un pays…",
      destLoading: "Recherche de destinations…",
      destNoResults: "Aucune destination trouvée",
      destError: "Impossible de charger les destinations",
      destImageError: "Impossible de charger l'image de la destination",
      destRetry: "Réessayer",
      weatherLoading: "Chargement de la météo…",
      weatherError: "Météo indisponible",
      weatherFeels: "Ressenti",
      weatherClear: "Dégagé",
      weatherMainlyClear: "Plutôt dégagé",
      weatherPartlyCloudy: "Partiellement nuageux",
      weatherOvercast: "Couvert",
      weatherFog: "Brouillard",
      weatherDrizzle: "Bruine",
      weatherRain: "Pluie",
      weatherHeavyRain: "Pluie forte",
      weatherShowers: "Averses",
      weatherHeavyShowers: "Averses fortes",
      weatherSnow: "Neige",
      weatherHeavySnow: "Neige abondante",
      weatherSnowShowers: "Averses de neige",
      weatherThunderstorm: "Orage",
      weatherUnknown: "Inconnu"
    },
    ja: {
      tagline: "パーソナル旅行プランナー",
      selectTrip: "旅行を選択",
      navNewTrip: "新しい旅を計画",
      labelTravelers: "旅行者",
      labelStay: "おすすめの宿泊先",
      labelBudget: "1日の目安支出",
      labelNeighborhood: "現在のエリア",
      tabItinerary: "日別旅程表",
      tabStays: "おすすめ宿泊先",
      tabBudget: "予算と費用見積もり",
      tabCustomize: "プランの変更・調整",
      tabPacking: "持ち物チェックリスト",
      btnAdjustPace: "ペース調整",
      btnPrint: "印刷 / PDF",
      labelNeighborhoodCluster: "地域・エリアグループ",
      transitOptimizedSubtext: "徒歩や移動時間を最小限に抑えるため、半径1.2km以内で活動をまとめています。",
      labelWeatherAdaptation: "気候・天候適応プラン",
      customizePlanTitle: "この日のプランをカスタマイズ",
      customizePlanSubtitle: "観光スポットの入れ替え、食事場所の変更、ペース調整、直接予約案内を簡単に行えます。",
      actionSwapActivity: "アクティビティの入れ替え",
      actionSwapActivityDesc: "同じエリア内のおすすめ観光スポットから選択",
      actionChangeRestaurant: "食事処の変更",
      actionChangeRestaurantDesc: "お子様連れ、ベジタリアン、郷土料理店から選択",
      actionAdjustPace: "旅のペースを調整",
      actionAdjustPaceDesc: "ゆったり、バランス、アクティブから選択",
      actionBookingGuide: "公式予約案内＆リンク",
      actionBookingGuideDesc: "公式チケット、交通ICカード、直接予約サイト",
      staysHeaderTitle: "おすすめの宿泊施設",
      staysHeaderSubtitle: "人数、年齢層、バリアフリー対応、ご予算に合わせた厳選ホテルです。",
      filterBy: "絞り込み:",
      filterAll: "すべてのおすすめ",
      filterFamilySuites: "ファミリールーム",
      filterAccessible: "バリアフリー・ベビーカー対応",
      filterCentral: "駅近・交通至便",
      budgetHeaderTitle: "費用見積もりと予算計画",
      budgetHeaderSubtitle: "宿泊費、郷土料理、観光入場料、地域交通費の明確な内訳です。",
      budgetTierLabel: "予算ランク:",
      totalEstTripCost: "推定旅行総費用",
      dailySpendAverage: "1日の平均支出",
      perPersonEstimate: "1人あたりの見積もり",
      budgetStatus: "予算状況",
      onTrack: "順調（予算内）",
      includesAllExpenses: "宿泊・食事・交通・入場料を含む",
      perTravelerTotal: "旅行者1人あたりの総計目安",
      alignedWithTier: "選択された快適ランクに合致しています",
      categoryBreakdownTitle: "支出カテゴリ内訳",
      catLodging: "宿泊費",
      catDining: "郷土料理・食事",
      catTickets: "観光・入場料",
      catTransit: "地域交通費",
      dailyCostBreakdownTitle: "日別の費用内訳",
      thDay: "日程",
      thNeighborhood: "エリア",
      thMeals: "食事・ご当地グルメ",
      thTickets: "観光・体験",
      thTransit: "交通費",
      thDailyTotal: "日計",
      customizeHeaderTitle: "TripCraft カスタマイズスタジオ",
      customizeHeaderSubtitle: "旅行者の体力、食事の好み、旅行テンポに合わせて旅程を自在に調整できます。",
      paceControlTitle: "旅のペースとテンポ",
      paceControlSubtitle: "ご家族の体力や旅行スタイルに合わせて予定の密度を調整します。",
      paceRelaxedName: "🌿 ゆったり・のんびり",
      paceRelaxedTag: "ファミリー＆シニア向け",
      paceRelaxedDesc: "朝はゆっくり出発。1日最大2箇所の見学で、カフェ休憩を多めに取ります。",
      paceBalancedName: "⚖️ バランス重視",
      paceBalancedTag: "おすすめ",
      paceBalancedDesc: "午前と午後にバランスよく観光し、夜は自由度の高いスケジュールです。",
      pacePackedName: "⚡ アクティブ満喫",
      pacePackedTag: "アクティブ派向け",
      pacePackedDesc: "朝早くから夜まで、主要スポットを巡り尽くす充実の旅程です。",
      btnApplyPace: "ペースを旅程に適用",
      swapConsoleTitle: "観光地や飲食店の入れ替え",
      swapConsoleSubtitle: "変更したい時間帯を選ぶと、近隣の魅力的な代替案が提案されます。",
      labelTargetDay: "変更する日程を選択",
      labelTimeSlot: "変更する時間帯",
      slotMorning: "午前の観光",
      slotLunch: "昼食・ご当地グルメ",
      slotAfternoon: "午後の観光",
      slotEvening: "夜の観光＆夕食",
      labelCuratedAlternates: "おすすめの代替候補:",
      bookingGuidanceTitle: "公式予約案内＆リンク",
      bookingGuidanceSubtitle: "公式予約ポータルや交通パスを利用して、安心・お得に予約できます。",
      packingHeaderTitle: "スマート持ち物チェックリスト",
      packingHeaderSubtitle: "現地の天候、旅行者の年齢層、訪問先に合わせた安心リストです。",
      packed: "準備済み",
      footerText: "世界中の旅行者に寄り添う、天候適応型の旅行計画をデザインします。",
      footerLangSupport: "全言語対応 • ファミリー＆アクセシビリティ対応",
      modalNewTripTitle: "新しい旅行プランを作成",
      formLabelDestination: "旅行先の都市・国 *",
      formLabelDuration: "旅行日数 *",
      formSectionTravelers: "旅行者の人数と内訳（年齢層）",
      formLabelAdults: "大人 (18-64歳)",
      formLabelChildren: "子供・若者 (0-17歳)",
      formLabelSeniors: "シニア (65歳以上)",
      formLabelTripType: "旅行の目的 *",
      typeFamily: "家族旅行 (子供も楽しめるバランス型)",
      typeCulture: "歴史・文化探訪",
      typeRelaxation: "リゾート・温泉・癒やし",
      typeCelebration: "記念日・ハネムーン",
      typeAdventure: "自然体験・アクティビティ",
      formLabelBudgetPref: "予算設定 *",
      budgetOptionEconomy: "エコノミー（手頃な宿、ローカル食堂、公共交通）",
      budgetOptionModerate: "スタンダード・快適（快適ホテル、名物料理、周遊パス）",
      budgetOptionLuxury: "プレミアム・高級（高級ホテル、特別ディナー、専用車）",
      formLabelStartDate: "出発日",
      formLabelSpecialNotes: "特記事項 / バリアフリーのご要望",
      btnCancel: "キャンセル",
      btnGeneratePlan: "旅行プランを自動生成",
      completed: "完了",
      markCompleted: "完了にする",
      btnSwap: "変更する",
      btnBook: "予約案内",
      btnSelectThis: "これに変更",
      perNight: "/ 泊",
      authLoginRegister: "ログイン / 新規登録",
      authTitle: "TripCraftへようこそ",
      authLogin: "ログイン",
      authRegister: "新規登録",
      authEmail: "メールアドレス",
      authPassword: "パスワード",
      authName: "氏名",
      destSearchPlaceholder: "都市や国を検索…",
      destLoading: "目的地を検索中…",
      destNoResults: "目的地が見つかりません",
      destError: "目的地を読み込めませんでした",
      destImageError: "目的地の画像を読み込めませんでした",
      destRetry: "再試行",
      weatherLoading: "天気を読み込み中…",
      weatherError: "天気情報を取得できません",
      weatherFeels: "体感",
      weatherClear: "快晴",
      weatherMainlyClear: "晴れ",
      weatherPartlyCloudy: "晴れ時々曇り",
      weatherOvercast: "曇り",
      weatherFog: "霧",
      weatherDrizzle: "霧雨",
      weatherRain: "雨",
      weatherHeavyRain: "大雨",
      weatherShowers: "にわか雨",
      weatherHeavyShowers: "強いにわか雨",
      weatherSnow: "雪",
      weatherHeavySnow: "大雪",
      weatherSnowShowers: "にわか雪",
      weatherThunderstorm: "雷雨",
      weatherUnknown: "不明"
    },
    de: {
      tagline: "Persönlicher Reiseplaner",
      selectTrip: "Reise Auswählen",
      navNewTrip: "Neue Reise Planen",
      labelTravelers: "Reisende",
      labelStay: "Empfohlene Unterkunft",
      labelBudget: "Geschätzte Tagesausgaben",
      labelNeighborhood: "Aktueller Stadtteil",
      tabItinerary: "Tagesprogramm",
      tabStays: "Empfohlene Unterkünfte",
      tabBudget: "Kosten & Budget",
      tabCustomize: "Anpassen & Ändern",
      tabPacking: "Packliste",
      btnAdjustPace: "Tempo Anpassen",
      btnPrint: "Drucken / PDF",
      labelNeighborhoodCluster: "Geografischer Stadtteil-Cluster",
      transitOptimizedSubtext: "Aktivitäten im Umkreis von 1,2 km gebündelt, um Gehzeiten für Familien zu minimieren.",
      labelWeatherAdaptation: "Wetteranpassungsplan",
      customizePlanTitle: "Diesen Tag Anpassen",
      customizePlanSubtitle: "Tauschen Sie Aktivitäten oder Restaurants unkompliziert aus und erhalten Sie Buchungslinks.",
      actionSwapActivity: "Aktivität Tauschen",
      actionSwapActivityDesc: "Alternative Highlights im selben Viertel entdecken",
      actionChangeRestaurant: "Restaurant Ändern",
      actionChangeRestaurantDesc: "Lokale Lokale für Familien oder Vegetarier wählen",
      actionAdjustPace: "Tages-Tempo Ändern",
      actionAdjustPaceDesc: "Wählen Sie zwischen entspannt, ausgewogen und aktiv",
      actionBookingGuide: "Buchungshilfen & Links",
      actionBookingGuideDesc: "Offizielle Pässe, Nahverkehrskarten und Direktbuchungen",
      staysHeaderTitle: "Empfohlene Unterkünfte",
      staysHeaderSubtitle: "Ausgewählte Hotels passend zu Gruppengröße, Alter und Budget.",
      filterBy: "Filtern nach:",
      filterAll: "Alle Empfehlungen",
      filterFamilySuites: "Familiensuiten",
      filterAccessible: "Barrierefrei / Kinderwagen",
      filterCentral: "Verkehrsgünstig",
      budgetHeaderTitle: "Kostenschätzung & Budget",
      budgetHeaderSubtitle: "Transparente Kostenaufstellung für Hotel, Verpflegung, Eintritte und Nahverkehr.",
      budgetTierLabel: "Budget-Klasse:",
      totalEstTripCost: "Geschätzte Gesamtkosten",
      dailySpendAverage: "Durchschnittliche Tagesausgaben",
      perPersonEstimate: "Schätzung pro Person",
      budgetStatus: "Budget-Status",
      onTrack: "Im Budget",
      includesAllExpenses: "Inklusive Hotel, Essen, Nahverkehr und Eintrittskarten",
      perTravelerTotal: "Gesamtschätzung pro Reisenden",
      alignedWithTier: "Entspricht Ihrer gewählten Komfortklasse",
      categoryBreakdownTitle: "Ausgaben nach Kategorien",
      catLodging: "Unterkunft",
      catDining: "Lokale Küche",
      catTickets: "Attraktionen & Eintritte",
      catTransit: "Nahverkehr",
      dailyCostBreakdownTitle: "Tägliche Kostenaufstellung",
      thDay: "Tag",
      thNeighborhood: "Stadtviertel",
      thMeals: "Mahlzeiten & Spezialitäten",
      thTickets: "Sehenswürdigkeiten",
      thTransit: "Transport",
      thDailyTotal: "Tagessumme",
      customizeHeaderTitle: "TripCraft Studio für Anpassungen",
      customizeHeaderSubtitle: "Passen Sie die Reise flexibel an das Wohlbefinden Ihrer Reisegruppe an.",
      paceControlTitle: "Tages-Geschwindigkeit & Rhythmus",
      paceControlSubtitle: "Wählen Sie die Intensität für ein entspanntes Reiseerlebnis.",
      paceRelaxedName: "🌿 Entspannt & Gemütlich",
      paceRelaxedTag: "Familien & Senioren",
      paceRelaxedDesc: "Späterer Start, maximal 2 Programmpunkte pro Tag und viel Zeit für Cafés.",
      paceBalancedName: "⚖️ Ausgewogen & Kuratiert",
      paceBalancedTag: "Empfohlen",
      paceBalancedDesc: "Gute Balance zwischen Vormittags- und Nachmittagszielen mit kurzen Wegen.",
      pacePackedName: "⚡ Aktiv & Erlebnisreich",
      pacePackedTag: "Aktive Entdecker",
      pacePackedDesc: "Früher Start, 4-5 Höhepunkte täglich und maximale Entdeckungen.",
      btnApplyPace: "Tempo Übernehmen",
      swapConsoleTitle: "Aktivitäten oder Lokale Tauschen",
      swapConsoleSubtitle: "Wählen Sie ein Zeitfenster für sofortige Vorschläge im selben Viertel.",
      labelTargetDay: "Tag Auswählen",
      labelTimeSlot: "Zeitfenster zum Tauschen",
      slotMorning: "Vormittags-Aktivität",
      slotLunch: "Mittagessen & Lokale Küche",
      slotAfternoon: "Nachmittags-Aktivität",
      slotEvening: "Abendprogramm & Dinner",
      labelCuratedAlternates: "Empfohlene Alternativen:",
      bookingGuidanceTitle: "Offizielle Buchungsanleitungen",
      bookingGuidanceSubtitle: "Sparen Sie Zwischenhändler-Gebühren durch offizielle Portale.",
      packingHeaderTitle: "Intelligente Packliste",
      packingHeaderSubtitle: "Abgestimmt auf Wetter, Altersgruppen und geplante Aktivitäten.",
      packed: "Gepackt",
      footerText: "Personalisierte und wetterangepasste Reiseplanung weltweit.",
      footerLangSupport: "Kompatibel mit allen Sprachen • Fokus auf Familien & Barrierefreiheit",
      modalNewTripTitle: "Neue Reise Planen",
      formLabelDestination: "Zielstadt & Land *",
      formLabelDuration: "Dauer (Tage) *",
      formSectionTravelers: "Wer reist mit? (Personen & Altersgruppen)",
      formLabelAdults: "Erwachsene (18-64 J.)",
      formLabelChildren: "Kinder / Jugendliche (0-17 J.)",
      formLabelSeniors: "Senioren (65+ J.)",
      formLabelTripType: "Art der Reise *",
      typeFamily: "Familienurlaub (Kinderfreundlich & ausgewogen)",
      typeCulture: "Kultur & Geschichte",
      typeRelaxation: "Erholung & Natur",
      typeCelebration: "Feier & Flitterwochen",
      typeAdventure: "Abenteuer & Wandern",
      formLabelBudgetPref: "Budget-Präferenz *",
      budgetOptionEconomy: "Günstig (Einfache Hotels, Streetfood, ÖPNV)",
      budgetOptionModerate: "Mittel / Komfortabel (Familienhotels, gute Lokale)",
      budgetOptionLuxury: "Gehoben / Luxus (5-Sterne, Gourmetküche, Privattransfers)",
      formLabelStartDate: "Reisebeginn",
      formLabelSpecialNotes: "Besondere Wünsche / Barrierefreiheit",
      btnCancel: "Abbrechen",
      btnGeneratePlan: "Kompletten Reiseplan Erstellen",
      completed: "Erledigt",
      markCompleted: "Als erledigt markieren",
      btnSwap: "Tauschen",
      btnBook: "Buchungs-Info",
      btnSelectThis: "Auswählen",
      perNight: "/ Nacht",
      authLoginRegister: "Anmelden / Registrieren",
      authTitle: "Willkommen bei TripCraft",
      authLogin: "Anmelden",
      authRegister: "Registrieren",
      authEmail: "E-Mail-Adresse",
      authPassword: "Passwort",
      authName: "Vollständiger Name",
      destSearchPlaceholder: "Stadt oder Land suchen…",
      destLoading: "Reiseziele werden gesucht…",
      destNoResults: "Keine Reiseziele gefunden",
      destError: "Reiseziele konnten nicht geladen werden",
      destImageError: "Bild des Reiseziels konnte nicht geladen werden",
      destRetry: "Erneut versuchen",
      weatherLoading: "Wetter wird geladen…",
      weatherError: "Wetter nicht verfügbar",
      weatherFeels: "Gefühlt",
      weatherClear: "Klar",
      weatherMainlyClear: "Überwiegend klar",
      weatherPartlyCloudy: "Teilweise bewölkt",
      weatherOvercast: "Bedeckt",
      weatherFog: "Nebel",
      weatherDrizzle: "Nieselregen",
      weatherRain: "Regen",
      weatherHeavyRain: "Starkregen",
      weatherShowers: "Schauer",
      weatherHeavyShowers: "Starke Schauer",
      weatherSnow: "Schnee",
      weatherHeavySnow: "Starker Schneefall",
      weatherSnowShowers: "Schneeschauer",
      weatherThunderstorm: "Gewitter",
      weatherUnknown: "Unbekannt"
    }
  };

  let currentLang = localStorage.getItem('tripcraft_lang') || 'en';

  function t(key) {
    const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    return dict[key] || TRANSLATIONS.en[key] || key;
  }

  function applyLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('tripcraft_lang', lang);

    const htmlEl = document.documentElement;
    htmlEl.lang = lang;
    htmlEl.dir = (lang === 'ar') ? 'rtl' : 'ltr';

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key && t(key)) {
        el.textContent = t(key);
      }
    });

    const langSelect = document.getElementById('langSelect');
    if (langSelect) langSelect.value = lang;

    renderTripHero();
    renderItinerary();
    renderStays();
    renderBudget();
    renderCustomizeConsole();
    renderPacking();

    window.dispatchEvent(new CustomEvent('tripcraft:langChanged', { detail: { lang } }));
  }

  // ==========================================================================
  // 3. Preset Rich Trips Data Store
  // ==========================================================================
  const PRESET_TRIPS = [
    {
      id: 'trip-tokyo-family',
      destination: 'Tokyo, Japan',
      country: 'Japan',
      heroImage: 'assets/hero-tokyo.jpg',
      title: 'Tokyo Neon & Heritage',
      subtitle: 'A personalized voyage balancing vibrant pop-culture districts, historic Shinto shrines, and serene imperial gardens.',
      tripType: 'Family Vacation',
      durationDays: 5,
      travelers: {
        total: 4,
        adults: 2,
        children: 2,
        seniors: 0,
        summary: '4 Travelers (2 Adults, 2 Kids: Ages 8 & 11)'
      },
      budgetTier: 'moderate',
      weather: {
        temp: '23°C',
        condition: 'Clear & Mild',
        icon: '☀️',
        notes: 'Weather Optimized: Cooler morning temple visits, midday indoor science/ac activities, sunset river breezes.'
      },
      currentPace: 'balanced',
      stays: [
        {
          id: 'stay-mimaru-asakusa',
          name: 'MIMARU TOKYO Asakusa Station',
          type: 'Apartment Hotel',
          neighborhood: 'Asakusa & Sumida',
          image: 'assets/dest-tokyo.jpg',
          rating: '4.92',
          pricePerNight: 240,
          fitBanner: '✓ Fits 4 Guests (Family Suite with Japanese Bunk Beds & Kitchenette)',
          features: ['👶 Stroller-Friendly', '♿ Elevator & Level Entry', '👨‍👩‍👧 Family Kitchen', '📍 2-min Walk to Asakusa Station'],
          bookingUrl: 'https://mimaruhotels.com/en/hotel/asakusa-station/',
          description: 'Spacious Japanese apartment hotel tailor-made for families with separate living spaces, coin laundry, and immediate access to the Ginza line.'
        },
        {
          id: 'stay-keio-plaza',
          name: 'Keio Plaza Hotel Tokyo',
          type: 'Full-Service Hotel',
          neighborhood: 'Shinjuku',
          image: 'assets/dest-tokyo.jpg',
          rating: '4.85',
          pricePerNight: 290,
          fitBanner: '✓ Connected Twin Rooms with City Skyline Views',
          features: ['♿ Full Accessibility Rooms', '👨‍👩‍👧 High Chairs & Baby Cots', '🍽️ 10 In-House Restaurants', '📍 Direct Airport Limousine Bus'],
          bookingUrl: 'https://www.keioplaza.com/',
          description: 'Prestigious family-friendly hotel with bilingual concierge, nursing rooms, and dedicated children amenities.'
        },
        {
          id: 'stay-richmond-premier',
          name: 'Richmond Hotel Premier Asakusa',
          type: 'Comfort Modern',
          neighborhood: 'Asakusa',
          image: 'assets/dest-tokyo.jpg',
          rating: '4.78',
          pricePerNight: 195,
          fitBanner: '✓ Triple & Quad Rooms with Sensō-ji Views',
          features: ['👶 Stroller Rental Free', '♿ Barrier-Free Restrooms', '📍 Above Shopping & Dining Plaza'],
          bookingUrl: 'https://richmondhotel.jp/en/asakusa-international/',
          description: 'Convenient central base directly across from historic Nakamise, surrounded by peaceful pedestrian walking lanes.'
        }
      ],
      days: [
        {
          dayNumber: 1,
          dateLabel: 'Day 1',
          neighborhood: 'Asakusa, Sensō-ji & Sumida Riverfront',
          weatherPlan: '☀️ Cooler Morning: Outdoor Temple • 🏛️ Midday Peak Heat: Air-Conditioned Nakamise Arcade • 🌆 Sunset Breeze: River Promenade',
          morning: {
            dualName: '浅草寺 (Sensō-ji Historic Temple)',
            category: 'Heritage & Culture',
            time: '09:00 - 11:30',
            desc: 'Tokyo’s oldest Buddhist temple founded in 645 AD. Enter through the iconic Kaminarimon Gate with giant red lantern.',
            weatherBadge: '☀️ Cool Morning Outdoor',
            accessibility: ['👶 Stroller-Friendly', '♿ Step-Free Ramp at Main Hall', '👨‍👩‍👧 Great for Kids'],
            cost: 0,
            completed: false
          },
          lunch: {
            dualName: '大黒家 天麩羅 (Daikokuya Tempura)',
            category: 'Local Food Pick',
            time: '12:00 - 13:15',
            desc: 'Historic eatery founded in 1887 famed for rich, savory sesame-oil dipped tendon bowls over steaming rice.',
            weatherBadge: '❄️ Air-Conditioned Indoor Dining',
            accessibility: ['👨‍👩‍👧 Family-Friendly Seating', '🥢 Traditional Tatami & Chairs'],
            cost: 45,
            completed: false
          },
          afternoon: {
            dualName: '東京スカイツリー (Tokyo Skytree & Solamachi)',
            category: 'Sightseeing & Arcade',
            time: '14:00 - 17:00',
            desc: 'Towering observation deck with panoramic views across Greater Tokyo and Mount Fuji, coupled with a 300-store family arcade.',
            weatherBadge: '🏛️ Midday Indoor Air-Conditioned',
            accessibility: ['👶 Stroller Rental Available', '♿ Full Wheelchair Accessibility', '👨‍👩‍👧 Pokemon Center & Kids Zone'],
            cost: 65,
            completed: false
          },
          evening: {
            dualName: '隅田川遊歩道 (Sumida River Sunset Promenade & Dinner)',
            category: 'Scenic Walk & Local Eats',
            time: '18:00 - 20:30',
            desc: 'Breezy evening stroll along the lit bridges of Sumida River, followed by authentic Chousuke handmade udon.',
            weatherBadge: '🌆 Pleasant Evening Breeze',
            accessibility: ['👶 Smooth Paved Walkway', '♿ Wheelchair Ramps'],
            cost: 50,
            completed: false
          }
        },
        {
          dayNumber: 2,
          dateLabel: 'Day 2',
          neighborhood: 'Ueno Cultural Park & Akihabara Electric Town',
          weatherPlan: '☀️ Morning: Shaded Ueno Park Trees • 🏛️ Midday: Air-Conditioned Museum • 🌆 Evening: Neon Street Lighting',
          morning: {
            dualName: '上野恩賜公園 (Ueno Park & Toshogu Shrine)',
            category: 'Nature & Heritage',
            time: '09:30 - 11:45',
            desc: 'Sprawling public park with ancient shrines, Shinobazu lotus pond, and gentle shaded walking avenues.',
            weatherBadge: '🌳 Shaded Morning Trees',
            accessibility: ['👶 Stroller Accessible', '♿ Wide Flat Paths', '👨‍👩‍👧 Open Play Spaces'],
            cost: 0,
            completed: false
          },
          lunch: {
            dualName: 'とんかつ山家 (Tonkatsu Yamabe Ueno)',
            category: 'Local Food Pick',
            time: '12:15 - 13:30',
            desc: 'Beloved neighborhood kitchen serving golden, crispy breaded pork cutlets with unlimited cabbage and miso soup.',
            weatherBadge: '❄️ Indoor Air-Conditioned Dining',
            accessibility: ['👨‍👩‍👧 Hearty Portions', '🥢 High Value Family Pick'],
            cost: 38,
            completed: false
          },
          afternoon: {
            dualName: '国立科学博物館 (National Museum of Nature & Science)',
            category: 'Museum & Discovery',
            time: '14:00 - 16:45',
            desc: 'Fascinating interactive dinosaur skeletons, theater 360 projection dome, and physics experiment hall for kids.',
            weatherBadge: '🏛️ Midday Indoor Climate-Controlled',
            accessibility: ['👶 Nursing Rooms & Strollers', '♿ 100% Barrier-Free Elevators', '👨‍👩‍👧 Hands-on Discovery Zone'],
            cost: 24,
            completed: false
          },
          evening: {
            dualName: '秋葉原電気街 (Akihabara Tech & Retro Arcade)',
            category: 'Culture & Entertainment',
            time: '17:30 - 20:30',
            desc: 'Wander the vibrant multi-story arcade centers and retro gaming shops, dining on authentic charcoal yakitori.',
            weatherBadge: '🌆 Evening Vibrant Walk',
            accessibility: ['♿ Elevator access in large department stores', '👨‍👩‍👧 Fun for teens and gamers'],
            cost: 55,
            completed: false
          }
        },
        {
          dayNumber: 3,
          dateLabel: 'Day 3',
          neighborhood: 'Harajuku, Meiji Shrine & Shibuya Crossing',
          weatherPlan: '🌳 Morning: Forest Canopy of Meiji Shrine • 🏛️ Midday: Omotesando Indoor Boutiques • 🌆 Evening: Shibuya Sky',
          morning: {
            dualName: '明治神宮 (Meiji Jingu Sacred Forest Shrine)',
            category: 'Spiritual Heritage',
            time: '09:00 - 11:30',
            desc: 'Tranquil Shinto shrine nestled in an evergreen forest of 120,000 trees donated from all over Japan.',
            weatherBadge: '🌳 Cool Dense Forest Canopy',
            accessibility: ['👶 Compact Gravel Walks (Stroller-friendly main routes)', '♿ Accessible Restrooms', '👴 Relaxing for Seniors'],
            cost: 0,
            completed: false
          },
          lunch: {
            dualName: '牛かつ もと村 (Gyukatsu Motomura Harajuku)',
            category: 'Local Food Pick',
            time: '12:00 - 13:30',
            desc: 'Crispy breaded beef cutlet that guests finish sizzling on their personal tabletop stone grills.',
            weatherBadge: '❄️ Indoor Air-Conditioned',
            accessibility: ['👨‍👩‍👧 Engaging tabletop cooking', '🥢 Highly rated local specialty'],
            cost: 60,
            completed: false
          },
          afternoon: {
            dualName: '竹下通り & 表参道 (Takeshita Street & Omotesando Hills)',
            category: 'Pop Culture & Shopping',
            time: '14:00 - 17:00',
            desc: 'Vibrant youth fashion, colorful rainbow cotton candy, artisan crepe cafes, and architectural promenades.',
            weatherBadge: '🏛️ Shaded Avenues & Malls',
            accessibility: ['👶 Baby strollers welcome in Omotesando Hills', '♿ Elevators in all major stores'],
            cost: 35,
            completed: false
          },
          evening: {
            dualName: '渋谷スクランブル交差点 (Shibuya Crossing & Sky Rooftop)',
            category: 'Iconic Landmarks',
            time: '17:30 - 20:30',
            desc: 'The world’s busiest pedestrian crossing, followed by Shibuya Sky’s 360-degree sunset observation platform.',
            weatherBadge: '🌆 Sunset Golden Hour',
            accessibility: ['♿ Full ADA Wheelchair Lifts', '👨‍👩‍👧 High excitement for whole family'],
            cost: 55,
            completed: false
          }
        },
        {
          dayNumber: 4,
          dateLabel: 'Day 4',
          neighborhood: 'Odaiba Bay & Waterfront Entertainment',
          weatherPlan: '☀️ Morning: Monorail Scenic Views • 🏛️ Midday: TeamLab Immersive Art & Miraikan • 🌆 Evening: Rainbow Bridge Bay',
          morning: {
            dualName: '日本科学未来館 (Miraikan Science & Innovation)',
            category: 'Science & Robotics',
            time: '10:00 - 12:30',
            desc: 'Interactive robotics exhibits, humanoid ASIMO demonstrations, and the breathtaking floating Geo-Cosmos globe.',
            weatherBadge: '🏛️ Indoor High-Tech Experience',
            accessibility: ['👶 Strollers & Family Lounges', '♿ Universal Design & Tactile Guides', '👨‍👩‍👧 Top Kid Pick'],
            cost: 32,
            completed: false
          },
          lunch: {
            dualName: '月島もんじゃ (Tsukishima Monjayaki Waterfront)',
            category: 'Local Food Pick',
            time: '13:00 - 14:30',
            desc: 'Tokyo’s savory comfort pancake cooked right in front of you on a sizzling teppan griddle.',
            weatherBadge: '❄️ Indoor Waterfront Dining',
            accessibility: ['👨‍👩‍👧 Fun communal family dining experience'],
            cost: 50,
            completed: false
          },
          afternoon: {
            dualName: 'チームラボプラネッツ (teamLab Planets Immersive Art)',
            category: 'Digital Art Museum',
            time: '15:00 - 17:30',
            desc: 'Walk barefoot through water and immerse your senses in crystalline infinite flower mirrors.',
            weatherBadge: '🏛️ Indoor Sensory Oasis',
            accessibility: ['♿ Wheelchair loan options available on request', '👨‍👩‍👧 Unforgettable sensory fun for kids'],
            cost: 95,
            completed: false
          },
          evening: {
            dualName: 'お台場海浜公園 (Odaiba Seaside Park & Rainbow Bridge)',
            category: 'Seaside & Statue of Liberty',
            time: '18:00 - 20:30',
            desc: 'Watch the sunset over Tokyo Bay with views of the illuminated Rainbow Bridge and Tokyo Tower.',
            weatherBadge: '🌆 Cooling Sea Breeze',
            accessibility: ['👶 Smooth Boardwalk Paths', '♿ Wheelchair Accessible Seafront'],
            cost: 20,
            completed: false
          }
        },
        {
          dayNumber: 5,
          dateLabel: 'Day 5',
          neighborhood: 'Shinjuku & Imperial Palace Gardens',
          weatherPlan: '🌳 Morning: Royal Garden Shaded Lawn • 🏛️ Midday: Metropolitan Tower Views • 🌆 Evening: Omoide Yokocho',
          morning: {
            dualName: '新宿御苑 (Shinjuku Gyoen National Garden)',
            category: 'National Garden & Teahouse',
            time: '09:30 - 12:00',
            desc: '58 hectares of manicured traditional Japanese, English landscape, and French formal gardens.',
            weatherBadge: '🌳 Shaded Lawn & Greenhouses',
            accessibility: ['👶 Wide Paved Buggy Paths', '♿ Wheelchair Accessible Restrooms', '👴 Tranquil Resting Benches'],
            cost: 15,
            completed: false
          },
          lunch: {
            dualName: '新宿 つな八 (Shinjuku Tsunahachi Tempura)',
            category: 'Local Food Pick',
            time: '12:30 - 13:45',
            desc: 'Master tempura chefs frying seasonal fresh seafood and vegetables piece-by-piece in front of guests since 1923.',
            weatherBadge: '❄️ Indoor Air-Conditioned Comfort',
            accessibility: ['👨‍👩‍👧 Non-smoking environment', '🥢 Traditional English menu available'],
            cost: 65,
            completed: false
          },
          afternoon: {
            dualName: '東京都庁舎 (Tokyo Metropolitan Government Observatories)',
            category: 'City Views & Architecture',
            time: '14:30 - 16:30',
            desc: 'Free observation towers at 202 meters offering 360-degree vistas of Tokyo, Mount Fuji, and Tokyo Dome.',
            weatherBadge: '🏛️ Indoor Panoramic Observatories',
            accessibility: ['👶 Stroller Accessible High-Speed Elevators', '♿ Full Barrier-Free Access'],
            cost: 0,
            completed: false
          },
          evening: {
            dualName: '思い出横丁 & 新宿の夜 (Omoide Yokocho & Farewell Banquet)',
            category: 'Atmospheric Alleys & Dining',
            time: '17:30 - 20:30',
            desc: 'Historic lantern-lit alleyways with savory yakitori skewers and comforting ramen to celebrate the journey.',
            weatherBadge: '🌆 Evening Lantern Atmosphere',
            accessibility: ['🥢 Casual street vibes', '👨‍👩‍👧 Memorable family farewell dinner'],
            cost: 75,
            completed: false
          }
        }
      ],
      budgetBreakdown: {
        totalTripCost: 2450,
        dailyAverage: 490,
        perPersonTotal: 612.50,
        lodgingTotal: 1200,
        diningTotal: 620,
        ticketsTotal: 380,
        transitTotal: 250,
        lodgingPct: 49,
        diningPct: 25,
        ticketsPct: 16,
        transitPct: 10
      },
      bookingLinks: [
        {
          title: 'Tokyo Metro 72-Hour Tourist Pass',
          desc: 'Unlimited rides on all 13 Tokyo subway lines for ¥1,500 (~$10), saving up to 60% on daily family transit.',
          icon: '🚇',
          actionText: 'Official Metro Portal'
        },
        {
          title: 'teamLab Planets Official Ticket Portal',
          desc: 'Book designated time slots 4 weeks in advance directly to bypass scalpers and ensure guaranteed entry.',
          icon: '🎟️',
          actionText: 'Official teamLab Site'
        },
        {
          title: 'Welcome Suica IC Card for Tourists',
          desc: 'Tap-and-go contactless card for trains, buses, vending machines, and coin lockers across Japan with zero deposit.',
          icon: '💳',
          actionText: 'JR East Tourism Site'
        },
        {
          title: 'Tokyo Skytree Fast Pass',
          desc: 'Skip the standard ticket counter line directly to the 350m & 450m observation decks.',
          icon: '🗼',
          actionText: 'Official Skytree Portal'
        }
      ],
      packing: [
        {
          category: 'Essential Documents & Finance',
          icon: '🛂',
          items: [
            { text: 'Passports with 6+ months validity for all 4 travelers', checked: true },
            { text: 'Visit Japan Web QR codes generated for customs & immigration', checked: true },
            { text: 'Physical cash (¥30,000) for traditional street shrines & food stalls', checked: true },
            { text: 'No-foreign-transaction-fee credit / debit cards', checked: false }
          ]
        },
        {
          category: 'Weather & Walking Gear (23°C Mild)',
          icon: '👟',
          items: [
            { text: 'Ultra-comfortable broken-in walking shoes (10,000+ steps/day)', checked: true },
            { text: 'Light breathable layers & light evening cardigan/jacket', checked: true },
            { text: 'Compact UV umbrella / rain ponchos for kids', checked: false },
            { text: 'Reusable insulated water bottles', checked: false }
          ]
        },
        {
          category: 'Family & Tech Accessories',
          icon: '📱',
          items: [
            { text: 'Pocket Wi-Fi or eSims installed for constant navigation', checked: true },
            { text: 'Compact lightweight travel stroller for Asakusa & parks', checked: false },
            { text: 'High-capacity power bank (20,000 mAh) for phones', checked: true },
            { text: 'Type-A Japan plug adapters', checked: true }
          ]
        }
      ]
    },
    {
      id: 'trip-paris-romantic',
      destination: 'Paris, France',
      country: 'France',
      heroImage: 'assets/hero-paris.jpg',
      title: 'Paris Art, Culture & Romantic Heights',
      subtitle: 'A refined cultural journey wandering the historic Seine riverbanks, world-renowned impressionist galleries, and atmospheric bistros.',
      tripType: 'Celebration & Romance',
      durationDays: 4,
      travelers: {
        total: 2,
        adults: 2,
        children: 0,
        seniors: 0,
        summary: '2 Travelers (Couples Celebration)'
      },
      budgetTier: 'luxury',
      weather: {
        temp: '19°C',
        condition: 'Crisp Autumn Sunshine',
        icon: '⛅',
        notes: 'Weather Optimized: Crisp morning strolls in Luxembourg Gardens, afternoon Louvre gallery climate, golden hour Seine cruise.'
      },
      currentPace: 'balanced',
      stays: [
        {
          id: 'stay-relais-christine',
          name: 'Relais Christine',
          type: 'Boutique Luxury Mansion',
          neighborhood: 'Saint-Germain-des-Prés',
          image: 'assets/dest-paris.jpg',
          rating: '4.96',
          pricePerNight: 480,
          fitBanner: '✓ Romantic Deluxe Suite with Courtyard Garden View',
          features: ['♿ Elevator to all rooms', '🍷 Private Spa Guerlain', '🥐 Gourmet French Breakfast', '📍 3-min to Seine River'],
          bookingUrl: 'https://www.relais-christine.com/',
          description: 'A discreet 17th-century private mansion built over abbey remains, located in the heart of the artistic Latin Quarter.'
        },
        {
          id: 'stay-hotel-dame-des-arts',
          name: 'Hôtel Dame des Arts',
          type: 'Design Hotel',
          neighborhood: 'Latin Quarter',
          image: 'assets/dest-paris.jpg',
          rating: '4.88',
          pricePerNight: 350,
          fitBanner: '✓ Panoramic Eiffel Tower Balcony Room',
          features: ['🍸 360-Degree Rooftop Bar', '♿ Accessible Bathrooms', '📍 Steps from Saint-Michel Metro'],
          bookingUrl: 'https://www.damedesarts.com/',
          description: 'Contemporary Parisian luxury with custom woodwork, curated art pieces, and an extraordinary rooftop cocktail lounge.'
        }
      ],
      days: [
        {
          dayNumber: 1,
          dateLabel: 'Day 1',
          neighborhood: 'Île de la Cité & Saint-Germain',
          weatherPlan: '⛅ Morning: Gothic Cathedral & Sainte-Chapelle • 🏛️ Midday: Conciergerie • 🌆 Sunset: Pont Neuf River Walk',
          morning: {
            dualName: 'Cathédrale Notre-Dame & Sainte-Chapelle (Holy Chapel)',
            category: 'Gothic Heritage',
            time: '09:30 - 12:00',
            desc: 'Gaze at the 1,113 magnificent 13th-century stained-glass panels rising 15 meters high inside Sainte-Chapelle.',
            weatherBadge: '☀️ Mild Morning Light',
            accessibility: ['♿ Elevator to upper chapel', '👴 Guided audio headsets available'],
            cost: 32,
            completed: false
          },
          lunch: {
            dualName: 'Café de Flore (Historic Literary Bistro)',
            category: 'Local Food Pick',
            time: '12:30 - 14:00',
            desc: 'The iconic Saint-Germain café frequented by Sartre and Hemingway, serving hot croque-monsieur and artisanal chocolat chaud.',
            weatherBadge: '❄️ Terrace / Indoor Dining',
            accessibility: ['🍷 Authentic Parisian sidewalk terrace'],
            cost: 75,
            completed: false
          },
          afternoon: {
            dualName: 'Jardin du Luxembourg (Luxembourg Palace Gardens)',
            category: 'Royal Parks & Statues',
            time: '14:30 - 17:00',
            desc: 'Stroll around the famous Medici Fountain, shaded chestnut tree alleys, and watch vintage wooden sailboats on the grand basin.',
            weatherBadge: '🌳 Shaded Tree Allées',
            accessibility: ['👶 Smooth Gravel Paths', '♿ Wheelchair Accessible Gates', '👴 Ample Vintage Green Chairs'],
            cost: 0,
            completed: false
          },
          evening: {
            dualName: 'Croisière sur la Seine (Sunset Seine River Cruise)',
            category: 'Scenic Cruise & Champagne',
            time: '18:00 - 20:30',
            desc: 'Glide past the illuminated bridges, the Louvre, and the Musée d’Orsay with live classical music and champagne.',
            weatherBadge: '🌆 Golden Hour River Breeze',
            accessibility: ['♿ Ramp boarding at Pont Neuf', '🍷 Heated panoramic interior salons'],
            cost: 90,
            completed: false
          }
        },
        {
          dayNumber: 2,
          dateLabel: 'Day 2',
          neighborhood: 'The Grand Boulevards & Louvre Royal Palace',
          weatherPlan: '🏛️ Morning & Midday: Musée du Louvre Climate Galleries • 🌳 Sunset: Tuileries Promenade',
          morning: {
            dualName: 'Musée du Louvre (Masterpieces & Denon Wing)',
            category: 'World Heritage Museum',
            time: '09:00 - 12:30',
            desc: 'Encounter the Mona Lisa, the Winged Victory of Samothrace, and the Venus de Milo in the world’s greatest art palace.',
            weatherBadge: '🏛️ Indoor Climate-Controlled',
            accessibility: ['♿ Full Elevators & Priority Line Access', '👶 Free Stroller Loan Desk'],
            cost: 44,
            completed: false
          },
          lunch: {
            dualName: 'Le Soufflé (Traditional Haute Cuisine)',
            category: 'Local Food Pick',
            time: '13:00 - 14:30',
            desc: 'Refined restaurant dedicated to sweet and savory soufflés, from cheese and truffle to chocolate Grand Marnier.',
            weatherBadge: '❄️ Indoor Air-Conditioned Comfort',
            accessibility: ['🍷 Quiet romantic ambiance'],
            cost: 95,
            completed: false
          },
          afternoon: {
            dualName: 'Jardin des Tuileries & Palais Garnier (Paris Opera)',
            category: 'Architecture & Grandeur',
            time: '15:00 - 17:30',
            desc: 'Marvel at the phantom-inspiring gilded Grand Foyer, Italian auditorium, and Marc Chagall’s colorful ceiling at Opéra Garnier.',
            weatherBadge: '🏛️ Indoor Gilded Palace',
            accessibility: ['♿ Wheelchair lifts to grand salons'],
            cost: 38,
            completed: false
          },
          evening: {
            dualName: 'Dîner Romantique au Marais (Fine Dining in Le Marais)',
            category: 'Culinary Excellence',
            time: '19:00 - 21:30',
            desc: 'Intimate candlelit dining in a medieval vaulted cellar, savoring roasted duck magret and vintage Bordeaux wines.',
            weatherBadge: '🌆 Cozy Evening Dining',
            accessibility: ['🍷 Reservation secured in advance'],
            cost: 160,
            completed: false
          }
        }
      ],
      budgetBreakdown: {
        totalTripCost: 3200,
        dailyAverage: 800,
        perPersonTotal: 1600,
        lodgingTotal: 1920,
        diningTotal: 840,
        ticketsTotal: 260,
        transitTotal: 180,
        lodgingPct: 60,
        diningPct: 26,
        ticketsPct: 8,
        transitPct: 6
      },
      bookingLinks: [
        {
          title: 'Official Louvre Museum Reserved Time Slots',
          desc: 'Skip general security lines with timed entry reservations required for all visitors.',
          icon: '🏛️',
          actionText: 'Louvre Official Portal'
        },
        {
          title: 'Paris Museum Pass (48 / 96 Hours)',
          desc: 'Free direct entry to 50+ national monuments and museums with zero queueing.',
          icon: '🎟️',
          actionText: 'Official Pass Site'
        }
      ],
      packing: [
        {
          category: 'Formal & Casual Parisian Wear',
          icon: '👗',
          items: [
            { text: 'Smart-casual evening dinner attire (jackets & dresses)', checked: true },
            { text: 'Leather walking boots / comfortable loafers', checked: true },
            { text: 'Wool trench coat or lightweight overcoat for autumn', checked: true }
          ]
        },
        {
          category: 'Travel Documents & Reservations',
          icon: '🎟️',
          items: [
            { text: 'Pre-printed museum & opera tickets', checked: true },
            { text: 'Passports & travel insurance cards', checked: true }
          ]
        }
      ]
    }
  ];

  // Active state
  let currentTripIndex = 0;
  let activeDayIndex = 0;
  let activeStayFilter = 'all';

  function getCurrentTrip() {
    return PRESET_TRIPS[currentTripIndex] || PRESET_TRIPS[0];
  }

  // ==========================================================================
  // 4a. Live Weather Refresh (fetches current weather for the selected trip)
  // ==========================================================================
    async function refreshHeroWeather(trip) {
    if (!trip) return;

    const lat = trip.destinationMeta?.lat;
    const lng = trip.destinationMeta?.lng;

    if (typeof lat !== 'number' || typeof lng !== 'number') return;
    if (!window.DestinationService?.fetchWeather) return;

    try {
      const weather = await window.DestinationService.fetchWeather({ lat, lng });
      if (!weather) return;

      const heroWeatherIcon     = document.getElementById('heroWeatherIcon');
      const heroWeatherTemp     = document.getElementById('heroWeatherTemp');
      const heroWeatherCond     = document.getElementById('heroWeatherCond');
      const heroWeatherFeels    = document.getElementById('heroWeatherFeels');
      const heroWeatherHumidity = document.getElementById('heroWeatherHumidity');
      const heroWeatherWind     = document.getElementById('heroWeatherWind');

      const conditionKey = weather.icon?.key || 'weatherUnknown';
      const condition    = t(conditionKey) || conditionKey;

      if (heroWeatherIcon)     heroWeatherIcon.textContent     = weather.icon?.icon || '☀️';
      if (heroWeatherTemp)     heroWeatherTemp.textContent     = `${weather.temperature}°${weather.unit}`;
      if (heroWeatherCond)     heroWeatherCond.textContent     = condition;
      if (heroWeatherFeels)    heroWeatherFeels.textContent    = `${t('weatherFeels')} ${weather.feelsLike}°`;
      if (heroWeatherHumidity) heroWeatherHumidity.textContent = `💧 ${weather.humidity}%`;
      if (heroWeatherWind)     heroWeatherWind.textContent     = `💨 ${weather.windSpeed} ${weather.windUnit}`;

    } catch (err) {
      console.warn('[app] Hero weather refresh failed:', err.message);
    }
  }

  // ==========================================================================
  // 4. UI Rendering Functions
  // ==========================================================================
  function renderTripHero() {
    const trip = getCurrentTrip();
    if (!trip) return;

    const heroBackdrop = document.getElementById('heroBackdrop');
    if (heroBackdrop && trip.heroImage) {
      heroBackdrop.style.backgroundImage = `url('${trip.heroImage}')`;
    }

    const heroTripType = document.getElementById('heroTripType');
    if (heroTripType) heroTripType.textContent = trip.tripType;

    const heroDuration = document.getElementById('heroDuration');
    if (heroDuration) heroDuration.textContent = `${trip.durationDays} ${trip.durationDays === 1 ? 'Day' : 'Days'}`;

        // Populate hero weather widget with static fallback data
    const heroWeatherIcon     = document.getElementById('heroWeatherIcon');
    const heroWeatherTemp     = document.getElementById('heroWeatherTemp');
    const heroWeatherCond     = document.getElementById('heroWeatherCond');
    const heroWeatherFeels    = document.getElementById('heroWeatherFeels');
    const heroWeatherHumidity = document.getElementById('heroWeatherHumidity');
    const heroWeatherWind     = document.getElementById('heroWeatherWind');

    if (heroWeatherIcon)     heroWeatherIcon.textContent     = trip.weather?.icon || '☀️';
    if (heroWeatherTemp)     heroWeatherTemp.textContent     = trip.weather?.temp || '—';
    if (heroWeatherCond) {
      const conditionKey = trip.weather?.condition || '';
      heroWeatherCond.textContent = conditionKey ? (t(conditionKey) || conditionKey) : '—';
    }
    // These will be replaced by live data if coordinates exist
    if (heroWeatherFeels)    heroWeatherFeels.textContent    = trip.weather?.feelsLike ? `${t('weatherFeels')} ${trip.weather.feelsLike}°` : '';
    if (heroWeatherHumidity) heroWeatherHumidity.textContent = trip.weather?.humidity ? `💧 ${trip.weather.humidity}%` : '';
    if (heroWeatherWind)     heroWeatherWind.textContent     = trip.weather?.windSpeed ? `💨 ${trip.weather.windSpeed} ${trip.weather.windUnit || 'km/h'}` : '';

    const heroTitle = document.getElementById('heroTitle');
    if (heroTitle) heroTitle.textContent = trip.title;

    const heroSubtitle = document.getElementById('heroSubtitle');
    if (heroSubtitle) heroSubtitle.textContent = trip.subtitle;

    const metricTravelers = document.getElementById('metricTravelers');
    if (metricTravelers) metricTravelers.textContent = trip.travelers?.summary || '';

    const metricStay = document.getElementById('metricStay');
    if (metricStay && trip.stays && trip.stays.length > 0) metricStay.textContent = trip.stays[0].name;

    const metricDailySpend = document.getElementById('metricDailySpend');
    if (metricDailySpend && trip.budgetBreakdown) {
      metricDailySpend.textContent = `${formatMoney(trip.budgetBreakdown.dailyAverage)} / day`;
    }

    const metricNeighborhood = document.getElementById('metricNeighborhood');
    if (metricNeighborhood) {
      if (trip.days && trip.days[activeDayIndex]) {
        metricNeighborhood.textContent = trip.days[activeDayIndex].neighborhood.split(',')[0];
      } else {
        metricNeighborhood.textContent = '—';
      }
    }

        const tripSelect = document.getElementById('tripSelect');
    if (tripSelect) {
      tripSelect.innerHTML = '';
      PRESET_TRIPS.forEach((tr, idx) => {
        const opt = document.createElement('option');
        opt.value = idx;
        opt.textContent = `${tr.destination} (${tr.durationDays} Days)`;
        if (idx === currentTripIndex) opt.selected = true;
        tripSelect.appendChild(opt);
      });
    }

    // Kick off a live weather refresh (non-blocking)
    refreshHeroWeather(trip);
  }

  function renderItinerary() {
    const trip = getCurrentTrip();
    if (!trip || !trip.days || trip.days.length === 0) {
      const pills = document.getElementById('dayPillsContainer');
      if (pills) pills.innerHTML = '<div style="padding:1rem;color:var(--text-tertiary);font-size:0.85rem;">Loading days…</div>';
      const container = document.getElementById('timelineCardsContainer');
      if (container) container.innerHTML = '';
      return;
    }

    if (activeDayIndex >= trip.days.length) activeDayIndex = 0;
    const day = trip.days[activeDayIndex];

    const dayPillsContainer = document.getElementById('dayPillsContainer');
    if (dayPillsContainer) {
      dayPillsContainer.innerHTML = '';
      trip.days.forEach((d, idx) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `day-pill-btn ${idx === activeDayIndex ? 'active' : ''}`;
        btn.innerHTML = `
          <span class="pill-day-label">${t('thDay')} ${d.dayNumber}</span>
          <span class="pill-day-title">${(d.neighborhood || '').split(',')[0]}</span>
        `;
        // FIX: guard against clicking a day index that doesn't exist
        btn.addEventListener('click', () => {
          if (!trip.days || !trip.days[idx]) return;
          activeDayIndex = idx;
          renderItinerary();
          renderTripHero();
        });
        dayPillsContainer.appendChild(btn);
      });
    }

    const dayNeighborhoodText = document.getElementById('dayNeighborhoodText');
    if (dayNeighborhoodText) dayNeighborhoodText.textContent = day.neighborhood;

    const dayWeatherAdaptationText = document.getElementById('dayWeatherAdaptationText');
    if (dayWeatherAdaptationText) dayWeatherAdaptationText.textContent = day.weatherPlan;

    const container = document.getElementById('timelineCardsContainer');
    if (!container) return;
    container.innerHTML = '';

    const slots = [
      { phase: 'morning', phaseName: t('slotMorning'), slotData: day.morning, time: day.morning?.time },
      { phase: 'lunch', phaseName: t('slotLunch'), slotData: day.lunch, time: day.lunch?.time },
      { phase: 'afternoon', phaseName: t('slotAfternoon'), slotData: day.afternoon, time: day.afternoon?.time },
      { phase: 'evening', phaseName: t('slotEvening'), slotData: day.evening, time: day.evening?.time }
    ];

    slots.forEach(s => {
      if (!s.slotData) return;
      const card = document.createElement('div');
      card.className = `timeline-slot-card ${s.slotData.completed ? 'completed' : ''}`;

      let localName = '';
      let englishName = s.slotData.dualName || '';
      if (englishName.includes('(')) {
        const parts = englishName.split('(');
        localName = parts[0].trim();
        englishName = parts[1].replace(')', '').trim();
      }

      const flagsHtml = `
        ${s.slotData.weatherBadge ? `<span class="flag-chip weather-chip">${s.slotData.weatherBadge}</span>` : ''}
        ${(s.slotData.accessibility || []).map(acc => `<span class="flag-chip family-chip">${acc}</span>`).join('')}
        <span class="flag-chip cost-chip">💵 ${formatMoney(s.slotData.cost || 0)}</span>
      `;

      card.innerHTML = `
        <div class="slot-time-column">
          <span class="slot-phase-pill phase-${s.phase}">${s.phaseName}</span>
          <span class="slot-time-range">${s.time || ''}</span>
        </div>
        <div class="slot-content-column">
          <div class="slot-top-row">
            <div class="slot-name-group">
              <h4 class="dual-name-title">
                ${localName ? `<span class="local-script-name">${localName}</span>` : ''}
                <span class="english-trans-name">${englishName}</span>
              </h4>
            </div>
            <span class="slot-category-badge">${s.slotData.category || ''}</span>
          </div>
          <p class="slot-description">${s.slotData.desc || ''}</p>
          <div class="slot-flags-row">${flagsHtml}</div>
          <div class="slot-actions-bar">
            <label class="completion-check-label">
              <input type="checkbox" class="completion-checkbox" ${s.slotData.completed ? 'checked' : ''}>
              <span>${s.slotData.completed ? t('completed') : t('markCompleted')}</span>
            </label>
            <div class="slot-btn-group">
              <button type="button" class="btn btn-secondary btn-sm btn-swap-slot" data-slot="${s.phase}">
                🔄 ${t('btnSwap')}
              </button>
              <button type="button" class="btn btn-secondary btn-sm btn-guidance-slot">
                🎟️ ${t('btnBook')}
              </button>
            </div>
          </div>
        </div>
      `;

      const chk = card.querySelector('.completion-checkbox');
      chk.addEventListener('change', (e) => {
        s.slotData.completed = e.target.checked;
        card.classList.toggle('completed', e.target.checked);
        const labelSpan = card.querySelector('.completion-check-label span');
        if (labelSpan) labelSpan.textContent = e.target.checked ? t('completed') : t('markCompleted');
        showToast(e.target.checked ? `✓ Marked "${englishName}" as completed` : `Reopened "${englishName}"`);
      });

      const swapBtn = card.querySelector('.btn-swap-slot');
      swapBtn.addEventListener('click', () => {
        switchTab('customize');
        const swapDaySelect = document.getElementById('swapDaySelect');
        const swapSlotSelect = document.getElementById('swapSlotSelect');
        if (swapDaySelect) swapDaySelect.value = activeDayIndex;
        if (swapSlotSelect) swapSlotSelect.value = s.phase;
        renderSwapAlternates(activeDayIndex, s.phase);
      });

      const guideBtn = card.querySelector('.btn-guidance-slot');
      guideBtn.addEventListener('click', () => {
        switchTab('customize');
        const bookSec = document.querySelector('.booking-guidance-section');
        if (bookSec) bookSec.scrollIntoView({ behavior: 'smooth' });
      });

      container.appendChild(card);
    });
  }

  function renderStays() {
    const trip = getCurrentTrip();
    const container = document.getElementById('staysContainer');
    if (!container) return;
    container.innerHTML = '';

    let stays = trip.stays || [];
    if (activeStayFilter === 'family') {
      stays = stays.filter(s => (s.fitBanner || '').toLowerCase().includes('family') || s.features?.some(f => f.includes('Family')));
    } else if (activeStayFilter === 'accessible') {
      stays = stays.filter(s => s.features?.some(f => f.includes('Wheelchair') || f.includes('Elevator') || f.includes('Stroller')));
    } else if (activeStayFilter === 'central') {
      stays = stays.filter(s => s.features?.some(f => f.includes('Station') || f.includes('Transit')));
    }

    stays.forEach(stay => {
      const card = document.createElement('div');
      card.className = 'stay-card';
      card.innerHTML = `
        <div class="stay-image-wrap">
          <img src="${stay.image}" alt="${stay.name}" loading="lazy">
          <span class="stay-badge-overlay badge badge-primary">${stay.neighborhood}</span>
          <span class="stay-rating-overlay">★ ${stay.rating}</span>
        </div>
        <div class="stay-body">
          <div class="stay-header-row">
            <h3 class="stay-title">${stay.name}</h3>
            <div class="stay-rate">${formatMoney(stay.pricePerNight)}<span class="stay-rate-sub"> ${t('perNight')}</span></div>
          </div>
          <div class="stay-fit-banner">${stay.fitBanner}</div>
          <p class="stay-desc">${stay.description}</p>
          <div class="stay-features-list">
            ${(stay.features || []).map(f => `<span class="flag-chip access-chip">${f}</span>`).join('')}
          </div>
          <a href="${stay.bookingUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-block">
            <span>Official Booking & Rates</span>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </a>
        </div>
      `;
      container.appendChild(card);
    });
  }

  function renderBudget() {
    const trip = getCurrentTrip();
    const b = trip.budgetBreakdown || {};

    const budgetTotalCost = document.getElementById('budgetTotalCost');
    if (budgetTotalCost) budgetTotalCost.textContent = formatMoney(b.totalTripCost || 0);

    const budgetTotalCaption = document.getElementById('budgetTotalCaption');
    if (budgetTotalCaption) {
      budgetTotalCaption.textContent = `For ${trip.travelers?.total || 0} travelers over ${trip.durationDays || 0} days`;
    }

    const budgetDailyAvg = document.getElementById('budgetDailyAvg');
    if (budgetDailyAvg) budgetDailyAvg.textContent = formatMoney(b.dailyAverage || 0);

    const budgetPerPerson = document.getElementById('budgetPerPerson');
    if (budgetPerPerson) budgetPerPerson.textContent = formatMoney(b.perPersonTotal || 0);

    const costLodgingPct = document.getElementById('costLodgingPct');
    if (costLodgingPct) costLodgingPct.textContent = `${b.lodgingPct || 0}%`;

    const costDiningPct = document.getElementById('costDiningPct');
    if (costDiningPct) costDiningPct.textContent = `${b.diningPct || 0}%`;

    const costTicketsPct = document.getElementById('costTicketsPct');
    if (costTicketsPct) costTicketsPct.textContent = `${b.ticketsPct || 0}%`;

    const costTransitPct = document.getElementById('costTransitPct');
    if (costTransitPct) costTransitPct.textContent = `${b.transitPct || 0}%`;

    const budgetProgressBar = document.getElementById('budgetProgressBar');
    if (budgetProgressBar) {
      budgetProgressBar.innerHTML = `
        <div class="seg seg-lodging" style="width: ${b.lodgingPct || 0}%;" title="${t('catLodging')}: ${b.lodgingPct || 0}%"></div>
        <div class="seg seg-dining" style="width: ${b.diningPct || 0}%;" title="${t('catDining')}: ${b.diningPct || 0}%"></div>
        <div class="seg seg-tickets" style="width: ${b.ticketsPct || 0}%;" title="${t('catTickets')}: ${b.ticketsPct || 0}%"></div>
        <div class="seg seg-transit" style="width: ${b.transitPct || 0}%;" title="${t('catTransit')}: ${b.transitPct || 0}%"></div>
      `;
    }

    const tableBody = document.getElementById('dailyCostTableBody');
    if (tableBody) {
      tableBody.innerHTML = '';
      (trip.days || []).forEach(d => {
        const mealsCost = (d.lunch?.cost || 0) + 35;
        const ticketsCost = (d.morning?.cost || 0) + (d.afternoon?.cost || 0);
        const transitCost = 15;
        const dailyTotal = mealsCost + ticketsCost + transitCost;

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${t('thDay')} ${d.dayNumber}</strong></td>
          <td>${(d.neighborhood || '').split(',')[0]}</td>
          <td>${formatMoney(mealsCost)}</td>
          <td>${formatMoney(ticketsCost)}</td>
          <td>${formatMoney(transitCost)}</td>
          <td><strong>${formatMoney(dailyTotal)}</strong></td>
        `;
        tableBody.appendChild(tr);
      });
    }
  }

  function renderCustomizeConsole() {
    const trip = getCurrentTrip();

    const swapDaySelect = document.getElementById('swapDaySelect');
    if (swapDaySelect) {
      swapDaySelect.innerHTML = '';
      (trip.days || []).forEach((d, idx) => {
        const opt = document.createElement('option');
        opt.value = idx;
        opt.textContent = `${t('thDay')} ${d.dayNumber} — ${(d.neighborhood || '').split(',')[0]}`;
        if (idx === activeDayIndex) opt.selected = true;
        swapDaySelect.appendChild(opt);
      });
    }

    const swapSlotSelect = document.getElementById('swapSlotSelect');
    const slot = swapSlotSelect ? swapSlotSelect.value : 'morning';
    renderSwapAlternates(activeDayIndex, slot);

    const bookingLinksGrid = document.getElementById('bookingLinksGrid');
    if (bookingLinksGrid) {
      bookingLinksGrid.innerHTML = '';
      (trip.bookingLinks || []).forEach(link => {
        const card = document.createElement('div');
        card.className = 'booking-link-card';
        card.innerHTML = `
          <div class="booking-icon">${link.icon}</div>
          <div class="booking-info">
            <h4>${link.title}</h4>
            <p>${link.desc}</p>
            <span class="booking-link-action">${link.actionText} →</span>
          </div>
        `;
        card.addEventListener('click', () => {
          showToast(`Opening guidance for: ${link.title}`);
        });
        bookingLinksGrid.appendChild(card);
      });
    }
  }

  const ALTERNATES_CATALOG = {
    morning: [
      {
        dualName: '築地場外市場 (Tsukiji Outer Market Tasting Tour)',
        category: 'Culinary Heritage',
        desc: 'Taste fresh tamagoyaki, strawberry daifuku mochi, and artisanal green tea from morning market stalls.',
        cost: 25,
        weatherBadge: '☀️ Covered Morning Walkway'
      },
      {
        dualName: '浜離宮恩賜庭園 (Hamarikyu Traditional Gardens)',
        category: 'Imperial Nature',
        desc: 'Stroll around a tranquil tidal pond with traditional matcha tea service in the central floating pavilion.',
        cost: 15,
        weatherBadge: '🌳 Shaded Scenic Garden'
      }
    ],
    lunch: [
      {
        dualName: '一蘭 浅草店 (Ichiran Ramen Individual Booths)',
        category: 'Family-Favorite Tonkotsu',
        desc: 'World-famous rich tonkotsu broth with custom flavor ordering sheets in English, perfect for kids & solo diners.',
        cost: 32,
        weatherBadge: '❄️ Air-Conditioned Comfort'
      },
      {
        dualName: '玄品 ふぐ & 和食 (Guenpin Washoku Seasonal Set)',
        category: 'Traditional Japanese Washoku',
        desc: 'Relaxed private dining rooms serving fresh seasonal sashimi, tempura, and simmered black wagyu beef.',
        cost: 60,
        weatherBadge: '❄️ Quiet Private Dining'
      }
    ],
    afternoon: [
      {
        dualName: '江戸東京博物館 (Edo-Tokyo Cultural Museum & Crafts)',
        category: 'Living History',
        desc: 'Walk across a life-size replica of Nihonbashi bridge and explore historic Edo merchant districts.',
        cost: 20,
        weatherBadge: '🏛️ Indoor Air-Conditioned Museum'
      },
      {
        dualName: '隅田水族館 (Sumida Aquarium & Penguins)',
        category: 'Aquatic Life & Nursery',
        desc: 'Modern indoor aquarium inside Tokyo Solamachi featuring Magellanic penguins and glowing jellyfish tanks.',
        cost: 45,
        weatherBadge: '🏛️ Modern Indoor Oasis'
      }
    ],
    evening: [
      {
        dualName: '屋形船 ナイトクルーズ (Yakatabune Traditional Houseboat Dinner)',
        category: 'Dinner Cruise Experience',
        desc: 'Glide under lantern-lit bridges enjoying unlimited freshly fried tempura and panoramic night views.',
        cost: 110,
        weatherBadge: '🌆 River Evening Panorama'
      },
      {
        dualName: '浅草ホッピー通り (Hoppy Street Lantern Alleys)',
        category: 'Retro Izakaya & Stew',
        desc: 'Open-air lively alley with family-run taverns famous for slow-simmered beef tendon stew (gyusuji nikomi).',
        cost: 40,
        weatherBadge: '🌆 Outdoor Lantern Atmosphere'
      }
    ]
  };

  function renderSwapAlternates(dayIdx, slot) {
    const container = document.getElementById('swapAlternatesContainer');
    if (!container) return;
    container.innerHTML = '';

    const alternates = ALTERNATES_CATALOG[slot] || ALTERNATES_CATALOG.morning;
    alternates.forEach(alt => {
      const item = document.createElement('div');
      item.className = 'alternate-item-card';
      item.innerHTML = `
        <div class="alternate-info">
          <strong>${alt.dualName}</strong>
          <span>${alt.category} • ${alt.weatherBadge} • 💵 ${formatMoney(alt.cost)}</span>
        </div>
        <button type="button" class="btn btn-primary btn-sm btn-select-alt">
          ${t('btnSelectThis')}
        </button>
      `;

      item.querySelector('.btn-select-alt').addEventListener('click', () => {
        const trip = getCurrentTrip();
        if (trip.days && trip.days[dayIdx]) {
          trip.days[dayIdx][slot] = {
            dualName: alt.dualName,
            category: alt.category,
            time: trip.days[dayIdx][slot]?.time || '14:00 - 16:30',
            desc: alt.desc,
            weatherBadge: alt.weatherBadge,
            accessibility: ['👶 Stroller-Friendly', '♿ Accessible'],
            cost: alt.cost,
            completed: false
          };
          renderItinerary();
          showToast(`✓ Swapped into Day ${trip.days[dayIdx].dayNumber} (${slot}): ${alt.dualName}`);
        }
      });

      container.appendChild(item);
    });
  }

  function renderPacking() {
    const trip = getCurrentTrip();
    const container = document.getElementById('packingCardsGrid');
    if (!container) return;
    container.innerHTML = '';

    (trip.packing || []).forEach(cat => {
      const card = document.createElement('div');
      card.className = 'packing-category-card';

      const itemsHtml = cat.items.map((item, idx) => `
        <label class="packing-item-row ${item.checked ? 'checked' : ''}" data-cat="${cat.category}" data-idx="${idx}">
          <input type="checkbox" class="packing-checkbox" ${item.checked ? 'checked' : ''}>
          <span class="packing-item-label">${item.text}</span>
        </label>
      `).join('');

      card.innerHTML = `
        <div class="packing-category-header">
          <span class="packing-icon">${cat.icon}</span>
          <h3 class="card-title" style="margin-bottom:0;">${cat.category}</h3>
        </div>
        <div class="packing-items-list">${itemsHtml}</div>
      `;

      card.querySelectorAll('.packing-item-row').forEach(row => {
        const chk = row.querySelector('.packing-checkbox');
        chk.addEventListener('change', (e) => {
          const catName = row.getAttribute('data-cat');
          const idx = parseInt(row.getAttribute('data-idx'), 10);
          const c = trip.packing.find(p => p.category === catName);
          if (c && c.items[idx]) {
            c.items[idx].checked = e.target.checked;
            row.classList.toggle('checked', e.target.checked);
            updatePackingProgress();
          }
        });
      });

      container.appendChild(card);
    });

    updatePackingProgress();
  }

  function updatePackingProgress() {
    const trip = getCurrentTrip();
    let total = 0;
    let checked = 0;

    (trip.packing || []).forEach(c => {
      c.items.forEach(i => {
        total++;
        if (i.checked) checked++;
      });
    });

    const pct = total > 0 ? Math.round((checked / total) * 100) : 0;
    const countText = document.getElementById('packingCountText');
    const pctText = document.getElementById('packingPctText');
    const bar = document.getElementById('packingProgressBar');

    if (countText) countText.textContent = `${checked} / ${total}`;
    if (pctText) pctText.textContent = `${pct}%`;
    if (bar) bar.style.width = `${pct}%`;
  }

  // ==========================================================================
  // 5. Trip Generator Engine
  // ==========================================================================
  function generateCustomTrip(formData) {
    const dest = formData.destination.trim();
    const duration = parseInt(formData.duration, 10) || 5;
    const adults = parseInt(formData.adults, 10) || 2;
    const children = parseInt(formData.children, 10) || 0;
    const seniors = parseInt(formData.seniors, 10) || 0;
    const totalTravelers = adults + children + seniors;
    const tripType = formData.tripType || 'Family Vacation';
    const budgetPref = formData.budgetPref || 'moderate';

    let dailyRatePerPerson = budgetPref === 'luxury' ? 450 : (budgetPref === 'budget' ? 75 : 160);
    let lodgingRateNight = budgetPref === 'luxury' ? 520 : (budgetPref === 'budget' ? 85 : 220);

    const totalCost = (dailyRatePerPerson * totalTravelers * duration) + (lodgingRateNight * duration);

    let heroImg = 'assets/hero-tokyo.jpg';
    let destImg = 'assets/dest-tokyo.jpg';
    if (dest.toLowerCase().includes('paris') || dest.toLowerCase().includes('france')) {
      heroImg = 'assets/hero-paris.jpg';
      destImg = 'assets/dest-paris.jpg';
    } else if (dest.toLowerCase().includes('amalfi') || dest.toLowerCase().includes('italy') || dest.toLowerCase().includes('rome')) {
      heroImg = 'assets/dest-amalfi.jpg';
      destImg = 'assets/dest-amalfi.jpg';
    } else if (dest.toLowerCase().includes('swiss') || dest.toLowerCase().includes('zermatt') || dest.toLowerCase().includes('alps')) {
      heroImg = 'assets/dest-swiss.jpg';
      destImg = 'assets/dest-swiss.jpg';
    } else if (dest.toLowerCase().includes('bali') || dest.toLowerCase().includes('indonesia') || dest.toLowerCase().includes('tropical')) {
      heroImg = 'assets/dest-bali.jpg';
      destImg = 'assets/dest-bali.jpg';
    }

    const liveImage = window.__selectedDestinationImage;
    if (liveImage?.url) {
      heroImg = liveImage.url;
      destImg = liveImage.url;
    }

    const generatedDays = [];
    const neighborhoodsList = [
      'Historic Old Town & Central Square',
      'Artisan Riverside & Waterfront Promenade',
      'Cultural Hilltop & Royal Heritage',
      'Garden District & Museum Avenue',
      'Atmospheric Market Quarters & Panoramic Heights'
    ];

    for (let i = 1; i <= duration; i++) {
      const nIndex = (i - 1) % neighborhoodsList.length;
      const nName = neighborhoodsList[nIndex];

      generatedDays.push({
        dayNumber: i,
        dateLabel: `Day ${i}`,
        neighborhood: `${nName}, ${dest}`,
        weatherPlan: `☀️ Cooler Morning: Outdoor discovery • 🏛️ Midday Peak: Climate-controlled indoor sights • 🌆 Sunset: Scenic open-air walk.`,
        morning: {
          dualName: `Historic Landmark & Heritage Walk (${dest})`,
          category: 'Culture & Sightseeing',
          time: '09:30 - 12:00',
          desc: `Begin your morning exploring signature architecture and vibrant pedestrian avenues in ${nName}.`,
          weatherBadge: '☀️ Cooler Morning Outdoor',
          accessibility: children > 0 ? ['👶 Stroller-Friendly', '👨‍👩‍👧 Great for Kids'] : ['♿ Wheelchair Accessible', '👴 Senior Friendly'],
          cost: 15 * totalTravelers,
          completed: false
        },
        lunch: {
          dualName: `Authentic Local Kitchen (${dest} Specialties)`,
          category: 'Local Food Pick',
          time: '12:30 - 14:00',
          desc: `Sample traditional seasonal dishes and family-style culinary traditions prepared with regional ingredients.`,
          weatherBadge: '❄️ Air-Conditioned Dining',
          accessibility: ['👨‍👩‍👧 Family Seating', '🥗 Dietary Options Available'],
          cost: 25 * totalTravelers,
          completed: false
        },
        afternoon: {
          dualName: `Artisan Gallery & Science Discovery (${dest})`,
          category: 'Museum & Discovery',
          time: '14:30 - 17:00',
          desc: `Discover world-class galleries, local craftsmanship, and panoramic city lookouts.`,
          weatherBadge: '🏛️ Midday Indoor Comfort',
          accessibility: ['♿ Universal Access Elevators', '👶 Rest Areas & Facilities'],
          cost: 20 * totalTravelers,
          completed: false
        },
        evening: {
          dualName: `Sunset Promenade & Dinner (${nName})`,
          category: 'Scenic Evening & Dining',
          time: '18:00 - 20:30',
          desc: `Relax with a peaceful evening walk through illuminated plazas, concluding with an authentic dinner.`,
          weatherBadge: '🌆 Evening Golden Hour',
          accessibility: ['👶 Smooth Paved Avenues', '🍷 Relaxed Dining Atmosphere'],
          cost: 35 * totalTravelers,
          completed: false
        }
      });
    }

    const newTrip = {
      id: `trip-${Date.now()}`,
      destination: dest,
      country: dest.includes(',') ? dest.split(',')[1].trim() : dest,
      heroImage: heroImg,
      title: `${dest} Tailored Journey`,
      subtitle: `Curated ${tripType.toLowerCase()} designed for ${totalTravelers} travelers with weather adaptation and neighborhood clustering.`,
      tripType: tripType,
      durationDays: duration,
      startDate: formData.startDate || null,
      specialNotes: formData.specialNotes || null,
      travelers: {
        total: totalTravelers,
        adults: adults,
        children: children,
        seniors: seniors,
        summary: `${totalTravelers} Travelers (${adults} Adults${children ? `, ${children} Kids` : ''}${seniors ? `, ${seniors} Seniors` : ''})`
      },
      budgetTier: budgetPref,
      weather: {
        temp: '22°C',
        condition: 'Sunny & Pleasant',
        icon: '☀️',
        notes: 'Weather Optimized: Outdoor visits organized for cooler morning and late afternoon slots.'
      },
      currentPace: 'balanced',
      stays: [
        {
          id: `stay-${Date.now()}`,
          name: `${dest} Grand Heritage Residence`,
          type: 'Boutique Hotel & Suites',
          neighborhood: neighborhoodsList[0],
          image: destImg,
          rating: '4.91',
          pricePerNight: lodgingRateNight,
          fitBanner: `✓ Accommodates ${totalTravelers} Guests (${tripType} Configuration)`,
          features: ['👶 Stroller-Friendly', '♿ Level Entry & Elevators', '📍 Central Walkable Location', '🥐 Breakfast Included'],
          bookingUrl: '#',
          description: `Centrally positioned boutique accommodation in ${dest} offering spacious interconnected suites and personalized concierge.`
        }
      ],
      days: generatedDays,
      budgetBreakdown: {
        totalTripCost: totalCost,
        dailyAverage: Math.round(totalCost / duration),
        perPersonTotal: Math.round(totalCost / totalTravelers),
        lodgingTotal: lodgingRateNight * duration,
        diningTotal: Math.round(totalCost * 0.3),
        ticketsTotal: Math.round(totalCost * 0.15),
        transitTotal: Math.round(totalCost * 0.08),
        lodgingPct: 47,
        diningPct: 30,
        ticketsPct: 15,
        transitPct: 8
      },
      bookingLinks: [
        {
          title: `${dest} All-Inclusive Tourist City Card`,
          desc: `Combines unlimited public transit with priority admission to top museums and historic monuments.`,
          icon: '🎟️',
          actionText: 'Official City Tourism Pass'
        },
        {
          title: 'Direct Airport Express Transit Pass',
          desc: `Pre-booked seamless high-speed airport link directly to the central district.`,
          icon: '🚄',
          actionText: 'Official Railway Transit'
        }
      ],
      packing: [
        {
          category: 'Travel Documents & Money',
          icon: '🛂',
          items: [
            { text: 'Passports / National ID cards for all travelers', checked: true },
            { text: 'Travel health insurance documents', checked: true },
            { text: 'Local currency cash + debit cards', checked: false }
          ]
        },
        {
          category: 'Weather & Everyday Comfort',
          icon: '👟',
          items: [
            { text: 'Comfortable broken-in walking shoes', checked: true },
            { text: 'Lightweight layered clothing & sun protection', checked: false },
            { text: 'Compact umbrella or light rain shell', checked: false }
          ]
        }
      ]
    };

    PRESET_TRIPS.unshift(newTrip);
    currentTripIndex = 0;
    activeDayIndex = 0;

    renderTripHero();
    renderItinerary();
    renderStays();
    renderBudget();
    renderCustomizeConsole();
    renderPacking();
    switchTab('itinerary');

    showToast(`✓ Generated complete ${duration}-day plan for ${dest}!`);
  }

  // ==========================================================================
  // 6. Navigation & Tab Switching
  // ==========================================================================
  function switchTab(tabId) {
    document.querySelectorAll('.app-tab-navigation .tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });

    document.querySelectorAll('.tab-content-panel').forEach(panel => {
      panel.classList.remove('active');
    });

    const target = document.getElementById(`tabView${tabId.charAt(0).toUpperCase() + tabId.slice(1)}`);
    if (target) target.classList.add('active');
  }

  // ==========================================================================
  // 7. Toast Notifications
  // ==========================================================================
  function showToast(message) {
    const stack = document.getElementById('toastStack');
    if (!stack) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;

    stack.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(12px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  // ==========================================================================
  // 8. Event Listeners & Initialization
  // ==========================================================================
  function init() {
    // Theme toggle
    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) {
      const savedTheme = localStorage.getItem('tripcraft_theme') || 'dark';
      document.documentElement.setAttribute('data-theme', savedTheme);

      themeBtn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('tripcraft_theme', next);
        showToast(`Theme switched to ${next} mode`);
      });
    }

    // Language select
    const langSelect = document.getElementById('langSelect');
    if (langSelect) {
      langSelect.value = currentLang;
      langSelect.addEventListener('change', (e) => {
        applyLanguage(e.target.value);
        showToast(`Language updated to ${e.target.options[e.target.selectedIndex].text}`);
      });
    }

    // Currency select
    const currencySelect = document.getElementById('currencySelect');
    const currencyBadge = document.getElementById('currencySymbolBadge');
    if (currencySelect) {
      currencySelect.value = currentCurrency;
      if (currencyBadge && CURRENCIES[currentCurrency]) {
        currencyBadge.textContent = CURRENCIES[currentCurrency].symbol;
      }

      currencySelect.addEventListener('change', (e) => {
        currentCurrency = e.target.value;
        localStorage.setItem('tripcraft_currency', currentCurrency);
        if (currencyBadge && CURRENCIES[currentCurrency]) {
          currencyBadge.textContent = CURRENCIES[currentCurrency].symbol;
        }
        renderTripHero();
        renderItinerary();
        renderStays();
        renderBudget();
        renderCustomizeConsole();
        showToast(`Currency set to ${currentCurrency}`);
      });
    }

    // Trip selector — with lazy hydration of remote trip days
    const tripSelect = document.getElementById('tripSelect');
    if (tripSelect) {
      tripSelect.addEventListener('change', async (e) => {
        currentTripIndex = parseInt(e.target.value, 10) || 0;
        activeDayIndex = 0;

        const trip = PRESET_TRIPS[currentTripIndex];
        if (trip && (!trip.days || trip.days.length === 0) && trip.savedToCloud && window.TripsAPI) {
          try {
            const full = await window.TripsAPI.getTripWithDays(trip.id);
            Object.keys(full).forEach(k => { trip[k] = full[k]; });
          } catch (err) {
            console.warn('[app] Could not load trip days:', err.message);
          }
        }

        renderTripHero();
        renderItinerary();
        renderStays();
        renderBudget();
        renderCustomizeConsole();
        renderPacking();
      });
    }

    // Tab buttons
    document.querySelectorAll('.app-tab-navigation .tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        switchTab(btn.getAttribute('data-tab'));
      });
    });

    // Stay filter pills
    document.querySelectorAll('[data-stay-filter]').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('[data-stay-filter]').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        activeStayFilter = pill.getAttribute('data-stay-filter');
        renderStays();
      });
    });

    // Modal open / close — New Trip
    const modalNewTrip = document.getElementById('modalNewTrip');
    const btnNewTrip = document.getElementById('btnNewTrip');
    const btnCloseNewTripModal = document.getElementById('btnCloseNewTripModal');
    const btnCancelNewTrip = document.getElementById('btnCancelNewTrip');

    if (btnNewTrip && modalNewTrip) {
      btnNewTrip.addEventListener('click', () => {
        modalNewTrip.classList.add('active');
      });
    }

    if (btnCloseNewTripModal && modalNewTrip) {
      btnCloseNewTripModal.addEventListener('click', () => {
        modalNewTrip.classList.remove('active');
      });
    }

    if (btnCancelNewTrip && modalNewTrip) {
      btnCancelNewTrip.addEventListener('click', () => {
        modalNewTrip.classList.remove('active');
      });
    }

    if (modalNewTrip) {
      modalNewTrip.addEventListener('click', (e) => {
        if (e.target === modalNewTrip) {
          modalNewTrip.classList.remove('active');
        }
      });
    }

    // Form submit — generate trip and persist if authenticated
    const formNewTrip = document.getElementById('formNewTrip');
    if (formNewTrip && modalNewTrip) {
      formNewTrip.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = document.getElementById('btnGenerateTripSubmit');
        const originalBtnHTML = submitBtn ? submitBtn.innerHTML : '';

        const structured = window.__selectedDestination;
        const destDisplay = structured
          ? structured.displayName
          : document.getElementById('inputDestination').value.trim();

        if (!destDisplay) {
          showToast('⚠ Please select a destination from the dropdown');
          const destInput = document.getElementById('inputDestination');
          if (destInput) destInput.focus();
          return;
        }

        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<span class="spinner"></span><span>Generating…</span>';
        }

        try {
          const data = {
            destination:  destDisplay,
            duration:     document.getElementById('inputDuration').value,
            adults:       document.getElementById('inputAdults').value,
            children:     document.getElementById('inputChildren').value,
            seniors:      document.getElementById('inputSeniors').value,
            tripType:     document.getElementById('selectTripType').value,
            budgetPref:   document.getElementById('selectBudgetPref').value,
            startDate:    document.getElementById('inputStartDate').value || null,
            specialNotes: document.getElementById('inputSpecialNotes').value || null
          };

          generateCustomTrip(data);

          const newTrip = PRESET_TRIPS[0];
          newTrip.startDate = data.startDate;
          newTrip.specialNotes = data.specialNotes;

          modalNewTrip.classList.remove('active');
          formNewTrip.reset();

          if (window.TripCraftAuth?.isSignedIn() && window.TripsAPI) {
            try {
              const saved = await window.TripsAPI.saveTrip(newTrip);
              newTrip.id = saved.id;
              newTrip.savedToCloud = true;
              showToast('✓ Trip and itinerary saved to your account');
            } catch (cloudErr) {
              console.error('[app] Supabase save failed:', cloudErr);
              showToast('⚠ Saved locally — cloud sync failed');
            }
          } else {
            showToast('ℹ Sign in to save this trip to your account');
          }

          if (window.DestinationPicker?.reset) window.DestinationPicker.reset();

        } catch (err) {
          console.error('[app] Trip generation failed:', err);
          showToast('⚠ Could not generate trip: ' + (err.message || 'Unknown error'));
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnHTML;
          }
        }
      });
    }

    // Sync remote trips on auth change
    window.addEventListener('tripcraft:authChanged', async (e) => {
      const user = e.detail?.user;
      if (!user || !window.TripsAPI) return;
      try {
        const remoteTrips = await window.TripsAPI.listTrips();
        if (remoteTrips.length === 0) return;

        const existingIds = new Set(PRESET_TRIPS.map(t => t.id));
        remoteTrips.forEach(rt => {
          if (!existingIds.has(rt.id)) PRESET_TRIPS.push(rt);
        });

        renderTripHero();
        showToast(`✓ Loaded ${remoteTrips.length} saved trip(s)`);
      } catch (err) {
        console.warn('[app] Could not load remote trips:', err.message);
      }
    });

    // Footer & header shortcuts
    const btnAdjustPaceHeader = document.getElementById('btnAdjustPaceHeader');
    if (btnAdjustPaceHeader) {
      btnAdjustPaceHeader.addEventListener('click', () => {
        switchTab('customize');
        const paceCard = document.querySelector('.pace-selector-card');
        if (paceCard) paceCard.scrollIntoView({ behavior: 'smooth' });
      });
    }

    const btnPrintItinerary = document.getElementById('btnPrintItinerary');
    if (btnPrintItinerary) {
      btnPrintItinerary.addEventListener('click', () => {
        window.print();
      });
    }

    const btnQuickSwapActivity = document.getElementById('btnQuickSwapActivity');
    if (btnQuickSwapActivity) {
      btnQuickSwapActivity.addEventListener('click', () => {
        switchTab('customize');
        const swapConsole = document.querySelector('.swap-console-card');
        if (swapConsole) swapConsole.scrollIntoView({ behavior: 'smooth' });
      });
    }

    const btnQuickSwapDining = document.getElementById('btnQuickSwapDining');
    if (btnQuickSwapDining) {
      btnQuickSwapDining.addEventListener('click', () => {
        switchTab('customize');
        const swapSlotSelect = document.getElementById('swapSlotSelect');
        if (swapSlotSelect) {
          swapSlotSelect.value = 'lunch';
          renderSwapAlternates(activeDayIndex, 'lunch');
        }
        const swapConsole = document.querySelector('.swap-console-card');
        if (swapConsole) swapConsole.scrollIntoView({ behavior: 'smooth' });
      });
    }

    const btnQuickAdjustPace = document.getElementById('btnQuickAdjustPace');
    if (btnQuickAdjustPace) {
      btnQuickAdjustPace.addEventListener('click', () => {
        switchTab('customize');
      });
    }

    const btnQuickBookingGuide = document.getElementById('btnQuickBookingGuide');
    if (btnQuickBookingGuide) {
      btnQuickBookingGuide.addEventListener('click', () => {
        switchTab('customize');
        const bookingSection = document.querySelector('.booking-guidance-section');
        if (bookingSection) bookingSection.scrollIntoView({ behavior: 'smooth' });
      });
    }

    // Pace selector radios
    document.querySelectorAll('input[name="tripPace"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        document.querySelectorAll('.pace-option-card').forEach(c => c.classList.remove('active'));
        e.target.closest('.pace-option-card').classList.add('active');
      });
    });

    const btnApplyPace = document.getElementById('btnApplyPace');
    if (btnApplyPace) {
      btnApplyPace.addEventListener('click', () => {
        const checkedPace = document.querySelector('input[name="tripPace"]:checked');
        const paceVal = checkedPace ? checkedPace.value : 'balanced';
        const trip = getCurrentTrip();
        trip.currentPace = paceVal;
        showToast(`✓ Applied ${paceVal.toUpperCase()} pace to your daily itinerary!`);
        switchTab('itinerary');
      });
    }

    // Customize slot selectors
    const swapDaySelect = document.getElementById('swapDaySelect');
    const swapSlotSelect = document.getElementById('swapSlotSelect');
    if (swapDaySelect) {
      swapDaySelect.addEventListener('change', (e) => {
        const dayIdx = parseInt(e.target.value, 10);
        const slot = swapSlotSelect ? swapSlotSelect.value : 'morning';
        renderSwapAlternates(dayIdx, slot);
      });
    }
    if (swapSlotSelect) {
      swapSlotSelect.addEventListener('change', (e) => {
        const dayIdx = swapDaySelect ? parseInt(swapDaySelect.value, 10) : activeDayIndex;
        renderSwapAlternates(dayIdx, e.target.value);
      });
    }

    // Initial render
    applyLanguage(currentLang);

    // ---- FIX: Hydrate the currently-selected trip if it lacks days ----
    (async () => {
      const trip = getCurrentTrip();
      if (trip && (!trip.days || trip.days.length === 0) && trip.savedToCloud && window.TripsAPI) {
        try {
          const full = await window.TripsAPI.getTripWithDays(trip.id);
          Object.keys(full).forEach(k => { trip[k] = full[k]; });
          renderTripHero();
          renderItinerary();
          renderStays();
          renderBudget();
          renderCustomizeConsole();
          renderPacking();
        } catch (err) {
          console.warn('[app] Boot hydration failed:', err.message);
        }
      }
    })();
  }

  // Boot on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ---- Expose for cross-module access ----
  window.TRANSLATIONS         = TRANSLATIONS;
  window.tripcraftT           = t;
  window.tripcraftToast       = showToast;
  window.tripcraftCURRENCIES  = CURRENCIES;
  window.tripcraftFormatMoney = formatMoney;

})();