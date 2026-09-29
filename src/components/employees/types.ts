import type { EmployeeStatus } from "@/lib/validations/employee";
export interface EmployeeRow {
  id: string;
  profile_id: string;
  nik: string;
  phone: string | null;
  address: string | null;
  birth_date: string | null;
  join_date: string;
  employment_status: EmployeeStatus;
  basic_salary: number;
  department_id: string;
  position_id: string;
  manager_id: string | null;
  photo_url: string | null;
  profiles: {
    full_name: string;
    email: string;
    avatar_url: string | null;
  } | null;
  departments: { name: string } | null;
  positions: { name: string } | null;
}

export interface ManagerOption {
  id: string;
  profiles: { full_name: string; role: string } | null;
}

export interface DepartmentOption {
  id: string;
  name: string;
}

export interface PositionOption {
  id: string;
  name: string;
  department_id: string;
}
