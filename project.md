---

# **WHIZIP PRO - MASTER PROMPT**
## Complete Technical Specification for Development
### Version: 1.0 | Final Release

---

## **PROJECT IDENTITY**

**Application Name:** WhizIP Pro  
**Company/Owner:** Whizpoint Solutions  
**Primary Function:** Enterprise-grade desktop publishing and automated batch ID card design, validation, and precision printing  
**File Extension:** .wzip (WhizIP Pro Batch Document)  
**Default Theme:** Light Mode (user can switch to Dark Mode in settings)

**ICON ASSETS (Project Root Directory):**
- `logo.ico` — Windows application icon, window icon, taskbar icon
- `logo.png` — macOS/Linux application icon, window icon, dock icon
- `document-icon.ico` — Windows .wzip file association icon
- `document-icon.png` — macOS/Linux .wzip file association icon

---

## **PART 1: TECHNOLOGY STACK & CORE ARCHITECTURE**

### **FRONTEND FRAMEWORK**
- React.js 18+ (functional components, hooks)
- State Management: Zustand or Redux Toolkit
- Routing: React Router (for modal/page navigation)

### **STYLING & THEMING ENGINE**
- Tailwind CSS 3.0+
- **Theme Configuration:**
  - **Default: Light Mode**
  - Optional: Dark Mode toggle
  - Primary Accent Color: User-customizable (default: `#1976d2` — Whizpoint Blue)
- UI Component Library: Headless UI or Radix UI (for accessibility)

### **CANVAS RENDERING ENGINE**
- **Primary:** Fabric.js 5.3+ (preferred for mature ecosystem)
- **Alternative:** Konva.js 8.4+ (if Fabric performance issues)
- **Requirement:** Must handle 85.6mm × 54.0mm at 300 DPI export (1009 × 638 px)

### **DESKTOP BACKEND**
- Electron.js 25+ (latest stable)
- IPC Communication: ipcMain/ipcRenderer with contextBridge
- **Security:** Custom protocol handler `whizip://` for local file access
  - Bypasses CSP for local image loading without base64 encoding
- Node.js Integration: fs, path, os modules via preload script
- Window Management: Custom frameless window with native controls

### **DATA PROCESSING LIBRARIES**
- Excel Parsing: xlsx 0.18+ (SheetJS)
- File Compression: archiver 5.3+ (create .wzip)
- File Extraction: unzipper 0.10+ (read .wzip)
- PDF Generation: pdf-lib 1.17+ (A4 layout with mathematical precision)
- Font Discovery: system-font-families 1.0+ (OS font enumeration)

### **BUILD & DISTRIBUTION**
- Build Tool: electron-builder 24+
- **Configuration Requirements:**
  - File Association: .wzip extension
  - File Description: "WhizIP Pro Batch Document"
  - MIME Type: application/x-whizip
  - Windows: Context menu "Open with WhizIP Pro"
  - macOS: Drag-drop .wzip onto dock icon
  - Linux: File manager integration
- Code Signing: Whizpoint Solutions certificate
- Auto-Updater: electron-updater (optional for v2)

---

## **PART 2: GLOBAL APPLICATION WINDOW & UI ARCHITECTURE**

### **CUSTOM TITLE BAR (Frameless Window)**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [logo.png 16px] WhizIP Pro - [CurrentFileName.wzip] - Whizpoint Solutions ││                                    ─ □ ✕                                    │
└─────────────────────────────────────────────────────────────────────────────┘
```
- **Height:** 32px
- **Background:** `#ffffff` (Light mode) / `#1e1e1e` (Dark mode)
- **Drag region:** Entire bar except window controls
- **Double-click:** Toggle maximize
- **Right-click:** System menu (Restore, Move, Size, Minimize, Maximize, Close)

### **MAIN INTERFACE GRID (5 Persistent Zones)**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              TOP RIBBON (48px)                              │
├──────────┬──────────────────────────────────────────┬───────────────────────┤
│          │                                          │                       │
│  LEFT    │         CENTER WORKSPACE                 │      RIGHT            │
│ TOOLBAR  │         (Canvas Container)               │    SIDEBAR            │
│  (48px)  │                                          │    (280px)            │
│          │         • Rulers (X/Y)                   │                       │
│          │         • CR80 Canvas (85.6×54mm)        │  • Properties         │
│          │         • Scroll/Pan support             │  • Layers             │
│          │                                          │  • Context tools      │
│          │                                          │                       │
├──────────┴──────────────────────────────────────────┴───────────────────────┤
│                         BOTTOM STATUS BAR (28px)                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### **ZONE 1: TOP RIBBON (Tabbed Navigation)**
- **Height:** 48px
- **Background:** `#f8f9fa` (Light) / `#2d2d2d` (Dark)
- **Border-bottom:** 1px solid `#dee2e6`
- **Tabs:** FILE | HOME | INSERT | BATCH DATA | [Dynamic Context Tabs]
- Each tab reveals a toolbar with grouped functions

