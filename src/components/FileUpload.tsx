import React, { useCallback, useState } from 'react';
import { UploadCloud, FileSpreadsheet } from 'lucide-react';
import { cn } from '../lib/utils';

interface FileUploadProps {
  onFilesSelect: (files: File[]) => void;
  isLoading?: boolean;
}

export function FileUpload({ onFilesSelect, isLoading }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const validFiles = Array.from(e.dataTransfer.files).filter((file: File) => 
          file.name.match(/\.(xlsx|xls|csv)$/i)
        );
        
        if (validFiles.length > 0) {
          onFilesSelect(validFiles as File[]);
        }
        
        if (validFiles.length !== e.dataTransfer.files.length) {
          alert('Một số file không được hỗ trợ. Vui lòng chọn file Excel (.xlsx, .xls, .csv)');
        }
      }
    },
    [onFilesSelect]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      const validFiles = Array.from(e.target.files).filter((file: File) => 
        file.name.match(/\.(xlsx|xls|csv)$/i)
      );
      if (validFiles.length > 0) {
        onFilesSelect(validFiles as File[]);
      }
    }
  };

  return (
    <div
      className={cn(
        'relative group flex flex-col items-center justify-center w-full max-w-2xl mx-auto h-64 border-2 border-dashed rounded-xl transition-all duration-300 overflow-hidden bg-white/50 backdrop-blur-sm shadow-sm',
        isDragging
          ? 'border-indigo-400 bg-indigo-50'
          : 'border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/50'
      )}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 pointer-events-none" />
      
      <div className="z-10 flex flex-col items-center justify-center text-center p-6">
        <div className="p-4 bg-indigo-50 rounded-full mb-4 shadow-sm group-hover:scale-110 transition-transform duration-300 ring-1 ring-indigo-100">
          <UploadCloud className={cn("w-10 h-10 text-indigo-500", isLoading && "animate-pulse")} />
        </div>
        <h3 className="text-xl font-display font-semibold text-slate-800 mb-2 tracking-tight">
          {isLoading ? 'Đang xử lý...' : 'Tải lên dữ liệu KTV'}
        </h3>
        <p className="text-sm text-slate-500 max-w-xs font-medium">
          Kéo thả file Excel hoặc click để chọn file (.xlsx, .xls, .csv)
        </p>
      </div>

      <input
        type="file"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
        accept=".xlsx, .xls, .csv"
        onChange={handleChange}
        disabled={isLoading}
        multiple
      />
    </div>
  );
}
