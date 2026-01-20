import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { Colors, getDifficultyColor } from '../constants/Colors';

interface DifficultySelectorProps {
  difficulty: 'Easy' | 'Moderate' | 'Hard';
  onDifficultyChange: (difficulty: 'Easy' | 'Moderate' | 'Hard') => void;
}

export const DifficultySelector: React.FC<DifficultySelectorProps> = ({
  difficulty,
  onDifficultyChange,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const levels: Array<'Easy' | 'Moderate' | 'Hard'> = ['Easy', 'Moderate', 'Hard'];

  return (
    <View style={styles.container}>
      {levels.map((level) => (
        <TouchableOpacity
          key={level}
          style={[
            styles.button,
            difficulty === level && {
              backgroundColor: getDifficultyColor(level, colorScheme),
            },
            difficulty !== level && {
              backgroundColor: colors.cardBackground,
              borderWidth: 1,
              borderColor: colors.border,
            },
          ]}
          onPress={() => onDifficultyChange(level)}
          accessibilityLabel={`${level} difficulty`}
          accessibilityRole="button"
          accessibilityState={{ selected: difficulty === level }}
        >
          <Text
            style={[
              styles.buttonText,
              { color: difficulty === level ? '#fff' : colors.text },
            ]}
          >
            {level}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