#### **ZONE 2: LEFT TOOLBAR (Vertical Icon Palette)**
- **Width:** 48px
- **Background:** `#f8f9fa`
- **Border-right:** 1px solid `#dee2e6`
- **Tools (top to bottom):**
  - 👆 Select Tool (V)
  - ✋ Pan Tool (H)
  - 🔍 Zoom Tool (Z)
  - ————————————
  - T Text Tool (T)
  - 📷 Photo Placeholder (P)
  - 🖼️ Image Tool (I)
  - ⬜ Rectangle (R)
  - ⭕ Ellipse (O)
  - 📊 Barcode (B)
  - ————————————
  - ↔️ Align (A)
  - ⚙️ Settings

#### **ZONE 3: CENTER WORKSPACE (The Canvas Container)**
- **Background:** `#e9ecef` (neutral gray, not white, to show canvas boundaries)
- **Rulers:**
  - **X-Axis (Top):** 0mm to 85.6mm, major ticks every 10mm, minor every 1mm
  - **Y-Axis (Left):** 0mm to 54.0mm, major ticks every 10mm, minor every 1mm
  - Ruler background: `#ffffff`
  - Ruler text: `#495057`, 10px font
- **Canvas:**
  - **Exact dimensions:** 85.6mm width × 54.0mm height
  - **Background:** `#ffffff` (or user-defined background color/image)
  - **Visual scaling:** CSS transform: scale(zoomLevel)
  - **Mathematical coordinates:** Always in millimeters (0,0 to 85.6,54.0)
  - **Shadow:** `0 4px 6px rgba(0,0,0,0.1)` to lift from workspace
- **Scroll:** Both axes when zoomed > 100%
- **Pan:** Middle-mouse button or Space+drag

#### **ZONE 4: RIGHT SIDEBAR (Context-Sensitive Inspector)**
- **Width:** 280px (resizable, min 240px, max 400px)
- **Background:** `#ffffff`
- **Border-left:** 1px solid `#dee2e6`
- **Sections (collapsible):**

**1. PROPERTIES (always visible)**
- Position: X `[____]` Y `[____]` mm
- Size: W `[____]` H `[____]` mm
- Rotation: `[____]`°
- Opacity: `[████░░░░░░]` 0-100%

**2. LAYERS PANEL**
```
Layer 5: Overlay    [👁️] [🔓] ────────
Layer 4: Photos     [👁️] [🔓] ────────
Layer 3: Dynamic    [👁️] [🔓] ────────
Layer 2: Static     [👁️] [🔓] ────────
Layer 1: Background [👁️] [🔒] ────────
[+] Add Layer
```

**3. CONTEXT TOOLS** (changes based on selection)
- Text selected → Text Format tools
- Image selected → Picture Format tools
- Shape selected → Shape Format tools

#### **ZONE 5: BOTTOM STATUS BAR**
- **Height:** 28px
- **Background:** `#f8f9fa`
- **Border-top:** 1px solid `#dee2e6`

**Left Section (Zoom Controls):**
- `[−]` `[████░░░░░░]` `[+]` (slider)
- `[75% ▼]` dropdown (25%, 50%, 75%, 100%, 150%, 200%, Fit)

**Center Section (Auto-save Status):**
- 🟢 "All changes saved" (green checkmark)
- 🟡 "Saving..." (spinner)
- 🔴 "Unsaved changes" (orange dot)

**Right Section (Batch Mode Toggle):**
- Toggle switch: `[Design Mode | Live Preview Mode]`
- When Live Mode active:
  - `[←]` `[Record 1 of 500]` `[→]`
  - 🔍 Search: `[________________]`

---

## **PART 3: EXHAUSTIVE MENU & RIBBON DICTIONARY**

