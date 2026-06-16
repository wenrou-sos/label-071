import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import AppLayout from '@/components/AppLayout';
import Home from '@/pages/Home';
import VentilationMap from '@/pages/VentilationMap';
import FanMonitor from '@/pages/FanMonitor';
import MonthlyReport from '@/pages/MonthlyReport';
import OperationRecords from '@/pages/OperationRecords';

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
          </Routes>
        </AppLayout>
      </Router>
    </ConfigProvider>
  );
}
