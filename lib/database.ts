import * as SQLite from 'expo-sqlite';
import { Hike, Observation } from '../types';

const DB_NAME = 'mhike.db';

// Open database connection as a singleton and ensure schema before use
let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;
let schemaEnsured = false;
export const openDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME);
  }
  const db = await dbPromise;
  if (!schemaEnsured) {
    await ensureSchema(db);
    schemaEnsured = true;
  }
  return db;
};

const ensureSchema = async (db: SQLite.SQLiteDatabase) => {
  try {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS hikes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        location TEXT NOT NULL,
        date TEXT NOT NULL,
        parkingAvailable INTEGER NOT NULL DEFAULT 0,
        lengthKm REAL NOT NULL,
        difficulty TEXT NOT NULL,
        description TEXT,
        elevationGainM INTEGER,
        rating REAL,
        photoUri TEXT,
        latitude REAL,
        longitude REAL,
        addedToCalendar INTEGER NOT NULL DEFAULT 0
      );
    `);
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS observations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hikeId INTEGER NOT NULL,
        observation TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        comments TEXT,
        photoUri TEXT,
        FOREIGN KEY (hikeId) REFERENCES hikes(id) ON DELETE CASCADE
      );
    `);
    await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_observations_hikeId ON observations(hikeId);`);
    await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_hikes_name ON hikes(name);`);
    // Schema initialized successfully
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

// Initialize database schema
export const initializeDatabase = async (): Promise<void> => {
  await openDatabase();
};

// ============= HIKE CRUD OPERATIONS =============

