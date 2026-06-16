import { create } from 'zustand';
import type { FanParameters, AlarmRecord, AlarmParamKey } from '@/types';
import { generateFanParams, generateFanHistory } from '@/mock/fanData';
import { generateAlarmRecords } from '@/mock/alarmData';
import { useAlarmConfigStore } from './useAlarmConfigStore';

interface FanStore {
  currentParams: FanParameters;
  paramHistory: FanParameters[];
  alarmRecords: AlarmRecord[];
  alarmModalVisible: boolean;
  currentAlarm: AlarmRecord | null;
  shutdownConfirmVisible: boolean;
  paramStatus: Record<AlarmParamKey, 'normal' | 'warning' | 'alarm'>;
  overallStatus: 'normal' | 'warning' | 'alarm';

  refreshParams: () => void;
  addAlarm: (record: AlarmRecord) => void;
  setAlarmModalVisible: (visible: boolean, alarm?: AlarmRecord | null) => void;
  setShutdownConfirmVisible: (visible: boolean) => void;
  handleAlarm: (id: string, handler: string) => void;
  executeShutdown: () => void;
  filterAlarms: (startTime: string | null, endTime: string | null, level: string | null) => AlarmRecord[];
  getParamStatus: (key: AlarmParamKey) => 'normal' | 'warning' | 'alarm';
}

export const useFanStore = create<FanStore>((set, get) => ({
  currentParams: generateFanParams(),
  paramHistory: generateFanHistory(60),
  alarmRecords: generateAlarmRecords(),
  alarmModalVisible: false,
  currentAlarm: null,
  shutdownConfirmVisible: false,
  paramStatus: {
    airVolume: 'normal', airPressure: 'normal', motorCurrent: 'normal', bearingTemp: 'normal', vibration: 'normal',
  },
  overallStatus: 'normal',

  refreshParams: () => {
    const newParams = generateFanParams();
    const { configs } = useAlarmConfigStore.getState();

    const keys: AlarmParamKey[] = ['airVolume', 'airPressure', 'motorCurrent', 'bearingTemp', 'vibration'];
    const newParamStatus = { ...get().paramStatus } as Record<AlarmParamKey, 'normal' | 'warning' | 'alarm'>;
    let overallStatus: 'normal' | 'warning' | 'alarm' = 'normal';
    const newAlarms: AlarmRecord[] = [];
    let hasAlarmModal = false;
    let firstAlarm: AlarmRecord | null = null;

    for (const key of keys) {
      const cfg = configs.find(c => c.key === key);
      if (!cfg) continue;

      const value = newParams[key] as number;
      const result = useAlarmConfigStore.getState().isValueAlarm(key, value);
      newParamStatus[key] = result.level;

      if (result.level !== 'normal' && result.threshold !== null) {
        const alarm: AlarmRecord = {
          id: `alarm-${Date.now()}-${key}-${Math.random().toString(36).slice(2, 7)}`,
          fanId: newParams.fanId,
          fanName: newParams.fanName,
          parameter: key,
          value,
          threshold: result.threshold,
          level: result.level,
          message: `${newParams.fanName}${cfg.label}${value}${cfg.unit}，${result.level === 'alarm' ? '超过红色报警' : '超过黄色预警'}阈值${result.threshold}${cfg.unit}`,
          timestamp: new Date().toISOString(),
          handled: false,
        };
        newAlarms.push(alarm);

        if (result.level === 'alarm') {
          overallStatus = 'alarm';
          if (!hasAlarmModal) {
            hasAlarmModal = true;
            firstAlarm = { ...alarm, shutdown: false };
          }
        } else if (result.level === 'warning' && overallStatus === 'normal') {
          overallStatus = 'warning';
        }
      }
    }

    newParams.status = overallStatus;

    set(state => ({
      currentParams: newParams,
      paramHistory: [...state.paramHistory.slice(-59), newParams],
      alarmRecords: [...newAlarms, ...state.alarmRecords],
      paramStatus: newParamStatus,
      overallStatus,
      alarmModalVisible: hasAlarmModal ? true : state.alarmModalVisible,
      currentAlarm: firstAlarm ?? state.currentAlarm,
    }));
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

  getParamStatus: (key) => {
    return get().paramStatus[key];
  },
}));
