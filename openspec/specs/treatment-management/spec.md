# Treatment Management Specification

## Purpose

Professional-facing UI for managing treatment types — list grouped by category, create, edit, toggle active/inactive, delete, and organize by sort order. Patients only see active treatments.

## Requirements

### Requirement: List Treatments

The system MUST display all treatment types grouped by category in ascending `sortOrder`, with uncategorized treatments under "Sin categoría".

#### Scenario: Treatments grouped by category

- GIVEN a professional has treatments in "Inyectables", "Corporal", and null category
- WHEN they open the treatment management page
- THEN treatments MUST appear under headers "Inyectables", "Corporal", and "Sin categoría"
- AND each group MUST be sorted by `sortOrder` ascending

#### Scenario: Empty state

- GIVEN a professional has zero treatment types
- WHEN they open the treatment management page
- THEN the page MUST show an empty state with a "Crear tratamiento" button

### Requirement: Create Treatment

The system MUST allow professionals to create a treatment type with `name` (required), `duration` (required), `category` (optional), `price` (optional), and `description` (optional).

#### Scenario: Create with minimum fields

- GIVEN a professional is authenticated
- WHEN they submit `{ name: "Limpieza facial", duration: 30 }`
- THEN the treatment MUST be created and appear in the list immediately

#### Scenario: Create with all fields

- GIVEN a professional is authenticated
- WHEN they submit `{ name: "Limpieza facial", duration: 30, category: "Facial", price: 5000, description: "Limpieza profunda" }`
- THEN all fields MUST be stored

#### Scenario: Duplicate name rejected

- GIVEN a treatment type named "Limpieza facial" already exists for this professional
- WHEN they submit the same name
- THEN the UI MUST show "Ya existe un tratamiento con este nombre"

### Requirement: Edit Treatment

The system MUST allow editing all fields. Rename MUST be blocked when active appointments reference the treatment.

#### Scenario: Edit fields successfully

- GIVEN a treatment type with no active appointments
- WHEN a professional changes name, category, price, description, or sortOrder
- THEN all changes MUST be persisted

#### Scenario: Rename blocked with active appointments

- GIVEN a treatment type has active appointments referencing it
- WHEN a professional attempts to rename it
- THEN the UI MUST show an error preventing the rename

### Requirement: Toggle Active/Inactive

The system MUST allow professionals to deactivate and reactivate treatments.

#### Scenario: Deactivate treatment

- GIVEN a treatment type with `isActive: true`
- WHEN a professional toggles it to inactive
- THEN `isActive` MUST become `false`
- AND the treatment MUST disappear from patient booking but remain in existing appointments

#### Scenario: Reactivate treatment

- GIVEN a treatment type with `isActive: false`
- WHEN a professional toggles it to active
- THEN `isActive` MUST become `true`
- AND the treatment MUST reappear in patient booking

### Requirement: Delete Treatment

The system MUST allow deletion only when zero appointments reference the treatment.

#### Scenario: Delete unused treatment

- GIVEN a treatment type with no appointments
- WHEN a professional clicks delete and confirms
- THEN the treatment MUST be permanently removed from the list

#### Scenario: Delete blocked with appointments

- GIVEN a treatment type has appointments referencing it
- WHEN a professional clicks delete
- THEN the system MUST show an error explaining deletion is blocked
