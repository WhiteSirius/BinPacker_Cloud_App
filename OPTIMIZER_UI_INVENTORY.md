# BinPacker — Optimizer Page UI Inventory (User-Visible Elements)

This document lists **every user-visible UI element** on the **“3D Bin Packing Optimizer”** page (the page shown after login), including its **location**, **purpose**, **interaction**, and how it affects other parts of the page.

Scope: **frontend only** (UI inventory + interaction map). This is meant to be used as input for an LLM to redesign/stylize the page (lighter theme, more white), without changing backend behavior.

Primary component: `frontend/src/components/BinPackerAlgorithm.tsx`

Related components:
- `frontend/src/components/ItemForm.tsx`
- `frontend/src/components/ResultsDisplay.tsx`
- `frontend/src/components/TruckVisualization.tsx`
- `frontend/src/components/ExcelImport.tsx`
- `frontend/src/components/UserMenu.tsx`

---

## 1) Page Layout Overview (macro structure)

The page is structured top-to-bottom as:

1. **Top Header Bar** (navigation + user identity + menu)
2. **Excel Import Modal** (overlay; only when opened)
3. **Edit Item Modal** (overlay; only when opened)
4. **Main Content Container**:
   - **Truck Configuration** panel
   - **Items to Pack** panel (manual entry + import + list management + failed items queue)
   - **Run Optimization** panel (CTA + “what will be optimized” line)
   - **Error / Loading** feedback blocks (conditional)
   - **Optimization Results** panel (conditional)
   - **3D Visualization** panel (conditional)

---

## 2) Header / Navigation (top of page)

Location: Topmost page section (`.algorithm-header`)

### 2.1 Title and subtitle (left side)
- **Title text**: “🚛 3D Bin Packing Optimizer”
- **Subtitle text**: “Advanced algorithm for truck loading optimization”
- **Interaction**: none (display only)

### 2.2 User identity (right side)
- **Text**: “Logged in as: <email>”
- **Interaction**: none (display only)

### 2.3 Navigation buttons (right side)

#### Button: “← Back”
- **Label**: “← Back”
- **Action**: calls `onBackToHome()`
- **Effect**: returns the user to the landing page view (within `App.tsx` state flow)

#### Button: “☰” (open user menu)
- **Label**: “☰”
- **ARIA label**: “Open user menu”
- **Action**: opens the user menu overlay (`setIsUserMenuOpen(true)`)
- **Effect**: shows the `UserMenu` component (see section 3)

---

## 3) User Menu Overlay (slide-over panel)

Component: `frontend/src/components/UserMenu.tsx`  
Visibility: only when `isUserMenuOpen === true`

Location: overlay on top of the page; closes when clicking the overlay background or the close button.

### 3.1 Header
- **Title**: “User Menu”
- **Close button**: “×”
  - **Action**: closes the menu

### 3.2 User info card
- **User email** displayed
- **Status**: “✅ Active Session”
- **Interaction**: none

### 3.3 Menu sections + buttons
Each item closes the menu after click, and calls `onNavigate(action)` where `action` is one of the strings below.

#### Data Management section
- **User Profile** (action: `profile`)
- **My Data & Imports** (action: `data`)

#### Optimization section
- **Saved Optimization Runs** (action: `saved`)
- **Optimization History** (action: `history`)
- **Performance Analytics** (action: `analytics`)

#### Settings section
- **Settings & Preferences** (action: `settings`)

#### Sign out
- **Sign Out** button
  - **Action**: signs out via Firebase (`signOut(auth)`)
  - **Effect**: user becomes logged out; app returns to landing page due to auth state

Notes:
- Currently, the navigation actions mostly `console.log(...)` in `BinPackerAlgorithm.tsx` (placeholders for future pages).

---

## 4) Excel Import Modal (overlay wizard)

Component: `frontend/src/components/ExcelImport.tsx`  
Visibility: only when `isExcelImportOpen === true`

Opened from:
- **Items to Pack → “📊 Import Excel” button**

Closed by:
- overlay click OR “×” close button (top right of modal)

### 4.1 Modal header
- **Title**: “📊 Import Excel Data”
- **Close**: “×”

### 4.2 Error banner (conditional)
If an import step fails or validation fails:
- **Banner**: “⚠️ Error: …”

### 4.3 Step 1: Select file
Visible when `step === 1`:
- **Instructional text** explaining accepted file types
- **Button**: “📁 Choose Excel File”
  - opens file picker (`<input type="file" accept=".xlsx,.xls,.csv">`)
- **Selected file indicator** (shows file name after selection)

