import { useState, useRef } from 'react';
import { Tabs, Table, Modal, Button, Form, Input, Select, DatePicker, InputNumber, Tag, Descriptions, Space, Row, Col, Card, Statistic } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';
import { generateFanSwitchRecords, generateReverseAirDrills } from '@/mock/operationData';
import type { FanSwitchRecord, ReverseAirDrill } from '@/types';

const { TextArea } = Input;

const PARAM_KEYS = ['airVolume', 'airPressure', 'motorCurrent', 'bearingTemp', 'vibration'] as const;
const PARAM_LABELS: Record<string, string> = {
  airVolume: '风量(m³/s)', airPressure: '风压(Pa)', motorCurrent: '电机电流(A)',
  bearingTemp: '轴承温度(℃)', vibration: '振动(mm/s)',
};
const PRESET_NAMES = ['张伟', '李强', '王明', '赵刚', '刘洋', '陈磊', '周涛', '孙鹏'];

type ParamsNoStatus = Omit<FanSwitchRecord['beforeParams'], 'fanId' | 'fanName' | 'timestamp'>;

function getBarOption(record: FanSwitchRecord) {
  const categories = PARAM_KEYS.map(k => PARAM_LABELS[k]);
  const before = PARAM_KEYS.map(k => (record.beforeParams as unknown as ParamsNoStatus)[k]);
  const after = PARAM_KEYS.map(k => (record.afterParams as unknown as ParamsNoStatus)[k]);
  const changes = PARAM_KEYS.map((k, i) => {
    const b = (record.beforeParams as unknown as ParamsNoStatus)[k];
    const a = (record.afterParams as unknown as ParamsNoStatus)[k];
    return a - b;
  });
  return {
    tooltip: { trigger: 'axis' },
    legend: { data: ['切换前', '切换后', '变化量'] },
    grid: { left: 60, right: 30, bottom: 30, top: 40 },
    xAxis: { type: 'category', data: categories, axisLabel: { fontSize: 10 } },
    yAxis: { type: 'value' },
    series: [
      { name: '切换前', type: 'bar', data: before, itemStyle: { color: '#1890ff', borderRadius: [3, 3, 0, 0] } },
      { name: '切换后', type: 'bar', data: after, itemStyle: { color: '#52c41a', borderRadius: [3, 3, 0, 0] } },
      { name: '变化量', type: 'line', data: changes, lineStyle: { type: 'dashed', color: '#ff4d4f' }, itemStyle: { color: '#ff4d4f' } },
    ],
  };
}

