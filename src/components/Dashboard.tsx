import React, { useMemo, useState } from 'react';
import { TicketRecord, ChartData } from '../types';
import { CustomBarChart } from './Charts';
import { Users, AlertTriangle, Activity, Database, Filter, Check, ChevronDown } from 'lucide-react';

interface DashboardProps {
  data: TicketRecord[];
  headers: string[];
}

const countFrequencies = (data: any[], key: keyof TicketRecord): ChartData[] => {
  const counts: Record<string, number> = {};
  data.forEach(item => {
    const val = item[key];
    if (val && val !== 'N/A' && val.toString().trim() !== '') {
      counts[val] = (counts[val] || 0) + 1;
    }
  });
  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
};

export function Dashboard({ data, headers }: DashboardProps) {
  const [filters, setFilters] = useState<Record<string, string[]>>({
    technician: [],
    pop: [],
    block: [],
    inputStatus: [],
    treatmentDirection: [],
    errorElement: [],
    errorCause: []
  });

  const handleChartClick = (field: keyof typeof filters, value: string) => {
    setFilters(prev => {
      const current = prev[field] || [];
      if (current.length === 1 && current[0] === value) {
        return { ...prev, [field]: [] };
      } else {
        return { ...prev, [field]: [value] };
      }
    });
  };

  const getUniqueValuesWithCount = (key: keyof TicketRecord) => {
    return countFrequencies(data, key);
  };

  const filterOptions = useMemo(() => ({
    technician: getUniqueValuesWithCount('technician'),
    pop: getUniqueValuesWithCount('pop'),
    block: getUniqueValuesWithCount('block'),
    inputStatus: getUniqueValuesWithCount('inputStatus'),
    treatmentDirection: getUniqueValuesWithCount('treatmentDirection'),
    errorElement: getUniqueValuesWithCount('errorElement'),
    errorCause: getUniqueValuesWithCount('errorCause')
  }), [data]);

  const getFilteredDataExcept = (excludeField: keyof typeof filters) => {
    return data.filter(item => {
      return (
        (excludeField === 'technician' || filters.technician.length === 0 || filters.technician.includes(item.technician)) &&
        (excludeField === 'pop' || filters.pop.length === 0 || filters.pop.includes(item.pop)) &&
        (excludeField === 'block' || filters.block?.length === 0 || filters.block?.includes(item.block)) &&
        (excludeField === 'inputStatus' || filters.inputStatus?.length === 0 || filters.inputStatus?.includes(item.inputStatus)) &&
        (excludeField === 'treatmentDirection' || filters.treatmentDirection?.length === 0 || filters.treatmentDirection?.includes(item.treatmentDirection)) &&
        (excludeField === 'errorElement' || filters.errorElement.length === 0 || filters.errorElement.includes(item.errorElement)) &&
        (excludeField === 'errorCause' || filters.errorCause.length === 0 || filters.errorCause.includes(item.errorCause))
      );
    });
  };

  const filteredData = useMemo(() => {
    return data.filter(item => {
      return (
        (filters.technician.length === 0 || filters.technician.includes(item.technician)) &&
        (filters.pop.length === 0 || filters.pop.includes(item.pop)) &&
        (filters.block?.length === 0 || filters.block?.includes(item.block)) &&
        (filters.inputStatus?.length === 0 || filters.inputStatus?.includes(item.inputStatus)) &&
        (filters.treatmentDirection?.length === 0 || filters.treatmentDirection?.includes(item.treatmentDirection)) &&
        (filters.errorElement.length === 0 || filters.errorElement.includes(item.errorElement)) &&
        (filters.errorCause.length === 0 || filters.errorCause.includes(item.errorCause))
      );
    });
  }, [data, filters]);

  const topKTVs = useMemo(() => countFrequencies(getFilteredDataExcept('technician'), 'technician').slice(0, 15), [data, filters]);
  const topPOPs = useMemo(() => countFrequencies(getFilteredDataExcept('pop'), 'pop').slice(0, 15), [data, filters]);
  const topBlocks = useMemo(() => countFrequencies(getFilteredDataExcept('block'), 'block').slice(0, 15), [data, filters]);
  const inputStatuses = useMemo(() => countFrequencies(getFilteredDataExcept('inputStatus'), 'inputStatus').slice(0, 15), [data, filters]);
  const treatmentDirections = useMemo(() => countFrequencies(getFilteredDataExcept('treatmentDirection'), 'treatmentDirection').slice(0, 15), [data, filters]);
  const errorElements = useMemo(() => countFrequencies(getFilteredDataExcept('errorElement'), 'errorElement').slice(0, 15), [data, filters]);
  const errorCauses = useMemo(() => countFrequencies(getFilteredDataExcept('errorCause'), 'errorCause').slice(0, 15), [data, filters]);

  const uniqueKTVs = useMemo(() => new Set(filteredData.map(d => d.technician).filter(v => v !== 'N/A')).size, [filteredData]);
  const uniquePOPs = useMemo(() => new Set(filteredData.map(d => d.pop).filter(v => v !== 'N/A')).size, [filteredData]);

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white border border-slate-200 rounded-xl p-6 flex items-center space-x-4 shadow-sm">
      <div className={`p-3 rounded-lg bg-${color}-50 text-${color}-600`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );

  const MultiSelect = ({ label, field, options }: { label: string, field: keyof typeof filters, options: ChartData[] }) => {
    const [isOpen, setIsOpen] = useState(false);
    const selected = filters[field];

    const toggleOption = (val: string) => {
      setFilters(prev => {
        const current = prev[field];
        if (current.includes(val)) {
          return { ...prev, [field]: current.filter(x => x !== val) };
        } else {
          return { ...prev, [field]: [...current, val] };
        }
      });
    };

    return (
      <div className="flex flex-col space-y-1 relative">
        <label className="text-xs font-medium text-slate-500">{label}</label>
        <div 
          onClick={() => setIsOpen(!isOpen)}
          className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 flex items-center justify-between cursor-pointer hover:border-indigo-400 transition-colors"
        >
          <span className="truncate pr-2">
            {selected.length === 0 ? 'Tất cả' : `${selected.length} đã chọn`}
          </span>
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </div>
        
        {isOpen && (
          <div className="absolute top-[60px] left-0 w-full min-w-[200px] bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto p-1">
            <div 
              className="px-2 py-2 hover:bg-slate-50 rounded-md cursor-pointer text-sm flex items-center text-slate-600 mb-1"
              onClick={() => {
                setFilters(prev => ({ ...prev, [field]: [] }));
                setIsOpen(false);
              }}
            >
              <div className="w-4 h-4 mr-2 border border-slate-300 rounded-sm flex items-center justify-center flex-shrink-0">
                {selected.length === 0 && <Check className="w-3 h-3 text-indigo-600" />}
              </div>
              <span className={selected.length === 0 ? 'font-medium text-indigo-600' : ''}>Tất cả</span>
            </div>
            <div className="h-px bg-slate-100 my-1"></div>
            {options.map(opt => {
              const isSelected = selected.includes(opt.name);
              return (
                <div 
                  key={opt.name}
                  className={`px-2 py-2 hover:bg-slate-50 rounded-md cursor-pointer text-sm flex items-center justify-between ${isSelected ? 'bg-indigo-50/50' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleOption(opt.name);
                  }}
                >
                  <div className="flex items-center overflow-hidden pr-2">
                    <div className={`w-4 h-4 mr-2 border rounded-sm flex items-center justify-center flex-shrink-0 ${isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-slate-300'}`}>
                       {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="truncate text-slate-700">{opt.name}</span>
                  </div>
                  <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full flex-shrink-0">{opt.value}</span>
                </div>
              );
            })}
          </div>
        )}
        {isOpen && (
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm relative z-20">
        <div className="flex items-center space-x-2 mb-4 text-slate-800">
          <Filter className="w-5 h-5 text-indigo-500" />
          <h3 className="font-medium">Bộ Lọc Dữ Liệu</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MultiSelect label="KTV" field="technician" options={filterOptions.technician} />
          <MultiSelect label="Tập Điểm (POP)" field="pop" options={filterOptions.pop} />
          <MultiSelect label="Block Quản Lý" field="block" options={filterOptions.block} />
          <MultiSelect label="(Cấp 1)Tình trạng đầu vào" field="inputStatus" options={filterOptions.inputStatus} />
          <MultiSelect label="(Cấp 1)Phần tử lỗi" field="errorElement" options={filterOptions.errorElement} />
          <MultiSelect label="(Cấp 1)Nguyên nhân lỗi" field="errorCause" options={filterOptions.errorCause} />
          <MultiSelect label="(Cấp 1)Hướng xử lý" field="treatmentDirection" options={filterOptions.treatmentDirection} />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        <StatCard title="Tổng số sự cố" value={filteredData.length} icon={Database} color="indigo" />
        <StatCard title="Số lượng KTV" value={uniqueKTVs} icon={Users} color="blue" />
        <StatCard title="Số lượng POP" value={uniquePOPs} icon={Activity} color="emerald" />
        <StatCard title="Nguyên nhân lỗi" value={errorCauses.length} icon={AlertTriangle} color="rose" />
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
        <CustomBarChart 
          data={topKTVs} 
          title="Top 15 KTV xử lý nhiều lỗi nhất" 
          layout="vertical"
          onClick={(val) => handleChartClick('technician', val)}
          activeValue={filters.technician.length === 1 ? filters.technician[0] : undefined}
        />
        <CustomBarChart 
          data={topPOPs} 
          title="Top 15 Tập điểm (POP) nhiều sự cố nhất" 
          layout="vertical"
          onClick={(val) => handleChartClick('pop', val)}
          activeValue={filters.pop.length === 1 ? filters.pop[0] : undefined}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
        <CustomBarChart 
          data={topBlocks} 
          title="Top 15 Block quản lý" 
          layout="vertical"
          onClick={(val) => handleChartClick('block', val)}
          activeValue={filters.block?.length === 1 ? filters.block[0] : undefined}
        />
        <CustomBarChart 
          data={inputStatuses} 
          title="(Cấp 1)Tình trạng đầu vào" 
          layout="vertical"
          onClick={(val) => handleChartClick('inputStatus', val)}
          activeValue={filters.inputStatus?.length === 1 ? filters.inputStatus[0] : undefined}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
        <CustomBarChart 
          data={treatmentDirections} 
          title="Hướng xử lý" 
          layout="vertical"
          onClick={(val) => handleChartClick('treatmentDirection', val)}
          activeValue={filters.treatmentDirection?.length === 1 ? filters.treatmentDirection[0] : undefined}
        />
        <CustomBarChart 
          data={errorElements} 
          title="Phần tử lỗi phổ biến" 
          layout="vertical"
          onClick={(val) => handleChartClick('errorElement', val)}
          activeValue={filters.errorElement?.length === 1 ? filters.errorElement[0] : undefined}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
        <CustomBarChart 
          data={errorCauses} 
          title="Nguyên nhân lỗi" 
          layout="vertical"
          onClick={(val) => handleChartClick('errorCause', val)}
          activeValue={filters.errorCause?.length === 1 ? filters.errorCause[0] : undefined}
        />
      </div>

      {/* Detail Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col max-h-[600px] relative z-10">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 sticky top-0 z-10">
          <h3 className="font-medium text-slate-800 flex items-center">
            Chi Tiết Dữ Liệu
            <span className="ml-2 px-2 py-1 bg-indigo-100 text-indigo-700 rounded-md text-sm">
              {filteredData.length} bản ghi
            </span>
          </h3>
          {Object.values(filters).some(arr => arr.length > 0) && (
            <button 
              onClick={() => setFilters({technician: [], pop: [], block: [], inputStatus: [], treatmentDirection: [], errorElement: [], errorCause: []})}
              className="px-3 py-1 text-sm font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
        <div className="overflow-auto flex-1 relative">
          <table className="w-full text-left text-sm text-slate-600 border-collapse whitespace-nowrap">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 sticky top-0 z-10 shadow-sm backdrop-blur-md">
              <tr>
                {headers.map((h, i) => (
                  <th key={i} className="px-6 py-3 border-b border-slate-200 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? filteredData.map((row, i) => (
                <tr key={i} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  {headers.map((h, colIdx) => (
                    <td key={colIdx} className="px-6 py-4">
                      {row.raw[h] !== undefined && row.raw[h] !== null ? String(row.raw[h]) : ''}
                    </td>
                  ))}
                </tr>
              )) : (
                <tr>
                  <td colSpan={headers.length} className="px-6 py-12 text-center text-slate-500">
                    Không có dữ liệu phù hợp với bộ lọc
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
