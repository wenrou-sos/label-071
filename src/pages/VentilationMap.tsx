import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, Modal, Descriptions, Tag, Space, Button, Tooltip } from 'antd';
import {
  ZoomInOutlined,
  ZoomOutOutlined,
  FullscreenOutlined,
  InfoCircleOutlined,
  DeploymentUnitOutlined,
} from '@ant-design/icons';
import { tunnels, ventilationStructures as structures } from '@/mock/tunnelData';
import { STRUCTURE_LABELS, type StructureType, type Tunnel, type VentilationStructure } from '@/types';

const CANVAS_H = 700;
const INTAKE_COLOR = '#00E5FF';
const INTAKE_DIM = '#00838F';
const RETURN_COLOR = '#FF9800';
const RETURN_DIM = '#E65100';
const NODE_COLOR = '#90CAF9';
const HIT_RADIUS = 22;

const STRUCTURE_STYLE: Record<
  StructureType,
  { color: string; shape: 'circle' | 'diamond' | 'square' | 'triangle'; label: string; glow: string }
> = {
  air_door: { color: '#4CAF50', shape: 'circle', label: '门', glow: '#81C784' },
  air_window: { color: '#2196F3', shape: 'diamond', label: '窗', glow: '#64B5F6' },
  air_wall: { color: '#F44336', shape: 'square', label: '墙', glow: '#E57373' },
  air_bridge: { color: '#9C27B0', shape: 'triangle', label: '桥', glow: '#BA68C8' },
};

function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#060E1A');
  g.addColorStop(0.5, '#0A1628');
  g.addColorStop(1, '#0D1F3C');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = 'rgba(33, 150, 243, 0.04)';
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  for (let y = 0; y < h; y += 40) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }
}

function drawTunnel(ctx: CanvasRenderingContext2D, t: Tunnel, highlight: boolean) {
  const isReturn = t.direction === 'out';
  const color = isReturn ? RETURN_COLOR : INTAKE_COLOR;
  const dimColor = isReturn ? RETURN_DIM : INTAKE_DIM;

  ctx.save();
  if (highlight) {
    ctx.shadowColor = color;
    ctx.shadowBlur = 20;
    ctx.strokeStyle = color;
    ctx.lineWidth = 8;
  } else {
    ctx.shadowColor = dimColor;
    ctx.shadowBlur = 6;
    ctx.strokeStyle = dimColor;
    ctx.lineWidth = 4;
  }

  const grad = ctx.createLinearGradient(t.startX, t.startY, t.endX, t.endY);
  grad.addColorStop(0, highlight ? color : dimColor);
  grad.addColorStop(1, color);
  ctx.strokeStyle = grad;

  ctx.beginPath();
  ctx.moveTo(t.startX, t.startY);
  ctx.lineTo(t.endX, t.endY);
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.strokeStyle = highlight ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(t.startX, t.startY);
  ctx.lineTo(t.endX, t.endY);
  ctx.stroke();
  ctx.restore();

  const mx = (t.startX + t.endX) / 2;
  const my = (t.startY + t.endY) / 2;
  const angle = Math.atan2(t.endY - t.startY, t.endX - t.startX);
  const size = highlight ? 12 : 10;

  ctx.save();
  ctx.translate(mx, my);
  ctx.rotate(angle);
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.moveTo(size, 0);
  ctx.lineTo(-size, -size * 0.65);
  ctx.lineTo(-size * 0.4, 0);
  ctx.lineTo(-size, size * 0.65);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.font = 'bold 11px "Noto Sans SC", sans-serif';
  ctx.textAlign = 'center';
  const off = highlight ? 16 : 14;
  const nx = -Math.sin(angle) * off;
  const ny = Math.cos(angle) * off;

  const bgW = 130;
  const bgH1 = 16;
  const bgH2 = 16;

  ctx.fillStyle = 'rgba(10, 22, 40, 0.8)';
  ctx.beginPath();
  const rx = mx + nx - bgW / 2;
  const ry1 = my + ny - 8;
  ctx.roundRect(rx, ry1, bgW, bgH1 + bgH2 + 4, 3);
  ctx.fill();
  ctx.strokeStyle = 'rgba(100, 181, 246, 0.3)';
  ctx.lineWidth = 0.5;
  ctx.stroke();

  ctx.fillStyle = isReturn ? '#FFB74D' : '#4DD0E1';
  ctx.font = 'bold 11px "JetBrains Mono", monospace';
  ctx.fillText(`${t.airVolume} m³/s`, mx + nx, my + ny + 4);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = '10px "JetBrains Mono", monospace';
  ctx.fillText(`${t.airPressure} Pa`, mx + nx, my + ny + 18);
  ctx.restore();
}

