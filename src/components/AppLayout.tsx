import { useState, useEffect } from 'react';
import { Layout, Menu, Badge } from 'antd';
import type { MenuProps } from 'antd';
import {
  HomeOutlined,
  DeploymentUnitOutlined,
  DashboardOutlined,
  FileTextOutlined,
  SwapOutlined,
  BarChartOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  SafetyOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import dayjs from 'dayjs';
import { useFanStore } from '@/store/useFanStore';
import { useInspectionStore } from '@/store/useInspectionStore';

const { Sider, Header, Content } = Layout;

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const fanStore = useFanStore();
  const inspectionStore = useInspectionStore();
  const [collapsed, setCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(dayjs().format('YYYY-MM-DD HH:mm:ss'));

  const unhandledCount = fanStore.alarmRecords.filter(a => !a.handled).length;
  const overdueCount = inspectionStore.getStructures().filter(s => s.overdue).length;

  const menuItems: MenuProps['items'] = [
    {
      key: '/home',
      icon: <HomeOutlined />,
      label: '系统首页',
    },
    {
      key: '/ventilation-map',
      icon: <DeploymentUnitOutlined />,
      label: '通风系统图',
    },
    {
      key: '/fan-monitor',
      icon: <DashboardOutlined />,
      label: '主通风机监控',
    },
    {
      key: '/monthly-report',
      icon: <FileTextOutlined />,
      label: '通风月报',
    },
    {
      key: '/comparison',
      icon: <BarChartOutlined />,
      label: '数据对比',
    },
    {
      key: '/inspection',
      icon: <SafetyOutlined />,
      label: (
        <span>
          设施巡检
          {overdueCount > 0 && (
            <Badge
              count={overdueCount}
              color="#ff4d4f"
              size="small"
              style={{ marginLeft: 8 }}
            />
          )}
        </span>
      ),
    },
    {
      key: '/operation-records',
      icon: <SwapOutlined />,
      label: '操作记录',
    },
    {
      key: '/alarm-config',
      icon: <SettingOutlined />,
      label: '告警阈值配置',
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(dayjs().format('YYYY-MM-DD HH:mm:ss'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        width={220}
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        style={{
          background: '#0A2647',
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? '0' : '0 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <DeploymentUnitOutlined
            style={{ fontSize: 24, color: '#F57C00' }}
          />
          {!collapsed && (
            <span
              style={{
                color: '#fff',
                fontSize: 16,
                fontWeight: 600,
                marginLeft: 10,
                whiteSpace: 'nowrap',
              }}
            >
              通风系统管理
            </span>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{
            background: 'transparent',
            borderRight: 0,
          }}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 220, transition: 'margin-left 0.2s' }}>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0, 0, 0, 0.08)',
            position: 'sticky',
            top: 0,
            zIndex: 99,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: 18, cursor: 'pointer', marginRight: 16, color: '#0A2647' }}
            >
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </span>
            <span style={{ fontSize: 18, fontWeight: 600, color: '#0A2647' }}>
              矿井通风系统管理平台
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <Badge count={unhandledCount} size="small" onClick={() => navigate('/fan-monitor')} style={{ cursor: 'pointer' }}>
              <BellOutlined style={{ fontSize: 18, color: unhandledCount > 0 ? '#ff4d4f' : '#666', cursor: 'pointer' }} />
            </Badge>
            <span className="mono-font" style={{ fontSize: 14, color: '#666' }}>
              {currentTime}
            </span>
            <Badge status={fanStore.currentParams.status === 'alarm' ? 'error' : fanStore.currentParams.status === 'warning' ? 'warning' : 'success'} text={
              <span style={{
                color: fanStore.currentParams.status === 'alarm' ? '#FF4D4F' : fanStore.currentParams.status === 'warning' ? '#FAAD14' : '#52C41A',
                fontSize: 13
              }}>
                {fanStore.currentParams.status === 'alarm' ? '红色报警' : fanStore.currentParams.status === 'warning' ? '黄色预警' : '系统正常运行'}
              </span>
            } />
          </div>
        </Header>
        <Content
          style={{
            background: '#F0F2F5',
            padding: 24,
            minHeight: 'calc(100vh - 64px)',
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
