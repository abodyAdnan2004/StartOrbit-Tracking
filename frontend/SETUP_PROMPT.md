# SETUP_PROMPT.md

> Give this file to an LLM (e.g. Claude Code) along with the project to bootstrap a new client project from this starter kit.
> Fill in every `[ ]` placeholder before handing it over.

---

## Instructions for the LLM

Apply all of the changes described in the sections below to the codebase.
Do not add features, comments, or refactors beyond what is explicitly listed.
Read each target file before editing it.

---

## 1. Project Identity

**App name:** `[Your App Name]`

### Files to change

**`app.config.ts`**

```
appName = '[Your App Name]'
```

This value also populates the browser tab title suffix via `useHead` in `app.vue`.

---

## 2. Logo

The sidebar logo is rendered by `common/components/global/AppLogo.vue`.
The login page logo is rendered by `common/components/global/ToseelLogo.vue`.

**Action:** Replace both components' content (image `src`, SVG markup, or text) with the client's logo asset.

- Logo file to use: `[/img/logo.svg  OR  paste SVG inline]`
- Sidebar logo dimensions: `[e.g. w-32 h-auto]`
- Login page logo dimensions: `[e.g. w-25 h-25]`

---

## 3. Design System — Colors

Colors are defined in **`theme.config.ts`** inside the `themeConfig` object and are consumed by `tailwind.config.ts`.

Replace the following color tokens with the client's brand colors.
Each color needs a full 50–950 scale (use a tool like [uicolors.app](https://uicolors.app) to generate the scale from a single hex).

```
primary:
  DEFAULT / 500 : [#______]
  50            : [#______]
  100           : [#______]
  200           : [#______]
  300           : [#______]
  400           : [#______]
  600           : [#______]
  700           : [#______]
  800           : [#______]
  900           : [#______]
  950           : [#______]

secondary:
  DEFAULT / 500 : [#______]
  (full scale)

brand.primary     : [#______]   ← used for one-off bg-brand-primary classes
primary-gradient  : [linear-gradient(180deg, #______ 0%, #______ 100%)]
```

Also update `background`:

```
background.light  : [#______]   ← page background (light mode)
background.dark   : [#______]   ← page background (dark mode)
```

---

## 4. Design System — Typography

### Font family

The global font is declared in **`app.vue`** (`<style>`) and loaded via `@font-face` pointing to files in `assets/fonts/`.

**Action:**

1. Place the new font files in `assets/fonts/`.
2. Update the three `@font-face` blocks in `app.vue` — change `font-family`, `src url()`, and `font-weight` values to match.
3. Update the `body, *` rule at the bottom of `app.vue`:
   ```scss
   body,
   * {
     font-family: '[New Font Name]', sans-serif !important;
   }
   ```

Font files to add:

- Regular: `[filename.ttf / .woff2]`
- Bold: `[filename.ttf / .woff2]`
- Light: `[filename.ttf / .woff2]`

### (Optional) Google Font

If using a Google Font instead of local files, replace the `@font-face` blocks with a `<link>` in `app.vue`'s `useHead` call and remove the local font files:

```typescript
useHead({
  link: [{ href: 'https://fonts.googleapis.com/css2?family=[FontName]...', rel: 'stylesheet' }],
})
```

---

## 5. Language & Direction

Default locale is set in **`common/plugins/i18n.ts`**:

```typescript
locale: localStorage.getItem('locale') || '[en | ar]',
defaultLocale: '[en | ar]',
```

The HTML `dir` and `lang` attributes are derived automatically in `app.vue`:

```typescript
dir: i18n.locale.value === 'ar' ? 'rtl' : 'ltr'
```

**If the project is LTR (English):** set both values to `'en'` — no other changes needed.
**If the project is RTL (Arabic):** set both to `'ar'` — the `dir="rtl"` will be applied globally.

Also remove the hardcoded `dir="rtl"` attribute on the `<div>` in `features/auth/routes/login.vue` if present.

---

## 6. Navigation

Edit **`navigation/index.ts`** to reflect the client's sidebar menu.

Each entry follows this shape:

```typescript
{
  name: '[Label shown in sidebar]',
  icon: { name: 'ph-[icon-name]-duotone', class: 'w-5 h-5' },
  to: '/[route-path]',
}
```

For a collapsible group (no direct link, has sub-items):

```typescript
{
  name: '[Group Label]',
  icon: { name: 'ph-[icon-name]-duotone', class: 'w-5 h-5' },
  children: [
    { name: '[Sub Item]', to: '/[path]', icon: { name: 'ph-[icon]-duotone', class: 'w-5 h-5' } },
  ],
}
```

Icon names come from **Phosphor Icons** — browse at [phosphoricons.com](https://phosphoricons.com) and use the kebab-case name with `-duotone` suffix.

**Client menu items:**

```
[
  { name: '...', icon: 'ph-...-duotone', to: '/...' },
  { name: '...', icon: 'ph-...-duotone', to: '/...' },
]
```

---

## 7. API Base URL

The Axios instance is in **`common/services/app-client/axios.ts`**.

Find the `baseURL` assignment and replace it:

```typescript
baseURL: '[https://api.your-domain.com]'
```

---

## 8. Login Page Copy

Update static text in **`features/auth/routes/login.vue`**:

| Current placeholder    | Replace with                              |
| ---------------------- | ----------------------------------------- |
| `Welcome to Zero Tech` | `[Welcome message / brand name]`          |
| Description paragraph  | `[One or two sentences about the system]` |

---

## 9. Feature Modules to Scaffold

For each feature listed below, follow the **7-step CRUD pattern** documented in `LLM.md`.

> Refer to `features/departments/` as the reference implementation.

```
[
  {
    "feature": "[FeatureName]",
    "route": "/[route-path]",
    "apiEndpoint": "/[ApiController]",
    "fields": [
      { "name": "name",        "type": "string",  "required": true  },
      { "name": "description", "type": "string",  "required": false },
      { "name": "[field]",     "type": "[type]",  "required": [bool] }
    ],
    "filters": ["name", "[other filter fields]"],
    "navLabel": "[Sidebar label]",
    "navIcon":  "ph-[icon]-duotone"
  }
]
```

---

## 10. Environment Variables

Create a `.env` file at the project root (copy from `.env.example`):

```
NUXT_PUBLIC_API_BASE=[https://api.your-domain.com]
```

---

## Summary Checklist

After applying all changes above, verify:

- [ ] App name updated in `app.config.ts`
- [ ] Logo replaced in `AppLogo.vue` and `ToseelLogo.vue`
- [ ] Brand colors updated in `theme.config.ts`
- [ ] Font updated in `app.vue` (font-face + body rule)
- [ ] Default locale set in `common/plugins/i18n.ts`
- [ ] Navigation items updated in `navigation/index.ts`
- [ ] API base URL updated in `common/services/app-client/axios.ts`
- [ ] Login page copy updated in `features/auth/routes/login.vue`
- [ ] Feature modules scaffolded per `LLM.md` steps 1–8
- [ ] `.env` created from `.env.example`
