import React, { useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { Dashboard } from './components/Dashboard';
import { parseExcelFile } from './utils/excelParser';
import { TicketRecord } from './types';
import { LayoutDashboard, FileUp } from 'lucide-react';

export default function App() {
  const [data, setData] = useState<TicketRecord[] | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await parseExcelFile(file);
      setData(result.data);
      setHeaders(result.headers);
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi đọc file Excel');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-500/30">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-50 p-2 rounded-lg">
              <LayoutDashboard className="w-6 h-6 text-indigo-600" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              Phân tích CL
            </h1>
          </div>
          
          {data && (
            <button
              onClick={() => setData(null)}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 rounded-lg transition-colors border border-slate-200 shadow-sm"
            >
              <FileUp className="w-4 h-4" />
              <span>Tải file khác</span>
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!data && (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">
                Phân Tích Dữ Liệu Sự Cố
              </h2>
              <p className="text-slate-600 max-w-lg mx-auto">
                Tải lên file Excel báo cáo sự cố để xem thống kê về KTV, tập điểm, và phân bổ các nguyên nhân lỗi tự động.
              </p>
            </div>
            
            <FileUpload onFileSelect={handleFileSelect} isLoading={isLoading} />
            
            {error && (
              <div className="mt-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-sm max-w-2xl w-full text-center">
                {error}
              </div>
            )}
          </div>
        )}

        {data && (
          <Dashboard data={data} headers={headers} />
        )}
      </main>
    </div>
  );
}
