export interface Tunnel {
  id: string;
  name: string;
  startNode: string;
  endNode: string;
  airVolume: number;
  airPressure: number;
  direction: 'in' | 'out';
  length: number;
  crossSection: number;
  supportType: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export interface VentilationStructure {
  id: string;
  type: 'air_door' | 'air_window' | 'air_wall' | 'air_bridge';
  name: string;
  tunnelId: string;
  position: { x: number; y: number };
  status: 'normal' | 'abnormal';
  installDate: string;
}

export interface FanParameters {
  fanId: string;
  fanName: string;
  airVolume: number;
  airPressure: number;
  motorCurrent: number;
  bearingTemp: number;
  vibration: number;
  timestamp: string;
  status: 'normal' | 'warning' | 'alarm';
}

export interface AlarmRecord {
  id: string;
  fanId: string;
  fanName: string;
  parameter: string;
  value: number;
  threshold: number;
  level: 'warning' | 'alarm';
  message: string;
  timestamp: string;
  handled: boolean;
  handler?: string;
  shutdown?: boolean;
}

export interface AirLocation {
  id: string;
  name: string;
  type: '采煤工作面' | '掘进面' | '硐室';
  actualAirVolume: number;
  requiredAirVolume: number;
  compliance: boolean;
}

export interface MonthlyReport {
  id: string;
  month: string;
  locations: AirLocation[];
  effectiveAirRate: number;
  fanEfficiency: number;
  generatedAt: string;
}

export interface FanSwitchRecord {
  id: string;
  operator: string;
  operateTime: string;
  reason: '计划检修' | '故障切换';
  beforeParams: Omit<FanParameters, 'status'>;
  afterParams: Omit<FanParameters, 'status'>;
}

export interface ReverseAirDrill {
  id: string;
  reverseTime: string;
  reverseDuration: string;
  reverseRate: number;
  participants: string[];
  conclusion: string;
}

export type StructureType = 'air_door' | 'air_window' | 'air_wall' | 'air_bridge';

export const STRUCTURE_LABELS: Record<StructureType, string> = {
  air_door: '风门',
  air_window: '风窗',
  air_wall: '风墙',
  air_bridge: '风桥',
};

export interface ComparisonAlarmStats {
  warningCount: number;
  alarmCount: number;
  totalCount: number;
  avgResponseTimeMin: number;
  handledRate: number;
}

export interface ComparisonAirData {
  periodLabel: string;
  startDate: string;
  endDate: string;
  airVolumeTrend: { time: string; airVolume: number; airPressure: number; bearingTemp: number; vibration: number; motorCurrent: number }[];
  alarmStats: ComparisonAlarmStats;
  complianceRate: number;
  totalLocations: number;
  compliantLocations: number;
  avgEffectiveAirRate: number;
  avgFanEfficiency: number;
  locationComparison: { name: string; type: AirLocation['type']; actualAirVolume: number; requiredAirVolume: number }[];
}

export type PresetPeriod = 'this_month_vs_last' | 'this_week_vs_last' | 'today_vs_yesterday' | 'custom';

export interface InspectionItem {
  structureId: string;
  structureName: string;
  structureType: StructureType;
  result: 'normal' | 'abnormal';
  remark?: string;
}

export interface InspectionTask {
  id: string;
  taskNo: string;
  inspector: string;
  inspectTime: string;
  items: InspectionItem[];
  remark?: string;
}

export interface StructureWithInspection extends VentilationStructure {
  lastInspectTime: string | null;
  lastInspectResult: 'normal' | 'abnormal' | null;
  overdue: boolean;
  daysSinceLastInspect: number;
}

