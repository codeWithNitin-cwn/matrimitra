# CR-0001: Bring AI Compatibility to MVP

* **Status**: Implemented
* **Date**: 2026-06-09
* **Author**: AI Coding Assistant

---

## 1. Objective & Description
This Change Request proposes moving the **AI Compatibility** features from Phase 3 (Roadmap) into the **Phase 1 MVP**. 

In the matrimonial agency context, matchmaking is heavily reliant on manual screening. Introducing AI-assisted compatibility scoring and natural language matchmaking justifications at the MVP stage will enable agencies to quickly filter and present matches with clear rationale.

For the MVP, "AI Compatibility" is defined as:
1. **AI-Ready Profile Data**: Every client profile includes an AI-generated, structured text summary (`aiSummary`) capturing their core personality, expectations, and lifestyle.
2. **AI Compatibility Scoring**: A service interface that calculates a compatibility score (0-100) between two profiles (Bride and Groom) based on profile details and expectations.
3. **AI Match Explanation**: A text-based justification explaining *why* the two profiles are compatible or highlighting potential areas of concern, shown to agency staff during match searches and proposal reviews.

---

## 2. Justification
* **Competitive Edge**: Heuristic and AI-driven matchmaking sets MatriMitra apart from basic CRMs and traditional Excel sheets.
* **Agency Efficiency**: Agency owners and executives spend hours manually reading through profiles. An AI summary and match explanation drastically reduce screening time.
* **Immediate Value**: Having compatibility scores available in Phase 1 provides instant verification for cross-agency collaborations.

---

## 3. Impact Analysis

### Specifications (`ai-context/`)
* **[pdd.md](file:///c:/MyProjects/codex/Matrimitra/ai-context/pdd.md)**:
  * Move `AI compatibility` from **Excluded** to **Included** in Phase 1 (Section 8).
  * Update Module 4 (Match Discovery) to include AI Compatibility Scoring and Match Explanations (Section 9).
  * Update Module 3 (Profile Management) to include an AI Profile Summary (Section 9).
  * Revise Phase 1 and Phase 3 definitions in the Product Roadmap (Section 13).
* **[fdd.md](file:///c:/MyProjects/codex/Matrimitra/ai-context/fdd.md)**:
  * Update Match Search (Section 9) and Match Proposal Workflow (Section 10) to include references to AI scores and explanations.
  * Move pipeline milestones/rules associated with AI matching to Phase 1.
* **[sld.md](file:///c:/MyProjects/codex/Matrimitra/ai-context/sld.md)**:
  * **S05 (Client Profile Details)**: Add an AI Summary section or tab.
  * **S08 (Match Search)**: Display compatibility score (e.g. `88% Match`) on candidate cards.
  * **S09 (Match Proposal)** & **S11 (Proposal Detail)**: Display compatibility scores and AI-generated explanations of compatibility.
* **[database-dictionary.md](file:///c:/MyProjects/codex/Matrimitra/ai-context/database-dictionary.md)**:
  * Add `ai_summary` field to `AgencyProfile`.
  * Add a new table `AICompatibility` to cache scores and explanations between profiles.

### Database Schema (`database/`)
* **[schema.prisma](file:///c:/MyProjects/codex/Matrimitra/database/prisma/schema.prisma)**:
  * Update model `AgencyProfile` to include an `aiSummary` field.
  * Create a new model `AICompatibility` mapping the relations between a bride profile and a groom profile with score and explanation fields.

---

## 4. Proposed Changes

### A. Database Schema Updates
Add `aiSummary` to `AgencyProfile` and create `AICompatibility` cache table:

```prisma
model AgencyProfile {
  // Existing fields...
  aiSummary         String?       @db.Text
  
  // Relations to AICompatibility
  brideCompatibilities AICompatibility[] @relation("BrideCompatibility")
  groomCompatibilities AICompatibility[] @relation("GroomCompatibility")
}

model AICompatibility {
  id              String   @id @default(uuid())
  brideProfileId  String
  groomProfileId  String
  score           Int      // 0-100 score
  explanation     String   @db.Text
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  brideProfile    AgencyProfile @relation("BrideCompatibility", fields: [brideProfileId], references: [id])
  groomProfile    AgencyProfile @relation("GroomCompatibility", fields: [groomProfileId], references: [id])

  @@unique([brideProfileId, groomProfileId])
  @@index([score])
}
```

### B. Specification Updates
1. **[pdd.md](file:///c:/MyProjects/codex/Matrimitra/ai-context/pdd.md)**:
   * Shift `AI compatibility` from Section 8 "Excluded" to Section 8 "Included".
   * Add a subsection in Section 9 (Module 4) explaining AI scoring.
2. **[fdd.md](file:///c:/MyProjects/codex/Matrimitra/ai-context/fdd.md)**:
   * Document how the Match Search engine displays the compatibility score.
3. **[sld.md](file:///c:/MyProjects/codex/Matrimitra/ai-context/sld.md)**:
   * Document fields for AI Compatibility in the corresponding screen designs.
