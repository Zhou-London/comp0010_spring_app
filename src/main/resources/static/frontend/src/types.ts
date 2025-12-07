export interface Student {
  id?: number;
  firstName: string;
  lastName: string;
  userName: string;
  email: string;
  entryYear?: number | null;
  graduateYear?: number | null;
  major?: string;
  tuitionFee?: number | null;
  paidTuitionFee?: number | null;
  birthDate?: string | null;
  homeStudent?: boolean | null;
  sex?: string;
}

export interface Module {
  id?: number;
  code: string;
  name: string;
  mnc: boolean;
  department: string;
  requiredYear?: number | null;
  prerequisiteModule?: Module | null;
}

export interface ModuleStatistics extends Module {
  prerequisiteCode?: string | null;
  registrationCount: number;
  totalStudents: number;
  selectionRate: number;
  totalGrades: number;
  passingGrades: number;
  passRate: number | null;
  averageGrade: number | null;
}

export interface Grade {
  id?: number;
  score: number;
  student?: Student;
  module?: Module;
}

export interface Registration {
  id?: number;
  student?: Student;
  module?: Module;
}

export interface PageMetadata {
  size?: number;
  totalElements?: number;
  totalPages?: number;
  number?: number;
}

export interface HalCollection<T> {
  _embedded?: Record<string, T[]>;
  page?: PageMetadata;
}

export interface OperationLog {
  id?: number;
  operationType: 'CREATE' | 'UPDATE' | 'DELETE' | 'REVERT';
  entityType: 'STUDENT' | 'MODULE' | 'REGISTRATION' | 'GRADE';
  entityId?: number | null;
  timestamp: string;
  username?: string | null;
  description?: string | null;
}