### **TAB 1: FILE**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🆕 New          (Ctrl+N)  │  📂 Open         (Ctrl+O)                      │
│     Start fresh project   │     Open existing .wzip file                   │
├───────────────────────────┼────────────────────────────────────────────────┤
│ 💾 Save         (Ctrl+S)  │  💾⬇️ Save As    (Ctrl+Shift+S)                │
│     Save current state    │     Save with new name/location                │
├───────────────────────────┴────────────────────────────────────────────────┤
│ 🖨️ Print Configuration                                                      │
│     Open Calibration Modal (Admin PIN protected)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ 📤 EXPORT                                                                    │
│ 📄 Export PDF    → Full batch to A4 PDF with calibration math               │
│ 🖼️ Export Images → High-res PNGs (300 DPI) to selected folder               │
├─────────────────────────────────────────────────────────────────────────────┤
│ 🚪 Exit          (Alt+F4)                                                   │
│     Close application (prompt if unsaved changes)                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

**New File Behavior:**
- Clear canvas, reset state
- If unsaved changes: Show dialog
  - **Title:** "Unsaved Changes"
  - **Message:** "You have unsaved changes in [filename]. Save before closing?"
  - **Buttons:** `[💾 Save Changes]` `[⛔ Discard Changes]` `[❌ Cancel]`

### **TAB 2: HOME (Design & Layout)**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 📋 CLIPBOARD                    🔄 UNDO/REDO                 👁️ VIEW       │
│ ✂️ Cut    (Ctrl+X)           ↩️ Undo   (Ctrl+Z)           ⊞ Grid          │
│ 📄 Copy   (Ctrl+C)           ↪️ Redo   (Ctrl+Y)           📏 Rulers       │
│ 📋 Paste  (Ctrl+V)                                         🧲 Snap        │
│ 👯 Duplicate (Ctrl+D)                                      Grid: [1mm ▼]  │
│ 🗑️ Delete (Del)                                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ 🎯 ALIGNMENT & DISTRIBUTION                                                 │
│ ⬅️ Align Left    ⬆️ Align Top       ↔️ Distribute Horizontally             │
│ ⏺️ Align Center  ⏺️ Align Middle   ↕️ Distribute Vertically                │
│ ➡️ Align Right   ⬇️ Align Bottom                                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Undo/Redo Behavior:**
- Maintain minimum **50-step action history**
- Each distinct action = 1 step:
  - Property change (color, font, size)
  - Move operation (batched if <500ms between moves)
  - Resize operation
  - Delete/Create
  - Style change
- History persists per session (not saved to .wzip)

**Grid & Snap Settings:**
- **Grid sizes:** 1mm (default), 2mm, 5mm
- **Grid color:** `#e0e0e0` (light gray)
- **Snap strength:** 0.5mm (magnetic pull)
- **Show grid:** ON by default
- **Snap to grid:** ON by default

### **TAB 3: INSERT**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 📝 TEXT & DATA           🖼️ IMAGES & GRAPHICS         🔷 SHAPES            │
│ T Static Text          🖼️ Static Image         ⬜ Rectangle                │
│ { } Dynamic Field      📷 Photo Placeholder      ⭕ Ellipse                 │
│                        📊 Barcode/QR Code      📏 Line                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Insert Behaviors:**
- **Static Text:** Insert at canvas center (42.8, 27.0), selected for immediate typing
- **Dynamic Field:** Dropdown of Excel columns → inserts as `{{column_name}}`
- **Photo Placeholder:** Rectangle with corner radius, default 20px radius
- **Static Image:** Open OS picker → insert at center, maintain aspect ratio
- **Barcode/QR:** Insert → bind to column in properties panel

### **TAB 4: BATCH DATA**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 📊 DATA MANAGEMENT                                                          │
│ 📥 Download Excel Template  → Auto-generate from canvas placeholders        │
│ 📤 Import Excel/CSV Data    → Parse and normalize column headers            │
│ 🖼️ Import Photo Folder      → Match photoid to filenames                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ 📋 View Batch Report        → Full-screen validation modal                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## **PART 4: CONTEXT-SENSITIVE FORMAT MENUS (DYNAMIC RIBBONS)**

These tabs appear only when relevant object is selected.

### **DYNAMIC TAB: TEXT FORMAT** (Text object selected)
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🅰️ FONT FAMILY                    📐 TYPOGRAPHY            🎨 COLOR        │
│ [Arial ▼] (OS fonts)              [B] [I] [U] [S]         [A] Text Color  │
│ Size: [12 ▼] pt/px                [⬅️] [⏺️] [➡️] [☰]      [H] Highlight   │
│                                   Alignment                 Opacity: [████] │
├─────────────────────────────────────────────────────────────────────────────┤
│ 🔗 DATA BINDING                                                             │
│ Convert to placeholder: [Select column ▼] → [{{name}}] [✓ Apply]           │
│ Default value if empty: [N/A]                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### **DYNAMIC TAB: PICTURE FORMAT** (Static image selected)
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🎭 ADJUSTMENTS              📐 ARRANGEMENT              ✂️ CROP           │
│ Opacity: [████░░░░░░]       [⤴️] Bring Front           [✂️] Crop Tool    │
│ Brightness: [████░░░░░░]    [⬆️] Forward               [↺] Reset         │
│ Contrast: [████░░░░░░]      [⬇️] Backward                                  │
│                             [⤵️] Send Back                                 │
│                             [🔒] Lock Aspect: [✓]                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

