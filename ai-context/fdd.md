Functional Design Document (FDD)
Version 1.0 - Phase 1 (Agency Operating System)

1. User Roles
Role
Access
Platform Admin
Entire ecosystem
Agency Owner
Full agency access
Agency Staff
Limited agency operations
Client
Profile completion only
Family Member
Optional profile review


2. Main Navigation
Agency Portal
Dashboard

Clients
  ├─ New Client
  ├─ Active Clients
  ├─ Pending Profiles

Matches
  ├─ Search
  ├─ Proposals Sent
  ├─ Proposals Received

Communication
  ├─ Agency Chat
  ├─ Notifications

Reports

Settings


3. Dashboard
Purpose
Agency command center.
Widgets
Total Clients
Active Profiles
Pending Approvals
New Match Proposals
Accepted Matches
Recent Activity
Actions
Add Client
Search Matches
View Alerts

4. Client Creation
Screen
New Client
Fields
Client Name
Mobile
Email
Gender
Bride/Groom
City
Assigned Agent

Actions
Save Draft
Generate Onboarding Link
Cancel

Output
Unique Profile Link
OTP Protected


5. Client Onboarding Flow
Workflow
Agency Creates Client
        ↓
Link Generated
        ↓
Client Opens Link
        ↓
OTP Verification
        ↓
Profile Completion
        ↓
Submit
        ↓
Agency Review
        ↓
Approved


6. Profile Management
Sections
Personal Details
Name
Age
DOB
Gender
Height
Marital Status
Religion
Community
Mother Tongue

Education
Qualification
College
Occupation
Employer
Annual Income

Family
Father
Mother
Siblings
Family Type
Family Values

Lifestyle
Food
Smoking
Drinking
Fitness
Hobbies

Expectations
Age Range
Location
Religion
Education
Occupation

AI Generated Summary
AI Profile Summary (structured text summary optimized for LLM matching)


7. Media Vault
Photos
Upload
Primary Photo
Additional Photos

Documents
ID Proof
Biodata PDF
Other Documents

Rules
Agency approves before publishing.

8. Profile Review Queue
States
Draft
Submitted
Under Review
Approved
Rejected
Archived

Review Actions
Approve
Reject
Request Changes
Archive


9. Match Search
Search Filters
Gender
Age Range
Religion
Community
City
Education
Profession
Marital Status

Search Scope
My Agency

Partner Agencies

Entire Network

AI Compatibility Scoring
Each search card displays an AI Compatibility Score (0-100) and a concise AI Match Explanation highlighting reasons for the match and expectations.


10. Match Proposal Workflow
Step 1
Agency A finds candidate.
Actions
Create Proposal


Step 2
Agency B receives proposal.
Actions
Accept
Reject
Request Clarification

AI Compatibility Insights
Both agencies can view the cached AI Compatibility Score and detailed AI Match Explanation to facilitate review.


Step 3
If Accepted
Profile details become visible.

Proposal States
Draft
Sent
Viewed
Accepted
Rejected
Expired
Withdrawn


11. Agency-to-Agency Chat
Available only when:
Proposal Exists

Features
Messages
Attachments
Proposal References

Restrictions
No direct client contact details until approval.

12. Client Communication
Agency can:
Send Match Suggestion
Request Additional Details
Notify Status Updates


13. Audit Trail
Every activity logged.
Examples
Profile Viewed
Photo Viewed
Proposal Created
Proposal Accepted
Document Downloaded

Fields
User
Timestamp
Action
IP Address
Agency


14. Watermarking
Applied to:
Photos
PDF Biodata
Documents

Format:
Agency Name
User Name
Date Time


15. Reporting
Agency Reports
Client Metrics
Total Clients
Active Clients
Pending Profiles

Match Metrics
Proposals Sent
Proposals Accepted
Conversion Rate

Staff Metrics
Profiles Managed
Matches Created
Activity Count


16. Notifications
Agency
New Client Submitted
Proposal Received
Proposal Accepted
Client Updated Profile

Client
Profile Approved
Additional Info Requested
Match Shared


17. Settings
Agency Settings
Agency Profile
Logo
Subscription
Users
Permissions


18. MVP Screen Inventory
Agency
Login
Dashboard
Client List
Create Client
Client Details
Profile Review Queue
Search Matches
Proposal Details
Proposal Inbox
Agency Chat
Reports
Settings

Client
OTP Login
Profile Form
Profile Submitted

Total MVP Screens: 14-16 screens

One major feature I think is missing
Relationship Pipeline
Similar to a CRM.
Profile Created
    ↓
Profile Approved
    ↓
Match Proposed
    ↓
Proposal Accepted
    ↓
Families Introduced
    ↓
Meeting Scheduled
    ↓
Under Discussion
    ↓
Success

This is where agencies actually manage their business. I would add this to Phase 1 MVP because it is a strong differentiator and relatively easy to build.
Next document should be Screen-Level Design (SLD) where we define every screen layout and field in detail before database and API design.

