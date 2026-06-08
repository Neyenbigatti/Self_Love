# Delta for Appointments API

## ADDED Requirements

### Requirement: GET Response Includes TreatmentTypeId

The system MUST include `treatmentTypeId` in GET appointment responses alongside the existing `treatmentType` field during migration.

#### Scenario: List response includes new field

- GIVEN appointments exist with `treatmentTypeId` populated
- WHEN a professional calls `GET /api/appointments`
- THEN each appointment in the response MUST include `treatmentTypeId`

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

## MODIFIED Requirements

### Requirement: Create Appointment

The system MUST create appointments and reject time overlaps. During migration, both `treatmentType` (string) and `treatmentTypeId` (ID reference) are accepted; `treatmentTypeId` is canonical post-migration.
(Previously: only `treatmentType` string accepted)

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

- GIVEN an existing appointment on `2026-06-02` from `10:00` to `11:00`
- WHEN creating an appointment from `10:30` to `11:30` on the same date
- THEN the response MUST be 409 Conflict
