import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Hike, HikeExportFormat } from '../types';
import { 
  insertHike, 
  insertObservation, 
  findDuplicateHike,
  getObservationsByHikeId 
} from './database';


export const saveImageToStorage = async (sourceUri: string): Promise<string> => {
  const filename = `photo_${Date.now()}.jpg`;
  const destUri = `${FileSystem.documentDirectory}${filename}`;
  try {
    await FileSystem.copyAsync({ from: sourceUri, to: destUri });
    return destUri;
  } catch (error) {
    console.warn('copyAsync failed, attempting Base64 fallback:', error);
    try {
      const base64 = await FileSystem.readAsStringAsync(sourceUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      await FileSystem.writeAsStringAsync(destUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return destUri;
    } catch (inner) {
      console.error('Error saving image after fallback:', inner);
      throw inner;
    }
  }
};

export const deleteImageFromStorage = async (uri: string): Promise<void> => {
  try {
    const fileExists = await FileSystem.getInfoAsync(uri);
    if (fileExists.exists) {
      await FileSystem.deleteAsync(uri);
    }
  } catch (error) {
    console.error('Error deleting image:', error);
  }
};


export const exportHikeToJson = async (hike: Hike): Promise<string> => {
  try {
    // Get observations for this hike
    const observations = await getObservationsByHikeId(hike.id!);
    
    // Create export format
    const exportData: HikeExportFormat = {
      name: hike.name,
      location: hike.location,
      date: hike.date,
      parkingAvailable: hike.parkingAvailable,
      lengthKm: hike.lengthKm,
      difficulty: hike.difficulty,
      description: hike.description,
      elevationGainM: hike.elevationGainM,
      rating: hike.rating,
      latitude: hike.latitude,
      longitude: hike.longitude,
      observations: observations.map(obs => ({
        observation: obs.observation,
        timestamp: obs.timestamp,
        comments: obs.comments
      }))
    };
    
    // Create readable text with JSON
    const readableText = `=== Hike Export ===
Name: ${hike.name}
Location: ${hike.location}
Date: ${hike.date}
Length: ${hike.lengthKm} km
Difficulty: ${hike.difficulty}
Parking: ${hike.parkingAvailable ? 'Available' : 'Unavailable'}
${hike.elevationGainM ? `Elevation Gain: ${hike.elevationGainM} m\n` : ''}${hike.rating ? `Rating: ${hike.rating}/5\n` : ''}${hike.description ? `Description: ${hike.description}\n` : ''}
${observations.length > 0 ? `Observations: ${observations.length}\n` : ''}
=== JSON Data (for import) ===
${JSON.stringify(exportData, null, 2)}`;
    
    return readableText;
  } catch (error) {
    console.error('Error exporting hike to JSON:', error);
    throw error;
  }
};

/**
 * Get exported JSON text for a hike (for copying to clipboard)
 */
export const getExportedJson = async (hike: Hike): Promise<string> => {
  return await exportHikeToJson(hike);
};

/**
 * Share exported JSON via share sheet
 */
export const shareExportedJson = async (hike: Hike): Promise<void> => {
  try {
    const jsonText = await exportHikeToJson(hike);
    
    // Save to temporary file
    const filename = `hike_${hike.name.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.txt`;
    const fileUri = `${FileSystem.cacheDirectory}${filename}`;
    
    await FileSystem.writeAsStringAsync(fileUri, jsonText);
    
    // Share the file
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/plain',
        dialogTitle: 'Export Hike'
      });
    } else {
      throw new Error('Sharing is not available on this device');
    }
  } catch (error) {
    console.error('Error sharing JSON:', error);
    throw error;
  }
};


export const parseImportJson = (jsonText: string): HikeExportFormat => {
  try {
    // Try to extract JSON from formatted text
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : jsonText;
    
    const data = JSON.parse(jsonString);
    
    // Validate required fields
    if (!data.name || !data.location || !data.date || 
        data.parkingAvailable === undefined || !data.lengthKm || !data.difficulty) {
      throw new Error('Missing required fields: name, location, date, parkingAvailable, lengthKm, or difficulty');
    }
    
    return data as HikeExportFormat;
  } catch (error) {
    console.error('Error parsing JSON:', error);
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON file format. Please select a valid hike export file.');
    }
    if (error instanceof Error && error.message.includes('required fields')) {
      throw error;
    }
    throw new Error('Invalid hike data format. Please check the file content.');
  }
};

/**
 * Import hike from JSON data
 * Returns true if imported, false if duplicate
 */
export const importHikeFromJson = async (jsonText: string): Promise<{ success: boolean; message: string; hikeId?: number }> => {
  try {
    const importData = parseImportJson(jsonText);
    
    // Check for duplicate
    const duplicate = await findDuplicateHike({
      name: importData.name,
      location: importData.location,
      date: importData.date,
      parkingAvailable: importData.parkingAvailable,
      lengthKm: importData.lengthKm,
      difficulty: importData.difficulty as 'Easy' | 'Moderate' | 'Hard',
      description: importData.description,
      elevationGainM: importData.elevationGainM,
      rating: importData.rating,
      latitude: importData.latitude,
      longitude: importData.longitude
    });
    
    if (duplicate) {
      return {
        success: false,
        message: 'Import failed! You already have this hike'
      };
    }
    
    // Insert hike
    const hikeId = await insertHike({
      name: importData.name,
      location: importData.location,
      date: importData.date,
      parkingAvailable: importData.parkingAvailable,
      lengthKm: importData.lengthKm,
      difficulty: importData.difficulty as 'Easy' | 'Moderate' | 'Hard',
      description: importData.description,
      elevationGainM: importData.elevationGainM,
      rating: importData.rating,
      latitude: importData.latitude,
      longitude: importData.longitude,
      addedToCalendar: false
    });
    
    // Insert observations if any
    if (importData.observations && importData.observations.length > 0) {
      for (const obs of importData.observations) {
        await insertObservation({
          hikeId: hikeId,
          observation: obs.observation,
          timestamp: obs.timestamp,
          comments: obs.comments
        });
      }
    }
    
    return {
      success: true,
      message: `Hike "${importData.name}" imported successfully${importData.observations?.length ? ` with ${importData.observations.length} observation(s)` : ''}`,
      hikeId
    };
  } catch (error) {
    console.error('Error importing hike:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to import hike'
    };
  }
};

/**
 * Pick JSON file from device storage
 */
export const pickJsonFile = async (): Promise<string | null> => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/json', 'text/plain'],
      copyToCacheDirectory: true
    });
    
    if (result.canceled) {
      return null;
    }
    
    const fileUri = result.assets[0].uri;
    const content = await FileSystem.readAsStringAsync(fileUri);
    
    return content;
  } catch (error) {
    console.error('Error picking JSON file:', error);
    throw error;
  }
};
