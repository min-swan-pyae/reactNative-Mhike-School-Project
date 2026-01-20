import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  useColorScheme,
  Switch,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { Hike, HikeDraft } from '../../types';
import { validateHike, isHikeFormComplete } from '../../lib/validation';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { FormField } from '../../components/FormField';
import { DateInput } from '../../components/DateInput';
import { DifficultySelector } from '../../components/DifficultySelector';
import { StarRating } from '../../components/StarRating';
import Slider from '@react-native-community/slider';
import { events } from '../../lib/events';
import { useFormState, useLocation } from '../../hooks';

export default function AddHikeScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { state: draft, updateField } = useFormState<HikeDraft>({
    name: '',
    location: '',
    date: new Date().toISOString().split('T')[0],
    parkingAvailable: false,
    length: '',
    difficulty: 'Easy',
    description: '',
    trailRating: 3,
  });
  const { getCurrentLocation } = useLocation();

  // Listen for map location selection
  useEffect(() => {
    const off = events.on('map:locationSelected', (loc) => {
      updateField('location', loc.address);
      updateField('latitude', loc.latitude);
      updateField('longitude', loc.longitude);
    });
    return () => { off(); };
  }, []);

  // Get current location
  const handleGetLocation = async () => {
    const result = await getCurrentLocation();
    if (result) {
      updateField('location', result.address);
      updateField('latitude', result.latitude);
      updateField('longitude', result.longitude);
    }
  };

  // Navigate to map picker
  const handlePickOnMap = () => {
    router.push('/map-picker');
  };

  // Navigate to confirm screen
  const handleContinue = () => {
    // Convert string fields to numbers for validation
    const hikeToValidate: Partial<Hike> = {
      ...draft,
      lengthKm: draft.length ? parseFloat(draft.length) : undefined,
      elevationGainM: draft.elevationGain ? parseInt(draft.elevationGain) : undefined,
      rating: draft.trailRating,
    };

    const errors = validateHike(hikeToValidate);
    if (errors.length > 0) {
      Alert.alert('Validation Error', errors.map(e => e.message).join('\n'));
      return;
    }

    router.replace({
      pathname: '/hike/confirm',
      params: { draftJson: JSON.stringify(draft) },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Name */}
        <FormField
          label="Hike Name"
          required
          value={draft.name}
          onChangeText={(value) => updateField('name', value)}
          placeholder="Enter hike name"
          maxLength={100}
        />

        {/* Location */}
        <View style={styles.field}>
          <FormField
            label="Location"
            required
            value={draft.location}
            onChangeText={(value) => updateField('location', value)}
            placeholder="Enter location"
            maxLength={200}
          />
          <View style={styles.locationButtons}>
            <TouchableOpacity
              style={[styles.locationButton, { backgroundColor: colors.primary }]}
              onPress={handleGetLocation}
              accessibilityLabel="Get current location"
              accessibilityRole="button"
            >
              <Ionicons name="locate" size={18} color="#fff" />
              <Text style={styles.locationButtonText}>Current Location</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.locationButton, { backgroundColor: colors.secondary }]}
              onPress={handlePickOnMap}
              accessibilityLabel="Pick location on map"
              accessibilityRole="button"
            >
              <Ionicons name="map" size={18} color="#fff" />
              <Text style={styles.locationButtonText}>Pick on Map</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Date */}
        <View style={styles.field}>
          <DateInput
            label="Date"
            required
            date={draft.date}
            onDateChange={(date) => updateField('date', date)}
          />
        </View>

        {/* Parking Available */}
        <View style={[styles.field, styles.switchField]}>
          <Text style={[styles.label, { color: colors.text }]}>Parking Available</Text>
          <Switch
            value={draft.parkingAvailable}
            onValueChange={(value) => updateField('parkingAvailable', value)}
            trackColor={{ false: colors.disabled, true: colors.primary }}
          />
        </View>

        {/* Length */}
        <FormField
          label="Length (km)"
          required
          value={draft.length}
          onChangeText={(value) => updateField('length', value)}
          placeholder="Enter length"
          keyboardType="decimal-pad"
        />

        {/* Difficulty */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>
            Difficulty <Text style={styles.required}>*</Text>
          </Text>
          <DifficultySelector
            difficulty={draft.difficulty}
            onDifficultyChange={(diff) => updateField('difficulty', diff)}
          />
        </View>

        {/* Description */}
        <FormField
          label="Description"
          value={draft.description || ''}
          onChangeText={(value) => updateField('description', value)}
          placeholder="Enter description"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
           style={{
            minHeight: 100,
            color: colors.text,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 8,
            padding: 12,
          }}
        />

        {/* Elevation Gain with Slider and TextInput */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>Elevation Gain (m)</Text>
          <View style={styles.elevationContainer}>
            <TextInput
              style={[
                styles.elevationInput,
                { 
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.background
                }
              ]}
              value={draft.elevationGain || '0'}
              onChangeText={(value) => {
                // Allow only numbers
                const numValue = value.replace(/[^0-9]/g, '');
                const parsed = parseInt(numValue || '0');
                if (parsed <= 3000) {
                  updateField('elevationGain', numValue || '0');
                }
              }}
              placeholder="0"
              placeholderTextColor={colors.disabled}
              keyboardType="numeric"
            />
            <Text style={[styles.elevationUnit, { color: colors.text }]}>m</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={3000}
            step={1}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.disabled}
            thumbTintColor={colors.primary}
            value={draft.elevationGain ? parseInt(draft.elevationGain) : 0}
            onValueChange={(val: number) => updateField('elevationGain', Math.round(val).toString())}
          />
        </View>

        {/* Trail Rating */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>Rating (1-5 stars)</Text>
          <StarRating
            rating={draft.trailRating || 0}
            onRatingChange={(rating) => updateField('trailRating', rating)}
          />
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            {
              backgroundColor: isHikeFormComplete(draft) ? colors.primary : colors.disabled,
              opacity: isHikeFormComplete(draft) ? 1 : 0.6,
            },
          ]}
          onPress={handleContinue}
          disabled={!isHikeFormComplete(draft)}
          accessibilityLabel="Continue to confirmation"
          accessibilityRole="button"
          accessibilityState={{ disabled: !isHikeFormComplete(draft) }}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  field: {
    marginBottom: 20,
  },
  switchField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  required: {
    color: '#f44336',
  },
  locationButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: -12, 
  },
  locationButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  locationButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: 1,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  elevationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  elevationInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  elevationUnit: {
    fontSize: 16,
    fontWeight: '600',
  },
  slider: {
    width: '100%',
    marginTop: 8,
  },
});
