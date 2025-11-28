# Developer Easter Eggs 🐱

This document describes the hidden developer footprints in the Le Bon Tempérament website.

## Easter Eggs

### 1. Console Messages 👨‍💻

When you open the browser console (F12), you'll see:

- ASCII art cat 🐱
- Hint: "Psst... try typing 'CATS' anywhere on the site!"

### 2. HTML Source Code Comments 📝

View the page source (Ctrl+U or Cmd+Option+U) and look in the `<head>` section. You'll find a beautiful JavaScript comment box in a `<script>` tag with:

- Developer attribution (Thomas Moser)
- GitHub link
- "Developer & Cat Enthusiast 🐱"
- Full tech stack (Next.js 16, React, TypeScript, Supabase, TailwindCSS, Framer Motion)
- "I LOVE CATS!" declaration 🐈
- Easter egg hint

### 3. "CATS" Secret Code 🐱✨

**How to activate:**

- Simply type `CATS` (not case-sensitive) anywhere on the website
- A beautiful modal will appear with:
  - Floating animated cats
  - Developer information
  - Project tech stack
  - Love message about the project
  - Fun stats (infinite lines of code, heart dedication, cat thoughts)
  - GitHub link

**Features:**

- Smooth animations with Framer Motion
- Cat-themed design (because I LOVE CATS!)
- Gradient colors matching the site theme
- Works on all pages

### 4. Hidden Meta Tags 🏷️

In the HTML `<head>`, there are special meta tags:

```html
<meta
  name="developer"
  content="Thomas Moser - https://github.com/Eragon67360"
/>
<meta name="made-with" content="❤️ and 🐱" />
```

## Implementation Details

### Files Created/Modified

- **`components/DeveloperFootprint.tsx`** - Main Easter egg component
  - Console logging on mount
  - "CATS" keyboard detection hook
  - Beautiful modal with animations
- **`app/layout.tsx`** - Root layout
  - Added DeveloperFootprint component
  - Added HTML comments and meta tags

### Technologies Used

- React hooks (useEffect, useState)
- Framer Motion for animations
- HeroUI for modal components
- TailwindCSS for styling

## Other Existing Easter Eggs

The site also has another Easter egg:

- Hold `B` and `T` keys together for 2 seconds (desktop)
- Tap screen 6 times quickly (mobile)
- Opens the "Le BT est-il une secte?" modal

---

**Made with ❤️ and 🐱 by Thomas Moser**  
_Cat enthusiast, code wizard, and dedicated developer_
