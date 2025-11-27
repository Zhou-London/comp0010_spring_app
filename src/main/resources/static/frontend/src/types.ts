export interface Student {
  id?: number;
  firstName?: string;
  lastName?: string;
  userName?: string;
  email?: string;
}

export interface Module {
  id?: number;
  code?: string;
  name?: string;
  mnc?: boolean;
}

export interface Grade {
  id?: number;
  score?: number;
  student?: Student;
  module?: Module;
}

export interface Registration {
  id?: number;
  student?: Student;
  module?: Module;
}
