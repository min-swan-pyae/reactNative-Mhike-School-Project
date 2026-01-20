import React from 'react';
import { View, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

interface StarRatingProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  maxRating?: number;
  size?: number;
  readonly?: boolean;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  onRatingChange,
  maxRating = 5,
  size = 32,
  readonly = false,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const handlePress = (starIndex: number) => {
    if (readonly) return;
    const whole = starIndex;
    // Toggle half vs full: if current rating is less than whole, set to whole - 0.5; else if .5 then full
    if (rating < whole - 0.5) {
      onRatingChange(whole - 0.5);
    } else if (rating === whole - 0.5) {
      onRatingChange(whole);
    } else {
      onRatingChange(whole - 0.5); // allow reducing to half
    }
  };

  return (
    <View style={styles.container}>
      {Array.from({ length: maxRating }, (_, i) => i + 1).map((star) => {
        const fullThreshold = star;
        const halfThreshold = star - 0.5;
        let icon: keyof typeof Ionicons.glyphMap = 'star-outline';
        if (rating >= fullThreshold) icon = 'star';
        else if (rating >= halfThreshold) icon = 'star-half';
        return (
          <TouchableOpacity 
            key={star} 
            onPress={() => handlePress(star)} 
            disabled={readonly}
            accessibilityLabel={icon === 'star' ? `${star} stars selected` : icon === 'star-half' ? `${star - 0.5} stars selected` : `${star} star unselected`}
            accessibilityRole="button"
            accessibilityHint="Double tap to rate"
          >
            <Ionicons
              name={icon}
              size={size}
              color={icon === 'star-outline' ? colors.disabled : '#FFD700'}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
  },
});
