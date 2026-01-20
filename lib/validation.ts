import { Hike, Observation } from '../types';

export interface ValidationError {
  field: string;
  message: string;
}

export const validateHike = (hike: Partial<Hike>): ValidationError[] => {
  const errors: ValidationError[] = [];

  // Name validation
  if (!hike.name || hike.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Name is required' });
  } else if (hike.name.length > 100) {
    errors.push({ field: 'name', message: 'Name must be less than 100 characters' });
  }

  // Location validation
  if (!hike.location || hike.location.trim().length === 0) {
    errors.push({ field: 'location', message: 'Location is required' });
  } else if (hike.location.length > 200) {
    errors.push({ field: 'location', message: 'Location must be less than 200 characters' });
  }

  // Date validation
  if (!hike.date || hike.date.trim().length === 0) {
    errors.push({ field: 'date', message: 'Date is required' });
  } else if (!isValidDate(hike.date)) {
    errors.push({ field: 'date', message: 'Invalid date format (use YYYY-MM-DD)' });
  }

  // Length validation
  if (hike.lengthKm === undefined || hike.lengthKm === null) {
    errors.push({ field: 'lengthKm', message: 'Length is required' });
  } else if (hike.lengthKm <= 0) {
    errors.push({ field: 'lengthKm', message: 'Length must be greater than 0' });
  } else if (hike.lengthKm > 1000) {
    errors.push({ field: 'lengthKm', message: 'Length must be less than 1000 km' });
  }

  // Difficulty validation
  if (!hike.difficulty) {
    errors.push({ field: 'difficulty', message: 'Difficulty is required' });
  } else if (!['Easy', 'Moderate', 'Hard'].includes(hike.difficulty)) {
    errors.push({ field: 'difficulty', message: 'Difficulty must be Easy, Moderate, or Hard' });
  }

  // Parking validation
  if (hike.parkingAvailable === undefined || hike.parkingAvailable === null) {
    errors.push({ field: 'parkingAvailable', message: 'Parking availability is required' });
  }

  // Optional field validations
  if (hike.elevationGainM !== undefined && hike.elevationGainM !== null) {
    if (hike.elevationGainM < 0 || hike.elevationGainM > 9000) {
      errors.push({ field: 'elevationGainM', message: 'Elevation must be between 0 and 9000 m' });
    }
  }

  if (hike.rating !== undefined && hike.rating !== null) {
    if (hike.rating < 0 || hike.rating > 5) {
      errors.push({ field: 'rating', message: 'Rating must be between 0 and 5' });
    }
  }

  if (hike.description && hike.description.length > 1000) {
    errors.push({ field: 'description', message: 'Description must be less than 1000 characters' });
  }

  return errors;
};

// Validate observation data
export const validateObservation = (observation: Partial<Observation>): ValidationError[] => {
  const errors: ValidationError[] = [];

  // Observation text validation
  if (!observation.observation || observation.observation.trim().length === 0) {
    errors.push({ field: 'observation', message: 'Observation is required' });
  } else if (observation.observation.length > 500) {
    errors.push({ field: 'observation', message: 'Observation must be less than 500 characters' });
  }

  // Timestamp validation
  if (!observation.timestamp) {
    errors.push({ field: 'timestamp', message: 'Date and time are required' });
  }

  // Comments validation
  if (observation.comments && observation.comments.length > 1000) {
    errors.push({ field: 'comments', message: 'Comments must be less than 1000 characters' });
  }

  // HikeId validation
  if (!observation.hikeId) {
    errors.push({ field: 'hikeId', message: 'Hike ID is required' });
  }

  return errors;
};

// Check if date string is valid YYYY-MM-DD format
export const isValidDate = (dateString: string): boolean => {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;

  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
};

// Format date to YYYY-MM-DD
export const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Format date and time for display
export const formatDateTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

/**
 * Check if hike form has all required fields filled (for enabling submit button)
 */
export const isHikeFormComplete = (draft: {
  name?: string;
  location?: string;
  date?: string;
  length?: string;
  difficulty?: string;
}): boolean => {
  return !!(
    draft.name?.trim() &&
    draft.location?.trim() &&
    draft.date &&
    draft.length?.trim() &&
    draft.difficulty
  );
};

/**
 * Check if observation form has all required fields filled (for enabling submit button)
 */
export const isObservationFormComplete = (draft: {
  observation?: string;
}): boolean => {
  return !!(draft.observation?.trim());
};
