# Appointments API Specification

## Purpose

CRUD operations for appointments with date range filtering, role-scoped access, time overlap prevention, and status transition enforcement.

## Requirements

### Requirement: List Appointments

The system MUST return appointments filtered by query parameters and scoped to the authenticated user.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| startDate | YYYY-MM-DD | No | Inclusive start of range |
| endDate | YYYY-MM-DD | No | Inclusive end of range |
| professionalId | string | No | Filter by professional |
| status | string | No | Filter by status |

#### Scenario: Professional lists own appointments

- GIVEN a professional is authenticated
- WHEN they call `GET /api/appointments`
- THEN the response MUST contain only appointments where `professionalId` matches their session
- AND each appointment MUST include `patientName` and `patientAvatar` from the joined patient record

#### Scenario: Patient lists own appointments

- GIVEN a patient is authenticated
- WHEN they call `GET /api/appointments`
- THEN the response MUST contain only appointments where `patientId` matches their session

#### Scenario: Filter by date range

- GIVEN a professional is authenticated
- WHEN they call `GET /api/appointments?startDate=2026-06-01&endDate=2026-06-30`
- THEN the response MUST only include appointments within that range

### Requirement: Get Appointment by ID

The system MUST return a single appointment with ownership enforcement.

#### Scenario: Owner retrieves appointment

- GIVEN a professional is authenticated and owns the appointment
- WHEN they call `GET /api/appointments/{id}`
- THEN the response MUST be 200 with the appointment

#### Scenario: Patient accesses another patient's appointment

- GIVEN a patient is authenticated
- WHEN they call `GET /api/appointments/{id}` belonging to another patient
- THEN the response MUST be 403 Forbidden

### Requirement: GET Response Includes TreatmentTypeId

The system MUST include `treatmentTypeId` in GET appointment responses alongside the existing `treatmentType` field during migration.

#### Scenario: List response includes new field

- GIVEN appointments exist with `treatmentTypeId` populated
- WHEN a professional calls `GET /api/appointments`
- THEN each appointment in the response MUST include `treatmentTypeId`

### Requirement: Create Appointment

The system MUST create appointments and reject time overlaps. During migration, both `treatmentType` (string) and `treatmentTypeId` (ID reference) are accepted; `treatmentTypeId` is canonical post-migration.

#### Scenario: Professional creates appointment with treatmentTypeId

- GIVEN a professional is authenticated
- WHEN they `POST /api/appointments` with `{ patientId, treatmentTypeId: "tt_123", treatmentType: "Facial", date, startTime, endTime }`
- THEN the response MUST be 201
- AND the response MUST include both `treatmentType` and `treatmentTypeId`

#### Scenario: Patient creates appointment

- GIVEN a patient is authenticated
- WHEN they `POST /api/appointments` with valid body
- THEN the response MUST be 201
- AND the appointment status MUST be `pending`

#### Scenario: Overlapping time rejected

- GIVEN an existing appointment for the same professional on `2026-06-02` from `10:00` to `11:00`
- WHEN a professional creates an appointment from `10:30` to `11:30` on the same date
- THEN the response MUST be 409 Conflict

### Requirement: POST Accepts TreatmentTypeId / Backward Compat

The system MUST accept `treatmentTypeId` in POST body. Both `treatmentType` (string) and `treatmentTypeId` (ID) MUST be accepted during migration.

#### Scenario: Create appointment with treatmentTypeId

- GIVEN a professional is authenticated
- WHEN they `POST /api/appointments` with `{ patientId, treatmentTypeId: "tt_123", date, startTime, endTime }`
- THEN the response MUST be 201
- AND the appointment MUST store `treatmentTypeId`

#### Scenario: Backward compatible — treatmentType string still accepted

- GIVEN a professional is authenticated
- WHEN they `POST /api/appointments` with `{ patientId, treatmentType: "Facial", date, startTime, endTime }` (no `treatmentTypeId`)
- THEN the response MUST be 201
- AND the system MUST NOT reject the request for missing `treatmentTypeId`

### Requirement: Update Appointment

The system MUST enforce valid status transitions on PATCH.

| From | To |
|------|----|
| pending | confirmed, cancelled |
| confirmed | cancelled, completed |
| completed | — (none) |
| cancelled | — (none) |

#### Scenario: Cancel confirmed appointment

- GIVEN an appointment with status `confirmed`
- WHEN a professional PATCHes `{ status: "cancelled" }`
- THEN the response MUST be 200
- AND the appointment status MUST be `cancelled`

#### Scenario: Patient cancels own pending appointment

- GIVEN an appointment with status `pending` belonging to the authenticated patient
- WHEN they PATCH `{ status: "cancelled" }`
- THEN the response MUST be 200

#### Scenario: Invalid transition rejected

- GIVEN an appointment with status `completed`
- WHEN a professional PATCHes `{ status: "cancelled" }`
- THEN the response MUST be 409 Conflict

### Requirement: Delete Appointment

The system MUST allow professionals to delete appointments.

#### Scenario: Professional deletes appointment

- GIVEN a professional is authenticated
- WHEN they call `DELETE /api/appointments/{id}`
- THEN the response MUST be 200 with `{ success: true }`

#### Scenario: Patient cannot delete

- GIVEN a patient is authenticated
- WHEN they call `DELETE /api/appointments/{id}`
- THEN the response MUST be 403 Forbidden
