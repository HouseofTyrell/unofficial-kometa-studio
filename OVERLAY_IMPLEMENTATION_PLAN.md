# Overlay Builder Implementation Plan

## Problem Statement

Comparing Kometa's output vs Studio's current implementation:

### Kometa Output (Screenshot 2)

- ✅ 4K resolution badge (top-left)
- ✅ "DOLBY DV" badge (top-left, next to 4K)
- ✅ "TRUE HD ATMOS" audio badge (top-left)
- ✅ "FRESH 83%" RT badge (right side, with RT tomato logo)
- ✅ "IMDb 8.0" badge (right side, with IMDb logo)
- ✅ "TMDB 78%" badge (right side, with TMDB logo)
- ✅ "WATCHED" verified badge (bottom-right corner)

### Studio Output (Screenshot 1)

- ✅ "4K" resolution badge (top-left) - sizing off
- ❌ Missing "DOLBY DV" badge
- ❌ Missing "TRUE HD ATMOS" badge
- ❌ "7.8" badge (no logo, wrong position)
- ❌ "8.0" badge (no logo, wrong position)
- ❌ "7.8" badge duplicate (no logo, wrong position)
- ❌ Another "7.8" badge (no logo, wrong position)
- ❌ Ribbon at top (not in Kometa output)

### Root Causes

1. **Missing Overlay Types**: Audio codec, video codec overlays not implemented
2. **Asset Resolution Failing**: Rating logos not loading from config/Kometa defaults
3. **Sizing Issues**: Badge dimensions don't match Kometa's exact specifications
4. **Duplicate Elements**: Multiple rating badges with same value
5. **Missing Template Variables**: Not parsing all Kometa template_variables correctly

---

## Implementation Plan

### Phase 1: Complete Asset Resolution Pipeline ✅ STARTED

**Goal**: Ensure all images (logos, badges, etc.) are loaded from the correct sources.

**Asset Resolution Priority**:

1. Config template_variables (`rating1_image_url`, custom URLs)
2. Kometa defaults repository (GitHub URLs for IMDb, TMDB, RT logos)
3. Fallback to placeholder/text-only

**Files to Update**:

- ✅ `apps/server/src/routes/config.routes.ts` - Extract assets from config
- ✅ `apps/web/src/api/client.ts` - API method to fetch assets
- ✅ `apps/web/src/pages/OverlayBuilderPage.tsx` - Load and cache assets
- ✅ `apps/web/src/services/kometa-defaults.service.ts` - Use assets in overlay generation
- ⚠️ `apps/web/src/components/overlay/PosterPreview.tsx` - Render images correctly

**Current Status**: Asset extraction implemented, but images not rendering correctly.

**Next Steps**:

1. Debug why logos aren't showing in badges
2. Verify GitHub URLs are accessible
3. Add CORS handling for external images
4. Test with actual user config that has custom image URLs

---

### Phase 2: Fix Overlay Sizing & Positioning

**Goal**: Match Kometa's exact badge dimensions and positions.

**Kometa Specifications** (1000x1500 canvas):

```
Resolution Badge:
  - back_width: 305
  - back_height: 105
  - font_size: 36
  - position: left-top
  - offset: (15, 15)

Ratings Badge:
  - back_width: 270
  - back_height: 80
  - back_padding: 15
  - back_radius: 30
  - font_size: 63
  - addon_offset: 15 (space between logo and text)
  - position: right-bottom
  - vertical spacing: 95px between badges (80px height + 15px gap)

Audio/Video Codec Badge:
  - font_size: 26
  - padding: 8
  - border_radius: 6
  - position: left-top (stacked below resolution)
```

**Files to Update**:

- `apps/web/src/services/kometa-defaults.service.ts` - Verify all dimensions match Kometa
- `apps/web/src/components/overlay/PosterPreview.tsx` - Verify rendering uses correct dimensions

**Tasks**:

1. Audit all badge dimensions against Kometa defaults files
2. Fix resolution badge sizing (currently showing too small)
3. Ensure rating badges stack correctly with 95px spacing
4. Position audio/video codec badges correctly (left-top, below resolution)

---

### Phase 3: Add Missing Overlay Types

**Goal**: Implement all overlay types that Kometa supports.

**Priority Overlays to Add**:

1. **video_codec** - Shows video codec (H.264, HEVC, AV1)
   - Template: badge with codec name
   - Position: left-top (below resolution or audio_codec)
   - Example: "HEVC", "H.264", "AV1"

2. **audio_codec** - Shows audio codec (already partially implemented)
   - Template: badge with codec name
   - Position: left-top (below resolution)
   - Example: "DOLBY DV", "TRUE HD ATMOS", "DTS-HD"

