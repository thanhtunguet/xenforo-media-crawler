import { useEffect, useState } from 'react';
import { Layout } from '../components/layout';
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardHeader, GlassCardTitle } from '../components/ui/glass-card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Select } from '../components/ui/select';
import { useSettings } from '../hooks/useSettings';
import { systemApi } from '../lib/api/system.api';
import { MediaSortBy } from '@xenforo-media-crawler/contracts';
import { ButtonVariant, GlassCardVariant } from '../lib/enums';
import { CheckCircle, Loader2, RotateCcw, Save, XCircle } from 'lucide-react';

export default function SettingsPage() {
  const {
    settings,
    updateSettings,
    resetSettings,
    loading: settingsLoading,
  } = useSettings();
  const [localSettings, setLocalSettings] = useState(settings);
  const [backendStatus, setBackendStatus] = useState<{
    status: string;
    version: string;
    uptime: number;
  } | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState<
    'success' | 'error' | null
  >(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  useEffect(() => {
    loadBackendStatus();
  }, []);

  const loadBackendStatus = async () => {
    setStatusLoading(true);
    try {
      const status = await systemApi.getStatus();
      setBackendStatus(status);
    } catch (error) {
      console.error('Failed to load backend status:', error);
    } finally {
      setStatusLoading(false);
    }
  };

  const handleSave = () => {
    updateSettings(localSettings);
    setSaveMessage('Settings saved successfully!');
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      resetSettings();
      setLocalSettings(settings);
      setSaveMessage('Settings reset to defaults');
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionResult(null);
    try {
      await systemApi.getStatus();
      setConnectionResult('success');
      loadBackendStatus();
    } catch (error) {
      setConnectionResult('error');
    } finally {
      setTestingConnection(false);
      setTimeout(() => setConnectionResult(null), 3000);
    }
  };

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  if (settingsLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold gradient-text mb-2">Settings</h1>
          <p className="text-white/60">
            Configure your preferences and view system information
          </p>
        </div>

        {/* Save Message */}
        {saveMessage && (
          <div className="glass-card p-4 border-l-4 border-emerald-500">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-400" />
              <span className="text-white/90">{saveMessage}</span>
            </div>
          </div>
        )}

        {/* Display Preferences */}
        <GlassCard variant={GlassCardVariant.HOVER_GLOW}>
          <GlassCardHeader>
            <GlassCardTitle>Display Preferences</GlassCardTitle>
            <GlassCardDescription>
              Customize how content is displayed
            </GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="items-per-page" className="text-white/80">
                  Items Per Page
                </Label>
                <Select
                  id="items-per-page"
                  value={localSettings.display.itemsPerPage}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      display: {
                        ...localSettings.display,
                        itemsPerPage: Number(e.target.value) as
                          | 12
                          | 24
                          | 48
                          | 96,
                      },
                    })
                  }
                  className="glass-input"
                >
                  <option value="12">12 items</option>
                  <option value="24">24 items</option>
                  <option value="48">48 items</option>
                  <option value="96">96 items</option>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="grid-columns" className="text-white/80">
                  Grid Columns: {localSettings.display.gridColumns}
                </Label>
                <input
                  type="range"
                  id="grid-columns"
                  min="2"
                  max="8"
                  value={localSettings.display.gridColumns}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      display: {
                        ...localSettings.display,
                        gridColumns: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-white/40">
                  <span>2</span>
                  <span>8</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
              <input
                type="checkbox"
                id="enable-animations"
                checked={localSettings.display.enableAnimations}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings,
                    display: {
                      ...localSettings.display,
                      enableAnimations: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
              />
              <Label
                htmlFor="enable-animations"
                className="text-white/80 cursor-pointer"
              >
                Enable animations (counter effects, transitions)
              </Label>
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* Default Filters */}
        <GlassCard variant={GlassCardVariant.HOVER_GLOW}>
          <GlassCardHeader>
            <GlassCardTitle>Default Filters</GlassCardTitle>
            <GlassCardDescription>
              Set default filter preferences for the Media page
            </GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="default-media-type" className="text-white/80">
                  Default Media Type
                </Label>
                <Select
                  id="default-media-type"
                  value={localSettings.filters.defaultMediaType}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      filters: {
                        ...localSettings.filters,
                        defaultMediaType: e.target.value as
                          | ''
                          | '1'
                          | '2'
                          | '3',
                      },
                    })
                  }
                  className="glass-input"
                >
                  <option value="">All Media</option>
                  <option value="1">Images Only</option>
                  <option value="2">Videos Only</option>
                  <option value="3">Links Only</option>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="default-sort" className="text-white/80">
                  Default Sort
                </Label>
                <Select
                  id="default-sort"
                  value={localSettings.filters.defaultSort}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      filters: {
                        ...localSettings.filters,
                        defaultSort: e.target.value as MediaSortBy,
                      },
                    })
                  }
                  className="glass-input"
                >
                  <option value="createdAt">Recent First</option>
                  <option value="updatedAt">Recently Updated</option>
                  <option value="filename">By Filename</option>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
              <input
                type="checkbox"
                id="remember-filters"
                checked={localSettings.filters.rememberLastFilters}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings,
                    filters: {
                      ...localSettings.filters,
                      rememberLastFilters: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
              />
              <Label
                htmlFor="remember-filters"
                className="text-white/80 cursor-pointer"
              >
                Remember last used filters
              </Label>
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* API Configuration */}
        <GlassCard variant={GlassCardVariant.HOVER_GLOW}>
          <GlassCardHeader>
            <GlassCardTitle>API Configuration</GlassCardTitle>
            <GlassCardDescription>
              Configure backend connection settings
            </GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="backend-url" className="text-white/80">
                Backend URL
              </Label>
              <input
                type="text"
                id="backend-url"
                value={localSettings.api.backendUrl}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings,
                    api: {
                      ...localSettings.api,
                      backendUrl: e.target.value,
                    },
                  })
                }
                className="glass-input w-full"
                placeholder="http://localhost:3000"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="timeout" className="text-white/80">
                  Request Timeout (ms)
                </Label>
                <input
                  type="number"
                  id="timeout"
                  value={localSettings.api.timeout}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      api: {
                        ...localSettings.api,
                        timeout: Number(e.target.value),
                      },
                    })
                  }
                  className="glass-input w-full"
                  min="1000"
                  max="300000"
                  step="1000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="auto-refresh" className="text-white/80">
                  Auto Refresh
                </Label>
                <Select
                  id="auto-refresh"
                  value={localSettings.api.autoRefreshInterval}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      api: {
                        ...localSettings.api,
                        autoRefreshInterval: Number(e.target.value),
                      },
                    })
                  }
                  className="glass-input"
                >
                  <option value="0">Off</option>
                  <option value="30000">30 seconds</option>
                  <option value="60000">1 minute</option>
                  <option value="300000">5 minutes</option>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant={ButtonVariant.GLASS}
                onClick={handleTestConnection}
                disabled={testingConnection}
                className="gap-2"
              >
                {testingConnection ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>Test Connection</>
                )}
              </Button>

              {connectionResult === 'success' && (
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle className="h-5 w-5" />
                  <span className="text-sm">Connection successful</span>
                </div>
              )}

              {connectionResult === 'error' && (
                <div className="flex items-center gap-2 text-rose-400">
                  <XCircle className="h-5 w-5" />
                  <span className="text-sm">Connection failed</span>
                </div>
              )}
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* System Information */}
        <GlassCard variant={GlassCardVariant.BORDERED}>
          <GlassCardHeader>
            <GlassCardTitle>System Information</GlassCardTitle>
            <GlassCardDescription>
              Current system status and version information
            </GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent>
            {statusLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                  <span className="text-white/60">App Version</span>
                  <span className="text-white font-mono">
                    v{settings.version}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                  <span className="text-white/60">Backend Status</span>
                  {backendStatus ? (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-emerald-400 font-medium">
                        Online
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-rose-400" />
                      <span className="text-rose-400 font-medium">Offline</span>
                    </div>
                  )}
                </div>

                {backendStatus && (
                  <>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                      <span className="text-white/60">Backend Version</span>
                      <span className="text-white font-mono">
                        v{backendStatus.version}
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                      <span className="text-white/60">Uptime</span>
                      <span className="text-white">
                        {formatUptime(backendStatus.uptime)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}
          </GlassCardContent>
        </GlassCard>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Button
            variant={ButtonVariant.GLASS_PRIMARY}
            onClick={handleSave}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            Save Settings
          </Button>

          <Button
            variant={ButtonVariant.GLASS}
            onClick={handleReset}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset to Defaults
          </Button>
        </div>
      </div>
    </Layout>
  );
}
