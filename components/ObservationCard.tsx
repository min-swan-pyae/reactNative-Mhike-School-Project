import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Observation } from '../types';
import { Colors } from '../constants/Colors';
import { formatDateTime } from '../lib/validation';

interface ObservationCardProps {
  observation: Observation;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const ObservationCard: React.FC<ObservationCardProps> = ({
  observation,
  onPress,
  onEdit,
  onDelete,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.cardBackground }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      accessibilityLabel={`Observation: ${observation.observation}`}
      accessibilityRole="button"
    >
      <View style={styles.header}>
        <View style={styles.timeContainer}>
          <Ionicons name="time-outline" size={16} color={colors.icon} />
          <Text style={[styles.time, { color: colors.text }]}>
            {formatDateTime(observation.timestamp)}
          </Text>
        </View>
        <View style={styles.actions}>
          {onEdit && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.secondary }]}
              onPress={onEdit}
              accessibilityLabel="Edit observation"
              accessibilityRole="button"
            >
              <Ionicons name="pencil" size={16} color="#fff" />
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.error }]}
              onPress={onDelete}
              accessibilityLabel="Delete observation"
              accessibilityRole="button"
            >
              <Ionicons name="trash" size={16} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {observation.photoUri && (
        <Image 
          source={{ uri: observation.photoUri }} 
          style={styles.photo}
          accessibilityLabel="Observation photo"
        />
      )}

      <Text style={[styles.observation, { color: colors.text }]}>
        {observation.observation}
      </Text>

      {observation.comments && (
        <View style={[styles.commentsContainer, { backgroundColor: colors.background }]}>
          <Ionicons name="chatbox-outline" size={14} color={colors.icon} />
          <Text style={[styles.comments, { color: colors.disabled }]}>
            {observation.comments}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  time: {
    fontSize: 14,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photo: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
  },
  observation: {
    fontSize: 16,
    lineHeight: 22,
  },
  commentsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 8,
    padding: 8,
    borderRadius: 6,
  },
  comments: {
    flex: 1,
    fontSize: 14,
    fontStyle: 'italic',
  },
});
