# Authentication API

Base path: `/api/v1/auth`

---

## POST `/api/v1/auth/login`

Authenticate a user and receive a JWT.

**Authorization:** None (public)

### Request
```json
{
  "email": "john.smith@municipality.gov.za",
  "password": "secret"
}
```

### Response `200 OK`
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR...",
  "tokenType": "Bearer",
  "expiresIn": 86400,
  "user": {
    "id": 1,
    "username": "john.smith",
    "email": "john.smith@municipality.gov.za",
    "fullName": "John Smith",
    "roles": ["MANAGER"],
    "permissions": ["REVIEW_APPROVE", "REVIEW_REJECT"]
  }
}
```

### Errors
| Status | Description |
|--------|-------------|
| 401 | Invalid credentials |
| 400 | Validation error (missing fields) |

---

## POST `/api/v1/auth/logout`

Invalidate the current token (server-side blacklist if supported).

**Authorization:** `Bearer {token}`

### Response `200 OK`

---

## GET `/api/v1/auth/me`

Return the currently authenticated user's profile.

**Authorization:** `Bearer {token}`

### Response `200 OK`
```json
{
  "id": 1,
  "username": "john.smith",
  "email": "john.smith@municipality.gov.za",
  "fullName": "John Smith",
  "roles": ["MANAGER"],
  "permissions": ["REVIEW_APPROVE", "REVIEW_REJECT"]
}
```

