import React, { useState } from 'react';
import { Text, TouchableOpacity, StyleSheet, useColorScheme, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

interface DateInputProps {
  date: string; // YYYY-MM-DD
  onDateChange: (date: string) => void;
  label?: string;
  required?: boolean;
}

export const DateInput: React.FC<DateInputProps> = ({
  date,
  onDateChange,
  label,
  required = false,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date(date));

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    
    if (selectedDate) {
      setTempDate(selectedDate);
      onDateChange(selectedDate.toISOString().split('T')[0]);
    }
  };

  return (
    <>
      {label && (
        <Text style={[styles.label, { color: colors.text }]}>
          {label} {required && <Text style={styles.required}>*</Text>}
        </Text>
      )}
      <TouchableOpacity
        style={[
          styles.input,
          { backgroundColor: colors.cardBackground, borderColor: colors.border },
        ]}
        onPress={() => setShowPicker(true)}
        accessibilityLabel={`Select date, current value: ${date}`}
        accessibilityRole="button"
      >
        <Text style={{ color: colors.text }}>{date}</Text>
        <Ionicons name="calendar" size={20} color={colors.icon} />
      </TouchableOpacity>
      {showPicker && (
        <DateTimePicker
          value={tempDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  required: {
    color: '#f44336',
  },
  input: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
});
