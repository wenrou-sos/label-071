import { useEffect, useState, useRef, useMemo } from 'react';
import { Card, Row, Col, Table, Modal, Button, Select, DatePicker, Tag, notification, Descriptions, Divider } from 'antd';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';
import { useFanStore } from '@/store/useFanStore';
import { useAlarmConfigStore } from '@/store/useAlarmConfigStore';
import type { AlarmRecord, FanParameters, AlarmParamConfig, AlarmParamKey } from '@/types';

const { RangePicker } = DatePicker;

const STATUS_COLOR: Record<string, string> = { normal: '#52c41a', warning: '#faad14', alarm: '#ff4d4f' };
const STATUS_BG: Record<string, string> = { normal: '#f6ffed', warning: '#fffbe6', alarm: '#fff2f0' };
const STATUS_BORDER: Record<string, string> = { normal: '#b7eb8f', warning: '#ffe58f', alarm: '#ffccc7' };

const PARAM_LABEL: Record<string, string> = {
  bearingTemp: '轴承温度', vibration: '振动', motorCurrent: '电机电流',
  airVolume: '风量', airPressure: '风压',
};

function gaugeOption(value: number, max: number, status: string, warning: number, alarm: number, direction: 'below' | 'above') {
  const color = STATUS_COLOR[status];
  const sections: [number, string][] = [];

  if (direction === 'above') {
    if (alarm < max) sections.push([alarm / max, '#ff4d4f']);
    if (warning < max) sections.push([warning / max, '#faad14']);
    sections.push([1, '#52c41a']);
    sections.reverse();
  } else {
    sections.push([1, '#52c41a']);
    if (warning < max) sections.push([warning / max, '#faad14']);
    if (alarm < max) sections.push([alarm / max, '#ff4d4f']);
  }

  return {
    series: [{
      type: 'gauge', startAngle: 220, endAngle: -40, min: 0, max,
      pointer: { length: '55%', width: 4, itemStyle: { color } },
      progress: { show: true, width: 10, roundCap: true, itemStyle: { color } },
      axisLine: { lineStyle: { width: 10, color: sections } },
      axisTick: { show: false }, splitLine: { show: false }, axisLabel: { show: false, fontSize: 10 },
      detail: { show: false },
      data: [{ value }],
    }],
  };
}

function trendOption(history: FanParameters[], paramConfigs: AlarmParamConfig[]) {
  const times = history.map(h => dayjs(h.timestamp).format('HH:mm:ss'));
  const colors = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de'];
  return {
    tooltip: { trigger: 'axis' },
    legend: { top: 30, data: paramConfigs.map(p => p.label), textStyle: { fontSize: 11 } },
    grid: { top: 70, left: 50, right: 30, bottom: 30, containLabel: true },
    xAxis: { type: 'category' as const, data: times, boundaryGap: false, axisLabel: { fontSize: 10 } },
    yAxis: { type: 'value' as const },
    series: paramConfigs.map((p, i) => ({
      name: p.label, type: 'line' as const, smooth: true, color: colors[i],
      data: history.map(h => h[p.key as keyof FanParameters] as number),
      showSymbol: false,
    })),
  };
}

function ParamCard({ param, value, status }: { param: AlarmParamConfig; value: number; status: FanParameters['status'] }) {
  const color = STATUS_COLOR[status];
  const pulse = status !== 'normal';
  return (
    <Card
      size="small"
      style={{
        borderColor: STATUS_BORDER[status],
        background: STATUS_BG[status],
        textAlign: 'center',
        borderRadius: 8,
        transition: 'all 0.3s',
      }}
      className={pulse ? (status === 'alarm' ? 'pulse-alarm' : 'pulse-warning') : undefined}
    >
      <ReactECharts
        option={gaugeOption(value, param.max, status, param.warningThreshold, param.alarmThreshold, param.direction)}
        style={{ height: 80 }}
        opts={{ renderer: 'svg' }}
      />
      <div className="mono-font" style={{ fontSize: 26, fontWeight: 700, color, transition: 'color 0.3s' }}>
        {value}
      </div>
      <div style={{ color: '#666', fontSize: 13, marginTop: 2 }}>{param.label}（{param.unit}）</div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 6 }}>
        {param.warningEnabled && <Tag color="gold" style={{ fontSize: 10, margin: 0 }}>预警 {param.warningThreshold}</Tag>}
        {param.alarmEnabled && <Tag color="red" style={{ fontSize: 10, margin: 0 }}>报警 {param.alarmThreshold}</Tag>}
      </div>
    </Card>
  );
}

