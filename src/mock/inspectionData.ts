import type { InspectionTask, StructureWithInspection } from '../types';
import { ventilationStructures } from './tunnelData';
import dayjs from 'dayjs';

const INSPECTOR_NAMES = ['张伟', '李强', '王明', '赵刚', '陈磊', '周涛'];

function generateInspectionItems(_baseDate: dayjs.Dayjs) {
  return ventilationStructures.map(s => ({
    structureId: s.id,
    structureName: s.name,
    structureType: s.type,
    result: (Math.random() > 0.85 ? 'abnormal' : 'normal') as 'normal' | 'abnormal',
    remark: Math.random() > 0.7 ? '设施完好，运行正常' : undefined,
  }));
}

export function generateInspectionTasks(): InspectionTask[] {
  const tasks: InspectionTask[] = [];
  const now = dayjs();

  const dates = [
    now.subtract(5, 'day'),
    now.subtract(12, 'day'),
    now.subtract(25, 'day'),
    now.subtract(38, 'day'),
    now.subtract(45, 'day'),
    now.subtract(60, 'day'),
  ];

  dates.forEach((d, i) => {
    const task: InspectionTask = {
      id: `INSP-${Date.now()}-${i}`,
      taskNo: `XJ${String(2026001 + i).padStart(6, '0')}`,
      inspector: INSPECTOR_NAMES[i % INSPECTOR_NAMES.length],
      inspectTime: d.toISOString(),
      items: generateInspectionItems(d),
      remark: i % 3 === 0 ? '本次巡检未发现重大异常' : undefined,
    };
    tasks.push(task);
  });

  return tasks.sort((a, b) => dayjs(b.inspectTime).valueOf() - dayjs(a.inspectTime).valueOf());
}

export function getStructuresWithInspection(tasks: InspectionTask[]): StructureWithInspection[] {
  const now = dayjs();

  return ventilationStructures.map(s => {
    const lastTask = tasks
      .filter(t => t.items.some(item => item.structureId === s.id))
      .sort((a, b) => dayjs(b.inspectTime).valueOf() - dayjs(a.inspectTime).valueOf())[0];

    const lastItem = lastTask?.items.find(item => item.structureId === s.id);
    const lastInspectTime = lastTask ? lastTask.inspectTime : null;
    const daysSinceLastInspect = lastInspectTime
      ? now.diff(dayjs(lastInspectTime), 'day')
      : 999;

    return {
      ...s,
      lastInspectTime,
      lastInspectResult: lastItem?.result ?? null,
      overdue: daysSinceLastInspect > 30,
      daysSinceLastInspect,
    };
  });
}
