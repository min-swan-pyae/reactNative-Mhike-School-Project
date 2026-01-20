import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, useColorScheme } from 'react-native';
import { Hike } from '../types';
import { Colors, getDifficultyColor } from '../constants/Colors';

interface HikeCardProps {
  hike: Hike;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const HikeCardComponent: React.FC<HikeCardProps> = ({ hike, onPress, onEdit, onDelete }) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const formatLength = (length: number): string => {
    return length % 1 === 0 ? `${length.toFixed(0)} km` : `${length.toFixed(1)} km`;
  };

  const formatRating = (rating?: number): string | null => {
    if (!rating || rating <= 0) return null;
    return rating % 1 === 0 ? `⭐${rating.toFixed(0)}` : `⭐${rating.toFixed(1)}`;
  };

  return (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityLabel={`View details for ${hike.name}`}
      accessibilityRole="button"
      accessibilityHint="Opens hike details screen"
    >
      {/* Photo if available */}
      {hike.photoUri && (
        <Image 
          source={{ uri: hike.photoUri }} 
          style={styles.photo}
          resizeMode="cover"
          accessibilityLabel="Hike photo"
        />
      )}

      {/* Hike Name */}
      <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>
        {hike.name}
      </Text>

      {/* Long location display separately if > 35 chars */}
      {hike.location.length > 35 && (
        <Text style={[styles.longLocation, { color: colors.text }]} numberOfLines={2}>
          {hike.location}
        </Text>
      )}

      {/* Chips Container */}
      <View style={styles.chipsContainer}>
        {/* Location chip (only if short) */}
        {hike.location.length <= 35 && (
          <View style={[styles.chip, { backgroundColor: colors.chipBackground }]}>
            <Text style={[styles.chipText, { color: colors.chipText }]} numberOfLines={1}>
              {hike.location}
            </Text>
          </View>
        )}

        {/* Date chip */}
        <View style={[styles.chip, { backgroundColor: colors.chipBackground }]}>
          <Text style={[styles.chipText, { color: colors.chipText }]}>
            {hike.date}
          </Text>
        </View>

        {/* Length chip */}
        <View style={[styles.chip, { backgroundColor: colors.chipBackground }]}>
          <Text style={[styles.chipText, { color: colors.chipText }]}>
            {formatLength(hike.lengthKm)}
          </Text>
        </View>

        {/* Difficulty chip with color */}
        <View style={[styles.chip, { backgroundColor: getDifficultyColor(hike.difficulty, colorScheme) + '20' }]}>
          <Text style={[styles.chipText, { color: getDifficultyColor(hike.difficulty, colorScheme) }]}>
            {hike.difficulty}
          </Text>
        </View>

        {/* Parking chip */}
        <View style={[styles.chip, { backgroundColor: colors.chipBackground }]}>
          <Text style={[styles.chipText, { color: colors.chipText }]}>
            Parking: {hike.parkingAvailable ? 'Available' : 'Unavailable'}
          </Text>
        </View>

        {/* Elevation chip if available */}
        {hike.elevationGainM && hike.elevationGainM > 0 && (
          <View style={[styles.chip, { backgroundColor: colors.chipBackground }]}>
            <Text style={[styles.chipText, { color: colors.chipText }]}>
              ↗ {hike.elevationGainM} m
            </Text>
          </View>
        )}

        {/* Rating chip if available */}
        {formatRating(hike.rating) && (
          <View style={[styles.chip, { backgroundColor: colors.chipBackground }]}>
            <Text style={[styles.chipText, { color: colors.chipText }]}>
              {formatRating(hike.rating)}
            </Text>
          </View>
        )}
      </View>

      {/* Description preview if available */}
      {hike.description && hike.description.trim().length > 0 && (
        <Text style={[styles.description, { color: colors.icon }]} numberOfLines={2}>
          {hike.description}
        </Text>
      )}

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={(e) => { e.stopPropagation(); onEdit(); }}
          accessibilityLabel="Edit hike"
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.error }]}
          onPress={(e) => { e.stopPropagation(); onDelete(); }}
          accessibilityLabel="Delete hike"
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  photo: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 12,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  longLocation: {
    fontSize: 14,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

// Memoize component to prevent re-renders when props haven't changed
export const HikeCard = React.memo(HikeCardComponent);