function drawStructure(ctx: CanvasRenderingContext2D, s: VentilationStructure, highlight: boolean) {
  const style = STRUCTURE_STYLE[s.type];
  const { x, y } = s.position;
  const r = highlight ? 18 : 13;

  ctx.save();
  if (highlight) {
    ctx.shadowColor = style.glow;
    ctx.shadowBlur = 18;
  } else {
    ctx.shadowColor = style.color;
    ctx.shadowBlur = 6;
  }
  ctx.fillStyle = style.color;
  ctx.strokeStyle = highlight ? '#fff' : 'rgba(255,255,255,0.6)';
  ctx.lineWidth = highlight ? 2.5 : 1.5;

  switch (style.shape) {
    case 'circle':
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
    case 'diamond':
      ctx.beginPath();
      ctx.moveTo(x, y - r);
      ctx.lineTo(x + r, y);
      ctx.lineTo(x, y + r);
      ctx.lineTo(x - r, y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    case 'square':
      ctx.beginPath();
      ctx.roundRect(x - r, y - r, r * 2, r * 2, 3);
      ctx.fill();
      ctx.stroke();
      break;
    case 'triangle':
      ctx.beginPath();
      ctx.moveTo(x, y - r);
      ctx.lineTo(x + r, y + r);
      ctx.lineTo(x - r, y + r);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
  }

  ctx.fillStyle = '#fff';
  ctx.font = `bold ${highlight ? 12 : 10}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowBlur = 0;
  ctx.fillText(style.label, x, y);

  if (s.status === 'abnormal') {
    ctx.strokeStyle = '#ff4d4f';
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.arc(x, y, r + 5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();
}

function drawNodes(ctx: CanvasRenderingContext2D, ts: Tunnel[]) {
  const nodeMap = new Map<string, { x: number; y: number }>();
  ts.forEach((t) => {
    nodeMap.set(t.startNode, { x: t.startX, y: t.startY });
    nodeMap.set(t.endNode, { x: t.endX, y: t.endY });
  });
  ctx.save();
  nodeMap.forEach((pos, name) => {
    ctx.shadowColor = NODE_COLOR;
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#0D2137';
    ctx.strokeStyle = NODE_COLOR;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#B0BEC5';
    ctx.font = 'bold 10px "Noto Sans SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(name, pos.x, pos.y - 14);
  });
  ctx.restore();
}

function drawLegend(ctx: CanvasRenderingContext2D) {
  const x0 = 14;
  let y0 = 16;
  const boxW = 140;
  const boxH = 178;

  ctx.save();
  ctx.fillStyle = 'rgba(10, 22, 40, 0.85)';
  ctx.strokeStyle = 'rgba(100, 181, 246, 0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x0 - 6, y0 - 14, boxW, boxH, 6);
  ctx.fill();
  ctx.stroke();

  ctx.font = 'bold 12px "Noto Sans SC", sans-serif';
  ctx.fillStyle = '#B0BEC5';
  ctx.fillText('图例', x0 + boxW / 2 - 12, y0);
  y0 += 20;

  ctx.fillStyle = INTAKE_COLOR;
  ctx.fillRect(x0, y0, 22, 4);
  y0 += 8;
  ctx.fillStyle = '#B0BEC5';
  ctx.font = '11px "Noto Sans SC", sans-serif';
  ctx.fillText('进风巷', x0 + 28, y0 + 1);
  y0 += 20;

  ctx.fillStyle = RETURN_COLOR;
  ctx.fillRect(x0, y0, 22, 4);
  y0 += 8;
  ctx.fillStyle = '#B0BEC5';
  ctx.fillText('回风巷', x0 + 28, y0 + 1);
  y0 += 24;

  const types: StructureType[] = ['air_door', 'air_window', 'air_wall', 'air_bridge'];
  types.forEach((type) => {
    const st = STRUCTURE_STYLE[type];
    ctx.fillStyle = st.color;
    ctx.beginPath();
    ctx.arc(x0 + 10, y0, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(st.label, x0 + 10, y0);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#B0BEC5';
    ctx.font = '11px "Noto Sans SC", sans-serif';
    ctx.fillText(STRUCTURE_LABELS[type], x0 + 28, y0 + 4);
    y0 += 22;
  });
  ctx.restore();
}

function drawTitle(ctx: CanvasRenderingContext2D, w: number) {
  ctx.save();
  ctx.fillStyle = 'rgba(10, 22, 40, 0.7)';
  ctx.beginPath();
  ctx.roundRect(w / 2 - 120, 8, 240, 32, 6);
  ctx.fill();
  ctx.fillStyle = '#E3F2FD';
  ctx.font = 'bold 14px "Noto Sans SC", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('矿井通风系统网络图', w / 2, 30);
  ctx.restore();
}

type HitTarget =
  | { kind: 'tunnel'; data: Tunnel }
  | { kind: 'structure'; data: VentilationStructure }
  | null;

function hitTest(mx: number, my: number, ts: Tunnel[], ss: VentilationStructure[]): HitTarget {
  for (const s of ss) {
    const dx = mx - s.position.x;
    const dy = my - s.position.y;
    if (dx * dx + dy * dy < HIT_RADIUS * HIT_RADIUS) return { kind: 'structure', data: s };
  }
  for (const t of ts) {
    const midX = (t.startX + t.endX) / 2;
    const midY = (t.startY + t.endY) / 2;
    const dx = mx - midX;
    const dy = my - midY;
    if (dx * dx + dy * dy < HIT_RADIUS * HIT_RADIUS) return { kind: 'tunnel', data: t };
  }
  return null;
}

export default function VentilationMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState<HitTarget>(null);
  const [selected, setSelected] = useState<HitTarget>(null);
  const [canvasW, setCanvasW] = useState(1200);
  const [tooltipInfo, setTooltipInfo] = useState<{ x: number; y: number; text: string } | null>(null);
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const dragMoved = useRef(false);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvasW, CANVAS_H);
    drawBackground(ctx, canvasW, CANVAS_H);
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);
    tunnels.forEach((t) => drawTunnel(ctx, t, hovered?.kind === 'tunnel' && hovered.data.id === t.id));
    drawNodes(ctx, tunnels);
    structures.forEach((s) => drawStructure(ctx, s, hovered?.kind === 'structure' && hovered.data.id === s.id));
    ctx.restore();
    drawLegend(ctx);
    drawTitle(ctx, canvasW);
  }, [zoom, pan, hovered, canvasW]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setCanvasW(entry.contentRect.width);
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => { draw(); }, [draw]);

  const screenToWorld = useCallback(
    (sx: number, sy: number) => ({ x: (sx - pan.x) / zoom, y: (sy - pan.y) / zoom }),
    [zoom, pan],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = canvasRef.current!.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      if (dragging.current) {
        dragMoved.current = true;
        setPan((p) => ({ x: p.x + e.clientX - lastPos.current.x, y: p.y + e.clientY - lastPos.current.y }));
        lastPos.current = { x: e.clientX, y: e.clientY };
        return;
      }
      const world = screenToWorld(sx, sy);
      const hit = hitTest(world.x, world.y, tunnels, structures);
      setHovered(hit);
      if (hit) {
        const text = hit.kind === 'tunnel'
          ? `${hit.data.name} | 风量: ${hit.data.airVolume} m³/s | 风压: ${hit.data.airPressure} Pa`
          : `${hit.data.name} (${STRUCTURE_LABELS[hit.data.type]})`;
        setTooltipInfo({ x: e.clientX, y: e.clientY, text });
      } else {
        setTooltipInfo(null);
      }
    },
    [screenToWorld],
  );

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    dragging.current = true;
    dragMoved.current = false;
    lastPos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseUp = useCallback(() => { dragging.current = false; }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (dragMoved.current) return;
      const rect = canvasRef.current!.getBoundingClientRect();
      const world = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
      const hit = hitTest(world.x, world.y, tunnels, structures);
      if (hit) setSelected(hit);
    },
    [screenToWorld],
  );

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom((z) => Math.min(Math.max(z * factor, 0.3), 5));
    setPan((p) => ({ x: mx - (mx - p.x) * factor, y: my - (my - p.y) * factor }));
  }, []);

  const zoomBy = useCallback((factor: number) => {
    setZoom((z) => Math.min(Math.max(z * factor, 0.3), 5));
  }, []);

  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  return (
    <Card
      title={
        <span style={{ fontSize: 16, fontWeight: 600 }}>
          <DeploymentUnitOutlined style={{ marginRight: 8, color: '#144272' }} />
          通风系统网络图
        </span>
      }
      style={{ borderRadius: 10, overflow: 'hidden' }}
      extra={
        <Space>
          <Tooltip title="放大"><Button icon={<ZoomInOutlined />} onClick={() => zoomBy(1.2)} /></Tooltip>
          <Tooltip title="缩小"><Button icon={<ZoomOutOutlined />} onClick={() => zoomBy(0.8)} /></Tooltip>
          <Tooltip title="重置视图"><Button icon={<FullscreenOutlined />} onClick={resetView}>重置</Button></Tooltip>
        </Space>
      }
    >
      <div
        ref={containerRef}
        style={{
          width: '100%',
          overflow: 'hidden',
          borderRadius: 8,
          position: 'relative',
        }}
      >
        <canvas
          ref={canvasRef}
          width={canvasW}
          height={CANVAS_H}
          style={{ cursor: hovered ? 'pointer' : dragging.current ? 'grabbing' : 'grab' }}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => { handleMouseUp(); setTooltipInfo(null); }}
          onClick={handleClick}
          onWheel={handleWheel}
        />
        {tooltipInfo && (
          <div
            style={{
              position: 'fixed',
              left: tooltipInfo.x + 12,
              top: tooltipInfo.y - 30,
              background: 'rgba(10, 22, 40, 0.92)',
              color: '#E3F2FD',
              padding: '4px 10px',
              borderRadius: 4,
              fontSize: 12,
              pointerEvents: 'none',
              zIndex: 1000,
              border: '1px solid rgba(100, 181, 246, 0.3)',
              whiteSpace: 'nowrap',
            }}
          >
            {tooltipInfo.text}
          </div>
        )}
      </div>
      <Modal
        open={!!selected}
        title={
          <span>
            <InfoCircleOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            {selected?.kind === 'tunnel' ? '巷道详情' : '通风设施详情'}
          </span>
        }
        onCancel={() => setSelected(null)}
        footer={null}
        width={520}
      >
        {selected?.kind === 'tunnel' && (
          <Descriptions column={2} size="small" bordered>
            <Descriptions.Item label="名称">{selected.data.name}</Descriptions.Item>
            <Descriptions.Item label="编号">{selected.data.id}</Descriptions.Item>
            <Descriptions.Item label="长度">{selected.data.length} m</Descriptions.Item>
            <Descriptions.Item label="断面积">{selected.data.crossSection} m²</Descriptions.Item>
            <Descriptions.Item label="支护方式">{selected.data.supportType}</Descriptions.Item>
            <Descriptions.Item label="风向">
              <Tag color={selected.data.direction === 'in' ? 'cyan' : 'orange'}>
                {selected.data.direction === 'in' ? '进风' : '回风'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="风量">
              <span style={{ fontWeight: 700, color: '#1890ff' }}>{selected.data.airVolume} m³/s</span>
            </Descriptions.Item>
            <Descriptions.Item label="风压">
              <span style={{ fontWeight: 700, color: '#fa8c16' }}>{selected.data.airPressure} Pa</span>
            </Descriptions.Item>
          </Descriptions>
        )}
        {selected?.kind === 'structure' && (
          <Descriptions column={2} size="small" bordered>
            <Descriptions.Item label="名称">{selected.data.name}</Descriptions.Item>
            <Descriptions.Item label="类型">
              <Tag color={
                selected.data.type === 'air_door' ? 'green' :
                selected.data.type === 'air_window' ? 'blue' :
                selected.data.type === 'air_wall' ? 'red' : 'purple'
              }>
                {STRUCTURE_LABELS[selected.data.type]}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={selected.data.status === 'normal' ? 'green' : 'red'}>
                {selected.data.status === 'normal' ? '正常' : '异常'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="安装日期">{selected.data.installDate}</Descriptions.Item>
            <Descriptions.Item label="所属巷道">{selected.data.tunnelId}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </Card>
  );
}
