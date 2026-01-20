import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

interface MenuOption {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  color?: string;
}

interface OptionsMenuDialogProps {
  visible: boolean;
  onClose: () => void;
  options: MenuOption[];
  title?: string;
}

export function OptionsMenuDialog({ visible, onClose, options, title = 'Choose an option' }: OptionsMenuDialogProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable 
        style={styles.overlay} 
        onPress={onClose}
        accessibilityLabel="Close menu"
        accessibilityRole="button"
      >
        <Pressable style={[styles.dialog, { backgroundColor: colors.cardBackground }]}>
          {/* Title */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          </View>

          {/* Options */}
          <View style={styles.optionsContainer}>
            {options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.option,
                  { borderBottomColor: colors.border },
                  index === options.length - 1 && styles.lastOption,
                ]}
                onPress={() => {
                  onClose();
                  option.onPress();
                }}
                activeOpacity={0.7}
                accessibilityLabel={option.label}
                accessibilityRole="button"
              >
                <View style={[styles.iconContainer, { backgroundColor: option.color ? `${option.color}15` : colors.background }]}>
                  <Ionicons 
                    name={option.icon} 
                    size={24} 
                    color={option.color || colors.primary} 
                  />
                </View>
                <Text style={[styles.optionText, { color: colors.text }]}>
                  {option.label}
                </Text>
                <Ionicons name="chevron-forward" size={20} color={colors.secondary} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Cancel Button */}
          <TouchableOpacity
            style={[
              styles.cancelButton, 
              { 
                backgroundColor: colorScheme === 'dark' ? 'rgba(76, 175, 80, 0.2)' : colors.background,
                borderTopColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              }
            ]}
            onPress={onClose}
            activeOpacity={0.7}
            accessibilityLabel="Cancel"
            accessibilityRole="button"
          >
            <Text style={[styles.cancelText, { color: colors.primary }]}>Cancel</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialog: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  header: {
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  optionsContainer: {
    paddingTop: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  lastOption: {
    borderBottomWidth: 0,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  cancelButton: {
    padding: 16,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
