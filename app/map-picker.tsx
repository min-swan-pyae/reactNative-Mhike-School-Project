import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  useColorScheme,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import MapView, { Marker, Region } from 'react-native-maps';
import { Colors } from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { events } from '../lib/events';
import { useLocation } from '../hooks';

export default function MapPickerScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { getCurrentLocation, reverseGeocode } = useLocation();

  const mapRef = useRef<MapView | null>(null);

  const [region, setRegion] = useState<Region>({
    latitude: 51.5074, // Default to London
    longitude: -0.1278,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [locatingCurrent, setLocatingCurrent] = useState(false);

  useEffect(() => {
    initializeLocation();
  }, []);

  const initializeLocation = async () => {
    try {
      const result = await getCurrentLocation();
      if (result) {
        setRegion({
          latitude: result.latitude,
          longitude: result.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
        setSelectedLocation({ 
          latitude: result.latitude, 
          longitude: result.longitude 
        });
      }
    } catch (error) {
      console.error('Error getting location:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedLocation({ latitude, longitude });
    
    // Animate to tapped location 
    const newRegion: Region = {
      latitude,
      longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
    if (mapRef.current && typeof mapRef.current.animateToRegion === 'function') {
      mapRef.current.animateToRegion(newRegion, 500);
    }
  };

  const handleConfirm = async () => {
    if (!selectedLocation) {
      Alert.alert('Error', 'Please select a location on the map');
      return;
    }

    try {
      const address = await reverseGeocode(
        selectedLocation.latitude,
        selectedLocation.longitude
      );

      // Emit selection and go back
      events.emit('map:locationSelected', {
        address,
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
      });
      router.back();
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      Alert.alert('Error', 'Failed to get address for this location');
    }
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Loading map...
          </Text>
        </View>
      ) : (
        <>
          <MapView
            ref={mapRef}
            style={styles.map}
            region={region}
            onRegionChangeComplete={setRegion}
            onPress={handleMapPress}
            accessibilityLabel="Map view for selecting location"
          >
            {selectedLocation && (
              <Marker
                coordinate={selectedLocation}
                title="Selected Location"
                pinColor={colors.primary}
                accessibilityLabel="Selected location marker"
              />
            )}
          </MapView>

          {/* Info Card */}
          <View style={[styles.infoCard, { backgroundColor: colors.cardBackground }]}>
            <Ionicons name="information-circle" size={24} color={colors.icon} />
            <Text style={[styles.infoText, { color: colors.text }]}>
              Tap on the map to select a location
            </Text>
          </View>

          {/* Confirm Button */}
          {selectedLocation && (
            <View style={[styles.footer, { backgroundColor: colors.background }]}>
              <TouchableOpacity
                style={[styles.confirmButton, { backgroundColor: colors.primary }]}
                onPress={handleConfirm}
                accessibilityLabel="Confirm selected location"
                accessibilityRole="button"
              >
                <Ionicons name="checkmark-circle" size={24} color="#fff" />
                <Text style={styles.confirmButtonText}>Confirm Location</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Current Location Button */}
          <TouchableOpacity
            style={[
              styles.currentLocationButton, 
              { 
                backgroundColor: colors.primary,
                opacity: locatingCurrent ? 0.7 : 1,
              }
            ]}
            accessibilityLabel="Use current location"
            accessibilityRole="button"
            accessibilityHint="Centers map on your current GPS location"
            onPress={async () => {
              if (locatingCurrent) return; // Prevent double-tap
              
              setLocatingCurrent(true);
              try {
                const result = await getCurrentLocation();
                if (result) {
                  const newRegion: Region = {
                    latitude: result.latitude,
                    longitude: result.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  };
                  setRegion(newRegion);
                  setSelectedLocation({ latitude: result.latitude, longitude: result.longitude });
                  // Animate the map to the new region
                  if (mapRef.current && typeof mapRef.current.animateToRegion === 'function') {
                    mapRef.current.animateToRegion(newRegion, 500);
                  }
                }
              } catch (error) {
                console.error('Error getting current location from FAB:', error);
                Alert.alert('Error', 'Unable to get current location');
              } finally {
                setLocatingCurrent(false);
              }
            }}
            disabled={locatingCurrent}
          >
            {locatingCurrent ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="locate" size={24} color="#fff" />
            )}
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  map: {
    flex: 1,
  },
  infoCard: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  currentLocationButton: {
    position: 'absolute',
    right: 16,
    bottom: 100,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
