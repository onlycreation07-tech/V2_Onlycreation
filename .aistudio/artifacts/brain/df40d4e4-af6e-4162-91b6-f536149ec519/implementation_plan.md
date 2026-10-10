# Implementation Plan: Prompt Fidelity, Autoplay Elimination & Hybrid Team Bot Toggle

## User Review Required
- **Video Playback**: As requested, all autoplay on page load and reload will be disabled across the creative studio and dispatch tools. A thumbnail preview with a manual Play/Pause control will be displayed.
- **AI Generation Engine**: We will eliminate the disconnected stock fallbacks (such as generic ocean videos and randomized seed images) and route prompt requests directly to verified Gemini & Veo generation pipelines with strict prompt fidelity.
- **Hybrid Team Bot Toggle**: Department managers can now be toggled ON (AI-Supervised) or OFF (Human-Led Mode) per team. When toggled OFF, human employees manage tasks manually with no automated bot interventions.

---

## Proposed Changes

### 1. Fix Continuous Video Autoplay on Load & Reload
#### `src/components/create/VeoVideoStudio.tsx`
- Remove `autoPlay` and `loop` attributes from the video player.
- Add an explicit playback state (`isPlaying`, `userInteracted`) with a custom play/pause overlay and video thumbnail.
- On page load / app refresh, do not auto-play any previously restored background task videos.
- Add mute/unmute and seek controls with clean user interactions.

#### `src/components/dispatch/CreatorDispatchScreen.tsx` & `src/components/partner/TrainingReelsSection.tsx`
- Remove involuntary `autoPlay` loops on unselected or background cards.

---

### 2. Fix Image & Video Generation Prompt Alignment (No More Random Results)
#### `server.ts`
- Fix model endpoints in `/api/ai/generate-image`:
  - Route through verified `@google/genai` image generation pipelines (`gemini-2.5-flash-image` / `gemini-3.1-flash-lite-image` / `imagen-3.0-generate-002`).
  - Eliminate random seed overrides and fallback stock image mismatches so output visuals directly reflect the prompt's subject, lighting, and composition.
- Fix model endpoints in `/api/ai/generate-video` & `/api/ai/video-status`:
  - Route to verified Veo endpoints (`veo-3.1-lite-generate-preview` / `veo-2.0-generate-001`).
  - Remove generic stock videos (like `oceans.mp4`) as output fallbacks; ensure preview videos reflect the specific creative prompt and scene storyboard.
- Provide transparent error messages if quota or key restrictions arise, instead of silently delivering unrelated random videos.

#### `src/services/geminiService.ts`
- Verify payload packaging so user prompt parameters (aspect ratio, style, brand details) are preserved cleanly when sent to the backend.

---

### 3. Hybrid Team: AI Bot Manager Toggle (On / Off) & Dynamic Assignment
#### `src/types/index.ts`
- Extend `DepartmentTeam` interface with `isAiManagerEnabled: boolean` and optional `assignedBotId?: AIAgentId | null`.

#### `src/services/teamHubService.ts`
- Initialize `isAiManagerEnabled: true` for default teams.
- Add `toggleDepartmentBot(deptId: string, enabled: boolean): Promise<DepartmentTeam>`.
- Add `assignDepartmentBot(deptId: string, botId: AIAgentId | null): Promise<DepartmentTeam>`.
- When `isAiManagerEnabled` is `false`, configure department workflows to "Human-Led Mode" (manual task assignment, no autonomous bot intervention).

#### `src/components/agents/DepartmentTeamsRoster.tsx`
- Add an interactive On/Off Toggle Switch ("AI Bot Manager: Active / Off") on each department card and inside the Department Command Center.
- Display distinctive mode badges:
  - **AI-Supervised** (emerald bot icon, manager role badge, 1-on-1 chat button).
  - **Human-Led Mode** (slate/amber user icon, manual workflow banner, "Assign Bot" quick button).
- Enable assigning or unassigning any AI Agent (Ketan, Nova, Echo, Vault) directly with a modal or dropdown.

---

## Verification Plan

### Automated Verification
- Run `compile_applet` to ensure TypeScript compilation, interface compatibility, and server types pass with zero errors.
- Run `lint_applet` to verify no lint errors or missing imports.

### Manual Verification Steps
1. **Video Autoplay Verification**:
   - Reload the application. Confirm that no audio or video plays automatically in the background.
   - Navigate to the Creative Studio -> Veo 3 Video Studio. Verify video player shows a pause/play thumbnail without unsolicited playback.
2. **Prompt Alignment Verification**:
   - Submit a specific prompt (e.g., "Luxury watch floating in dark marble water, cinematic gold lighting").
   - Confirm generation output strictly aligns with the prompt subject and does not yield random generic fallbacks.
3. **Hybrid Team Bot Toggle Verification**:
   - Navigate to Hybrid Team Hub -> Department Teams.
   - Toggle the AI Bot switch for "Growth & Acquisition" from ON to OFF.
   - Confirm the status updates immediately to "Human-Led Mode", the AI manager card reflects disabled state, and auto-actions are paused.
   - Toggle it back ON or assign another bot (e.g., Nova or Echo) and confirm state updates and persists across reload.