export default function OperationRecords() {
  const [activeTab, setActiveTab] = useState('1');
  const [fanRecords, setFanRecords] = useState<FanSwitchRecord[]>(generateFanSwitchRecords);
  const [drillRecords, setDrillRecords] = useState<ReverseAirDrill[]>(generateReverseAirDrills);
  const [fanDetailVisible, setFanDetailVisible] = useState(false);
  const [drillDetailVisible, setDrillDetailVisible] = useState(false);
  const [selectedFan, setSelectedFan] = useState<FanSwitchRecord | null>(null);
  const [selectedDrill, setSelectedDrill] = useState<ReverseAirDrill | null>(null);
  const [fanAddVisible, setFanAddVisible] = useState(false);
  const [drillAddVisible, setDrillAddVisible] = useState(false);
  const fanFormRef = useRef<any>(null);
  const drillFormRef = useRef<any>(null);

  const plannedCount = fanRecords.filter(r => r.reason === '计划检修').length;
  const faultCount = fanRecords.filter(r => r.reason === '故障切换').length;

  const fanColumns: ColumnsType<FanSwitchRecord> = [
    {
      title: '编号', dataIndex: 'id', key: 'id', width: 80,
      render: (v: string) => <span className="mono-font">{v}</span>,
    },
    { title: '操作人', dataIndex: 'operator', key: 'operator', width: 100 },
    {
      title: '操作时间', dataIndex: 'operateTime', key: 'operateTime', width: 160,
      render: (v: string) => <span className="mono-font">{dayjs(v).format('YYYY-MM-DD HH:mm')}</span>,
    },
    {
      title: '倒机原因', dataIndex: 'reason', key: 'reason', width: 120,
      render: (v: string) => <Tag color={v === '计划检修' ? 'blue' : 'red'}>{v}</Tag>,
    },
    {
      title: '切换前风机', key: 'beforeFan', width: 120,
      render: (_: unknown, r: FanSwitchRecord) => r.beforeParams.fanName,
    },
    {
      title: '切换后风机', key: 'afterFan', width: 120,
      render: (_: unknown, r: FanSwitchRecord) => r.afterParams.fanName,
    },
    {
      title: '操作', key: 'action', width: 100,
      render: (_: unknown, record: FanSwitchRecord) => (
        <Button type="link" onClick={() => { setSelectedFan(record); setFanDetailVisible(true); }}>查看详情</Button>
      ),
    },
  ];

  const drillColumns: ColumnsType<ReverseAirDrill> = [
    {
      title: '编号', dataIndex: 'id', key: 'id', width: 80,
      render: (v: string) => <span className="mono-font">{v}</span>,
    },
    {
      title: '反风时间', dataIndex: 'reverseTime', key: 'reverseTime', width: 160,
      render: (v: string) => <span className="mono-font">{dayjs(v).format('YYYY-MM-DD HH:mm')}</span>,
    },
    {
      title: '持续时间', dataIndex: 'reverseDuration', key: 'reverseDuration', width: 100,
      render: (v: string) => <Tag color="blue">{v}</Tag>,
    },
    {
      title: '反风率(%)', dataIndex: 'reverseRate', key: 'reverseRate', width: 100,
      render: (v: number) => (
        <span style={{ fontWeight: 700, color: v >= 60 ? '#52c41a' : '#ff4d4f' }} className="mono-font">
          {v}%
        </span>
      ),
    },
    {
      title: '参加人员', dataIndex: 'participants', key: 'participants',
      render: (v: string[]) => v.map(p => <Tag key={p} style={{ marginBottom: 2 }}>{p}</Tag>),
    },
    {
      title: '演习结论', dataIndex: 'conclusion', key: 'conclusion', ellipsis: true,
    },
    {
      title: '操作', key: 'action', width: 100,
      render: (_: unknown, record: ReverseAirDrill) => (
        <Button type="link" onClick={() => { setSelectedDrill(record); setDrillDetailVisible(true); }}>查看详情</Button>
      ),
    },
  ];

  const handleFanAdd = (values: any) => {
    const ts = new Date().toISOString();
    setFanRecords(prev => [...prev, {
      id: `SW${String(prev.length + 1).padStart(3, '0')}`,
      operator: values.operator,
      operateTime: values.operateTime.toISOString(),
      reason: values.reason,
      beforeParams: { fanId: 'FAN001', fanName: '1号主通风机', airVolume: 84, airPressure: 2780, motorCurrent: 183, bearingTemp: 55, vibration: 2.5, timestamp: ts },
      afterParams: { fanId: 'FAN001', fanName: '1号主通风机', airVolume: 85, airPressure: 2800, motorCurrent: 185, bearingTemp: 53, vibration: 2.3, timestamp: ts },
    }]);
    setFanAddVisible(false);
    fanFormRef.current?.resetFields();
  };

  const handleDrillAdd = (values: any) => {
    setDrillRecords(prev => [...prev, {
      id: `RAD${String(prev.length + 1).padStart(3, '0')}`,
      reverseTime: values.reverseTime.toISOString(),
      reverseDuration: values.reverseDuration,
      reverseRate: values.reverseRate,
      participants: values.participants,
      conclusion: values.conclusion,
    }]);
    setDrillAddVisible(false);
    drillFormRef.current?.resetFields();
  };

  const closeFanAdd = () => { setFanAddVisible(false); fanFormRef.current?.resetFields(); };
  const closeDrillAdd = () => { setDrillAddVisible(false); drillFormRef.current?.resetFields(); };

  return (
    <div>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        type="card"
        items={[
          {
            key: '1', label: '🔄 倒机操作记录',
            children: (
              <>
                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                  <Col span={8}>
                    <Card style={{ borderRadius: 8, borderTop: '3px solid #1890ff' }}>
                      <Statistic title="总操作次数" value={fanRecords.length} suffix="次" valueStyle={{ color: '#1890ff' }} />
                    </Card>
                  </Col>
                  <Col span={8}>
                    <Card style={{ borderRadius: 8, borderTop: '3px solid #52c41a' }}>
                      <Statistic title="计划检修" value={plannedCount} suffix="次" valueStyle={{ color: '#52c41a' }} />
                    </Card>
                  </Col>
                  <Col span={8}>
                    <Card style={{ borderRadius: 8, borderTop: '3px solid #ff4d4f' }}>
                      <Statistic title="故障切换" value={faultCount} suffix="次" valueStyle={{ color: '#ff4d4f' }} />
                    </Card>
                  </Col>
                </Row>
                <Space style={{ marginBottom: 16 }}>
                  <Button type="primary" onClick={() => setFanAddVisible(true)}>新增记录</Button>
                </Space>
                <Card style={{ borderRadius: 10, overflow: 'hidden' }}>
                  <Table
                    rowKey="id"
                    columns={fanColumns}
                    dataSource={fanRecords}
                    pagination={{ pageSize: 8, showTotal: t => `共 ${t} 条记录` }}
                    size="middle"
                  />
                </Card>
              </>
            ),
          },
          {
            key: '2', label: '💨 反风演习记录',
            children: (
              <>
                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                  <Col span={8}>
                    <Card style={{ borderRadius: 8, borderTop: '3px solid #722ed1' }}>
                      <Statistic title="演习总次数" value={drillRecords.length} suffix="次" valueStyle={{ color: '#722ed1' }} />
                    </Card>
                  </Col>
                  <Col span={8}>
                    <Card style={{ borderRadius: 8, borderTop: '3px solid #52c41a' }}>
                      <Statistic
                        title="平均反风率"
                        value={drillRecords.length > 0 ? Math.round(drillRecords.reduce((s, d) => s + d.reverseRate, 0) / drillRecords.length * 10) / 10 : 0}
                        suffix="%"
                        valueStyle={{ color: '#52c41a' }}
                      />
                    </Card>
                  </Col>
                  <Col span={8}>
                    <Card style={{ borderRadius: 8, borderTop: '3px solid #fa8c16' }}>
                      <Statistic
                        title="最近演习"
                        value={drillRecords.length > 0 ? dayjs(drillRecords[0].reverseTime).format('MM-DD') : '-'}
                        valueStyle={{ color: '#fa8c16', fontSize: 22 }}
                      />
                    </Card>
                  </Col>
                </Row>
                <Space style={{ marginBottom: 16 }}>
                  <Button type="primary" onClick={() => setDrillAddVisible(true)}>新增记录</Button>
                </Space>
                <Card style={{ borderRadius: 10, overflow: 'hidden' }}>
                  <Table
                    rowKey="id"
                    columns={drillColumns}
                    dataSource={drillRecords}
                    pagination={{ pageSize: 8, showTotal: t => `共 ${t} 条记录` }}
                    size="middle"
                  />
                </Card>
              </>
            ),
          },
        ]}
      />

      <Modal
        title="倒机操作详情"
        open={fanDetailVisible}
        onCancel={() => setFanDetailVisible(false)}
        footer={null}
        width={900}
      >
        {selectedFan && (
          <>
            <Descriptions column={3} size="small" bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="操作人">{selectedFan.operator}</Descriptions.Item>
              <Descriptions.Item label="操作时间">{dayjs(selectedFan.operateTime).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
              <Descriptions.Item label="倒机原因">
                <Tag color={selectedFan.reason === '计划检修' ? 'blue' : 'red'}>{selectedFan.reason}</Tag>
              </Descriptions.Item>
            </Descriptions>
            <Row gutter={16}>
              <Col span={12}>
                <Card title="切换前参数" size="small" style={{ borderRadius: 8, borderColor: '#1890ff' }}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="风机">{selectedFan.beforeParams.fanName}</Descriptions.Item>
                    <Descriptions.Item label="风量">{selectedFan.beforeParams.airVolume} m³/s</Descriptions.Item>
                    <Descriptions.Item label="风压">{selectedFan.beforeParams.airPressure} Pa</Descriptions.Item>
                    <Descriptions.Item label="电机电流">{selectedFan.beforeParams.motorCurrent} A</Descriptions.Item>
                    <Descriptions.Item label="轴承温度">{selectedFan.beforeParams.bearingTemp} ℃</Descriptions.Item>
                    <Descriptions.Item label="振动">{selectedFan.beforeParams.vibration} mm/s</Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="切换后参数" size="small" style={{ borderRadius: 8, borderColor: '#52c41a' }}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="风机">{selectedFan.afterParams.fanName}</Descriptions.Item>
                    <Descriptions.Item label="风量">{selectedFan.afterParams.airVolume} m³/s</Descriptions.Item>
                    <Descriptions.Item label="风压">{selectedFan.afterParams.airPressure} Pa</Descriptions.Item>
                    <Descriptions.Item label="电机电流">{selectedFan.afterParams.motorCurrent} A</Descriptions.Item>
                    <Descriptions.Item label="轴承温度">{selectedFan.afterParams.bearingTemp} ℃</Descriptions.Item>
                    <Descriptions.Item label="振动">{selectedFan.afterParams.vibration} mm/s</Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
            </Row>
            <ReactECharts option={getBarOption(selectedFan)} style={{ height: 300, marginTop: 16 }} />
          </>
        )}
      </Modal>

      <Modal
        title="反风演习详情"
        open={drillDetailVisible}
        onCancel={() => setDrillDetailVisible(false)}
        footer={null}
        width={600}
      >
        {selectedDrill && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="反风时间">{dayjs(selectedDrill.reverseTime).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
            <Descriptions.Item label="持续时间">{selectedDrill.reverseDuration}</Descriptions.Item>
            <Descriptions.Item label="反风率">
              <span style={{ fontWeight: 700, color: selectedDrill.reverseRate >= 60 ? '#52c41a' : '#ff4d4f', fontSize: 16 }}>
                {selectedDrill.reverseRate}%
              </span>
              {selectedDrill.reverseRate >= 60 && <Tag color="green" style={{ marginLeft: 8 }}>满足规程要求(≥60%)</Tag>}
            </Descriptions.Item>
            <Descriptions.Item label="参加人员">{selectedDrill.participants.map(p => <Tag key={p} style={{ marginBottom: 2 }}>{p}</Tag>)}</Descriptions.Item>
            <Descriptions.Item label="演习结论">{selectedDrill.conclusion}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      <Modal title="新增倒机记录" open={fanAddVisible} onCancel={closeFanAdd} onOk={() => fanFormRef.current?.submit()} width={500}>
        <Form ref={fanFormRef} layout="vertical" onFinish={handleFanAdd}>
          <Form.Item name="operator" label="操作人" rules={[{ required: true, message: '请输入操作人' }]}>
            <Select options={PRESET_NAMES.map(n => ({ value: n }))} placeholder="请选择操作人" />
          </Form.Item>
          <Form.Item name="operateTime" label="操作时间" rules={[{ required: true, message: '请选择操作时间' }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="reason" label="倒机原因" rules={[{ required: true, message: '请选择倒机原因' }]}>
            <Select options={[{ value: '计划检修' }, { value: '故障切换' }]} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="新增反风演习记录" open={drillAddVisible} onCancel={closeDrillAdd} onOk={() => drillFormRef.current?.submit()} width={500}>
        <Form ref={drillFormRef} layout="vertical" onFinish={handleDrillAdd}>
          <Form.Item name="reverseTime" label="反风时间" rules={[{ required: true, message: '请选择反风时间' }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="reverseDuration" label="持续时间" rules={[{ required: true, message: '请输入持续时间' }]}>
            <Input placeholder="如：8分32秒" />
          </Form.Item>
          <Form.Item name="reverseRate" label="反风率(%)" rules={[{ required: true, message: '请输入反风率' }]}>
            <InputNumber min={0} max={100} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="participants" label="参加人员" rules={[{ required: true, message: '请选择参加人员' }]}>
            <Select mode="multiple" options={PRESET_NAMES.map(n => ({ value: n }))} placeholder="请选择" />
          </Form.Item>
          <Form.Item name="conclusion" label="演习结论" rules={[{ required: true, message: '请输入演习结论' }]}>
            <TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
