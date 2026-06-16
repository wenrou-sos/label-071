import type { FanSwitchRecord, ReverseAirDrill, FanParameters } from '../types';

type FanParamsNoStatus = Omit<FanParameters, 'status'>;

function makeFanParams(
  fanId: string,
  fanName: string,
  airVolume: number,
  airPressure: number,
  motorCurrent: number,
  bearingTemp: number,
  vibration: number,
  timestamp: string
): FanParamsNoStatus {
  return { fanId, fanName, airVolume, airPressure, motorCurrent, bearingTemp, vibration, timestamp };
}

export function generateFanSwitchRecords(): FanSwitchRecord[] {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  const records: FanSwitchRecord[] = [
    {
      id: 'SW001',
      operator: '张伟',
      operateTime: new Date(now - 28 * dayMs).toISOString(),
      reason: '计划检修',
      beforeParams: makeFanParams('FAN001', '1号主通风机', 84.5, 2780, 183, 54.2, 2.4, new Date(now - 28 * dayMs - 60000).toISOString()),
      afterParams: makeFanParams('FAN001', '1号主通风机', 85.3, 2810, 186, 52.8, 2.3, new Date(now - 28 * dayMs + 3600000).toISOString()),
    },
    {
      id: 'SW002',
      operator: '李强',
      operateTime: new Date(now - 21 * dayMs).toISOString(),
      reason: '故障切换',
      beforeParams: makeFanParams('FAN002', '2号主通风机', 82.1, 2750, 188, 58.6, 3.2, new Date(now - 21 * dayMs - 60000).toISOString()),
      afterParams: makeFanParams('FAN001', '1号主通风机', 86.7, 2830, 190, 53.5, 2.5, new Date(now - 21 * dayMs + 1800000).toISOString()),
    },
    {
      id: 'SW003',
      operator: '王明',
      operateTime: new Date(now - 14 * dayMs).toISOString(),
      reason: '计划检修',
      beforeParams: makeFanParams('FAN002', '2号主通风机', 83.0, 2760, 184, 55.0, 2.6, new Date(now - 14 * dayMs - 60000).toISOString()),
      afterParams: makeFanParams('FAN002', '2号主通风机', 84.2, 2790, 182, 52.1, 2.2, new Date(now - 14 * dayMs + 7200000).toISOString()),
    },
    {
      id: 'SW004',
      operator: '赵刚',
      operateTime: new Date(now - 7 * dayMs).toISOString(),
      reason: '故障切换',
      beforeParams: makeFanParams('FAN001', '1号主通风机', 81.8, 2720, 192, 60.3, 3.8, new Date(now - 7 * dayMs - 60000).toISOString()),
      afterParams: makeFanParams('FAN002', '2号主通风机', 85.9, 2800, 185, 54.0, 2.4, new Date(now - 7 * dayMs + 1800000).toISOString()),
    },
    {
      id: 'SW005',
      operator: '张伟',
      operateTime: new Date(now - 2 * dayMs).toISOString(),
      reason: '计划检修',
      beforeParams: makeFanParams('FAN001', '1号主通风机', 84.8, 2770, 184, 55.5, 2.5, new Date(now - 2 * dayMs - 60000).toISOString()),
      afterParams: makeFanParams('FAN001', '1号主通风机', 85.1, 2805, 183, 52.3, 2.3, new Date(now - 2 * dayMs + 3600000).toISOString()),
    },
  ];

  return records;
}

export function generateReverseAirDrills(): ReverseAirDrill[] {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  const drills: ReverseAirDrill[] = [
    {
      id: 'RAD001',
      reverseTime: new Date(now - 60 * dayMs).toISOString(),
      reverseDuration: '8分32秒',
      reverseRate: 92.5,
      participants: ['张伟', '李强', '王明', '赵刚', '刘洋', '陈磊'],
      conclusion: '反风设施动作可靠，反风风量达到正常风量的92.5%，满足《煤矿安全规程》要求（不低于60%），反风效果良好。',
    },
    {
      id: 'RAD002',
      reverseTime: new Date(now - 30 * dayMs).toISOString(),
      reverseDuration: '7分48秒',
      reverseRate: 94.1,
      participants: ['张伟', '李强', '赵刚', '刘洋', '周涛'],
      conclusion: '反风系统响应迅速，反风率94.1%，各风门切换正常，风流方向改变时间符合要求，反风演练合格。',
    },
    {
      id: 'RAD003',
      reverseTime: new Date(now - 10 * dayMs).toISOString(),
      reverseDuration: '9分15秒',
      reverseRate: 88.3,
      participants: ['王明', '赵刚', '刘洋', '陈磊', '周涛', '孙鹏'],
      conclusion: '反风操作顺利完成，反风率88.3%。3号风门关闭延迟约30秒，建议对3号风门执行机构进行检修维护，其余设施运行正常。',
    },
  ];

  return drills;
}
