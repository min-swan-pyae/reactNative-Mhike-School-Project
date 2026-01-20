import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  useColorScheme,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ObservationDraft } from '../../types';
import { validateObservation, isObservationFormComplete } from '../../lib/validation';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { FormField } from '../../components/FormField';
import { useFormState } from '../../hooks';

export default function AddObservationScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const params = useLocalSearchParams<{ hikeId: string }>();
  const hikeId = parseInt(params.hikeId);

  const { state: draft, updateField } = useFormState<Partial<ObservationDraft>>({
    hikeId: hikeId,
    observation: '',
    timestamp: Date.now(),
    comments: '',
  });

  const handleContinue = () => {
    const errors = validateObservation(draft as any);
    if (errors.length > 0) {
      Alert.alert('Validation Error', errors.map(e => e.message).join('\n'));
      return;
    }

    router.push({
      pathname: '/observation/confirm',
      params: {
        draftJson: JSON.stringify(draft),
        hikeId: hikeId.toString(),
      },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        

        {/* Observation */}
        <FormField
          label="Observation"
          required
          value={draft.observation || ''}
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

        <View style={[styles.infoBox, { backgroundColor: colors.cardBackground }]}>
          <Ionicons name="information-circle" size={20} color={colors.icon} />
          <Text style={[styles.infoText, { color: colors.text }]}>
            You can add a photo on the next screen
          </Text>
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            {
              backgroundColor: isObservationFormComplete(draft) ? colors.primary : colors.disabled,
              opacity: isObservationFormComplete(draft) ? 1 : 0.6,
            },
          ]}
          onPress={handleContinue}
          disabled={!isObservationFormComplete(draft)}
          accessibilityLabel="Continue to confirmation"
          accessibilityRole="button"
          accessibilityState={{ disabled: !isObservationFormComplete(draft) }}
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
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
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
});