### 4.4 Step 2+: Column mapping & import (wizard)
The import modal includes a mapping flow (visible in later parts of the file):
- Required mapped fields: `length`, `width`, `height`, `weight`
- Optional mapped fields: `stackability`, `route`, `priority`, `notes`, `duplicate`
- **Validate mapping**: must map all required fields and no duplicate mappings.

### 4.5 Import action
When user confirms import:
- File is parsed client-side with `xlsx`
- Rows missing required fields are collected as **failed items**
- Valid rows become items in the app (see section 6.4 and 6.5)

---

## 5) Edit Item Modal (overlay)

Location: overlay + centered modal  
Visibility: only when `isEditModalOpen === true` AND `editingItem` is set

Opened from:
- Current Items list → “✏️ Edit”
- Failed Items list → “✏️ Edit”

Closed by:
- overlay click OR “×” close button OR “Cancel”

### 5.1 Modal header
- **Title**: “✏️ Edit Item: <item id>”
- **Close**: “×”

### 5.2 Edit fields (form controls)
All fields are directly editable:

- **Length (m)** numeric input
- **Width (m)** numeric input
- **Height (m)** numeric input
- **Weight (kg)** numeric input
- **Stackability** select (dropdown):
  - Stackable
  - Semi-stackable
  - Unstackable
- **Priority (Loading Order)** select:
  - 1…5 with labels (“First Priority”, …)
- **Route** text input
- **Notes** textarea

### 5.3 Action buttons
- **Cancel**
  - closes modal without saving
- **Save Changes**
  - updates the item:
    - if editing a **failed item** and all required fields are now present, it moves into the main item list
    - otherwise it updates the failed item entry
    - if editing a normal item, it updates that item in the main list

---

## 6) Main Content Panels (inside container)

### 6.1 Truck Configuration panel

Title: “Truck Configuration”

Controls:
- **Length (m)** numeric input (default 13.62)
- **Width (m)** numeric input (default 2.48)
- **Height (m)** numeric input (default 2.7)

Effects:
- These dimensions are used when calling `POST /api/v1/optimize`
- These dimensions are also used by the 3D viewer (camera and truck container sizing)

---

### 6.2 Items to Pack panel — header row

Title: “Items to Pack”

Button:
- **“📊 Import Excel”**
  - Opens the Excel import modal
  - Tooltip/title: “Import items from Excel file”

---

### 6.3 Manual item entry form (ItemForm)

Component: `frontend/src/components/ItemForm.tsx`

Layout:
- Single row grid with multiple fields; ends with an “Add Item” button.

Fields:
- **ID** text input
  - Placeholder: “Auto-generated if empty”
  - Note: the parent assigns a sequential numeric id regardless (see section 6.4)
- **Length (m)** numeric input (required)
- **Width (m)** numeric input (required)
- **Height (m)** numeric input (required)
- **Weight (kg)** numeric input (required)
- **Stackability** radio group:
  - Stackable
  - Semi-stackable
  - Unstackable
- **Route** text input (optional)
- **Priority (Loading Order)** dropdown (1–5)

Action:
- **Button**: “➕ Add Item”
  - Adds the item into the main item list

Persistent behavior (“memory”):
- Helper text shown below the form: “💡 Form remembers your last values for quick item creation”
- After you add an item, the form resets but keeps the last values (except ID)

---

### 6.4 Current Items list (conditional)

Visible only if `items.length > 0`.

Header row contains:

#### Route filter dropdown
- Label: “Route:”
- Dropdown options:
  - “All Routes”
  - One option per unique route detected in items
- Effect:
  - Filters the visible list
  - Also filters which items are sent to the optimizer when running optimization (unless “All Routes”)

#### Button: “🔧 Fix Priorities”
- Tooltip/title: “Fix priority values for all items”
- Effect:
  - Normalizes every item’s `priority` to a string
  - Ensures every item has route + stackability defaults

#### Button: “🗑️ Remove All”
- Tooltip/title: “Remove all items”
- Effect:
  - Clears all items
  - Resets the next item ID counter to 1
  - Resets route filter to “all”

List item row (for each visible item):
- Text summary: dimensions + weight
- Secondary line: Route, Priority, Stackability

Per-item buttons:
- **“✏️ Edit”**
  - Opens edit modal for this item
- **“🗑️ Remove”**
  - Removes that item from the list

Notes:
- List items have background colors based on priority (1–5).

---

### 6.5 Failed Items queue (always shown as a section)

Title: “❌ Failed Items (<count>)”

When empty:
- Text: “No failed items at the moment”

When not empty:
- List of failed items with:
  - ID, dimensions/weight (missing values shown as 0)
  - Failure reason (“Missing required fields: …”)
  - Route/Priority/Stackability display

