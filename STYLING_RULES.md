# Portable UI Styling Rules & Design System Specification for AI Agents

> **Usage Note**: Copy this file as `.agents/AGENTS.md` (or include it in your project's AI instructions / system prompts) in any new repository to immediately enforce this modern glassmorphism design system across AI-generated UI components.

---

## 1. Design System Overview & Technology Stack

### Core Aesthetic Guidelines
- **Visual Style**: High-contrast, minimalist monochrome glassmorphism with adaptive light/dark mode support, rounded geometric elements (`rounded-xl` / `rounded-2xl`), subtle borders, and smooth transitions.
- **Color Philosophy**:
  - **Base Neutral Tone**: Deep dark background (`neutral-950`) in Dark Mode, light background (`neutral-50`) in Light Mode.
  - **Inverted Dynamic Fills**: Primary actions and active tabs flip between solid `neutral-900` (Light Mode) and `neutral-100` (Dark Mode).
  - **Semantic Accents Only**: Colors like emerald, rose, and blue are restricted to translucent status badges or alerts (`bg-emerald-500/10`, `text-emerald-600 dark:text-emerald-400`).

### Technology Stack
- **Framework**: React + Vite
- **Tailwind Engine**: Tailwind CSS v4 (`@import "tailwindcss";`)
- **Iconography**: `lucide-react`
- **Typography**: Google Fonts: `Outfit` (headings/display) & `Inter` (sans-serif body/ui)

---

## 2. Core CSS Setup (`src/index.css`)

Copy the snippet below directly into your project's main CSS entry point (`src/index.css`):

```css
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));

@theme {
  --font-sans: 'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  --font-outfit: 'Outfit', sans-serif;
}

/* Glassmorphism Custom Utilities */
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

@utility glass-input {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(0, 0, 0, 0.15);
  color: #0f172a;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  .dark & {
    background: rgba(10, 10, 10, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #f8fafc;
  }

  &:focus {
    outline: none;
    border-color: #000000;
    box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.05);

    .dark & {
      border-color: #ffffff;
      box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.05);
    }
  }
}

@layer base {
  button, 
  a, 
  input, 
  select,
  textarea {
    touch-action: manipulation;
  }
}

/* Custom Minimal Scrollbars */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
}
.dark ::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.02);
}
::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 9999px;
}
.dark ::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}
.dark ::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* Base Transitions & Animations */
body {
  transition: background-color 0.3s ease, color 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

/* Native Input Overrides */
input[type="date"] {
  -webkit-appearance: none;
  appearance: none;
  min-width: 0;
  width: 100%;
  box-sizing: border-box;
}
```

---

## 3. Font Imports (`index.html`)

Add Google Fonts to `index.html`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@600;700;800&display=swap" rel="stylesheet">
```

---

## 4. Theme & Layout Architecture

### A. Main App Shell (`App.jsx`)
```jsx
<div className="min-h-screen flex flex-col justify-between pb-12 bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100 transition-colors duration-300">
  <Header />
  <main className="flex-grow max-w-4xl w-full mx-auto px-4 py-6 md:py-8 space-y-8">
    {/* Dynamic tab or page content */}
  </main>
  <Footer />
</div>
```

### B. Header Component (`Header.jsx`)
```jsx
<header className="sticky top-0 z-40 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-900 px-4 py-3.5">
  <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
    {/* Logo & Title */}
    <div className="flex items-center gap-2.5">
      <div className="w-10 h-10 rounded-xl bg-neutral-900 dark:bg-neutral-100 flex items-center justify-center text-white dark:text-neutral-950 shadow-md">
        <Home className="w-5 h-5" />
      </div>
      <div>
        <h1 className="text-xl font-extrabold text-neutral-900 dark:text-white tracking-tight font-outfit m-0 leading-none uppercase">
          App Name
        </h1>
        <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-semibold tracking-wider uppercase mt-1">
          Subheading Label
        </p>
      </div>
    </div>

    {/* Navigation Tabs & Theme Switch */}
    <div className="flex items-center gap-2 w-full sm:w-auto">
      <nav className="flex-grow sm:flex-grow-0 flex bg-neutral-100 dark:bg-neutral-900/60 p-1 rounded-xl border border-neutral-200 dark:border-neutral-800/80">
        <button
          onClick={() => setActiveTab('tab1')}
          className={`flex-grow sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'tab1'
              ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-950 shadow-sm'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <Icon className="w-3.5 h-3.5" />
          Tab Name
        </button>
      </nav>

      <button
        onClick={toggleTheme}
        className="p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800/80 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-all shadow-sm"
      >
        {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>
    </div>
  </div>
</header>
```

### C. Standard Card Panel
```jsx
<section className="bg-white dark:bg-neutral-900/40 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-lg dark:shadow-2xl animate-fade-in transition-all space-y-5">
  <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800/80">
    <div className="flex items-center gap-2.5">
      <Icon className="w-5 h-5 text-neutral-900 dark:text-neutral-100" />
      <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 font-outfit">Card Section Header</h2>
    </div>
  </div>
  {/* Inner content */}
</section>
```

### D. Inputs & Form Controls
```jsx
<div className="space-y-1.5">
  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
    Field Label
  </label>
  <input
    type="text"
    placeholder="Enter text..."
    className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900/80 text-neutral-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100 transition-all placeholder:text-neutral-400"
  />
</div>
```

### E. Primary & Secondary Buttons
```jsx
{/* Primary Action Button */}
<button className="w-full py-3 px-4 bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-white text-white dark:text-neutral-950 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 active:scale-[0.99]">
  <Check className="w-4 h-4" />
  <span>Primary Action</span>
</button>

{/* Secondary Action Button */}
<button className="py-2 px-3 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-xl font-semibold text-xs transition-all flex items-center gap-2 border border-neutral-200 dark:border-neutral-700">
  <Edit className="w-3.5 h-3.5" />
  <span>Secondary</span>
</button>
```

---

## 5. Directives for AI Coding Agents

1. **Strict Dark Mode Parity**: Every structural component MUST declare dark mode counterparts (`dark:...`) for background colors, text colors, border colors, and hover/focus effects.
2. **Typography Hierarchy**:
   - Headers, title titles, card titles, numeric badges: `font-outfit`
   - Form inputs, buttons, body text, subtext: `font-sans` (`Inter`)
3. **Monochrome First**: Avoid generic primary colors like solid `bg-blue-600` or `bg-purple-600`. Use theme-inverting neutrals (`bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-950`) as primary action elements.
4. **Border Radii**:
   - Inputs, buttons, nav pill items: `rounded-xl`
   - Main cards, outer form containers: `rounded-2xl`
   - Micro badges: `rounded-lg` or `rounded-md`
5. **Animation & Touch**: Add `.animate-fade-in` to card containers and interactive view transitions. Ensure touch action optimization on all buttons and inputs.
6. **Mandatory Standard Tailwind Colors & Dual Light/Dark Mode Audit**:
   - Every UI component MUST be explicitly checked and verified for both Light Mode AND Dark Mode color visibility before release.
   - ONLY use standard Tailwind CSS color scale values (`50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950`). NEVER use invalid non-existent values like `neutral-850`.
   - List items and checklist rows MUST explicitly declare light mode (`bg-neutral-100/80 text-neutral-800 border-neutral-200`) and dark mode (`dark:bg-neutral-800/60 dark:text-neutral-200 dark:border-neutral-800`) background and border pairs.
