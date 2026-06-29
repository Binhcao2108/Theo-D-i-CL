export interface TicketRecord {
  contractId: string;
  technician: string;
  pop: string;
  block: string;
  inputStatus: string;
  errorElement: string;
  errorCause: string;
  treatmentDirection: string;
  sourceFile?: string;
  creationTime?: string;
}

export interface ColumnMapping {
  contractId: string;
  technician: string;
  pop: string;
  block: string;
  inputStatus: string;
  errorElement: string;
  errorCause: string;
  treatmentDirection: string;
  creationTime?: string;
}

export interface ChartData {
  name: string;
  value: number;
}
