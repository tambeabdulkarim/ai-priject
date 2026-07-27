# Phoenix Home UI - Design Reference

## Overview
Complete design specification for the Phoenix Project landing page (Hero section) matching the provided design mockup.

## Layout Structure (RTL - Arabic)

### Desktop View (1280px+)
```
┌─────────────────────────────────────────────────────────────┐
│                    Navigation Bar (Sticky)                   │
│  🦅 Phoenix Project | Links | Search | Lang | Auth Buttons   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                       Hero Section                           │
│                                                               │
│  Stats Panel  │  Robot Illustration  │  Text Copy            │
│  (250px)      │  (550px)             │  (480px)              │
│  - +200 AI    │  - Glow effect       │  - Headline           │
│  - +150 Edu   │  - Rotating ring     │  - Description        │
│  - +30 Paths  │  - Floating icons    │  - Search bar         │
│  - +10K Users │  - Phoenix wings     │  - CTA Buttons        │
│               │                      │  - Watch demo button  │
└─────────────────────────────────────────────────────────────┘
```

### RTL Text Direction
- **Headline (ar):** "تعلم الذكاء الاصطناعي من البداية إلى الاحتراف"
- **Description (ar):** "منصة شاملة تحتوي على أحدث أدوات الذكاء الاصطناعي، دورات تدريبية عملية، مسارات مهنية، وكتب إلكترونية مختارة بعناية."

---

## Color Palette

### Primary Colors
- **Background:** `#0a0714` (Dark navy/purple)
- **Primary Accent:** `#7c3aed` (Purple)
- **Secondary Accent:** `#db2777` (Pink/Magenta)
- **Tertiary Accent:** `#06b6d4` (Cyan)
- **Text Primary:** `#ffffff` (White)
- **Text Secondary:** `#94a3b8` (Light gray)

### Component Gradients
```css
/* Stat 1 */ linear-gradient(135deg, #7c3aed, #a78bfa)
/* Stat 2 */ linear-gradient(135deg, #db2777, #f472b6)
/* Stat 3 */ linear-gradient(135deg, #0891b2, #38bdf8)
/* Stat 4 */ linear-gradient(135deg, #059669, #34d399)
```

---

## Components

### 1. Hero Stats Panel (Left - RTL)
**Position:** Fixed width 250px on the left side
**Properties:** 
- Background: `rgba(255,255,255,0.04)`
- Border: `1px solid rgba(139,92,246,0.2)`
- Backdrop-filter: `blur(12px)`
- Border-radius: `1.15rem`
- Padding: `1.1rem`

**Content:**
```
┌─ Stat Item ─────────────────┐
│ [Gradient Icon]  [Number]   │
│                  [Label]    │
├─────────────────────────────┤
│ 🤖 +200  أداة ذكاء اصطناعي   │
│ 🎓 +150  دورة تدريبية       │
│ 🗺️  +30   مسار مهني          │
│ 👥 +10K  متعلم نشط          │
└─────────────────────────────┘
```

**Stat Items:**
- Icon: 42px circular gradient background
- Number: Bold, large font
- Label: Smaller, light gray text
- Gap: `0.7rem` between items

### 2. Illustration (Center)
**Dimensions:** ~550px wide, 340px tall
**Components:**

#### A. Glow Effect
- Position: `absolute`, centered
- Size: 240px diameter circle
- Gradient: `radial-gradient(circle, rgba(124,58,237,0.38) 0%, transparent 70%)`
- Box-shadow: `0 0 70px 28px rgba(124,58,237,0.2)`

#### B. Rotating Ring
- Position: `absolute`, centered
- Size: 290px diameter
- Border: `1px solid rgba(139,92,246,0.14)`
- Animation: `rotate 22s linear infinite`

#### C. Robot
- Head: 68px circle, gradient `#1e1040 → #2d1b69`
- Eyes: 2x 10px glowing dots (animation: blink 3.5s)
- Chest: 84px box, "AI" text in purple
- Border: 2px `rgba(139,92,246,0.4)`

#### D. Phoenix Wings (Right of illustration)
- Background gradient positioned at 82% horizontal
- Radial gradient with pink/purple colors
- Opacity: ~10%

#### E. Floating Icon Cards (3x)
- Cards: 0.65rem border-radius, backdrop blur
- Positioned: top-right, middle-left, bottom-right
- Animation: float up/down 4-5s infinite
- Icons: 💬 (comment), 📄 (document), ⌨️ (keyboard)

### 3. Text Copy (Right - RTL)
**Width:** ~480px
**Elements:**

#### A. Headline (h1)
- Font: 800 weight, `clamp(1.9rem, 3.2vw, 2.8rem)`
- Gradient: `linear-gradient(135deg, #ffffff 40%, #a78bfa)`
- Line-height: 1.28
- Max 2 lines

#### B. Description (p)
- Font-size: 0.9rem
- Color: `#94a3b8`
- Line-height: 1.8

