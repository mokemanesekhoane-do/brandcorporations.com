# Brand Corporations — Online Shop (preview build)

A standalone module. It is **not** linked from the main site and nothing in the
main site depends on it — delete the `shop/` folder and the website is
unchanged. Serve it (not `file://`) and open `shop/index.html`.

```
shop/
  index.html          BUYER dashboard + shop
  admin.html          ADMIN dashboard (separate entry point)
  shop.css            buyer styling
  admin.css           admin styling (dark sidebar, dense tables)
  js/catalogue.js     seed product data, staff list, availability states
  js/store.js         data layer + guard()   <- replace the marked methods
  js/shop.js          buyer UI
  js/admin.js         admin UI
```

It reuses `../css/core.css` for the reset, design tokens and type scale, and
`../assets/projects/*` for product photography, so it stays visually in step
with the site. It does **not** load the site's `custom.css`; the brand-blue
retone is repeated at the top of `shop.css` and `admin.css` — keep those in
step.

## Two dashboards

**Buyer** — `index.html`

Browse by category, search, product detail with specs and options, cart,
checkout, account, and `#/dashboard` (order tiles, recent orders, saved
details). Order history and seven-stage tracking from *Order placed* through
production to *Completed*.

A buyer can read only their own orders and **cannot** move one through
production.

**Admin** — `admin.html`

| Section | What it does |
|---|---|
| Overview | KPIs, production pipeline breakdown, recent orders and activity |
| Orders | Filter by stage, payment and text; open one to move it through the stages or reconcile a payment. Every change is stamped with the staff member and time |
| Products | Create, edit, delete. Specifications, option groups with price deltas, both pricing models, availability and stock |
| Customers | Derived from orders |
| Activity | Every change made from the dashboard |

Setting a product to **out of stock** or **draft** removes it from the buyer
catalogue, and the cart refuses it.

Two pricing models are supported per product: **quantity tiers** (print runs —
100/250/500/1000, priced per pack) and **per unit with quantity breaks**
(merchandise — cheaper past each threshold). Options add or subtract from the
unit price.

## The security boundary

**Nothing enforced in the browser is security.** The staff gate checks an email
against a list shipped to the client; anyone can read or bypass it from the
console. That is inherent to a static build, and the gate says so on screen.

### Two separate sessions

The buyer profile and the staff session live in **different storage keys**
(`bc_shop_user` and `bc_shop_staff`) and are read through different methods:

```
Store.auth.current()   the buyer profile   (the shop)
Store.auth.staff()     the staff session   (the admin dashboard)
Store.auth.isAdmin()   true only from the staff session
```

They are independent in both directions. Signing into the admin dashboard does
not make you a customer — the shop still shows *Sign in*, and a checkout would
not file the order under a staff email. Signing out of one leaves the other
alone. A buyer profile cannot carry an admin role: `signIn()` and `update()`
force `role: 'buyer'`, so a role cannot be smuggled in through the profile.

What *is* built is the right structure. Every privileged operation passes
through `Store.guard()`, so authorisation has exactly one home. When the
backend lands:

- Issue the session **server-side** (httpOnly cookie). Never a role in storage.
- Read the role from the session **on the server**, for every request.
- Re-check it inside every admin endpoint. A hidden button is not access control.
- Recompute order totals server-side from the catalogue at checkout — the
  browser can lie about the total.
- Let only staff endpoints write production status.

## What is real, and what is not

| Works today | Needs a server |
|---|---|
| Browse, search, product detail | Real customer accounts |
| Quantity tiers and price breaks | Orders as a shared record |
| Cart, totals, VAT | Taking payment |
| Checkout validation, order creation | Email confirmations |
| Admin order and product management | Real authorisation |

Accounts, orders and products live in `localStorage`, so they exist **in one
browser only**. Two people on two machines do not see the same data.

## Wiring it to a backend

`js/store.js` is the only file that touches storage. Everything else calls it.
Reimplement these and both UIs keep working unchanged:

```
Store.catalogue.list/get     ->  GET    /api/products, /api/products/:id
Store.auth.signIn/signOut    ->  POST   /api/auth/login, /logout  (session cookie)
Store.auth.signInStaff       ->  POST   /api/auth/login  (role from the server)
Store.auth.current           ->  GET    /api/auth/me
Store.orders.create          ->  POST   /api/orders
Store.orders.list/get        ->  GET    /api/orders, /api/orders/:id
Store.admin.orders/order     ->  GET    /api/admin/orders
Store.admin.setStage         ->  PATCH  /api/admin/orders/:id/stage
Store.admin.setPayment       ->  PATCH  /api/admin/orders/:id/payment
Store.admin.products         ->  GET    /api/admin/products
Store.admin.saveProduct      ->  POST   /PATCH /api/admin/products
Store.admin.deleteProduct    ->  DELETE /api/admin/products/:id
Store.admin.stats            ->  GET    /api/admin/stats
Store.payments.begin         ->  POST   /api/payments/session -> { redirectUrl }
```

`Store.admin.resetProducts()` is a preview convenience and should be dropped.

### Payment

No card details are collected anywhere in this build, and it must stay that
way. Paystack, Flutterwave, PayFast and Stripe all follow the same shape:

1. Your **server** creates the transaction from the stored order, never from
   an amount the browser sends.
2. `Store.payments.begin()` redirects to the provider's hosted page, where the
   card is entered.
3. Mark the order paid **only** from the provider's server-to-server webhook.
   The customer returning to a success URL proves nothing.

Set `Store.payments.provider` and `Store.payments.endpoint` to switch it on.
Until then `begin()` reports that it is unconfigured rather than faking a
payment.

## Before this goes live

- **Every price and product is a placeholder.** `js/catalogue.js` is
  representative, not Brand Corporations' price list.
- **VAT is assumed at 15%** and added on top of catalogue prices. Confirm the
  rate, and whether prices should be VAT-inclusive (`Store.cart.summary`).
- The `STAFF` list in `js/catalogue.js` is demo data and must not ship — staff
  identity belongs on the server.
- Delivery is quoted after the order rather than calculated at checkout.
- Remove the `.demo-banner` from `index.html` and the notice in the admin gate.
- Both pages are `noindex` while this is a preview.
