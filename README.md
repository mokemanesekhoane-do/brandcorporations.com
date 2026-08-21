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
assets/projects/      Real portfolio work — 10 category folders, responsive WebP
assets/clients/       17 client logos, background-stripped transparent WebP
css/style.css        Stuxen's own generated design system (colors, type,
                      spacing, components) — reused as-is for exact fidelity
css/custom.css        Supplementary rules: brand-blue token override, hover
                      micro-interactions, navbar, services, contact form,
                      footer, articles + reader overlay, portfolio lightbox
js/custom.js          Vanilla JS: mobile nav toggle, scroll spy + scroll
                      progress, FAQ accordion, portfolio lightbox, article
                      reader overlay, contact-form validation
assets/brand/         Real Brand Corporations assets (logo, service icons,
                      creative photography)
assets/stuxen/        Stuxen template's own decorative/demo assets (icons,
                      arrows, placeholder photography) — renamed from their
                      original CDN hashes to descriptive filenames
```

## Design system

Typeface is Poppins (loaded from Google Fonts). Colors and spacing come
from CSS custom properties defined in `css/style.css`:

- `--primary-clr: #0878b8` — accent (buttons, links, highlights), Brand's own
  logo blue. Overridden in `custom.css`; `style.css` still declares Stuxen's
  original `#5235f6` purple.
- `--secondary-clr: #212121` — primary text
- `--white-smoke` — page background
- `--dark-70` / `--dark-16` / `--dark-12` — muted text / border tints

`css/style.css` is Webflow's own compiled output for the Stuxen template, so
changing layout/spacing/typography is usually a matter of adjusting the CSS
custom properties or the relevant `.class-name` rule, not rewriting markup.

## Content status

Real content (pulled from the current brandcorporations.com):
- Hero copy, "10 Years of Experience" badge
- About section mission statement + stats (100+ projects, 30+ client
  testimonials, 100% happy clients, 10+ years)
- Five service groups (Brand & Creative; Marketing & Advertising; Events &
  Partnerships; Production & Visibility; Digital & Web) covering 17 offerings
- Footer + contact-form details (Thetsane Office Park, Maseru, Lesotho;
  +266 50208010; info@brandcorporations.com)

- Hero/About imagery (Brand's own creative photography, Stuxen's original
  three-up hero slider layout)
- Portfolio — 45 real project images across 10 categories (Campaign, Corporate
  Identity, Digital Media, Annual Reports, Signage, Vehicle Branding, Office
  Branding, Print, Promotional Items, Web Development), presented as ten
  category cards that open a lightbox gallery
- "Trusted by" client strip — 17 real client logos
- News & insights — 3 real articles ("The True State of Marketing in the
  African Context" by Matseliso Nkopane; "The Contribution of AI to Marketing"
  by Sekhoane Mokemane; "When Your Best Design Is Not the Client's Best
  Solution" by Raymond), each opening a full-text reader overlay. Cards use
  icons rather than thumbnails.

**Still outstanding** before this goes live:
- The Get in touch form has no backend — it validates client-side then falls
  back to `mailto:`. Point `data-endpoint` on `#get-in-touch` at a form
  service (Formspree, Netlify Forms, Basin) to have it POST instead.
- FAQ answers (generic-but-reasonable; worth a review pass)
- Social links (point to generic facebook.com/instagram.com/etc. — swap in
  real handles)

## Licensing note

Stuxen is a commercial Webflow template (single-use license, by Digitexen).
This repo reuses its compiled CSS and section structure directly for design
fidelity. Before publishing this design in production, purchase a license
from the Stuxen listing on Webflow's template marketplace — treat this repo
as a content/structure prototype until that's sorted out.
