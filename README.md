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
404.html            Not-found page
privacy.html        Privacy policy
robots.txt          Crawler directives (points at the sitemap)
sitemap.xml         Sitemap
site.webmanifest    PWA/icon manifest
assets/projects/      Real portfolio work — 10 category folders, responsive WebP
assets/clients/       17 client logos, background-stripped transparent WebP
css/core.css          Original stylesheet: reset, design tokens, layout
                      primitives and shared components (22KB)
css/custom.css        Supplementary rules: brand-blue token override, hover
                      micro-interactions, navbar, services, contact form,
                      footer, articles + reader overlay, portfolio lightbox
js/custom.js          Vanilla JS: mobile nav toggle, scroll spy + scroll
                      progress, FAQ accordion, portfolio lightbox, article
                      reader overlay, contact-form validation
assets/brand/         Real Brand Corporations assets (logo, service icons,
                      creative photography)
assets/stuxen/        The few remaining decorative assets (arrows, icons,
                      hero/services backgrounds) kept from the template pass
```

## Design system

Typeface is Poppins (loaded from Google Fonts). Colors and spacing come
from CSS custom properties defined on `:root` in `css/core.css`:

- `--primary-clr: #0878b8` — accent (buttons, links, highlights), Brand's own
  logo blue. Set in `custom.css`, overriding the base value in `core.css`.
- `--secondary-clr: #212121` — primary text
- `--white-smoke` — page background
- `--dark-70` / `--dark-16` / `--dark-12` — muted text / border tints

`css/core.css` is hand-written and carries only what this site uses, so
changing layout/spacing/typography is usually a matter of adjusting a token or
the relevant `.class-name` rule, not rewriting markup.

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
- Social links (point to generic facebook.com/instagram.com/etc. — swap in
  real handles). They also feed the empty `sameAs` array in the JSON-LD.
- Set the real domain: the canonical URL, OG tags, sitemap and JSON-LD all
  assume `https://brandcorporations.com`. Change them together if it differs.
- Have the privacy policy reviewed — it is an accurate plain-language draft,
  not legal advice.
- The Get in touch form has no backend — it validates client-side then falls
  back to `mailto:`. Point `data-endpoint` on `#get-in-touch` at a form
  service (Formspree, Netlify Forms, Basin) to have it POST instead.
- FAQ answers (generic-but-reasonable; worth a review pass)

## Licensing note

The section layout and visual language follow the **Stuxen** Webflow template
(by Digitexen), but **none of its code ships here**. Its compiled stylesheet
was replaced by `css/core.css`, written for this site from scratch, and the
template's demo assets were deleted along with the sections that used them.

Note that the template's stylesheet is still present in this repository's git
**history**, in the initial commit. Removing it from the working tree does not
remove it from history — that needs the history rewritten or the project
re-committed into a clean repo.
