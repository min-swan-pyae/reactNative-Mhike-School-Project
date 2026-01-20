import { Platform, Linking, Alert } from 'react-native';
import * as Calendar from 'expo-calendar';
import { Hike } from '../types';

export const addHikeToCalendar = async (hike: Hike): Promise<boolean> => {
  try {
    if (Platform.OS === 'android') {
      // On Android, use ACTION_INSERT intent to open calendar with pre-filled form
      const hikeDate = new Date(hike.date);
      const startTime = hikeDate.getTime();
      const endTime = startTime + (3 * 60 * 60 * 1000); // Default 3 hours

      const title = encodeURIComponent(`Hike: ${hike.name}`);
      const description = encodeURIComponent(`Location: ${hike.location}\nDistance: ${hike.lengthKm} km\nDifficulty: ${hike.difficulty}\nParking: ${hike.parkingAvailable ? "Available":"Unavailable"}\n ${hike.description? `Description: ${hike.description}` : ""}`);
      const location = encodeURIComponent(hike.location);

      // Android Calendar intent format
      const intentUrl = `intent://edit#Intent;` +
        `action=android.intent.action.INSERT;` +
        `type=vnd.android.cursor.item/event;` +
        `S.title=${title};` +
        `S.description=${description};` +
        `S.eventLocation=${location};` +
        `i.beginTime=${startTime};` +
        `i.endTime=${endTime};` +
        `end`;

      const canOpen = await Linking.canOpenURL(intentUrl);
      if (!canOpen) {
        // If intent doesn't work, try Google Calendar web fallback
        const dateStart = hikeDate.toISOString().replace(/-|:|\.\d\d\d/g, '');
        const dateEnd = new Date(endTime).toISOString().replace(/-|:|\.\d\d\d/g, '');
        const webUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${description}&location=${location}&dates=${dateStart}/${dateEnd}`;
        
        const canOpenWeb = await Linking.canOpenURL(webUrl);
        if (canOpenWeb) {
          await Linking.openURL(webUrl);
          Alert.alert('Opening Calendar', 'Save the event in your browser');
          return true;
        } else {
          Alert.alert('Error', 'No calendar app found. Please install Google Calendar.');
          return false;
        }
      }
      
      await Linking.openURL(intentUrl);
      // Don't show success alert on Android - the calendar app opens
      return true;
    } else {
      // iOS: use Calendar API to create event
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Calendar permission is required to add events');
        return false;
      }

      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const defaultCalendar = calendars.find(cal => cal.allowsModifications) || calendars[0];

      if (!defaultCalendar) {
        Alert.alert('Error', 'No writable calendar found');
        return false;
      }

      const hikeDate = new Date(hike.date);
      await Calendar.createEventAsync(defaultCalendar.id, {
        title: `Hike: ${hike.name}`,
        startDate: hikeDate,
        endDate: new Date(hikeDate.getTime() + (3 * 60 * 60 * 1000)), // 3 hours
        location: hike.location,
        notes: `Distance: ${hike.lengthKm} km\nDifficulty: ${hike.difficulty}`,
      });

      Alert.alert('Success', 'Event added to calendar');
      return true;
    }
  } catch (error) {
    console.error('Error adding to calendar:', error);
    Alert.alert('Error', 'Failed to add to calendar');
    return false;
  }

  return false;
};