### **DYNAMIC TAB: SHAPE & ID PHOTO FORMAT** (Shape/Photo placeholder selected)
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🎨 FILL & BORDER            🔲 CORNER RADIUS            📏 IMAGE FIT       │
│ Fill: [████] Color          [████░░░░░░] 0-100px        [🔘] Scale to Fill │
│ Border: [2 ▼] px weight                                   (cover, crop)     │
│ Border Color: [████]                                      [⚪] Scale to Fit  │
│                                                             (fit, letterbox)│
└─────────────────────────────────────────────────────────────────────────────┘
```

**Photo Placeholder Specifics:**
- **Corner Radius:** 0px (square) to 100px (fully rounded/pill)
- **Default:** 20px (subtle rounding)
- **Image Fit:**
  - **Scale to Fill:** Image covers entire shape, cropping overflow (default for IDs)
  - **Scale to Fit:** Entire image visible, shape background shows in empty space

---

## **PART 5: DATA IMPORT, VALIDATION & BATCH MANAGER**

### **1. DATA NORMALIZATION ENGINE**

**Excel/CSV Import Process:**
- Read file using xlsx library
- Convert **ALL column headers to lowercase**
- Strip whitespace and special characters
- **Examples:**
  - "Student Name" → "studentname" → `{{studentname}}`
  - "ADM_NO" → "adm_no" → `{{adm_no}}`
  - "Photo ID" → "photoid" → matches photo filenames

**Required Columns Detection:**
- System scans canvas for `{{placeholders}}`
- Creates required column list
- Validates imported data has matching columns
- Missing columns → Warning in Batch Report

### **2. PHOTO MATCHING ENGINE**

**Folder Selection:**
- User selects directory via OS picker
- System reads all files: `fs.readdirSync()`
- **Supported formats:** .jpg, .jpeg, .png, .bmp, .webp, .tiff
- Case-insensitive extension matching

**Matching Logic:**
- Excel column "photoid" value: "001"
- **Matches:** "001.jpg", "001.png", "001.JPG", "001.jpeg"
- **Does NOT match:** "001_copy.jpg", "1001.jpg", "001.pdf"
- Multiple matches: Use first found (alphabetical by extension)

**Photo Loading:**
- Serve via `whizip://` protocol
- Path: `whizip://[temp-dir]/images/001.jpg`
- **NO base64 encoding** (memory optimization)
- Lazy loading: Load only visible records in preview

### **3. THE BATCH MANAGER MODAL**

Full-screen overlay with data grid.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ BATCH REPORT - [BatchName]                                    [✕ Close]   │
├─────────────────────────────────────────────────────────────────────────────┤
│ [🟢 Completed (44)]  [🔴 Failed (6)]  [🔍 Search records...]  [📥 Export]  │
├─────────────────────────────────────────────────────────────────────────────┤
│ Status │ Photo │ Name │ Adm No │ Class │ Photoid │ Actions                 │
├────────┼───────┼──────┼────────┼───────┼─────────┼─────────────────────────┤
│ 🟢     │ [img] │ John │ 1001   │ 4A    │ 001     │ [👁️] [✏️]              │
│ 🟢     │ [img] │ Jane │ 1002   │ 4B    │ 002     │ [👁️] [✏️]              │
│ 🔴     │ ❌    │      │ 1003   │ 4A    │ 003     │ [✏️ Edit] ← Missing name│
│ 🔴     │ [img] │ Bob  │        │ 4C    │ 004     │ [✏️ Edit] ← Missing adm │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Tabs:**
- **Completed:** All placeholders filled, photo matched
- **Failed:** Missing text data OR missing photo

**Search:**
- Real-time filtering as user types
- Searches all text columns
- Case-insensitive partial match
- "john" finds "Johnson", "Mary" finds "Maryanne"

**Manual Resolution (Side Panel):**
- Click failed row → Side panel slides in
- Show all fields for that record
- Empty fields: Red highlight + text input
- Photo missing: `[📤 Upload Photo]` button
- Save: Updates internal state, NOT original Excel

