// state.js - Central Data Store & State Management

export const PRESET_TRIPS = [
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

export const state = {
  currentTripIndex: 0,
  activeDayIndex: 0,
  currentCurrency: localStorage.getItem('tripcraft_currency') || 'USD',
  currentLang: localStorage.getItem('tripcraft_lang') || 'en',
  currentUser: null
};

export function getCurrentTrip() {
  return PRESET_TRIPS[state.currentTripIndex] || PRESET_TRIPS[0];
}