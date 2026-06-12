# Clinical Notes Specification

## Purpose

Free-text clinical observations that professionals attach to patient records. Notes are independent of exploration templates and serve as the clinical-history log.

## Requirements

### Requirement: List notes for patient

The system MUST return clinical notes for a given patient, filtered by professional ownership, ordered by date descending.

#### Scenario: Professional views patient notes
- GIVEN notes exist for patient `p1` created by the authenticated professional
- WHEN they send `GET /api/patients/p1/clinical-notes`
- THEN the response SHALL be an array ordered by `date` DESC
- AND each note SHALL include `id`, `patient_id`, `professional_id`, `date`, `content`, `created_at`, `updated_at`

#### Scenario: Patient has no notes
- GIVEN no clinical notes exist for the patient
- WHEN they send `GET /api/patients/p1/clinical-notes`
- THEN the response SHALL be an empty array `[]`

#### Scenario: Professional cannot see another's notes
- GIVEN notes exist for patient `p1` from professional `pro-A`
- WHEN professional `pro-B` sends `GET /api/patients/p1/clinical-notes`
- THEN notes from `pro-A` MUST NOT appear in the response

### Requirement: Create clinical note

The system MUST create a new clinical note for a patient.

#### Scenario: Professional creates note
- GIVEN the professional is authenticated and patient `p1` exists
- WHEN they send `POST /api/patients/p1/clinical-notes` with `{ "date": "2026-06-10", "content": "Patient reports improved hydration." }`
- THEN the response MUST be `201 Created`
- AND the note SHALL have `professional_id` set to the authenticated user

#### Scenario: Create note with missing content
- GIVEN the request body omits `content`
- WHEN they send `POST /api/patients/p1/clinical-notes`
- THEN the response MUST be `400 Bad Request`

#### Scenario: Create note for non-existent patient
- GIVEN patient `p-999` does not exist
- WHEN they send `POST /api/patients/p-999/clinical-notes` with valid body
- THEN the response MUST be `404 Not Found`

### Requirement: Update clinical note

The system MUST allow updating the `content` and/or `date` of an existing note owned by the professional.

#### Scenario: Professional updates note content
- GIVEN a note `n1` owned by the authenticated professional for patient `p1`
- WHEN they send `PATCH /api/patients/p1/clinical-notes/n1` with `{ "content": "Updated observation." }`
- THEN the response MUST be `200 OK` with the updated note
- AND `updated_at` SHALL reflect the new timestamp

#### Scenario: Professional cannot update another's note
- GIVEN a note `n1` owned by professional `pro-A`
- WHEN professional `pro-B` sends `PATCH /api/patients/p1/clinical-notes/n1`
- THEN the response MUST be `403 Forbidden`

### Requirement: Delete clinical note

The system MUST delete a clinical note, checking ownership before deletion.

#### Scenario: Professional deletes own note
- GIVEN a note `n1` owned by the authenticated professional
- WHEN they send `DELETE /api/patients/p1/clinical-notes/n1`
- THEN the response MUST be `200 OK` or `204 No Content`
- AND subsequent GET SHALL NOT include the deleted note

#### Scenario: Professional cannot delete another's note
- GIVEN a note `n1` owned by professional `pro-A`
- WHEN professional `pro-B` sends `DELETE /api/patients/p1/clinical-notes/n1`
- THEN the response MUST be `403 Forbidden`