**Export Failed Records:**
- Button: `[📥 Export Failed to Excel]`
- Generates .xlsx with only failed rows
- Error cells highlighted in red
- Includes error reason column

---

## **PART 6: SINGLE RECORD EDITING & OVERRIDE**

### **Live Preview Mode:**
- Toggle in Status Bar: `[Design Mode | Live Preview Mode]`
- When Live Mode active:
  - Canvas shows actual data, not `{{placeholders}}`
  - Photos show matched images
  - Pagination: Record `[1]` of `[500]`
  - Search: Jump to specific record

### **Search in Live Mode:**
- Search bar in Status Bar
- Type name/adm_no/photoid
- Press Enter or click `[🔍]`
- Canvas jumps to matching record
- If multiple matches: Show dropdown, user selects

### **Edit This Record:**
- Button in Right Sidebar (visible in Live Mode)
- Click → Unlock record for editing
- Canvas becomes editable:
  - Click text → Edit inline
  - Click photo → `[Replace Photo]` button appears
- Changes saved to internal JSON state
- **Original Excel file NEVER modified**
- Mark record as "Edited" in Batch Report

---

## **PART 7: FILE SYSTEM & .WZIP PACKAGING**

### **.WZIP FILE FORMAT SPECIFICATION**

**Structure (ZIP Archive):**
```
[filename.wzip]
├── layout.json              # Canvas serialization (Fabric.js JSON)
├── data.json                # Batch data array + manual overrides
├── meta.json                # Batch metadata
├── calibration.json         # Print calibration settings
├── thumbnails/
│   ├── design_preview.png   # 300×200px preview
│   └── batch_preview.png    # First card preview
└── images/                  # Embedded assets only
    ├── background.png       # Static background (if used)
    ├── logo.png             # Static logo (if used)
    ├── 001.jpg              # Matched student photos
    ├── 002.png              # (only successfully matched)
    └── ...                  # (not entire source folder)
```

**File Specifications:**

**layout.json:**
```json
{
  "version": "1.0",
  "canvas": { /* Fabric.js canvas JSON */ },
  "objects": [ /* Array of canvas objects */ ],
  "background": "#ffffff" or "images/background.png",
  "placeholders": ["name", "adm_no", "class", "photoid"]
}
```

**data.json:**
```json
{
  "records": [
    {
      "id": 1,
      "name": "John Doe",
      "adm_no": "1001",
      "class": "4A",
      "photoid": "001",
      "photo_path": "images/001.jpg",
      "overrides": {},
      "status": "complete"
    }
  ],
  "failed_records": [3, 4, 7],
  "import_date": "2026-03-16T23:48:00Z"
}
```

**meta.json:**
```json
{
  "application": "WhizIP Pro",
  "version": "1.0.0",
  "created": "2026-03-16T23:48:00Z",
  "modified": "2026-03-16T23:48:00Z",
  "saved_by": "username",
  "whizpoint_id": "WP-2026-001"
}
```

**calibration.json:**
```json
{
  "top_margin": 30.0,
  "left_margin": 31.2,
  "space_between": 25.4,
  "card_width": 85.6,
  "card_height": 54.0,
  "printer_profile": "Epson_L805_Default"
}
```

### **SAVE PROCESS:**
1. User presses Ctrl+S or clicks `[💾 Save]`
2. Show dialog if first save: "Save Batch Document"
   - Filename: `[BatchName_______________.wzip]`
   - Location: `[Browse...]`
   - `[💾 Save]` `[❌ Cancel]`
3. Serialize canvas to layout.json
4. Copy matched photos to temp images/ directory
5. Create ZIP archive with archiver
6. Save to selected location
7. Update window title: `"WhizIP Pro - [filename.wzip]"`
8. Show toast: `"✓ Saved successfully"`

### **LOAD PROCESS:**
1. User opens .wzip (double-click or File > Open)
2. Extract to temp directory using unzipper
3. Validate structure (check required JSON files)
4. If corrupted: Show recovery dialog
   - `"File appears corrupted. Attempt to recover data?"`
   - `[🔄 Recover]` `[❌ Cancel]`
5. Load layout.json into canvas
6. Load data.json into state
7. Serve images via `whizip://` protocol
8. Update window title
9. Show toast: `"✓ [filename.wzip] loaded"`

