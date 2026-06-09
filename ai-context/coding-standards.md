This is probably the highest ROI document for a vibe-coding team. It prevents Codex from creating chaos.
MatriMitra Coding Standards & AI Guardrails
Purpose
This document defines the mandatory standards for all human developers and AI coding agents working on MatriMitra.
The objective is:
Consistent code
Predictable architecture
Reduced merge conflicts
AI-assisted development without architectural drift

Rule 1: Documents Are The Source Of Truth
AI must never invent functionality.
Before implementing anything, read:
vision.md
pdd.md
fdd.md
sld.md
erd.md
database-dictionary.md
api-contract.md
architecture.md
If a requirement is unclear:
STOP and ask.
Never assume.

Rule 2: No Architecture Changes
AI agents must not:
Create new modules
Change folder structure
Change database design
Change API contracts
without explicit approval.

Rule 3: Domain Ownership
Only modify files belonging to the assigned module.
Examples:
Auth Developer:
auth/*
user/*
Profile Developer:
profile/*
photo/*
document/*
Proposal Developer:
proposal/*
pipeline/*
search/*
Do not modify unrelated modules.

Rule 4: Small Pull Requests
Maximum:
1 feature
1 bug fix
1 enhancement
per pull request.
Avoid large AI-generated commits.

Rule 5: API First
Never build UI before API contract exists.
Order:
API Contract
→ Backend
→ Frontend

Rule 6: Database First
Before creating code:
Table exists
ERD updated
Database Dictionary updated
No direct schema changes.

Rule 7: No Hardcoding
Never hardcode:
URLs
Credentials
Agency IDs
User IDs
Status values
Use:
Config
Enums
Constants

Rule 8: TypeScript Strict Mode
Required:
No any
No ts-ignore
No unsafe casting
All DTOs typed.

Rule 9: Validation Required
Every API endpoint must validate:
Request body
Query parameters
Path parameters
No exceptions.

Rule 10: Service Layer Only
Controllers must:
Receive request
Validate request
Call service
Business logic belongs in services.
Never in controllers.

Rule 11: Repository Pattern
Database access belongs in repositories.
Never call Prisma directly from:
Controllers
Routes

Rule 12: Audit Logging
The following actions must generate audit logs:
Login
Profile View
Profile Update
Proposal Create
Proposal Accept
Proposal Reject
Pipeline Update

Rule 13: Security First
Never expose:
Mobile numbers
Email addresses
Documents
unless business rules permit.
Agency ownership rules must be enforced.

Rule 14: Naming Standards
Files:
auth.service.ts
proposal.controller.ts
profile.repository.ts
Classes:
AuthService
ProposalController
ProfileRepository
Methods:
createProfile()
sendProposal()
approveProfile()

Rule 15: API Standards
REST only.
Examples:
GET /clients
POST /clients
GET /clients/{id}
PUT /clients/{id}
Avoid:
/getClients
/createClient

Rule 16: Database Standards
Primary Keys:
UUID
Timestamps:
created_at
updated_at
Foreign Keys:
agency_id
profile_id
proposal_id
Use consistent naming.

Rule 17: Error Handling
Use standard responses.
Success:
{
"success": true,
"data": {}
}
Failure:
{
"success": false,
"error": {
"code": "VALIDATION_ERROR",
"message": "Invalid mobile number"
}
}

Rule 18: Testing Standards
Minimum:
Service tests
Repository tests
API tests
No feature is complete without tests.

Rule 19: AI Prompt Standard
Every Codex task must begin with:
Read all files in /ai-context.
Do not modify architecture.
Do not modify API contracts.
Do not modify database schema.
Only implement the requested feature.
Return a summary of files changed.

Rule 20: Definition Of Done
Feature is complete only if:
✓ Code written
✓ Tests pass
✓ Build passes
✓ API documented
✓ Audit logging added
✓ PR reviewed
✓ Merged into develop
Otherwise feature is not complete.
One additional file
Create:
/ai-context/codex-system-prompt.md

Put the Rule 19 prompt there.
Every developer should paste it into Codex before starting work.
That single practice will save a huge amount of rework once all four developers start coding in parallel.

