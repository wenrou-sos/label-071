import { create } from 'zustand';
import type { FanParameters, AlarmRecord } from '@/types';
import { generateFanParams, generateFanHistory } from '@/mock/fanData';
import { generateAlarmRecords } from '@/mock/alarmData';

interface FanStore {
  currentParams: FanParameters;
  paramHistory: FanParameters[];
  alarmRecords: AlarmRecord[];
  alarmModalVisible: boolean;
  currentAlarm: AlarmRecord | null;
  shutdownConfirmVisible: boolean;

  refreshParams: () => void;
  addAlarm: (record: AlarmRecord) => void;
  setAlarmModalVisible: (visible: boolean, alarm?: AlarmRecord | null) => void;
  setShutdownConfirmVisible: (visible: boolean) => void;
  handleAlarm: (id: string, handler: string) => void;
  executeShutdown: () => void;
  filterAlarms: (startTime: string | null, endTime: string | null, level: string | null) => AlarmRecord[];
}

export const useFanStore = create<FanStore>((set, get) => ({
  currentParams: generateFanParams(),
  paramHistory: generateFanHistory(60),
  alarmRecords: generateAlarmRecords(),
  alarmModalVisible: false,
  currentAlarm: null,
  shutdownConfirmVisible: false,

  refreshParams: () => {
    const newParams = generateFanParams();
    const prev = get().currentParams;

    // Check for alarm conditions
    if (newParams.bearingTemp >= 85) {
      const alarm: AlarmRecord = {
        id: `alarm-${Date.now()}`,
        fanId: newParams.fanId,
        fanName: newParams.fanName,
        parameter: '轴承温度',
        value: newParams.bearingTemp,
        threshold: 85,
        level: 'alarm',
        message: `${newParams.fanName}轴承温度${newParams.bearingTemp}°C，超过红色报警阈值85°C`,
        timestamp: new Date().toISOString(),
        handled: false,
        shutdown: false,
      };
      set(state => ({
        currentParams: newParams,
        paramHistory: [...state.paramHistory.slice(-59), newParams],
        alarmRecords: [alarm, ...state.alarmRecords],
        alarmModalVisible: true,
        currentAlarm: alarm,
      }));
    } else if (newParams.bearingTemp >= 75) {
      const alarm: AlarmRecord = {
        id: `alarm-${Date.now()}`,
        fanId: newParams.fanId,
        fanName: newParams.fanName,
        parameter: '轴承温度',
        value: newParams.bearingTemp,
        threshold: 75,
        level: 'warning',
        message: `${newParams.fanName}轴承温度${newParams.bearingTemp}°C，超过黄色预警阈值75°C`,
        timestamp: new Date().toISOString(),
        handled: false,
      };
      set(state => ({
        currentParams: newParams,
        paramHistory: [...state.paramHistory.slice(-59), newParams],
        alarmRecords: [alarm, ...state.alarmRecords],
      }));
    } else {
      set(state => ({
        currentParams: newParams,
        paramHistory: [...state.paramHistory.slice(-59), newParams],
      }));
    }
  },

  addAlarm: (record) => set(state => ({
    alarmRecords: [record, ...state.alarmRecords],
  })),

  setAlarmModalVisible: (visible, alarm) => set({
    alarmModalVisible: visible,
    currentAlarm: alarm ?? null,
  }),

  setShutdownConfirmVisible: (visible) => set({
    shutdownConfirmVisible: visible,
  }),

  handleAlarm: (id, handler) => set(state => ({
    alarmRecords: state.alarmRecords.map(r =>
      r.id === id ? { ...r, handled: true, handler } : r
    ),
  })),

  executeShutdown: () => {
    const { currentAlarm, alarmRecords } = get();
    if (currentAlarm) {
      set({
        alarmRecords: alarmRecords.map(r =>
          r.id === currentAlarm.id ? { ...r, handled: true, handler: '系统管理员', shutdown: true } : r
        ),
        shutdownConfirmVisible: false,
        alarmModalVisible: false,
        currentAlarm: null,
      });
    }
  },

  filterAlarms: (startTime, endTime, level) => {
    const { alarmRecords } = get();
    return alarmRecords.filter(r => {
      if (startTime && r.timestamp < startTime) return false;
      if (endTime && r.timestamp > endTime) return false;
      if (level && r.level !== level) return false;
      return true;
    });
  },
}));
