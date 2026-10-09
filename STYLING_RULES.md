# Portable UI Styling Rules & Design System Specification for AI Agents (Arc UI Enabled)

> **Usage Note**: Copy this file as `.agents/AGENTS.md` (or include it in your project's AI instructions / system prompts) in any new repository to immediately enforce this modern, minimalist glassmorphism design system built with Arc UI (`uiarc.dev`).

---

## 1. Required AI Setup: Arc MCP Server & Skill

Before writing or editing UI components, AI agents **MUST** ensure that the Arc MCP server and Arc AI Skill are configured in the environment.

### A. Check & Add Arc MCP Server (`mcp_config.json`)
If `arc` is not listed in `~/.gemini/config/mcp_config.json` or `.agents/mcp_config.json`, add it immediately:

```json
{
  "mcpServers": {
    "arc": {
      "url": "https://uiarc.dev/api/mcp",
      "serverUrl": "https://uiarc.dev/api/mcp"
    }
  }
}
```

### B. Check & Add Arc Skill (`SKILL.md`)
If the Arc skill is missing from `.agents/skills/arc/SKILL.md` or `~/.gemini/config/skills/arc/SKILL.md`, install or create it from `https://uiarc.dev/r/skills/arc/SKILL.md`.

### C. Configure Registry (`components.json`)
Ensure `components.json` is configured at the project root with `"tsx": true` and the `@uiarc` registry URL:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  },
  "registries": {
    "@uiarc": "https://uiarc.dev/r/{name}.json"
  }
}
```

### D. Install Arc Design Tokens & Core Components
Run the following shadcn CLI commands to install Arc foundation tokens and essential components:

```bash
# 1. Install design tokens & CSS variables once per project:
npx shadcn@latest add https://uiarc.dev/r/arc-foundation.json -y

# 2. Install core Arc UI components:
npx shadcn@latest add @uiarc/button @uiarc/theme-switch @uiarc/segmented-control @uiarc/input @uiarc/select @uiarc/checkbox @uiarc/switch @uiarc/badge @uiarc/card @uiarc/dialog @uiarc/drawer @uiarc/tabs @uiarc/confirm-morph @uiarc/avatar @uiarc/tooltip -y
```

---

## 2. Design System Overview & Aesthetic Guidelines

### Core Principles
- **Visual Style**: High-contrast, calm monochrome glassmorphism paired with Arc UI motion presets (`snappy`, `smooth`, `morph`).
- **Minimalism First**: Restrained layouts, regular/medium font weights only, no eyebrow labels, no decorative gradients, no all-caps headers, no em dashes in copy.
- **Color & Light/Dark Theme Parity**:
  - **Base Neutrals**: `neutral-950` in Dark Mode, `neutral-50` in Light Mode.
  - **Theme Inverted Fills**: Primary actions flip between `neutral-900` (Light) and `neutral-100` (Dark).
  - **Semantic Accents**: Semantic tokens (`--accent`, `--success`, `--warning`, `--danger`) for status indicators.
- **Data Attributes**: Always set both `data-theme="dark"` (or `light`) and the `.dark` class on `<html>` for full Arc token & CSS variable compatibility.

---

## 3. Core CSS Setup (`src/app/globals.css` / `src/index.css`)

Ensure `import "@/components/arc/foundation.css";` is added to your root layout (`src/app/layout.jsx` or main entry point).

```css
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));

@theme {
  --font-sans: 'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-outfit: 'Outfit', sans-serif;
}

/* Custom Glassmorphism Surface Utilities */
@utility glass-panel {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(0, 0, 0, 0.08);

  .dark & {
    background: rgba(10, 10, 10, 0.65);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }
}

@utility glass-card {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(0, 0, 0, 0.08);

  .dark & {
    background: rgba(10, 10, 10, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }
}

@layer base {
  button, a, input, select, textarea {
    touch-action: manipulation;
  }
}

/* Minimal Custom Scrollbar */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.05); }
.dark ::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.02); }
::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.15); border-radius: 9999px; }
.dark ::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.3); }

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
```

---

## 4. Component Patterns with Arc UI

### A. Root Layout (`layout.jsx`)
```jsx
import '@/components/arc/foundation.css';
import './globals.css';

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="dark" className="dark">
      <body className="font-sans antialiased bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100 transition-colors">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">{children}</main>
      </body>
    </html>
  );
}
```

### B. Header Component with Arc ThemeSwitch & Button (`Header.jsx`)
```jsx
'use client';

import Link from 'next/link';
import { ThemeSwitch } from '@/components/arc/theme-switch/theme-switch';
import { Button } from '@/components/arc/button/button';

export default function Header({ theme, onThemeChange }) {
  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-900 px-4 py-3">
      <div className="max-w-4xl mx-auto flex justify-between items-center gap-3">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-950 flex items-center justify-center font-bold">
            App
          </div>
          <h1 className="text-lg font-bold font-outfit text-neutral-900 dark:text-white">App Title</h1>
        </Link>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">Action</Button>
          <ThemeSwitch theme={theme} variant="rise" iconOnly onThemeChange={onThemeChange} />
        </div>
      </div>
    </header>
  );
}
```

### C. View Switching with Arc SegmentedControl (`Segmented.jsx`)
```jsx
'use client';

import SegmentedControl from '@/components/arc/segmented-control/segmented-control';

export function NavigationTabs({ views, activeView, onChange }) {
  const options = views.map(v => ({ value: v.id, label: v.title }));
  return <SegmentedControl options={options} value={activeView} onValueChange={onChange} />;
}
```

### D. Inputs & Form Controls with Arc Input & Checkbox
```jsx
'use client';

import { Input } from '@/components/arc/input/input';
import { Checkbox } from '@/components/arc/checkbox/checkbox';
import { Button } from '@/components/arc/button/button';

export function LoginForm({ onSubmit }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
          Username
        </label>
        <Input type="text" placeholder="Enter username" />
      </div>

      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <Checkbox defaultChecked />
        <span>Remember this device</span>
      </label>

      <Button type="submit" variant="primary" size="md" className="w-full">
        Sign In
      </Button>
    </form>
  );
}
```

### E. Status Badges with Arc Badge
```jsx
'use client';

import { Badge } from '@/components/arc/badge/badge';

export function StatusPill({ status, label }) {
  const toneMap = { active: 'success', pending: 'warning', failed: 'danger' };
  return <Badge tone={toneMap[status] || 'neutral'} size="sm">{label}</Badge>;
}
```

---

## 5. Directives for AI Coding Agents

1. **Mandatory Arc Check**: If Arc MCP (`https://uiarc.dev/api/mcp`) or Arc Skill (`SKILL.md`) is missing, add them immediately before modifying UI files.
2. **Use Arc Components First**: Always prefer installed Arc UI components (`Button`, `SegmentedControl`, `ThemeSwitch`, `Input`, `Badge`, `Card`, `Checkbox`, `Dialog`, `Drawer`) over raw HTML elements or bespoke CSS implementations.
3. **Strict Dark Mode Parity**: Every custom container MUST provide `dark:` Tailwind variants or use Arc's CSS variables.
4. **Clean Typography**:
   - Section titles & display numbers: `font-outfit`
   - Body copy & UI controls: `font-sans` (`Inter`)
5. **No Visual Clutter**: Avoid eyebrow labels, unnecessary icon badges inside rounded colored circles, em dashes, or arbitrary non-standard Tailwind colors (such as `neutral-850`). Always stick to standard Tailwind step scales (e.g. `100, 200, 800, 900, 950`).
