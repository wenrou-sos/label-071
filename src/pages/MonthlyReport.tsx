import { useState, useMemo, useRef } from 'react';
import { Card, Select, Button, Row, Col, Statistic, Table, Tag, Progress, message, Descriptions, Divider, Spin } from 'antd';
import { FilePdfOutlined, SyncOutlined, CheckCircleOutlined, WarningOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import type { MonthlyReport, AirLocation } from '@/types';
import dayjs from 'dayjs';
import { useReportStore } from '@/store/useReportStore';

const TYPE_TAG_COLOR: Record<AirLocation['type'], string> = {
  采煤工作面: 'blue',
  掘进面: 'green',
  硐室: 'purple',
};

const TYPE_ICON: Record<AirLocation['type'], string> = {
  采煤工作面: '⛏️',
  掘进面: '🔧',
  硐室: '🏗️',
};

function getRateColor(rate: number) {
  if (rate >= 85) return '#52c41a';
  if (rate >= 70) return '#faad14';
  return '#ff4d4f';
}

export default function MonthlyReport() {
  const { reports, regenerateReports } = useReportStore();
  const [selectedMonth, setSelectedMonth] = useState(reports[reports.length - 1].month);
  const [generating, setGenerating] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const selectedReport: MonthlyReport | undefined = useMemo(
    () => reports.find((r) => r.month === selectedMonth),
    [reports, selectedMonth],
  );

  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      regenerateReports();
      message.success('月报已重新生成');
    } finally {
      setGenerating(false);
    }
  };

  const barChartOption = useMemo(() => {
    if (!selectedReport) return {};
    const names = selectedReport.locations.map((l) => l.name);
    const actualData = selectedReport.locations.map((l) => l.actualAirVolume);
    const requiredData = selectedReport.locations.map((l) => l.requiredAirVolume);
    const markPoints = selectedReport.locations
      .map((l, i) => (!l.compliance ? { coord: [i, l.actualAirVolume], symbol: 'pin', symbolSize: 30, itemStyle: { color: '#ff4d4f' } } : null))
      .filter(Boolean);

    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { data: ['实际风量', '需风量'], top: 5 },
      grid: { left: 60, right: 30, bottom: 80, top: 40 },
      xAxis: { type: 'category', data: names, axisLabel: { rotate: 25, fontSize: 11 } },
      yAxis: { type: 'value', name: 'm³/s', nameTextStyle: { fontSize: 12 } },
      series: [
        {
          name: '实际风量', type: 'bar', barWidth: '30%',
          data: actualData,
          itemStyle: { color: '#1890ff', borderRadius: [4, 4, 0, 0] },
          markPoint: { data: markPoints },
        },
        {
          name: '需风量', type: 'bar', barWidth: '30%',
          data: requiredData,
          itemStyle: { color: '#fa8c16', borderRadius: [4, 4, 0, 0] },
        },
      ],
    };
  }, [selectedReport]);

  const pieChartOption = useMemo(() => {
    if (!selectedReport) return {};
    const groups: Record<string, number> = {};
    selectedReport.locations.forEach(l => {
      groups[l.type] = (groups[l.type] || 0) + 1;
    });
    return {
      tooltip: { trigger: 'item' },
      legend: { top: 5, textStyle: { fontSize: 11 } },
      series: [{
        type: 'pie', radius: ['40%', '65%'], center: ['50%', '55%'],
        label: { formatter: '{b}: {c}处\n({d}%)', fontSize: 11 },
        data: Object.entries(groups).map(([name, value]) => ({
          name, value,
          itemStyle: {
            color: name === '采煤工作面' ? '#1890ff' : name === '掘进面' ? '#52c41a' : '#722ed1',
          },
        })),
      }],
    };
  }, [selectedReport]);

  const complianceChartOption = useMemo(() => {
    if (!selectedReport) return {};
    const compliance = selectedReport.locations.filter(l => l.compliance).length;
    const nonCompliance = selectedReport.locations.length - compliance;
    return {
      tooltip: { trigger: 'item' },
      series: [{
        type: 'pie', radius: ['55%', '75%'], center: ['50%', '50%'],
        label: { show: false },
        data: [
          { value: compliance, name: '达标', itemStyle: { color: '#52c41a' } },
          { value: nonCompliance, name: '不达标', itemStyle: { color: '#ff4d4f' } },
        ],
      }],
      graphic: [{
        type: 'text', left: 'center', top: 'center',
        style: { text: `${Math.round(compliance / selectedReport.locations.length * 100)}%`, fontSize: 22, fontWeight: 700, fill: '#333' },
      }],
    };
  }, [selectedReport]);

  const columns = [
    {
      title: '用风地点', dataIndex: 'name', key: 'name',
      render: (name: string, record: AirLocation) => (
        <span>{TYPE_ICON[record.type] || ''} {name}</span>
      ),
    },
    {
      title: '类型', dataIndex: 'type', key: 'type',
      render: (type: AirLocation['type']) => <Tag color={TYPE_TAG_COLOR[type]}>{type}</Tag>,
    },
    {
      title: '实际风量(m³/s)', dataIndex: 'actualAirVolume', key: 'actualAirVolume',
      render: (v: number) => <span className="mono-font" style={{ fontWeight: 600 }}>{v}</span>,
    },
    {
      title: '需风量(m³/s)', dataIndex: 'requiredAirVolume', key: 'requiredAirVolume',
      render: (v: number) => <span className="mono-font">{v}</span>,
    },
    {
      title: '差值', key: 'diff',
      render: (_: unknown, record: AirLocation) => {
        const diff = record.actualAirVolume - record.requiredAirVolume;
        return <span style={{ color: diff >= 0 ? '#52c41a' : '#ff4d4f', fontWeight: 600 }} className="mono-font">
          {diff > 0 ? `+${diff}` : diff}
        </span>;
      },
    },
    {
      title: '达标状态', dataIndex: 'compliance', key: 'compliance',
      render: (compliance: boolean) =>
        compliance
          ? <Tag icon={<CheckCircleOutlined />} color="success">达标</Tag>
          : <Tag icon={<WarningOutlined />} color="error">不达标</Tag>,
    },
  ];

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setExportingPdf(true);
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true, backgroundColor: '#fff', windowWidth: reportRef.current.scrollWidth });
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfPageHeight = pdf.internal.pageSize.getHeight();
      const imgWidthPx = canvas.width;
      const imgHeightPx = canvas.height;
      const pageHeightPx = (pdfPageHeight * imgWidthPx) / pdfWidth;
      const totalPages = Math.ceil(imgHeightPx / pageHeightPx);

      for (let i = 0; i < totalPages; i++) {
        if (i > 0) pdf.addPage();
        const sy = i * pageHeightPx;
        const sHeight = Math.min(pageHeightPx, imgHeightPx - sy);
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = imgWidthPx;
        pageCanvas.height = sHeight;
        const pctx = pageCanvas.getContext('2d')!;
        pctx.fillStyle = '#ffffff';
        pctx.fillRect(0, 0, imgWidthPx, sHeight);
        pctx.drawImage(canvas, 0, sy, imgWidthPx, sHeight, 0, 0, imgWidthPx, sHeight);
        const pageImgData = pageCanvas.toDataURL('image/png');
        const dHeight = (sHeight * pdfWidth) / imgWidthPx;
        pdf.addImage(pageImgData, 'PNG', 0, 0, pdfWidth, dHeight);
      }
      pdf.save(`通风月报_${selectedMonth}.pdf`);
      message.success('PDF导出成功');
    } catch (e) {
      console.error(e);
      message.error('PDF导出失败');
    } finally {
      setExportingPdf(false);
    }
  };

  if (!selectedReport) return null;

  const rateColor = getRateColor(selectedReport.effectiveAirRate);

  return (
    <div style={{ padding: 16 }}>
      <Card style={{ marginBottom: 16, borderRadius: 10, overflow: 'hidden' }}>
        <Row gutter={16} align="middle" justify="space-between">
          <Col>
            <Select
              value={selectedMonth}
              onChange={setSelectedMonth}
              style={{ width: 160 }}
              options={reports.map((r) => ({ value: r.month, label: r.month }))}
            />
          </Col>
          <Col>
            <Row gutter={8}>
              <Col>
                <Button type="primary" icon={<SyncOutlined />} loading={generating} onClick={handleGenerateReport}>
                  生成月报
                </Button>
              </Col>
              <Col>
                <Button icon={<FilePdfOutlined />} loading={exportingPdf} onClick={handleExportPDF}>
                  导出PDF
                </Button>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      <div ref={reportRef}>
        <div style={{ background: '#fff', padding: 24, borderRadius: 10, marginBottom: 16 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <h2 style={{ margin: 0, fontSize: 22, color: '#0A2647' }}>矿井通风月度报告</h2>
            <p style={{ color: '#666', margin: '4px 0 0' }}>报告月份：{selectedMonth}</p>
          </div>

          <Row gutter={[16, 16]}>
            <Col span={6}>
              <Card style={{ borderRadius: 8, borderTop: '3px solid #1890ff' }}>
                <Statistic
                  title={<span style={{ color: '#666' }}>有效风量率</span>}
                  value={selectedReport.effectiveAirRate}
                  suffix="%"
                  valueStyle={{ color: rateColor, fontWeight: 700 }}
                />
                <Progress percent={selectedReport.effectiveAirRate} showInfo={false} strokeColor={rateColor} size="small" />
              </Card>
            </Col>
            <Col span={6}>
              <Card style={{ borderRadius: 8, borderTop: '3px solid #fa8c16' }}>
                <Statistic
                  title={<span style={{ color: '#666' }}>风机效率</span>}
                  value={selectedReport.fanEfficiency}
                  suffix="%"
                  valueStyle={{ color: getRateColor(selectedReport.fanEfficiency), fontWeight: 700 }}
                />
                <Progress percent={selectedReport.fanEfficiency} showInfo={false} strokeColor={getRateColor(selectedReport.fanEfficiency)} size="small" />
              </Card>
            </Col>
            <Col span={6}>
              <Card style={{ borderRadius: 8, borderTop: '3px solid #52c41a' }}>
                <Statistic
                  title={<span style={{ color: '#666' }}>达标地点</span>}
                  value={selectedReport.locations.filter(l => l.compliance).length}
                  suffix={`/ ${selectedReport.locations.length}`}
                  valueStyle={{ color: '#52c41a', fontWeight: 700 }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card style={{ borderRadius: 8, borderTop: '3px solid #ff4d4f' }}>
                <Statistic
                  title={<span style={{ color: '#666' }}>不达标地点</span>}
                  value={selectedReport.locations.filter(l => !l.compliance).length}
                  suffix="处"
                  valueStyle={{ color: '#ff4d4f', fontWeight: 700 }}
                />
              </Card>
            </Col>
          </Row>
        </div>

        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col span={14}>
            <Card title="各用风地点风量对比" style={{ borderRadius: 10, overflow: 'hidden' }}>
              <ReactECharts option={barChartOption} style={{ height: 400 }} />
            </Card>
          </Col>
          <Col span={5}>
            <Card title="达标率" style={{ borderRadius: 10, overflow: 'hidden' }}>
              <ReactECharts option={complianceChartOption} style={{ height: 200 }} />
              <div style={{ textAlign: 'center', marginTop: 8 }}>
                <Tag color={selectedReport.locations.filter(l => l.compliance).length === selectedReport.locations.length ? 'green' : 'red'}>
                  {selectedReport.locations.filter(l => l.compliance).length === selectedReport.locations.length ? '全部达标' : '存在不达标'}
                </Tag>
              </div>
            </Card>
          </Col>
          <Col span={5}>
            <Card title="用风地点分布" style={{ borderRadius: 10, overflow: 'hidden' }}>
              <ReactECharts option={pieChartOption} style={{ height: 200 }} />
            </Card>
          </Col>
        </Row>

        <Card title="风量对比明细表" style={{ borderRadius: 10, overflow: 'hidden' }}>
          <Table
            rowKey="id"
            columns={columns}
            dataSource={selectedReport.locations}
            pagination={false}
            size="middle"
            bordered
            rowClassName={(r) => !r.compliance ? 'row-non-compliance' : ''}
          />
        </Card>

        <Card style={{ marginTop: 16, borderRadius: 10 }}>
          <Descriptions column={2} size="small">
            <Descriptions.Item label="报告编号">{selectedReport.id}</Descriptions.Item>
            <Descriptions.Item label="生成时间">{dayjs(selectedReport.generatedAt).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
            <Descriptions.Item label="审核人">张伟</Descriptions.Item>
            <Descriptions.Item label="审核状态"><Tag color="green">已审核</Tag></Descriptions.Item>
          </Descriptions>
        </Card>
      </div>
    </div>
  );
}
