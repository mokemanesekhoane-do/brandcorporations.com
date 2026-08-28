/* =========================================================================
   Brand Corporations Shop — data layer
   ---------------------------------------------------------------------
   THIS IS THE SEAM. Every piece of state the shop needs goes through this
   module, and nothing else in the UI touches storage directly.

   Right now every method resolves against localStorage so the shop is fully
   clickable without a server. To go live, reimplement the marked methods as
   calls to your API and the UI keeps working unchanged. Each one documents
   the request it should become.

   WHAT IS REAL TODAY          WHAT NEEDS A SERVER
   -------------------------   ---------------------------------------------
   catalogue, pricing, cart    accounts (real auth), orders (shared record),
                               payment capture, production status updates

   Two things are deliberately NOT built:
   - No password is ever collected or stored. Passwords in localStorage are
     not authentication, and pretending otherwise teaches the wrong habit.
     Sign-in here identifies a local profile only; see Store.auth.
   - No card details are ever collected. Cards must be entered on the payment
     provider's own hosted page. See Store.payments.
   ========================================================================= */

(function (global) {
  'use strict';

  const { CURRENCY, CATEGORIES, PRODUCTS, ORDER_STAGES } = global.SHOP_DATA;
  const KEY = { cart: 'bc_shop_cart', user: 'bc_shop_user', orders: 'bc_shop_orders' };

  /* ---------- storage helpers (swallow quota/private-mode failures) ---------- */
  const read = (k, fallback) => {
    try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; }
    catch (e) { return fallback; }
  };
  const write = (k, v) => {
    try { localStorage.setItem(k, JSON.stringify(v)); return true; }
    catch (e) { return false; }
  };

  const clone = o => JSON.parse(JSON.stringify(o));
  const emit = name => global.dispatchEvent(new CustomEvent(name));

  /* =======================================================================
     MONEY
     Integer Maloti throughout. Prices are whole units in the catalogue, so
     there is no float-rounding problem to manage; if you introduce cents,
     switch these to work in minor units.
     ======================================================================= */
  const money = n => CURRENCY.symbol + Number(n).toLocaleString('en-GB', {
    minimumFractionDigits: 2, maximumFractionDigits: 2 });

  /* =======================================================================
     PRICING
     Pure functions — safe to call anywhere, no state.
     ======================================================================= */
  const pricing = {
    /* the price of one "unit" (one pack for tiered products, one item for
       unit-priced ones) including the selected options */
    unitPrice(product, selection, qty) {
      const opts = selection || {};
      let delta = 0;
      (product.options || []).forEach(o => {
        const chosen = (o.choices || []).find(c => c.id === opts[o.id]);
        if (chosen) delta += chosen.delta;
      });

      if (product.pricing.type === 'tiers') {
        const tier = product.pricing.tiers.find(t => t.qty === Number(qty))
                  || product.pricing.tiers[0];
        return tier.price + delta;
      }
      // unit pricing: walk the quantity breaks, highest applicable wins
      let base = product.pricing.price;
      (product.pricing.breaks || []).forEach(b => { if (qty >= b.from) base = b.price; });
      return base + delta;
    },

    /* what a line costs in total */
    lineTotal(product, selection, qty) {
      const unit = pricing.unitPrice(product, selection, qty);
      return product.pricing.type === 'tiers' ? unit : unit * qty;
    },

    /* the next quantity break, so the product page can nudge ("order 50 more
       and the unit price drops") */
    nextBreak(product, qty) {
      if (product.pricing.type !== 'unit') return null;
      const next = (product.pricing.breaks || []).find(b => b.from > qty);
      return next || null;
    },

    /* human label for a quantity */
    qtyLabel(product, qty) {
      if (product.pricing.type === 'tiers') return qty + ' units';
      return qty + (qty === 1 ? ' unit' : ' units');
    },
  };

  /* =======================================================================
     CATALOGUE
     Static today. Becomes:  GET /api/products   /  GET /api/products/:id
     ======================================================================= */
  const catalogue = {
    categories: () => clone(CATEGORIES),
    category: id => clone(CATEGORIES.find(c => c.id === id) || null),
    list(filter) {
      const f = filter || {};
      let out = PRODUCTS.slice();
      if (f.category && f.category !== 'all') out = out.filter(p => p.category === f.category);
      if (f.q) {
        const q = f.q.toLowerCase();
        out = out.filter(p => (p.name + ' ' + p.blurb + ' ' + p.description).toLowerCase().includes(q));
      }
      return clone(out);
    },
    get: id => clone(PRODUCTS.find(p => p.id === id) || null),
    /* the cheapest a product can be bought for — used for "from M450" labels */
    from(product) {
      if (product.pricing.type === 'tiers') {
        return Math.min.apply(null, product.pricing.tiers.map(t => t.price));
      }
      const lowest = (product.pricing.breaks || []).reduce(
        (m, b) => Math.min(m, b.price), product.pricing.price);
      return lowest;
    },
  };

  /* =======================================================================
     CART
     Local by design — a cart does not need a server until checkout. If you
     want carts to survive across devices, move this to
     GET/PUT /api/cart keyed on the signed-in user.
     ======================================================================= */
  const cart = {
    lines: () => read(KEY.cart, []),

    add(productId, selection, qty) {
      const product = catalogue.get(productId);
      if (!product) throw new Error('unknown product: ' + productId);
      const lines = cart.lines();
      const key = productId + '|' + JSON.stringify(selection || {});
      const existing = lines.find(l => l.key === key);
      if (existing) {
        // tiered products replace the tier; unit products accumulate
        if (product.pricing.type === 'tiers') existing.qty = Number(qty);
        else existing.qty += Number(qty);
      } else {
        lines.push({ key, productId, selection: selection || {}, qty: Number(qty) });
      }
      write(KEY.cart, lines);
      emit('cart:change');
      return cart.summary();
    },

    setQty(key, qty) {
      const lines = cart.lines();
      const line = lines.find(l => l.key === key);
      if (!line) return cart.summary();
      const product = catalogue.get(line.productId);
      const min = product.pricing.type === 'unit' ? (product.pricing.min || 1) : 0;
      line.qty = Math.max(min, Number(qty));
      write(KEY.cart, lines);
      emit('cart:change');
      return cart.summary();
    },

    remove(key) {
      write(KEY.cart, cart.lines().filter(l => l.key !== key));
      emit('cart:change');
      return cart.summary();
    },

    clear() { write(KEY.cart, []); emit('cart:change'); },

    /* everything the UI needs to render a cart, priced */
    summary() {
      const lines = cart.lines().map(l => {
        const product = catalogue.get(l.productId);
        if (!product) return null;
        return {
          key: l.key, qty: l.qty, selection: l.selection, product,
          optionLabels: (product.options || []).map(o => {
            const c = (o.choices || []).find(x => x.id === l.selection[o.id]);
            return c ? { label: o.label, value: c.label } : null;
          }).filter(Boolean),
          unitPrice: pricing.unitPrice(product, l.selection, l.qty),
          total: pricing.lineTotal(product, l.selection, l.qty),
        };
      }).filter(Boolean);

      const subtotal = lines.reduce((s, l) => s + l.total, 0);
      // Lesotho VAT is 15%. Confirm the rate and whether catalogue prices are
      // meant to be VAT-inclusive before this goes live.
      const vat = Math.round(subtotal * 0.15);
      const leadTime = lines.reduce((m, l) => Math.max(m, l.product.leadTime), 0);
      return { lines, subtotal, vat, total: subtotal + vat, count: lines.length, leadTime };
    },
  };

  /* =======================================================================
     AUTH  —  NOT REAL AUTHENTICATION
     A local profile so the order-history and tracking screens have someone to
     belong to. There is no password, no session token, and nothing is
     verified. Anyone using this browser is "signed in".

     Replace with:
       POST /api/auth/register   -> sets an httpOnly session cookie
       POST /api/auth/login
       POST /api/auth/logout
       GET  /api/auth/me
     ======================================================================= */
  const auth = {
    current: () => read(KEY.user, null),
    isDemo: true,

    signIn(profile) {
      if (!profile || !profile.email) throw new Error('email required');
      const existing = read(KEY.user, null);
      const user = Object.assign({
        id: 'local-' + Date.now().toString(36),
        createdAt: new Date().toISOString(),
      }, existing || {}, profile);
      write(KEY.user, user);
      emit('auth:change');
      return clone(user);
    },

    signOut() {
      try { localStorage.removeItem(KEY.user); } catch (e) {}
      emit('auth:change');
    },

    update(patch) {
      const user = read(KEY.user, null);
      if (!user) return null;
      const next = Object.assign({}, user, patch);
      write(KEY.user, next);
      emit('auth:change');
      return clone(next);
    },
  };

  /* =======================================================================
     ORDERS
     Local today, so "order history" only exists in this browser and the
     status never advances on its own.

     Replace with:
       POST /api/orders          -> creates the order, returns { id, reference }
       GET  /api/orders          -> the signed-in customer's orders
       GET  /api/orders/:id
     Production status must be written by your staff (an admin view or an
     internal tool), never by the customer's browser.
     ======================================================================= */
  const orders = {
    all: () => read(KEY.orders, []),
    list() {
      const user = auth.current();
      return orders.all()
        .filter(o => !user || o.customer.email === user.email)
        .sort((a, b) => b.placedAt.localeCompare(a.placedAt));
    },
    get: id => orders.all().find(o => o.id === id) || null,

    create(payload) {
      const summary = cart.summary();
      if (!summary.lines.length) throw new Error('cart is empty');

      const seq = orders.all().length + 1;
      const ref = 'BC-' + new Date().getFullYear() + '-' +
                  String(seq).padStart(4, '0');
      const now = new Date();
      const due = new Date(now.getTime() + summary.leadTime * 86400000);

      const order = {
        id: 'ord_' + now.getTime().toString(36),
        reference: ref,
        placedAt: now.toISOString(),
        dueAt: due.toISOString(),
        customer: payload.customer,
        fulfilment: payload.fulfilment,          // 'delivery' | 'collection'
        address: payload.address || null,
        notes: payload.notes || '',
        lines: summary.lines.map(l => ({
          productId: l.product.id, name: l.product.name, image: l.product.image,
          qty: l.qty, options: l.optionLabels, unitPrice: l.unitPrice, total: l.total,
        })),
        subtotal: summary.subtotal, vat: summary.vat, total: summary.total,
        payment: { status: 'pending', method: payload.paymentMethod || 'card', reference: null },
        stage: 'placed',
        history: [{ stage: 'placed', at: now.toISOString() }],
      };

      const list = orders.all();
      list.push(order);
      write(KEY.orders, list);
      cart.clear();
      emit('orders:change');
      return clone(order);
    },

    /* Demo helper only. On a real system the customer's browser must never be
       able to move an order through production — this would be a staff action
       behind authorisation. Exposed here so the tracking screen can be
       exercised without a backend. */
    advanceForDemo(id) {
      const list = orders.all();
      const order = list.find(o => o.id === id);
      if (!order) return null;
      const i = ORDER_STAGES.findIndex(s => s.id === order.stage);
      if (i < 0 || i >= ORDER_STAGES.length - 1) return clone(order);
      order.stage = ORDER_STAGES[i + 1].id;
      order.history.push({ stage: order.stage, at: new Date().toISOString() });
      if (order.stage === 'payment') order.payment.status = 'paid';
      write(KEY.orders, list);
      emit('orders:change');
      return clone(order);
    },

    stages: () => clone(ORDER_STAGES),
    stageIndex: id => ORDER_STAGES.findIndex(s => s.id === id),
  };

  /* =======================================================================
     PAYMENTS  —  INTEGRATION POINT, NOT IMPLEMENTED
     This shop never collects card details, and it must stay that way. The
     card is entered on the provider's hosted page, so no card data touches
     this site or your server.

     To wire up (Paystack / Flutterwave / PayFast / Stripe all work this way):

       1. Your server creates the transaction from the ORDER, not from
          anything the browser sends — the browser can lie about the amount:
             POST /api/payments/session  { orderId }
             -> { redirectUrl }
       2. begin() sends the customer to redirectUrl.
       3. The provider redirects back to returnUrl.
       4. Your server marks the order paid ONLY from the provider's
          server-to-server webhook, never from the return URL.

     Until step 1 exists, begin() reports that it is unconfigured rather than
     pretending a payment happened.
     ======================================================================= */
  const payments = {
    provider: null,          // 'paystack' | 'flutterwave' | 'payfast' | 'stripe'
    endpoint: null,          // e.g. '/api/payments/session'

    isConfigured() { return Boolean(payments.provider && payments.endpoint); },

    async begin(orderId) {
      if (!payments.isConfigured()) {
        return { ok: false, reason: 'unconfigured',
          message: 'No payment provider is connected yet. The order has been ' +
                   'recorded and we will send payment instructions by email.' };
      }
      const res = await fetch(payments.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      if (!res.ok) throw new Error('payment session failed: ' + res.status);
      const { redirectUrl } = await res.json();
      global.location.href = redirectUrl;
      return { ok: true };
    },
  };

  global.Store = { money, pricing, catalogue, cart, auth, orders, payments, CURRENCY };
})(window);
