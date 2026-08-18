# Project context for Claude Code

This is a static HTML/CSS/JS website for **Brand Corporations**, a creative/
branding agency in Maseru, Lesotho. No build tooling, no package manager
dependencies beyond an optional dev-server script — edit the files directly.

## What this is

The layout, spacing, typography and component styling are copied from the
**Stuxen** Webflow template ("home-v1") to spec, per the client's request to
reuse that exact design. `css/style.css` is Stuxen's own compiled CSS output
— treat it as a design system, not boilerplate to rewrite. Only content,
images and a handful of interaction behaviors (mobile menu, tabs, carousel)
were added on top, in `css/custom.css` and `js/custom.js`.

Read `README.md` first for the full structure/content breakdown.

## Working in this codebase

- **Preserve the class names from `css/style.css`** when editing `index.html`
  — the whole visual design depends on them. If you need new styling, prefer
  adding rules to `css/custom.css` (loaded after `style.css`, so it can
  override) rather than editing `style.css` itself.
- **Design tokens** live as CSS custom properties on `body` in
  `css/style.css`: `--primary-clr` (#5235f6, accent), `--secondary-clr`
  (#212121, text), `--white-smoke` (page bg), `--dark-70`/`--dark-16`/
  `--dark-12` (muted text / borders). Prefer referencing these over hardcoding
  colors.
- **No Webflow runtime is included.** The original template relies on
  Webflow's IX2 interactions engine and w-tabs/w-slider JS, none of which
  ships outside Webflow hosting. `js/custom.js` hand-implements the pieces
  that matter (mobile nav, FAQ + testimonial tab switching via `.w-tabs` /
  `.w-tab-link` / `.w-tab-pane` / `w--current` / `w--tab-active` class
  toggling, and a native-scroll blog carousel). If you add more tab/accordion
  UI, reuse those same Webflow class conventions and the existing generic
  handler in `js/custom.js` picks it up automatically — no new JS needed.
- **Placeholder content is marked** with `<!-- PLACEHOLDER: ... -->` HTML
  comments directly above the affected markup (projects, testimonials, blog
  posts). Search for `PLACEHOLDER` before doing a content pass.
- **Assets**: `assets/brand/` is real client material (logo, icons, photos).
  `assets/stuxen/` is the template's own decorative/demo assets, renamed from
  CDN hashes to descriptive names — safe to swap individual files out as real
  content replaces placeholders (e.g. real project thumbnails replacing
  `project-thumb-0N.avif`).

## Constraints

- Don't reintroduce Webflow-specific asset URLs (`cdn.prod.website-files.com`)
  — everything must stay self-contained under `assets/`.
- Google Fonts (Poppins) is loaded via a normal `<link>` in `<head>` — this is
  the one legitimate external dependency, leave it as-is.
- Stuxen is a commercially licensed template (see README's Licensing note).
  Don't represent this repo as cleared for production use without flagging
  that to whoever's driving.
