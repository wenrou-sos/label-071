import { useState, useMemo } from 'react';
import { Card, Row, Col, Statistic, Tag, Select, Table, Space, Tabs, Button } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, RiseOutlined, FallOutlined, BarChartOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { generateComparisonData } from '@/mock/comparisonData';
import type { ComparisonAirData, AirLocation, PresetPeriod } from '@/types';

const PRESET_OPTIONS = [
  { value: 'month', label: '📅 本月 vs 上月' },
  { value: 'week', label: '📆 本周 vs 上周' },
  { value: 'day', label: '☀️ 今日 vs 昨日' },
];

const TREND_PARAMS = [
  { key: 'airVolume', label: '风量', unit: 'm³/s', color: '#5470c6' },
  { key: 'airPressure', label: '风压', unit: 'Pa', color: '#91cc75' },
  { key: 'bearingTemp', label: '轴承温度', unit: '°C', color: '#ee6666' },
  { key: 'vibration', label: '振动', unit: 'mm/s', color: '#fac858' },
  { key: 'motorCurrent', label: '电机电流', unit: 'A', color: '#73c0de' },
];

type TrendParamKey = 'airVolume' | 'airPressure' | 'bearingTemp' | 'vibration' | 'motorCurrent';

function DeltaTag({ value, invertColor = false }: { value: number; invertColor?: boolean }) {
  const isGood = invertColor ? value < 0 : value > 0;
  const color = value === 0 ? '#999' : isGood ? '#52c41a' : '#ff4d4f';
  const Icon = value >= 0 ? ArrowUpOutlined : ArrowDownOutlined;
  return (
    <Tag color={color === '#52c41a' ? 'green' : color === '#ff4d4f' ? 'red' : 'default'} style={{ margin: 0 }}>
      <Icon /> {Math.abs(value).toFixed(1)}%
    </Tag>
  );
}

function StatPair({
  label, valueA, valueB, unit, invertColor, format,
}: {
  label: string;
  valueA: number;
  valueB: number;
  unit?: string;
  invertColor?: boolean;
  format?: (v: number) => string;
}) {
  const delta = valueB > 0 ? ((valueA - valueB) / valueB) * 100 : 0;
  const displayValue = (v: number) => format ? format(v) : v;
  return (
    <Col span={6}>
      <Card size="small" style={{ borderRadius: 6, textAlign: 'center' }}>
        <div style={{ color: '#999', fontSize: 12, marginBottom: 6 }}>{label}</div>
        <Row gutter={8} align="middle">
          <Col span={12} style={{ textAlign: 'center', borderRight: '1px solid #f0f0f0' }}>
            <div style={{ color: '#1890ff', fontWeight: 700, fontSize: 16 }}>
              {displayValue(valueA)}
              {unit && <span style={{ fontSize: 11, color: '#999', marginLeft: 2 }}>{unit}</span>}
            </div>
            <div style={{ color: '#bbb', fontSize: 10 }}>本期</div>
          </Col>
          <Col span={12} style={{ textAlign: 'center' }}>
            <div style={{ color: '#fa8c16', fontWeight: 700, fontSize: 16 }}>
              {displayValue(valueB)}
              {unit && <span style={{ fontSize: 11, color: '#999', marginLeft: 2 }}>{unit}</span>}
            </div>
            <div style={{ color: '#bbb', fontSize: 10 }}>同期</div>
          </Col>
        </Row>
        <div style={{ marginTop: 6 }}>
          <DeltaTag value={delta} invertColor={invertColor} />
        </div>
      </Card>
    </Col>
  );
}

