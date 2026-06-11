// 全局应用状态管理

import React, { createContext, useContext, useReducer, type Dispatch } from 'react';
import type { Character } from '@/types/character';
import { getStorage, setStorage } from '@/utils/storage';
import { STORAGE_KEYS } from '@/utils/constants';
import type { ApiConfig } from '@/llm';

export interface AppState {
  characters: Character[];
  activeCharacterId: string | null;
  apiConfig: ApiConfig | null;
  disclaimerRead: boolean;
}

type Action =
  | { type: 'SET_CHARACTERS'; payload: Character[] }
  | { type: 'ADD_CHARACTER'; payload: Character }
  | { type: 'UPDATE_CHARACTER'; payload: Character }
  | { type: 'DELETE_CHARACTER'; payload: string }
  | { type: 'SET_ACTIVE'; payload: string | null }
  | { type: 'SET_API_CONFIG'; payload: ApiConfig }
  | { type: 'SET_DISCLAIMER'; payload: boolean };

function initState(): AppState {
  return {
    characters: getStorage<Character[]>(STORAGE_KEYS.CHARACTERS, []),
    activeCharacterId: getStorage<string | null>(STORAGE_KEYS.ACTIVE_CHARACTER, null),
    apiConfig: null,
    disclaimerRead: getStorage<boolean>(STORAGE_KEYS.DISCLAIMER_READ, false),
  };
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_CHARACTERS': {
      setStorage(STORAGE_KEYS.CHARACTERS, action.payload);
      return { ...state, characters: action.payload };
    }
    case 'ADD_CHARACTER': {
      const chars = [...state.characters, action.payload];
      setStorage(STORAGE_KEYS.CHARACTERS, chars);
      return { ...state, characters: chars, activeCharacterId: action.payload.id };
    }
    case 'UPDATE_CHARACTER': {
      const chars = state.characters.map(c => c.id === action.payload.id ? action.payload : c);
      setStorage(STORAGE_KEYS.CHARACTERS, chars);
      return { ...state, characters: chars };
    }
    case 'DELETE_CHARACTER': {
      const chars = state.characters.filter(c => c.id !== action.payload);
      setStorage(STORAGE_KEYS.CHARACTERS, chars);
      return { ...state, characters: chars, activeCharacterId: state.activeCharacterId === action.payload ? null : state.activeCharacterId };
    }
    case 'SET_ACTIVE':
      setStorage(STORAGE_KEYS.ACTIVE_CHARACTER, action.payload);
      return { ...state, activeCharacterId: action.payload };
    case 'SET_API_CONFIG':
      return { ...state, apiConfig: action.payload };
    case 'SET_DISCLAIMER':
      setStorage(STORAGE_KEYS.DISCLAIMER_READ, action.payload);
      return { ...state, disclaimerRead: action.payload };
    default:
      return state;
  }
}

const AppCtx = createContext<{ state: AppState; dispatch: Dispatch<Action> } | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initState);
  return React.createElement(AppCtx.Provider, { value: { state, dispatch } }, children);
}

export function useApp() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
