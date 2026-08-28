# Brand Corporations — Online Shop (preview build)

A standalone module. It is **not** linked from the main site and nothing in the
main site depends on it — delete the `shop/` folder and the website is
unchanged. Open `shop/index.html` (served, not `file://`) to run it.

```
shop/
  index.html          page shell: header, category nav, footer, mount point
  shop.css            all shop styling
  js/catalogue.js     product data          <- replace with your real catalogue
  js/store.js         data layer            <- replace the marked methods
  js/shop.js          UI, views and routing (no storage access of its own)
```

It reuses `../css/core.css` for the reset, design tokens and type scale, and
`../assets/projects/*` for product photography, so it stays visually in step
with the site. It does **not** load the site's `custom.css`; the brand-blue
retone is repeated at the top of `shop.css` — keep those two values in step.

## What is real, and what is not

| Works today | Needs a server |
|---|---|
| Browse by category, search | Real customer accounts |
| Product detail, specs, options | Orders as a shared record |
| Quantity tiers and price breaks | Taking payment |
| Cart, totals, VAT | Production status updates |
| Checkout validation, order creation | Email confirmations |
| Order history and tracking screens | |

Accounts, orders and the cart live in `localStorage`, so they exist **in one
browser only**. Two customers on two machines cannot see the same order, and
the status never advances by itself — the tracking screen has a demo button
that stands in for your production team.

## Wiring it to a backend

`js/store.js` is the only file that touches storage. Everything else calls it.
Reimplement these and the UI keeps working unchanged:

```
Store.catalogue.list/get     ->  GET  /api/products, /api/products/:id
Store.auth.signIn/signOut    ->  POST /api/auth/login, /logout  (session cookie)
Store.auth.current           ->  GET  /api/auth/me
Store.orders.create          ->  POST /api/orders
Store.orders.list/get        ->  GET  /api/orders, /api/orders/:id
Store.payments.begin         ->  POST /api/payments/session -> { redirectUrl }
```

`Store.orders.advanceForDemo()` must be **deleted**, not ported. A customer's
browser moving an order through production is a hole; that belongs behind staff
authorisation.

### Payment

No card details are collected anywhere in this build, and it must stay that
way. Paystack, Flutterwave, PayFast and Stripe all follow the same shape:

1. Your **server** creates the transaction from the stored order, never from
   an amount the browser sends — the browser can lie about the total.
2. `Store.payments.begin()` redirects the customer to the provider's hosted
   page, where the card is entered.
3. Mark the order paid **only** from the provider's server-to-server webhook.
   The browser returning to a success URL proves nothing.

Set `Store.payments.provider` and `Store.payments.endpoint` to switch it on.
Until then `begin()` reports that it is unconfigured rather than faking a
payment.

## Before this goes live

- **Every price and product is a placeholder.** `js/catalogue.js` is
  representative, not Brand Corporations' price list.
- **VAT is assumed at 15%** and added on top of catalogue prices. Confirm the
  rate, and whether prices should be VAT-inclusive (`Store.cart.summary`).
- Delivery is quoted after the order rather than calculated at checkout.
- Remove the `.demo-banner` from `index.html`.
- The page is `noindex` while it is a preview.
