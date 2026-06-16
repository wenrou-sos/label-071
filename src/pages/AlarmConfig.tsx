import { useState } from 'react';
import { Card, Row, Col, Form, InputNumber, Switch, Button, Space, Alert, Tag, message, Popconfirm } from 'antd';
import { ReloadOutlined, SaveOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useAlarmConfigStore } from '@/store/useAlarmConfigStore';
import { DEFAULT_ALARM_CONFIG } from '@/types';
import type { AlarmParamConfig, AlarmParamKey } from '@/types';

interface EditableConfig extends AlarmParamConfig {
  _warningError?: string;
  _alarmError?: string;
}

export default function AlarmConfig() {
  const store = useAlarmConfigStore();
  const [localConfigs, setLocalConfigs] = useState<EditableConfig[]>(
    store.configs.map(c => ({ ...c }))
  );
  const [form] = Form.useForm();

  const warningEnabledCount = localConfigs.filter(c => c.warningEnabled).length;
  const alarmEnabledCount = localConfigs.filter(c => c.alarmEnabled).length;
  const modifiedCount = localConfigs.filter((lc, i) => {
    const orig = store.configs[i];
    return lc.warningThreshold !== orig.warningThreshold
      || lc.alarmThreshold !== orig.alarmThreshold
      || lc.warningEnabled !== orig.warningEnabled
      || lc.alarmEnabled !== orig.alarmEnabled;
  }).length;

  const validateConfig = (cfgs: EditableConfig[]): boolean => {
    let hasError = false;
    const validated = cfgs.map(c => {
      const nc = { ...c, _warningError: undefined, _alarmError: undefined };
      if (c.direction === 'above') {
        if (c.warningEnabled && c.alarmEnabled && c.warningThreshold >= c.alarmThreshold) {
          nc._warningError = '预警阈值需小于报警阈值';
          nc._alarmError = '报警阈值需大于预警阈值';
          hasError = true;
        }
      } else {
        if (c.warningEnabled && c.alarmEnabled && c.warningThreshold <= c.alarmThreshold) {
          nc._warningError = '预警阈值需大于报警阈值';
          nc._alarmError = '报警阈值需小于预警阈值';
          hasError = true;
        }
      }
      if (c.warningThreshold < 0 || c.alarmThreshold < 0) {
        if (!nc._warningError && c.warningThreshold < 0) nc._warningError = '不能小于0';
        if (!nc._alarmError && c.alarmThreshold < 0) nc._alarmError = '不能小于0';
        hasError = true;
      }
      if (c.warningThreshold > c.max || c.alarmThreshold > c.max) {
        if (!nc._warningError && c.warningThreshold > c.max) nc._warningError = `不能超过${c.max}`;
        if (!nc._alarmError && c.alarmThreshold > c.max) nc._alarmError = `不能超过${c.max}`;
        hasError = true;
      }
      return nc;
    });
    setLocalConfigs(validated);
    return !hasError;
  };

  const handleWarningThresholdChange = (key: AlarmParamKey, val: number | null) => {
    if (val === null) return;
    setLocalConfigs(prev => prev.map(c =>
      c.key === key ? { ...c, warningThreshold: val, _warningError: undefined, _alarmError: undefined } : c
    ));
  };

  const handleAlarmThresholdChange = (key: AlarmParamKey, val: number | null) => {
    if (val === null) return;
    setLocalConfigs(prev => prev.map(c =>
      c.key === key ? { ...c, alarmThreshold: val, _warningError: undefined, _alarmError: undefined } : c
    ));
  };

  const handleWarningEnabledChange = (key: AlarmParamKey, checked: boolean) => {
    setLocalConfigs(prev => prev.map(c =>
      c.key === key ? { ...c, warningEnabled: checked, _warningError: undefined } : c
    ));
  };

  const handleAlarmEnabledChange = (key: AlarmParamKey, checked: boolean) => {
    setLocalConfigs(prev => prev.map(c =>
      c.key === key ? { ...c, alarmEnabled: checked, _alarmError: undefined } : c
    ));
  };

  const handleSave = () => {
    if (!validateConfig(localConfigs)) {
      message.error('存在无效的阈值设置，请检查红色提示');
      return;
    }
    localConfigs.forEach(c => {
      store.updateConfig(c.key, {
        warningEnabled: c.warningEnabled,
        alarmEnabled: c.alarmEnabled,
        warningThreshold: c.warningThreshold,
        alarmThreshold: c.alarmThreshold,
      });
    });
    message.success('告警阈值已保存，配置已自动生效');
  };

  const handleReset = () => {
    setLocalConfigs(DEFAULT_ALARM_CONFIG.map(c => ({ ...c })));
    message.info('已重置为编辑前的默认值，点击"保存"才会应用');
  };

  const handleResetAllToDefault = () => {
    store.resetToDefault();
    setLocalConfigs(store.configs.map(c => ({ ...c })));
    message.success('已恢复到系统默认阈值');
  };

  return (
    <div>
      <Alert
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        message="告警阈值配置说明"
        description={
          <div style={{ lineHeight: 1.8 }}>
            <p>• 配置会自动保存到浏览器本地（localStorage），刷新页面后仍然保留</p>
            <p>• 修改后点击「保存配置」立即生效，主通风机监控页面的告警判定和图表会实时更新</p>
            <p>• <Tag color="blue">高于阈值触发</Tag>：轴承温度、电机电流、振动（数值越大越危险）</p>
            <p>• <Tag color="orange">低于阈值触发</Tag>：风量、风压（数值越小越危险）</p>
          </div>
        }
        style={{ marginBottom: 16, borderRadius: 10 }}
      />

      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>告警阈值配置</span>
            <Space>
              <Tag color="gold">预警开启: {warningEnabledCount}/5</Tag>
              <Tag color="red">报警开启: {alarmEnabledCount}/5</Tag>
              {modifiedCount > 0 && <Tag color="processing">已修改: {modifiedCount} 项</Tag>}
            </Space>
          </div>
        }
        extra={
          <Space>
            <Popconfirm
              title="恢复系统默认阈值"
              description="确认要将所有参数的告警阈值恢复为系统默认值吗？此操作会立即生效"
              onConfirm={handleResetAllToDefault}
              okText="确认恢复"
              cancelText="取消"
            >
              <Button icon={<ReloadOutlined />}>恢复默认</Button>
            </Popconfirm>
            <Button onClick={handleReset}>重置本次编辑</Button>
            <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
              保存配置
            </Button>
          </Space>
        }
        style={{ borderRadius: 10, overflow: 'hidden' }}
      >
        <Form form={form} layout="vertical">
          <Row gutter={[16, 16]}>
            {localConfigs.map(config => (
              <Col xs={24} md={12} lg={12} xl={12} key={config.key}>
                <Card
                  size="small"
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 22 }}>{config.icon}</span>
                      <span style={{ fontWeight: 600, fontSize: 15 }}>{config.label}</span>
                      <Tag color={config.direction === 'above' ? 'blue' : 'orange'} style={{ fontSize: 11 }}>
                        {config.direction === 'above' ? '↑ 高于触发' : '↓ 低于触发'}
                      </Tag>
                      <span style={{ color: '#999', fontSize: 12 }}>
                        范围: 0 ~ {config.max}{config.unit}
                      </span>
                    </div>
                  }
                  style={{
                    borderRadius: 8,
                    borderColor: config._warningError || config._alarmError ? '#ff4d4f' : undefined,
                  }}
                >
                  <Row gutter={[16, 12]}>
                    <Col span={10}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontWeight: 500, color: '#d48806' }}>🟡 黄色预警</span>
                        <Switch
                          size="small"
                          checked={config.warningEnabled}
                          onChange={(v) => handleWarningEnabledChange(config.key, v)}
                        />
                      </div>
                      <Form.Item
                        style={{ marginBottom: 0 }}
                        validateStatus={config._warningError ? 'error' : ''}
                        help={config._warningError}
                      >
                        <InputNumber
                          style={{ width: '100%' }}
                          min={0}
                          max={config.max}
                          step={config.key === 'vibration' ? 0.1 : 1}
                          value={config.warningThreshold}
                          onChange={(v) => handleWarningThresholdChange(config.key, v)}
                          disabled={!config.warningEnabled}
                          addonAfter={config.unit}
                        />
                      </Form.Item>
                    </Col>

                    <Col span={4} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: config.direction === 'above' ? '#1890ff' : '#fa8c16',
                      fontWeight: 700,
                      fontSize: 18,
                      paddingTop: 20,
                    }}>
                      {config.direction === 'above' ? '<' : '>'}
                    </Col>

                    <Col span={10}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontWeight: 500, color: '#cf1322' }}>🔴 红色报警</span>
                        <Switch
                          size="small"
                          checked={config.alarmEnabled}
                          onChange={(v) => handleAlarmEnabledChange(config.key, v)}
                        />
                      </div>
                      <Form.Item
                        style={{ marginBottom: 0 }}
                        validateStatus={config._alarmError ? 'error' : ''}
                        help={config._alarmError}
                      >
                        <InputNumber
                          style={{ width: '100%' }}
                          min={0}
                          max={config.max}
                          step={config.key === 'vibration' ? 0.1 : 1}
                          value={config.alarmThreshold}
                          onChange={(v) => handleAlarmThresholdChange(config.key, v)}
                          disabled={!config.alarmEnabled}
                          addonAfter={config.unit}
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <div style={{ marginTop: 12, padding: '8px 12px', background: '#f5f5f5', borderRadius: 6, fontSize: 12, color: '#666' }}>
                    {config.warningEnabled || config.alarmEnabled ? (
                      <>
                        {config.direction === 'above' ? '当' : '当'}
                        <strong style={{ color: '#333' }}>{config.label}</strong>
                        {config.warningEnabled && (
                          <>
                            {' '}{config.direction === 'above' ? '≥' : '≤'}
                            <Tag color="gold" style={{ margin: '0 2px' }}>{config.warningThreshold}{config.unit}</Tag>
                            时触发预警
                          </>
                        )}
                        {config.warningEnabled && config.alarmEnabled && '，'}
                        {config.alarmEnabled && (
                          <>
                            {config.direction === 'above' ? '≥' : '≤'}
                            <Tag color="red" style={{ margin: '0 2px' }}>{config.alarmThreshold}{config.unit}</Tag>
                            时触发报警
                          </>
                        )}
                      </>
                    ) : (
                      <span style={{ color: '#999' }}>⚠️ 该参数的预警和报警均已关闭，不会产生任何告警</span>
                    )}
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </Form>
      </Card>
    </div>
  );
}
