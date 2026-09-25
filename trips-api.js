/**
 * TripCraft — Supabase Data Layer for Trips & Itineraries
 * Aligned with the existing `trips` schema (uses trip_data jsonb for extended fields).
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
    /* SAVE (insert) — full trip + all its days                           */
    /* ================================================================== */
    async saveTrip(trip) {
      const userId = await this._currentUserId();
      if (!userId) throw new Error('You must be signed in to save a trip.');

      const structured = window.__selectedDestination || null;
      const weather = window.__selectedDestinationWeather || null;
      const image = window.__selectedDestinationImage || null;

      // ---- Build the extended payload that goes into trip_data ----
      const tripData = {
        country: trip.country || null,
        subtitle: trip.subtitle || null,
        start_date: trip.startDate || null,
        special_notes: trip.specialNotes || null,
        current_pace: trip.currentPace || 'balanced',
        hero_image: image?.url || trip.heroImage || null,
        destination_country_code: structured?.countryCode ?? null,
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
        stays: trip.stays || [],
        budget_breakdown: trip.budgetBreakdown || {},
        booking_links: trip.bookingLinks || [],
        packing: trip.packing || []
      };

      // ---- Row for the `trips` table ----
      const tripRow = {
        user_id: userId,
        destination: trip.destination,
        title: trip.title || null,
        trip_type: trip.tripType || null,
        duration_days: trip.durationDays || 0,
        travelers: trip.travelers || {},
        budget_tier: trip.budgetTier || 'moderate',
        trip_data: tripData,
        destination_lat: structured?.lat ?? null,
        destination_lng: structured?.lng ?? null,
        destination_geoname_id: structured?.geonameId ?? null
      };

      // ---- Insert the trip ----
      const { data: insertedTrip, error: tripErr } = await this._client()
        .from('trips')
        .insert([tripRow])
        .select()
        .single();

      if (tripErr) {
        console.error('[trips-api] Trip insert failed:', tripErr);
        throw tripErr;
      }

      // ---- Insert all itinerary days ----
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
          // Rollback the trip so we don't leave orphans
          await this._client().from('trips').delete().eq('id', insertedTrip.id);
          throw daysErr;
        }
      }

      trip.id = insertedTrip.id;
      return insertedTrip;
    },

    /* ================================================================== */
    /* LIST — all trips for current user                                  */
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
    /* GET one trip with days                                             */
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
    /* UPDATE / DELETE                                                    */
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

    async deleteTrip(tripId) {
      const { error } = await this._client().from('trips').delete().eq('id', tripId);
      if (error) throw error;
    },

    /* ================================================================== */
    /* Mapper: DB row → app trip object                                   */
    /* ================================================================== */
    _rowToTrip(row) {
      const td = row.trip_data || {};
      return {
        id: row.id,
        destination: row.destination,
        country: td.country || null,
        title: row.title,
        subtitle: td.subtitle || null,
        tripType: row.trip_type,
        durationDays: row.duration_days,
        startDate: td.start_date || null,
        specialNotes: td.special_notes || null,
        travelers: row.travelers || {},
        budgetTier: row.budget_tier,
        weather: td.weather || {},
        currentPace: td.current_pace || 'balanced',
        heroImage: td.hero_image || null,
        stays: td.stays || [],
        budgetBreakdown: td.budget_breakdown || {},
        bookingLinks: td.booking_links || [],
        packing: td.packing || [],
        days: [],
        savedToCloud: true,
        createdAt: row.created_at,
        // Preserve geonames data for re-use
        destinationMeta: {
          lat: row.destination_lat,
          lng: row.destination_lng,
          geonameId: row.destination_geoname_id,
          countryCode: td.destination_country_code || null
        }
      };
    }
  };

  window.TripsAPI = TripsAPI;
})();