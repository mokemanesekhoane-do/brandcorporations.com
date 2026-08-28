/* =========================================================================
   Brand Corporations Shop — data layer
   ---------------------------------------------------------------------
   THIS IS THE SEAM. Every piece of state either dashboard needs goes through
   this module, and no UI file touches storage directly.

   Today everything resolves against localStorage so both dashboards are
   fully clickable without a server. To go live, reimplement the marked
   methods as calls to your API and the UI keeps working unchanged.

   ---------------------------------------------------------------------
   ABOUT "SECURE"

   Nothing enforced in this file is security. It runs in the customer's
   browser, where anyone can open devtools and change it. `guard()` below is
   a *structural* boundary, not a protective one: it gives every privileged
   operation one place to pass through, so that when there is a server the
   same call sites map onto real authorisation.

   Real security means, without exception:
     - Sessions issued server-side (httpOnly cookie), never a flag in storage.
     - The role read from the session on the server for EVERY request, never
       trusted from the client.
     - Every admin endpoint re-checking the role itself. A hidden button is
       not access control.
     - Order totals recomputed server-side from the catalogue at checkout.
     - Production status writable only by staff endpoints.

   Two things are deliberately NOT built:
   - No password is ever collected or stored. A password in localStorage is
     not authentication, and pretending otherwise teaches the wrong habit.
   - No card details are ever collected. Cards belong on the payment
     provider's own hosted page. See Store.payments.
   ========================================================================= */

