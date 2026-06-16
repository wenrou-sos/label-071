import { create } from 'zustand';
import type { InspectionTask, StructureWithInspection } from '../types';
import { generateInspectionTasks, getStructuresWithInspection } from '../mock/inspectionData';
import dayjs from 'dayjs';

interface InspectionStore {
  tasks: InspectionTask[];
  structures: StructureWithInspection[];

  addTask: (task: Omit<InspectionTask, 'id' | 'taskNo'>) => void;
  getStructures: () => StructureWithInspection[];
  getTasksByStructure: (structureId: string) => InspectionTask[];
}

export const useInspectionStore = create<InspectionStore>((set, get) => ({
  tasks: generateInspectionTasks(),
  structures: getStructuresWithInspection(generateInspectionTasks()),

  addTask: (taskData) => {
    const { tasks } = get();
    const newTaskNo = `XJ${String(2026001 + tasks.length).padStart(6, '0')}`;
    const newTask: InspectionTask = {
      ...taskData,
      id: `INSP-${Date.now()}`,
      taskNo: newTaskNo,
    };

    const updatedTasks = [...tasks, newTask].sort(
      (a, b) => dayjs(b.inspectTime).valueOf() - dayjs(a.inspectTime).valueOf()
    );
    set({
      tasks: updatedTasks,
      structures: getStructuresWithInspection(updatedTasks),
    });
  },

  getStructures: () => {
    const { tasks } = get();
    return getStructuresWithInspection(tasks);
  },

  getTasksByStructure: (structureId) => {
    const { tasks } = get();
    return tasks.filter(t => t.items.some(item => item.structureId === structureId));
  },
}));
