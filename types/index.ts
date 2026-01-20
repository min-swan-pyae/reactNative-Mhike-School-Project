export interface Hike {
  id?: number; // Optional for new hikes
  name: string;
  location: string;
  date: string; // ISO format YYYY-MM-DD
  parkingAvailable: boolean;
  lengthKm: number;
  difficulty: 'Easy' | 'Moderate' | 'Hard';
  description?: string;
  elevationGainM?: number;
  rating?: number; // 0-5
  photoUri?: string;
  latitude?: number;
  longitude?: number;
  addedToCalendar?: boolean;
}

export interface Observation {
  id?: number; // Optional for new observations
  hikeId: number;
  observation: string;
  timestamp: number; // Unix timestamp in milliseconds
  comments?: string;
  photoUri?: string;
}

export interface HikeDraft {
  id?: number; // Optional when creating/editing
  name: string;
  location: string;
  date: string; // ISO format YYYY-MM-DD
  parkingAvailable: boolean;
  length: string; // Keep as string for form input
  lengthKm?: number; // Parsed from length
  difficulty: 'Easy' | 'Moderate' | 'Hard';
  description?: string;
  photoUri?: string;
  latitude?: number;
  longitude?: number;
  // Additional optional fields
  estimatedDuration?: string;
  currentWeather?: string;
  temperature?: string;
  windSpeed?: string;
  rainProbability?: string;
  visibility?: string;
  humidity?: string;
  elevationGain?: string;
  trailRating?: number;
}

export interface ObservationDraft extends Omit<Observation, 'id'> {
  id?: number; // Optional when creating/editing
}

// For JSON import/export - matches Android app format
export interface HikeExportFormat {
  name: string;
  location: string;
  date: string;
  parkingAvailable: boolean;
  lengthKm: number;
  difficulty: string;
  description?: string;
  elevationGainM?: number;
  rating?: number;
  latitude?: number;
  longitude?: number;
  observations?: ObservationExportFormat[];
}

export interface ObservationExportFormat {
  observation: string;
  timestamp: number;
  comments?: string;
}

// Search and filter types
export interface SearchFilters {
  name?: string;
  location?: string;
  minLength?: number;
  maxLength?: number;
  date?: string;
  difficulty?: 'Easy' | 'Moderate' | 'Hard';
  parking?: boolean;
}

export type SortBy = 'date' | 'name' | 'length';

// Navigation types
export type RootStackParamList = {
  '(tabs)': undefined;
  'hike/add': undefined;
  'hike/edit': { hikeId: number };
  'hike/[id]': { id: number };
  'hike/confirm': { draft: HikeDraft };
  'observation/add': { hikeId: number };
  'observation/edit': { observationId: number; hikeId: number };
  'observation/confirm': { draft: ObservationDraft; hikeId: number };
  'map-picker': {
    initialLocation?: { latitude: number; longitude: number };
    onLocationSelected: (location: { latitude: number; longitude: number; address: string }) => void;
  };
};
