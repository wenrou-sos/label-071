import { create } from 'zustand';
import type { MonthlyReport } from '@/types';
import { generateMonthlyReports } from '@/mock/reportData';

interface ReportStore {
  reports: MonthlyReport[];
  regenerateReports: () => void;
}

export const useReportStore = create<ReportStore>((set) => ({
  reports: generateMonthlyReports(),
  regenerateReports: () => set({ reports: generateMonthlyReports() }),
}));
