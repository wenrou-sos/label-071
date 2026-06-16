import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AlarmParamConfig } from '../types';
import { DEFAULT_ALARM_CONFIG } from '../types';

interface AlarmConfigStore {
  configs: AlarmParamConfig[];
  updateConfig: (key: string, updates: Partial<AlarmParamConfig>) => void;
  resetToDefault: () => void;
  getConfig: (key: string) => AlarmParamConfig | undefined;
  isValueAlarm: (key: string, value: number) => { level: 'normal' | 'warning' | 'alarm'; threshold: number | null };
}

export const useAlarmConfigStore = create<AlarmConfigStore>()(
  persist(
    (set, get) => ({
      configs: DEFAULT_ALARM_CONFIG,

      updateConfig: (key, updates) => {
        set({
          configs: get().configs.map(c =>
            c.key === key ? { ...c, ...updates } : c
          ),
        });
      },

      resetToDefault: () => {
        set({ configs: DEFAULT_ALARM_CONFIG });
      },

      getConfig: (key) => get().configs.find(c => c.key === key),

      isValueAlarm: (key, value) => {
        const config = get().configs.find(c => c.key === key);
        if (!config) return { level: 'normal', threshold: null };

        const isAbove = config.direction === 'above';
        const isBelow = config.direction === 'below';

        if (isAbove) {
          if (config.alarmEnabled && value >= config.alarmThreshold) {
            return { level: 'alarm', threshold: config.alarmThreshold };
          }
          if (config.warningEnabled && value >= config.warningThreshold) {
            return { level: 'warning', threshold: config.warningThreshold };
          }
        } else if (isBelow) {
          if (config.alarmEnabled && value <= config.alarmThreshold) {
            return { level: 'alarm', threshold: config.alarmThreshold };
          }
          if (config.warningEnabled && value <= config.warningThreshold) {
            return { level: 'warning', threshold: config.warningThreshold };
          }
        }

        return { level: 'normal', threshold: null };
      },
    }),
    {
      name: 'alarm-config-storage',
    }
  )
);