### **AUTO-SAVE:**
- **Interval:** Every 120 seconds (2 minutes)
- **Location:** OS temp directory /whizip-autosave/
- **Filename:** autosave_[timestamp].wzip
- **Max files:** Keep last 5 autosaves
- **On crash recovery:**
  - Detect autosave files on next launch
  - Show dialog: `"Unsaved work found from [time]. Restore?"`
  - `[🔄 Restore]` `[🗑️ Discard]`

---

## **PART 8: PRECISION PRINT ENGINE & CALIBRATION**

### **CALIBRATION SETTINGS PAGE**

**Access:** File > Print Configuration  
**Security:** Admin PIN protection (default PIN: 0000, user changeable)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🔧 PRINTER CALIBRATION                                        [✕ Close]    │
│                                                                             │
│ ⚠️ Warning: Changing these values affects print accuracy.                  │
│    Measure test printouts with a ruler before adjusting.                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Top Margin:        [ 30.0    ] mm    [−] [+]    (0.0 - 100.0)            │
│                                                                             │
│  Left Margin:       [ 31.2    ] mm    [−] [+]    (0.0 - 100.0)            │
│                                                                             │
│  Space Between:     [ 25.4    ] mm    [−] [+]    (0.0 - 50.0)             │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  Card Width:        85.6 mm    [LOCKED - CR80 Standard]                   │
│                                                                             │
│  Card Height:       54.0 mm    [LOCKED - CR80 Standard]                   │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  [🖨️ Print Test Page]    [💾 Save Profile]    [↺ Reset to Default]        │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  LIVE PREVIEW:                                                              │
│  ┌─────────────────────────────────────────┐                                │
│  │  Card 1 at Y: 30.0mm                    │                                │
│  │  ┌───────────────┐                      │                                │
│  │  │               │ 25.4mm gap           │                                │
│  │  └───────────────┘                      │                                │
│  │  Card 2 at Y: 109.4mm                   │                                │
│  │  ┌───────────────┐                      │                                │
│  │  │               │                       │                                │
│  │  └───────────────┘                       │                                │
│  └─────────────────────────────────────────┘                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Adjustment Behavior:**
- `[−]` `[+]` buttons: Adjust by 0.1mm per click
- Direct input: Type value, press Enter
- Range limits enforced (cannot exceed min/max)
- Live preview updates immediately
- Changes apply only after `[💾 Save Profile]`

### **Test Page:**
- `[🖨️ Print Test Page]` button
- Generates A4 PDF with:
  - 1px black outline of card bounding boxes (no fill)
  - Dimension labels showing margin measurements
  - Crosshairs at card centers for alignment checking
- User prints on plain paper, measures with ruler
- Adjusts calibration values if misaligned
- Retests until perfect

### **Profiles:**
- `[💾 Save Profile]`: Save current settings with name
  - "Epson_L805_Default"
  - "HP_LaserJet_Office"
  - "Custom_PVC_Printer"
- Load profile dropdown on main print dialog

### **PRINT GENERATION MATHEMATICS**

**A4 Page Dimensions:** 210mm × 297mm  
**Card Dimensions:** 85.6mm × 54.0mm

**Card Position Calculations:**
- **Card 1 X:** Left_Margin = 31.2mm
- **Card 1 Y:** Top_Margin = 30.0mm
- **Card 2 X:** Left_Margin = 31.2mm (same column)
- **Card 2 Y:** Top_Margin + Card_Height + Space_Between
  = 30.0 + 54.0 + 25.4
  = **109.4mm**

**Layout Verification:**
- Left_Margin + Card_Width + Right_Margin = 210mm
  - 31.2 + 85.6 + 93.2 = 210mm ✓
- Top_Margin + Card_Height + Space + Card_Height = 163.4mm used
  - Remaining: 297 - 163.4 = 133.6mm bottom margin

### **PDF Generation Process (pdf-lib):**
1. Create new PDF document (A4 size)
2. For each record in batch:
   - a. Calculate position (Card 1 or Card 2 on current page)
   - b. If page full (2 cards placed), add new page
   - c. Render card design at calculated X,Y coordinates
   - d. Scale from canvas (85.6×54mm) to PDF coordinates
3. Save PDF to user-selected location

### **Export PDF Dialog:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 📄 EXPORT TO PDF                                              [✕] [?]      │
├─────────────────────────────────────────────────────────────────────────────┤
│ Range:                                                                      │
│ (•) All records (500 cards → 250 pages)                                    │
│ ( ) Current page only (2 cards)                                            │
│ ( ) Pages [___] to [___]                                                   │
│ ( ) Specific records: [________________] (comma-separated)                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ Options:                                                                    │
│ [✓] Include cut marks (1px lines at card boundaries)                       │
│ [ ] Include page numbers                                                   │
│                                                                             │
│ Quality: [300 DPI ▼] (150, 300, 600)                                       │
│                                                                             │
│ Filename: [BatchName_2026-03-16.pdf______________________________]        │
│ Location: [C:\Users\Documents\WhizIP Exports\] [Browse...]                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                    [❌ Cancel] [📄 Export]  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## **PART 9: KEYBOARD SHORTCUTS & HOTKEYS**