3. **content_rating** - Shows content rating (PG, PG-13, R, TV-MA)
   - Template: badge with rating
   - Position: configurable
   - Example: "R", "PG-13", "TV-MA"

4. **studio** - Shows studio logo (Disney, Warner Bros, etc.)
   - Template: image overlay
   - Position: configurable
   - Requires logo image URLs

5. **network** - Shows network logo (for TV shows)
   - Template: image overlay
   - Position: configurable
   - Requires logo image URLs

6. **versions** - Shows version info (Director's Cut, Extended, etc.)
   - Template: badge with text
   - Position: configurable

7. **mediastinger** - Shows if movie has post-credits scene
   - Template: small icon/badge
   - Position: configurable

**Implementation Steps**:

1. Add overlay type handlers to `kometa-defaults.service.ts`
2. Define template_variables for each type
3. Add asset URLs for logos (studio, network)
4. Test with sample metadata

---

### Phase 4: Fix Template Variables Parsing

**Goal**: Correctly parse and apply all Kometa template_variables.

**Common Issues**:

- Not all template_variables are being extracted from config
- Some variables have default values that aren't being applied
- Rating image types (imdb, tmdb, rt_tomato) not mapping to correct logos

**Template Variables by Overlay Type**:

```yaml
resolution:
  - horizontal_align: left | center | right
  - vertical_align: top | center | bottom
  - horizontal_offset: 15
  - vertical_offset: 15
  - back_width: 305
  - back_height: 105
  - back_color: #00000099
  - font_size: 36

ratings:
  - rating1: critic | audience | user
  - rating1_image: imdb | tmdb | rt_tomato | rt_critic
  - rating1_font_size: 63
  - rating1_back_color: #00000099
  - rating1_font_color: #FFFFFF
  - rating2: (same as rating1)
  - rating3: (same as rating1)
  - horizontal_position: right
  - vertical_align: bottom
  - horizontal_offset: 15
  - vertical_offset: 15
  - addon_offset: 15
  - back_width: 270
  - back_height: 80
  - back_padding: 15
  - back_radius: 30

audio_codec:
  - horizontal_align: left
  - vertical_align: top
  - horizontal_offset: 15
  - vertical_offset: 130  (below resolution)
  - font_size: 26
  - back_color: rgba(255, 152, 0, 0.9)
  - padding: 8
  - border_radius: 6

status (TV shows):
  - back_color_airing: #016920
  - back_color_returning: #81007F
  - back_color_canceled: #B52222
  - back_color_ended: #000847
  - font_size: 60
  - back_height: 85
```

**Files to Update**:

- `apps/web/src/services/kometa-defaults.service.ts` - Parse template_variables correctly
- `apps/server/src/routes/config.routes.ts` - Extract all template_variables from overlay files

**Tasks**:

1. Verify template_variables extraction from config
2. Apply default values when variables not specified
3. Test with various config combinations
4. Document all supported template_variables

---

### Phase 5: Improve Metadata Integration

**Goal**: Get comprehensive metadata from all sources (TMDB, Plex, config).

**Metadata Sources**:

1. **TMDB API**: Basic info, ratings
2. **Plex Server**: Resolution, codecs, audio, ratings (if populated by Kometa)
3. **Config**: Manual overrides, custom values

**Issues**:

- TMDB doesn't provide resolution, codecs, or audio info
- Plex integration requires credentials
- Some metadata is missing for demo/test media

**Enhancements**:

1. Add OMDb API integration for IMDb ratings (requires API key)
2. Improve Plex rating extraction (handle all rating sources)
3. Add metadata override UI (manual input for testing)
4. Cache metadata to reduce API calls

**Files to Update**:

- `apps/web/src/services/tmdb.service.ts` - Add OMDb integration
- `apps/web/src/services/plex.service.ts` - Improve rating extraction
- `apps/web/src/pages/OverlayBuilderPage.tsx` - Add metadata override UI

---

### Phase 6: Build Element-Based Editor

**Goal**: Allow users to manually edit overlay elements (position, size, styling).

**Editor Features**:

1. **Element List**: Show all overlay elements with type and position
2. **Property Editor**: Edit position, size, colors, fonts for selected element
3. **Add/Remove**: Add new elements, delete existing ones
4. **Drag & Drop**: Visual drag-to-position on preview canvas
5. **Presets**: Quick apply common overlay configurations
6. **YAML Export**: Generate YAML code for overlay configuration

**UI Components**:

- ✅ Element list (already implemented)
- ⚠️ Property editor (partially implemented, needs refinement)
- ❌ Visual drag & drop
- ✅ Preset selector (already implemented)
- ⚠️ YAML code view (implemented but needs template_variables support)

**Files to Update**:

- `apps/web/src/components/overlay/OverlayElementEditor.tsx` - Enhance property editor
- `apps/web/src/components/overlay/PosterPreview.tsx` - Add drag & drop support
- `apps/web/src/components/overlay/OverlayCodeView.tsx` - Generate proper YAML with template_variables

**Tasks**:

1. Add visual drag & drop to canvas
2. Improve property editor UI (better organization, validation)
3. Add element naming/labeling
4. Support template_variables in YAML export
5. Add undo/redo functionality

---

### Phase 7: Config Integration & Saving

**Goal**: Save user-created overlays back to Kometa config.

**Save Workflow**:

1. User creates/edits overlay elements
2. Click "Save to Config"
3. Select target library (Movies, TV Shows, etc.)
4. System generates overlay_files entry with template_variables
5. Add to config YAML

**Files to Update**:

- `apps/web/src/components/overlay/SaveOverlayDialog.tsx` - Save dialog UI
- `apps/server/src/yaml/generator.ts` - Generate overlay YAML
- `apps/server/src/routes/config.routes.ts` - Update config with overlays

**Tasks**:

1. Implement SaveOverlayDialog (UI for selecting library, naming overlay)
2. Convert overlay elements to template_variables format
3. Generate YAML with proper structure
4. Update config and persist to disk/database

---

## Testing Plan

### Test Cases

1. **Asset Loading**
   - [ ] Rating logos load from Kometa GitHub
   - [ ] Custom image URLs load from config
   - [ ] Fallback to text-only when images fail

2. **Overlay Types**
   - [ ] Resolution badge renders correctly
   - [ ] Ratings badges render with logos (IMDb, TMDB, RT)
   - [ ] Audio codec badge renders
   - [ ] Video codec badge renders
   - [ ] Status ribbon renders (TV shows)
   - [ ] Ribbon overlay renders

3. **Positioning & Sizing**
   - [ ] Badges match Kometa dimensions exactly
   - [ ] Multiple rating badges stack with correct spacing
   - [ ] Position calculations match Kometa's coordinate system
   - [ ] Offsets apply correctly

4. **Template Variables**
   - [ ] All template_variables parse from config
   - [ ] Default values apply when not specified
   - [ ] Custom values override defaults
   - [ ] Rating image types map to correct logos

5. **Metadata Integration**
   - [ ] TMDB data loads correctly
   - [ ] Plex data loads when configured
   - [ ] Ratings merge correctly (Plex preferred over TMDB)
   - [ ] Missing metadata doesn't break rendering

6. **Editor**
   - [ ] Element list shows all overlays
   - [ ] Property editor updates elements
   - [ ] Add/remove elements works
   - [ ] Presets apply correctly
   - [ ] YAML export generates valid Kometa config

---

## Implementation Priority

### Immediate (Blocking Issues)

1. ✅ Fix asset resolution pipeline (logos not showing)
2. ✅ Fix badge sizing to match Kometa exactly
3. ✅ Add audio_codec and video_codec overlay types
4. ✅ Fix rating badge duplication issue

### Short-term (Usability)

1. ⏳ Improve template_variables parsing
2. ⏳ Add missing overlay types (content_rating, studio, network)
3. ⏳ Enhance element editor UI
4. ⏳ Add visual drag & drop

### Long-term (Polish)

1. ⏳ OMDb API integration for IMDb ratings
2. ⏳ Metadata override UI
3. ⏳ Undo/redo functionality
4. ⏳ Save to config functionality

---

## Key Files Reference

| Component          | File Path                                                  |
| ------------------ | ---------------------------------------------------------- |
| Overlay generation | `apps/web/src/services/kometa-defaults.service.ts`         |
| Canvas rendering   | `apps/web/src/components/overlay/PosterPreview.tsx`        |
| Element editor     | `apps/web/src/components/overlay/OverlayElementEditor.tsx` |
| Asset extraction   | `apps/server/src/routes/config.routes.ts`                  |
| Plex integration   | `apps/web/src/services/plex.service.ts`                    |
| TMDB integration   | `apps/web/src/services/tmdb.service.ts`                    |
| Config schema      | `packages/shared/src/schemas/config.schema.ts`             |
| Main page          | `apps/web/src/pages/OverlayBuilderPage.tsx`                |

---

## Notes

- Kometa uses 1000x1500 coordinate system for movie posters
- Studio displays at 500x750 (50% scale)
- All coordinates must be calculated on 1000x1500 and scaled for display
- Template variables use `<<variable>>` syntax in YAML
- Rating logos come from Kometa GitHub: `https://raw.githubusercontent.com/Kometa-Team/Kometa/master/defaults/overlays/images/rating/{TYPE}.png`