Per failed item buttons:
- **“✏️ Edit”**
  - Opens edit modal
  - If user fixes required fields and saves, item moves into main items
- **“🗑️ Remove”**
  - Deletes this failed item from the queue

---

### 6.6 Run Optimization panel (primary action)

Contains:

#### Info line (what will be optimized)
Text changes based on route filter:
- “Will optimize N items from all routes”
or
- “Will optimize N items from route: <route>”

#### Button: “🚀 Run Optimization”
State:
- Enabled only if there are items available in the selected filter
- Disabled when `loading === true`

Action:
- Sends POST request to backend:
  - URL: `${REACT_APP_API_BASE_URL || 'http://localhost:8000'}/api/v1/optimize`
  - Body: `{ truck: truckDimensions, items: itemsToOptimize[] }`

---

## 7) Feedback UI (error/loading)

### 7.1 Error banner (conditional)
When `error` state is set:
- Shows a block:
  - “Error: …”
  - Typically used for:
    - “No items available…”
    - Backend/network failures
    - Validation failures

### 7.2 Loading panel (conditional)
When `loading === true`:
- Shows:
  - “🔄 Running optimization algorithm…”
  - “This may take a few seconds…”

---

## 8) Optimization Results panel (conditional)

Visible only when `result` exists.

Title: “Optimization Results”

Component: `frontend/src/components/ResultsDisplay.tsx`

### 8.1 Summary statistics (top row, 4 cards)
Cards:
- **Efficiency** (percentage)
- **Items Placed** (count)
- **Total Weight** (kg)
- **Execution Time** (seconds)

### 8.2 Detailed results (two-column layout)

#### Left column: “✅ Placed Items (N)”
Scrollable list (max height).

Each placed item entry shows:
- Item ID (bold)
- Priority, stackability
- Route
- Position (x, y, z) formatted
- Dimensions (L×W×H)
- Weight

Interaction:
- Clickable if `onSelectItem` is provided
- Clicking toggles selection state:
  - selected item becomes highlighted (background changes)
  - selection is forwarded to 3D visualization (see section 9)

#### Right column: “❌ Unplaced Items (N)”
Scrollable list (max height).

Each unplaced item entry shows:
- Item ID (bold)
- Priority, stackability
- Route
- Volume
- Weight

Interaction:
- Non-clickable (display only)

### 8.3 Truck information (bottom)
Box titled “Truck Information”
- Truck dimensions (from result)
- Total volume (computed)
- Optimization timestamp (localized)

---

## 9) 3D Visualization panel (conditional)

Visible only when:
- `result` exists AND `result.placed_items.length > 0`

Title: “3D Visualization”

Component: `frontend/src/components/TruckVisualization.tsx`

### 9.1 3D Canvas (main viewer)
Rendered with Three.js via `@react-three/fiber`.

What the user sees:
- A semi-transparent truck container (box)
- Item boxes placed inside the truck
- A ground grid + axes helper

### 9.2 Camera controls (OrbitControls)
User interactions:
- **Rotate** (drag)
- **Pan** (drag with modifier depending on device)
- **Zoom** (scroll wheel / pinch)

### 9.3 Item hover/selection behavior
- Hovering an item changes its appearance slightly (opacity changes)
- Hover may show an ID label overlay (HTML label via `Html`)
- Selecting an item from Results list highlights the same item in 3D:
  - `selectedItemId` is passed into the viewer

Notes:
- The item colors are auto-assigned based on ID hash (for visual distinction).

---

## 10) Page states (what the user experiences)

### State A: No items yet
- Truck configuration visible
- Item form visible
- Optimization button disabled (because no items)
- No results panel, no 3D view

### State B: Items added
- Current items list appears
- Route filter and list management buttons appear
- Optimization button enabled

### State C: Import errors
- Failed items section shows failed rows
- User can edit/remove failed items

### State D: Optimization running
- Optimization button shows “Optimizing…”
- Loading panel shows progress text

### State E: Optimization complete
- Results panel appears
- 3D visualization appears (if placed items exist)
- Click-to-select items in results highlights in 3D

---

## 11) Notes for “lighter version of landing page” redesign

Without changing functionality, the obvious “visual groupings” you can redesign into a lighter theme:

- Keep a **sticky top header** (Back / user / menu) but match landing typography.
- Convert “Truck Configuration” and “Items to Pack” into **white cards** with subtle shadows.
- Turn route filter + buttons (“Fix Priorities”, “Remove All”, “Import Excel”) into a unified **toolbar**.
- Make Results summary cards match the landing “premium” style (consistent spacing, rounded corners).
- Keep 3D viewer in a “light frame” container with optional helper legend.




