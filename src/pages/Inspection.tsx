import { useState } from 'react';
import { Tabs, Table, Modal, Button, Form, Input, Select, DatePicker, Tag, Descriptions, Space, Row, Col, Card, Statistic, Radio, Alert } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { WarningOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useInspectionStore } from '@/store/useInspectionStore';
import type { InspectionTask, StructureWithInspection, InspectionItem } from '@/types';
import { STRUCTURE_LABELS } from '@/types';

const { TextArea } = Input;
const { Group: RadioGroup } = Radio;

const INSPECTOR_NAMES = ['张伟', '李强', '王明', '赵刚', '刘洋', '陈磊', '周涛', '孙鹏'];
const STRUCTURE_TYPE_OPTIONS = [
  { value: 'all', label: '全部类型' },
  { value: 'air_door', label: '风门' },
  { value: 'air_window', label: '风窗' },
  { value: 'air_wall', label: '风墙' },
  { value: 'air_bridge', label: '风桥' },
];

export default function Inspection() {
  const inspectionStore = useInspectionStore();
  const [activeTab, setActiveTab] = useState('1');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<InspectionTask | null>(null);
  const [form] = Form.useForm();

  const structures = inspectionStore.getStructures();
  const tasks = inspectionStore.tasks;

  const overdueCount = structures.filter(s => s.overdue).length;
  const normalCount = structures.filter(s => s.lastInspectResult === 'normal').length;
  const abnormalCount = structures.filter(s => s.lastInspectResult === 'abnormal').length;

  const filteredStructures = structures.filter(s =>
    typeFilter === 'all' || s.type === typeFilter
  );

  const structureColumns: ColumnsType<StructureWithInspection> = [
    {
      title: '设施编号', dataIndex: 'id', key: 'id', width: 100,
      render: (v: string) => <span className="mono-font">{v}</span>,
    },
    {
      title: '设施名称', dataIndex: 'name', key: 'name', width: 120,
    },
    {
      title: '设施类型', dataIndex: 'type', key: 'type', width: 100,
      render: (v: string) => <Tag color="blue">{STRUCTURE_LABELS[v as keyof typeof STRUCTURE_LABELS]}</Tag>,
    },
    {
      title: '安装日期', dataIndex: 'installDate', key: 'installDate', width: 120,
      render: (v: string) => <span className="mono-font">{v}</span>,
    },
    {
      title: '上次巡检时间', dataIndex: 'lastInspectTime', key: 'lastInspectTime', width: 180,
      render: (v: string | null, record) => {
        if (!v) return <Tag color="default">从未巡检</Tag>;
        return (
          <span className="mono-font" style={{ color: record.overdue ? '#ff4d4f' : undefined }}>
            {dayjs(v).format('YYYY-MM-DD HH:mm')}
          </span>
        );
      },
    },
    {
      title: '距上次巡检', dataIndex: 'daysSinceLastInspect', key: 'daysSinceLastInspect', width: 120,
      render: (v: number, record) => {
        if (v >= 999) return <Tag color="default">从未巡检</Tag>;
        return (
          <span style={{
            color: record.overdue ? '#ff4d4f' : v > 20 ? '#fa8c16' : '#52c41a',
            fontWeight: 600,
          }}>
            {v} 天
            {record.overdue && <WarningOutlined style={{ marginLeft: 4, color: '#ff4d4f' }} />}
          </span>
        );
      },
    },
    {
      title: '上次巡检结果', dataIndex: 'lastInspectResult', key: 'lastInspectResult', width: 120,
      render: (v: string | null) => {
        if (v === 'normal') return <Tag color="green" icon={<CheckCircleOutlined />}>正常</Tag>;
        if (v === 'abnormal') return <Tag color="red" icon={<ExclamationCircleOutlined />}>异常</Tag>;
        return <Tag color="default">无记录</Tag>;
      },
    },
    {
      title: '巡检状态', key: 'status', width: 120,
      render: (_: unknown, record) => {
        if (record.overdue) {
          return (
            <Alert
              message="超期未巡检"
              type="error"
              showIcon
              style={{ padding: '4px 8px' }}
            />
          );
        }
        return <Tag color="success">巡检正常</Tag>;
      },
    },
  ];

  const taskColumns: ColumnsType<InspectionTask> = [
    {
      title: '任务编号', dataIndex: 'taskNo', key: 'taskNo', width: 120,
      render: (v: string) => <span className="mono-font">{v}</span>,
    },
    { title: '巡检人', dataIndex: 'inspector', key: 'inspector', width: 100 },
    {
      title: '巡检时间', dataIndex: 'inspectTime', key: 'inspectTime', width: 180,
      render: (v: string) => <span className="mono-font">{dayjs(v).format('YYYY-MM-DD HH:mm')}</span>,
    },
    {
      title: '巡检设施数', key: 'count', width: 120,
      render: (_: unknown, r: InspectionTask) => `${r.items.length} 个`,
    },
    {
      title: '正常', key: 'normalCount', width: 80,
      render: (_: unknown, r: InspectionTask) => {
        const count = r.items.filter(i => i.result === 'normal').length;
        return <span style={{ color: '#52c41a', fontWeight: 600 }}>{count}</span>;
      },
    },
    {
      title: '异常', key: 'abnormalCount', width: 80,
      render: (_: unknown, r: InspectionTask) => {
        const count = r.items.filter(i => i.result === 'abnormal').length;
        return <span style={{ color: '#ff4d4f', fontWeight: 600 }}>{count}</span>;
      },
    },
    {
      title: '备注', dataIndex: 'remark', key: 'remark', ellipsis: true,
    },
    {
      title: '操作', key: 'action', width: 100,
      render: (_: unknown, record: InspectionTask) => (
        <Button type="link" onClick={() => { setSelectedTask(record); setDetailModalVisible(true); }}>查看详情</Button>
      ),
    },
  ];

  const handleAdd = (values: Record<string, unknown>) => {
    const items: InspectionItem[] = Object.entries(values)
      .filter(([key]) => key.startsWith('result_'))
      .map(([key, value]) => {
        const structureId = key.replace('result_', '');
        const structure = structures.find(s => s.id === structureId)!;
        const remark = values[`remark_${structureId}`] as string | undefined;
        return {
          structureId,
          structureName: structure.name,
          structureType: structure.type,
          result: value as 'normal' | 'abnormal',
          remark: remark || undefined,
        };
      });

    inspectionStore.addTask({
      inspector: values.inspector as string,
      inspectTime: (values.inspectTime as { toISOString: () => string }).toISOString(),
      items,
      remark: values.taskRemark as string | undefined,
    });

    setAddModalVisible(false);
    form.resetFields();
  };

  const openAddModal = () => {
    form.resetFields();
    form.setFieldsValue({
      inspectTime: dayjs(),
      inspector: INSPECTOR_NAMES[0],
    });
    structures.forEach(s => {
      form.setFieldsValue({ [`result_${s.id}`]: 'normal' });
    });
    setAddModalVisible(true);
  };

  return (
    <div>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        type="card"
        items={[
          {
            key: '1', label: '🏗️ 设施巡检状态',
            children: (
              <>
                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                  <Col span={6}>
                    <Card style={{ borderRadius: 8, borderTop: '3px solid #1890ff' }}>
                      <Statistic title="设施总数" value={structures.length} suffix="个" valueStyle={{ color: '#1890ff' }} />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card style={{ borderRadius: 8, borderTop: '3px solid #52c41a' }}>
                      <Statistic title="上次正常" value={normalCount} suffix="个" valueStyle={{ color: '#52c41a' }} />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card style={{ borderRadius: 8, borderTop: '3px solid #ff4d4f' }}>
                      <Statistic title="超期未巡检" value={overdueCount} suffix="个" valueStyle={{ color: '#ff4d4f' }} />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card style={{ borderRadius: 8, borderTop: '3px solid #fa8c16' }}>
                      <Statistic title="上次异常" value={abnormalCount} suffix="个" valueStyle={{ color: '#fa8c16' }} />
                    </Card>
                  </Col>
                </Row>

                {overdueCount > 0 && (
                  <Alert
                    message={`有 ${overdueCount} 个设施超过 30 天未巡检，请及时安排巡检！`}
                    type="warning"
                    showIcon
                    style={{ marginBottom: 16, borderRadius: 8 }}
                  />
                )}

                <Space style={{ marginBottom: 16 }}>
                  <Button type="primary" onClick={openAddModal}>新建巡检任务</Button>
                  <Select
                    value={typeFilter}
                    onChange={setTypeFilter}
                    options={STRUCTURE_TYPE_OPTIONS}
                    style={{ width: 140 }}
                  />
                </Space>

                <Card style={{ borderRadius: 10, overflow: 'hidden' }}>
                  <Table
                    rowKey="id"
                    columns={structureColumns}
                    dataSource={filteredStructures}
                    pagination={{ pageSize: 10, showTotal: t => `共 ${t} 个设施` }}
                    size="middle"
                    onRow={(record) => ({
                      style: record.overdue ? { background: '#fff2f0' } : {},
                    })}
                  />
                </Card>
              </>
            ),
          },
          {
            key: '2', label: '📋 巡检历史记录',
            children: (
              <>
                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                  <Col span={8}>
                    <Card style={{ borderRadius: 8, borderTop: '3px solid #722ed1' }}>
                      <Statistic title="总巡检次数" value={tasks.length} suffix="次" valueStyle={{ color: '#722ed1' }} />
                    </Card>
                  </Col>
                  <Col span={8}>
                    <Card style={{ borderRadius: 8, borderTop: '3px solid #52c41a' }}>
                      <Statistic
                        title="巡检正常率"
                        value={tasks.length > 0 ? Math.round(
                          tasks.reduce((s, t) => s + t.items.filter(i => i.result === 'normal').length, 0) /
                          tasks.reduce((s, t) => s + t.items.length, 0) * 100
                        ) : 0}
                        suffix="%"
                        valueStyle={{ color: '#52c41a' }}
                      />
                    </Card>
                  </Col>
                  <Col span={8}>
                    <Card style={{ borderRadius: 8, borderTop: '3px solid #fa8c16' }}>
                      <Statistic
                        title="最近巡检"
                        value={tasks.length > 0 ? dayjs(tasks[0].inspectTime).format('MM-DD') : '-'}
                        valueStyle={{ color: '#fa8c16', fontSize: 22 }}
                      />
                    </Card>
                  </Col>
                </Row>

                <Space style={{ marginBottom: 16 }}>
                  <Button type="primary" onClick={openAddModal}>新建巡检任务</Button>
                </Space>

                <Card style={{ borderRadius: 10, overflow: 'hidden' }}>
                  <Table
                    rowKey="id"
                    columns={taskColumns}
                    dataSource={tasks}
                    pagination={{ pageSize: 10, showTotal: t => `共 ${t} 条记录` }}
                    size="middle"
                  />
                </Card>
              </>
            ),
          },
        ]}
      />

      <Modal
        title="新建巡检任务"
        open={addModalVisible}
        onCancel={() => setAddModalVisible(false)}
        onOk={() => form.submit()}
        width={900}
        okText="提交巡检"
        cancelText="取消"
      >
        <Form form={form} layout="vertical" onFinish={handleAdd}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="inspector" label="巡检人" rules={[{ required: true, message: '请选择巡检人' }]}>
                <Select options={INSPECTOR_NAMES.map(n => ({ value: n }))} placeholder="请选择巡检人" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="inspectTime" label="巡检时间" rules={[{ required: true, message: '请选择巡检时间' }]}>
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Card title="设施巡检结果" size="small" style={{ marginBottom: 16 }}>
            {structures.map((s, idx) => (
              <Row key={s.id} align="middle" style={{
                padding: '12px 0',
                borderBottom: idx < structures.length - 1 ? '1px solid #f0f0f0' : 'none',
              }}>
                <Col span={6}>
                  <span style={{ fontWeight: 500 }}>{s.name}</span>
                  <Tag color="blue" style={{ marginLeft: 8 }}>
                    {STRUCTURE_LABELS[s.type]}
                  </Tag>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name={`result_${s.id}`}
                    style={{ marginBottom: 0 }}
                    rules={[{ required: true, message: '请选择巡检结果' }]}
                  >
                    <RadioGroup>
                      <Radio value="normal" style={{ color: '#52c41a' }}>正常</Radio>
                      <Radio value="abnormal" style={{ color: '#ff4d4f' }}>异常</Radio>
                    </RadioGroup>
                  </Form.Item>
                </Col>
                <Col span={10}>
                  <Form.Item name={`remark_${s.id}`} style={{ marginBottom: 0 }}>
                    <Input placeholder="备注（可选）" size="small" />
                  </Form.Item>
                </Col>
              </Row>
            ))}
          </Card>

          <Form.Item name="taskRemark" label="巡检备注">
            <TextArea rows={2} placeholder="本次巡检的总体情况说明（可选）" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="巡检详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedTask && (
          <>
            <Descriptions column={3} size="small" bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="任务编号">
                <span className="mono-font">{selectedTask.taskNo}</span>
              </Descriptions.Item>
              <Descriptions.Item label="巡检人">{selectedTask.inspector}</Descriptions.Item>
              <Descriptions.Item label="巡检时间">
                <span className="mono-font">{dayjs(selectedTask.inspectTime).format('YYYY-MM-DD HH:mm')}</span>
              </Descriptions.Item>
            </Descriptions>

            <Card title="巡检明细" size="small">
              {selectedTask.items.map((item, idx) => (
                <Row key={item.structureId} align="middle" style={{
                  padding: '12px 0',
                  borderBottom: idx < selectedTask.items.length - 1 ? '1px solid #f0f0f0' : 'none',
                }}>
                  <Col span={6}>
                    <span style={{ fontWeight: 500 }}>{item.structureName}</span>
                    <Tag color="blue" style={{ marginLeft: 8 }}>
                      {STRUCTURE_LABELS[item.structureType]}
                    </Tag>
                  </Col>
                  <Col span={6}>
                    {item.result === 'normal'
                      ? <Tag color="green" icon={<CheckCircleOutlined />}>正常</Tag>
                      : <Tag color="red" icon={<ExclamationCircleOutlined />}>异常</Tag>
                    }
                  </Col>
                  <Col span={12}>
                    {item.remark ? <span style={{ color: '#666' }}>{item.remark}</span> : <span style={{ color: '#bbb' }}>无备注</span>}
                  </Col>
                </Row>
              ))}
            </Card>

            {selectedTask.remark && (
              <Alert
                message="巡检备注"
                description={selectedTask.remark}
                type="info"
                showIcon
                style={{ marginTop: 16, borderRadius: 8 }}
              />
            )}
          </>
        )}
      </Modal>
    </div>
  );
}
