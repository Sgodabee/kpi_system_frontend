export interface User {
  id:          number;
  username:    string;
  email:       string;
  fullName:    string;
  roles:       string[];
  permissions: string[];
  employeeId?: number;   // HR employee record ID — different from auth user ID
}
