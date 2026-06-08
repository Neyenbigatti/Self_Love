# Delta for Treatment Types API

## ADDED Requirements

### Requirement: Unique Treatment Names

The system MUST enforce `(professionalId, name)` uniqueness. Two treatment types for the same professional MUST NOT share the same name.

#### Scenario: Duplicate create rejected

- GIVEN professional P1 has a treatment type "Facial"
- WHEN P1 attempts to create another treatment type named "Facial"
- THEN the response MUST be 409 Conflict

#### Scenario: Same name allowed for different professionals

- GIVEN professional P1 has a treatment type "Facial"
- WHEN professional P2 creates a treatment type named "Facial"
- THEN the response MUST be 201 Created

## MODIFIED Requirements

### Requirement: List Treatment Types

The system MUST return treatment types, optionally filtered by professional.
(Previously: response did not include isActive, category, sortOrder)

#### Scenario: List all treatment types for a professional

- GIVEN either a professional or patient is authenticated
- WHEN they call `GET /api/treatment-types?professionalId={id}`
- THEN the response MUST include `id`, `professionalId`, `name`, `duration`, `description`, `price`, `isActive`, `category`, and `sortOrder`

#### Scenario: Patient can list

- GIVEN a patient is authenticated
- WHEN they call `GET /api/treatment-types?professionalId={id}`
- THEN the response MUST be 200

### Requirement: Create Treatment Type

The system MUST allow professionals to create treatment types with the new fields and enforce unique names per professional.
(Previously: no isActive, category, sortOrder; no uniqueness check)

#### Scenario: Professional creates with all new fields

- GIVEN a professional is authenticated
- WHEN they `POST /api/treatment-types` with `{ name: "Consulta general", duration: 30, category: "General", price: 5000, sortOrder: 1, isActive: true }`
- THEN the response MUST be 201
- AND all provided values MUST be stored

#### Scenario: Patient cannot create

- GIVEN a patient is authenticated
- WHEN they `POST /api/treatment-types`
- THEN the response MUST be 403 Forbidden

#### Scenario: Duplicate name returns 409

- GIVEN a treatment type "Facial" exists for this professional
- WHEN they `POST /api/treatment-types` with `{ name: "Facial", duration: 30 }`
- THEN the response MUST be 409 Conflict

### Requirement: Update Treatment Type

The system MUST allow professionals to modify their treatment types. Rename MUST be blocked with 409 when active appointments reference the treatment.
(Previously: no isActive, category, sortOrder; no rename guard)

#### Scenario: Update fields including new ones

- GIVEN a professional owns a treatment type
- WHEN they `PATCH /api/treatment-types/{id}` with `{ price: 6000, category: "Premium", sortOrder: 2, isActive: false }`
- THEN the response MUST be 200
- AND all provided fields MUST be updated

#### Scenario: Rename blocked with active appointments

- GIVEN a treatment type with `id={tid}` has active appointments
- WHEN a professional calls `PATCH /api/treatment-types/{tid}` with `{ name: "New name" }`
- THEN the response MUST be 409 Conflict
