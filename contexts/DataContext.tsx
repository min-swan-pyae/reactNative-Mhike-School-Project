/**
 * Provides live data updates similar to Kotlin LiveData/Flow
 * Automatically refreshes UI when database changes occur
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Hike, Observation } from '../types';
import { getAllHikes, getObservationsByHikeId } from '../lib/database';

type DataContextType = {
  hikes: Hike[];
  refreshHikes: () => Promise<void>;
  refreshing: boolean;
  getObservations: (hikeId: number) => Promise<Observation[]>;
  // Trigger methods to notify context of data changes
  notifyHikeChanged: () => void;
  notifyObservationChanged: () => void;
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hikes, setHikes] = useState<Hike[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [updateTrigger, setUpdateTrigger] = useState(0);

  const refreshHikes = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await getAllHikes();
      setHikes(data);
    } catch (error) {
      console.error('Error refreshing hikes:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const getObservations = useCallback(async (hikeId: number): Promise<Observation[]> => {
    try {
      return await getObservationsByHikeId(hikeId);
    } catch (error) {
      console.error('Error getting observations:', error);
      return [];
    }
  }, []);

  const notifyHikeChanged = useCallback(() => {
    setUpdateTrigger(prev => prev + 1);
  }, []);

  const notifyObservationChanged = useCallback(() => {
    setUpdateTrigger(prev => prev + 1);
  }, []);

  // Auto-refresh when update trigger changes 
  useEffect(() => {
    refreshHikes();
  }, [updateTrigger, refreshHikes]);

  // Initial load
  useEffect(() => {
    refreshHikes();
  }, []);

  return (
    <DataContext.Provider
      value={{
        hikes,
        refreshHikes,
        refreshing,
        getObservations,
        notifyHikeChanged,
        notifyObservationChanged,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
};
