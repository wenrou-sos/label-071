import { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Tag, Timeline, Progress, Badge } from 'antd';
import {
  DashboardOutlined,
  AlertOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ThunderboltOutlined,
  FieldTimeOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { useFanStore } from '@/store/useFanStore';
import { generateMonthlyReports } from '@/mock/reportData';
import { tunnels, ventilationStructures } from '@/mock/tunnelData';
import dayjs from 'dayjs';

const CARD_STYLE: React.CSSProperties = { borderRadius: 10, overflow: 'hidden' };

function StatCard({
  title, value, suffix, icon, color, bordered,
}: {
  title: string; value: number | string; suffix?: string;
  icon: React.ReactNode; color: string; bordered?: boolean;
}) {
  return (
    <Card style={{ ...CARD_STYLE, borderTop: bordered ? `3px solid ${color}` : undefined }}>
      <Statistic
        title={<span style={{ fontSize: 13, color: '#666' }}>{title}</span>}
        value={value}
        suffix={suffix}
        valueStyle={{ color, fontWeight: 700, fontSize: 28 }}
        prefix={icon}
      />
    </Card>
  );
}

export default function Home() {
  const fanStore = useFanStore();
  const [reports] = useState(generateMonthlyReports);

  useEffect(() => {
    fanStore.refreshParams();
    const t = setInterval(() => fanStore.refreshParams(), 5000);
    return () => clearInterval(t);
  }, []);

  const latestReport = reports[reports.length - 1];
  const unhandledAlarms = fanStore.alarmRecords.filter(a => !a.handled);
  const abnormalStructures = ventilationStructures.filter(s => s.status === 'abnormal');
  const intakeCount = tunnels.filter(t => t.direction === 'in').length;
  const returnCount = tunnels.filter(t => t.direction === 'out').length;

  const statusOption = {
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie', radius: ['55%', '75%'], center: ['50%', '50%'],
      label: { show: true, formatter: '{b}\n{d}%', fontSize: 11, color: '#666' },
      data: [
        { value: ventilationStructures.filter(s => s.status === 'normal').length, name: '正常', itemStyle: { color: '#52c41a' } },
        { value: abnormalStructures.length, name: '异常', itemStyle: { color: '#ff4d4f' } },
      ],
    }],
  };

  const alarmTrendOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 20, top: 30, bottom: 30 },
    xAxis: { type: 'category' as const, data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] },
    yAxis: { type: 'value' as const, minInterval: 1 },
    series: [
      { name: '预警', type: 'bar', stack: 'x', data: [2, 1, 3, 0, 2, 1, 0], itemStyle: { color: '#faad14' } },
      { name: '报警', type: 'bar', stack: 'x', data: [0, 1, 0, 1, 0, 0, 1], itemStyle: { color: '#ff4d4f' } },
    ],
  };

  const fanGaugeOption = {
    series: [{
      type: 'gauge', startAngle: 210, endAngle: -30, min: 0, max: 100,
      pointer: { show: true, length: '60%', width: 4 },
      progress: { show: true, width: 10, roundCap: true,
        itemStyle: { color: fanStore.currentParams.status === 'alarm' ? '#ff4d4f' : fanStore.currentParams.status === 'warning' ? '#faad14' : '#52c41a' } },
      axisLine: { lineStyle: { width: 10, color: [[1, '#f0f0f0']] }, roundCap: true },
      axisTick: { show: false }, splitLine: { show: false }, axisLabel: { show: false },
      detail: { formatter: '{value}°C', fontSize: 20, fontWeight: 700, offsetCenter: [0, '60%'],
        color: fanStore.currentParams.status === 'alarm' ? '#ff4d4f' : fanStore.currentParams.status === 'warning' ? '#faad14' : '#333' },
      title: { show: true, offsetCenter: [0, '80%'], fontSize: 12, color: '#999' },
      data: [{ value: fanStore.currentParams.bearingTemp, name: '轴承温度' }],
    }],
  };

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <StatCard title="巷道总数" value={tunnels.length} suffix="条" icon={<DashboardOutlined />} color="#1890ff" bordered />
        </Col>
        <Col span={6}>
          <StatCard title="进风巷 / 回风巷" value={`${intakeCount} / ${returnCount}`} icon={<ThunderboltOutlined />} color="#13c2c2" bordered />
        </Col>
        <Col span={6}>
          <StatCard title="通风设施" value={ventilationStructures.length} suffix="处" icon={<CheckCircleOutlined />} color="#52c41a" bordered />
        </Col>
        <Col span={6}>
          <StatCard
            title="未处理告警"
            value={unhandledAlarms.length}
            suffix="条"
            icon={<AlertOutlined />}
            color={unhandledAlarms.length > 0 ? '#ff4d4f' : '#52c41a'}
            bordered
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={8}>
          <Card title="主通风机状态" style={CARD_STYLE}>
            <ReactECharts option={fanGaugeOption} style={{ height: 200 }} />
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <Badge
                status={fanStore.currentParams.status === 'normal' ? 'success' : fanStore.currentParams.status === 'warning' ? 'warning' : 'error'}
                text={
                  <span style={{ fontWeight: 600, color: fanStore.currentParams.status === 'normal' ? '#52c41a' : fanStore.currentParams.status === 'warning' ? '#faad14' : '#ff4d4f' }}>
                    {fanStore.currentParams.status === 'normal' ? '运行正常' : fanStore.currentParams.status === 'warning' ? '黄色预警' : '红色报警'}
                  </span>
                }
              />
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card title="通风设施状态" style={CARD_STYLE}>
            <ReactECharts option={statusOption} style={{ height: 250 }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="本周告警趋势" style={CARD_STYLE}>
            <ReactECharts option={alarmTrendOption} style={{ height: 250 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card title="最新月报概览" style={CARD_STYLE} extra={<Tag color="blue">{latestReport?.month}</Tag>}>
            {latestReport && (
              <Row gutter={16}>
                <Col span={8}>
                  <div style={{ textAlign: 'center' }}>
                    <Progress
                      type="dashboard"
                      percent={latestReport.effectiveAirRate}
                      size={100}
                      strokeColor={latestReport.effectiveAirRate >= 85 ? '#52c41a' : latestReport.effectiveAirRate >= 70 ? '#faad14' : '#ff4d4f'}
                      format={p => `${p}%`}
                    />
                    <div style={{ color: '#666', fontSize: 13, marginTop: 4 }}>有效风量率</div>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ textAlign: 'center' }}>
                    <Progress
                      type="dashboard"
                      percent={latestReport.fanEfficiency}
                      size={100}
                      strokeColor={latestReport.fanEfficiency >= 85 ? '#52c41a' : latestReport.fanEfficiency >= 70 ? '#faad14' : '#ff4d4f'}
                      format={p => `${p}%`}
                    />
                    <div style={{ color: '#666', fontSize: 13, marginTop: 4 }}>风机效率</div>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 36, fontWeight: 700, color: '#1890ff', lineHeight: '72px' }}>
                      {latestReport.locations.length}
                    </div>
                    <div style={{ color: '#666', fontSize: 13 }}>用风地点</div>
                    <div style={{ marginTop: 4 }}>
                      <Tag color="green">{latestReport.locations.filter(l => l.compliance).length} 达标</Tag>
                      <Tag color="red">{latestReport.locations.filter(l => !l.compliance).length} 不达标</Tag>
                    </div>
                  </div>
                </Col>
              </Row>
            )}
          </Card>
        </Col>
        <Col span={12}>
          <Card title="最近告警" style={CARD_STYLE} extra={<FieldTimeOutlined style={{ color: '#999' }} />}>
            <Timeline
              items={fanStore.alarmRecords.slice(0, 6).map(a => ({
                color: a.level === 'alarm' ? 'red' : 'gold',
                children: (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <Tag color={a.level === 'alarm' ? 'red' : 'gold'} style={{ marginRight: 6 }}>
                        {a.level === 'alarm' ? '报警' : '预警'}
                      </Tag>
                      <span style={{ fontSize: 13 }}>{a.fanName} - {a.message.slice(0, 20)}...</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Tag color={a.handled ? 'green' : 'red'}>{a.handled ? '已处理' : '未处理'}</Tag>
                      <span style={{ color: '#999', fontSize: 12 }}>{dayjs(a.timestamp).format('MM-DD HH:mm')}</span>
                    </div>
                  </div>
                ),
              }))}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
