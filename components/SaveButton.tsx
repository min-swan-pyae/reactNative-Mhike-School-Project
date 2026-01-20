import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, useColorScheme } from 'react-native';
import { Colors } from '../constants/Colors';

interface SaveButtonProps {
  onPress: () => void;
  loading: boolean;
  label?: string;
  loadingLabel?: string;
  disabled?: boolean;
}

export function SaveButton({ 
  onPress, 
  loading, 
  label = 'Save', 
  loadingLabel = 'Saving...',
  disabled = false 
}: SaveButtonProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const isDisabled = loading || disabled;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { 
          backgroundColor: isDisabled ? colors.disabled : colors.primary,
          opacity: isDisabled ? 0.6 : 1
        }
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ busy: loading, disabled: isDisabled }}
    >
      {loading && <ActivityIndicator color="#fff" style={styles.spinner} />}
      <Text style={styles.buttonText}>
        {loading ? loadingLabel : label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginVertical: 8,
  },
  spinner: {
    marginRight: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
