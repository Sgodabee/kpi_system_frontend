# Organisation API

Base paths: `/api/v1/departments`, `/api/v1/divisions`, `/api/v1/employees`

---

## Departments

### GET `/api/v1/departments`
List all departments.
**Response:** `Department[]`

### GET `/api/v1/departments/{id}`
Single department detail.
**Response:** `Department`

### GET `/api/v1/departments/{id}/divisions`
Divisions belonging to a department.
**Response:** `Division[]`

### GET `/api/v1/departments/{id}/employees`
Paginated employees in a department.
**Query:** `page`, `size`
**Response:** `Page<Employee>`

### POST `/api/v1/departments`
Create a department.

### PUT `/api/v1/departments/{id}`
Update a department.

### DELETE `/api/v1/departments/{id}`
Delete a department.

---

## Divisions

### GET `/api/v1/divisions/{id}`
Single division detail.

### GET `/api/v1/divisions/{id}/employees`
Paginated employees in a division.

### POST `/api/v1/divisions`
Create a division.

### PUT `/api/v1/divisions/{id}`
Update a division.

### DELETE `/api/v1/divisions/{id}`
Delete a division.

---

## Employees

### GET `/api/v1/employees`
Paginated employee list.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| page | int | Page index |
| size | int | Page size |
| search | string | Full-text search |
| departmentId | long | Filter by department |
| divisionId | long | Filter by division |
| status | string | `ACTIVE`, `INACTIVE`, `SUSPENDED` |
| sort | string | Sort field + direction |

### GET `/api/v1/employees/{id}`
Single employee profile.

### GET `/api/v1/employees/{id}/kpis`
KPI assignments for this employee.

### GET `/api/v1/employees/{id}/performance`
Performance cycle history.

### GET `/api/v1/employees/{id}/activity`
Recent activity feed.

### POST `/api/v1/employees`
Create an employee.

### PUT `/api/v1/employees/{id}`
Update an employee.

### DELETE `/api/v1/employees/{id}`
Delete (or deactivate) an employee.

