import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  useColorScheme,
  ScrollView,
} from 'react-native';
import { Colors } from '../constants/Colors';
import { FormField } from './FormField';
import { DateInput } from './DateInput';
import { DifficultySelector } from './DifficultySelector';

interface FilterCriteria {
  name?: string;
  location?: string;
  minLength?: string;
  maxLength?: string;
  date?: string;
  difficulty?: 'Easy' | 'Moderate' | 'Hard' | '';
  parking?: boolean | null;
}

interface AdvancedFilterDialogProps {
  visible: boolean;
  onClose: () => void;
  onApplyFilter: (criteria: FilterCriteria) => void;
  onClearFilter: () => void;
}

export const AdvancedFilterDialog: React.FC<AdvancedFilterDialogProps> = ({
  visible,
  onClose,
  onApplyFilter,
  onClearFilter,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [minLength, setMinLength] = useState('');
  const [maxLength, setMaxLength] = useState('');
  const [date, setDate] = useState('');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Moderate' | 'Hard' | ''>('');
  const [parkingFilter, setParkingFilter] = useState<'any' | 'yes' | 'no'>('any');

  const handleApply = () => {
    const criteria: FilterCriteria = {};
    
    if (name.trim()) criteria.name = name.trim();
    if (location.trim()) criteria.location = location.trim();
    if (minLength.trim()) criteria.minLength = minLength.trim();
    if (maxLength.trim()) criteria.maxLength = maxLength.trim();
    if (date) criteria.date = date;
    if (difficulty) criteria.difficulty = difficulty;
    if (parkingFilter !== 'any') {
      criteria.parking = parkingFilter === 'yes';
    }

    onApplyFilter(criteria);
    onClose();
  };

  const handleClear = () => {
    setName('');
    setLocation('');
    setMinLength('');
    setMaxLength('');
    setDate('');
    setDifficulty('');
    setParkingFilter('any');
    onClearFilter();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.dialog, { backgroundColor: colors.surface }]}>
          <Text style={[styles.title, { color: colors.text }]}>Advanced Filters</Text>

          <ScrollView style={styles.content}>
            {/* Name Filter */}
            <FormField
              label="Hike Name"
              value={name}
              onChangeText={setName}
              placeholder="Filter by name..."
            />

            {/* Location Filter */}
            <FormField
              label="Location"
              value={location}
              onChangeText={setLocation}
              placeholder="Filter by location..."
            />

            {/* Length Range */}
            <View style={styles.row}>
              <View style={styles.halfField}>
                <FormField
                  label="Min Length (km)"
                  value={minLength}
                  onChangeText={setMinLength}
                  placeholder="0"
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.halfField}>
                <FormField
                  label="Max Length (km)"
                  value={maxLength}
                  onChangeText={setMaxLength}
                  placeholder="∞"
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            {/* Date Filter */}
            <DateInput
              label="Date"
              date={date}
              onDateChange={setDate}
            />

            {/* Difficulty Filter */}
            <Text style={[styles.label, { color: colors.text }]}>Difficulty</Text>
            {difficulty ? (
              <View>
                <DifficultySelector
                  difficulty={difficulty}
                  onDifficultyChange={(d) => setDifficulty(d)}
                />
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => setDifficulty('')}
                  accessibilityLabel="Clear difficulty filter"
                  accessibilityRole="button"
                >
                  <Text style={{ color: colors.error }}>Clear Difficulty</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.parkingOptions}>
                {(['Easy', 'Moderate', 'Hard'] as const).map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.parkingOption, { borderColor: colors.border }]}
                    onPress={() => setDifficulty(d)}
                    accessibilityLabel={`Select ${d} difficulty`}
                    accessibilityRole="button"
                  >
                    <Text style={[styles.parkingText, { color: colors.text }]}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Parking Filter */}
            <Text style={[styles.label, { color: colors.text }]}>Parking</Text>
            <View style={styles.parkingOptions}>
              <TouchableOpacity
                style={[
                  styles.parkingOption,
                  parkingFilter === 'any' && { backgroundColor: colors.primary },
                  { borderColor: colors.border },
                ]}
                onPress={() => setParkingFilter('any')}
                accessibilityLabel="Any parking"
                accessibilityRole="button"
                accessibilityState={{ selected: parkingFilter === 'any' }}
              >
                <Text
                  style={[
                    styles.parkingText,
                    { color: parkingFilter === 'any' ? '#fff' : colors.text },
                  ]}
                >
                  Any
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.parkingOption,
                  parkingFilter === 'yes' && { backgroundColor: colors.primary },
                  { borderColor: colors.border },
                ]}
                onPress={() => setParkingFilter('yes')}
                accessibilityLabel="Parking available"
                accessibilityRole="button"
                accessibilityState={{ selected: parkingFilter === 'yes' }}
              >
                <Text
                  style={[
                    styles.parkingText,
                    { color: parkingFilter === 'yes' ? '#fff' : colors.text },
                  ]}
                >
                  Available
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.parkingOption,
                  parkingFilter === 'no' && { backgroundColor: colors.primary },
                  { borderColor: colors.border },
                ]}
                onPress={() => setParkingFilter('no')}
                accessibilityLabel="Parking not available"
                accessibilityRole="button"
                accessibilityState={{ selected: parkingFilter === 'no' }}
              >
                <Text
                  style={[
                    styles.parkingText,
                    { color: parkingFilter === 'no' ? '#fff' : colors.text },
                  ]}
                >
                  Not Available
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.button, styles.clearAllButton, { borderColor: colors.error }]}
              onPress={handleClear}
              accessibilityLabel="Clear all filters"
              accessibilityRole="button"
            >
              <Text style={[styles.buttonText, { color: colors.error }]}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton, { borderColor: colors.border }]}
              onPress={onClose}
              accessibilityLabel="Cancel filter changes"
              accessibilityRole="button"
            >
              <Text style={[styles.buttonText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.applyButton, { backgroundColor: colors.primary }]}
              onPress={handleApply}
              accessibilityLabel="Apply filters"
              accessibilityRole="button"
            >
              <Text style={[styles.buttonText, { color: '#fff' }]}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  dialog: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  content: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  parkingOptions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 12,
  },
  parkingOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  parkingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  clearButton: {
    marginTop: 8,
    marginBottom: 12,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearAllButton: {
    borderWidth: 1,
    marginRight: 'auto',
  },
  cancelButton: {
    borderWidth: 1,
  },
  applyButton: {},
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
