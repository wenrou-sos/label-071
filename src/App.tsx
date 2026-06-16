import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import AppLayout from '@/components/AppLayout';
import Home from '@/pages/Home';
import VentilationMap from '@/pages/VentilationMap';
import FanMonitor from '@/pages/FanMonitor';
import MonthlyReport from '@/pages/MonthlyReport';
import OperationRecords from '@/pages/OperationRecords';
import Comparison from '@/pages/Comparison';
import Inspection from '@/pages/Inspection';
import AlarmConfig from '@/pages/AlarmConfig';

const theme = {
  token: {
    colorPrimary: '#144272',
    borderRadius: 6,
    colorBgContainer: '#ffffff',
  },
};

export default function App() {
  return (
    <ConfigProvider locale={zhCN} theme={theme}>
      <Router>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<Home />} />
            <Route path="/ventilation-map" element={<VentilationMap />} />
            <Route path="/fan-monitor" element={<FanMonitor />} />
            <Route path="/monthly-report" element={<MonthlyReport />} />
            <Route path="/operation-records" element={<OperationRecords />} />
            <Route path="/comparison" element={<Comparison />} />
            <Route path="/inspection" element={<Inspection />} />
            <Route path="/alarm-config" element={<AlarmConfig />} />
          </Routes>
        </AppLayout>
      </Router>
    </ConfigProvider>
  );
}
