import * as XLSX from 'xlsx';
import { TicketRecord, ColumnMapping } from '../types';

const normalizeStr = (str: string) => {
  if (!str) return '';
  return str
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
};

const matchColumn = (headers: string[], keywords: string[]): string => {
  for (const header of headers) {
    const normalizedHeader = normalizeStr(header);
    if (keywords.some((kw) => normalizedHeader.includes(normalizeStr(kw)))) {
      return header;
    }
  }
  return '';
};

export const parseExcelFile = async (file: File): Promise<{ data: TicketRecord[]; mapping: ColumnMapping; headers: string[] }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        
        if (jsonData.length === 0) {
          throw new Error('File is empty');
        }

        const headers = Object.keys(jsonData[0] as object);

        const mapping: ColumnMapping = {
          contractId: matchColumn(headers, ['số hợp đồng', 'so hop dong', 'khách hàng', 'khach hang', 'account', 'hợp đồng']),
          technician: matchColumn(headers, ['nhân viên', 'nhan vien', 'ktv', 'kỹ thuật', 'ky thuat', 'người xử lý', 'nguoi xu ly']),
          pop: matchColumn(headers, ['tập điểm', 'tap diem', 'pop']),
          block: matchColumn(headers, ['block', 'block quản lý', 'block quan ly']),
          inputStatus: matchColumn(headers, ['(cấp 1)tình trạng đầu vào', '(cap 1)tinh trang dau vao']),
          errorElement: matchColumn(headers, ['(cấp 1)phần tử lỗi', '(cap 1)phan tu loi']),
          errorCause: matchColumn(headers, ['(cấp 1)nguyên nhân lỗi', '(cap 1)nguyen nhan loi']),
          treatmentDirection: matchColumn(headers, ['(cấp 1)hướng xử lý', '(cap 1)huong xu ly']),
        };

        const records: TicketRecord[] = jsonData.map((row: any) => ({
          contractId: mapping.contractId ? String(row[mapping.contractId]) : 'N/A',
          technician: mapping.technician ? String(row[mapping.technician]) : 'N/A',
          pop: mapping.pop ? String(row[mapping.pop]) : 'N/A',
          block: mapping.block ? String(row[mapping.block]) : 'N/A',
          inputStatus: mapping.inputStatus ? String(row[mapping.inputStatus]) : 'N/A',
          errorElement: mapping.errorElement ? String(row[mapping.errorElement]) : 'N/A',
          errorCause: mapping.errorCause ? String(row[mapping.errorCause]) : 'N/A',
          treatmentDirection: mapping.treatmentDirection ? String(row[mapping.treatmentDirection]) : 'N/A',
          raw: row,
        }));

        resolve({ data: records, mapping, headers });
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};
