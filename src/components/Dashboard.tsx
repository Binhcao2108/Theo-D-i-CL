import React, { useMemo, useState, useRef } from 'react';
import { TicketRecord, ChartData } from '../types';
import { CustomBarChart } from './Charts';
import { Users, AlertTriangle, Activity, Database, Filter, Check, ChevronDown, Search, Download, FileSpreadsheet, Image as ImageIcon } from 'lucide-react';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';

interface DashboardProps {
  data: TicketRecord[];
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

const MultiSelect = ({ label, options, selected, onChange, onClear }: { label: string, options: ChartData[], selected: string[], onChange: (val: string) => void, onClear: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options;
    return options.filter(opt => opt.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [options, searchTerm]);

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
        <div className="absolute top-[60px] left-0 w-full min-w-[200px] bg-white border border-slate-200 rounded-lg shadow-xl z-50 flex flex-col p-1 max-h-72">
          <div className="p-1 pb-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-2 top-2" />
              <input
                type="text"
                className="w-full pl-8 pr-2 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Tìm kiếm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          
          <div className="overflow-y-auto flex-1">
            <div 
              className="px-2 py-2 hover:bg-slate-50 rounded-md cursor-pointer text-sm flex items-center text-slate-600 mb-1"
              onClick={() => {
                onClear();
                setSearchTerm("");
                setIsOpen(false);
              }}
            >
              <div className="w-4 h-4 mr-2 border border-slate-300 rounded-sm flex items-center justify-center flex-shrink-0">
                {selected.length === 0 && <Check className="w-3 h-3 text-indigo-600" />}
              </div>
              <span className={selected.length === 0 ? 'font-medium text-indigo-600' : ''}>Tất cả</span>
            </div>
            <div className="h-px bg-slate-100 my-1"></div>
            {filteredOptions.length > 0 ? filteredOptions.map(opt => {
              const isSelected = selected.includes(opt.name);
              return (
                <div 
                  key={opt.name}
                  className={`px-2 py-2 hover:bg-slate-50 rounded-md cursor-pointer text-sm flex items-center justify-between ${isSelected ? 'bg-indigo-50/50' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(opt.name);
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
            }) : (
              <div className="px-2 py-4 text-center text-xs text-slate-500">
                Không tìm thấy kết quả
              </div>
            )}
          </div>
        </div>
      )}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
};

export function Dashboard({ data }: DashboardProps) {
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
      if (current.includes(value)) {
        return { ...prev, [field]: current.filter(v => v !== value) };
      } else {
        return { ...prev, [field]: [...current, value] };
      }
    });
  };

  const getUniqueValuesWithCount = (key: keyof TicketRecord) => {
    return countFrequencies(data, key);
  };

  const {
    filteredData,
    filterOptions,
    topKTVs,
    topPOPs,
    topBlocks,
    inputStatuses,
    treatmentDirections,
    errorElements,
    errorCauses,
    uniqueKTVs,
    uniquePOPs
  } = useMemo(() => {
    // Pre-convert arrays to Sets for O(1) lookups
    const filterSets = {
      technician: new Set(filters.technician),
      pop: new Set(filters.pop),
      block: new Set(filters.block),
      inputStatus: new Set(filters.inputStatus),
      treatmentDirection: new Set(filters.treatmentDirection),
      errorElement: new Set(filters.errorElement),
      errorCause: new Set(filters.errorCause)
    };

    const counts = {
      technician: {} as Record<string, number>,
      pop: {} as Record<string, number>,
      block: {} as Record<string, number>,
      inputStatus: {} as Record<string, number>,
      treatmentDirection: {} as Record<string, number>,
      errorElement: {} as Record<string, number>,
      errorCause: {} as Record<string, number>,
    };

    const resultFilteredData = [];

    for (let i = 0; i < data.length; i++) {
      const item = data[i];

      const matchT = filterSets.technician.size === 0 || filterSets.technician.has(item.technician);
      const matchP = filterSets.pop.size === 0 || filterSets.pop.has(item.pop);
      const matchB = filterSets.block.size === 0 || filterSets.block.has(item.block);
      const matchI = filterSets.inputStatus.size === 0 || filterSets.inputStatus.has(item.inputStatus);
      const matchD = filterSets.treatmentDirection.size === 0 || filterSets.treatmentDirection.has(item.treatmentDirection);
      const matchE = filterSets.errorElement.size === 0 || filterSets.errorElement.has(item.errorElement);
      const matchC = filterSets.errorCause.size === 0 || filterSets.errorCause.has(item.errorCause);

      if (matchT && matchP && matchB && matchI && matchD && matchE && matchC) {
        resultFilteredData.push(item);
      }

      const countIfValid = (field: keyof typeof counts, val: any) => {
        if (val && val !== 'N/A' && val.toString().trim() !== '') {
          counts[field][val] = (counts[field][val] || 0) + 1;
        }
      };

      if (matchP && matchB && matchI && matchD && matchE && matchC) countIfValid('technician', item.technician);
      if (matchT && matchB && matchI && matchD && matchE && matchC) countIfValid('pop', item.pop);
      if (matchT && matchP && matchI && matchD && matchE && matchC) countIfValid('block', item.block);
      if (matchT && matchP && matchB && matchD && matchE && matchC) countIfValid('inputStatus', item.inputStatus);
      if (matchT && matchP && matchB && matchI && matchE && matchC) countIfValid('treatmentDirection', item.treatmentDirection);
      if (matchT && matchP && matchB && matchI && matchD && matchC) countIfValid('errorElement', item.errorElement);
      if (matchT && matchP && matchB && matchI && matchD && matchE) countIfValid('errorCause', item.errorCause);
    }

    const sortAndFormat = (obj: Record<string, number>) => Object.entries(obj).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

    const technicianOptions = sortAndFormat(counts.technician);
    const popOptions = sortAndFormat(counts.pop);
    const blockOptions = sortAndFormat(counts.block);
    const inputStatusOptions = sortAndFormat(counts.inputStatus);
    const treatmentDirectionOptions = sortAndFormat(counts.treatmentDirection);
    const errorElementOptions = sortAndFormat(counts.errorElement);
    const errorCauseOptions = sortAndFormat(counts.errorCause);

    return {
      filteredData: resultFilteredData,
      filterOptions: {
        technician: technicianOptions,
        pop: popOptions,
        block: blockOptions,
        inputStatus: inputStatusOptions,
        treatmentDirection: treatmentDirectionOptions,
        errorElement: errorElementOptions,
        errorCause: errorCauseOptions,
      },
      topKTVs: technicianOptions.slice(0, 15),
      topPOPs: popOptions.slice(0, 15),
      topBlocks: blockOptions.slice(0, 15),
      inputStatuses: inputStatusOptions.slice(0, 15),
      treatmentDirections: treatmentDirectionOptions.slice(0, 15),
      errorElements: errorElementOptions.slice(0, 15),
      errorCauses: errorCauseOptions.slice(0, 15),
      uniqueKTVs: Object.keys(counts.technician).length,
      uniquePOPs: Object.keys(counts.pop).length,
    };
  }, [data, filters]);

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

  const tableContainerRef = useRef<HTMLDivElement>(null);

  const handleDownloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredData.map(row => ({
      "Số Hợp Đồng": row.contractId,
      "KTV": row.technician,
      "Tập Điểm (POP)": row.pop,
      "Block": row.block,
      "(Cấp 1)Tình trạng đầu vào": row.inputStatus,
      "(Cấp 1)Phần tử lỗi": row.errorElement,
      "(Cấp 1)Nguyên nhân lỗi": row.errorCause,
      "Hướng xử lý": row.treatmentDirection
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
    XLSX.writeFile(workbook, "Bao_Cao_Chi_Tiet.xlsx");
  };

  const handleDownloadImage = async () => {
    if (tableContainerRef.current) {
      try {
        const canvas = await html2canvas(tableContainerRef.current, {
          backgroundColor: '#ffffff',
          scale: 2,
        });
        const url = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = url;
        a.download = `Bao_Cao_Chi_Tiet.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch (err) {
        console.error('Failed to download chart', err);
      }
    }
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
          <MultiSelect label="KTV" options={filterOptions.technician} selected={filters.technician} onChange={(val) => handleChartClick('technician', val)} onClear={() => setFilters(prev => ({...prev, technician: []}))} />
          <MultiSelect label="Tập Điểm (POP)" options={filterOptions.pop} selected={filters.pop} onChange={(val) => handleChartClick('pop', val)} onClear={() => setFilters(prev => ({...prev, pop: []}))} />
          <MultiSelect label="Block Quản Lý" options={filterOptions.block} selected={filters.block} onChange={(val) => handleChartClick('block', val)} onClear={() => setFilters(prev => ({...prev, block: []}))} />
          <MultiSelect label="(Cấp 1)Tình trạng đầu vào" options={filterOptions.inputStatus} selected={filters.inputStatus} onChange={(val) => handleChartClick('inputStatus', val)} onClear={() => setFilters(prev => ({...prev, inputStatus: []}))} />
          <MultiSelect label="(Cấp 1)Phần tử lỗi" options={filterOptions.errorElement} selected={filters.errorElement} onChange={(val) => handleChartClick('errorElement', val)} onClear={() => setFilters(prev => ({...prev, errorElement: []}))} />
          <MultiSelect label="(Cấp 1)Nguyên nhân lỗi" options={filterOptions.errorCause} selected={filters.errorCause} onChange={(val) => handleChartClick('errorCause', val)} onClear={() => setFilters(prev => ({...prev, errorCause: []}))} />
          <MultiSelect label="(Cấp 1)Hướng xử lý" options={filterOptions.treatmentDirection} selected={filters.treatmentDirection} onChange={(val) => handleChartClick('treatmentDirection', val)} onClear={() => setFilters(prev => ({...prev, treatmentDirection: []}))} />
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
          activeValues={filters.technician}
        />
        <CustomBarChart 
          data={topPOPs} 
          title="Top 15 Tập điểm (POP) nhiều sự cố nhất" 
          layout="vertical"
          onClick={(val) => handleChartClick('pop', val)}
          activeValues={filters.pop}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
        <CustomBarChart 
          data={topBlocks} 
          title="Top 15 Block quản lý" 
          layout="vertical"
          onClick={(val) => handleChartClick('block', val)}
          activeValues={filters.block}
        />
        <CustomBarChart 
          data={inputStatuses} 
          title="(Cấp 1)Tình trạng đầu vào" 
          layout="vertical"
          onClick={(val) => handleChartClick('inputStatus', val)}
          activeValues={filters.inputStatus}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
        <CustomBarChart 
          data={errorElements} 
          title="Phần tử lỗi phổ biến" 
          layout="vertical"
          onClick={(val) => handleChartClick('errorElement', val)}
          activeValues={filters.errorElement}
        />
        <CustomBarChart 
          data={errorCauses} 
          title="Nguyên nhân lỗi" 
          layout="vertical"
          onClick={(val) => handleChartClick('errorCause', val)}
          activeValues={filters.errorCause}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
        <CustomBarChart 
          data={treatmentDirections} 
          title="Hướng xử lý" 
          layout="vertical"
          onClick={(val) => handleChartClick('treatmentDirection', val)}
          activeValues={filters.treatmentDirection}
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
          <div className="flex items-center space-x-2">
            <button 
              onClick={handleDownloadExcel}
              className="px-3 py-1.5 flex items-center text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-colors"
              title="Tải Excel"
            >
              <FileSpreadsheet className="w-4 h-4 mr-1.5" />
              Excel
            </button>
            <button 
              onClick={handleDownloadImage}
              className="px-3 py-1.5 flex items-center text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors"
              title="Tải Hình Ảnh"
            >
              <ImageIcon className="w-4 h-4 mr-1.5" />
              Ảnh
            </button>
            {Object.values(filters).some((arr: any) => arr.length > 0) && (
              <button 
                onClick={() => setFilters({technician: [], pop: [], block: [], inputStatus: [], treatmentDirection: [], errorElement: [], errorCause: []})}
                className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        </div>
        <div ref={tableContainerRef} className="overflow-auto flex-1 relative bg-white">
          <table className="w-full text-left text-sm text-slate-600 border-collapse whitespace-nowrap">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 sticky top-0 z-10 shadow-sm backdrop-blur-md">
              <tr>
                <th className="px-6 py-3 border-b border-slate-200 font-semibold">Số Hợp Đồng</th>
                <th className="px-6 py-3 border-b border-slate-200 font-semibold">KTV</th>
                <th className="px-6 py-3 border-b border-slate-200 font-semibold">Tập Điểm (POP)</th>
                <th className="px-6 py-3 border-b border-slate-200 font-semibold">Block</th>
                <th className="px-6 py-3 border-b border-slate-200 font-semibold">(Cấp 1)Tình trạng đầu vào</th>
                <th className="px-6 py-3 border-b border-slate-200 font-semibold">(Cấp 1)Phần tử lỗi</th>
                <th className="px-6 py-3 border-b border-slate-200 font-semibold">(Cấp 1)Nguyên nhân lỗi</th>
                <th className="px-6 py-3 border-b border-slate-200 font-semibold">Hướng xử lý</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? filteredData.map((row, i) => (
                <tr key={i} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">{row.contractId}</td>
                  <td className="px-6 py-4">{row.technician}</td>
                  <td className="px-6 py-4">{row.pop}</td>
                  <td className="px-6 py-4">{row.block}</td>
                  <td className="px-6 py-4">{row.inputStatus}</td>
                  <td className="px-6 py-4">{row.errorElement}</td>
                  <td className="px-6 py-4">{row.errorCause}</td>
                  <td className="px-6 py-4">{row.treatmentDirection}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
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
