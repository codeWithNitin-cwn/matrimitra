Perfect. For MVP, we should design APIs around business workflows, not database tables.
Use:
/api/v1/


API Groups
Authentication
Agencies
Users
Clients
Profiles
Photos
Documents
Matches
Proposals
Pipeline
Chat
Notifications
Reports
Audit


1. Authentication APIs
Login
POST /api/v1/auth/login

Request
{
  "email": "agent@agency.com",
  "password": "******"
}

Response
{
  "token": "jwt",
  "refreshToken": "refresh",
  "user": {}
}


Refresh Token
POST /api/v1/auth/refresh


Logout
POST /api/v1/auth/logout


2. Agency APIs
Create Agency
POST /api/v1/agencies


Get Agency
GET /api/v1/agencies/{agencyId}


Update Agency
PUT /api/v1/agencies/{agencyId}


3. Agency User APIs
Create User
POST /api/v1/agencies/{agencyId}/users

Request
{
  "firstName": "Suresh",
  "email": "abc@test.com",
  "role": "EXECUTIVE"
}


List Users
GET /api/v1/agencies/{agencyId}/users


4. Client APIs
Create Client
Agency creates shell profile.
POST /api/v1/clients

Request
{
  "name": "Rahul",
  "mobile": "9999999999",
  "email": "rahul@test.com",
  "profileType": "GROOM"
}

Response
{
  "clientId": "...",
  "onboardingLink": "..."
}


List Clients
GET /api/v1/clients

Filters
status
assignedUser
city


Get Client
GET /api/v1/clients/{clientId}


5. Client Onboarding APIs
Validate OTP
POST /api/v1/onboarding/verify-otp


Submit Profile
POST /api/v1/onboarding/profile


Save Draft
POST /api/v1/onboarding/profile/draft


6. Profile APIs
Get Full Profile
GET /api/v1/profiles/{profileId}


Update Personal Details
PUT /api/v1/profiles/{profileId}/personal


Update Family Details
PUT /api/v1/profiles/{profileId}/family


Update Lifestyle
PUT /api/v1/profiles/{profileId}/lifestyle


Update Preferences
PUT /api/v1/profiles/{profileId}/preferences


7. Review Queue APIs
Pending Profiles
GET /api/v1/profiles/review-queue


Approve Profile
POST /api/v1/profiles/{profileId}/approve


Reject Profile
POST /api/v1/profiles/{profileId}/reject


Request Changes
POST /api/v1/profiles/{profileId}/request-changes


8. Photo APIs
Upload Photo
POST /api/v1/profiles/{profileId}/photos

Multipart upload.

List Photos
GET /api/v1/profiles/{profileId}/photos


Delete Photo
DELETE /api/v1/photos/{photoId}


9. Document APIs
Upload Document
POST /api/v1/profiles/{profileId}/documents


List Documents
GET /api/v1/profiles/{profileId}/documents


10. Match Search APIs
Search Profiles
GET /api/v1/matches/search

Query
gender
ageMin
ageMax
religion
caste
city
profession
education


Suggested Matches
GET /api/v1/matches/suggestions/{profileId}


11. Proposal APIs
Create Proposal
POST /api/v1/proposals

Request
{
  "brideProfileId": "...",
  "groomProfileId": "...",
  "receiverAgencyId": "...",
  "notes": "Good match"
}


Proposal Inbox
GET /api/v1/proposals/inbox


Proposal Details
GET /api/v1/proposals/{proposalId}


Accept Proposal
POST /api/v1/proposals/{proposalId}/accept


Reject Proposal
POST /api/v1/proposals/{proposalId}/reject


Withdraw Proposal
POST /api/v1/proposals/{proposalId}/withdraw


12. Pipeline APIs
Get Pipeline
GET /api/v1/pipeline/{proposalId}


Move Stage
POST /api/v1/pipeline/{proposalId}/move

Request
{
  "stage": "MEETING_SCHEDULED"
}


Kanban Board
GET /api/v1/pipeline/board


13. Chat APIs
Create Conversation
POST /api/v1/conversations


Get Messages
GET /api/v1/conversations/{conversationId}/messages


Send Message
POST /api/v1/conversations/{conversationId}/messages


14. Notification APIs
My Notifications
GET /api/v1/notifications


Mark Read
POST /api/v1/notifications/{id}/read


15. Audit APIs
Profile Access History
GET /api/v1/profiles/{profileId}/access-log


Audit Trail
GET /api/v1/audit

Filters
user
action
date
entity


16. Reporting APIs
Dashboard KPIs
GET /api/v1/reports/dashboard

Response
{
  "clients": 150,
  "activeProfiles": 120,
  "proposalsSent": 45,
  "successes": 12
}


Agent Performance
GET /api/v1/reports/agents


MVP API Count
Auth                4
Agency              3
Users               2
Clients             3
Onboarding          3
Profiles            5
Review Queue        4
Photos              3
Documents           2
Matches             2
Proposals           6
Pipeline            3
Chat                3
Notifications       2
Audit               2
Reports             2

~49 REST endpoints
This is a very solid MVP contract and enough for Codex to generate:
Express Controllers
Service Layer
Prisma Models
Swagger/OpenAPI Spec
Postman Collection
The next artifact I would create before coding is a Repository Architecture & Backend Folder Structure document so all 4 developers and Codex work in the same structure.
