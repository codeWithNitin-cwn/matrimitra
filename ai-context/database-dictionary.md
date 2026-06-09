Excellent. This document will become the source for:
Prisma Schema
PostgreSQL DDL
API Contracts
Validation Rules
UI Forms
Database Dictionary v1.0

Agency
Purpose
Represents a matrimonial agency.
Column
Type
Required
Notes
id
UUID
Yes
PK
agency_code
VARCHAR(20)
Yes
Unique
name
VARCHAR(200)
Yes


registration_no
VARCHAR(100)
No


email
VARCHAR(200)
Yes


mobile
VARCHAR(20)
Yes


website
VARCHAR(300)
No


city
VARCHAR(100)
Yes


state
VARCHAR(100)
Yes


country
VARCHAR(100)
Yes


status
VARCHAR(20)
Yes
ACTIVE, INACTIVE
created_at
TIMESTAMP
Yes


updated_at
TIMESTAMP
Yes



Indexes
agency_code
email
mobile


AgencyUser
Purpose
Agency staff members.
Column
Type
id
UUID
agency_id
UUID
first_name
VARCHAR(100)
last_name
VARCHAR(100)
email
VARCHAR(200)
mobile
VARCHAR(20)
role
VARCHAR(30)
status
VARCHAR(20)
last_login
TIMESTAMP
created_at
TIMESTAMP

Role Values
OWNER
MANAGER
EXECUTIVE
VIEWER


Person
Purpose
Master individual.
Column
Type
id
UUID
first_name
VARCHAR(100)
last_name
VARCHAR(100)
gender
VARCHAR(20)
dob
DATE
mobile
VARCHAR(20)
email
VARCHAR(200)
created_at
TIMESTAMP


AgencyProfile
Purpose
Agency-specific client profile.
Column
Type
id
UUID
agency_id
UUID
person_id
UUID
profile_number
VARCHAR(50)
profile_type
VARCHAR(20)
assigned_user_id
UUID
status
VARCHAR(30)
trust_score
NUMERIC(5,2)
completion_percent
INTEGER
onboarding_link
TEXT
onboarding_expiry
TIMESTAMP
created_at
TIMESTAMP
ai_summary
TEXT

Status Values
DRAFT
PENDING
UNDER_REVIEW
APPROVED
REJECTED
ARCHIVED


ProfilePersonal
Column
Type
profile_id
UUID
religion
VARCHAR(100)
caste
VARCHAR(100)
sub_caste
VARCHAR(100)
mother_tongue
VARCHAR(100)
height_cm
INTEGER
weight_kg
INTEGER
marital_status
VARCHAR(50)
city
VARCHAR(100)
state
VARCHAR(100)
country
VARCHAR(100)


ProfileEducation
Column
Type
id
UUID
profile_id
UUID
qualification
VARCHAR(200)
specialization
VARCHAR(200)
institution
VARCHAR(200)
graduation_year
INTEGER


ProfileCareer
Column
Type
profile_id
UUID
profession
VARCHAR(200)
employer
VARCHAR(200)
designation
VARCHAR(200)
annual_income
NUMERIC(15,2)
work_location
VARCHAR(100)


ProfileFamily
Column
Type
profile_id
UUID
father_name
VARCHAR(200)
mother_name
VARCHAR(200)
father_occupation
VARCHAR(200)
mother_occupation
VARCHAR(200)
family_type
VARCHAR(50)
family_values
TEXT
siblings_count
INTEGER


ProfileLifestyle
Column
Type
profile_id
UUID
food_habit
VARCHAR(50)
smoking
BOOLEAN
drinking
BOOLEAN
fitness_level
VARCHAR(50)
hobbies
JSONB


ProfilePreference
Column
Type
profile_id
UUID
min_age
INTEGER
max_age
INTEGER
min_height
INTEGER
max_height
INTEGER
religion
VARCHAR(100)
caste
VARCHAR(100)
city
VARCHAR(100)
education
VARCHAR(200)
profession
VARCHAR(200)


ProfilePhoto
Column
Type
id
UUID
profile_id
UUID
cloudinary_url
TEXT
thumbnail_url
TEXT
is_primary
BOOLEAN
approval_status
VARCHAR(20)
uploaded_at
TIMESTAMP


ProfileDocument
Column
Type
id
UUID
profile_id
UUID
document_type
VARCHAR(50)
file_url
TEXT
approval_status
VARCHAR(20)
uploaded_at
TIMESTAMP

Document Types
ID_PROOF
BIODATA
EDUCATION
INCOME
OTHER


Proposal
Most important table.
Column
Type
id
UUID
proposal_number
VARCHAR(50)
sender_agency_id
UUID
receiver_agency_id
UUID
bride_profile_id
UUID
groom_profile_id
UUID
proposal_status
VARCHAR(30)
proposal_notes
TEXT
created_by
UUID
created_at
TIMESTAMP


ProposalActivity
Column
Type
id
UUID
proposal_id
UUID
activity_type
VARCHAR(50)
activity_notes
TEXT
performed_by
UUID
created_at
TIMESTAMP


Pipeline
Column
Type
id
UUID
proposal_id
UUID
current_stage
VARCHAR(50)
stage_date
TIMESTAMP
updated_by
UUID


AICompatibility
Purpose
Caches AI-calculated compatibility score and detailed explanation between profiles.
Column
Type
Required
Notes
id
UUID
Yes
PK
bride_profile_id
UUID
Yes
FK to AgencyProfile
groom_profile_id
UUID
Yes
FK to AgencyProfile
score
INTEGER
Yes
Value 0-100
explanation
TEXT
Yes
Detailed matching explanation
created_at
TIMESTAMP
Yes

updated_at
TIMESTAMP
Yes


Indexes
bride_profile_id, groom_profile_id (Unique)
score


AgencyPartnership
Column
Type
id
UUID
agency_id
UUID
partner_agency_id
UUID
trust_level
INTEGER
status
VARCHAR(20)
created_at
TIMESTAMP

Trust Level
1-5


Conversation
Column
Type
id
UUID
proposal_id
UUID
created_at
TIMESTAMP


Message
Column
Type
id
UUID
conversation_id
UUID
sender_user_id
UUID
message_text
TEXT
attachment_url
TEXT
sent_at
TIMESTAMP


FollowUp
Column
Type
id
UUID
proposal_id
UUID
assigned_user_id
UUID
due_date
DATE
remarks
TEXT
status
VARCHAR(20)

Status
OPEN
COMPLETED
CANCELLED


ProfileAccessLog
One of your differentiators.
Column
Type
id
UUID
profile_id
UUID
viewed_by_user_id
UUID
agency_id
UUID
viewed_at
TIMESTAMP
duration_seconds
INTEGER


AuditLog
Column
Type
id
UUID
agency_id
UUID
user_id
UUID
entity_type
VARCHAR(50)
entity_id
UUID
action
VARCHAR(100)
ip_address
VARCHAR(50)
created_at
TIMESTAMP


Notification
Column
Type
id
UUID
user_id
UUID
title
VARCHAR(200)
message
TEXT
notification_type
VARCHAR(50)
read_flag
BOOLEAN
created_at
TIMESTAMP


One Enhancement Before Freezing
I would add:
ProfileTag

Examples:
NRI
Second Marriage
Doctor
IT Professional
High Priority
Premium Client
Verified

This will make searching, filtering, and AI recommendations much easier later.
After this, I would consider the data model ~90% stable and move to OpenAPI API Contract Design. That becomes the blueprint for Codex-generated backend services.

