import { useState } from 'react';
import { Alert } from 'react-native';
import * as Location from 'expo-location';

interface LocationResult {
  address: string;
  latitude: number;
  longitude: number;
}

export function useLocation() {
  const [loading, setLoading] = useState(false);

  /**
   * Get current GPS location and reverse geocode to address
   * Includes retry logic and timeout handling
   */
  const getCurrentLocation = async (): Promise<LocationResult | null> => {
    setLoading(true);
    try {
      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required');
        setLoading(false);
        return null;
      }

      // Get GPS coordinates
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // Try reverse geocoding with retry logic
      let address = '';
      try {
        let geocodeResult = null;
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            const geocodePromise = Location.reverseGeocodeAsync({
              latitude,
              longitude,
            });
            const timeoutPromise = new Promise<null>((_, reject) =>
              setTimeout(() => reject(new Error('Geocoding timeout')), 10000)
            );

            const result = await Promise.race([geocodePromise, timeoutPromise]) as any[];
            geocodeResult = result[0];
            break; // Success, exit retry loop
          } catch (attemptError) {
            if (attempt === 1) throw attemptError; // Last attempt failed
            console.log(`Geocoding attempt ${attempt + 1} failed, retrying...`);
          }
        }

        if (geocodeResult) {
          address = [
            geocodeResult.street,
            geocodeResult.city,
            geocodeResult.region,
            geocodeResult.country,
          ]
            .filter(Boolean)
            .join(', ');
        }
      } catch (geocodeError) {
        console.log('Geocoding failed after retries, using coordinates');
        address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      }

      if (!address) {
        address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      }

      setLoading(false);
      return { address, latitude, longitude };
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get current location');
      setLoading(false);
      return null;
    }
  };

  /**
   * Reverse geocode coordinates to address
   * Used for map picker
   */
  const reverseGeocode = async (
    latitude: number,
    longitude: number
  ): Promise<string> => {
    try {
      let address = '';
      let geocodeResult = null;
      
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const geocodePromise = Location.reverseGeocodeAsync({
            latitude,
            longitude,
          });
          const timeoutPromise = new Promise<null>((_, reject) =>
            setTimeout(() => reject(new Error('Geocoding timeout')), 10000)
          );

          const result = await Promise.race([geocodePromise, timeoutPromise]) as any[];
          geocodeResult = result[0];
          break;
        } catch (attemptError) {
          if (attempt === 1) throw attemptError;
          console.log(`Geocoding attempt ${attempt + 1} failed, retrying...`);
        }
      }

      if (geocodeResult) {
        address = [
          geocodeResult.street,
          geocodeResult.city,
          geocodeResult.region,
          geocodeResult.country,
        ]
          .filter(Boolean)
          .join(', ');
      }

      if (!address) {
        address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      }

      return address;
    } catch (error) {
      console.log('Geocoding failed after retries, using coordinates');
      return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    }
  };

  return {
    loading,
    getCurrentLocation,
    reverseGeocode,
  };
}
