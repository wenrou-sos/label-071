import type { AlarmRecord } from '../types';

const ALARM_TEMPLATES: Array<{
  fanId: string;
  fanName: string;
  parameter: string;
  level: 'warning' | 'alarm';
  message: string;
}> = [
  { fanId: 'FAN001', fanName: '1号主通风机', parameter: 'bearingTemp', level: 'warning', message: '轴承温度超过预警阈值' },
  { fanId: 'FAN001', fanName: '1号主通风机', parameter: 'bearingTemp', level: 'alarm', message: '轴承温度超过报警阈值，请立即检查' },
  { fanId: 'FAN001', fanName: '1号主通风机', parameter: 'vibration', level: 'warning', message: '振动值超过预警阈值' },
  { fanId: 'FAN001', fanName: '1号主通风机', parameter: 'vibration', level: 'alarm', message: '振动值超过报警阈值，存在设备故障风险' },
  { fanId: 'FAN001', fanName: '1号主通风机', parameter: 'motorCurrent', level: 'warning', message: '电机电流超过预警阈值' },
  { fanId: 'FAN001', fanName: '1号主通风机', parameter: 'airVolume', level: 'warning', message: '风量低于预警阈值' },
  { fanId: 'FAN002', fanName: '2号主通风机', parameter: 'bearingTemp', level: 'warning', message: '轴承温度超过预警阈值' },
  { fanId: 'FAN002', fanName: '2号主通风机', parameter: 'bearingTemp', level: 'alarm', message: '轴承温度超过报警阈值，请立即检查' },
  { fanId: 'FAN002', fanName: '2号主通风机', parameter: 'vibration', level: 'alarm', message: '振动值超过报警阈值，存在设备故障风险' },
  { fanId: 'FAN002', fanName: '2号主通风机', parameter: 'motorCurrent', level: 'warning', message: '电机电流超过预警阈值' },
  { fanId: 'FAN002', fanName: '2号主通风机', parameter: 'motorCurrent', level: 'alarm', message: '电机电流超过报警阈值，可能存在过载' },
  { fanId: 'FAN002', fanName: '2号主通风机', parameter: 'airPressure', level: 'warning', message: '风压低于预警阈值' },
];

const PARAMETER_THRESHOLDS: Record<string, { warning: number; alarm: number }> = {
  bearingTemp: { warning: 75, alarm: 85 },
  vibration: { warning: 3.5, alarm: 4.5 },
  motorCurrent: { warning: 200, alarm: 220 },
  airVolume: { warning: 78, alarm: 72 },
  airPressure: { warning: 2600, alarm: 2400 },
};

function randomInRange(min: number, max: number): number {
  return Math.round((min + Math.random() * (max - min)) * 100) / 100;
}

export function generateAlarmRecords(): AlarmRecord[] {
  const now = Date.now();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const records: AlarmRecord[] = [];

  for (let i = 0; i < 15; i++) {
    const template = ALARM_TEMPLATES[i % ALARM_TEMPLATES.length];
    const threshold = PARAMETER_THRESHOLDS[template.parameter];
    const thresholdValue = template.level === 'warning' ? threshold.warning : threshold.alarm;

    let value: number;
    if (template.parameter === 'airVolume' || template.parameter === 'airPressure') {
      value = randomInRange(thresholdValue * 0.85, thresholdValue * 0.98);
    } else {
      value = randomInRange(thresholdValue, thresholdValue * 1.15);
    }

    const timestamp = new Date(now - Math.random() * thirtyDaysMs).toISOString();
    const handled = Math.random() > 0.25;
    const handlers = ['张伟', '李强', '王明', '赵刚'];
    const handler = handled ? handlers[Math.floor(Math.random() * handlers.length)] : undefined;
    const shutdown = template.level === 'alarm' && Math.random() > 0.7;

    records.push({
      id: `ALM${String(i + 1).padStart(3, '0')}`,
      fanId: template.fanId,
      fanName: template.fanName,
      parameter: template.parameter,
      value,
      threshold: thresholdValue,
      level: template.level,
      message: template.message,
      timestamp,
      handled,
      handler,
      shutdown,
    });
  }

  records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return records;
}
