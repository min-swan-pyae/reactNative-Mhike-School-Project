import React, { useState, useEffect } from 'react';
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
import { Observation } from '../../types';
import { getObservationById, updateObservation } from '../../lib/database';
import { validateObservation, isObservationFormComplete } from '../../lib/validation';
import { Colors } from '../../constants/Colors';
import { FormField } from '../../components/FormField';
import { PhotoPicker } from '../../components/PhotoPicker';
import { SaveButton } from '../../components/SaveButton';
import { useData } from '../../contexts/DataContext';

export default function EditObservationScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const params = useLocalSearchParams<{ observationId: string; hikeId: string }>();
  const observationId = parseInt(params.observationId);
  const { notifyObservationChanged } = useData();

  const [draft, setDraft] = useState<Observation | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadObservation();
  }, []);

  const loadObservation = async () => {
    try {
      const obs = await getObservationById(observationId);
      if (!obs) {
        Alert.alert('Error', 'Observation not found');
        router.back();
        return;
      }
      setDraft(obs);
    } catch (error) {
      console.error('Error loading observation:', error);
      Alert.alert('Error', 'Failed to load observation');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof Observation, value: any) => {
    if (!draft) return;
    setDraft(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleSave = async () => {
    if (!draft || saving) return; // Prevent double-tap

    const errors = validateObservation(draft);
    if (errors.length > 0) {
      Alert.alert('Validation Error', errors.map(e => e.message).join('\n'));
      return;
    }

    setSaving(true);
    try {
      await updateObservation(draft);
      notifyObservationChanged(); // Trigger live update
      Alert.alert('Success', 'Observation updated successfully', [
        {
          text: 'OK',
          onPress: () => router.back()
        }
      ]);
    } catch (error) {
      console.error('Error updating observation:', error);
      Alert.alert('Error', 'Failed to update observation');
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
          aspectRatio={[4, 3]}
        />

        {/* Observation */}
        <FormField
          label="Observation"
          required
          value={draft.observation}
          onChangeText={(value) => updateField('observation', value)}
          placeholder="What did you observe?"
          maxLength={500}
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

        {/* Comments */}
        <FormField
          label="Additional Comments"
          value={draft.comments || ''}
          onChangeText={(value) => updateField('comments', value)}
          placeholder="Any additional details"
          maxLength={1000}
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
      </ScrollView>

      {/* Save Button */}
      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <SaveButton
          onPress={handleSave}
          loading={saving}
          label="Save Changes"
          disabled={!draft || !isObservationFormComplete(draft)}
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
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: 1,
  },
});
