# Implementation Plan: OnlyCreation Distinct Workflows & Production Engines

## Executive Summary
This implementation plan addresses the homepage card routing issue and builds out four dedicated, functional creative workflows for OnlyCreation:
1. **Homepage Routing & Workflow Decoupling**: Eliminate generic starter prompts sent to the standard chat handler. Each card immediately activates its dedicated experience while persisting workflow state across navigation tabs.
2. **Create an Ad (Interactive Creative Director)**: A dedicated full-screen, step-by-step creative brief interview, 2-direction proposal synthesis via `gemini-3.8-flash`, actual ad image generation with `gemini-3.1-flash-lite-image`, and live typography/placement overlay editing.
3. **Content Engine (Full Video Production Workspace)**: A dedicated top-level workspace (`content-engine`) supporting video generation (Veo 3.1 Lite), video editing with client-side Canvas and WebCodecs plus server-side export worker, timestamped smart clipping with 9:16 vertical reframing, and structured video pacing/hook analysis.
4. **AI Team Hub (Unifying Agents, Employees & Approvals)**: One coordinating conversation with a Project Manager who analyzes goals, requests missing brief data, breaks down workflows, and assigns real deliverables to specialist agents (Creative Director, Copywriter, Image Designer, Video Editor, Content Strategist) and real workspace employees.

---

## 1. User Review Required & Design Choices
- **Create an Ad UI**: Rendered as a dedicated, focused full-screen guided workspace (`view: 'ad-wizard'`) with persistent step preservation, breadcrumbs, back-step editing, and real-time concept cards.
- **Content Engine Location**: Added as a first-class top-level workspace in navigation (`view: 'content-engine'`) alongside `team-hub` and `studio`.
- **Video Editing Pipeline**: Implemented with client-side HTML5 Canvas + WebCodecs / MediaRecorder for instant preview, trimming, splitting, aspect-ratio reframing, and text overlay rendering, accompanied by a server export worker (`/api/content-engine/export`) for high-resolution file generation.
- **AI Models Grounding**:
  - Creative Interview, Brief Synthesis & Video Analysis: `gemini-3.8-flash`
  - Ad Visual Generation & Variations: `gemini-3.1-flash-lite-image`
  - Video Generation: `veo-3.1-lite-generate-preview` (with clear queue progress and graceful fallback)

---

## 2. Proposed Architecture & Component Structure

### A. Navigation & Workflow State Management (`src/App.tsx`, `src/types/index.ts`)
- Add `'ad-wizard'` and `'content-engine'` to the `View` type.
- Add warm-tab state keeping for:
  - `activeAdWizardState`: Current step, collected brief questions, uploaded logos/assets, chosen creative direction, generated ads.
  - `activeContentEngineState`: Active mode (`generate`, `edit`, `clipping`, `analysis`), active video file/URL, clip segments, export status.
- Update `CreationAIChat.tsx` card click handlers:
  - **Create an Ad** $\rightarrow$ `onOpenAdWizard()` (switches to `ad-wizard` view with fresh or resumed brief)
  - **Generate Images** $\rightarrow$ `onOpenStudio('images')` (switches directly to Image Studio)
  - **Content Engine** $\rightarrow$ `onOpenContentEngine()` (switches to `content-engine` video workspace)
  - **AI Team Hub** $\rightarrow$ `onOpenTeamHub()` (switches to `team-hub` / unified collaborative workspace)

### B. "Create an Ad" Workflow (`src/components/ad-wizard/`)
- **`AdWizardWorkspace.tsx`**: Full-screen interview and production experience.
  - **Step 1: Product & Problem**: Product name, category, customer avatar, customer pain point.
  - **Step 2: Offer & Benefits**: Main value proposition, pricing/discounts (no fabricated claims), guarantee or proof points.
  - **Step 3: Placement & Call to Action**: Channel (Instagram 9:16, Facebook 1:1, YouTube 16:9, Billboard), primary viewer action (Shop Now, Book Consultation, Learn More).
  - **Step 4: Visual Style & Brand Assets**: Upload logos, product packshots, reference images. Toggle: "Preserve uploaded product photo unmodified" vs "AI re-stylized scene". Tone selector (direct, premium, energetic, minimal).
  - **Step 5: Brief Confirmation & Direction Proposal**:
    - Backend endpoint `POST /api/ad-wizard/propose-directions`: Calls `gemini-3.8-flash` to synthesize 2 contrasting creative directions with Hook/Headline, Visual Concept, Supporting Copy, and CTA.
  - **Step 6: Ad Generation & Studio Editor**:
    - Backend endpoint `POST /api/ad-wizard/generate-ad`: Calls `gemini-3.1-flash-lite-image` with clean placement-safe margins and brand style.
    - Interactive overlay editor: Change headline text, edit CTA badge, adjust background style, generate variations, export high-res PNG/JPG, and convert directly to a workspace project.

### C. "Content Engine" Workspace (`src/components/content-engine/`)
- **`ContentEngineWorkspace.tsx`**:
  - **Mode 1: Generate Video**:
    - Collect goal, target audience, duration (5s/10s/15s), aspect ratio (9:16, 16:9), script prompt.
    - Storyboard & Script review step with scene-by-scene timing.
    - Calls `POST /api/content-engine/generate` (Veo model with progress polling and saved project history).
  - **Mode 2: Edit Video**:
    - Upload video file or pick from project library.
    - Trimming sliders (in/out points), split segments, aspect-ratio change (16:9 to 9:16 letterbox/center-crop), text caption overlays, audio volume ducking.
    - Interactive HTML5 Canvas player preview + client/server WebCodecs export worker.
    - Generates downloadable MP4/WebM with preserved source versioning.
  - **Mode 3: Clipping**:
    - Upload/select video.
    - Transcribe video with timestamps using `gemini-3.8-flash` multimodal analysis.
    - Detect candidate viral moments / strong hooks with explicit timestamp ranges (`[00:04 - 00:32]`) and concrete rationale (e.g. "Contains self-contained insight about product pricing").
    - Fine-tune start/end trim points, enable 9:16 vertical smart crop with customizable animated caption styling.
    - Export selected clips as standalone videos.
  - **Mode 4: Video Analysis**:
    - Timestamped breakdown: 0-3s hook retention score, pacing audit, audio-visual clarity, caption accessibility, CTA placement.
    - Differentiates factual observations from creative optimization suggestions.
    - Optional search grounding verification when citing external trend benchmarks.

