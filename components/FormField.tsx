import React from 'react';
import { View, Text, TextInput, StyleSheet, useColorScheme, TextInputProps } from 'react-native';
import { Colors } from '../constants/Colors';

interface FormFieldProps extends TextInputProps {
  label: string;
  required?: boolean;
  error?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  required = false,
  error,
  ...textInputProps
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text }]}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      <TextInput
        style={[
          styles.input,
          {
            color: colors.text,
            backgroundColor: colors.cardBackground,
            borderColor: error ? colors.error : colors.border,
          },
        ]}
        placeholderTextColor={colors.placeholder}
        {...textInputProps}
      />
      {error && <Text style={[styles.error, { color: colors.error }]}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  required: {
    color: '#f44336',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  error: {
    fontSize: 12,
    marginTop: 4,
  },
});
