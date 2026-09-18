// auth.js - Supabase Authentication Engine

import { state, PRESET_TRIPS, getCurrentTrip } from './state.js';
import { TRANSLATIONS } from './constants.js';
import { showToast } from './toast.js';

const supabase = window.supabaseClient || null;

export async function initAuth(onSyncCallback) {
  if (!supabase) return;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      state.currentUser = session.user;
      updateAuthUI(state.currentUser);
      await syncUserTripsFromSupabase(onSyncCallback);
    } else {
      updateAuthUI(null);
    }

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        state.currentUser = session.user;
        updateAuthUI(state.currentUser);
        await syncUserTripsFromSupabase(onSyncCallback);
      } else {
        state.currentUser = null;
        updateAuthUI(null);
      }
    });
  } catch (err) {
    console.error('Error initializing Supabase Auth:', err);
  }
}

export function updateAuthUI(user) {
  const authNavGroup = document.getElementById('authNavGroup');
  const userNavGroup = document.getElementById('userNavGroup');
  const userNameSpan = document.getElementById('userDisplayName');

  const dict = TRANSLATIONS[state.currentLang] || TRANSLATIONS.en;

  if (user) {
    if (authNavGroup) authNavGroup.style.display = 'none';
    if (userNavGroup) userNavGroup.style.display = 'flex';
    const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Traveler';
    if (userNameSpan) userNameSpan.textContent = `${dict.welcomeUser || 'Welcome,'} ${name}`;
  } else {
    if (authNavGroup) authNavGroup.style.display = 'flex';
    if (userNavGroup) userNavGroup.style.display = 'none';
    if (userNameSpan) userNameSpan.textContent = '';
  }
}

export async function syncUserTripsFromSupabase(onSyncCallback) {
  if (!supabase || !state.currentUser) return;
  try {
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .eq('user_id', state.currentUser.id)
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
      if (typeof onSyncCallback === 'function') {
        onSyncCallback();
      }
    }
  } catch (err) {
    console.error('Error syncing trips:', err);
  }
}

export async function saveTripToSupabase(tripObj) {
  if (!supabase || !state.currentUser) return;
  try {
    const { error } = await supabase
      .from('trips')
      .upsert({
        id: tripObj.id,
        user_id: state.currentUser.id,
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