export const insertHike = async (hike: Omit<Hike, 'id'>): Promise<number> => {
  const db = await openDatabase();
  
  try {
    const result = await db.runAsync(
      `INSERT INTO hikes (name, location, date, parkingAvailable, lengthKm, difficulty, 
       description, elevationGainM, rating, photoUri, latitude, longitude, addedToCalendar)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        hike.name,
        hike.location,
        hike.date,
        hike.parkingAvailable ? 1 : 0,
        hike.lengthKm,
        hike.difficulty,
        hike.description || null,
        hike.elevationGainM || null,
        hike.rating || null,
        hike.photoUri || null,
        hike.latitude || null,
        hike.longitude || null,
        hike.addedToCalendar ? 1 : 0
      ]
    );
    
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error inserting hike:', error);
    throw error;
  }
};

export const getAllHikes = async (): Promise<Hike[]> => {
  const db = await openDatabase();
  
  try {
    const result = await db.getAllAsync<any>(
      'SELECT * FROM hikes ORDER BY date DESC, name ASC'
    );
    
    return result.map(row => ({
      id: row.id,
      name: row.name,
      location: row.location,
      date: row.date,
      parkingAvailable: row.parkingAvailable === 1,
      lengthKm: row.lengthKm,
      difficulty: row.difficulty,
      description: row.description,
      elevationGainM: row.elevationGainM,
      rating: row.rating,
      photoUri: row.photoUri,
      latitude: row.latitude,
      longitude: row.longitude,
      addedToCalendar: row.addedToCalendar === 1
    }));
  } catch (error) {
    console.error('Error getting all hikes:', error);
    throw error;
  }
};

export const getHikeById = async (id: number): Promise<Hike | null> => {
  const db = await openDatabase();
  
  try {
    const result = await db.getFirstAsync<any>(
      'SELECT * FROM hikes WHERE id = ?',
      [id]
    );
    
    if (!result) return null;
    
    return {
      id: result.id,
      name: result.name,
      location: result.location,
      date: result.date,
      parkingAvailable: result.parkingAvailable === 1,
      lengthKm: result.lengthKm,
      difficulty: result.difficulty,
      description: result.description,
      elevationGainM: result.elevationGainM,
      rating: result.rating,
      photoUri: result.photoUri,
      latitude: result.latitude,
      longitude: result.longitude,
      addedToCalendar: result.addedToCalendar === 1
    };
  } catch (error) {
    console.error('Error getting hike by id:', error);
    throw error;
  }
};

export const updateHike = async (hike: Hike): Promise<void> => {
  const db = await openDatabase();
  
  if (!hike.id) {
    throw new Error('Hike ID is required for update');
  }
  
  try {
    await db.runAsync(
      `UPDATE hikes SET name = ?, location = ?, date = ?, parkingAvailable = ?,
       lengthKm = ?, difficulty = ?, description = ?, elevationGainM = ?, rating = ?,
       photoUri = ?, latitude = ?, longitude = ?, addedToCalendar = ?
       WHERE id = ?`,
      [
        hike.name,
        hike.location,
        hike.date,
        hike.parkingAvailable ? 1 : 0,
        hike.lengthKm,
        hike.difficulty,
        hike.description || null,
        hike.elevationGainM || null,
        hike.rating || null,
        hike.photoUri || null,
        hike.latitude || null,
        hike.longitude || null,
        hike.addedToCalendar ? 1 : 0,
        hike.id
      ]
    );
  } catch (error) {
    console.error('Error updating hike:', error);
    throw error;
  }
};

export const deleteHike = async (id: number): Promise<void> => {
  const db = await openDatabase();
  
  try {
    await db.runAsync('DELETE FROM hikes WHERE id = ?', [id]);
  } catch (error) {
    console.error('Error deleting hike:', error);
    throw error;
  }
};

export const deleteAllHikes = async (): Promise<void> => {
  const db = await openDatabase();
  
  try {
    await db.runAsync('DELETE FROM hikes');
    await db.runAsync('DELETE FROM observations');
  } catch (error) {
    console.error('Error deleting all hikes:', error);
    throw error;
  }
};

export const searchHikes = async (query: string): Promise<Hike[]> => {
  const db = await openDatabase();
  
  try {
    const result = await db.getAllAsync<any>(
      `SELECT * FROM hikes WHERE name LIKE ? ORDER BY name ASC`,
      [`%${query}%`]
    );
    
    return result.map(row => ({
      id: row.id,
      name: row.name,
      location: row.location,
      date: row.date,
      parkingAvailable: row.parkingAvailable === 1,
      lengthKm: row.lengthKm,
      difficulty: row.difficulty,
      description: row.description,
      elevationGainM: row.elevationGainM,
      rating: row.rating,
      photoUri: row.photoUri,
      latitude: row.latitude,
      longitude: row.longitude,
      addedToCalendar: row.addedToCalendar === 1
    }));
  } catch (error) {
    console.error('Error searching hikes:', error);
    throw error;
  }
};

export const advancedSearchHikes = async (
  name?: string,
  location?: string,
  minLen?: number,
  maxLen?: number,
  date?: string,
  difficulty?: string,
  parking?: boolean
): Promise<Hike[]> => {
  const db = await openDatabase();
  
  try {
    let query = 'SELECT * FROM hikes WHERE 1=1';
    const params: any[] = [];
    
    if (name) {
      query += ' AND name LIKE ?';
      params.push(`%${name}%`);
    }
    
    if (location) {
      query += ' AND location LIKE ?';
      params.push(`%${location}%`);
    }
    
    if (minLen !== undefined) {
      query += ' AND lengthKm >= ?';
      params.push(minLen);
    }
    
    if (maxLen !== undefined) {
      query += ' AND lengthKm <= ?';
      params.push(maxLen);
    }
    
    if (date) {
      query += ' AND date = ?';
      params.push(date);
    }
    
    if (difficulty) {
      query += ' AND difficulty = ?';
      params.push(difficulty);
    }
    
    if (parking !== undefined) {
      query += ' AND parkingAvailable = ?';
      params.push(parking ? 1 : 0);
    }
    
    query += ' ORDER BY date DESC, name ASC';
    
    const result = await db.getAllAsync<any>(query, params);
    
    return result.map(row => ({
      id: row.id,
      name: row.name,
      location: row.location,
      date: row.date,
      parkingAvailable: row.parkingAvailable === 1,
      lengthKm: row.lengthKm,
      difficulty: row.difficulty,
      description: row.description,
      elevationGainM: row.elevationGainM,
      rating: row.rating,
      photoUri: row.photoUri,
      latitude: row.latitude,
      longitude: row.longitude,
      addedToCalendar: row.addedToCalendar === 1
    }));
  } catch (error) {
    console.error('Error in advanced search:', error);
    throw error;
  }
};

export const findDuplicateHike = async (hike: Omit<Hike, 'id'>): Promise<Hike | null> => {
  const db = await openDatabase();
  
  try {
    const result = await db.getFirstAsync<any>(
      `SELECT * FROM hikes WHERE 
       name = ? AND location = ? AND date = ? AND 
       lengthKm = ? AND difficulty = ? AND parkingAvailable = ?
       LIMIT 1`,
      [
        hike.name,
        hike.location,
        hike.date,
        hike.lengthKm,
        hike.difficulty,
        hike.parkingAvailable ? 1 : 0
      ]
    );
    
    if (!result) return null;
    
    return {
      id: result.id,
      name: result.name,
      location: result.location,
      date: result.date,
      parkingAvailable: result.parkingAvailable === 1,
      lengthKm: result.lengthKm,
      difficulty: result.difficulty,
      description: result.description,
      elevationGainM: result.elevationGainM,
      rating: result.rating,
      photoUri: result.photoUri,
      latitude: result.latitude,
      longitude: result.longitude,
      addedToCalendar: result.addedToCalendar === 1
    };
  } catch (error) {
    console.error('Error finding duplicate hike:', error);
    throw error;
  }
};

// ============= OBSERVATION CRUD OPERATIONS =============

export const insertObservation = async (observation: Omit<Observation, 'id'>): Promise<number> => {
  const db = await openDatabase();
  
  try {
    const result = await db.runAsync(
      `INSERT INTO observations (hikeId, observation, timestamp, comments, photoUri)
       VALUES (?, ?, ?, ?, ?)`,
      [
        observation.hikeId,
        observation.observation,
        observation.timestamp,
        observation.comments || null,
        observation.photoUri || null
      ]
    );
    
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error inserting observation:', error);
    throw error;
  }
};

export const getObservationsByHikeId = async (hikeId: number): Promise<Observation[]> => {
  const db = await openDatabase();
  
  try {
    const result = await db.getAllAsync<any>(
      'SELECT * FROM observations WHERE hikeId = ? ORDER BY timestamp DESC',
      [hikeId]
    );
    
    return result.map(row => ({
      id: row.id,
      hikeId: row.hikeId,
      observation: row.observation,
      timestamp: row.timestamp,
      comments: row.comments,
      photoUri: row.photoUri
    }));
  } catch (error) {
    console.error('Error getting observations:', error);
    throw error;
  }
};

export const getObservationById = async (id: number): Promise<Observation | null> => {
  const db = await openDatabase();
  
  try {
    const result = await db.getFirstAsync<any>(
      'SELECT * FROM observations WHERE id = ?',
      [id]
    );
    
    if (!result) return null;
    
    return {
      id: result.id,
      hikeId: result.hikeId,
      observation: result.observation,
      timestamp: result.timestamp,
      comments: result.comments,
      photoUri: result.photoUri
    };
  } catch (error) {
    console.error('Error getting observation by id:', error);
    throw error;
  }
};

export const updateObservation = async (observation: Observation): Promise<void> => {
  const db = await openDatabase();
  
  if (!observation.id) {
    throw new Error('Observation ID is required for update');
  }
  
  try {
    await db.runAsync(
      `UPDATE observations SET observation = ?, timestamp = ?, comments = ?, photoUri = ?
       WHERE id = ?`,
      [
        observation.observation,
        observation.timestamp,
        observation.comments || null,
        observation.photoUri || null,
        observation.id
      ]
    );
  } catch (error) {
    console.error('Error updating observation:', error);
    throw error;
  }
};

export const deleteObservation = async (id: number): Promise<void> => {
  const db = await openDatabase();
  
  try {
    await db.runAsync('DELETE FROM observations WHERE id = ?', [id]);
  } catch (error) {
    console.error('Error deleting observation:', error);
    throw error;
  }
};
