# Project context for Claude Code

This is a static HTML/CSS/JS website for **Brand Corporations**, a creative/
branding agency in Maseru, Lesotho. No build tooling, no package manager
dependencies beyond an optional dev-server script — edit the files directly.

## What this is

The section layout and visual language follow the **Stuxen** Webflow template
("home-v1"), which the client asked us to match. **The template's compiled
stylesheet is no longer in this repo.** It was replaced by `css/core.css`, an
original stylesheet written for this site: only the ~130 classes the markup
actually uses, with the design tokens named plainly. The old export was 173KB
of which 84% was dead; core.css is 22KB.

Two stylesheets load, in this order:
- `css/core.css` — reset, design tokens, layout primitives, and the shared
  components (nav, buttons, hero, about, projects, FAQ) plus small structural
  shims for the `w-*` class names the exported markup still carries.
- `css/custom.css` — everything built for this site since, and the overrides.

Read `README.md` first for the full structure/content breakdown.

## Working in this codebase

- **Preserve the class names in the markup** when editing `index.html` — the
  layout depends on them, and `core.css` only defines the ones in use. Prefer
  adding rules to `css/custom.css` (loaded after `core.css`, so it wins)
  rather than editing `core.css`.
- **Order matters inside `core.css`:** the `w-*` shims are deliberately placed
  *before* the component rules. Move them after and `.w-inline-block` /
  `.w-tab-link` start overriding real components — the primary button collapses
  to `inline-block` and the FAQ tabs pick up Webflow's default padding.