### **GLOBAL SHORTCUTS:**
| Shortcut | Action |
|----------|--------|
| Ctrl+N | New project |
| Ctrl+O | Open .wzip file |
| Ctrl+S | Save |
| Ctrl+Shift+S | Save As |
| Ctrl+Z | Undo |
| Ctrl+Y | Redo |
| Ctrl+X | Cut |
| Ctrl+C | Copy |
| Ctrl+V | Paste |
| Ctrl+D | Duplicate |
| Ctrl+A | Select all objects on active layer |
| Del | Delete selected |
| Alt+F4 | Exit application |

### **CANVAS SHORTCUTS:**
| Shortcut | Action |
|----------|--------|
| Ctrl+Plus | Zoom in |
| Ctrl+Minus | Zoom out |
| Ctrl+0 | Fit to screen |
| Ctrl+1 | Actual size (100%) |
| Space+Drag | Pan canvas (hand tool) |
| Arrow Keys | Nudge selected object 1mm |
| Shift+Arrow | Nudge selected object 5mm (fine adjustment) |

### **TOOL SHORTCUTS:**
| Key | Tool |
|-----|------|
| V | Select tool |
| H | Pan tool |
| Z | Zoom tool |
| T | Text tool |
| P | Photo placeholder tool |
| I | Image tool |
| R | Rectangle tool |
| O | Ellipse tool |
| B | Barcode tool |

### **LAYER SHORTCUTS:**
| Shortcut | Action |
|----------|--------|
| Ctrl+Shift+] | Bring to front |
| Ctrl+PgUp | Bring forward |
| Ctrl+PgDn | Send backward |
| Ctrl+Shift+END | Send to back |

---

## **PART 10: MODERN MESSAGING & NOTIFICATIONS**

All user-facing messages must be modern, friendly, and actionable. Use emoji icons and clear, concise language.

### **TOAST NOTIFICATIONS** (Bottom-right, auto-dismiss 3-5 seconds):

| Icon | Message | Duration | Actions |
|------|---------|----------|---------|
| ✅ | "Saved successfully" | 3s | [✕] |
| 💾 | "All changes saved automatically" | 3s | [✕] |
| ✅ | "Batch processed: 44 completed, 6 failed" | 5s | [✕] [📋] |
| ✅ | "PDF exported to Documents folder" | 4s | [✕] [📂] |
| ⚠️ | "6 records need attention" | 5s | [✕] [🔍] |
| ✅ | "Photo matched: 001.jpg" | 3s | [✕] |
| ✅ | "Calibration saved" | 3s | [✕] |

### **DIALOG MESSAGES:**

**Save Changes:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 💾 Unsaved Changes                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ You have unsaved changes in "Batch_001.wzip".                               │
│                                                                             │
│ Save before closing?                                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ [💾 Save Changes]    [⛔ Discard Changes]    [❌ Cancel]                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Import Success:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ✅ Data Imported Successfully                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│ 📊 Excel Records: 50                                                        │
│ 🖼️ Photos Matched: 48                                                       │
│ ⚠️ Photos Missing: 2                                                        │
│                                                                             │
│ 🟢 Complete: 48 records ready to print                                      │
│ 🔴 Failed: 2 records need attention                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ [📋 View Batch Report]    [🖨️ Print Complete Cards]    [❌ Close]          │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Validation Error:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ⚠️ Validation Issues Found                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ Row 15: Missing required field "name"                                       │
│ Row 23: Photo "025.jpg" not found in folder                                 │
│ Row 31: Duplicate admission number "1005"                                   │
│                                                                             │
│ Please fix these issues before printing.                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ [📋 View Report]    [📥 Export Failed Records]    [❌ Close]               │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Crash Recovery:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🔄 Recover Unsaved Work?                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ WhizIP Pro closed unexpectedly at 14:32.                                    │
│ We found an autosave from 2 minutes ago.                                    │
│                                                                             │
│ Would you like to restore your work?                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ [🔄 Restore Work]    [🗑️ Discard]                                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

