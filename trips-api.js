/**
 * TripCraft — Supabase Data Layer for Trips & Itineraries
 * Full CRUD for trips + itinerary days, including all nested JSON fields.
 */
(function () {
  'use strict';

  const TripsAPI = {
    _client() {
      if (!window.supabaseClient) throw new Error('Supabase client not initialised');
      return window.supabaseClient;
    },

    async _currentUserId() {
      const { data: { user } } = await this._client().auth.getUser();
      return user ? user.id : null;
    },

    /* ================================================================== */
    /* CREATE — save a full trip + all its days                           */
    /* ================================================================== */
    async saveTrip(trip) {
      const userId = await this._currentUserId();
      if (!userId) throw new Error('You must be signed in to save a trip.');

      const structured = window.__selectedDestination || null;
      const weather = window.__selectedDestinationWeather || null;
      const image = window.__selectedDestinationImage || null;

      // ---- 1. Build the trip row ----
      const tripRow = {
        user_id: userId,
        destination: trip.destination,
        country: trip.country || null,
        title: trip.title || null,
        subtitle: trip.subtitle || null,
        trip_type: trip.tripType || null,
        duration_days: trip.durationDays || 0,
        start_date: trip.startDate || null,
        special_notes: trip.specialNotes || null,
        travelers: trip.travelers || {},
        budget_tier: trip.budgetTier || 'moderate',
        weather: weather
          ? {
              temp: `${weather.temperature}°${weather.unit}`,
              condition: weather.icon?.key || 'weatherClear',
              icon: weather.icon?.icon || '☀️',
              feelsLike: weather.feelsLike,
              humidity: weather.humidity,
              windSpeed: weather.windSpeed,
              windUnit: weather.windUnit,
              updatedAt: weather.updatedAt
            }
          : trip.weather || {},
        current_pace: trip.currentPace || 'balanced',
        hero_image: image?.url || trip.heroImage || null,
        stays: trip.stays || [],
        budget_breakdown: trip.budgetBreakdown || {},
        booking_links: trip.bookingLinks || [],
        packing: trip.packing || [],
        destination_lat: structured?.lat ?? null,
        destination_lng: structured?.lng ?? null,
        destination_geoname_id: structured?.geonameId ?? null,
        destination_country_code: structured?.countryCode ?? null
      };

      // ---- 2. Insert the trip ----
      const { data: insertedTrip, error: tripErr } = await this._client()
        .from('trips')
        .insert([tripRow])
        .select()
        .single();

      if (tripErr) {
        console.error('[trips-api] Trip insert failed:', tripErr);
        throw tripErr;
      }

      // ---- 3. Insert all itinerary days ----
      if (Array.isArray(trip.days) && trip.days.length > 0) {
        const dayRows = trip.days.map((d, idx) => ({
          trip_id: insertedTrip.id,
          day_number: d.dayNumber ?? idx + 1,
          date_label: d.dateLabel || `Day ${idx + 1}`,
          neighborhood: d.neighborhood || '',
          weather_plan: d.weatherPlan || '',
          morning: d.morning || null,
          lunch: d.lunch || null,
          afternoon: d.afternoon || null,
          evening: d.evening || null
        }));

        const { error: daysErr } = await this._client()
          .from('itinerary_days')
          .insert(dayRows);

        if (daysErr) {
          console.error('[trips-api] Days insert failed:', daysErr);
          // Attempt rollback so we don't leave orphan trips
          await this._client().from('trips').delete().eq('id', insertedTrip.id);
          throw daysErr;
        }
      }

      // ---- 4. Attach the DB id back to the local trip object ----
      trip.id = insertedTrip.id;

      return insertedTrip;
    },

    /* ================================================================== */
    /* READ — list all trips for the current user                         */
    /* ================================================================== */
    async listTrips() {
      const { data, error } = await this._client()
        .from('trips')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(this._rowToTrip);
    },

    /* ================================================================== */
    /* READ — one trip + its days                                         */
    /* ================================================================== */
    async getTripWithDays(tripId) {
      const { data: tripRow, error: tripErr } = await this._client()
        .from('trips')
        .select('*')
        .eq('id', tripId)
        .single();
      if (tripErr) throw tripErr;

      const { data: dayRows, error: daysErr } = await this._client()
        .from('itinerary_days')
        .select('*')
        .eq('trip_id', tripId)
        .order('day_number', { ascending: true });
      if (daysErr) throw daysErr;

      const trip = this._rowToTrip(tripRow);
      trip.days = (dayRows || []).map(d => ({
        dayNumber: d.day_number,
        dateLabel: d.date_label,
        neighborhood: d.neighborhood,
        weatherPlan: d.weather_plan,
        morning: d.morning,
        lunch: d.lunch,
        afternoon: d.afternoon,
        evening: d.evening
      }));

      return trip;
    },

    /* ================================================================== */
    /* UPDATE                                                            */
    /* ================================================================== */
    async updateTrip(tripId, patch) {
      const { data, error } = await this._client()
        .from('trips')
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq('id', tripId)
        .select()
        .single();
      if (error) throw error;
      return this._rowToTrip(data);
    },

    /* ================================================================== */
    /* DELETE                                                            */
    /* ================================================================== */
    async deleteTrip(tripId) {
      const { error } = await this._client().from('trips').delete().eq('id', tripId);
      if (error) throw error;
    },

    /* ================================================================== */
    /* Helper: map DB row → app-local trip object                         */
    /* ================================================================== */
    _rowToTrip(row) {
      return {
        id: row.id,
        destination: row.destination,
        country: row.country,
        title: row.title,
        subtitle: row.subtitle,
        tripType: row.trip_type,
        durationDays: row.duration_days,
        startDate: row.start_date,
        specialNotes: row.special_notes,
        travelers: row.travelers || {},
        budgetTier: row.budget_tier,
        weather: row.weather || {},
        currentPace: row.current_pace || 'balanced',
        heroImage: row.hero_image,
        stays: row.stays || [],
        budgetBreakdown: row.budget_breakdown || {},
        bookingLinks: row.booking_links || [],
        packing: row.packing || [],
        days: [], // populated by getTripWithDays
        savedToCloud: true,
        createdAt: row.created_at
      };
    }
  };

  window.TripsAPI = TripsAPI;
})();