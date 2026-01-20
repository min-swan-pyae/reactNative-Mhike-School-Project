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
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Hike, HikeDraft } from '../../types';
import { getHikeById, updateHike } from '../../lib/database';
import { validateHike, isHikeFormComplete } from '../../lib/validation';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { FormField } from '../../components/FormField';
import { DateInput } from '../../components/DateInput';
import { DifficultySelector } from '../../components/DifficultySelector';
import { StarRating } from '../../components/StarRating';
import { PhotoPicker } from '../../components/PhotoPicker';
import { SaveButton } from '../../components/SaveButton';
import Slider from '@react-native-community/slider';
import { events } from '../../lib/events';
import { useData } from '../../contexts/DataContext';
import { useLocation } from '../../hooks';

export default function EditHikeScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const params = useLocalSearchParams<{ hikeId: string }>();
  const hikeId = parseInt(params.hikeId);
  const { notifyHikeChanged } = useData();
  const { getCurrentLocation } = useLocation();

  const [draft, setDraft] = useState<HikeDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadHike();
  }, []);

  const loadHike = async () => {
    try {
      const hike = await getHikeById(hikeId);
      if (!hike) {
        Alert.alert('Error', 'Hike not found');
        router.back();
        return;
      }

      // Convert Hike to HikeDraft
      const hikeDraft: HikeDraft = {
        id: hike.id,
        name: hike.name,
        location: hike.location,
        date: hike.date,
        parkingAvailable: hike.parkingAvailable,
        length: hike.lengthKm.toString(),
        lengthKm: hike.lengthKm,
        difficulty: hike.difficulty,
        description: hike.description,
        photoUri: hike.photoUri,
        latitude: hike.latitude,
        longitude: hike.longitude,
        elevationGain: hike.elevationGainM?.toString(),
        trailRating: hike.rating,
      };

      setDraft(hikeDraft);
    } catch (error) {
      console.error('Error loading hike:', error);
      Alert.alert('Error', 'Failed to load hike');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const off = events.on('map:locationSelected', (loc) => {
      updateField('location', loc.address);
      updateField('latitude', loc.latitude);
      updateField('longitude', loc.longitude);
    });
    return () => off();
  }, [draft]);

  const updateField = (field: keyof HikeDraft, value: any) => {
    if (!draft) return;
    setDraft(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleGetLocation = async () => {
    const result = await getCurrentLocation();
    if (result) {
      updateField('location', result.address);
      updateField('latitude', result.latitude);
      updateField('longitude', result.longitude);
    }
  };

  const handlePickOnMap = () => {
    router.push('/map-picker');
  };

  const handleSave = async () => {
    if (!draft || saving) return; // Prevent double-tap

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

    setSaving(true);
    try {
      const hikeToUpdate: Hike = {
        id: hikeId,
        name: draft.name,
        location: draft.location,
        date: draft.date,
        parkingAvailable: draft.parkingAvailable,
        lengthKm: parseFloat(draft.length),
        difficulty: draft.difficulty,
        description: draft.description,
        elevationGainM: draft.elevationGain ? parseInt(draft.elevationGain) : undefined,
        rating: draft.trailRating,
        photoUri: draft.photoUri,
        latitude: draft.latitude,
        longitude: draft.longitude,
        addedToCalendar: false, // Reset when hike is edited
      };

      await updateHike(hikeToUpdate);
      notifyHikeChanged(); // Trigger live update
      Alert.alert('Success', 'Hike updated successfully', [
        {
          text: 'OK',
          onPress: () => {
            // Navigate back to detail page which will then navigate to list
            router.back();
          }
        }
      ]);
    } catch (error) {
      console.error('Error updating hike:', error);
      Alert.alert('Error', 'Failed to update hike');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !draft) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Photo Section */}
        <PhotoPicker
          photoUri={draft.photoUri}
          onPhotoSelected={(uri) => updateField('photoUri', uri)}
          onPhotoRemoved={() => updateField('photoUri', undefined)}
        />

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

      {/* Save Button */}
      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <SaveButton
          onPress={handleSave}
          loading={saving}
          label="Save Changes"
          disabled={!draft || !isHikeFormComplete(draft)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
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
