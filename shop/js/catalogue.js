/* =========================================================================
   Brand Corporations Shop — product catalogue
   ---------------------------------------------------------------------
   PLACEHOLDER DATA. Every product, specification and price below is
   representative, not Brand Corporations' real price list. Replace this file
   (or serve the same shape from an API) before the shop goes anywhere near a
   customer.

   Shape of a product:
     id        stable slug, used in URLs and order lines
     category  one of CATEGORIES[].id
     name, blurb, description
     image     path relative to shop/
     specs     [[label, value], ...]  shown in the spec table
     options   [{ id, label, choices:[{ id, label, delta }] }]
                 delta = amount added to the unit price, in Maloti
     pricing   { type:'tiers', unit:'pack', tiers:[{ qty, price }] }
                 the customer picks a tier (print runs), price is per pack
               { type:'unit', min, step, price, breaks:[{ from, price }] }
                 priced per item, cheaper past each break
     leadTime  working days, shown on the product and in checkout
   ========================================================================= */

const CURRENCY = { code: 'LSL', symbol: 'M' };

const CATEGORIES = [
  { id: 'stationery', name: 'Business Stationery',
    blurb: 'Cards, letterheads and the everyday pieces that carry your identity.' },
  { id: 'print', name: 'Print & Publishing',
    blurb: 'Flyers, brochures, profiles and annual reports.' },
  { id: 'display', name: 'Banners & Display',
    blurb: 'Pull-up banners, flags, gazebos and event backdrops.' },
  { id: 'signage', name: 'Signage',
    blurb: 'Interior, exterior and safety signage, produced and installed.' },
  { id: 'promo', name: 'Promotional Items',
    blurb: 'Branded merchandise that puts your mark in people’s hands.' },
  { id: 'branding', name: 'Vehicle & Office Branding',
    blurb: 'Wraps, window vinyl and wall graphics.' },
];

