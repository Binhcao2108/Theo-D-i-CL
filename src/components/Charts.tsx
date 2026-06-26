import React, { useRef } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LabelList
} from 'recharts';
import { ChartData } from '../types';
import { Download } from 'lucide-react';
import { toPng } from 'html-to-image';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#3b82f6', '#10b981', '#f43f5e', '#84cc16', '#06b6d4'];

const CustomTooltip = ({ active, payload, label, total }: any) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    const percent = total > 0 ? ((value / total) * 100).toFixed(1) + '%' : '';
    return (
      <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-xl">
        <p className="text-slate-800 font-medium mb-1">{label || payload[0].name}</p>
        <p className="text-indigo-600 font-bold">
          Số lượng: {value} {percent ? `(${percent})` : ''}
        </p>
      </div>
    );
  }
  return null;
};

const handleDownload = async (ref: React.RefObject<HTMLDivElement>, title: string) => {
  if (ref.current) {
    try {
      const url = await toPng(ref.current, {
        backgroundColor: '#ffffff',
        pixelRatio: 2, // High resolution
      });
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to download chart', err);
    }
  }
};

export const CustomBarChart = ({ data, title, dataKey = 'value', nameKey = 'name', layout = 'horizontal', yAxisWidth = 180, onClick, showPercentage = true, activeValues }: { data: ChartData[], title: string, dataKey?: string, nameKey?: string, layout?: 'horizontal' | 'vertical', yAxisWidth?: number, onClick?: (name: string) => void, showPercentage?: boolean, activeValues?: string[] }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const total = data.reduce((sum, item) => sum + (Number(item[dataKey as keyof ChartData]) || 0), 0);

  const labelFormatter = (value: number) => {
    if (!showPercentage || total === 0) return value;
    const percent = ((value / total) * 100).toFixed(1);
    return `${value} (${percent}%)`;
  };

  return (
    <div ref={chartRef} className="w-full h-[420px] bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col relative group">
      <div className="flex items-center justify-between mb-4 px-2">
        <h3 className="text-lg font-medium text-slate-800">{title}</h3>
        <button 
          onClick={(e) => { e.stopPropagation(); handleDownload(chartRef, title); }}
          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
          title="Tải biểu đồ"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout={layout}
            margin={{ top: 15, right: 20, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={layout === 'horizontal'} vertical={layout === 'vertical'} />
            {layout === 'horizontal' ? (
              <XAxis dataKey={nameKey} stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => (val.length > 15 ? val.substring(0, 15) + '...' : val)} />
            ) : (
              <XAxis type="number" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
            )}
            {layout === 'horizontal' ? (
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
            ) : (
              <YAxis dataKey={nameKey} type="category" width={yAxisWidth} stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => (val.length > 25 ? val.substring(0, 25) + '...' : val)} />
            )}
            
            <Tooltip content={<CustomTooltip total={total} />} cursor={{fill: '#f1f5f9', opacity: 0.8}} />
            <Bar 
              dataKey={dataKey} 
              radius={[4, 4, 4, 4]} 
              style={{ cursor: onClick ? 'pointer' : 'default' }}
              onClick={(data: any) => {
                if (onClick) {
                  onClick(data.payload ? data.payload[nameKey] : data[nameKey]);
                }
              }}
            >
              <LabelList dataKey={dataKey} position={layout === 'vertical' ? 'insideRight' : 'insideTop'} fill="#ffffff" fontSize={11} formatter={labelFormatter} />
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]} 
                  opacity={activeValues && activeValues.length > 0 ? (activeValues.includes(entry[nameKey as keyof ChartData] as string) ? 1 : 0.3) : 1}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const CustomPieChart = ({ data, title, onClick }: { data: ChartData[], title: string, onClick?: (name: string) => void }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  
  return (
    <div ref={chartRef} className="w-full h-[420px] bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col relative group">
      <div className="flex items-center justify-between mb-2 px-2">
        <h3 className="text-lg font-medium text-slate-800">{title}</h3>
        <button 
          onClick={(e) => { e.stopPropagation(); handleDownload(chartRef, title); }}
          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
          title="Tải biểu đồ"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              onClick={(data: any) => onClick?.(data.name)}
              style={{ cursor: onClick ? 'pointer' : 'default' }}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              iconType="circle"
              formatter={(value, entry, index) => <span className="text-slate-600 text-xs">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
