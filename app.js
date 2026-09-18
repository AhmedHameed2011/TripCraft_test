/**
 * TripCraft — Intelligent Travel Planner & Itinerary Studio
 * Master Client Application Script
 */

(function() {
  'use strict';

// الاستفادة من عميل Supabase المنشأ في supabase-config.js
  const supabase = window.supabaseClient || null;
  let currentUser = null;

  // ==========================================================================
  // 1. إدارة الهوية والتحقق (Authentication Engine)
  // ==========================================================================
  async function initAuth() {
    if (!supabase) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        currentUser = session.user;
        updateAuthUI(currentUser);
        await syncUserTripsFromSupabase();
      } else {
        updateAuthUI(null);
      }

      supabase.auth.onAuthStateChange(async (event, session) => {
        if (session) {
          currentUser = session.user;
          updateAuthUI(currentUser);
          await syncUserTripsFromSupabase();
        } else {
          currentUser = null;
          updateAuthUI(null);
        }
      });
    } catch (err) {
      console.error('Error initializing Supabase Auth:', err);
    }
  }

  function updateAuthUI(user) {
    const authNavGroup = document.getElementById('authNavGroup');
    const userNavGroup = document.getElementById('userNavGroup');
    const userNameSpan = document.getElementById('userDisplayName');

    if (user) {
      if (authNavGroup) authNavGroup.style.display = 'none';
      if (userNavGroup) userNavGroup.style.display = 'flex';
      const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Traveler';
      if (userNameSpan) userNameSpan.textContent = `${t('welcomeUser') || 'Welcome,'} ${name}`;
    } else {
      if (authNavGroup) authNavGroup.style.display = 'flex';
      if (userNavGroup) userNavGroup.style.display = 'none';
      if (userNameSpan) userNameSpan.textContent = '';
    }
  }

  async function syncUserTripsFromSupabase() {
    if (!supabase || !currentUser) return;
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch user trips:', error);
        return;
      }

      if (data && data.length > 0) {
        const cloudTrips = data.map(row => row.trip_data);
        cloudTrips.forEach(ct => {
          const index = PRESET_TRIPS.findIndex(pt => pt.id === ct.id);
          if (index !== -1) {
            PRESET_TRIPS[index] = ct;
          } else {
            PRESET_TRIPS.unshift(ct);
          }
        });
        populateTripSelector();
        renderTripHero();
        renderItinerary();
        renderStays();
        renderBudget();
        renderCustomizeConsole();
        renderPacking();
      }
    } catch (err) {
      console.error('Error syncing trips:', err);
    }
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
        showToast('Error syncing trip to cloud.', 'error');
      } else {
        showToast('Trip synced to your account successfully!', 'success');
      }
    } catch (err) {
      console.error('Save to Supabase error:', err);
    }
  }





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
      labelNeighborhoodCluster: "Geographic Neighborhood Cluster",
      transitOptimizedSubtext: "Activities grouped within 1.2km to minimize walking and transit time for families.",
      labelWeatherAdaptation: "Weather Adaptation Plan",
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
      perNight: "/ night",
      btnLogin: "Login",
      btnRegister: "Register"
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
      labelNeighborhoodCluster: "التجمع الجغرافي للحي",
      transitOptimizedSubtext: "تم تجميع الأنشطة في نطاق 1.2 كم لتقليل وقت التنقل والمشي للعائلات.",
      labelWeatherAdaptation: "خطة التكيف مع الطقس",
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
      perNight: "/ ليلة",
      btnLogin: "تسجيل الدخول",
      btnRegister: "إنشاء حساب"
    },
    es: {
      tagline: "Planificador Personal de Viajes",
      selectTrip: "Seleccionar Viaje",
      NewTrip: "Planificar Nuevo Viaje",
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
      btnLogin: "Iniciar Sesión",
      btnRegister: "Registrarse"
    },
    fr: {
      tagline: "Planificateur de Voyage Personnel",
      selectTrip: "Sélectionner le Voyage",
      NewTrip: "Nouveau Voyage",
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
      btnLogin: "Connexion",
      btnRegister: "S'inscrire"
    },
    ja: {
      tagline: "パーソナル旅行プランナー",
      selectTrip: "旅行を選択",
      NewTrip: "新しい旅を計画",
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
      btnLogin: "ログイン",
      btnRegister: "新規登録"
    },
    de: {
      tagline: "Persönlicher Reiseplaner",
      selectTrip: "Reise Auswählen",
      NewTrip: "Neue Reise Planen",
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
      btnLogin: "Anmelden",
      btnRegister: "Registrieren"
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
  // 3. Preset Rich Trips Data Store
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
          fitBanner: '✓ Fits 4 Guests (Family Suite with Japanese Bunk Beds)',
          features: ['👶 Stroller-Friendly', '♿ Elevator & Level Entry', '👨‍👩‍👧 Family Kitchen', '📍 2-min Walk to Asakusa Station'],
          bookingUrl: 'https://mimaruhotels.com/en/hotel/asakusa-station/',
          description: 'Spacious Japanese apartment hotel tailor-made for families with separate living spaces, coin laundry, and immediate access to the Ginza line.'
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
  // 4. Toast Notification Engine
  // ==========================================================================
  function showToast(message) {
    const stack = document.getElementById('toastStack');
    if (!stack) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>✨</span><span>${message}</span>`;
    stack.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  // ==========================================================================
  // 5. Render Functions
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
                <button class="btn btn-sm btn-secondary" type="button" onclick="window.showToast('${t('btnSwap')} triggered')">${t('btnSwap')}</button>
                <button class="btn btn-sm btn-secondary" type="button" onclick="window.showToast('${t('btnBook')} triggered')">${t('btnBook')}</button>
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
        }
      });
    });
  }

  function renderStays() {
    const container = document.getElementById('stays');
    if (!container) return;

    const trip = getCurrentTrip();

    let staysCardsHtml = trip.stays.map(stay => `
      <div class="stay-card">
        <div class="stay-image-wrap">
          <div class="stay-rating-overlay">★ ${stay.rating}</div>
        </div>
        <div class="stay-body">
          <div class="stay-header-row">
            <h3 class="stay-title">${stay.name}</h3>
            <div>
              <span class="stay-rate">${formatMoney(stay.pricePerNight)}</span>
              <span class="stay-rate-sub"> ${t('perNight')}</span>
            </div>
          </div>
          <div class="stay-fit-banner">${stay.fitBanner}</div>
          <p class="stay-desc">${stay.description}</p>
          <div class="stay-features-list">
            ${stay.features.map(f => `<span class="flag-chip family-chip">${f}</span>`).join('')}
          </div>
          <a href="${stay.bookingUrl}" target="_blank" rel="noopener" class="btn btn-primary btn-block">${t('btnBook')}</a>
        </div>
      </div>
    `).join('');

    container.innerHTML = `
      <div class="panel-header">
        <div>
          <h2 class="panel-title">${t('staysHeaderTitle')}</h2>
          <p class="panel-subtitle">${t('staysHeaderSubtitle')}</p>
        </div>
        <div class="stays-filter-pill-bar">
          <span class="filter-label">${t('filterBy')}</span>
          <button class="pill-btn active" type="button">${t('filterAll')}</button>
          <button class="pill-btn" type="button">${t('filterFamilySuites')}</button>
          <button class="pill-btn" type="button">${t('filterAccessible')}</button>
          <button class="pill-btn" type="button">${t('filterCentral')}</button>
        </div>
      </div>
      <div class="stays-grid">${staysCardsHtml}</div>
    `;
  }

  function renderBudget() {
    const container = document.getElementById('budget');
    if (!container) return;

    const trip = getCurrentTrip();
    const b = trip.budgetBreakdown;

    container.innerHTML = `
      <div class="panel-header">
        <div>
          <h2 class="panel-title">${t('budgetHeaderTitle')}</h2>
          <p class="panel-subtitle">${t('budgetHeaderSubtitle')}</p>
        </div>
      </div>

      <div class="budget-kpi-row">
        <div class="kpi-card">
          <span class="kpi-label">${t('totalEstTripCost')}</span>
          <div class="kpi-number">${formatMoney(b.totalTripCost)}</div>
          <span class="kpi-caption">${t('includesAllExpenses')}</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">${t('dailySpendAverage')}</span>
          <div class="kpi-number">${formatMoney(b.dailyAverage)}</div>
          <span class="kpi-caption">Per day across group</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">${t('perPersonEstimate')}</span>
          <div class="kpi-number">${formatMoney(b.perPersonTotal)}</div>
          <span class="kpi-caption">${t('perTravelerTotal')}</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">${t('budgetStatus')}</span>
          <div class="kpi-number text-success">${t('onTrack')}</div>
          <span class="kpi-caption">${t('alignedWithTier')}</span>
        </div>
      </div>

      <div class="expense-breakdown-card">
        <h3 class="card-title">${t('categoryBreakdownTitle')}</h3>
        <div class="progress-bar-segmented">
          <div class="seg-lodging" style="width: ${b.lodgingPct}%"></div>
          <div class="seg-dining" style="width: ${b.diningPct}%"></div>
          <div class="seg-tickets" style="width: ${b.ticketsPct}%"></div>
          <div class="seg-transit" style="width: ${b.transitPct}%"></div>
        </div>
        <div class="expense-legend-row">
          <div class="legend-item"><span class="dot lodging"></span> ${t('catLodging')} (${b.lodgingPct}%) - ${formatMoney(b.lodgingTotal)}</div>
          <div class="legend-item"><span class="dot dining"></span> ${t('catDining')} (${b.diningPct}%) - ${formatMoney(b.diningTotal)}</div>
          <div class="legend-item"><span class="dot tickets"></span> ${t('catTickets')} (${b.ticketsPct}%) - ${formatMoney(b.ticketsTotal)}</div>
          <div class="legend-item"><span class="dot transit"></span> ${t('catTransit')} (${b.transitPct}%) - ${formatMoney(b.transitTotal)}</div>
        </div>
      </div>

      <div class="table-card">
        <h3 class="card-title">${t('dailyCostBreakdownTitle')}</h3>
        <div class="table-responsive">
          <table class="cost-table">
            <thead>
              <tr>
                <th>${t('thDay')}</th>
                <th>${t('thNeighborhood')}</th>
                <th>${t('thMeals')}</th>
                <th>${t('thTickets')}</th>
                <th>${t('thTransit')}</th>
                <th>${t('thDailyTotal')}</th>
              </tr>
            </thead>
            <tbody>
              ${trip.days.map(d => `
                <tr>
                  <td><strong>${d.dateLabel}</strong></td>
                  <td>${d.neighborhood}</td>
                  <td>${formatMoney(120)}</td>
                  <td>${formatMoney(75)}</td>
                  <td>${formatMoney(35)}</td>
                  <td><strong>${formatMoney(230)}</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderCustomizeConsole() {}
  function renderPacking() {}

  function renderAllViews() {
    renderTripHero();
    renderItinerary();
    renderStays();
    renderBudget();
  }

  // ==========================================================================
  // 6. Modal Engine & Navigation Handlers
  // ==========================================================================
  function openModal(modalEl) {
    if (modalEl) modalEl.classList.add('active');
  }

  function closeModal(modalEl) {
    if (modalEl) modalEl.classList.remove('active');
  }

  function initEventListeners() {
    // Global toast helper
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

    // Trip Selector
    const tripSelect = document.getElementById('tripSelect');
    if (tripSelect) {
      tripSelect.addEventListener('change', (e) => {
        currentTripIndex = parseInt(e.target.value, 10) || 0;
        activeDayIndex = 0;
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

    // New Trip Form Submit
    const newTripForm = document.getElementById('newTripForm');
    if (newTripForm) {
      newTripForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const dest = document.getElementById('inputDestination').value || 'Custom Voyage';
        const duration = parseInt(document.getElementById('inputDuration').value, 10) || 3;
        const adults = parseInt(document.getElementById('inputAdults').value, 10) || 2;
        const children = parseInt(document.getElementById('inputChildren').value, 10) || 0;
        const type = document.getElementById('selectTripType').value;

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
          weather: { temp: '22°C', condition: 'Pleasant', icon: '☀️', notes: 'Optimized schedule.' },
          stays: [
            {
              id: `stay-${Date.now()}`,
              name: `Central Suite ${dest.split(',')[0]}`,
              type: 'Boutique Stay',
              neighborhood: 'City Center',
              rating: '4.88',
              pricePerNight: 180,
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
              dualName: 'City Center Exploration',
              category: 'Sightseeing',
              time: '09:30 - 11:30',
              desc: `Discover the top cultural landmark in ${dest}.`,
              weatherBadge: '☀️ Morning Tour',
              accessibility: ['♿ Accessible Access'],
              cost: 15,
              completed: false
            },
            lunch: {
              dualName: 'Local Culinary Market',
              category: 'Dining',
              time: '12:00 - 13:30',
              desc: 'Authentic local cuisine and regional specialties.',
              weatherBadge: '❄️ Indoor Dining',
              accessibility: ['👨‍👩‍👧 Family Seating'],
              cost: 30,
              completed: false
            },
            afternoon: {
              dualName: 'Regional Museum & Gardens',
              category: 'Culture & Nature',
              time: '14:00 - 16:30',
              desc: 'Relaxing afternoon walk through local heritage exhibits.',
              weatherBadge: '🏛️ Indoor/Outdoor',
              accessibility: ['👶 Stroller-Friendly'],
              cost: 20,
              completed: false
            },
            evening: {
              dualName: 'Sunset Promenade & Dinner',
              category: 'Nightlife',
              time: '18:00 - 20:00',
              desc: 'Evening dining experience with local atmosphere.',
              weatherBadge: '🌆 Evening Breeze',
              accessibility: ['👶 Smooth Walkway'],
              cost: 40,
              completed: false
            }
          })),
          budgetBreakdown: {
            totalTripCost: duration * 220,
            dailyAverage: 220,
            perPersonTotal: Math.round((duration * 220) / (adults + children)),
            lodgingTotal: Math.round(duration * 110),
            diningTotal: Math.round(duration * 60),
            ticketsTotal: Math.round(duration * 30),
            transitTotal: Math.round(duration * 20),
            lodgingPct: 50,
            diningPct: 27,
            ticketsPct: 14,
            transitPct: 9
          }
        };

        PRESET_TRIPS.push(newTripObj);
        currentTripIndex = PRESET_TRIPS.length - 1;
        populateTripDropdown();
        renderAllViews();

        closeModal(document.getElementById('newTripModal'));
        showToast(`Trip to ${dest} generated successfully!`);
        newTripForm.reset();
      });
    }

    // Login Form Submit
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        closeModal(document.getElementById('loginModal'));
        showToast('Logged in successfully!');
      });
    }

    // Register Form Submit
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
      registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        closeModal(document.getElementById('registerModal'));
        showToast('Account created successfully!');
      });
    }
  }

  // Initial Boot
  document.addEventListener('DOMContentLoaded', () => {
    // Restore Saved Theme
    const savedTheme = localStorage.getItem('tripcraft_theme');
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
    }

    populateTripDropdown();
    applyLanguage(currentLang);
    initEventListeners();
  });
})();