- **Design tokens** live as CSS custom properties on `:root` in
  `css/core.css`: `--primary-clr` (accent), `--secondary-clr`
  (#212121, text), `--white-smoke` (page bg), `--dark-70`/`--dark-16`/
  `--dark-12` (muted text / borders). Prefer referencing these over hardcoding
  colors.
- **The accent is Brand's logo blue `#0878b8`**, not Stuxen's purple. It is
  retoned by overriding `--primary-clr` on `body` in `css/custom.css`
  (`core.css` declares the template's original `#5235f6` as the base). Every
  accent in the design system resolves through that one token, so recolouring
  happens in a single place; `--primary-dark`, `--primary-08` and
  `--primary-16` are companion tints defined next to it. The eight
  `assets/stuxen/*.svg` that hardcoded the purple were rewritten to the blue.
- **No Webflow runtime is included.** The original template relies on
  Webflow's IX2 interactions engine and w-tabs/w-slider JS, none of which
  ships outside Webflow hosting. `js/custom.js` hand-implements the pieces
  that matter (mobile nav, and FAQ accordion switching via `.w-tabs` /
  `.w-tab-link` / `.w-tab-pane` / `w--current` / `w--tab-active` class
  toggling). If you add more tab/accordion UI, reuse those same Webflow class
  conventions and the existing generic handler in `js/custom.js` picks it up
  automatically — no new JS needed.
- **There are no `PLACEHOLDER` markers left.** Projects, client logos and
  articles are all real content. What is still generic: the FAQ answers, and
  the footer social links (they point at bare facebook.com / instagram.com).
- **The portfolio is ten category cards, not ten individual projects.** Each
  card in `#projects` carries `data-gallery` (category slug),
  `data-gallery-title` and `data-gallery-count`. The lightbox in
  `js/custom.js` rebuilds each gallery from those attributes via the filename
  convention `assets/projects/<slug>/<slug>-<NN>-<width>.webp` (NN 1-based and
  zero-padded; widths 480/800/1254). There is no separate manifest, so **to
  add an image, drop in its three derivatives under the next NN and bump
  `data-gallery-count`** — it appears in the gallery with no other change.
- **Project thumbnails are square on purpose.** Sources were padded — never
  cropped — to 1:1 against their own edge colour at build time, and
  `custom.css` releases Stuxen's mobile `max-height` caps on
  `.project-v1-img` so that ratio holds at every breakpoint. Keep new
  portfolio images square.
- **Assets**: `assets/projects/<category>/` is the real portfolio work (45
  images x 3 widths, WebP). `assets/clients/` is the 17 client logos, white
  backgrounds flood-filled to transparency and trimmed, at 1x/2x.
  `assets/brand/` is the other real client material (logo, icons, photos).
  `assets/stuxen/` is what remains of the template's own decorative assets,
  renamed from CDN hashes to descriptive names. It has been pruned to the ten
  files still referenced — the blog, testimonial and project-icon demo assets
  were deleted along with the sections that used them.

## Sections that are no longer Stuxen

Four areas were rebuilt from scratch and do **not** use the template's class
names. They live entirely in `custom.css` / `custom.js`, so Stuxen's rules
don't reach them — style them directly, don't hunt for a `core.css` hook.

- **Services** (`#services`) — `.svc-*`. Five practice groups, each a card
  listing its offerings. The grid is **6 columns**: the first three cards
  `span 2` (three per row), the last two `span 3` (two per row), which fills
  both rows with no orphan. Adding a sixth group means rethinking those spans.
  Icons are inline SVG (`stroke="currentColor"`, 1.5px) in the markup, not
  image files; `assets/brand/icon-*.png` are unused but kept as client
  material.
- **Get in touch** (`#contact`) — `.gt-*`. Replaces the old footer-as-contact.
  Deliberately **unboxed** — no card, no shadow, no icon tiles; fields are
  underlines rather than filled boxes. It is **two columns** (copy + direct
  details left, form right): a single centred column was tried and left the
  section mostly empty on wide screens. Both properties were specifically
  asked for — unboxed because the card version read as cluttered, two-column
  because the single column read as too much whitespace.
  **The form has no backend.** With `data-endpoint` empty it validates, then
  hands off to `mailto:` so it does something real on a static host. Set
  `data-endpoint` on `#get-in-touch` to a form service URL and `custom.js`
  POSTs JSON there instead — that path is already written.
- **Footer** (`#site-footer`) — `.ft-*`, a `<footer>` element now. Logo,
  tagline, social icons (inline SVG), contact block, copyright. The Stuxen
  footer menu was removed on request. It uses a **purpose-built reversed
  asset**, `assets/brand/brand-logo-white.png`: the disc painted white with
  the lettering knocked out to transparent, so the dark footer reads through
  it. **Never try to derive this with a CSS filter** — in the source the
  wordmark is white *pixels*, not a knockout, so `brightness(0) invert(1)`
  turns the letters white too and flattens the mark into a solid blob. The
  navbar keeps the full-colour `brand-logo.png`.

- **Articles** (`#articles`) — `.art-*`, replacing Stuxen's blog carousel.
  **Three equal cards — there is no lead story.** An editorial split with a
  featured `.art-feature` panel was tried and rejected; keep the cards equal.
  Each carries a square cover from `assets/articles/`, with the topic icon as
  a glass badge over the image corner.
  The card is an `<article>`; the "Read article" `<button>` is stretched over
  it with `::after` so the whole card is clickable while the markup stays
  valid — a `<button>` may not contain the `<h3>`/`<p>`, which an earlier
  version got wrong. Full text sits in a `<template id="article-N">` at the
  end of the section and is cloned into the overlay on open, so bodies cost
  nothing until requested. Author, role, topic and read time ride on `data-*`
  attributes of the template; the avatar circle is generated from the
  author's initials. To add an article, add a card plus a matching
  `<template>` — the reader binds by `data-article` → template `id`.
- **`assets/articles/*.webp` are the client-supplied cover images**, matched
  to each article by content (the filenames they arrived under were generic).
  They are **square**, so the card frame is `aspect-ratio: 1 / 1` and nothing
  is cropped — replacements should also be square, ideally 1000x1000 or
  larger, under the same filenames.
  The `.rd-*` **reader overlay lives in its own banner block** in
  `custom.css`, separate from the card styles, so restyling the cards can't
  delete the reader with them.

**Two `custom.css` traps, both of which have already caused breakage:**

1. **Always give inline SVGs an explicit width/height.** An unsized inline
   `<svg>` falls back to a ~300x150 intrinsic box. A missing
   `.gt-submit svg { width: 17px; height: 17px }` blew the submit button up
   to 152px tall and the select wrapper to 382px.
2. **Each banner-comment block must be self-contained.** These sections get
   rewritten wholesale; if one block only holds *overrides* and relies on an
   earlier block for its base rules, deleting that earlier block silently
   guts it. Write the full rule set inside the block that owns the component.

**The hero and About sections are stock Stuxen and must stay that way** — both
were rebuilt once (single 21:9 hero banner, 4:5 About portrait) and reverted at
the client's request because they preferred the original. The hero is Stuxen's
three-up `.hero-slider`; About uses `.about-v1-img`.

**Hero slide slots are square and are not in DOM order.** Measured on the page:
`_03` renders far left (479px), the unsuffixed slide is the large centre
(524px), `_02` renders far right (475px) — so the files are `hero-left.jpg`,
`hero-middle.jpg`, `hero-right.jpg` respectively. Supply replacements at
**1200x1200**; anything landscape gets a centred square crop.
`hero-left.jpg` is currently only 667px (its source was 1000x667), i.e. below
2x for its slot — replace with a larger original when one exists.

**Testimonials and the blog carousel were deleted.** The generic `.w-tabs`
handler in `custom.js` is still needed — the FAQ accordion uses it.

## SEO / head

The `<head>` carries canonical, Open Graph, Twitter Card, theme-color, a
favicon set and a JSON-LD `ProfessionalService` block. **They all hardcode
`https://brandcorporations.com`** — if the real domain differs, change the
canonical, both `og:`/`twitter:` image URLs, the JSON-LD `url`/`logo`/`image`,
`sitemap.xml` and `robots.txt` together.

The JSON-LD `sameAs` array is deliberately empty: it should list the real
social profile URLs, which the footer links do not have yet either.

**The hero images are the LCP.** They carry `fetchpriority="high"` and must
never be given `loading="lazy"` — all three were lazy-loaded before the audit,
which was the single biggest performance defect on the site. They serve
400/700/1200 derivatives via `srcset` (`hero-left` stops at 667, its source
size — do not upscale it).

Google Fonts requests exactly the five variants the CSS uses (300, 300 italic,
400, 500, 600) with `display=swap` and preconnect to `fonts.gstatic.com`.
Adding a weight to the CSS means adding it to that URL too.

The favicon is **not** the wordmark — that is 765x426 and illegible at 16px.
`assets/brand/favicon-*.png` is a purpose-built disc-and-B mark generated to
match the brand blue.

## Constraints

- Don't reintroduce Webflow-specific asset URLs (`cdn.prod.website-files.com`)
  — everything must stay self-contained under `assets/`.
- Google Fonts (Poppins) is loaded via a normal `<link>` in `<head>` — this is
  the one legitimate external dependency, leave it as-is.
- **Don't reintroduce the template's compiled CSS.** It was removed
  deliberately: shipping it in a public repo redistributes a commercially
  licensed asset. If a component needs a style that used to come from it,
  write the rule in `core.css` or `custom.css`.
