/**
 * Root layout for M-Hike
 * Initializes database and sets up navigation
 */

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initializeDatabase } from '../lib/database';
import { DataProvider } from '../contexts/DataContext';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    // Initialize database on app start
    initializeDatabase().catch(console.error);
  }, []);

  return (
    <DataProvider>
      <SafeAreaProvider>
        <StatusBar style={'light'} translucent={false} />
        <Stack
          screenOptions={{
            contentStyle: { backgroundColor: colorScheme === 'dark' ? '#121212' : '#fff' },
            headerStyle: {
              backgroundColor: colorScheme === 'dark' ? '#1E1E1E' : '#4CAF50',
            },
            headerShadowVisible: false,
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
        <Stack.Screen 
          name="index" 
          options={{ 
            title: 'Hikes',
            headerShown: true
          }} 
        />
        <Stack.Screen 
          name="hike/add" 
          options={{ title: 'New Hike' }} 
        />
        <Stack.Screen 
          name="hike/edit" 
          options={{ title: 'Edit Hike' }} 
        />
        <Stack.Screen 
          name="hike/[id]" 
          options={{ title: 'Hike Details' }} 
        />
        <Stack.Screen 
          name="hike/confirm" 
          options={{ title: 'Confirm Hike' }} 
        />
        <Stack.Screen 
          name="observation/add" 
          options={{ title: 'Add Observation' }} 
        />
        <Stack.Screen 
          name="observation/edit" 
          options={{ title: 'Edit Observation' }} 
        />
        <Stack.Screen 
          name="observation/confirm" 
          options={{ title: 'Confirm Observation' }} 
        />
        <Stack.Screen 
          name="map-picker" 
          options={{ title: 'Pick Location', presentation: 'modal' }} 
        />
        </Stack>
      </SafeAreaProvider>
    </DataProvider>
  );
}
