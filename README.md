# Smart Employee Onboarding - Backend API & Employee Data

This repository contains the foundational identity spine for the Smart Employee Onboarding HRMS, deployed using AWS SAM.
Implemented by: Sasi

## Overview

The stack sets up:
1. **EmployeeOnboardingTable (DynamoDB)**: A single-table design storing employee profiles, stage statuses, and document metadata.
2. **OnboardingAPI (API Gateway)**: The REST API handling incoming requests from the React frontend.
3. **Core Lambdas**: 
   - `CreateEmployeeFunction` (POST `/submit`)
   - `GetProgressFunction` (GET `/progress/{employee_id}`)
   - `GetAdminPipelineFunction` (GET `/admin/pipeline`)

## For Team Members

### Virajith (Identity & Authentication - Cognito)
- **Integration Point**: `src/handlers/createEmployee.js`
- **What to do**: In the `createEmployee` lambda, I've left a `TODO` for you. When a new employee profile is inserted into DynamoDB, you need to invoke `AdminCreateUser` using the `@aws-sdk/client-cognito-identity-provider`.
- **Environment Variables**: Add your Cognito User Pool ID to the `template.yaml` environment variables so the lambda can access it.

### Chiranthan (Workflow Automation - Step Functions)
- **Integration Point**: `src/handlers/createEmployee.js`
- **What to do**: After the employee profile is created (and Cognito account provisioned), you need to kick off the Onboarding State Machine. I've imported `@aws-sdk/client-sfn` for you.
- **Environment Variables**: Add your Step Functions State Machine ARN to the `template.yaml`.

### Prasanna (Frontend Design & Integration)
- **API Endpoints**:
  - `POST /submit` - Submit new hire form. Requires `full_name`, `email`, `department`, `role` in the body. Returns `{ employee_id }`.
  - `GET /progress/{employee_id}` - Get progress bar status for a specific employee.
  - `GET /admin/pipeline?status=PENDING` - Get a list of all active onboarding flows for the HR Dashboard.
- **CORS**: CORS is enabled on API Gateway for `*`. 

### Ayan & Shashank (Document Management & Notifications)
- **Integration Point**: When documents are uploaded, you need to update the DynamoDB table. 
- **DynamoDB Structure**: 
  - Table: `EmployeeOnboardingTable` (Passed to your lambdas via `TABLE_NAME` env var).
  - To insert document metadata, use:
    - PK = `<employee_id>`
    - SK = `DOC#<doc_type>` (e.g., `DOC#ID_PROOF`)
  - To update a stage status, use:
    - PK = `<employee_id>`
    - SK = `STAGE#<stage_name>` (e.g., `STAGE#DocumentCollection`)

## Deployment

To deploy the stack locally for testing:
```bash
sam build
sam local start-api
```

To deploy to AWS:
```bash
sam deploy --guided
```
