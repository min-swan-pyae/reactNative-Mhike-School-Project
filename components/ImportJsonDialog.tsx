import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  useColorScheme,
  ScrollView,
} from 'react-native';
import { Colors } from '../constants/Colors';

interface ImportJsonDialogProps {
  visible: boolean;
  onClose: () => void;
  onImport: (jsonText: string) => void;
}

export const ImportJsonDialog: React.FC<ImportJsonDialogProps> = ({
  visible,
  onClose,
  onImport,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [jsonText, setJsonText] = useState('');

  const handleImport = () => {
    if (jsonText.trim()) {
      onImport(jsonText.trim());
      setJsonText('');
      onClose();
    }
  };

  const handleCancel = () => {
    setJsonText('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.dialog, { backgroundColor: colors.surface }]}>
          <Text style={[styles.title, { color: colors.text }]}>Paste JSON</Text>
          <Text style={[styles.subtitle, { color: colors.disabled }]}>
            Paste a hike JSON exported from this app.
          </Text>

          <ScrollView style={styles.inputContainer}>
            <TextInput
              style={[
                styles.textInput,
                {
                  color: colors.text,
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.border,
                },
              ]}
              value={jsonText}
              onChangeText={setJsonText}
              placeholder="Paste JSON here..."
              placeholderTextColor={colors.placeholder}
              multiline
              numberOfLines={10}
              textAlignVertical="top"
            />
          </ScrollView>

          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton, { borderColor: colors.border }]}
              onPress={handleCancel}
              accessibilityLabel="Cancel import"
              accessibilityRole="button"
            >
              <Text style={[styles.buttonText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.importButton, { backgroundColor: colors.primary }]}
              onPress={handleImport}
              disabled={!jsonText.trim()}
              accessibilityLabel="Import JSON data"
              accessibilityRole="button"
            >
              <Text style={[styles.buttonText, { color: '#fff' }]}>Import JSON</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialog: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 12,
    padding: 20,
    maxHeight: '80%',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  inputContainer: {
    maxHeight: 300,
    marginBottom: 20,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    fontFamily: 'monospace',
    minHeight: 200,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  importButton: {},
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