const PRODUCTS = [
  /* ---------------- stationery ---------------- */
  {
    id: 'business-cards',
    category: 'stationery',
    name: 'Business Cards',
    blurb: 'Full-colour, double-sided, on premium board.',
    description: 'Standard 90 x 50 mm cards printed full colour. Choose your stock and finish — matt lamination is the popular default; spot UV lifts a logo off the card without shouting.',
    image: '../assets/projects/corporate-identity/corporate-identity-02-800.webp',
    specs: [['Size', '90 x 50 mm'], ['Print', 'Full colour, both sides'], ['Default stock', '350gsm art board'], ['Packing', 'Shrink-wrapped in 50s']],
    options: [
      { id: 'stock', label: 'Card stock', choices: [
        { id: '350', label: '350gsm art board', delta: 0 },
        { id: '400', label: '400gsm heavy board', delta: 120 },
        { id: 'kraft', label: '400gsm natural kraft', delta: 180 } ] },
      { id: 'finish', label: 'Finish', choices: [
        { id: 'matt', label: 'Matt lamination', delta: 0 },
        { id: 'gloss', label: 'Gloss lamination', delta: 0 },
        { id: 'spotuv', label: 'Matt + spot UV', delta: 260 },
        { id: 'none', label: 'Uncoated', delta: -80 } ] },
    ],
    pricing: { type: 'tiers', unit: 'pack', tiers: [
      { qty: 100, price: 450 }, { qty: 250, price: 780 },
      { qty: 500, price: 1180 }, { qty: 1000, price: 1850 } ] },
    leadTime: 3,
  },
  {
    id: 'letterheads',
    category: 'stationery',
    name: 'Letterheads',
    blurb: 'A4 corporate letterheads on bond paper.',
    description: 'Printed A4 letterheads on quality bond. Supplied flat and boxed, ready for the printer tray.',
    image: '../assets/projects/corporate-identity/corporate-identity-01-800.webp',
    specs: [['Size', 'A4 (210 x 297 mm)'], ['Stock', '100gsm bond'], ['Print', 'Full colour, single sided'], ['Packing', 'Boxed in 250s']],
    options: [
      { id: 'sides', label: 'Printed sides', choices: [
        { id: '1', label: 'Single sided', delta: 0 },
        { id: '2', label: 'Double sided', delta: 320 } ] },
    ],
    pricing: { type: 'tiers', unit: 'pack', tiers: [
      { qty: 250, price: 890 }, { qty: 500, price: 1490 }, { qty: 1000, price: 2450 } ] },
    leadTime: 4,
  },
  {
    id: 'company-folders',
    category: 'stationery',
    name: 'Presentation Folders',
    blurb: 'A4 folders with a business-card slot.',
    description: 'Die-cut A4 presentation folders with an interior pocket and card slit. Matt laminated as standard so they survive a client meeting.',
    image: '../assets/projects/corporate-identity/corporate-identity-04-800.webp',
    specs: [['Fits', 'A4 documents'], ['Stock', '350gsm art board'], ['Finish', 'Matt lamination'], ['Extras', 'Business-card slot']],
    options: [
      { id: 'pockets', label: 'Pockets', choices: [
        { id: '1', label: 'Single pocket', delta: 0 },
        { id: '2', label: 'Twin pocket', delta: 420 } ] },
    ],
    pricing: { type: 'tiers', unit: 'pack', tiers: [
      { qty: 50, price: 1250 }, { qty: 100, price: 2100 }, { qty: 250, price: 4400 } ] },
    leadTime: 5,
  },

  /* ---------------- print ---------------- */
  {
    id: 'flyers',
    category: 'print',
    name: 'Flyers',
    blurb: 'A5 or A4, full colour, both sides.',
    description: 'Full-colour flyers for campaigns, promotions and activations. Gloss art paper as standard; ask about uncoated if they need to be written on.',
    image: '../assets/projects/print/print-01-800.webp',
    specs: [['Sizes', 'A6, A5 or A4'], ['Stock', '135gsm gloss art'], ['Print', 'Full colour, both sides'], ['Trim', 'Guillotined, 3mm bleed']],
    options: [
      { id: 'size', label: 'Size', choices: [
        { id: 'a6', label: 'A6 (105 x 148 mm)', delta: -260 },
        { id: 'a5', label: 'A5 (148 x 210 mm)', delta: 0 },
        { id: 'a4', label: 'A4 (210 x 297 mm)', delta: 540 } ] },
      { id: 'stock', label: 'Stock', choices: [
        { id: '135', label: '135gsm gloss art', delta: 0 },
        { id: '170', label: '170gsm gloss art', delta: 210 },
        { id: 'uncoated', label: '120gsm uncoated', delta: 90 } ] },
    ],
    pricing: { type: 'tiers', unit: 'pack', tiers: [
      { qty: 250, price: 980 }, { qty: 500, price: 1520 },
      { qty: 1000, price: 2380 }, { qty: 2500, price: 4900 } ] },
    leadTime: 4,
  },
  {
    id: 'company-profile',
    category: 'print',
    name: 'Company Profiles',
    blurb: 'Saddle-stitched A4 profile booklets.',
    description: 'Perfect-looking A4 profiles, saddle-stitched, with a laminated cover. Page count is set in multiples of four.',
    image: '../assets/projects/print/print-03-800.webp',
    specs: [['Size', 'A4 portrait'], ['Binding', 'Saddle stitched'], ['Cover', '250gsm, matt laminated'], ['Inner', '135gsm gloss art']],
    options: [
      { id: 'pages', label: 'Page count', choices: [
        { id: '8', label: '8 pages', delta: 0 },
        { id: '12', label: '12 pages', delta: 1150 },
        { id: '16', label: '16 pages', delta: 2200 },
        { id: '24', label: '24 pages', delta: 4100 } ] },
    ],
    pricing: { type: 'tiers', unit: 'pack', tiers: [
      { qty: 50, price: 3400 }, { qty: 100, price: 5600 }, { qty: 250, price: 11800 } ] },
    leadTime: 7,
  },
  {
    id: 'annual-report',
    category: 'print',
    name: 'Annual Reports',
    blurb: 'Perfect-bound reports, print-ready or designed by us.',
    description: 'Perfect-bound annual reports on quality stock. Send print-ready artwork, or add design and we will lay the whole document out.',
    image: '../assets/projects/reports/reports-03-800.webp',
    specs: [['Size', 'A4 portrait'], ['Binding', 'Perfect bound'], ['Cover', '300gsm, matt laminated'], ['Inner', '120gsm silk']],
    options: [
      { id: 'extent', label: 'Extent', choices: [
        { id: '32', label: '32 pages', delta: 0 },
        { id: '48', label: '48 pages', delta: 3900 },
        { id: '64', label: '64 pages', delta: 7400 } ] },
      { id: 'design', label: 'Design', choices: [
        { id: 'supplied', label: 'I supply print-ready artwork', delta: 0 },
        { id: 'layout', label: 'Add layout & design', delta: 12500 } ] },
    ],
    pricing: { type: 'tiers', unit: 'pack', tiers: [
      { qty: 50, price: 8900 }, { qty: 100, price: 14500 }, { qty: 250, price: 29800 } ] },
    leadTime: 12,
  },

  /* ---------------- display ---------------- */
  {
    id: 'pullup-banner',
    category: 'display',
    name: 'Pull-up Banner',
    blurb: 'Retractable banner with case and carry bag.',
    description: 'Roll-up banner printed on 440gsm blockout PVC, in an aluminium cassette with a padded carry bag. The workhorse of every activation.',
    image: '../assets/projects/signage/signage-02-800.webp',
    specs: [['Print size', '850 x 2000 mm'], ['Material', '440gsm blockout PVC'], ['Base', 'Aluminium retractable'], ['Includes', 'Carry bag']],
    options: [
      { id: 'width', label: 'Width', choices: [
        { id: '850', label: '850 mm (standard)', delta: 0 },
        { id: '1000', label: '1000 mm', delta: 340 },
        { id: '1200', label: '1200 mm', delta: 690 } ] },
      { id: 'base', label: 'Base quality', choices: [
        { id: 'standard', label: 'Standard', delta: 0 },
        { id: 'deluxe', label: 'Deluxe (wider foot)', delta: 480 } ] },
    ],
    pricing: { type: 'unit', min: 1, step: 1, price: 1450,
      breaks: [{ from: 3, price: 1340 }, { from: 6, price: 1240 }, { from: 12, price: 1120 }] },
    leadTime: 4,
  },
  {
    id: 'feather-flag',
    category: 'display',
    name: 'Feather Flag',
    blurb: 'Outdoor flag with pole set and ground spike.',
    description: 'Printed on knitted polyester so it reads in the wind. Supplied with a fibreglass pole set and your choice of ground fixing.',
    image: '../assets/projects/signage/signage-04-800.webp',
    specs: [['Height', '2.8 m / 3.4 m / 4.5 m'], ['Material', '110gsm knitted polyester'], ['Print', 'Dye sublimation, single sided'], ['Includes', 'Pole set + bag']],
    options: [
      { id: 'height', label: 'Height', choices: [
        { id: '28', label: '2.8 m', delta: 0 },
        { id: '34', label: '3.4 m', delta: 420 },
        { id: '45', label: '4.5 m', delta: 980 } ] },
      { id: 'fixing', label: 'Ground fixing', choices: [
        { id: 'spike', label: 'Ground spike', delta: 0 },
        { id: 'cross', label: 'Cross base + weight', delta: 560 } ] },
    ],
    pricing: { type: 'unit', min: 1, step: 1, price: 1680,
      breaks: [{ from: 3, price: 1560 }, { from: 6, price: 1450 }] },
    leadTime: 6,
  },
  {
    id: 'gazebo',
    category: 'display',
    name: 'Branded Gazebo',
    blurb: '3 x 3 m folding gazebo, fully printed.',
    description: 'Aluminium folding gazebo with a printed canopy and optional printed walls. Comes in a wheeled bag — the standard kit for testing stations, activations and expos.',
    image: '../assets/projects/signage/signage-05-800.webp',
    specs: [['Size', '3 x 3 m'], ['Frame', 'Aluminium, folding'], ['Canopy', '600D printed polyester'], ['Includes', 'Wheeled carry bag, pegs']],
    options: [
      { id: 'walls', label: 'Walls', choices: [
        { id: 'none', label: 'Canopy only', delta: 0 },
        { id: 'back', label: '+ 1 printed back wall', delta: 2400 },
        { id: 'three', label: '+ 3 printed walls', delta: 6200 } ] },
    ],
    pricing: { type: 'unit', min: 1, step: 1, price: 12800,
      breaks: [{ from: 3, price: 12100 }] },
    leadTime: 12,
  },

  /* ---------------- signage ---------------- */
  {
    id: 'acrylic-sign',
    category: 'signage',
    name: 'Acrylic Reception Sign',
    blurb: 'Perspex sign with standoff fixings.',
    description: 'Laser-cut acrylic panel with a printed or vinyl-applied logo, mounted on polished standoffs. Priced per square metre; installation in Maseru available.',
    image: '../assets/projects/signage/signage-01-800.webp',
    specs: [['Material', '5 mm cast acrylic'], ['Fixing', 'Stainless standoffs'], ['Finish', 'Printed or cut vinyl'], ['Priced', 'Per square metre']],
    options: [
      { id: 'size', label: 'Panel size', choices: [
        { id: 'sm', label: '600 x 400 mm', delta: 0 },
        { id: 'md', label: '900 x 600 mm', delta: 1350 },
        { id: 'lg', label: '1200 x 800 mm', delta: 3100 } ] },
      { id: 'install', label: 'Installation', choices: [
        { id: 'none', label: 'Supply only', delta: 0 },
        { id: 'maseru', label: 'Supply + install (Maseru)', delta: 1200 } ] },
    ],
    pricing: { type: 'unit', min: 1, step: 1, price: 2650, breaks: [{ from: 3, price: 2480 }] },
    leadTime: 10,
  },
  {
    id: 'safety-signage',
    category: 'signage',
    name: 'Safety & Wayfinding Signs',
    blurb: 'Durable ACP signs for site and building use.',
    description: 'Printed aluminium composite signs with a UV laminate, drilled and ready to fix. Standard safety symbols or your own artwork.',
    image: '../assets/projects/signage/signage-03-800.webp',
    specs: [['Material', '3 mm ACP'], ['Print', 'UV direct + laminate'], ['Sizes', 'A4 up to 600 x 400 mm'], ['Fixing', 'Pre-drilled corners']],
    options: [
      { id: 'size', label: 'Size', choices: [
        { id: 'a4', label: 'A4', delta: 0 },
        { id: 'a3', label: 'A3', delta: 145 },
        { id: '600', label: '600 x 400 mm', delta: 330 } ] },
    ],
    pricing: { type: 'unit', min: 5, step: 5, price: 285,
      breaks: [{ from: 20, price: 255 }, { from: 50, price: 225 }] },
    leadTime: 7,
  },

  /* ---------------- promo ---------------- */
  {
    id: 'branded-pens',
    category: 'promo',
    name: 'Branded Pens',
    blurb: 'Metal or plastic barrels, one-colour print.',
    description: 'The reliable giveaway. One-colour print or laser engraving on the barrel, minimum 50 units.',
    image: '../assets/projects/promo-items/promo-items-02-800.webp',
    specs: [['Minimum', '50 units'], ['Branding', 'Pad print or laser'], ['Ink', 'Blue or black'], ['Barrel', 'Plastic or brushed metal']],
    options: [
      { id: 'barrel', label: 'Barrel', choices: [
        { id: 'plastic', label: 'Plastic', delta: 0 },
        { id: 'metal', label: 'Brushed metal', delta: 14 } ] },
      { id: 'brand', label: 'Branding', choices: [
        { id: 'pad', label: 'Pad print, 1 colour', delta: 0 },
        { id: 'laser', label: 'Laser engraved', delta: 8 } ] },
    ],
    pricing: { type: 'unit', min: 50, step: 25, price: 22,
      breaks: [{ from: 250, price: 19 }, { from: 500, price: 16 }, { from: 1000, price: 14 }] },
    leadTime: 8,
  },
  {
    id: 'branded-mugs',
    category: 'promo',
    name: 'Branded Mugs',
    blurb: 'Ceramic mugs, full-colour wrap print.',
    description: 'Dye-sublimated ceramic mugs, dishwasher safe. Full-colour wrap so photographs and gradients hold up.',
    image: '../assets/projects/promo-items/promo-items-03-800.webp',
    specs: [['Capacity', '330 ml'], ['Print', 'Full colour sublimation'], ['Minimum', '25 units'], ['Care', 'Dishwasher safe']],
    options: [
      { id: 'style', label: 'Mug', choices: [
        { id: 'white', label: 'White', delta: 0 },
        { id: 'inner', label: 'Coloured inner & handle', delta: 18 },
        { id: 'magic', label: 'Colour-change', delta: 46 } ] },
      { id: 'box', label: 'Packaging', choices: [
        { id: 'bulk', label: 'Bulk packed', delta: 0 },
        { id: 'gift', label: 'Individual gift box', delta: 22 } ] },
    ],
    pricing: { type: 'unit', min: 25, step: 25, price: 95,
      breaks: [{ from: 100, price: 86 }, { from: 250, price: 78 }] },
    leadTime: 8,
  },
  {
    id: 'branded-notebooks',
    category: 'promo',
    name: 'Branded Notebooks',
    blurb: 'A5 hardcover notebooks with an elastic closure.',
    description: 'A5 hardcover notebooks, 80 lined pages, elastic closure and ribbon marker. Debossed or full-colour printed cover.',
    image: '../assets/projects/promo-items/promo-items-01-800.webp',
    specs: [['Size', 'A5'], ['Pages', '80, lined'], ['Cover', 'Hardcover PU'], ['Extras', 'Elastic closure, ribbon']],
    options: [
      { id: 'brand', label: 'Cover branding', choices: [
        { id: 'deboss', label: 'Debossed logo', delta: 0 },
        { id: 'print', label: 'Full-colour print', delta: 34 } ] },
    ],
    pricing: { type: 'unit', min: 25, step: 25, price: 165,
      breaks: [{ from: 100, price: 148 }, { from: 250, price: 132 }] },
    leadTime: 10,
  },
  {
    id: 'branded-apparel',
    category: 'promo',
    name: 'Branded T-Shirts',
    blurb: 'Cotton tees, screen printed or embroidered.',
    description: '180gsm cotton T-shirts. Screen print for larger runs, embroidery for a smarter finish. Mixed sizes are fine — tell us the split in the order notes.',
    image: '../assets/projects/promo-items/promo-items-04-800.webp',
    specs: [['Fabric', '180gsm cotton'], ['Sizes', 'S – 3XL'], ['Branding', 'Screen print or embroidery'], ['Minimum', '20 units']],
    options: [
      { id: 'brand', label: 'Branding', choices: [
        { id: 'screen1', label: 'Screen print, 1 position', delta: 0 },
        { id: 'screen2', label: 'Screen print, 2 positions', delta: 32 },
        { id: 'embroidery', label: 'Embroidered logo', delta: 55 } ] },
      { id: 'colour', label: 'Garment colour', choices: [
        { id: 'white', label: 'White', delta: 0 },
        { id: 'colour', label: 'Coloured', delta: 15 } ] },
    ],
    pricing: { type: 'unit', min: 20, step: 10, price: 175,
      breaks: [{ from: 50, price: 162 }, { from: 100, price: 148 }, { from: 250, price: 136 }] },
    leadTime: 12,
  },

  /* ---------------- branding ---------------- */
  {
    id: 'vehicle-branding',
    category: 'branding',
    name: 'Vehicle Branding',
    blurb: 'Cut vinyl or full wrap, fitted by us.',
    description: 'Cast vinyl graphics applied by our own fitters. Priced by coverage — partial covers doors and tailgate, full is a complete wrap.',
    image: '../assets/projects/car-branding/car-branding-05-800.webp',
    specs: [['Material', 'Cast vinyl, 5-year'], ['Laminate', 'UV gloss or matt'], ['Fitting', 'Included, Maseru'], ['Warranty', '2 years on application']],
    options: [
      { id: 'coverage', label: 'Coverage', choices: [
        { id: 'doors', label: 'Doors & tailgate', delta: 0 },
        { id: 'partial', label: 'Partial wrap', delta: 4800 },
        { id: 'full', label: 'Full wrap', delta: 14500 } ] },
      { id: 'vehicle', label: 'Vehicle type', choices: [
        { id: 'sedan', label: 'Sedan / bakkie', delta: 0 },
        { id: 'van', label: 'Panel van', delta: 2200 },
        { id: 'truck', label: 'Truck / trailer', delta: 7600 } ] },
    ],
    pricing: { type: 'unit', min: 1, step: 1, price: 6400,
      breaks: [{ from: 3, price: 6050 }, { from: 6, price: 5700 }] },
    leadTime: 9,
  },
  {
    id: 'office-branding',
    category: 'branding',
    name: 'Office & Window Branding',
    blurb: 'Wall graphics, frosted vinyl and reception walls.',
    description: 'Interior branding — printed wall graphics, frosted window vinyl and reception feature walls. Priced per square metre, surveyed before production.',
    image: '../assets/projects/office-branding/office-branding-02-800.webp',
    specs: [['Priced', 'Per square metre'], ['Materials', 'Printed vinyl, frosted film'], ['Survey', 'Included in Maseru'], ['Fitting', 'Included']],
    options: [
      { id: 'material', label: 'Material', choices: [
        { id: 'frosted', label: 'Frosted window film', delta: 0 },
        { id: 'printed', label: 'Printed wall vinyl', delta: 180 },
        { id: 'textured', label: 'Textured wall covering', delta: 420 } ] },
    ],
    pricing: { type: 'unit', min: 2, step: 1, price: 720,
      breaks: [{ from: 10, price: 660 }, { from: 25, price: 590 }] },
    leadTime: 10,
  },
];

