# CSS Architecture

## Overview

The CSS has been modularized into 8 focused files for maximum reusability across projects. Each file has a single responsibility and can be independently imported.

## Module Structure

### Core Foundation
1. **reset.css** (3 lines)
   - CSS reset & normalize
   - Zero dependencies
   - Reusable in any project

2. **theme.css** (33 lines)
   - CSS custom properties (variables)
   - Dark & light theme definitions
   - 20+ semantic tokens (colors, surfaces, borders)
   - Easy customization: just modify the `:root` or `.dark`/`.light` classes

3. **base.css** (15 lines)
   - HTML/body base styles
   - Font smoothing & Inter font
   - Depends on: theme.css

### Layout & Canvas
4. **canvas.css** (42 lines)
   - Canvas container & placeholder
   - Fixed positioning utilities
   - Logo & subtitle styling
   - Depends on: theme.css

### UI Components
5. **ui-elements.css** (178 lines)
   - Buttons (action, download, theme toggle)
   - Input fields & labels
   - Wordmark & keyboard hints
   - Highly reusable form components
   - Depends on: theme.css

6. **palette.css** (116 lines)
   - Draggable palette system
   - Collapsible panels with header/body
   - Docking modes (left/right snap)
   - Focus states & glass-morphism effects
   - Depends on: theme.css
   - **Reusable Pattern**: Copy this for any draggable panel UI

7. **components.css** (290 lines)
   - Thumbnail grid & items
   - Color swatches
   - Filter sliders
   - Toast notifications
   - Navigation arrows
   - Snap bars (drag indicators)
   - Depends on: theme.css
   - Mix-and-match: import only what you need

### State Management
8. **utilities.css** (22 lines)
   - UI visibility states (`.ui-hidden`, `.fs-mode`)
   - Body state classes
   - Depends on: none

### Import Entry Point
9. **main.css** (11 lines)
   - Imports all modules in correct order
   - Single `<link>` reference in HTML
   - Order matters: foundation → layout → components → utilities

## Usage Patterns

### Full Import (Current)
```html
<link rel="stylesheet" href="css/main.css"/>
```

### Selective Import (New Projects)
```html
<!-- Only import what you need -->
<link rel="stylesheet" href="css/reset.css"/>
<link rel="stylesheet" href="css/theme.css"/>
<link rel="stylesheet" href="css/base.css"/>
<link rel="stylesheet" href="css/palette.css"/>
<link rel="stylesheet" href="css/ui-elements.css"/>
```

### Custom Theme (Fork & Customize)
1. Copy `theme.css` → `theme-custom.css`
2. Modify CSS variables in `:root`, `.dark`, `.light`
3. Import your custom theme instead

## Reusability Guide

### Draggable Palette System
**Files needed**: `palette.css`, `theme.css`

The palette system provides:
- Draggable panels with glassmorphism
- Collapsible sections
- Edge-docking (snap left/right)
- Focus states

**HTML Structure**:
```html
<div class="palette">
  <div class="pal-bar">
    <span class="pal-icon">🎨</span>
    <span class="pal-name">Panel Name</span>
    <button class="pal-coll">▼</button>
  </div>
  <div class="pal-body">
    <div class="psec">
      <!-- Your content -->
    </div>
  </div>
</div>
```

### Form Components
**Files needed**: `ui-elements.css`, `theme.css`

Includes:
- `.tinp` - Text input fields
- `.ilbl` - Input labels
- `.abtn` - Action buttons
- `.dlbtn` - Download buttons
- `.irow` - Input rows (flex layout)

**HTML Structure**:
```html
<div class="irow">
  <span class="ilbl">Search</span>
  <input class="tinp" type="text" placeholder="Enter query..."/>
  <button class="abtn">Search</button>
</div>
```

### Theme Toggle
**Files needed**: `ui-elements.css`, `theme.css`

```html
<button id="theme-btn" onclick="toggleTheme()">☀</button>
```

```javascript
function toggleTheme() {
  document.body.classList.toggle('dark');
  document.body.classList.toggle('light');
}
```

### Toast Notifications
**Files needed**: `components.css`, `theme.css`

```html
<div id="toast"></div>
```

```javascript
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2000);
}
```

### Color Swatches
**Files needed**: `components.css`, `theme.css`

```html
<div class="colors-grid">
  <div class="color-swatch" style="background: #ff5733;">
    <div class="color-info">
      <div class="color-label">Primary</div>
      <div class="color-value">#FF5733</div>
    </div>
  </div>
</div>
```

## Dependencies Map

```
main.css (imports all)
├── reset.css (no deps)
├── theme.css (no deps)
├── base.css → theme.css
├── canvas.css → theme.css
├── ui-elements.css → theme.css
├── palette.css → theme.css
├── components.css → theme.css
└── utilities.css (no deps)
```

## File Size Reference

| File | Lines | Purpose |
|------|-------|---------|
| reset.css | 3 | CSS reset |
| theme.css | 33 | Theme variables |
| base.css | 15 | HTML/body base |
| canvas.css | 42 | Canvas layout |
| ui-elements.css | 178 | Buttons, inputs |
| palette.css | 116 | Draggable panels |
| components.css | 290 | UI components |
| utilities.css | 22 | State classes |
| **Total** | **699** | **All modules** |

## Migration Notes

- Original `style.css` (297 lines) → 8 modular files (699 lines with documentation)
- Added section headers and improved comments
- No functional changes to styles
- All selectors and properties preserved
- Import order in `main.css` ensures correct cascade

## Best Practices

1. **Always import theme.css** before component files
2. **Import reset.css first** for consistent baseline
3. **Use CSS variables** from theme.css for colors (never hardcode)
4. **Keep utilities.css last** for state overrides
5. **Comment your customizations** when forking modules

## Future Enhancements

Potential additions:
- `animations.css` - Reusable keyframe animations
- `responsive.css` - Media query breakpoints
- `print.css` - Print-specific styles
- Theme variants: `theme-contrast.css`, `theme-colorblind.css`