export default function Comparison() {
  const [preset, setPreset] = useState<'month' | 'week' | 'day'>('month');
  const [activeTrendParam, setActiveTrendParam] = useState<TrendParamKey>('airVolume');

  const { periodA, periodB } = useMemo(() => generateComparisonData(preset), [preset]);

  const trendOption = useMemo(() => {
    const labels = periodA.airVolumeTrend.map(d => d.time);
    const dataA = periodA.airVolumeTrend.map(d => d[activeTrendParam]);
    const dataB = periodB.airVolumeTrend.map(d => d[activeTrendParam]);
    const param = TREND_PARAMS.find(p => p.key === activeTrendParam)!;
    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any[]) => {
          const relTime = params[0]?.axisValue ?? '';
          let html = `<div style="font-weight:600;margin-bottom:4px">相对时间：${relTime}</div>`;
          params.forEach((p: any) => {
            html += `<div>${p.marker} ${p.seriesName}：${p.value} ${param.unit}</div>`;
          });
          html += `<div style="color:#999;font-size:11px;margin-top:4px">${periodA.periodLabel}: ${periodA.startDate} ~ ${periodA.endDate}</div>`;
          html += `<div style="color:#999;font-size:11px">${periodB.periodLabel}: ${periodB.startDate} ~ ${periodB.endDate}</div>`;
          return html;
        },
      },
      legend: { data: [`${periodA.periodLabel}`, `${periodB.periodLabel}`], top: 5 },
      grid: { left: 50, right: 20, top: 45, bottom: 40 },
      xAxis: {
        type: 'category',
        data: labels,
        boundaryGap: false,
        axisLabel: {
          fontSize: 10,
          interval: Math.max(Math.floor(labels.length / 8) - 1, 0),
          rotate: labels.length > 15 ? 30 : 0,
        },
        name: '相对时间',
        nameLocation: 'middle',
        nameGap: 28,
        nameTextStyle: { fontSize: 11, color: '#999' },
      },
      yAxis: { type: 'value', name: param.unit, nameTextStyle: { fontSize: 11 } },
      series: [
        {
          name: periodA.periodLabel, type: 'line', smooth: true, showSymbol: false,
          data: dataA, lineStyle: { width: 2.5, color: '#1890ff' },
          itemStyle: { color: '#1890ff' },
          areaStyle: { color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(24,144,255,0.3)' },
              { offset: 1, color: 'rgba(24,144,255,0.02)' },
            ],
          }},
        },
        {
          name: periodB.periodLabel, type: 'line', smooth: true, showSymbol: false,
          data: dataB, lineStyle: { width: 2, color: '#fa8c16', type: 'dashed' as const },
          itemStyle: { color: '#fa8c16' },
          areaStyle: { color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(250,140,22,0.2)' },
              { offset: 1, color: 'rgba(250,140,22,0.02)' },
            ],
          }},
        },
      ],
    };
  }, [periodA, periodB, activeTrendParam]);

  const alarmBarOption = useMemo(() => {
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { data: ['预警', '报警'], top: 5 },
      grid: { left: 50, right: 20, top: 40, bottom: 30 },
      xAxis: {
        type: 'category',
        data: [periodA.periodLabel, periodB.periodLabel],
        axisLabel: { fontSize: 12, fontWeight: 600 },
      },
      yAxis: { type: 'value', name: '次数', minInterval: 1 },
      series: [
        {
          name: '预警', type: 'bar', stack: 'total', barWidth: 60,
          data: [periodA.alarmStats.warningCount, periodB.alarmStats.warningCount],
          itemStyle: { color: '#faad14' },
          label: { show: true, position: 'inside' },
        },
        {
          name: '报警', type: 'bar', stack: 'total',
          data: [periodA.alarmStats.alarmCount, periodB.alarmStats.alarmCount],
          itemStyle: { color: '#ff4d4f' },
          label: { show: true, position: 'inside' },
        },
      ],
    };
  }, [periodA, periodB]);

  const complianceGaugeOptionA = useMemo(() => ({
    series: [{
      type: 'gauge', startAngle: 210, endAngle: -30, min: 0, max: 100,
      pointer: { length: '60%', width: 3, itemStyle: { color: '#1890ff' } },
      progress: { show: true, width: 14, roundCap: true, itemStyle: { color: '#1890ff' } },
      axisLine: { lineStyle: { width: 14, color: [[1, '#f0f0f0']] }, roundCap: true },
      axisTick: { show: false }, splitLine: { show: false }, axisLabel: { show: false },
      detail: { formatter: '{value}%', fontSize: 22, fontWeight: 700, offsetCenter: [0, '65%'], color: '#1890ff' },
      title: { show: false },
      data: [{ value: periodA.complianceRate }],
    }],
  }), [periodA.complianceRate]);

  const complianceGaugeOptionB = useMemo(() => ({
    series: [{
      type: 'gauge', startAngle: 210, endAngle: -30, min: 0, max: 100,
      pointer: { length: '60%', width: 3, itemStyle: { color: '#fa8c16' } },
      progress: { show: true, width: 14, roundCap: true, itemStyle: { color: '#fa8c16' } },
      axisLine: { lineStyle: { width: 14, color: [[1, '#f0f0f0']] }, roundCap: true },
      axisTick: { show: false }, splitLine: { show: false }, axisLabel: { show: false },
      detail: { formatter: '{value}%', fontSize: 22, fontWeight: 700, offsetCenter: [0, '65%'], color: '#fa8c16' },
      title: { show: false },
      data: [{ value: periodB.complianceRate }],
    }],
  }), [periodB.complianceRate]);

  const locationBarOption = useMemo(() => {
    const names = periodA.locationComparison.map(l => l.name);
    const actualA = periodA.locationComparison.map(l => l.actualAirVolume);
    const actualB = periodB.locationComparison.map(l => l.actualAirVolume);
    const required = periodA.locationComparison.map(l => l.requiredAirVolume);
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { data: [`${periodA.periodLabel}实际`, `${periodB.periodLabel}实际`, '需风量'], top: 5, textStyle: { fontSize: 11 } },
      grid: { left: 50, right: 20, bottom: 80, top: 40 },
      xAxis: { type: 'category', data: names, axisLabel: { rotate: 25, fontSize: 10 } },
      yAxis: { type: 'value', name: 'm³/s' },
      series: [
        { name: `${periodA.periodLabel}实际`, type: 'bar', data: actualA, itemStyle: { color: '#1890ff' } },
        { name: `${periodB.periodLabel}实际`, type: 'bar', data: actualB, itemStyle: { color: '#fa8c16' } },
        { name: '需风量', type: 'line', data: required, lineStyle: { color: '#52c41a', type: 'dashed' }, itemStyle: { color: '#52c41a' } },
      ],
    };
  }, [periodA, periodB]);

  const tableColumns = [
    { title: '用风地点', dataIndex: 'name', key: 'name', width: 160 },
    {
      title: '类型', dataIndex: 'type', key: 'type', width: 100,
      render: (t: AirLocation['type']) => (
        <Tag color={t === '采煤工作面' ? 'blue' : t === '掘进面' ? 'green' : 'purple'}>{t}</Tag>
      ),
    },
    {
      title: `${periodA.periodLabel}实际`, dataIndex: 'actualA', key: 'actualA',
      render: (v: number) => <span style={{ color: '#1890ff', fontWeight: 600 }} className="mono-font">{v}</span>,
    },
    {
      title: `${periodB.periodLabel}实际`, dataIndex: 'actualB', key: 'actualB',
      render: (v: number) => <span style={{ color: '#fa8c16' }} className="mono-font">{v}</span>,
    },
    { title: '需风量', dataIndex: 'required', key: 'required', render: (v: number) => <span className="mono-font">{v}</span> },
    {
      title: '变化量', key: 'diff',
      render: (_: unknown, r: any) => {
        const diff = r.actualA - r.actualB;
        const color = diff > 0 ? '#52c41a' : diff < 0 ? '#ff4d4f' : '#999';
        return (
          <span style={{ color, fontWeight: 600 }} className="mono-font">
            {diff > 0 ? '+' : ''}{diff.toFixed(1)}
          </span>
        );
      },
    },
  ];

  const tableData = periodA.locationComparison.map((loc, i) => ({
    key: loc.name,
    name: loc.name,
    type: loc.type,
    actualA: loc.actualAirVolume,
    actualB: periodB.locationComparison[i]?.actualAirVolume ?? 0,
    required: loc.requiredAirVolume,
  }));

  return (
    <div style={{ padding: 16 }}>
      <Card style={{ marginBottom: 16, borderRadius: 10 }}>
        <Row gutter={16} align="middle" justify="space-between">
          <Col>
            <Space>
              <span style={{ fontWeight: 600, fontSize: 15 }}>
                <BarChartOutlined style={{ marginRight: 6, color: '#1890ff' }} />
                数据对比
              </span>
              <Tag color="blue">两时段并排对比</Tag>
            </Space>
          </Col>
          <Col>
            <Space>
              <span style={{ color: '#666' }}>对比周期：</span>
              <Select value={preset} onChange={v => setPreset(v)} style={{ width: 180 }} options={PRESET_OPTIONS} />
            </Space>
          </Col>
        </Row>
      </Card>

      <Card
        title={<span style={{ fontWeight: 600 }}>📈 核心指标对比</span>}
        style={{ marginBottom: 16, borderRadius: 10 }}
        extra={
          <Space>
            <Tag color="blue">{periodA.periodLabel}: {periodA.startDate} ~ {periodA.endDate}</Tag>
            <Tag color="orange">{periodB.periodLabel}: {periodB.startDate} ~ {periodB.endDate}</Tag>
          </Space>
        }
      >
        <Row gutter={[12, 12]}>
          <StatPair label="平均风量" valueA={periodA.avgEffectiveAirRate / 100 * 85} valueB={periodB.avgEffectiveAirRate / 100 * 85} unit="m³/s" />
          <StatPair label="达标率" valueA={periodA.complianceRate} valueB={periodB.complianceRate} unit="%" />
          <StatPair label="告警总数" valueA={periodA.alarmStats.totalCount} valueB={periodB.alarmStats.totalCount} unit="次" invertColor />
          <StatPair label="平均响应" valueA={periodA.alarmStats.avgResponseTimeMin} valueB={periodB.alarmStats.avgResponseTimeMin} unit="min" invertColor />
          <StatPair label="有效风量率" valueA={periodA.avgEffectiveAirRate} valueB={periodB.avgEffectiveAirRate} unit="%" />
          <StatPair label="风机效率" valueA={periodA.avgFanEfficiency} valueB={periodB.avgFanEfficiency} unit="%" />
          <StatPair label="达标地点" valueA={periodA.compliantLocations} valueB={periodB.compliantLocations} unit="处" />
          <StatPair label="告警处理率" valueA={periodA.alarmStats.handledRate} valueB={periodB.alarmStats.handledRate} unit="%" />
        </Row>
      </Card>

      <Card
        title={
          <span style={{ fontWeight: 600 }}>
            📊 风量参数趋势对比
            <span style={{ fontWeight: 400, fontSize: 12, color: '#999', marginLeft: 8 }}>
              （归一化相对时间轴，同位置对齐两期数据）
            </span>
          </span>
        }
        style={{ marginBottom: 16, borderRadius: 10 }}
        extra={
          <Space.Compact>
            {TREND_PARAMS.map(p => (
              <Button
                key={p.key}
                type={activeTrendParam === p.key ? 'primary' : 'default'}
                onClick={() => setActiveTrendParam(p.key as TrendParamKey)}
                size="small"
                style={{ color: activeTrendParam === p.key ? undefined : p.color, borderColor: p.color }}
              >
                {p.label}
              </Button>
            ))}
          </Space.Compact>
        }
      >
        <ReactECharts option={trendOption} style={{ height: 320 }} />
      </Card>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Card title={<span style={{ fontWeight: 600 }}>🚨 告警统计对比</span>} style={{ borderRadius: 10 }}>
            <ReactECharts option={alarmBarOption} style={{ height: 280 }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title={<span style={{ fontWeight: 600 }}>✅ 达标率对比</span>} style={{ borderRadius: 10 }}>
            <Row gutter={16}>
              <Col span={12}>
                <div style={{ textAlign: 'center' }}>
                  <ReactECharts option={complianceGaugeOptionA} style={{ height: 220 }} />
                  <Tag color="blue" style={{ marginTop: -10 }}>{periodA.periodLabel}</Tag>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ textAlign: 'center' }}>
                  <ReactECharts option={complianceGaugeOptionB} style={{ height: 220 }} />
                  <Tag color="orange" style={{ marginTop: -10 }}>{periodB.periodLabel}</Tag>
                </div>
              </Col>
            </Row>
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <DeltaTag value={periodA.complianceRate - periodB.complianceRate} />
              <span style={{ marginLeft: 8, color: '#666', fontSize: 12 }}>
                {periodA.complianceRate >= periodB.complianceRate ? '同比上升' : '同比下降'}
              </span>
            </div>
          </Card>
        </Col>
      </Row>

      <Tabs
        type="card"
        items={[
          {
            key: '1', label: '📊 用风地点风量对比图',
            children: (
              <Card style={{ borderRadius: 10, borderTop: 0 }}>
                <ReactECharts option={locationBarOption} style={{ height: 400 }} />
              </Card>
            ),
          },
          {
            key: '2', label: '📋 用风地点风量明细表',
            children: (
              <Card style={{ borderRadius: 10, borderTop: 0 }}>
                <Table
                  rowKey="key"
                  columns={tableColumns}
                  dataSource={tableData}
                  pagination={false}
                  size="middle"
                  bordered
                />
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
}
