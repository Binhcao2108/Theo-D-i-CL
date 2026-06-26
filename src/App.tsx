import React, { useState, useMemo } from 'react';
import { FileUpload } from './components/FileUpload';
import { Dashboard } from './components/Dashboard';
import { parseExcelFile } from './utils/excelParser';
import { TicketRecord } from './types';
import { LayoutDashboard, FileUp, Plus } from 'lucide-react';
import { cn } from './lib/utils';

interface FileData {
  id: string;
  name: string;
  data: TicketRecord[];
}

export default function App() {
  const [filesData, setFilesData] = useState<FileData[]>([]);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFilesSelect = async (files: File[]) => {
    setIsLoading(true);
    setError(null);
    try {
      const newFilesData: FileData[] = [];
      for (const file of files) {
        const result = await parseExcelFile(file);
        const fileName = file.name.replace(/\.[^/.]+$/, "");
        const dataWithSource = result.data.map(item => ({
          ...item,
          sourceFile: fileName
        }));
        newFilesData.push({
          id: file.name + '-' + Date.now(),
          name: fileName,
          data: dataWithSource
        });
      }
      setFilesData(prev => [...prev, ...newFilesData]);
      if (filesData.length === 0 && newFilesData.length === 1) {
        setActiveTab(newFilesData[0].id);
      } else {
        setActiveTab('all');
      }
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi đọc file Excel');
    } finally {
      setIsLoading(false);
    }
  };

  const combinedData = useMemo(() => {
    return filesData.flatMap(f => f.data);
  }, [filesData]);

  const activeData = useMemo(() => {
    if (activeTab === 'all') return combinedData;
    const found = filesData.find(f => f.id === activeTab);
    return found ? found.data : combinedData;
  }, [activeTab, filesData, combinedData]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-500/30">
      <header className="border-b border-slate-200/60 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-500 p-2 rounded-lg shadow-sm shadow-indigo-500/20">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-display font-bold text-slate-900 tracking-tight">
              Phân tích CL
            </h1>
          </div>
          
          {filesData.length > 0 && (
            <div className="flex items-center space-x-3">
              <label className="flex items-center space-x-2 px-3.5 py-2 text-sm font-medium text-slate-600 hover:text-indigo-600 bg-white hover:bg-indigo-50 rounded-lg transition-colors border border-slate-200 shadow-sm cursor-pointer">
                <Plus className="w-4 h-4" />
                <span>Thêm dữ liệu</span>
                <input 
                  type="file" 
                  multiple 
                  className="hidden" 
                  accept=".xlsx, .xls, .csv"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFilesSelect(Array.from(e.target.files));
                    }
                    e.target.value = '';
                  }} 
                />
              </label>
              <button
                onClick={() => { setFilesData([]); setActiveTab('all'); }}
                className="flex items-center space-x-2 px-3.5 py-2 text-sm font-medium text-rose-600 hover:text-rose-700 bg-white hover:bg-rose-50 rounded-lg transition-colors border border-slate-200 shadow-sm"
              >
                <FileUp className="w-4 h-4" />
                <span>Làm mới</span>
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {filesData.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-900 mb-4 tracking-tight text-balance">
                Phân Tích Dữ Liệu Sự Cố
              </h2>
              <p className="text-slate-600 max-w-lg mx-auto text-base md:text-lg">
                Tải lên file Excel báo cáo sự cố để tự động thống kê và phân tích về KTV, tập điểm, block và các nguyên nhân.
              </p>
            </div>
            
            <FileUpload onFilesSelect={handleFilesSelect} isLoading={isLoading} />
            
            {error && (
              <div className="mt-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-sm max-w-2xl w-full text-center flex items-center justify-center shadow-sm">
                <span className="w-5 h-5 mr-2 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                  <span className="w-1 h-1 bg-rose-600 rounded-full"></span>
                </span>
                {error}
              </div>
            )}
          </div>
        )}

        {filesData.length > 0 && (
          <div className="space-y-6">
            {filesData.length > 1 && (
              <div className="flex items-center space-x-1 overflow-x-auto pb-0 border-b border-slate-200/80 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {filesData.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setActiveTab(f.id)}
                    className={cn(
                      "px-5 py-3 text-sm font-display font-medium rounded-t-xl transition-all whitespace-nowrap -mb-px border-b-2",
                      activeTab === f.id
                        ? "text-indigo-600 border-indigo-600 bg-indigo-50/80"
                        : "text-slate-500 hover:text-slate-800 hover:bg-slate-50 border-transparent"
                    )}
                  >
                    {f.name}
                  </button>
                ))}
                <button
                  onClick={() => setActiveTab('all')}
                  className={cn(
                    "px-5 py-3 text-sm font-display font-medium rounded-t-xl transition-all whitespace-nowrap -mb-px border-b-2 ml-2",
                    activeTab === 'all'
                      ? "text-purple-600 border-purple-600 bg-purple-50/80"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-50 border-transparent"
                  )}
                >
                  Tổng hợp ({filesData.length} file)
                </button>
              </div>
            )}
            
            <Dashboard data={activeData} key={activeTab} />
          </div>
        )}
      </main>
    </div>
  );
}
