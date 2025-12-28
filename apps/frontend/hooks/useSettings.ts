import { useState, useEffect } from 'react';
import { MediaSortBy, SortOrder } from '@xenforo-media-crawler/contracts';

export interface AppSettings {
  version: string;
  display: {
    itemsPerPage: 12 | 24 | 48 | 96;
    gridColumns: number; // 2-8
    enableAnimations: boolean;
  };
  filters: {
    defaultMediaType: '' | '1' | '2' | '3';
    defaultSort: MediaSortBy;
    defaultSortOrder: SortOrder;
    rememberLastFilters: boolean;
    lastFilters?: {
      mediaTypeId?: string;
      isDownloaded?: string;
      search?: string;
      sortBy?: string;
      sortOrder?: string;
    };
  };
  api: {
    backendUrl: string;
    timeout: number;
    autoRefreshInterval: number; // 0 = off, else milliseconds
  };
}

export const DEFAULT_SETTINGS: AppSettings = {
  version: '1.0',
  display: {
    itemsPerPage: 24,
    gridColumns: 6,
    enableAnimations: true,
  },
  filters: {
    defaultMediaType: '',
    defaultSort: MediaSortBy.CREATED_AT,
    defaultSortOrder: SortOrder.DESC,
    rememberLastFilters: true,
  },
  api: {
    backendUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
    timeout: 30000,
    autoRefreshInterval: 0,
  },
};

const STORAGE_KEY = 'xenforo-media-crawler-settings';

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load settings from localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to ensure all fields exist
        setSettings({
          ...DEFAULT_SETTINGS,
          ...parsed,
          display: { ...DEFAULT_SETTINGS.display, ...parsed.display },
          filters: { ...DEFAULT_SETTINGS.filters, ...parsed.filters },
          api: { ...DEFAULT_SETTINGS.api, ...parsed.api },
        });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSettings = (updates: Partial<AppSettings> | ((prev: AppSettings) => AppSettings)) => {
    setSettings((prev) => {
      const newSettings = typeof updates === 'function' ? updates(prev) : { ...prev, ...updates };

      // Deep merge for nested objects
      if (typeof updates === 'object' && updates !== null) {
        if (updates.display) {
          newSettings.display = { ...prev.display, ...updates.display };
        }
        if (updates.filters) {
          newSettings.filters = { ...prev.filters, ...updates.filters };
        }
        if (updates.api) {
          newSettings.api = { ...prev.api, ...updates.api };
        }
      }

      // Save to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
      } catch (error) {
        console.error('Failed to save settings:', error);
      }

      return newSettings;
    });
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
    } catch (error) {
      console.error('Failed to reset settings:', error);
    }
  };

  const saveLastFilters = (filters: AppSettings['filters']['lastFilters']) => {
    if (settings.filters.rememberLastFilters) {
      updateSettings({
        filters: {
          ...settings.filters,
          lastFilters: filters,
        },
      });
    }
  };

  return {
    settings,
    updateSettings,
    resetSettings,
    saveLastFilters,
    loading,
  };
}
