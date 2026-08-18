# Brand Corporations — Website

A static rebuild of the Brand Corporations homepage (brandcorporations.com),
restructured to match the section layout and visual design system of the
**Stuxen** Webflow template ("home-v1"). Plain HTML/CSS/JS — no build step,
no framework, no dependencies required to run it.

## Run it locally

No install needed — just open `index.html` in a browser, or serve it:

```bash
npm run dev
# or, without Node:
python3 -m http.server 3000
```

Then visit http://localhost:3000.

## Project structure

```
index.html          Single-page site (all sections)
css/style.css        Stuxen's own generated design system (colors, type,
                      spacing, components) — reused as-is for exact fidelity
css/custom.css        Supplementary rules: hover micro-interactions, the
                      scrolled-navbar background, mobile menu, and a native
                      horizontal scroller for the blog carousel
js/custom.js          Vanilla JS: mobile nav toggle, tab switching (FAQ +
                      testimonials), blog carousel arrows, scrolled-navbar
                      class toggle
assets/brand/         Real Brand Corporations assets (logo, service icons,
                      creative photography)
assets/stuxen/        Stuxen template's own decorative/demo assets (icons,
                      arrows, placeholder photography) — renamed from their
                      original CDN hashes to descriptive filenames
```

## Design system

Typeface is Poppins (loaded from Google Fonts). Colors and spacing come
from CSS custom properties defined in `css/style.css`:

- `--primary-clr: #5235f6` — accent (buttons, links, highlights)
- `--secondary-clr: #212121` — primary text
- `--white-smoke` — page background
- `--dark-70` / `--dark-16` / `--dark-12` — muted text / border tints

`css/style.css` is Webflow's own compiled output for the Stuxen template, so
changing layout/spacing/typography is usually a matter of adjusting the CSS
custom properties or the relevant `.class-name` rule, not rewriting markup.

## Content status

Real content (pulled from the current brandcorporations.com):
- Hero copy, "10 Years of Experience" badge
- About section mission statement + stats (280+ projects, 120+ client
  testimonials, 100% happy clients, 10+ years)
- All four services (Brand Identity, Marketing Strategy, Web Design,
  Branding) with real descriptions
- Footer contact details (Thetsane Office Park, Maseru, Lesotho;
  +266 50208010; info@brandcorporations.com)
- Hero/About imagery (Brand's own creative photography)

**Placeholder content** — marked with `<!-- PLACEHOLDER -->` comments in
`index.html`, needs to be replaced before this goes live:
- Projects/portfolio section (5 sample case studies, Stuxen demo images —
  the real Projects page wasn't available when this was built)
- Testimonials (3 sample quotes + stock photos)
- Blog/News section (6 sample article titles)
- FAQ answers (generic-but-reasonable; worth a review pass)
- Social links (point to generic facebook.com/twitter.com/etc. — swap in
  real handles)

## Licensing note

Stuxen is a commercial Webflow template (single-use license, by Digitexen).
This repo reuses its compiled CSS and section structure directly for design
fidelity. Before publishing this design in production, purchase a license
from the Stuxen listing on Webflow's template marketplace — treat this repo
as a content/structure prototype until that's sorted out.