/* the stages an order moves through, in order */
const ORDER_STAGES = [
  { id: 'placed',     label: 'Order placed',      blurb: 'We have your order and the details are locked in.' },
  { id: 'payment',    label: 'Payment confirmed', blurb: 'Payment received. Your job joins the production queue.' },
  { id: 'artwork',    label: 'Artwork check',     blurb: 'Our studio is checking your files are print-ready.' },
  { id: 'production', label: 'In production',     blurb: 'On the press or the production floor.' },
  { id: 'quality',    label: 'Quality check',     blurb: 'Finishing and a final check before it leaves us.' },
  { id: 'ready',      label: 'Ready',             blurb: 'Ready for collection, or handed to the courier.' },
  { id: 'completed',  label: 'Completed',         blurb: 'Delivered or collected. Thank you.' },
];

/* Staff accounts the admin gate recognises.
   DEMO ONLY. On the real system, staff identity and role come from the server
   on every request — never from a list shipped to the browser. */
const STAFF = [
  { email: 'admin@brandcorporations.com', name: 'Sekhoane Mokemane', role: 'admin', title: 'Administrator' },
  { email: 'studio@brandcorporations.com', name: 'Studio', role: 'admin', title: 'Production' },
];

/* How a product can be sold. Print is made to order; merchandise may be held. */
const AVAILABILITY = [
  { id: 'made-to-order', label: 'Made to order', sellable: true },
  { id: 'in-stock',      label: 'In stock',      sellable: true },
  { id: 'out-of-stock',  label: 'Out of stock',  sellable: false },
  { id: 'draft',         label: 'Draft (hidden)', sellable: false },
];

window.SHOP_DATA = { CURRENCY, CATEGORIES, PRODUCTS, ORDER_STAGES, STAFF, AVAILABILITY };