#### C. Search Bar
- Container: Rounded pill, `rgba(255,255,255,0.06)` background
- Border: `1px solid rgba(139,92,246,0.25)`
- Input: 0.88rem, no background, white text
- Button: Circular (38px), gradient background `#7c3aed → #db2777`

#### D. CTA Buttons
- Primary: Gradient background, shadow, 0.88rem font
- Ghost: Transparent, border, white text
- Layout: Flex, wrap on smaller screens

---

## Responsive Breakpoints

### Tablet (768px - 1100px)
- Hero layout: 2 columns (illustration + text, stats below)
- Stats: Flex row with wrapping

### Mobile (<768px)
- Hero layout: Single column, full width
- Stats: Full width rows
- Illustration: Reduced height to 280px
- Text: Padding reduced to 1rem

---

## Animations

### 1. Ring Rotation
```css
@keyframes ph-spin {
  to { transform: rotate(360deg); }
}
Animation: 22s linear infinite
```

### 2. Eye Blink
```css
@keyframes ph-blink {
  0%, 88%, 100% { opacity: 1; }
  93% { opacity: 0.1; }
}
Animation: 3.5s ease-in-out infinite
```

### 3. Float Animation
```css
@keyframes ph-float-anim {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-7px); }
}
Animation: 4s to 5s ease-in-out infinite
```

---

## RTL Specific Rules

### Flex Direction
- `.rtl .ph-hero-inner`: `flex-direction: row-reverse`
- This automatically reverses: Stats → Illustration → Text

### Float Positioning
- `.f1`: `left: 6%` (RTL) vs `right: 6%` (LTR)
- `.f2`: `right: 1%` (RTL) vs `left: 1%` (LTR)
- `.f3`: `left: 4%` (RTL) vs `right: 4%` (LTR)

### Text Direction
- All text containers: `direction: rtl`
- Input fields: `direction: rtl`

---

## Feature Grid (Below Hero)

### Layout
- 6 feature cards in 3 columns
- Cards: `ph-feat-card` with colored icon backgrounds
- Badge positioning: Top-right in LTR, top-left in RTL

### Content
```
1. 📚 الكتب الإلكترونية - Books & References
2. 🛒 المنتجات الرقمية - Digital Products
3. 🤖 أدوات الذكاء الاصطناعي - AI Tools (Badge: "الأكثر زيارة")
4. 🎓 الدورات التدريبية - Courses (Badge: "الأكثر شيوعاً")
5. 🗺️ المسارات المهنية - Career Paths
6. ⚡ أخبار الذكاء الاصطناعي - AI News
```

---

## News & Roadmap Section

### 2-Column Layout
- **Left Column:** 3 News cards (gradient backgrounds, badges)
- **Right Column:** 5 Roadmap cards (progress bars, counters)

### News Cards
- Background: Gradient (different for each)
- Badge colors: Red (#ef4444), Blue (#3b82f6), Purple (#8b5cf6)

### Roadmap Cards
- Icon + Title + Subtitle + Progress bar
- Colors: Purple, Pink, Cyan, Amber, Green

---

## Bottom Stats Bar

### Layout
- Horizontal row, 5 items
- Container: Dark background with top/bottom borders
- Width: 100%, padding: 1.5rem

### Stats
```
👥 +10,000 - متعلم نشط (Active Learners)
🎓 +150    - دورة تدريبية (Courses)
🤖 +200    - أداة ذكاء اصطناعي (AI Tools)
🗺️  +30     - مسار مهني (Career Paths)
⭐ 4.9/5   - تقييم المتعلمين (Rating)
```

---

## Footer

### 5-Column Layout
1. **Brand:** Logo, tagline, social links
2. **Quick Links:** Home, Policy, Blog, Contact
3. **Categories:** AI Tools, Courses, Careers, E-books
4. **Support:** Help Center, Privacy, Terms
5. **Newsletter:** Email input + subscribe button

---

## Key CSS Classes

```
.ph-hero           - Hero section container
.ph-hero-inner     - Flex container for layout
.ph-hero-copy      - Text content area
.ph-hero-stats     - Stats panel
.ph-illus          - Illustration container
.ph-robot          - Robot element
.ph-phoenix-wings  - Wings effect
.ph-float          - Floating cards
.ph-search         - Search bar
.ph-btn-primary    - Primary button
.ph-btn-ghost      - Ghost button
```

---

## Accessibility Notes

- All images have alt text via aria-labels
- Color contrast meets WCAG AA standards
- Focus states visible on interactive elements
- RTL layout respects screen reader direction
- Search input has proper labeling
- Navigation links have semantic HTML

---

## Files Involved

- `src/components/HomePageContent.tsx` - Main hero component
- `src/components/Navigation.tsx` - Top navigation
- `src/components/Footer.tsx` - Footer
- `src/app/globals.css` - All Phoenix design system CSS
- `src/lib/i18n.ts` - Arabic/English text

---

**Last Updated:** 2026-07-27
**Design Version:** Phoenix v0.1.0
**Status:** ✅ Live on Vercel