(function (global) {
  'use strict';

  const D = global.SHOP_DATA;
  const { CURRENCY, CATEGORIES, ORDER_STAGES, STAFF, AVAILABILITY } = D;

  const KEY = {
    cart:     'bc_shop_cart',
    user:     'bc_shop_user',
    orders:   'bc_shop_orders',
    products: 'bc_shop_products',
    log:      'bc_shop_activity',
  };

  const read = (k, fallback) => {
    try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; }
    catch (e) { return fallback; }
  };
  const write = (k, v) => {
    try { localStorage.setItem(k, JSON.stringify(v)); return true; }
    catch (e) { return false; }
  };
  const clone = o => JSON.parse(JSON.stringify(o));
  const emit = (name, detail) => global.dispatchEvent(new CustomEvent(name, { detail }));
  const nowISO = () => new Date().toISOString();

  /* =======================================================================
     MONEY / PRICING  (pure, no state)
     ======================================================================= */
  const money = n => CURRENCY.symbol + Number(n).toLocaleString('en-GB', {
    minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const pricing = {
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
      let base = product.pricing.price;
      (product.pricing.breaks || []).forEach(b => { if (qty >= b.from) base = b.price; });
      return base + delta;
    },
    lineTotal(product, selection, qty) {
      const unit = pricing.unitPrice(product, selection, qty);
      return product.pricing.type === 'tiers' ? unit : unit * qty;
    },
    nextBreak(product, qty) {
      if (product.pricing.type !== 'unit') return null;
      return (product.pricing.breaks || []).find(b => b.from > qty) || null;
    },
    qtyLabel(product, qty) {
      if (product.pricing.type === 'tiers') return qty + ' units';
      return qty + (qty === 1 ? ' unit' : ' units');
    },
  };

  /* =======================================================================
     PRODUCTS
     Seeded from catalogue.js on first run, then owned by localStorage so the
     admin dashboard can edit them.
     Becomes: GET/POST/PATCH/DELETE /api/products
     ======================================================================= */
  function seedProducts() {
    const stored = read(KEY.products, null);
    if (stored && stored.length) return stored;
    const seeded = D.PRODUCTS.map(p => Object.assign({}, clone(p), {
      availability: p.availability || 'made-to-order',
      stockQty: p.stockQty == null ? null : p.stockQty,
      updatedAt: nowISO(),
    }));
    write(KEY.products, seeded);
    return seeded;
  }
  const allProducts = () => seedProducts();
  const sellable = p => {
    const a = AVAILABILITY.find(x => x.id === p.availability);
    return a ? a.sellable : true;
  };

  /* =======================================================================
     CATALOGUE  (what a buyer can see — hides draft/out-of-stock)
     ======================================================================= */
  const catalogue = {
    categories: () => clone(CATEGORIES),
    category: id => clone(CATEGORIES.find(c => c.id === id) || null),
    availability: () => clone(AVAILABILITY),
    list(filter) {
      const f = filter || {};
      let out = allProducts().filter(p => f.includeHidden || sellable(p));
      if (f.category && f.category !== 'all') out = out.filter(p => p.category === f.category);
      if (f.q) {
        const q = f.q.toLowerCase();
        out = out.filter(p => (p.name + ' ' + p.blurb + ' ' + p.description).toLowerCase().includes(q));
      }
      return clone(out);
    },
    get: id => clone(allProducts().find(p => p.id === id) || null),
    from(product) {
      if (product.pricing.type === 'tiers') {
        return Math.min.apply(null, product.pricing.tiers.map(t => t.price));
      }
      return (product.pricing.breaks || []).reduce(
        (m, b) => Math.min(m, b.price), product.pricing.price);
    },
  };

  /* =======================================================================
     CART
     ======================================================================= */
  const cart = {
    lines: () => read(KEY.cart, []),
    add(productId, selection, qty) {
      const product = catalogue.get(productId);
      if (!product) throw new Error('unknown product: ' + productId);
      if (!sellable(product)) throw new Error('product is not available: ' + productId);
      const lines = cart.lines();
      const key = productId + '|' + JSON.stringify(selection || {});
      const existing = lines.find(l => l.key === key);
      if (existing) {
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
     AUTH  —  identity only, NOT authentication
     The session carries a role so the two dashboards can be kept apart.
     On a real deployment the role comes from the server session; a role
     stored here is a convenience for the UI, never a permission.
     ======================================================================= */
  const auth = {
    isDemo: true,
    current: () => read(KEY.user, null),
    role: () => (read(KEY.user, null) || {}).role || 'guest',
    isAdmin: () => auth.role() === 'admin',
    staffDirectory: () => clone(STAFF),

    /* buyer sign-in: any email creates a local profile */
    signIn(profile) {
      if (!profile || !profile.email) throw new Error('email required');
      const existing = read(KEY.user, null);
      const user = Object.assign({
        id: 'local-' + Date.now().toString(36),
        role: 'buyer',
        createdAt: nowISO(),
      }, existing || {}, profile);
      if (!user.role) user.role = 'buyer';
      write(KEY.user, user);
      emit('auth:change');
      return clone(user);
    },

    /* staff sign-in: the email must be in the STAFF list.
       This is a demo gate so the dashboards stay separate — it protects
       nothing. Replace with POST /api/auth/login returning a session cookie,
       and re-check the role on every admin endpoint. */
    signInStaff(email) {
      const member = STAFF.find(s => s.email.toLowerCase() === String(email || '').toLowerCase().trim());
      if (!member) return { ok: false, message: 'That email is not on the staff list.' };
      const user = Object.assign({ id: 'staff-' + member.email, createdAt: nowISO() }, member);
      write(KEY.user, user);
      emit('auth:change');
      return { ok: true, user: clone(user) };
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
     GUARD
     The single choke point every privileged operation passes through. It
     stops an accidental call from the buyer UI and gives the server-side
     check one obvious home. It is NOT protection — see the header.
     ======================================================================= */
  function guard(action) {
    if (!auth.isAdmin()) {
      const err = new Error('Not permitted: ' + action + ' requires an administrator session.');
      err.code = 'FORBIDDEN';
      throw err;
    }
    return auth.current();
  }

  /* =======================================================================
     ORDERS
     ======================================================================= */
  const orders = {
    all: () => read(KEY.orders, []),

    /* the signed-in buyer's own orders */
    list() {
      const user = auth.current();
      return orders.all()
        .filter(o => !user || o.customer.email === user.email)
        .sort((a, b) => b.placedAt.localeCompare(a.placedAt));
    },

    get(id) {
      const o = orders.all().find(x => x.id === id);
      if (!o) return null;
      // a buyer may only read their own order; staff may read any
      const user = auth.current();
      if (!auth.isAdmin() && user && o.customer.email !== user.email) return null;
      return clone(o);
    },

    create(payload) {
      const summary = cart.summary();
      if (!summary.lines.length) throw new Error('cart is empty');
      const seq = orders.all().length + 1;
      const now = new Date();
      const due = new Date(now.getTime() + summary.leadTime * 86400000);
      const order = {
        id: 'ord_' + now.getTime().toString(36),
        reference: 'BC-' + now.getFullYear() + '-' + String(seq).padStart(4, '0'),
        placedAt: now.toISOString(),
        dueAt: due.toISOString(),
        customer: payload.customer,
        fulfilment: payload.fulfilment,
        address: payload.address || null,
        notes: payload.notes || '',
        lines: summary.lines.map(l => ({
          productId: l.product.id, name: l.product.name, image: l.product.image,
          qty: l.qty, options: l.optionLabels, unitPrice: l.unitPrice, total: l.total,
        })),
        subtotal: summary.subtotal, vat: summary.vat, total: summary.total,
        payment: { status: 'pending', method: payload.paymentMethod || 'card', reference: null },
        stage: 'placed',
        history: [{ stage: 'placed', at: now.toISOString(), by: 'customer' }],
      };
      const list = orders.all();
      list.push(order);
      write(KEY.orders, list);
      cart.clear();
      emit('orders:change');
      return clone(order);
    },

    stages: () => clone(ORDER_STAGES),
    stageIndex: id => ORDER_STAGES.findIndex(s => s.id === id),
  };

  /* =======================================================================
     ADMIN
     Everything here is guarded. Each method notes the endpoint it becomes —
     and every one of those endpoints must re-check the role server-side.
     ======================================================================= */
  const activity = {
    log(action, detail) {
      const entries = read(KEY.log, []);
      const user = auth.current();
      entries.unshift({ at: nowISO(), by: user ? user.email : 'unknown', action, detail });
      write(KEY.log, entries.slice(0, 200));
    },
    list: () => read(KEY.log, []),
  };

  const admin = {
    /* ---- orders : GET /api/admin/orders ---- */
    orders(filter) {
      guard('list all orders');
      const f = filter || {};
      let out = orders.all().slice().sort((a, b) => b.placedAt.localeCompare(a.placedAt));
      if (f.stage && f.stage !== 'all') out = out.filter(o => o.stage === f.stage);
      if (f.payment && f.payment !== 'all') out = out.filter(o => o.payment.status === f.payment);
      if (f.q) {
        const q = f.q.toLowerCase();
        out = out.filter(o => (o.reference + ' ' + o.customer.name + ' ' +
          o.customer.email + ' ' + (o.customer.company || '')).toLowerCase().includes(q));
      }
      return clone(out);
    },
    order(id) { guard('read order'); return clone(orders.all().find(o => o.id === id) || null); },

    /* ---- PATCH /api/admin/orders/:id/stage ---- */
    setStage(id, stage) {
      const by = guard('change order stage');
      if (!ORDER_STAGES.some(s => s.id === stage)) throw new Error('unknown stage: ' + stage);
      const list = orders.all();
      const order = list.find(o => o.id === id);
      if (!order) return null;
      order.stage = stage;
      order.history.push({ stage, at: nowISO(), by: by.email });
      if (stage === 'payment' && order.payment.status !== 'paid') order.payment.status = 'paid';
      write(KEY.orders, list);
      activity.log('Order ' + order.reference + ' moved to "' +
        ORDER_STAGES.find(s => s.id === stage).label + '"');
      emit('orders:change');
      return clone(order);
    },

    /* ---- PATCH /api/admin/orders/:id/payment ----
       On the real system payment status is set by the provider's webhook,
       not by hand. This exists for reconciling EFT and cash. */
    setPayment(id, status, reference) {
      const by = guard('change payment status');
      const list = orders.all();
      const order = list.find(o => o.id === id);
      if (!order) return null;
      order.payment.status = status;
      if (reference != null) order.payment.reference = reference;
      order.history.push({ stage: order.stage, at: nowISO(), by: by.email, note: 'payment: ' + status });
      write(KEY.orders, list);
      activity.log('Order ' + order.reference + ' payment marked ' + status);
      emit('orders:change');
      return clone(order);
    },

    /* ---- products : GET/POST/PATCH/DELETE /api/admin/products ---- */
    products(filter) {
      guard('list products');
      const f = filter || {};
      let out = allProducts().slice();
      if (f.category && f.category !== 'all') out = out.filter(p => p.category === f.category);
      if (f.availability && f.availability !== 'all') out = out.filter(p => p.availability === f.availability);
      if (f.q) {
        const q = f.q.toLowerCase();
        out = out.filter(p => (p.name + ' ' + p.id).toLowerCase().includes(q));
      }
      return clone(out);
    },

    saveProduct(product) {
      guard('save product');
      if (!product.name || !product.name.trim()) throw new Error('name is required');
      if (!product.category) throw new Error('category is required');
      const list = allProducts();
      const id = product.id || slugify(product.name);
      const idx = list.findIndex(p => p.id === id);
      const next = Object.assign({
        id, specs: [], options: [], leadTime: 5,
        availability: 'made-to-order', stockQty: null,
        image: '../assets/projects/print/print-01-800.webp',
        pricing: { type: 'unit', min: 1, step: 1, price: 0, breaks: [] },
      }, idx >= 0 ? list[idx] : {}, product, { id, updatedAt: nowISO() });

      if (idx >= 0) list[idx] = next; else list.push(next);
      write(KEY.products, list);
      activity.log((idx >= 0 ? 'Updated' : 'Created') + ' product "' + next.name + '"');
      emit('products:change');
      return clone(next);
    },

    setAvailability(id, availability, stockQty) {
      guard('set availability');
      const list = allProducts();
      const p = list.find(x => x.id === id);
      if (!p) return null;
      p.availability = availability;
      if (stockQty !== undefined) p.stockQty = stockQty === '' || stockQty == null ? null : Number(stockQty);
      p.updatedAt = nowISO();
      write(KEY.products, list);
      activity.log('"' + p.name + '" set to ' +
        (AVAILABILITY.find(a => a.id === availability) || {}).label);
      emit('products:change');
      return clone(p);
    },

    deleteProduct(id) {
      guard('delete product');
      const list = allProducts();
      const p = list.find(x => x.id === id);
      if (!p) return false;
      write(KEY.products, list.filter(x => x.id !== id));
      activity.log('Deleted product "' + p.name + '"');
      emit('products:change');
      return true;
    },

    /* restores the seed catalogue — useful after playing with the preview */
    resetProducts() {
      guard('reset catalogue');
      try { localStorage.removeItem(KEY.products); } catch (e) {}
      seedProducts();
      activity.log('Catalogue reset to the seed data');
      emit('products:change');
    },

    /* ---- customers : derived from orders, since there is no user table ---- */
    customers() {
      guard('list customers');
      const map = new Map();
      orders.all().forEach(o => {
        const k = o.customer.email.toLowerCase();
        const rec = map.get(k) || {
          email: o.customer.email, name: o.customer.name,
          company: o.customer.company || '', orders: 0, spend: 0, last: null,
        };
        rec.orders += 1;
        rec.spend += o.total;
        if (!rec.last || o.placedAt > rec.last) rec.last = o.placedAt;
        map.set(k, rec);
      });
      return [...map.values()].sort((a, b) => b.spend - a.spend);
    },

    /* ---- dashboard figures : GET /api/admin/stats ---- */
    stats() {
      guard('read stats');
      const all = orders.all();
      const paid = all.filter(o => o.payment.status === 'paid');
      const open = all.filter(o => o.stage !== 'completed');
      const awaitingPayment = all.filter(o => o.payment.status !== 'paid');
      const inProduction = all.filter(o => ['artwork', 'production', 'quality'].includes(o.stage));
      const products = allProducts();
      const today = new Date().toDateString();
      return {
        orders: all.length,
        ordersToday: all.filter(o => new Date(o.placedAt).toDateString() === today).length,
        revenue: paid.reduce((s, o) => s + o.total, 0),
        pipeline: open.reduce((s, o) => s + o.total, 0),
        open: open.length,
        awaitingPayment: awaitingPayment.length,
        inProduction: inProduction.length,
        products: products.length,
        hidden: products.filter(p => !sellable(p)).length,
        customers: new Set(all.map(o => o.customer.email.toLowerCase())).size,
        byStage: ORDER_STAGES.map(s => ({
          ...s, count: all.filter(o => o.stage === s.id).length })),
      };
    },

    activity() { guard('read activity'); return activity.list(); },
  };

  function slugify(s) {
    return String(s).toLowerCase().trim()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) ||
      'product-' + Date.now().toString(36);
  }

  /* =======================================================================
     PAYMENTS  —  INTEGRATION POINT, NOT IMPLEMENTED
     No card details are collected here and it must stay that way.

       1. Your server creates the transaction from the stored ORDER, never
          from an amount the browser sends:
             POST /api/payments/session { orderId } -> { redirectUrl }
       2. begin() sends the customer to redirectUrl (the provider's page).
       3. Mark the order paid ONLY from the provider's server-to-server
          webhook. A customer returning to a success URL proves nothing.
     ======================================================================= */
  const payments = {
    provider: null,
    endpoint: null,
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

  seedProducts();

  global.Store = {
    money, pricing, catalogue, cart, auth, orders, admin, payments,
    guard, CURRENCY, slugify,
  };
})(window);
