# Treatment Types API Specification

## Purpose

CRUD management of treatment types per professional. Each treatment has a name, duration, description, and price. Both roles can list; only professionals create, update, or delete.

## Requirements

### Requirement: List Treatment Types

The system MUST return treatment types, optionally filtered by professional.

#### Scenario: List all treatment types for a professional

- GIVEN either a professional or patient is authenticated
- WHEN they call `GET /api/treatment-types?professionalId={id}`
- THEN the response MUST include `id`, `professionalId`, `name`, `duration`, `description`, and `price` for each type

#### Scenario: Patient can list

- GIVEN a patient is authenticated
- WHEN they call `GET /api/treatment-types?professionalId={id}`
- THEN the response MUST be 200

### Requirement: Create Treatment Type

The system MUST allow professionals to create treatment types.

#### Scenario: Professional creates treatment type

- GIVEN a professional is authenticated
- WHEN they `POST /api/treatment-types` with `{ name: "Consulta general", duration: 30, description: "Consulta de rutina", price: 5000 }`
- THEN the response MUST be 201
- AND the returned `treatmentType` MUST have the provided values

#### Scenario: Patient cannot create

- GIVEN a patient is authenticated
- WHEN they `POST /api/treatment-types`
- THEN the response MUST be 403 Forbidden

### Requirement: Update Treatment Type

The system MUST allow professionals to modify their treatment types.

#### Scenario: Professional updates price

- GIVEN a professional owns a treatment type
- WHEN they `PATCH /api/treatment-types/{id}` with `{ price: 6000 }`
- THEN the response MUST be 200
- AND `price` MUST be updated

### Requirement: Delete Treatment Type

The system MUST allow deletion only when no appointments reference the treatment type.

#### Scenario: Delete unused treatment type

- GIVEN no appointments reference the treatment type
- WHEN a professional calls `DELETE /api/treatment-types/{id}`
- THEN the response MUST be 200 with `{ success: true }`

#### Scenario: Delete treatment type with active appointments

- GIVEN active appointments reference this treatment type
- WHEN a professional calls `DELETE /api/treatment-types/{id}`
- THEN the response MUST be 409 Conflict

#### Scenario: Patient cannot delete

- GIVEN a patient is authenticated
- WHEN they call `DELETE /api/treatment-types/{id}`
- THEN the response MUST be 403 Forbidden
