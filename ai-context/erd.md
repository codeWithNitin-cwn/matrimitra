Perfect. Before API design, we should freeze the ERD.
MatriMitra MVP ERD
┌─────────────┐
│   Agency    │
└──────┬──────┘
       │ 1
       │
       │ N
┌──────▼──────┐
│ AgencyUser  │
└─────────────┘


┌─────────────┐
│   Person    │
└──────┬──────┘
       │1
       │
       │N
┌──────▼───────────┐
│  AgencyProfile   │
└───┬────┬────┬────┘
    │    │    │
    │    │    │
    │    │    │
    ▼    ▼    ▼

ProfilePersonal
ProfileFamily
ProfilePreference
ProfileLifestyle
ProfileCareer
ProfileEducation

    │
    │1
    │
    │N
┌─────────────┐
│ProfilePhoto │
└─────────────┘

    │
    │1
    │
    │N
┌────────────────┐
│ProfileDocument │
└────────────────┘


Matchmaking Area
AgencyProfile
      │
      │
      ▼

┌─────────────┐
│  Proposal   │
└──────┬──────┘
       │
       │1
       │
       │N
┌─────────────────┐
│ProposalActivity │
└─────────────────┘

       │
       │1
       │
       │1
┌─────────────┐
│  Pipeline   │
└─────────────┘


Communication Area
Proposal
   │
   │1
   │
   │1
Conversation
   │
   │1
   │
   │N
Message


Security Area
AgencyUser
     │
     │
     ▼

AuditLog


AgencyUser
     │
     │
     ▼

Notification


Detailed Relationships
Agency
Agency
   │
   ├── AgencyUser
   └── AgencyProfile

One agency owns many:
staff
profiles

Person
Person
   │
   └── AgencyProfile

One person can appear in:
Agency A
Agency B
Agency C

This supports your multi-agency requirement.

AgencyProfile
This is the heart of the system.
AgencyProfile

contains:
Agency Ownership
Status
Trust Score
Pipeline State

and references:
Personal
Family
Career
Lifestyle
Preferences
Photos
Documents


Proposal Design
Proposal should NOT directly expose client data.
Proposal contains:
Sender Agency
Receiver Agency

Bride Profile
Groom Profile

Status


Proposal States
DRAFT

SENT

VIEWED

UNDER_DISCUSSION

ACCEPTED

REJECTED

WITHDRAWN

CLOSED


Pipeline States
Different from proposal status.
PROFILE_CREATED

PROFILE_APPROVED

MATCH_PROPOSED

MATCH_ACCEPTED

FAMILIES_CONNECTED

MEETING_SCHEDULED

UNDER_DISCUSSION

SUCCESS

CLOSED


Additional Tables I Recommend
These are not in the MVP list but are worth adding now.
Agency Partnership
AgencyPartnership

Purpose:
Agency A trusted with Agency B

Fields:
agency_id
partner_agency_id
status
trust_level

This becomes your ecosystem foundation.

ProfileAccessLog
Instead of only AuditLog.
ProfileAccessLog

Fields:
profile_id
viewed_by
agency_id
timestamp
duration

This is one of your strongest differentiators.

FollowUp
Agencies live on follow-ups.
FollowUp

Fields:
proposal_id
assigned_user
due_date
status
remarks

Without this, agencies will go back to Excel.

Final MVP Tables
Core
Agency
AgencyUser

Person
AgencyProfile

ProfilePersonal
ProfileEducation
ProfileCareer
ProfileFamily
ProfileLifestyle
ProfilePreference

ProfilePhoto
ProfileDocument

Matchmaking
Proposal
ProposalActivity
Pipeline

Communication
Conversation
Message

Security
AuditLog
ProfileAccessLog
Notification

Business
AgencyPartnership
FollowUp

Total: 22 tables
My recommendation: add AgencyPartnership, ProfileAccessLog, and FollowUp now. They are core to your agency-centric differentiator and will be painful to retrofit later.
Next step should be Database Dictionary (all columns, datatypes, constraints, indexes) before OpenAPI generation. That document will let Codex generate Prisma schemas almost perfectly.

