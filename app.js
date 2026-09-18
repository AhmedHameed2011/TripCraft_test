/**
 * TripCraft — Intelligent Travel Planner & Itinerary Studio
 * Master Client Application Script
 */

(function () {
  'use strict';

  // ==========================================================================
  // 1. Supabase & Authentication Engine
  // ==========================================================================
  const supabase = window.supabaseClient || null;
  let currentUser = null;

  // Make handleLogout globally available for inline onclick attributes
  window.handleLogout = function() {
    localStorage.removeItem('tripcraft_user');
    
    // Revert UI elements
    const authNavGroup = document.getElementById('authNavGroup');
    const userNavGroup = document.getElementById('userNavGroup');
    if (authNavGroup) authNavGroup.style.display = 'flex';
    if (userNavGroup) userNavGroup.style.display = 'none';
    
    // Sign out from Supabase if connected
    if (supabase) {
      supabase.auth.signOut();
    }
    
    // Reload default demo state
    showToast('Logged out successfully');
    setTimeout(() => {
      location.reload(); 
    }, 800);
  };

  function handleLoginSuccess(user) {
    // 1. Persist session data
    localStorage.setItem('tripcraft_user', JSON.stringify(user));
    currentUser = user;

    // 2. Hide Login/Register, Show User Menu
    const authNavGroup = document.getElementById('authNavGroup');
    if (authNavGroup) authNavGroup.style.display = 'none';
    
    const userGroup = document.getElementById('userNavGroup');
    if (userGroup) {
      userGroup.style.display = 'flex';
      const displayName = user.name || user.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Traveler';
      userGroup.innerHTML = `
        <span class="user-display-name">👤 ${displayName}</span>
        <button class="btn btn-secondary btn-sm" onclick="handleLogout()">Logout</button>
      `;
    }

    // 3. Fetch user's saved trips from database
    loadUserTrips(user.id);
  }

  async function loadUserTrips(userId) {
    if (!supabase) return;
    
    // Fetch from Supabase API
    const { data: trips, error } = await supabase
      .from('trips')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !trips || !trips.length) {
      showToast('No saved trips found. Plan a new trip to get started!');
      return;
    }

    // Populate dropdown with user's trips
    const tripSelect = document.getElementById('tripSelect');
    if (tripSelect) {
      tripSelect.innerHTML = trips.map(t => {
        const tripTitle = t.trip_data?.title || t.destination || 'Saved Trip';
        return `<option value="${t.id}">${tripTitle}</option>`;
      }).join('');
      
      // Update listener for custom IDs from DB
      tripSelect.addEventListener('change', (e) => {
        const selectedId = e.target.value;
        const selectedRow = trips.find(tr => tr.id === selectedId);
        if (selectedRow) renderTripDetails(selectedRow);
      });
    }
    
    // Load active trip view
    renderTripDetails(trips[0]);
  }

  function renderTripDetails(tripRow) {
    const tripObj = tripRow.trip_data || tripRow;
    const existingIdx = PRESET_TRIPS.findIndex(pt => pt.id === tripObj.id);
    
    if (existingIdx !== -1) {
      currentTripIndex = existingIdx;
    } else {
      PRESET_TRIPS.unshift(tripObj);
      currentTripIndex = 0;
    }
    
    renderAllViews();
  }

  async function saveTripToSupabase(tripObj) {
    if (!supabase || !currentUser) return;
    try {
      const { error } = await supabase
        .from('trips')
        .upsert({
          id: tripObj.id,
          user_id: currentUser.id,
          destination: tripObj.destination,
          trip_data: tripObj,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error saving trip to Supabase:', error);
        showToast('Error syncing trip to cloud.');
      } else {
        showToast('Trip synced to your account successfully!');
      }
    } catch (err) {
      console.error('Save to Supabase error:', err);
    }
  }

  // ==========================================================================
  // 2. Currency & Conversion Engine
  // ==========================================================================
  const CURRENCIES = {
    USD: { symbol: '$', rate: 1.0 },
    EUR: { symbol: '€', rate: 0.92 },
    GBP: { symbol: '£', rate: 0.79 },
    JPY: { symbol: '¥', rate: 152.0 },
    SAR: { symbol: 'ر.س', rate: 3.75 },
    AED: { symbol: 'AED', rate: 3.67 }
  };

  let currentCurrency = localStorage.getItem('tripcraft_currency') || 'USD';

  function formatMoney(amountInUSD) {
    const curr = CURRENCIES[currentCurrency] || CURRENCIES.USD;
    const converted = Math.round(amountInUSD * curr.rate);
    if (currentCurrency === 'JPY') {
      return `${curr.symbol}${converted.toLocaleString()}`;
    }
    if (currentCurrency === 'SAR' || currentCurrency === 'AED') {
      return `${converted.toLocaleString()} ${curr.symbol}`;
    }
    return `${curr.symbol}${converted.toLocaleString()}`;
  }

  // ==========================================================================
  // 3. Multilingual Localization Engine
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
      tabCustomize: "Customize Plan",
      tabPacking: "Packing List",
      btnAdjustPace: "Adjust Pace",
      btnPrint: "Print / PDF",
      labelNeighborhoodCluster: "Geographic Neighborhood Cluster",
      transitOptimizedSubtext: "Activities grouped within 1.2km to minimize walking and transit time for families.",
      labelWeatherAdaptation: "Weather Adaptation Plan",
      customizePlanTitle: "Customize Day Schedule",
      customizePlanSubtitle: "Swap activities, substitute restaurants, or adjust pace.",
      actionSwapActivity: "Swap Activity",
      actionSwapActivityDesc: "Discover alternative attractions in this neighborhood",
      actionChangeRestaurant: "Change Restaurant",
      actionChangeRestaurantDesc: "Choose local, vegetarian, or kid-friendly options",
      actionAdjustPace: "Adjust Pace of Day",
      actionAdjustPaceDesc: "Choose between relaxed, balanced, or active",
      actionBookingGuide: "Booking Guide & Links",
      actionBookingGuideDesc: "Official passes, transit cards, and direct reservations",
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
      customizeHeaderSubtitle: "Adapt the itinerary to your group's energy level and preferences.",
      paceControlTitle: "Pace & Daily Cadence",
      paceControlSubtitle: "Adjust activity density for everyone's well-being.",
      paceRelaxedName: "🌿 Relaxed & Easygoing",
      paceRelaxedTag: "Families & Seniors",
      paceRelaxedDesc: "Late mornings, max 2 main visits daily, and plenty of coffee breaks.",
      paceBalancedName: "⚖️ Balanced & Curated",
      paceBalancedTag: "Recommended",
      paceBalancedDesc: "Morning and afternoon exploration with flexible evenings.",
      pacePackedName: "⚡ Active & Packed",
      pacePackedTag: "Energetic Explorers",
      pacePackedDesc: "Early start, 4-5 major spots daily, and maximum sights.",
      btnApplyPace: "Apply Pace to Itinerary",
      swapConsoleTitle: "Swap Activities or Dining",
      swapConsoleSubtitle: "Select a time slot to see curated alternates in the same area.",
      labelTargetDay: "Select Day to Modify",
      labelTimeSlot: "Slot to Replace",
      slotMorning: "Morning Activity",
      slotLunch: "Lunch & Street Food",
      slotAfternoon: "Afternoon Activity",
      slotEvening: "Evening Stroll & Dinner",
      labelCuratedAlternates: "Curated Alternates:",
      bookingGuidanceTitle: "Official Booking Guidance",
      bookingGuidanceSubtitle: "Avoid scalper surcharges with official direct portals.",
      packingHeaderTitle: "Smart Packing Checklist",
      packingHeaderSubtitle: "Weather-adaptive, age-tailored list for your journey.",
      packed: "Packed",
      footerText: "Crafting personalized, weather-adaptive journeys worldwide.",
      modalNewTripTitle: "Plan a New Personalized Journey",
      formLabelDestination: "Destination City & Country *",
      formLabelDuration: "Duration (Days) *",
      formSectionTravelers: "Who is traveling? (Group size & age breakdown)",
      formLabelAdults: "Adults (Ages 18-64)",
      formLabelChildren: "Children / Teens (0-17)",
      formLabelSeniors: "Seniors (Ages 65+)",
      formLabelTripType: "Type of Visit *",
      formLabelBudgetPref: "Budget Preference *",
      btnCancel: "Cancel",
      btnGeneratePlan: "Generate Complete Trip Plan",
      completed: "Completed",
      markCompleted: "Mark Done",
      btnSwap: "Swap",
      btnBook: "Booking Info",
      btnSelectThis: "Select This",
      perNight: "/ night",
      btnLogin: "Login",
      btnRegister: "Register",
      btnLogout: "Logout",
      welcomeUser: "Welcome,"
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
      tabCustomize: "تخصيص الخطة",
      tabPacking: "قائمة الأمتعة",
      btnAdjustPace: "تعديل وتيرة الرحلة",
      btnPrint: "طباعة / PDF",
      labelNeighborhoodCluster: "التجمع الجغرافي للحي",
      transitOptimizedSubtext: "تم تجميع الأنشطة في نطاق 1.2 كم لتقليل وقت التنقل والمشي للعائلات.",
      labelWeatherAdaptation: "خطة التكيف مع الطقس",
      customizePlanTitle: "تخصيص جدول اليوم",
      customizePlanSubtitle: "استبدل الأنشطة والمطاعم أو اضبط الوتيرة بسهولة.",
      actionSwapActivity: "تغيير النشاط",
      actionSwapActivityDesc: "استكشف معالم بديلة في نفس الحي",
      actionChangeRestaurant: "تغيير المطعم",
      actionChangeRestaurantDesc: "اختر مطاعم محلية، نباتية، أو مناسبة للأطفال",
      actionAdjustPace: "ضبط وتيرة اليوم",
      actionAdjustPaceDesc: "اختر بين هادئة، متوازنة، أو مليئة بالحيوية",
      actionBookingGuide: "دليل وروابط الحجز",
      actionBookingGuideDesc: "التذاكر الرسمية، بطاقات المواصلات، والحجوزات المباشرة",
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
      customizeHeaderSubtitle: "قم بتعديل الجدول الزمني وفقًا لطاقة مجموعتك وتفضيلاتها.",
      paceControlTitle: "الوتيرة والإيقاع اليومي",
      paceControlSubtitle: "اضبط كثافة الأنشطة لراحة الجميع.",
      paceRelaxedName: "🌿 هادئ ومريح",
      paceRelaxedTag: "العائلات وكبار السن",
      paceRelaxedDesc: "صباح متأخر، زيارتان رئيسيتان كحد أقصى يوميًا، واستراحات مقاهي متعددة.",
      paceBalancedName: "⚖️ متوازن ومعد بعناية",
      paceBalancedTag: "موصى به",
      paceBalancedDesc: "استكشاف صباحي ومسائي مع أوقات راحة مرنة.",
      pacePackedName: "⚡ نشط ومكثف",
      pacePackedTag: "للمستكشفين الشغوفين",
      pacePackedDesc: "بداية مبكرة، 4-5 معالم رئيسية يوميًا، وأقصى استكشاف.",
      btnApplyPace: "تطبيق الوتيرة على الرحلة",
      swapConsoleTitle: "تبديل الأنشطة أو المطاعم",
      swapConsoleSubtitle: "اختر الفترة الزمنية لعرض الخيارات البديلة المتاحة في نفس المنطقة.",
      labelTargetDay: "اختر اليوم للتعديل",
      labelTimeSlot: "الفترة المراد تغييرها",
      slotMorning: "نشاط الصباح",
      slotLunch: "الغداء والأكلات الشعبية",
      slotAfternoon: "نشاط الظهيرة",
      slotEvening: "جولة المساء والعشاء",
      labelCuratedAlternates: "الخيارات البديلة المتاحة:",
      bookingGuidanceTitle: "دليل الحجز الرسمي",
      bookingGuidanceSubtitle: "تجنب الرسوم الإضافية عبر البوابات الرسمية المباشرة.",
      packingHeaderTitle: "قائمة الأمتعة الذكية",
      packingHeaderSubtitle: "قائمة مخصصة وفقًا للطقس وأعمار المسافرين والأنشطة.",
      packed: "تم التجهيز",
      footerText: "نصمم رحلات مخصصة ومتكيفة مع الطقس حول العالم.",
      modalNewTripTitle: "تخطيط رحلة جديدة ومخصصة",
      formLabelDestination: "المدينة والدولة *",
      formLabelDuration: "المدة (بالأيام) *",
      formSectionTravelers: "من سيسافر؟ (عدد الأشخاص وفئات الأعمار)",
      formLabelAdults: "البالغون (18-64 سنة)",
      formLabelChildren: "الأطفال والمراهقون (0-17 سنة)",
      formLabelSeniors: "كبار السن (65+ سنة)",
      formLabelTripType: "نوع الرحلة *",
      formLabelBudgetPref: "الميزانية المفضلة *",
      btnCancel: "إلغاء",
      btnGeneratePlan: "توليد خطة الرحلة المتكاملة",
      completed: "مكتمل",
      markCompleted: "تحديد كمكتمل",
      btnSwap: "تبديل",
      btnBook: "معلومات الحجز",
      btnSelectThis: "اختيار هذا",
      perNight: "/ ليلة",
      btnLogin: "تسجيل الدخول",
      btnRegister: "إنشاء حساب",
      btnLogout: "تسجيل الخروج",
      welcomeUser: "مرحباً،"
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
      modalNewTripTitle: "Planificar un Nuevo Viaje Personalizado",
      formLabelDestination: "Ciudad y País de Destino *",
      formLabelDuration: "Duración (Días) *",
      formSectionTravelers: "¿Quiénes viajan? (Cantidad y edades)",
      formLabelAdults: "Adultos (18-64 años)",
      formLabelChildren: "Niños / Jóvenes (0-17 años)",
      formLabelSeniors: "Adultos Mayores (65+ años)",
      formLabelTripType: "Tipo de Visita *",
      formLabelBudgetPref: "Preferencia de Presupuesto *",
      btnCancel: "Cancelar",
      btnGeneratePlan: "Generar Plan Completo",
      completed: "Completado",
      markCompleted: "Marcar Listo",
      btnSwap: "Cambiar",
      btnBook: "Info Reserva",
      btnSelectThis: "Elegir este",
      perNight: "/ noche",
      btnLogin: "Iniciar Sesión",
      btnRegister: "Registrarse",
      btnLogout: "Cerrar Sesión",
      welcomeUser: "Bienvenido,"
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
      modalNewTripTitle: "Créer un Nouveau Voyage Personnalisé",
      formLabelDestination: "Ville & Pays de Destination *",
      formLabelDuration: "Durée (Jours) *",
      formSectionTravelers: "Qui voyage ? (Composition du groupe & âges)",
      formLabelAdults: "Adultes (18-64 ans)",
      formLabelChildren: "Enfants / Ados (0-17 ans)",
      formLabelSeniors: "Seniors (65+ ans)",
      formLabelTripType: "Type de Séjour *",
      formLabelBudgetPref: "Préférence Budgétaire *",
      btnCancel: "Annuler",
      btnGeneratePlan: "Générer le Plan Complet",
      completed: "Effectué",
      markCompleted: "Marquer comme fait",
      btnSwap: "Remplacer",
      btnBook: "Info Réservation",
      btnSelectThis: "Choisir cet élément",
      perNight: "/ nuit",
      btnLogin: "Connexion",
      btnRegister: "S'inscrire",
      btnLogout: "Déconnexion",
      welcomeUser: "Bienvenue,"
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
      customizePlanSubtitle: "観光スポットの入れ替え、食事場所の変更、ペース調整を行えます。",
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
      modalNewTripTitle: "新しい旅行プランを作成",
      formLabelDestination: "旅行先の都市・国 *",
      formLabelDuration: "旅行日数 *",
      formSectionTravelers: "旅行者の人数と内訳（年齢層）",
      formLabelAdults: "大人 (18-64歳)",
      formLabelChildren: "子供・若者 (0-17歳)",
      formLabelSeniors: "シニア (65歳以上)",
      formLabelTripType: "旅行の目的 *",
      formLabelBudgetPref: "予算設定 *",
      btnCancel: "キャンセル",
      btnGeneratePlan: "旅行プランを自動生成",
      completed: "完了",
      markCompleted: "完了にする",
      btnSwap: "変更する",
      btnBook: "予約案内",
      btnSelectThis: "これに変更",
      perNight: "/ 泊",
      btnLogin: "ログイン",
      btnRegister: "新規登録",
      btnLogout: "ログアウト",
      welcomeUser: "ようこそ、"
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
      modalNewTripTitle: "Neue Reise Planen",
      formLabelDestination: "Zielstadt & Land *",
      formLabelDuration: "Dauer (Tage) *",
      formSectionTravelers: "Wer reist mit? (Personen & Altersgruppen)",
      formLabelAdults: "Erwachsene (18-64 J.)",
      formLabelChildren: "Kinder / Jugendliche (0-17 J.)",
      formLabelSeniors: "Senioren (65+ J.)",
      formLabelTripType: "Art der Reise *",
      formLabelBudgetPref: "Budget-Präferenz *",
      btnCancel: "Abbrechen",
      btnGeneratePlan: "Kompletten Reiseplan Erstellen",
      completed: "Erledigt",
      markCompleted: "Als erledigt markieren",
      btnSwap: "Tauschen",
      btnBook: "Buchungs-Info",
      btnSelectThis: "Auswählen",
      perNight: "/ Nacht",
      btnLogin: "Anmelden",
      btnRegister: "Registrieren",
      btnLogout: "Abmelden",
      welcomeUser: "Willkommen,"
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

    renderAllViews();
  }

  // ==========================================================================
  // 4. Preset Rich Trips Data Store
  // ==========================================================================
  const PRESET_TRIPS = [
    {
      id: 'trip-tokyo-family',
      destination: 'Tokyo, Japan',
      country: 'Japan',
      heroImage: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1600&q=80',
      title: 'Tokyo Neon & Heritage',
      subtitle: 'A personalized voyage balancing vibrant pop-culture districts, historic Shinto shrines, and serene imperial gardens.',
      tripType: 'Family Vacation',
      durationDays: 5,
      travelers: {
        total: 4,
        adults: 2,
        children: 2,
        seniors: 0,
        summary: '4 Travelers (2 Adults, 2 Kids)'
      },
      budgetTier: 'moderate',
      pace: 'balanced',
      weather: {
        temp: '24°C',
        condition: 'Clear & Mild',
        icon: '☀️',
        notes: 'Weather Optimized: Cooler morning temple visits, midday indoor science/ac activities, sunset river breezes.'
      },
      stays: [
        {
          id: 'stay-mimaru-asakusa',
          name: 'MIMARU TOKYO Asakusa Station',
          type: 'Apartment Hotel',
          neighborhood: 'Asakusa & Sumida',
          rating: '4.92',
          pricePerNight: 240,
          category: 'family',
          fitBanner: '✓ Fits 4 Guests (Family Suite with Japanese Bunk Beds)',
          features: ['👶 Stroller-Friendly', '♿ Elevator & Level Entry', '👨‍👩‍👧 Family Kitchen', '📍 2-min Walk to Asakusa Station'],
          bookingUrl: 'https://mimaruhotels.com/en/hotel/asakusa-station/',
          description: 'Spacious Japanese apartment hotel tailor-made for families with separate living spaces, coin laundry, and immediate access to the Ginza line.'
        },
        {
          id: 'stay-gracery-shinjuku',
          name: 'Hotel Gracery Shinjuku',
          type: 'City Hotel',
          neighborhood: 'Shinjuku',
          rating: '4.68',
          pricePerNight: 190,
          category: 'central',
          fitBanner: '✓ Central Transit Hub',
          features: ['🚅 Direct Subway Connection', '♿ Accessible Elevator', '🗼 Godzilla View Deck'],
          bookingUrl: 'https://gracery.com/shinjuku/',
          description: 'Modern central hotel located right above Shinjuku entertainment district with direct connections to all city transit lines.'
        },
        {
          id: 'stay-palace-tokyo',
          name: 'Palace Hotel Tokyo',
          type: 'Luxury Hotel',
          neighborhood: 'Marunouchi / Imperial Palace',
          rating: '4.95',
          pricePerNight: 480,
          category: 'accessible',
          fitBanner: '✓ Ultra-Accessible & Luxury Level',
          features: ['♿ Universal Access', '🌿 Imperial Garden Views', '🍷 Michelin Dining'],
          bookingUrl: 'https://www.palacehoteltokyo.com/',
          description: '5-star oasis overlooking the Imperial Palace moats with barrier-free access and world-class concierge service.'
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
            accessibility: ['👶 Stroller-Friendly', '♿ Step-Free Ramp at Main Hall'],
            cost: 0,
            completed: false
          },
          lunch: {
            dualName: '大黒家 天麩羅 (Daikokuya Tempura)',
            category: 'Local Food Pick',
            time: '12:00 - 13:15',
            desc: 'Historic eatery founded in 1887 famed for rich, savory sesame-oil dipped tendon bowls over steaming rice.',
            weatherBadge: '❄️ Air-Conditioned Indoor Dining',
            accessibility: ['👨‍👩‍👧 Family-Friendly Seating'],
            cost: 45,
            completed: false
          },
          afternoon: {
            dualName: '東京スカイツリー (Tokyo Skytree & Solamachi)',
            category: 'Sightseeing & Arcade',
            time: '14:00 - 17:00',
            desc: 'Towering observation deck with panoramic views across Greater Tokyo and Mount Fuji.',
            weatherBadge: '🏛️ Midday Indoor Air-Conditioned',
            accessibility: ['♿ Full Wheelchair Accessibility'],
            cost: 65,
            completed: false
          },
          evening: {
            dualName: '隅田川遊歩道 (Sumida River Sunset Promenade)',
            category: 'Scenic Walk & Local Eats',
            time: '18:00 - 20:30',
            desc: 'Breezy evening stroll along the lit bridges of Sumida River.',
            weatherBadge: '🌆 Pleasant Evening Breeze',
            accessibility: ['👶 Smooth Paved Walkway'],
            cost: 50,
            completed: false
          }
        },
        {
          dayNumber: 2,
          dateLabel: 'Day 2',
          neighborhood: 'Ueno Park, Museums & Akihabara Electric Town',
          weatherPlan: '🌳 Shaded Morning: Ueno Park Woods • 🏛️ Midday Indoor: Tokyo National Museum • ⚡ Evening Neon: Akihabara Arcade',
          morning: {
            dualName: '上野恩賜公園 (Ueno Park & Shinobazu Pond)',
            category: 'Nature & Parks',
            time: '09:30 - 11:30',
            desc: 'Sprawling public park with lotus ponds, serene walkways, and historic shrines.',
            weatherBadge: '🌳 Shaded Park Paths',
            accessibility: ['👶 Stroller Paths', '♿ Paved Ramps'],
            cost: 0,
            completed: false
          },
          lunch: {
            dualName: '伊豆栄 本店 (Izuei Unagi Restaurant)',
            category: 'Traditional Dining',
            time: '12:00 - 13:30',
            desc: 'Serving charcoal-grilled unagidon eel for over 260 years in Ueno.',
            weatherBadge: '❄️ Indoor Air-Conditioned',
            accessibility: ['👨‍👩‍👧 Private Tatami Rooms'],
            cost: 70,
            completed: false
          },
          afternoon: {
            dualName: '秋葉原電気街 (Akihabara Tech & Anime Quarter)',
            category: 'Pop Culture & Gadgets',
            time: '14:30 - 17:30',
            desc: 'Multi-level tech hubs, vintage game arcades, and manga flagship stores.',
            weatherBadge: '🏢 Indoor Arcades',
            accessibility: ['♿ Elevator Access'],
            cost: 40,
            completed: false
          },
          evening: {
            dualName: '神田まつや (Kanda Matsuya Soba)',
            category: 'Authentic Dinner',
            time: '18:30 - 20:00',
            desc: 'Classic handmade buckwheat noodle house housed in a showa-era wooden building.',
            weatherBadge: '🛋️ Cozy Indoor',
            accessibility: ['♿ Ground Level Access'],
            cost: 35,
            completed: false
          }
        }
      ],
      packingList: [
        { id: 'p1', item: 'Comfortable walking sneakers (10k+ steps/day)', checked: true, category: 'Footwear' },
        { id: 'p2', item: 'Universal Type A/B power adapters & power bank', checked: false, category: 'Electronics' },
        { id: 'p3', item: 'Digital Suica / Pasmo transit pass loaded on Apple/Google Wallet', checked: true, category: 'Essentials' },
        { id: 'p4', item: 'Light breathable rain jacket or compact umbrella', checked: false, category: 'Clothing' },
        { id: 'p5', item: 'Small hand towel & coin pouch (many Japanese restrooms carry no paper towels)', checked: false, category: 'Daily Use' }
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
      }
    },
    {
      id: 'trip-paris-romantic',
      destination: 'Paris, France',
      country: 'France',
      heroImage: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1600&q=80',
      title: 'Paris Art & Seine Elegance',
      subtitle: 'A beautifully structured French getaway exploring iconic art galleries, cozy cafes, and historic neighborhood walks.',
      tripType: 'Cultural & Romantic',
      durationDays: 4,
      travelers: {
        total: 2,
        adults: 2,
        children: 0,
        seniors: 0,
        summary: '2 Adults'
      },
      budgetTier: 'moderate',
      pace: 'relaxed',
      weather: {
        temp: '19°C',
        condition: 'Partly Cloudy',
        icon: '⛅',
        notes: 'Ideal walking weather with cozy indoor gallery visits during occasional afternoon showers.'
      },
      stays: [
        {
          id: 'stay-marais-boutique',
          name: 'Le Pavillon de la Reine',
          type: 'Boutique Hotel',
          neighborhood: 'Le Marais',
          rating: '4.89',
          pricePerNight: 320,
          category: 'central',
          fitBanner: '✓ Historic Place des Vosges location',
          features: ['🌿 Private Garden Courtyard', '🍷 Wine Bar', '📍 Walkable to Louvre'],
          bookingUrl: 'https://www.pavillondelareine.com/',
          description: 'Charming 17th-century hideaway in the heart of Le Marais district.'
        }
      ],
      days: [
        {
          dayNumber: 1,
          dateLabel: 'Day 1',
          neighborhood: 'Le Marais & Île de la Cité',
          weatherPlan: '🌤️ Morning stroll through historic cobblestones • 🎨 Afternoon art indoors',
          morning: {
            dualName: 'Place des Vosges & Le Marais Walk',
            category: 'Historic Quarter',
            time: '09:30 - 11:30',
            desc: 'Stroll Paris’s oldest planned square surrounded by red brick arcades.',
            weatherBadge: '🌤️ Pleasant Morning Walk',
            accessibility: ['👶 Flat Paved Path'],
            cost: 0,
            completed: false
          },
          lunch: {
            dualName: 'L’As du Fallafel',
            category: 'Iconic Street Dining',
            time: '12:00 - 13:00',
            desc: 'Famous Rue des Rosiers spot known for warm pita and spiced grilled aubergine.',
            weatherBadge: '🍽️ Covered Takeaway / Seating',
            accessibility: ['♿ Ground Floor'],
            cost: 25,
            completed: false
          },
          afternoon: {
            dualName: 'Musée de l’Orangerie',
            category: 'Art Gallery',
            time: '14:00 - 16:30',
            desc: 'View Claude Monet’s large Water Lilies murals in oval sunlit rooms.',
            weatherBadge: '🏛️ Indoor Gallery',
            accessibility: ['♿ Elevator & Ramps'],
            cost: 30,
            completed: false
          },
          evening: {
            dualName: 'Seine River Evening Sunset Cruise',
            category: 'Scenic Boat Tour',
            time: '18:00 - 20:00',
            desc: 'Glide past Eiffel Tower, Notre-Dame, and illuminated stone bridges.',
            weatherBadge: '🌆 River Breeze',
            accessibility: ['♿ Step-Free Boat Access'],
            cost: 45,
            completed: false
          }
        }
      ],
      packingList: [
        { id: 'pp1', item: 'Comfortable walking loafers or leather sneakers', checked: true, category: 'Footwear' },
        { id: 'pp2', item: 'Compact travel umbrella & stylish trench coat', checked: true, category: 'Clothing' },
        { id: 'pp3', item: 'Type C/E European plug adapters', checked: false, category: 'Electronics' }
      ],
      budgetBreakdown: {
        totalTripCost: 1850,
        dailyAverage: 462.50,
        perPersonTotal: 925.00,
        lodgingTotal: 960,
        diningTotal: 450,
        ticketsTotal: 260,
        transitTotal: 180,
        lodgingPct: 52,
        diningPct: 24,
        ticketsPct: 14,
        transitPct: 10
      }
    }
  ];

  let currentTripIndex = 0;
  let activeDayIndex = 0;
  let activeStayFilter = 'all';

  function getCurrentTrip() {
    return PRESET_TRIPS[currentTripIndex] || PRESET_TRIPS[0];
  }

  // ==========================================================================
  // 5. Toast Notification Engine
  // ==========================================================================
  function showToast(message) {
    let stack = document.getElementById('toastStack');
    if (!stack) {
      stack = document.createElement('div');
      stack.id = 'toastStack';
      stack.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 8px; pointer-events: none;';
      document.body.appendChild(stack);
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.cssText = 'background: #1e293b; color: #fff; padding: 12px 18px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); display: flex; align-items: center; gap: 8px; font-size: 0.9rem; pointer-events: auto; transition: all 0.3s ease; border: 1px solid rgba(255,255,255,0.1);';
    toast.innerHTML = `<span>✨</span><span>${message}</span>`;
    stack.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  // ==========================================================================
  // 6. Rendering Functions
  // ==========================================================================
  function populateTripDropdown() {
    const tripSelect = document.getElementById('tripSelect');
    if (!tripSelect) return;
    tripSelect.innerHTML = PRESET_TRIPS.map((trip, idx) =>
      `<option value="${idx}">${trip.destination} (${trip.durationDays} Days)</option>`
    ).join('');
    tripSelect.value = currentTripIndex;
  }

  function renderTripHero() {
    const trip = getCurrentTrip();
    const backdrop = document.getElementById('heroBackdrop');
    if (backdrop && trip.heroImage) {
      backdrop.style.backgroundImage = `url('${trip.heroImage}')`;
    }

    const heroTitle = document.getElementById('heroTitle');
    if (heroTitle) heroTitle.textContent = trip.title;

    const heroSubtitle = document.getElementById('heroSubtitle');
    if (heroSubtitle) heroSubtitle.textContent = trip.subtitle;

    const heroTripType = document.getElementById('heroTripType');
    if (heroTripType) heroTripType.textContent = trip.tripType;

    const heroDuration = document.getElementById('heroDuration');
    if (heroDuration) heroDuration.textContent = `${trip.durationDays} Days`;

    const heroWeatherText = document.getElementById('heroWeatherText');
    if (heroWeatherText) heroWeatherText.textContent = `${trip.weather.temp} • Weather Optimized`;

    const metricTravelers = document.getElementById('metricTravelers');
    if (metricTravelers) metricTravelers.textContent = trip.travelers.summary;

    const metricStay = document.getElementById('metricStay');
    if (metricStay && trip.stays.length) metricStay.textContent = trip.stays[0].name;

    const metricDailySpend = document.getElementById('metricDailySpend');
    if (metricDailySpend) metricDailySpend.textContent = `${formatMoney(trip.budgetBreakdown.dailyAverage)} / day`;

    const metricNeighborhood = document.getElementById('metricNeighborhood');
    if (metricNeighborhood && trip.days.length) metricNeighborhood.textContent = trip.days[0].neighborhood;
  }

  function renderItinerary() {
    const container = document.getElementById('itinerary');
    if (!container) return;

    const trip = getCurrentTrip();
    const day = trip.days[activeDayIndex] || trip.days[0];

    let dayPillsHtml = trip.days.map((d, idx) => `
      <button class="day-pill-btn ${idx === activeDayIndex ? 'active' : ''}" data-day-index="${idx}" type="button">
        <span class="pill-day-label">Day ${d.dayNumber}</span>
        <span class="pill-day-title">${d.neighborhood.split(',')[0]}</span>
      </button>
    `).join('');

    const phases = [
      { key: 'morning', label: 'Morning', badgeClass: 'phase-morning' },
      { key: 'lunch', label: 'Lunch Spot', badgeClass: 'phase-lunch' },
      { key: 'afternoon', label: 'Afternoon', badgeClass: 'phase-afternoon' },
      { key: 'evening', label: 'Evening', badgeClass: 'phase-evening' }
    ];

    let slotsHtml = phases.map(phase => {
      const slot = day[phase.key];
      if (!slot) return '';
      return `
        <div class="timeline-slot-card ${slot.completed ? 'completed' : ''}">
          <div class="slot-time-column">
            <span class="slot-phase-pill ${phase.badgeClass}">${phase.label}</span>
            <span class="slot-time-range">${slot.time}</span>
          </div>
          <div class="slot-content-column">
            <div class="slot-top-row">
              <div class="slot-name-group">
                <h3 class="dual-name-title">${slot.dualName}</h3>
              </div>
              <span class="slot-category-badge">${slot.category}</span>
            </div>
            <p class="slot-description">${slot.desc}</p>
            <div class="slot-flags-row">
              <span class="flag-chip weather-chip">${slot.weatherBadge}</span>
              ${slot.accessibility ? slot.accessibility.map(a => `<span class="flag-chip access-chip">${a}</span>`).join('') : ''}
              <span class="flag-chip cost-chip">${slot.cost === 0 ? 'Free Entry' : formatMoney(slot.cost)}</span>
            </div>
            <div class="slot-actions-bar">
              <label class="completion-check-label">
                <input type="checkbox" class="completion-checkbox" data-slot="${phase.key}" ${slot.completed ? 'checked' : ''}>
                <span>${slot.completed ? t('completed') : t('markCompleted')}</span>
              </label>
              <div class="slot-btn-group">
                <button class="btn btn-sm btn-secondary swap-btn" type="button" data-slot="${phase.key}">${t('btnSwap')}</button>
                <button class="btn btn-sm btn-secondary book-btn" type="button" onclick="window.showToast('${t('btnBook')}: Direct official reservation link loaded')">${t('btnBook')}</button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div class="itinerary-header-bar">
        <div class="day-pills-scroller">${dayPillsHtml}</div>
      </div>

      <div class="day-context-banner">
        <div class="context-group">
          <div class="context-icon-wrap geo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
          <div>
            <div class="context-title">${t('labelNeighborhoodCluster')}</div>
            <div class="context-value">${day.neighborhood}</div>
            <div class="context-subtext">${t('transitOptimizedSubtext')}</div>
          </div>
        </div>
        <div class="context-group">
          <div class="context-icon-wrap weather">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/></svg>
          </div>
          <div>
            <div class="context-title">${t('labelWeatherAdaptation')}</div>
            <div class="context-value">${day.weatherPlan}</div>
          </div>
        </div>
      </div>

      <div class="timeline-blocks-wrapper">${slotsHtml}</div>
    `;

    // Day pill listeners
    container.querySelectorAll('.day-pill-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.getAttribute('data-day-index'), 10);
        activeDayIndex = idx;
        renderItinerary();
      });
    });

    // Completion checkbox listeners
    container.querySelectorAll('.completion-checkbox').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const slotKey = e.target.getAttribute('data-slot');
        if (day[slotKey]) {
          day[slotKey].completed = e.target.checked;
          renderItinerary();
          showToast(e.target.checked ? 'Marked as completed' : 'Marked as pending');
          saveTripToSupabase(trip);
        }
      });
    });

    // Quick swap trigger to jump to Customize tab
    container.querySelectorAll('.swap-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const slotKey = e.currentTarget.getAttribute('data-slot');
        const customizeTabBtn = document.querySelector('[data-tab="customize"]');
        if (customizeTabBtn) customizeTabBtn.click();
        const slotSelect = document.getElementById('swapSlotSelect');
        if (slotSelect) slotSelect.value = slotKey;
        showToast(`Navigated to Customization Studio for ${slotKey} slot`);
      });
    });
  }

  function renderStays() {
    const container = document.getElementById('stays');
    if (!container) return;

    const trip = getCurrentTrip();

    const filteredStays = trip.stays.filter(s => {
      if (activeStayFilter === 'all') return true;
      return s.category === activeStayFilter;
    });

    let filterBarHtml = `
      <div class="filter-bar" style="display: flex; align-items: center; gap: 10px; margin-bottom: 1.5rem; flex-wrap: wrap;">
        <span style="font-weight: 600; color: #94a3b8; font-size: 0.9rem;">${t('filterBy')}</span>
        <button class="btn btn-sm ${activeStayFilter === 'all' ? 'btn-primary' : 'btn-secondary'}" data-stay-filter="all">${t('filterAll')}</button>
        <button class="btn btn-sm ${activeStayFilter === 'family' ? 'btn-primary' : 'btn-secondary'}" data-stay-filter="family">${t('filterFamilySuites')}</button>
        <button class="btn btn-sm ${activeStayFilter === 'accessible' ? 'btn-primary' : 'btn-secondary'}" data-stay-filter="accessible">${t('filterAccessible')}</button>
        <button class="btn btn-sm ${activeStayFilter === 'central' ? 'btn-primary' : 'btn-secondary'}" data-stay-filter="central">${t('filterCentral')}</button>
      </div>
    `;

    let staysCardsHtml = filteredStays.map(stay => `
      <div class="stay-card" style="border: 1px solid rgba(255,255,255,0.1); padding: 1.5rem; border-radius: 12px; margin-bottom: 1rem; background: var(--bg-card, #1e293b);">
        <div class="stay-body">
          <div class="stay-header-row" style="display: flex; justify-content: space-between; align-items: baseline;">
            <h3 class="stay-title" style="margin: 0;">${stay.name}</h3>
            <div>
              <span class="stay-rate" style="font-weight: 700; color: #10b981; font-size: 1.2rem;">${formatMoney(stay.pricePerNight)}</span>
              <span class="stay-rate-sub"> ${t('perNight')}</span>
            </div>
          </div>
          <p style="color: #94a3b8; margin: 0.25rem 0 0.75rem 0; font-size: 0.9rem;">${stay.neighborhood} • Rating: ★ ${stay.rating}</p>
          <div class="stay-fit-banner" style="color: #3b82f6; font-size: 0.9rem; font-weight: 600; margin-bottom: 0.5rem;">${stay.fitBanner}</div>
          <p class="stay-desc" style="color: #cbd5e1; line-height: 1.5; margin-bottom: 1rem;">${stay.description}</p>
          <div class="stay-features-list" style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1rem;">
            ${stay.features.map(f => `<span class="flag-chip family-chip" style="background: rgba(59,130,246,0.1); color: #60a5fa; padding: 4px 10px; border-radius: 100px; font-size: 0.8rem;">${f}</span>`).join('')}
          </div>
          <a href="${stay.bookingUrl}" target="_blank" rel="noopener" class="btn btn-primary" style="display: inline-block; padding: 8px 18px; text-decoration: none; border-radius: 6px;">${t('btnBook')}</a>
        </div>
      </div>
    `).join('');

    if (filteredStays.length === 0) {
      staysCardsHtml = `<div style="padding: 2rem; color: #94a3b8; text-align: center;">No stays match the selected filter. Showing all available options.</div>`;
    }

    container.innerHTML = `
      <div class="panel-header" style="margin-bottom: 1.5rem;">
        <div>
          <h2 class="panel-title">${t('staysHeaderTitle')}</h2>
          <p class="panel-subtitle" style="color: #94a3b8;">${t('staysHeaderSubtitle')}</p>
        </div>
      </div>
      ${filterBarHtml}
      <div class="stays-grid">${staysCardsHtml}</div>
    `;

    container.querySelectorAll('[data-stay-filter]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        activeStayFilter = e.target.getAttribute('data-stay-filter');
        renderStays();
      });
    });
  }

  function renderBudget() {
    const container = document.getElementById('budget');
    if (!container) return;

    const trip = getCurrentTrip();
    const b = trip.budgetBreakdown;

    container.innerHTML = `
      <div class="panel-header" style="margin-bottom: 1.5rem;">
        <div>
          <h2 class="panel-title">${t('budgetHeaderTitle')}</h2>
          <p class="panel-subtitle" style="color: #94a3b8;">${t('budgetHeaderSubtitle')}</p>
        </div>
      </div>

      <div class="budget-kpi-row" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
        <div class="kpi-card" style="background: var(--bg-card, #1e293b); padding: 1.25rem; border-radius: 10px; border: 1px solid rgba(255,255,255,0.08);">
          <span class="kpi-label" style="font-size: 0.85rem; color: #94a3b8;">${t('totalEstTripCost')}</span>
          <div class="kpi-number" style="font-size: 1.6rem; font-weight: 700; margin: 0.25rem 0;">${formatMoney(b.totalTripCost)}</div>
          <span class="kpi-caption" style="font-size: 0.8rem; color: #64748b;">${t('includesAllExpenses')}</span>
        </div>
        <div class="kpi-card" style="background: var(--bg-card, #1e293b); padding: 1.25rem; border-radius: 10px; border: 1px solid rgba(255,255,255,0.08);">
          <span class="kpi-label" style="font-size: 0.85rem; color: #94a3b8;">${t('dailySpendAverage')}</span>
          <div class="kpi-number" style="font-size: 1.6rem; font-weight: 700; margin: 0.25rem 0;">${formatMoney(b.dailyAverage)}</div>
          <span class="kpi-caption" style="font-size: 0.8rem; color: #64748b;">Per day across group</span>
        </div>
        <div class="kpi-card" style="background: var(--bg-card, #1e293b); padding: 1.25rem; border-radius: 10px; border: 1px solid rgba(255,255,255,0.08);">
          <span class="kpi-label" style="font-size: 0.85rem; color: #94a3b8;">${t('perPersonEstimate')}</span>
          <div class="kpi-number" style="font-size: 1.6rem; font-weight: 700; margin: 0.25rem 0;">${formatMoney(b.perPersonTotal)}</div>
          <span class="kpi-caption" style="font-size: 0.8rem; color: #64748b;">${t('perTravelerTotal')}</span>
        </div>
        <div class="kpi-card" style="background: var(--bg-card, #1e293b); padding: 1.25rem; border-radius: 10px; border: 1px solid rgba(255,255,255,0.08);">
          <span class="kpi-label" style="font-size: 0.85rem; color: #94a3b8;">${t('budgetStatus')}</span>
          <div class="kpi-number text-success" style="font-size: 1.6rem; font-weight: 700; color: #10b981; margin: 0.25rem 0;">${t('onTrack')}</div>
          <span class="kpi-caption" style="font-size: 0.8rem; color: #64748b;">${t('alignedWithTier')}</span>
        </div>
      </div>

      <div class="table-card" style="background: var(--bg-card, #1e293b); padding: 1.5rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08);">
        <h3 class="card-title" style="margin-top: 0;">${t('dailyCostBreakdownTitle')}</h3>
        <div class="table-responsive">
          <table class="cost-table" style="width: 100%; border-collapse: collapse; text-align: left;">
            <thead>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); color: #94a3b8;">
                <th style="padding: 10px;">${t('thDay')}</th>
                <th style="padding: 10px;">${t('thNeighborhood')}</th>
                <th style="padding: 10px;">${t('thMeals')}</th>
                <th style="padding: 10px;">${t('thTickets')}</th>
                <th style="padding: 10px;">${t('thTransit')}</th>
                <th style="padding: 10px;">${t('thDailyTotal')}</th>
              </tr>
            </thead>
            <tbody>
              ${trip.days.map(d => `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                  <td style="padding: 10px;"><strong>${d.dateLabel}</strong></td>
                  <td style="padding: 10px; color: #cbd5e1;">${d.neighborhood}</td>
                  <td style="padding: 10px; color: #cbd5e1;">${formatMoney(120)}</td>
                  <td style="padding: 10px; color: #cbd5e1;">${formatMoney(75)}</td>
                  <td style="padding: 10px; color: #cbd5e1;">${formatMoney(35)}</td>
                  <td style="padding: 10px;"><strong>${formatMoney(230)}</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderCustomizeConsole() {
    const container = document.getElementById('customize');
    if (!container) return;

    const trip = getCurrentTrip();

    container.innerHTML = `
      <div class="panel-header" style="margin-bottom: 1.5rem;">
        <div>
          <h2 class="panel-title">${t('customizeHeaderTitle')}</h2>
          <p class="panel-subtitle" style="color: #94a3b8;">${t('customizeHeaderSubtitle')}</p>
        </div>
      </div>

      <!-- Pace Selector Card -->
      <div style="background: var(--bg-card, #1e293b); padding: 1.5rem; border-radius: 12px; margin-bottom: 1.5rem; border: 1px solid rgba(255,255,255,0.08);">
        <h3 style="margin-top: 0;">${t('paceControlTitle')}</h3>
        <p style="color: #94a3b8; font-size: 0.9rem;">${t('paceControlSubtitle')}</p>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; margin-top: 1rem;">
          <div class="pace-card ${trip.pace === 'relaxed' ? 'active' : ''}" data-pace="relaxed" style="border: 1px solid ${trip.pace === 'relaxed' ? '#3b82f6' : 'rgba(255,255,255,0.1)'}; padding: 1rem; border-radius: 8px; cursor: pointer; background: ${trip.pace === 'relaxed' ? 'rgba(59,130,246,0.1)' : 'transparent'};">
            <div style="font-weight: 700; margin-bottom: 0.25rem;">${t('paceRelaxedName')}</div>
            <span style="font-size: 0.75rem; background: #2563eb; color: #fff; padding: 2px 8px; border-radius: 4px;">${t('paceRelaxedTag')}</span>
            <p style="font-size: 0.85rem; color: #cbd5e1; margin-top: 0.5rem;">${t('paceRelaxedDesc')}</p>
          </div>
          <div class="pace-card ${trip.pace === 'balanced' || !trip.pace ? 'active' : ''}" data-pace="balanced" style="border: 1px solid ${trip.pace === 'balanced' || !trip.pace ? '#3b82f6' : 'rgba(255,255,255,0.1)'}; padding: 1rem; border-radius: 8px; cursor: pointer; background: ${trip.pace === 'balanced' || !trip.pace ? 'rgba(59,130,246,0.1)' : 'transparent'};">
            <div style="font-weight: 700; margin-bottom: 0.25rem;">${t('paceBalancedName')}</div>
            <span style="font-size: 0.75rem; background: #059669; color: #fff; padding: 2px 8px; border-radius: 4px;">${t('paceBalancedTag')}</span>
            <p style="font-size: 0.85rem; color: #cbd5e1; margin-top: 0.5rem;">${t('paceBalancedDesc')}</p>
          </div>
          <div class="pace-card ${trip.pace === 'packed' ? 'active' : ''}" data-pace="packed" style="border: 1px solid ${trip.pace === 'packed' ? '#3b82f6' : 'rgba(255,255,255,0.1)'}; padding: 1rem; border-radius: 8px; cursor: pointer; background: ${trip.pace === 'packed' ? 'rgba(59,130,246,0.1)' : 'transparent'};">
            <div style="font-weight: 700; margin-bottom: 0.25rem;">${t('pacePackedName')}</div>
            <span style="font-size: 0.75rem; background: #d97706; color: #fff; padding: 2px 8px; border-radius: 4px;">${t('pacePackedTag')}</span>
            <p style="font-size: 0.85rem; color: #cbd5e1; margin-top: 0.5rem;">${t('pacePackedDesc')}</p>
          </div>
        </div>
        <button class="btn btn-primary" id="btnApplyPace" style="margin-top: 1.25rem; padding: 8px 20px;">${t('btnApplyPace')}</button>
      </div>

      <!-- Swap Activity Console -->
      <div style="background: var(--bg-card, #1e293b); padding: 1.5rem; border-radius: 12px; margin-bottom: 1.5rem; border: 1px solid rgba(255,255,255,0.08);">
        <h3 style="margin-top: 0;">${t('swapConsoleTitle')}</h3>
        <p style="color: #94a3b8; font-size: 0.9rem;">${t('swapConsoleSubtitle')}</p>
        
        <div style="display: flex; gap: 1rem; margin-top: 1rem; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 200px;">
            <label style="display: block; color: #cbd5e1; font-size: 0.85rem; margin-bottom: 0.25rem;">${t('labelTargetDay')}</label>
            <select id="swapDaySelect" style="width: 100%; padding: 8px 12px; border-radius: 6px; background: #0f172a; color: #fff; border: 1px solid rgba(255,255,255,0.2);">
              ${trip.days.map((d, i) => `<option value="${i}">Day ${d.dayNumber} -${d.neighborhood.split(',')[0]}</option>`).join('')}
            </select>
          </div>
          <div style="flex: 1; min-width: 200px;">
            <label style="display: block; color: #cbd5e1; font-size: 0.85rem; margin-bottom: 0.25rem;">${t('labelTimeSlot')}</label>
            <select id="swapSlotSelect" style="width: 100%; padding: 8px 12px; border-radius: 6px; background: #0f172a; color: #fff; border: 1px solid rgba(255,255,255,0.2);">
              <option value="morning">${t('slotMorning')}</option>
              <option value="lunch">${t('slotLunch')}</option>
              <option value="afternoon">${t('slotAfternoon')}</option>
              <option value="evening">${t('slotEvening')}</option>
            </select>
          </div>
        </div>

        <div style="margin-top: 1.5rem;">
          <h4 style="margin: 0 0 0.75rem 0; color: #38bdf8;">${t('labelCuratedAlternates')}</h4>
          <div id="alternatesList" style="display: flex; flex-direction: column; gap: 0.75rem;">
            <!-- Alternates populated dynamically -->
          </div>
        </div>
      </div>

      <!-- Booking Guidance Card -->
      <div style="background: var(--bg-card, #1e293b); padding: 1.5rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08);">
        <h3 style="margin-top: 0;">${t('bookingGuidanceTitle')}</h3>
        <p style="color: #94a3b8; font-size: 0.9rem;">${t('bookingGuidanceSubtitle')}</p>
        <ul style="color: #cbd5e1; margin-top: 0.75rem; padding-left: 1.25rem; line-height: 1.7; font-size: 0.9rem;">
          <li><strong>Official Transit:</strong> Purchase regional train & subway IC cards directly at automated station kiosks or on Apple/Google Wallet.</li>
          <li><strong>Museum & Entry Tickets:</strong> Reserve timed-entry tickets through official venue portals to skip main queues.</li>
          <li><strong>Restaurant Reservations:</strong> Reserve popular local dining 2-4 weeks in advance through official hotel concierges or direct venue sites.</li>
        </ul>
      </div>
    `;

    // Pace selection interaction
    let selectedPace = trip.pace || 'balanced';
    container.querySelectorAll('.pace-card').forEach(card => {
      card.addEventListener('click', (e) => {
        container.querySelectorAll('.pace-card').forEach(c => {
          c.style.border = '1px solid rgba(255,255,255,0.1)';
          c.style.background = 'transparent';
        });
        const target = e.currentTarget;
        target.style.border = '1px solid #3b82f6';
        target.style.background = 'rgba(59,130,246,0.1)';
        selectedPace = target.getAttribute('data-pace');
      });
    });

    const btnApplyPace = container.querySelector('#btnApplyPace');
    if (btnApplyPace) {
      btnApplyPace.addEventListener('click', () => {
        trip.pace = selectedPace;
        showToast(`Pace set to ${selectedPace.toUpperCase()}! Schedule updated.`);
        saveTripToSupabase(trip);
        renderItinerary();
      });
    }

    // Dynamic Alternates Render
    const daySelect = container.querySelector('#swapDaySelect');
    const slotSelect = container.querySelector('#swapSlotSelect');
    const alternatesList = container.querySelector('#alternatesList');

    function updateAlternates() {
      if (!alternatesList || !daySelect || !slotSelect) return;
      const targetDayIdx = parseInt(daySelect.value, 10);
      const targetSlot = slotSelect.value;
      const currentDay = trip.days[targetDayIdx];
      const currentItem = currentDay[targetSlot];

      const alternates = [
        {
          dualName: 'Edo-Tokyo Museum & Craft Studio',
          category: 'Culture & History',
          desc: 'Interactive life-sized model exhibits of Tokyo during the Edo period.',
          weatherBadge: '🏛️ Indoor Air-Conditioned',
          cost: 20
        },
        {
          dualName: 'Tsukiji Outer Market Food Exploration',
          category: 'Street Food & Culinary',
          desc: 'Fresh tamagoyaki, grilled skewers, and matcha tea tasting stalls.',
          weatherBadge: '🌤️ Covered Market Walk',
          cost: 30
        },
        {
          dualName: 'Rikugien Traditional Japanese Garden',
          category: 'Nature & Tea House',
          desc: 'Edo-period stroll garden featuring a picturesque central pond and matcha tea house.',
          weatherBadge: '🌳 Shaded Outdoor Paths',
          cost: 10
        }
      ];

      alternatesList.innerHTML = alternates.map((alt, idx) => `
        <div style="background: #0f172a; padding: 1rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap;">
          <div style="flex: 1;">
            <div style="font-weight: 700; color: #f8fafc;">${alt.dualName}</div>
            <p style="color: #94a3b8; font-size: 0.85rem; margin: 4px 0;">${alt.desc}</p>
            <div style="display: flex; gap: 6px; font-size: 0.75rem;">
              <span style="background: rgba(56,189,248,0.1); color: #38bdf8; padding: 2px 6px; border-radius: 4px;">${alt.weatherBadge}</span>
              <span style="background: rgba(255,255,255,0.08); color: #cbd5e1; padding: 2px 6px; border-radius: 4px;">${alt.cost === 0 ? 'Free' : formatMoney(alt.cost)}</span>
            </div>
          </div>
          <button class="btn btn-sm btn-primary apply-swap-btn" data-alt-idx="${idx}" type="button">${t('btnSelectThis')}</button>
        </div>
      `).join('');

      alternatesList.querySelectorAll('.apply-swap-btn').forEach(b => {
        b.addEventListener('click', (e) => {
          const altIdx = parseInt(e.currentTarget.getAttribute('data-alt-idx'), 10);
          const selectedAlt = alternates[altIdx];
          
          if (currentItem) {
            currentItem.dualName = selectedAlt.dualName;
            currentItem.category = selectedAlt.category;
            currentItem.desc = selectedAlt.desc;
            currentItem.weatherBadge = selectedAlt.weatherBadge;
            currentItem.cost = selectedAlt.cost;
            currentItem.completed = false;

            showToast(`Swapped slot to: ${selectedAlt.dualName}`);
            saveTripToSupabase(trip);
            renderItinerary();
            renderCustomizeConsole();
          }
        });
      });
    }

    if (daySelect && slotSelect) {
      daySelect.addEventListener('change', updateAlternates);
      slotSelect.addEventListener('change', updateAlternates);
      updateAlternates();
    }
  }

  function renderPacking() {
    const container = document.getElementById('packing');
    if (!container) return;

    const trip = getCurrentTrip();
    const items = trip.packingList || [
      { id: '1', item: 'Passport & Visa Documents', checked: true, category: 'Essentials' },
      { id: '2', item: 'Universal Power Adapter', checked: true, category: 'Electronics' },
      { id: '3', item: 'Comfortable Walking Shoes', checked: false, category: 'Footwear' }
    ];

    container.innerHTML = `
      <div class="panel-header" style="margin-bottom: 1.5rem;">
        <div>
          <h2 class="panel-title">${t('packingHeaderTitle')}</h2>
          <p class="panel-subtitle" style="color: #94a3b8;">${t('packingHeaderSubtitle')}</p>
        </div>
      </div>

      <div style="background: var(--bg-card, #1e293b); padding: 1.5rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08);">
        <div style="display: flex; gap: 8px; margin-bottom: 1.25rem;">
          <input type="text" id="newPackingInput" placeholder="Add custom packing item..." style="flex: 1; padding: 8px 12px; border-radius: 6px; background: #0f172a; border: 1px solid rgba(255,255,255,0.2); color: #fff;">
          <button id="addPackingBtn" class="btn btn-primary" type="button">Add Item</button>
        </div>

        <ul style="list-style: none; padding: 0; margin: 0;">
          ${items.map((p, idx) => `
            <li style="display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
              <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; color: ${p.checked ? '#94a3b8' : '#f8fafc'}; text-decoration: ${p.checked ? 'line-through' : 'none'};">
                <input type="checkbox" class="packing-chk" data-idx="${idx}" ${p.checked ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;">
                <span>${p.item}</span>
              </label>
              ${p.category ? `<span style="font-size: 0.75rem; background: rgba(255,255,255,0.08); padding: 2px 8px; border-radius: 4px; color: #94a3b8;">${p.category}</span>` : ''}
            </li>
          `).join('')}
        </ul>
      </div>
    `;

    container.querySelectorAll('.packing-chk').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const idx = parseInt(e.target.getAttribute('data-idx'), 10);
        if (items[idx]) {
          items[idx].checked = e.target.checked;
          renderPacking();
          saveTripToSupabase(trip);
        }
      });
    });

    const addBtn = container.querySelector('#addPackingBtn');
    const input = container.querySelector('#newPackingInput');
    if (addBtn && input) {
      const handleAdd = () => {
        const val = input.value.trim();
        if (val) {
          items.push({ id: `p-${Date.now()}`, item: val, checked: false, category: 'Personal' });
          trip.packingList = items;
          renderPacking();
          saveTripToSupabase(trip);
          showToast('Added to packing list');
        }
      };
      addBtn.addEventListener('click', handleAdd);
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleAdd();
      });
    }
  }

  function renderAllViews() {
    populateTripDropdown();
    renderTripHero();
    renderItinerary();
    renderStays();
    renderBudget();
    renderCustomizeConsole();
    renderPacking();
  }

  // ==========================================================================
  // 7. Modal Engine & Navigation Handlers
  // ==========================================================================
  function openModal(modalEl) {
    if (modalEl) modalEl.classList.add('active');
  }

  function closeModal(modalEl) {
    if (modalEl) modalEl.classList.remove('active');
  }

  function initEventListeners() {
    window.showToast = showToast;

    // Tab Navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetTab = e.currentTarget.getAttribute('data-tab');
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content-panel').forEach(p => p.classList.remove('active'));

        e.currentTarget.classList.add('active');
        const panel = document.getElementById(targetTab);
        if (panel) panel.classList.add('active');
      });
    });

    // Header Print Button
    const btnPrint = document.getElementById('btnPrint');
    if (btnPrint) {
      btnPrint.addEventListener('click', () => {
        window.print();
      });
    }

    // Header Adjust Pace Button
    const btnAdjustPace = document.getElementById('btnAdjustPace');
    if (btnAdjustPace) {
      btnAdjustPace.addEventListener('click', () => {
        const customizeTabBtn = document.querySelector('[data-tab="customize"]');
        if (customizeTabBtn) customizeTabBtn.click();
      });
    }

    // Theme Toggle
    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const html = document.documentElement;
        const currentTheme = html.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('tripcraft_theme', newTheme);
      });
    }

    // Language Selector
    const langSelect = document.getElementById('langSelect');
    if (langSelect) {
      langSelect.value = currentLang;
      langSelect.addEventListener('change', (e) => {
        applyLanguage(e.target.value);
      });
    }

    // Currency Selector
    const currencySelect = document.getElementById('currencySelect');
    if (currencySelect) {
      currencySelect.value = currentCurrency;
      const badge = document.getElementById('currencySymbolBadge');
      if (badge && CURRENCIES[currentCurrency]) {
        badge.textContent = CURRENCIES[currentCurrency].symbol;
      }

      currencySelect.addEventListener('change', (e) => {
        currentCurrency = e.target.value;
        localStorage.setItem('tripcraft_currency', currentCurrency);
        if (badge && CURRENCIES[currentCurrency]) {
          badge.textContent = CURRENCIES[currentCurrency].symbol;
        }
        renderAllViews();
      });
    }

    // Modal Triggers
    const btnNewTrip = document.getElementById('btnNewTrip');
    if (btnNewTrip) {
      btnNewTrip.addEventListener('click', () => openModal(document.getElementById('newTripModal')));
    }

    const btnLoginModal = document.getElementById('btnLoginModal');
    if (btnLoginModal) {
      btnLoginModal.addEventListener('click', () => openModal(document.getElementById('loginModal')));
    }

    const btnRegisterModal = document.getElementById('btnRegisterModal');
    if (btnRegisterModal) {
      btnRegisterModal.addEventListener('click', () => openModal(document.getElementById('registerModal')));
    }

    // Modal Close Buttons
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal-backdrop');
        closeModal(modal);
      });
    });

    // Backdrop Clicks
    document.querySelectorAll('.modal-backdrop').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal(modal);
      });
    });

    // Auth Form Handlers
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail')?.value;
        const password = document.getElementById('loginPassword')?.value;
        if (!email || !password) return;

        if (supabase) {
          try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
              showToast(`Login failed: ${error.message}`);
            } else {
              showToast('Logged in successfully!');
              
              const userObj = {
                id: data.user.id,
                email: data.user.email,
                name: data.user.user_metadata?.full_name || data.user.email.split('@')[0]
              };
              
              handleLoginSuccess(userObj);
              closeModal(document.getElementById('loginModal'));
              loginForm.reset();
            }
          } catch (err) {
            console.error('Login error:', err);
          }
        } else {
          // Fallback UI Simulation if Supabase is disconnected
          const demoUser = { id: 'demo-123', email, name: email.split('@')[0] };
          handleLoginSuccess(demoUser);
          closeModal(document.getElementById('loginModal'));
          loginForm.reset();
        }
      });
    }

    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
      registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('registerEmail')?.value;
        const password = document.getElementById('registerPassword')?.value;
        const fullName = document.getElementById('registerName')?.value || 'Traveler';

        if (!email || !password) return;

        if (supabase) {
          try {
            const { data, error } = await supabase.auth.signUp({
              email,
              password,
              options: { data: { full_name: fullName } }
            });
            if (error) {
              showToast(`Registration failed: ${error.message}`);
            } else {
              showToast('Account created successfully!');
              
              const userObj = {
                id: data.user?.id || 'new-user',
                email: email,
                name: fullName
              };
              
              handleLoginSuccess(userObj);
              closeModal(document.getElementById('registerModal'));
              registerForm.reset();
            }
          } catch (err) {
            console.error('Registration error:', err);
          }
        }
      });
    }

    // New Trip Form Submit
    const newTripForm = document.getElementById('newTripForm');
    if (newTripForm) {
      newTripForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const dest = document.getElementById('inputDestination')?.value || 'Custom Voyage';
        const duration = parseInt(document.getElementById('inputDuration')?.value, 10) || 3;
        const adults = parseInt(document.getElementById('inputAdults')?.value, 10) || 2;
        const children = parseInt(document.getElementById('inputChildren')?.value, 10) || 0;
        const type = document.getElementById('selectTripType')?.value || 'Family Vacation';

        const newTripObj = {
          id: `trip-custom-${Date.now()}`,
          destination: dest,
          country: 'Global',
          heroImage: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1600&q=80',
          title: `${dest} Expedition`,
          subtitle: `Custom tailored ${duration}-day journey focusing on ${type.toLowerCase()}.`,
          tripType: type,
          durationDays: duration,
          travelers: {
            total: adults + children,
            adults: adults,
            children: children,
            summary: `${adults + children} Travelers (${adults} Adults, ${children} Kids)`
          },
          budgetTier: 'moderate',
          pace: 'balanced',
          weather: { temp: '22°C', condition: 'Pleasant', icon: '☀️', notes: 'Optimized schedule.' },
          stays: [
            {
              id: `stay-${Date.now()}`,
              name: `Central Suite ${dest.split(',')[0]}`,
              type: 'Boutique Stay',
              neighborhood: 'City Center',
              rating: '4.88',
              pricePerNight: 180,
              category: 'central',
              fitBanner: '✓ Recommended match for your group',
              features: ['📍 Central Access', '👨‍👩‍👧 Family Preferred'],
              bookingUrl: '#',
              description: 'Comfortable accommodation close to public transit and major city sights.'
            }
          ],
          days: Array.from({ length: duration }, (_, i) => ({
            dayNumber: i + 1,
            dateLabel: `Day ${i + 1}`,
            neighborhood: `${dest.split(',')[0]} Highlight District`,
            weatherPlan: '☀️ Weather-optimized for walking and exploration.',
            morning: {
              dualName: 'Morning Exploration',
              category: 'Sightseeing',
              time: '09:00 - 12:00',
              desc: 'Visit main city attractions and landmarks.',
              weatherBadge: '☀️ Optimal Weather',
              accessibility: ['♿ Accessible'],
              cost: 20,
              completed: false
            },
            lunch: {
              dualName: 'Local Lunch',
              category: 'Dining',
              time: '12:30 - 13:30',
              desc: 'Sample local cuisine.',
              weatherBadge: '🍽️ Indoor',
              cost: 25,
              completed: false
            },
            afternoon: {
              dualName: 'Cultural Immersion',
              category: 'Culture',
              time: '14:00 - 17:00',
              desc: 'Museums, galleries or local markets.',
              weatherBadge: '🏛️ Indoor/Outdoor',
              cost: 15,
              completed: false
            },
            evening: {
              dualName: 'Evening Entertainment',
              category: 'Leisure',
              time: '18:30 - 21:00',
              desc: 'Dinner and nighttime stroll.',
              weatherBadge: '🌆 Cool Breeze',
              cost: 40,
              completed: false
            }
          })),
          packingList: [
            { id: 'c1', item: 'Travel Documents & ID', checked: false, category: 'Essentials' },
            { id: 'c2', item: 'Comfortable walking shoes', checked: false, category: 'Footwear' },
            { id: 'c3', item: 'Universal Power Adapter', checked: false, category: 'Electronics' }
          ],
          budgetBreakdown: {
            totalTripCost: duration * 150 * (adults + children),
            dailyAverage: 150 * (adults + children),
            perPersonTotal: duration * 150,
            lodgingTotal: duration * 80 * adults,
            diningTotal: duration * 40 * (adults + children),
            ticketsTotal: duration * 20 * (adults + children),
            transitTotal: duration * 10 * (adults + children),
            lodgingPct: 50,
            diningPct: 25,
            ticketsPct: 15,
            transitPct: 10
          }
        };

        PRESET_TRIPS.unshift(newTripObj);
        currentTripIndex = 0;
        renderAllViews();
        saveTripToSupabase(newTripObj);
        closeModal(document.getElementById('newTripModal'));
        showToast('New trip generated successfully!');
        newTripForm.reset();
      });
    }
  }

  // 8. Auto-Login Check on Page Load
  document.addEventListener('DOMContentLoaded', () => {
    initEventListeners();
    applyLanguage(currentLang);
    
    const savedUser = localStorage.getItem('tripcraft_user');
    if (savedUser) {
      try {
        const userObj = JSON.parse(savedUser);
        handleLoginSuccess(userObj);
      } catch (err) {
        console.error('Error parsing saved user session:', err);
      }
    } else {
      // Revert to demo guest state if no user
      const authNavGroup = document.getElementById('authNavGroup');
      const userNavGroup = document.getElementById('userNavGroup');
      if (authNavGroup) authNavGroup.style.display = 'flex';
      if (userNavGroup) userNavGroup.style.display = 'none';
      renderAllViews();
    }
  });

})();