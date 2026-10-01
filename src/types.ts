export interface School {
  id: string;
  name: string;
  username: string;
  passwordHash: string; // Plain-text or simple base64/hashed for demo simplicity
  maxQuota: number;     // Cupo máximo de alumnos
  roomsMale: number;    // Habitaciones asignadas para hombres
  roomsFemale: number;  // Habitaciones asignadas para mujeres
  roomNumbersMale?: string[];   // Números de habitación reales asignados (e.g. ["101", "102"])
  roomNumbersFemale?: string[]; // Números de habitación reales asignados (e.g. ["201", "202"])
  cycleId?: string;
}

export interface Committee {
  id: string;
  name: string;
  doubleDelegation: boolean; // Si es en pareja o individual
  countries: string[];      // Lista de IDs de países asignados a este comité
  language: 'Español' | 'Inglés' | 'Bilingüe'; // Idioma del comité
  cycleId?: string;
}

export interface Country {
  id: string;
  name: string;
  cycleId?: string;
}

export interface Delegate {
  id: string;
  names: string;
  lastNames: string;
  phone: string;
  schoolId: string;
  email: string;
  choices: string[]; // 3 preferred committee IDs in order
  assignedCommitteeId: string | null;
  assignedCountryId: string | null;
  status: 'pending' | 'selected' | 'rejected'; // School selects who goes
  createdAt: string;
  language: 'Español' | 'Inglés' | 'Bilingüe'; // Idioma de participación
  sex: 'Hombre' | 'Mujer'; // Sexo del alumno
  shirtSize: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL'; // Talla de playera
  roomNumber: number | null; // Número de habitación asignada (1, 2, 3...) o null
  cycleId?: string;
}

export interface Payment {
  id: string;
  folio: number;      // Folio único de recibo
  studentId: string;
  amount: number;
  paymentIndex: number; // 1 para primer pago, 2 para segundo, etc.
  date: string;
  notes: string;
  batchId?: string;    // ID para agrupar cobros por lote de escuelas
  cycleId?: string;
}

export interface AdminUser {
  id: string;
  name: string;
  username: string;
  passwordHash: string;
  role: 'superadmin' | 'finance' | 'coordinator';
}

export interface SystemConfig {
  registrationEnabled: boolean;
  numPaymentsRequired: number;
  paymentAmount: number; // Monto por pago
  totalAmountToPay?: number; // Cantidad total a pagar por alumno
  currentReceiptFolio: number;
  cycleId?: string;
}

export interface SchoolCycle {
  id: string;
  name: string;
  isActive: boolean;
}

export interface MUNData {
  schools: School[];
  committees: Committee[];
  countries: Country[];
  delegates: Delegate[];
  payments: Payment[];
  config: SystemConfig;
  configs?: SystemConfig[];
  adminUsers?: AdminUser[];
  cycles?: SchoolCycle[];
  activeCycleId?: string;
}