### **Confirmation Messages:**
- "Are you sure you want to delete this object?" `[🗑️ Delete]` `[❌ Cancel]`
- "This will clear the current design. Continue?" `[✓ Continue]` `[❌ Cancel]`
- "Replace existing photo?" `[🔄 Replace]` `[❌ Cancel]`

### **Success Messages:**
- "✅ Design saved to Batch_001.wzip"
- "✅ 50 cards exported to PDF successfully"
- "✅ Calibration profile 'Epson_L805' saved"
- "✅ Photo uploaded and matched to record #15"

### **Progress Indicators:**
- "Processing batch... `[████████░░]` 78% (39 of 50 records)"
- "Generating PDF... `[█████░░░░░]` 50% (Page 125 of 250)"
- "Matching photos... `[██████████]` 100% (48 matched, 2 missing)"

---

## **PART 11: ERROR HANDLING & EDGE CASES**

### **SPECIFIC ERROR TYPES:**

| Error Code | Trigger | Message | Action |
|------------|---------|---------|--------|
| **MISSING_DATA** | Required placeholder has empty Excel cell | "Row 15: Missing required field 'student_name'" | Highlight in Batch Report, allow manual edit |
| **PHOTO_NOT_FOUND** | photoid in Excel doesn't match any file in folder | "Row 23: Photo '025.jpg' not found. Expected files: 025.jpg, 025.png" | Allow manual upload, show file naming format |
| **INVALID_FORMAT** | Data type mismatch (date field has text) | "Row 31: Invalid date format in 'dob' field. Expected: DD/MM/YYYY" | Warning only, don't block |
| **DUPLICATE_RECORD** | Same adm_no or photoid appears multiple times | "Duplicate admission number '1005' found in rows 12 and 45" | Warning with row numbers, allow proceed or cancel |
| **PLACEHOLDER_MISMATCH** | Design has {{parent}} but Excel has column "guardian" | "Placeholder '{{parent}}' not found in Excel columns. Available: name, guardian, class" | Suggest mapping or auto-match similar names |
| **FONT_MISSING** | .wzip uses font not installed on current computer | "Font 'Comic Sans MS' not available. Substituted with 'Arial'" | Show warning, use fallback chain |
| **CORRUPTED_FILE** | .wzip fails integrity check | "File 'Batch_001.wzip' appears corrupted or incomplete" | Offer recovery attempt or cancel |
| **MEMORY_WARNING** | Batch >500 photos or file >100MB | "Large batch detected (600 photos). Performance may be affected." | Suggest splitting batch or continue |

---

## **PART 12: PERFORMANCE & OPTIMIZATION**

### **MEMORY MANAGEMENT:**
- **Lazy load photos:** Only load visible records in preview
- **Unload off-screen:** Remove from DOM when scrolled out of view
- **Image compression:** Store thumbnails 300×200px for grid view
- **Full resolution:** Load only for print export or single view
- **Max batch size:** Tested up to 1000 records (warn if exceeded)

### **RENDERING OPTIMIZATION:**
- **Debounce canvas updates:** 16ms (60fps cap)
- **Virtual scrolling:** For batch report >50 records
- **Web Workers:** Photo processing in background thread
- **Stream PDF generation:** Don't hold entire PDF in memory

### **LOADING STATES:**
- Show skeleton screens while data loads
- Progress bars for batch operations
- Cancelable operations (with confirmation)

---

## **END OF SPECIFICATION**

### **DEVELOPER NOTES:**
- All measurements in **millimeters (mm)** unless specified
- All coordinates origin **(0,0) at top-left** of canvas
- **Light theme is default** and primary focus
- Dark theme secondary (ensure contrast ratios meet WCAG AA)
- **Test print accuracy with physical ruler** before release
- **Whizpoint Solutions branding** must be prominent
- **Logo files** (`logo.ico`, `logo.png`) in project root

---

**Document Version:** 1.0  
**Date:** 2026-03-16  
**Prepared for:** Whizpoint Solutions  
**Status:** In Progress (Core UI layout, Fabric.js basic canvas, Excel Import, and PDF image generation implemented.)

---
## **EXPORTED PDF PROPERTIES:**

- Document properties
File name:	{{thefilename}}.pdf
File size:	1,513 KB
Title:	{{Batchname}}
Author:	whizpoint Solutions
Subject:	institution Id
Keywords:	id cards, printing, WhizId
Created:	{{Time exported}}
Modified:	- {{time created/ Modified}}
Application:	WhizID Pro
PDF producer:	WhizID Pro
PDF version:	1.0.0
Page count:	{{Page_Count}}
Page size:	8.26 × 11.69 in (portrait)
