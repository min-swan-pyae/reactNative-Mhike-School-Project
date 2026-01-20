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
import { ObservationDraft } from '../../types';
import { insertObservation } from '../../lib/database';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { PhotoPicker } from '../../components/PhotoPicker';
import { formatDateTime } from '../../lib/validation';
import { useData } from '../../contexts/DataContext';
import { useBackHandler } from '../../hooks/useBackHandler';

export default function ObservationConfirmScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const params = useLocalSearchParams<{ draftJson: string; hikeId: string }>();
  const { notifyObservationChanged } = useData();

  const [draft, setDraft] = useState<ObservationDraft>(() => {
    if (params.draftJson) {
      return JSON.parse(params.draftJson);
    }
    router.back();
    return {} as ObservationDraft;
  });

  const [photoUri, setPhotoUri] = useState<string | undefined>(draft.photoUri);
  const [saving, setSaving] = useState(false);

  // Prevent hardware back button from going back to the form
  useBackHandler(() => {
    router.back();
    return true; // Prevent default back behavior
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await insertObservation({
        ...draft,
        photoUri: photoUri,
      });

      notifyObservationChanged(); // Trigger live update
      Alert.alert('Success', 'Observation updated successfully');
      router.back();
      router.back(); // Go back twice to return to hike detail
    } catch (error) {
      console.error('Error saving observation:', error);
      Alert.alert('Error', 'Failed to save observation');
    } finally {
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
          aspectRatio={[4, 3]}
        />

        {/* Details Card */}
        <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.row}>
            <Ionicons name="time-outline" size={20} color={colors.icon} />
            <Text style={[styles.time, { color: colors.text }]}>
              {formatDateTime(draft.timestamp)}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.disabled }]}>Observation</Text>
            <Text style={[styles.value, { color: colors.text }]}>{draft.observation}</Text>
          </View>

          {draft.comments && (
            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.disabled }]}>Comments</Text>
              <Text style={[styles.value, { color: colors.text }]}>{draft.comments}</Text>
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
          accessibilityLabel="Save observation"
          accessibilityRole="button"
          accessibilityState={{ busy: saving }}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text style={[styles.buttonText, { color: '#fff' }]}>Save</Text>
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
    marginTop: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  time: {
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    textTransform: 'uppercase',
    marginBottom: 6,
    fontWeight: '600',
  },
  value: {
    fontSize: 16,
    lineHeight: 22,
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