export default function FanMonitor() {
  const store = useFanStore();
  const alarmConfigStore = useAlarmConfigStore();
  const prevStatusRef = useRef(store.currentParams.status);
  const [timeRange, setTimeRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);
  const [levelFilter, setLevelFilter] = useState<string | null>(null);
  const [appliedTimeRange, setAppliedTimeRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);
  const [appliedLevelFilter, setAppliedLevelFilter] = useState<string | null>(null);

  const paramConfigs = alarmConfigStore.configs;

  const overallStatus = useMemo(() => {
    const keys: AlarmParamKey[] = ['airVolume', 'airPressure', 'motorCurrent', 'bearingTemp', 'vibration'];
    let status: 'normal' | 'warning' | 'alarm' = 'normal';
    for (const k of keys) {
      const s = store.getParamStatus(k);
      if (s === 'alarm') return 'alarm';
      if (s === 'warning' && status === 'normal') status = 'warning';
    }
    return status;
  }, [store.currentParams, store.paramStatus]);

  useEffect(() => {
    store.refreshParams();
    const timer = setInterval(() => store.refreshParams(), 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const cur = overallStatus;
    const prev = prevStatusRef.current;
    if (cur !== prev) {
      if (cur === 'alarm') {
        const alarmKey = (Object.entries(store.paramStatus) as [AlarmParamKey, 'normal' | 'warning' | 'alarm'][]).find(([, s]) => s === 'alarm')?.[0];
        const cfg = alarmConfigStore.getConfig(alarmKey ?? 'bearingTemp');
        const val = store.currentParams[alarmKey as AlarmParamKey] ?? store.currentParams.bearingTemp;
        notification.error({
          message: '🔴 红色报警',
          description: `${store.currentParams.fanName} ${cfg?.label ?? '参数'}${val}${cfg?.unit ?? ''}，超过红色报警阈值${cfg?.alarmThreshold ?? ''}${cfg?.unit ?? ''}！`,
          duration: 0,
        });
      } else if (cur === 'warning') {
        const warnKey = (Object.entries(store.paramStatus) as [AlarmParamKey, 'normal' | 'warning' | 'alarm'][]).find(([, s]) => s === 'warning')?.[0];
        const cfg = alarmConfigStore.getConfig(warnKey ?? 'bearingTemp');
        const val = store.currentParams[warnKey as AlarmParamKey] ?? store.currentParams.bearingTemp;
        notification.warning({
          message: '🟡 黄色预警',
          description: `${store.currentParams.fanName} ${cfg?.label ?? '参数'}${val}${cfg?.unit ?? ''}，超过黄色预警阈值${cfg?.warningThreshold ?? ''}${cfg?.unit ?? ''}`,
          duration: 8,
        });
      }
      prevStatusRef.current = cur;
    }
  }, [overallStatus, store.currentParams.fanName, store.currentParams, store.paramStatus]);

  const filteredAlarms = store.filterAlarms(
    appliedTimeRange[0]?.toISOString() ?? null,
    appliedTimeRange[1]?.toISOString() ?? null,
    appliedLevelFilter,
  );

  const handleQuery = () => {
    setAppliedTimeRange([timeRange[0], timeRange[1]]);
    setAppliedLevelFilter(levelFilter);
  };

  const handleReset = () => {
    setTimeRange([null, null]);
    setLevelFilter(null);
    setAppliedTimeRange([null, null]);
    setAppliedLevelFilter(null);
  };

  const columns = [
    {
      title: '时间', dataIndex: 'timestamp', width: 180,
      render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm:ss'),
    },
    { title: '风机', dataIndex: 'fanName', width: 120 },
    {
      title: '参数', dataIndex: 'parameter', width: 100,
      render: (v: string) => PARAM_LABEL[v] ?? v,
    },
    { title: '数值', dataIndex: 'value', width: 80, render: (v: number) => <span className="mono-font">{v}</span> },
    { title: '阈值', dataIndex: 'threshold', width: 80, render: (v: number) => <span className="mono-font">{v}</span> },
    {
      title: '级别', dataIndex: 'level', width: 80,
      render: (v: string) => <Tag color={v === 'alarm' ? 'red' : 'gold'}>{v === 'alarm' ? '红色报警' : '黄色预警'}</Tag>,
    },
    {
      title: '状态', dataIndex: 'handled', width: 80,
      render: (v: boolean) => <Tag color={v ? 'green' : 'red'}>{v ? '已处理' : '未处理'}</Tag>,
    },
    {
      title: '操作', width: 100,
      render: (_: unknown, r: AlarmRecord) =>
        !r.handled ? <Button size="small" type="primary" danger onClick={() => store.setAlarmModalVisible(true, r)}>处理</Button> : '-',
    },
  ];

  return (
    <div>
      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>主通风机实时监控 — {store.currentParams.fanName}</span>
            <Tag color={overallStatus === 'alarm' ? 'red' : overallStatus === 'warning' ? 'gold' : 'green'}
              style={{ fontSize: 13, padding: '2px 12px' }}>
              {overallStatus === 'alarm' ? '🔴 红色报警' : overallStatus === 'warning' ? '🟡 黄色预警' : '🟢 运行正常'}
            </Tag>
          </div>
        }
        style={{ borderRadius: 10, overflow: 'hidden' }}
      >
        <Row gutter={[16, 16]} justify="center">
          {paramConfigs.map(p => (
            <Col span={4} key={p.key}>
              <ParamCard
                param={p}
                value={store.currentParams[p.key as keyof FanParameters] as number}
                status={store.getParamStatus(p.key)}
              />
            </Col>
          ))}
        </Row>
      </Card>

      <Card title="参数趋势图" style={{ marginTop: 16, borderRadius: 10, overflow: 'hidden' }}>
        <ReactECharts option={trendOption(store.paramHistory, paramConfigs)} style={{ height: 350 }} />
      </Card>

      <Card
        title="告警记录"
        style={{ marginTop: 16, borderRadius: 10, overflow: 'hidden' }}
        extra={
          <Tag color={store.alarmRecords.filter(a => !a.handled).length > 0 ? 'red' : 'green'}>
            未处理: {store.alarmRecords.filter(a => !a.handled).length}
          </Tag>
        }
      >
        <Row gutter={8} style={{ marginBottom: 16 }}>
          <Col><RangePicker onChange={v => setTimeRange(v ? (v as [dayjs.Dayjs, dayjs.Dayjs]) : [null, null])} /></Col>
          <Col>
            <Select style={{ width: 140 }} placeholder="告警级别" allowClear onChange={v => setLevelFilter(v ?? null)}>
              <Select.Option value="warning">🟡 黄色预警</Select.Option>
              <Select.Option value="alarm">🔴 红色报警</Select.Option>
            </Select>
          </Col>
          <Col><Button type="primary" onClick={handleQuery}>查询</Button></Col>
          <Col><Button onClick={handleReset}>重置</Button></Col>
        </Row>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredAlarms}
          size="small"
          pagination={{ pageSize: 8, showTotal: t => `共 ${t} 条记录` }}
          rowClassName={(r) => r.level === 'alarm' && !r.handled ? 'pulse-alarm' : ''}
        />
      </Card>

      <Modal
        open={store.alarmModalVisible}
        title={
          <span style={{ color: store.currentAlarm?.level === 'alarm' ? '#ff4d4f' : '#faad14', fontWeight: 700 }}>
            {store.currentAlarm?.level === 'alarm' ? '🔴 红色报警详情' : '🟡 黄色预警详情'}
          </span>
        }
        onCancel={() => store.setAlarmModalVisible(false)}
        styles={{
          body: {
            borderLeft: `4px solid ${store.currentAlarm?.level === 'alarm' ? '#ff4d4f' : '#faad14'}`,
            paddingLeft: 20, paddingTop: 16,
          },
        }}
        footer={store.currentAlarm?.level === 'alarm' ? [
          <Button key="cancel" onClick={() => store.setAlarmModalVisible(false)}>取消</Button>,
          <Button key="shutdown" danger type="primary" onClick={() => store.setShutdownConfirmVisible(true)}>确认停机</Button>,
        ] : [<Button key="ok" type="primary" onClick={() => store.setAlarmModalVisible(false)}>确定</Button>]}
      >
        {store.currentAlarm && (
          <Descriptions column={1} size="small">
            <Descriptions.Item label="风机">{store.currentAlarm.fanName}</Descriptions.Item>
            <Descriptions.Item label="参数">{PARAM_LABEL[store.currentAlarm.parameter] ?? store.currentAlarm.parameter}</Descriptions.Item>
            <Descriptions.Item label="当前值">
              <span style={{ fontWeight: 700, color: '#ff4d4f', fontSize: 18 }}>{store.currentAlarm.value}</span>
            </Descriptions.Item>
            <Descriptions.Item label="阈值">{store.currentAlarm.threshold}</Descriptions.Item>
            <Descriptions.Item label="超限量">
              <span style={{ color: '#ff4d4f' }}>
                {store.currentAlarm.level === 'alarm' || store.currentAlarm.level === 'warning'
                  ? (alarmConfigStore.getConfig(store.currentAlarm.parameter as AlarmParamKey)?.direction === 'below' ? '-' : '+')
                  : ''}{Math.abs(store.currentAlarm.value - store.currentAlarm.threshold).toFixed(2)}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="告警信息">{store.currentAlarm.message}</Descriptions.Item>
            <Descriptions.Item label="时间">
              {dayjs(store.currentAlarm.timestamp).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      <Modal
        open={store.shutdownConfirmVisible}
        title="⚠️ 确认下发停机指令"
        onCancel={() => store.setShutdownConfirmVisible(false)}
        onOk={() => {
          store.executeShutdown();
          store.setShutdownConfirmVisible(false);
          store.setAlarmModalVisible(false);
        }}
        okText="确认停机"
        cancelText="取消"
        okButtonProps={{ danger: true }}
        width={480}
      >
        <div style={{ padding: '12px 0', color: '#666' }}>
          <p style={{ fontWeight: 600, color: '#ff4d4f', fontSize: 15 }}>
            即将对 {store.currentAlarm?.fanName ?? '主通风机'} 下发停机指令！
          </p>
          <Divider style={{ margin: '8px 0' }} />
          <p>当前告警参数：{store.currentAlarm?.parameter && (PARAM_LABEL[store.currentAlarm.parameter] ?? store.currentAlarm.parameter)}</p>
          <p>当前值：<span style={{ color: '#ff4d4f', fontWeight: 700 }}>{store.currentAlarm?.value}</span>（阈值：{store.currentAlarm?.threshold}）</p>
          <p style={{ color: '#999', fontSize: 12 }}>停机后需手动启动备用风机，确认继续？</p>
        </div>
      </Modal>
    </div>
  );
}
