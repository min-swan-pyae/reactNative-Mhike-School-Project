/**
 * Hike Detail Screen
 * View full hike details and observations
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Hike, Observation } from '../../types';
import { getHikeById, deleteHike, getObservationsByHikeId, deleteObservation, updateHike } from '../../lib/database';
import { shareExportedJson, getExportedJson } from '../../lib/storage';
import { addHikeToCalendar } from '../../lib/calendar';
import { Colors, getDifficultyColor } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { ObservationCard } from '../../components/ObservationCard';
import { StarRating } from '../../components/StarRating';
import { useData } from '../../contexts/DataContext';
import { OptionsMenuDialog } from '../../components/OptionsMenuDialog';

export default function HikeDetailScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const params = useLocalSearchParams<{ id: string }>();
  const hikeId = parseInt(params.id);
  const { notifyHikeChanged } = useData();

  const [hike, setHike] = useState<Hike | null>(null);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isAddingToCalendar, setIsAddingToCalendar] = useState(false);
  const [isDeletingHike, setIsDeletingHike] = useState(false);
  const [deletingObservationId, setDeletingObservationId] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    try {
      const hikeData = await getHikeById(hikeId);
      if (!hikeData) {
        Alert.alert('Error', 'Hike not found');
        router.back();
        return;
      }
      setHike(hikeData);

      const obsData = await getObservationsByHikeId(hikeId);
      setObservations(obsData);
    } catch (error) {
      console.error('Error loading hike:', error);
      Alert.alert('Error', 'Failed to load hike details');
    } finally {
      setLoading(false);
    }
  }, [hikeId]);

  // Reload data when screen comes into focus (after returning from edit)
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleEdit = () => {
    router.push({ pathname: '/hike/edit', params: { hikeId: hikeId.toString() } });
  };

  const handleDelete = () => {
    if (isDeletingHike) return; // Prevent double-tap
    
    Alert.alert(
      'Delete hike?',
      'This will permanently delete the hike and all its observations.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeletingHike(true);
            try {
              await deleteHike(hikeId);
              notifyHikeChanged(); // Trigger live update
              Alert.alert('Success', 'Hike deleted');
              router.replace('/');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete hike');
            } finally {
              setIsDeletingHike(false);
            }
          },
        },
      ]
    );
  };

  const handleExport = async () => {
    if (!hike || isExporting) return; // Prevent double-tap
    setShowExportOptions(true);
  };

  const shareAsFile = async (h: Hike) => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      await shareExportedJson(h);
    } catch (error) {
      console.error('Error exporting:', error);
      Alert.alert('Error', 'Failed to export hike');
    } finally {
      setIsExporting(false);
    }
  };

  const copyToClipboard = async (h: Hike) => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const jsonText = await getExportedJson(h);
      Clipboard.setString(jsonText);
      Alert.alert('Success', 'Hike data copied to clipboard!');
    } catch (error) {
      console.error('Error copying:', error);
      Alert.alert('Error', 'Failed to copy to clipboard');
    } finally {
      setIsExporting(false);
    }
  };

  const handleAddToCalendar = async () => {
    if (!hike || isAddingToCalendar) return; // Prevent double-tap
    
    setIsAddingToCalendar(true);
    try {
      const success = await addHikeToCalendar(hike);
      if (success) {
        // Update the hike's addedToCalendar field
        const updatedHike = { ...hike, addedToCalendar: true };
        await updateHike(updatedHike);
        setHike(updatedHike);
        notifyHikeChanged();
      }
    } catch (error) {
      console.error('Error updating addedToCalendar field:', error);
    } finally {
      setIsAddingToCalendar(false);
    }
  };

  const handleAddObservation = () => {
    router.push({ pathname: '/observation/add', params: { hikeId: hikeId.toString() } });
  };

  const handleEditObservation = (observation: Observation) => {
    router.push({
      pathname: '/observation/edit',
      params: {
        observationId: observation.id!.toString(),
        hikeId: hikeId.toString(),
      },
    });
  };

  const handleDeleteObservation = (observation: Observation) => {
    if (deletingObservationId !== null) return; // Prevent double-tap
    
    Alert.alert(
      'Delete observation?',
      'This will permanently delete this observation.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingObservationId(observation.id!);
            try {
              await deleteObservation(observation.id!);
              await loadData();
              Alert.alert('Success', 'Observation deleted');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete observation');
            } finally {
              setDeletingObservationId(null);
            }
          },
        },
      ]
    );
  };

  if (loading || !hike) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <OptionsMenuDialog
        visible={showExportOptions}
        onClose={() => setShowExportOptions(false)}
        title="Export Hike"
        options={[
          { icon: 'share-outline', label: 'Share as File', onPress: () => shareAsFile(hike!) },
          { icon: 'copy', label: 'Copy to Clipboard', onPress: () => copyToClipboard(hike!) },
        ]}
      />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Photo */}
        {hike.photoUri && (
          <Image 
            source={{ uri: hike.photoUri }} 
            style={styles.photo}
            accessibilityLabel="Hike photo"
          />
        )}

        {/* Main Info Card */}
        <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.hikeName, { color: colors.text }]}>{hike.name}</Text>

          <View style={styles.infoRow}>
            <Ionicons name="location" size={20} color={colors.icon} />
            <Text style={[styles.infoText, { color: colors.text }]}>{hike.location}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="calendar" size={20} color={colors.icon} />
            <Text style={[styles.infoText, { color: colors.text }]}>{hike.date}</Text>
          </View>

          <View style={styles.chipsRow}>
            <View style={[styles.chip, { backgroundColor: getDifficultyColor(hike.difficulty, colorScheme) }]}>
              <Text style={styles.chipText}>{hike.difficulty}</Text>
            </View>
            <View style={[styles.chip, { backgroundColor: colors.secondary }]}>
              <Ionicons name="walk" size={14} color="#fff" />
              <Text style={styles.chipText}>{hike.lengthKm} km</Text>
            </View>
            <View style={[styles.chip, { backgroundColor: hike.parkingAvailable ? colors.success : colors.error }]}>
              <Ionicons name="car" size={14} color="#fff" />
              <Text style={styles.chipText}>{hike.parkingAvailable ? 'Parking' : 'No Parking'}</Text>
            </View>
          </View>

          {hike.rating !== undefined && hike.rating > 0 && (
            <View style={styles.ratingContainer}>
              <Text style={[styles.ratingLabel, { color: colors.disabled }]}>Rating</Text>
              <StarRating rating={hike.rating} onRatingChange={() => {}} size={24} readonly />
            </View>
          )}

          {hike.elevationGainM !== undefined && (
            <View style={styles.infoRow}>
              <Ionicons name="trending-up" size={20} color={colors.icon} />
              <Text style={[styles.infoText, { color: colors.text }]}>
                Elevation Gain: {hike.elevationGainM} m
              </Text>
            </View>
          )}

          {hike.description && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
              <Text style={[styles.description, { color: colors.text }]}>{hike.description}</Text>
            </>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.secondary }]}
            onPress={handleEdit}
            disabled={isDeletingHike}
            accessibilityLabel="Edit hike details"
            accessibilityRole="button"
          >
            <Ionicons name="pencil" size={18} color="#fff" />
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton, 
              { 
                backgroundColor: colors.primary,
                opacity: isExporting ? 0.6 : 1
              }
            ]}
            onPress={handleExport}
            disabled={isExporting || isDeletingHike}
            accessibilityLabel="Export hike data"
            accessibilityRole="button"
          >
            {isExporting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="share-outline" size={18} color="#fff" />
            )}
            <Text style={styles.actionButtonText}>Export</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton, 
              { 
                backgroundColor: colors.error,
                opacity: isDeletingHike ? 0.6 : 1
              }
            ]}
            onPress={handleDelete}
            disabled={isDeletingHike}
            accessibilityLabel="Delete hike"
            accessibilityRole="button"
          >
            {isDeletingHike ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="trash" size={18} color="#fff" />
            )}
            <Text style={styles.actionButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>

        {/* Add to Calendar Button */}
        <TouchableOpacity
          style={[
            styles.calendarButton,
            { 
              backgroundColor: hike.addedToCalendar ? colors.disabled : colors.success,
              opacity: (hike.addedToCalendar || isAddingToCalendar) ? 0.6 : 1
            }
          ]}
          onPress={handleAddToCalendar}
          disabled={hike.addedToCalendar || isAddingToCalendar || isDeletingHike}
          accessibilityLabel={hike.addedToCalendar ? "Already added to calendar" : "Add to calendar"}
          accessibilityRole="button"
          accessibilityState={{ busy: isAddingToCalendar }}
        >
          {isAddingToCalendar ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons 
              name={hike.addedToCalendar ? "checkmark-circle" : "calendar"} 
              size={20} 
              color="#fff" 
            />
          )}
          <Text style={styles.calendarButtonText}>
            {isAddingToCalendar 
              ? "Adding..." 
              : hike.addedToCalendar 
                ? "Added to Calendar" 
                : "Add to Calendar"}
          </Text>
        </TouchableOpacity>

        {/* Observations Section */}
        <View style={styles.observationsSection}>
          <View style={styles.observationsHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Observations ({observations.length})
            </Text>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={handleAddObservation}
              accessibilityLabel="Add new observation"
              accessibilityRole="button"
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>

          {observations.length === 0 ? (
            <View style={[styles.emptyObservations, { backgroundColor: colors.cardBackground }]}>
              <Ionicons name="eye-off-outline" size={48} color={colors.disabled} />
              <Text style={[styles.emptyText, { color: colors.disabled }]}>
                No observations yet
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.disabled }]}>
                Tap the Add button to record your first observation
              </Text>
            </View>
          ) : (
            observations.map((obs) => (
              <ObservationCard
                key={obs.id}
                observation={obs}
                onEdit={() => handleEditObservation(obs)}
                onDelete={() => handleDeleteObservation(obs)}
              />
            ))
          )}
        </View>
      </ScrollView>
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
    paddingBottom: 20,
  },
  photo: {
    width: '100%',
    height: 250,
  },
  card: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  hikeName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 16,
    flex: 1,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  chipText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  ratingContainer: {
    marginTop: 12,
  },
  ratingLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    marginBottom: 6,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 22,
  },
  actionsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  calendarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    gap: 8,
  },
  calendarButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  observationsSection: {
    paddingHorizontal: 16,
  },
  observationsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyObservations: {
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});
