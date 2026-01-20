import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  useColorScheme,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { saveImageToStorage } from '../lib/storage';

interface PhotoPickerProps {
  photoUri?: string;
  onPhotoSelected: (uri: string) => void;
  onPhotoRemoved: () => void;
  aspectRatio?: [number, number];
}

export const PhotoPicker: React.FC<PhotoPickerProps> = ({
  photoUri,
  onPhotoSelected,
  onPhotoRemoved,
  aspectRatio = [16, 9],
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [loading, setLoading] = useState(false);

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required');
        return;
      }

      setLoading(true);
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: aspectRatio,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const savedUri = await saveImageToStorage(result.assets[0].uri);
        onPhotoSelected(savedUri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    } finally {
      setLoading(false);
    }
  };

  const handlePickPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Photo library permission is required');
        return;
      }

      setLoading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: aspectRatio,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const savedUri = await saveImageToStorage(result.assets[0].uri);
        onPhotoSelected(savedUri);
      }
    } catch (error) {
      console.error('Error picking photo:', error);
      Alert.alert('Error', 'Failed to pick photo');
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePhoto = () => {
    Alert.alert('Remove photo?', 'This will remove the photo.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: onPhotoRemoved },
    ]);
  };

  if (photoUri) {
    return (
      <View style={styles.container}>
        <Image 
          source={{ uri: photoUri }} 
          style={styles.photo}
          accessibilityLabel="Selected photo preview"
        />
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.secondary }]}
            onPress={handleTakePhoto}
            disabled={loading}
            accessibilityLabel="Retake photo"
            accessibilityRole="button"
          >
            <Ionicons name="camera" size={18} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.secondary }]}
            onPress={handlePickPhoto}
            disabled={loading}
            accessibilityLabel="Choose different photo"
            accessibilityRole="button"
          >
            <Ionicons name="images" size={18} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.error }]}
            onPress={handleRemovePhoto}
            disabled={loading}
            accessibilityLabel="Remove photo"
            accessibilityRole="button"
          >
            <Ionicons name="trash" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.placeholder,
        { backgroundColor: colors.cardBackground, borderColor: colors.border },
      ]}
    >
      <Ionicons name="image-outline" size={48} color={colors.disabled} />
      <Text style={[styles.placeholderText, { color: colors.disabled }]}>
        No photo added
      </Text>
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.buttonWithText, { backgroundColor: colors.primary }]}
          onPress={handleTakePhoto}
          disabled={loading}
          accessibilityLabel="Take photo with camera"
          accessibilityRole="button"
        >
          <Ionicons name="camera" size={18} color="#fff" />
          <Text style={styles.buttonText}>Take Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.buttonWithText, { backgroundColor: colors.secondary }]}
          onPress={handlePickPhoto}
          disabled={loading}
          accessibilityLabel="Choose photo from gallery"
          accessibilityRole="button"
        >
          <Ionicons name="images" size={18} color="#fff" />
          <Text style={styles.buttonText}>Choose Photo</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  photo: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  placeholder: {
    height: 200,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
    marginTop: 12,
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonWithText: {
    width: 'auto',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: 'row',
    gap: 6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