### D. "AI Team Hub" Unification (`src/components/team-hub/`)
- Unified coordination layer in `UnifiedTeamHub.tsx`:
  - **Coordinating Project Manager (Nova / Lead Producer)**: Evaluates complex user goals (e.g. "Create a campaign for this product and have my editor prepare three reels").
  - Gathers missing requirements without redundant questions.
  - Breaks goals into structured tasks:
    - Task 1 $\rightarrow$ Creative Director (Strategy & Concept)
    - Task 2 $\rightarrow$ Copywriter (Ad copy & captions)
    - Task 3 $\rightarrow$ Image Designer (Product visuals)
    - Task 4 $\rightarrow$ Video Editor / Selected Team Employee (Video reel edits)
  - Connects to existing actual workspace members (`WorkspaceMember` records from `teamHubController.ts`), deadlines, and approvals.
  - Real tool invocation: agents run connected tools (`/api/ad-wizard/propose-directions`, `/api/creation-ai/create-ad-plan`, `/api/content-engine/export`) and return real deliverables into the project drawer.

---

## 3. Step-by-Step Implementation Plan

### Phase 1: Homepage Decoupling & "Create an Ad" Full Flow (Immediate)
1. **Update View & Navigation Types**:
   - Add `'ad-wizard'` and `'content-engine'` to `src/types/index.ts`.
   - Update `TopNavbar.tsx`, `AppDrawer.tsx`, and `BottomNav.tsx` with dedicated navigation links and badges.
2. **Fix Card Click Handlers in `CreationAIChat.tsx`**:
   - Connect "Create an Ad" to `onOpenAdWizard()`.
   - Connect "Generate Images" to `onOpenStudio('images')`.
   - Connect "Content Engine" to `onOpenContentEngine()`.
   - Connect "AI Team Hub" to `onOpenTeamHub()`.
3. **Build Backend Endpoints for Ad Wizard** (`server/controllers/adWizardController.ts`):
   - `POST /api/ad-wizard/propose-directions`: Uses `gemini-3.8-flash` with structured JSON schema to generate 2 distinct creative directions.
   - `POST /api/ad-wizard/generate-ad`: Uses `gemini-3.1-flash-lite-image` with product photo context and brand guidelines.
   - `POST /api/ad-wizard/variation`: Produces ad variations or adapts to alternate aspect ratios.
4. **Build Frontend `src/components/ad-wizard/AdWizardWorkspace.tsx`**:
   - Multi-step interview cards with input validation, file uploader for logos/products, and product lock toggle.
   - Creative direction selector with side-by-side comparison cards.
   - Live canvas ad preview with editable text overlay, download button, and 1-click project conversion.
5. **Mount `AdWizardWorkspace` in `src/App.tsx`**:
   - Retain wizard state across tab switching.

### Phase 2: Content Engine Video Workspace
1. **Build Backend Endpoints for Video Processing** (`server/controllers/contentEngineController.ts`):
   - `POST /api/content-engine/transcribe-and-clip`: Extracts timestamped transcripts and suggests hook segments.
   - `POST /api/content-engine/analyze`: Returns timestamped hook, pacing, and caption audit.
   - `POST /api/content-engine/generate`: Queues video generation via Veo model with status tracking.
   - `POST /api/content-engine/export`: Server-side rendering worker saving rendered edits as new versions.
2. **Build Frontend `src/components/content-engine/ContentEngineWorkspace.tsx`**:
   - Sub-tabs for `Generate`, `Edit`, `Clipping`, `Analysis`.
   - Video upload, player, trimming timeline, and WebCodecs export.
   - Suggested clips list with adjustable time handles and 9:16 export.
   - Video audit panel with timestamp jumps.
3. **Mount `ContentEngineWorkspace` in `src/App.tsx`**.

### Phase 3: AI Team Hub Unification & Real Agent Execution
1. **Extend Team Hub with Coordinating Manager Chat**:
   - Enhances team hub with a goal-oriented dispatcher that parses multi-step instructions and assigns tasks to specialist bots and real workspace members.
   - Integrates approvals, real task statuses, and deliverable attachments.
2. **Automated Unit & Integration Tests**:
   - Verify homepage routing dispatches to distinct workflows.
   - Verify ad generation returns valid image URLs and respects product lock.
   - Verify video clipping returns valid timestamp ranges.
   - Verify cross-company tenant isolation and AI safety toggles.

---

## 4. Acceptance Criteria & Verification
- [ ] Clicking each homepage card immediately opens its dedicated workflow (no generic chat responses).
- [ ] Switching between workflows preserves work-in-progress without data loss.
- [ ] "Create an Ad" asks the 5 required questions, shows 2 creative directions, and produces an editable ad image.
- [ ] "Content Engine" supports video generation, video editing with export, timestamped clipping, and video audit.
- [ ] "AI Team Hub" breaks multi-step goals into real assigned tasks for agents and actual members.
- [ ] All 23+ automated tests pass, and app builds cleanly via `compile_applet` and `lint_applet`.
