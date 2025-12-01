import {
  collection,
  doc,
  setDoc,
  getDoc,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Groups, Group } from '../types';

// Saved game format (without computed items array)
interface SavedGroup {
  title: string;
  itemsInput: string;
}

interface SavedGroups {
  1: SavedGroup;
  2: SavedGroup;
  3: SavedGroup;
  4: SavedGroup;
}

export interface SavedGame {
  id?: string;
  title?: string;
  groups: SavedGroups;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface LoadedGame {
  groups: Groups;
  title: string;
}

const GAMES_COLLECTION = 'games';

/**
 * Save a game to Firestore
 */
export const saveGame = async (groups: Groups, title: string = ''): Promise<string> => {
  try {
    // Convert Groups to a serializable format (remove items array, keep itemsInput)
    const serializableGroups: SavedGroups = {
      1: { title: groups[1].title, itemsInput: groups[1].itemsInput },
      2: { title: groups[2].title, itemsInput: groups[2].itemsInput },
      3: { title: groups[3].title, itemsInput: groups[3].itemsInput },
      4: { title: groups[4].title, itemsInput: groups[4].itemsInput },
    };

    const gameData: Omit<SavedGame, 'id'> = {
      title: title.trim() || undefined,
      groups: serializableGroups,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
    };

    // Generate a unique ID
    const gameRef = doc(collection(db, GAMES_COLLECTION));
    await setDoc(gameRef, gameData);

    return gameRef.id;
  } catch (error) {
    console.error('Error saving game:', error);
    throw new Error('Failed to save game. Please try again.');
  }
};

/**
 * Load a game from Firestore by ID
 */
export const loadGame = async (gameId: string): Promise<LoadedGame | null> => {
  try {
    const gameRef = doc(db, GAMES_COLLECTION, gameId);
    const gameSnap = await getDoc(gameRef);

    if (!gameSnap.exists()) {
      return null;
    }

    const gameData = gameSnap.data() as SavedGame;
    // Ensure all groups have items array (empty, will be parsed from itemsInput)
    const loadedGroups: Groups = {
      1: { ...gameData.groups[1], items: [] },
      2: { ...gameData.groups[2], items: [] },
      3: { ...gameData.groups[3], items: [] },
      4: { ...gameData.groups[4], items: [] },
    };
    return {
      groups: loadedGroups,
      title: gameData.title || '',
    };
  } catch (error) {
    console.error('Error loading game:', error);
    throw new Error('Failed to load game. Please check the link and try again.');
  }
};

/**
 * Generate a shareable URL for a game
 */
export const generateShareUrl = (gameId: string): string => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/connections?game=${gameId}`;
};

/**
 * Generate an edit URL for a game
 */
export const generateEditUrl = (gameId: string): string => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/connections?game=${gameId}&edit=true`;
};

