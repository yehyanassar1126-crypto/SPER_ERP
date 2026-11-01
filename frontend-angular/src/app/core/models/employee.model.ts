export interface Employee {
  id?: string;
  name?: string;
  full_name?: string;
  email?: string;
  department?: string;
  position?: string;
  role?: string;
  salary?: number;
  status?: string;
  [key: string]: any;
}
