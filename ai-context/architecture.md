MatriMitra Technical Architecture
Architecture Style
Modular Monolith (Phase 1)
The system will be developed as a modular monolith to reduce complexity and accelerate development.
Future services can be extracted when required.

Technology Stack
Frontend
Next.js
TypeScript
Tailwind CSS
ShadCN UI
Backend
Node.js
Express
TypeScript
Database
PostgreSQL
ORM
Prisma
Authentication
JWT
OTP Authentication
File Storage
Cloudinary
Real-Time Communication
Socket.IO
Infrastructure
Docker

High-Level Architecture
Client Browser
↓
Frontend (Next.js)
↓
REST APIs
↓
Backend (Node.js / Express)
↓
PostgreSQL
↓
Cloudinary

Core Domains
Authentication Domain
Responsibilities:
Login
Session Management
Authorization
Agency Domain
Responsibilities:
Agency Management
Staff Management
Client Domain
Responsibilities:
Client Lifecycle
Onboarding
Profile Domain
Responsibilities:
Biodata
Family Information
Preferences
Photos
Documents
Matchmaking Domain
Responsibilities:
Search
Discovery
Recommendations
Proposal Domain
Responsibilities:
Match Proposals
Proposal Workflow
Pipeline Domain
Responsibilities:
Relationship Tracking
Progress Management
Communication Domain
Responsibilities:
Chat
Notifications
Audit Domain
Responsibilities:
Access Tracking
Compliance Logging
Reporting Domain
Responsibilities:
KPIs
Analytics

Security Principles
Authentication
JWT-based authentication.
Authorization
Role-based access control.
Data Ownership
Agency owns profile visibility.
Auditability
Every profile access is logged.
Privacy
Client contact details are hidden until approved.

Deployment Strategy
Phase 1:
Single Docker deployment.
Future:
Kubernetes
Microservices
Event-driven architecture
only when scale requires it.

Development Principles
API First
Database First
Mobile Responsive
Secure By Default
Testable Components
Modular Design
AI-Assisted Development

Repository Structure
frontend/
backend/
database/
docs/
ai-context/
infrastructure/
testing/
All development must follow the contracts defined in:
PDD
FDD
SLD
ERD
Database Dictionary
API Contract
These documents are the source of truth for both developers and AI coding agents.


