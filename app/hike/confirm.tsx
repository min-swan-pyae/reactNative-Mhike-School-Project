import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Hike, HikeDraft } from '../../types';
import { insertHike, findDuplicateHike, updateHike } from '../../lib/database';
import { Colors, getDifficultyColor } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { addHikeToCalendar } from '../../lib/calendar';
import { PhotoPicker } from '../../components/PhotoPicker';
import { StarRating } from '../../components/StarRating';
import { useData } from '../../contexts/DataContext';
import { useBackHandler } from '../../hooks/useBackHandler';

export default function HikeConfirmScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const params = useLocalSearchParams<{ draftJson: string }>();
  const { notifyHikeChanged } = useData();
  
  const [draft, setDraft] = useState<HikeDraft>(() => {
    if (params.draftJson) {
      return JSON.parse(params.draftJson);
    }
    router.back();
    return {} as HikeDraft;
  });

  const [photoUri, setPhotoUri] = useState<string | undefined>(draft.photoUri);
  const [saving, setSaving] = useState(false);

  // Prevent android back button(physical, software, gestures) from going back to the form
  useBackHandler(() => {
    router.replace('/');
    return true; 
  });

  // Save hike
  const handleSave = async () => {
    setSaving(true);
    try {
      // Check for duplicates
      const hikeForCheck: Omit<Hike, 'id'> = {
        name: draft.name,
        location: draft.location,
        date: draft.date,
        parkingAvailable: draft.parkingAvailable,
        lengthKm: parseFloat(draft.length),
        difficulty: draft.difficulty,
        description: draft.description,
        elevationGainM: draft.elevationGain ? parseInt(draft.elevationGain) : undefined,
        rating: draft.trailRating,
        photoUri: photoUri,
        latitude: draft.latitude,
        longitude: draft.longitude,
      };

      const duplicate = await findDuplicateHike(hikeForCheck);
      if (duplicate) {
        Alert.alert(
          'Duplicate Found',
          `A hike with this name on ${draft.date} already exists.`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Save Anyway',
              onPress: async () => {
                await saveToDB();
              },
            },
          ]
        );
        setSaving(false);
        return;
      }

      await saveToDB();
    } catch (error) {
      console.error('Error saving hike:', error);
      Alert.alert('Error', 'Failed to save hike');
      setSaving(false);
    }
  };

  const saveToDB = async () => {
    try {
      // Convert draft to Hike
      const hike: Omit<Hike, 'id'> = {
        name: draft.name,
        location: draft.location,
        date: draft.date,
        parkingAvailable: draft.parkingAvailable,
        lengthKm: parseFloat(draft.length),
        difficulty: draft.difficulty,
        description: draft.description,
        elevationGainM: draft.elevationGain ? parseInt(draft.elevationGain) : undefined,
        rating: draft.trailRating,
        photoUri: photoUri,
        latitude: draft.latitude,
        longitude: draft.longitude,
      };

      const hikeId = await insertHike(hike);
      notifyHikeChanged(); // Notify context for live update

      // Update the hike with addedToCalendar flag
      const updateCalendarStatus = async (added: boolean) => {
        try {
          await updateHike({ ...hike, id: hikeId, addedToCalendar: added });
          notifyHikeChanged();
        } catch (error) {
          console.error('Error updating calendar status:', error);
        }
      };

      // add to calendar dialog
      Alert.alert(
        'Hike saved!',
        'Would you like to add this hike to your calendar?',
        [
          {
            text: 'No',
            onPress: () => {
              setSaving(false);
              router.replace('/');
            },
          },
          {
            text: 'Yes',
            onPress: async () => {
              const added = await addHikeToCalendar({ ...hike, id: hikeId });
              await updateCalendarStatus(added);
              setSaving(false);
              if (added) {
                // Success message is already shown by addHikeToCalendar on iOS
                // On Android, the calendar app opens directly
              }
              router.replace('/');
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error saving to database:', error);
      Alert.alert('Error', 'Failed to save hike');
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        

        {/* Photo Section */}
        <PhotoPicker
          photoUri={photoUri}
          onPhotoSelected={setPhotoUri}
          onPhotoRemoved={() => setPhotoUri(undefined)}
        />

        {/* Details */}
        <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.row}>
            <Text style={[styles.fieldLabel, { color: colors.disabled }]}>Name</Text>
            <Text style={[styles.fieldValue, { color: colors.text }]}>{draft.name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.fieldLabel, { color: colors.disabled }]}>Location</Text>
            <Text style={[styles.fieldValue, { color: colors.text }]}>{draft.location}</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.fieldLabel, { color: colors.disabled }]}>Date</Text>
            <Text style={[styles.fieldValue, { color: colors.text }]}>{draft.date}</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.fieldLabel, { color: colors.disabled }]}>Length</Text>
            <Text style={[styles.fieldValue, { color: colors.text }]}>{draft.length} km</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.fieldLabel, { color: colors.disabled }]}>Difficulty</Text>
            <View style={[styles.difficultyChip, { backgroundColor: getDifficultyColor(draft.difficulty, colorScheme) }]}>
              <Text style={styles.difficultyText}>{draft.difficulty}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <Text style={[styles.fieldLabel, { color: colors.disabled }]}>Parking</Text>
            <Text style={[styles.fieldValue, { color: colors.text }]}>
              {draft.parkingAvailable ? 'Available' : 'Not Available'}
            </Text>
          </View>
          {draft.description && (
            <View style={styles.row}>
              <Text style={[styles.fieldLabel, { color: colors.disabled }]}>Description</Text>
              <Text style={[styles.fieldValue, { color: colors.text }]}>{draft.description}</Text>
            </View>
          )}
          {draft.trailRating !== undefined && (
            <View style={styles.row}>
              <Text style={[styles.fieldLabel, { color: colors.disabled }]}>Rating</Text>
              <StarRating
                rating={draft.trailRating}
                onRatingChange={() => {}}
                size={20}
                readonly
              />
            </View>
          )}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.button, styles.backButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
          onPress={() => router.back()}
          disabled={saving}
          accessibilityLabel="Go back to edit"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
          <Text style={[styles.buttonText, { color: colors.text }]}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={handleSave}
          disabled={saving}
          accessibilityLabel="Save hike"
          accessibilityRole="button"
          accessibilityState={{ busy: saving }}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text style={[styles.buttonText, { color: '#fff' }]}>Save Hike</Text>
            </>
          )}
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
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
  },
  card: {
    borderRadius: 12,
    padding: 16,
  },
  row: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    marginBottom: 4,
    fontWeight: '600',
  },
  fieldValue: {
    fontSize: 16,
  },
  difficultyChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  difficultyText: {
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
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  backButton: {
    borderWidth: 1,
  },
  saveButton: {},
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
