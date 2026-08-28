/* =========================================================================
   Brand Corporations Shop — UI
   Hash-routed views rendered into #shop-main. All state goes through Store
   (js/store.js); nothing here touches localStorage directly.
   ========================================================================= */
(function () {
  'use strict';

  const S = window.Store;
  const main = document.getElementById('shop-main');
  const esc = s => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const money = S.money;

  /* ---------- small UI helpers ---------- */
  let toastTimer;
  function toast(msg, kind) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = 'toast is-visible' + (kind ? ' is-' + kind : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.className = 'toast'; }, 3200);
  }

  const icon = {
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h13M12.5 6l6 6-6 6"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H6M11.5 6l-6 6 6 6"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.6 4.6 4.4L19 7"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4.5 6.5h15M9.5 6.5V4.8h5v1.7M6.6 6.5l.9 12.2a1.6 1.6 0 0 0 1.6 1.5h5.8a1.6 1.6 0 0 0 1.6-1.5l.9-12.2"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4.8" y="10.4" width="14.4" height="9.6" rx="2"/><path d="M8.2 10.4V7.8a3.8 3.8 0 0 1 7.6 0v2.6"/></svg>',
  };

  const productImg = (p, cls) =>
    `<img class="${cls}" src="${esc(p.image)}" alt="${esc(p.name)}" width="800" height="800" loading="lazy" decoding="async"/>`;

  /* the price shown before a customer picks anything */
  const fromLabel = p => `From ${money(S.catalogue.from(p))}` +
    (p.pricing.type === 'tiers' ? ` <span class="muted">/ pack</span>` : ` <span class="muted">each</span>`);

  /* ---------- chrome: cart badge, account label, category nav ---------- */
  function paintChrome() {
    const { count } = S.cart.summary();
    const badge = document.getElementById('cart-badge');
    badge.textContent = count;
    badge.hidden = count === 0;

    const user = S.auth.current();
    document.getElementById('account-label').textContent =
      user ? (user.name || 'Account').split(' ')[0] : 'Sign in';

    const cats = document.getElementById('shop-cats');
    if (!cats.dataset.built) {
      cats.innerHTML = '<a class="shop-cat" href="#/">All products</a>' +
        S.catalogue.categories().map(c =>
          `<a class="shop-cat" href="#/c/${c.id}">${esc(c.name)}</a>`).join('');
      cats.dataset.built = '1';
    }
    const route = location.hash || '#/';
    cats.querySelectorAll('.shop-cat').forEach(a =>
      a.classList.toggle('is-active', a.getAttribute('href') === route));
  }

  /* =====================================================================
     VIEW: catalogue
     ===================================================================== */
  function viewCatalogue(categoryId, query) {
    const cat = categoryId ? S.catalogue.category(categoryId) : null;
    const products = S.catalogue.list({ category: categoryId || 'all', q: query });

    const head = query
      ? `<h1 class="v-title">Search</h1><p class="v-lede">${products.length} result${products.length === 1 ? '' : 's'} for &ldquo;${esc(query)}&rdquo;.</p>`
      : cat
        ? `<h1 class="v-title">${esc(cat.name)}</h1><p class="v-lede">${esc(cat.blurb)}</p>`
        : `<div class="v-hero">
             <div class="sub-title-wrap"><div class="sub-title-dot"></div><div class="sub-title">Order online</div></div>
             <h1 class="v-title v-title-lg">Marketing collateral,<br/><em>made to order.</em></h1>
             <p class="v-lede">Everything we produce &mdash; stationery, print, banners, signage, branded items &mdash;
                priced, specified and orderable. Artwork checked by our studio before anything goes to press.</p>
           </div>`;

    const grid = products.length
      ? `<div class="p-grid">` + products.map(p => `
          <article class="p-card">
            <a class="p-card-media" href="#/p/${p.id}" tabindex="-1" aria-hidden="true">${productImg(p, 'p-card-img')}</a>
            <div class="p-card-body">
              <span class="p-card-cat">${esc(S.catalogue.category(p.category).name)}</span>
              <h2 class="p-card-name"><a href="#/p/${p.id}">${esc(p.name)}</a></h2>
              <p class="p-card-blurb">${esc(p.blurb)}</p>
              <div class="p-card-foot">
                <span class="p-card-price">${fromLabel(p)}</span>
                <span class="p-card-lead">${p.leadTime} day lead</span>
              </div>
            </div>
          </article>`).join('') + `</div>`
      : `<div class="empty"><p>No products match that. <a href="#/">Show everything</a>.</p></div>`;

    main.innerHTML = `<div class="v-wrap">${head}${grid}</div>`;
  }

  /* =====================================================================
     VIEW: product
     ===================================================================== */
  function viewProduct(id) {
    const p = S.catalogue.get(id);
    if (!p) return notFound();

    // default selection = first choice of each option
    const sel = {};
    (p.options || []).forEach(o => { sel[o.id] = o.choices[0].id; });
    let qty = p.pricing.type === 'tiers' ? p.pricing.tiers[0].qty : (p.pricing.min || 1);

    const qtyControl = p.pricing.type === 'tiers'
      ? `<div class="opt">
           <span class="opt-label">Quantity</span>
           <div class="tier-grid">` + p.pricing.tiers.map((t, i) => `
             <button class="tier${i === 0 ? ' is-on' : ''}" type="button" data-qty="${t.qty}">
               <span class="tier-qty">${t.qty}</span>
               <span class="tier-price" data-tier-price="${t.qty}">${money(t.price)}</span>
             </button>`).join('') + `</div>
         </div>`
      : `<div class="opt">
           <span class="opt-label">Quantity <span class="muted">(min ${p.pricing.min}, in ${p.pricing.step}s)</span></span>
           <div class="qty">
             <button class="qty-btn" type="button" data-step="-1" aria-label="Decrease quantity">&minus;</button>
             <input class="qty-input" id="qty-input" type="number" value="${qty}"
                    min="${p.pricing.min}" step="${p.pricing.step}" aria-label="Quantity"/>
             <button class="qty-btn" type="button" data-step="1" aria-label="Increase quantity">+</button>
           </div>
           <p class="qty-hint" id="qty-hint"></p>
         </div>`;

    main.innerHTML = `
      <div class="v-wrap">
        <a class="v-back" href="#/c/${p.category}">${icon.back}${esc(S.catalogue.category(p.category).name)}</a>
        <div class="pd">
          <div class="pd-media">${productImg(p, 'pd-img')}</div>
          <div class="pd-info">
            <span class="p-card-cat">${esc(S.catalogue.category(p.category).name)}</span>
            <h1 class="pd-name">${esc(p.name)}</h1>
            <p class="pd-desc">${esc(p.description)}</p>

            <form class="pd-form" id="pd-form">
              ${(p.options || []).map(o => `
                <div class="opt">
                  <label class="opt-label" for="opt-${o.id}">${esc(o.label)}</label>
                  <div class="select-wrap">
                    <select class="select" id="opt-${o.id}" data-opt="${o.id}">
                      ${o.choices.map(c => `<option value="${c.id}">${esc(c.label)}${
                        c.delta ? ' (' + (c.delta > 0 ? '+' : '−') + money(Math.abs(c.delta)) + ')' : ''}</option>`).join('')}
                    </select>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9.5 6 6 6-6"/></svg>
                  </div>
                </div>`).join('')}
              ${qtyControl}

              <div class="pd-price">
                <div>
                  <span class="pd-price-key">Total</span>
                  <span class="pd-price-val" id="pd-total"></span>
                </div>
                <span class="pd-price-unit" id="pd-unit"></span>
              </div>

              <button class="btn btn-primary btn-lg" type="submit">Add to cart ${icon.arrow}</button>
              <p class="pd-lead">Lead time ${p.leadTime} working days from artwork approval.
                 <span class="muted">Prices exclude VAT.</span></p>
            </form>

            <table class="spec">
              <caption>Specifications</caption>
              <tbody>${p.specs.map(([k, v]) =>
                `<tr><th scope="row">${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')}</tbody>
            </table>
          </div>
        </div>
      </div>`;

    const form = document.getElementById('pd-form');
    const totalEl = document.getElementById('pd-total');
    const unitEl = document.getElementById('pd-unit');

    function repaint() {
      const unit = S.pricing.unitPrice(p, sel, qty);
      const total = S.pricing.lineTotal(p, sel, qty);
      totalEl.textContent = money(total);
      unitEl.textContent = p.pricing.type === 'tiers'
        ? `${qty} units`
        : `${money(unit)} each × ${qty}`;

      if (p.pricing.type === 'tiers') {
        form.querySelectorAll('[data-tier-price]').forEach(el => {
          const t = Number(el.dataset.tierPrice);
          el.textContent = money(S.pricing.unitPrice(p, sel, t));
        });
        form.querySelectorAll('.tier').forEach(b =>
          b.classList.toggle('is-on', Number(b.dataset.qty) === qty));
      } else {
        const nb = S.pricing.nextBreak(p, qty);
        const hint = document.getElementById('qty-hint');
        hint.textContent = nb
          ? `Order ${nb.from} or more and the unit price drops to ${money(nb.price)}.`
          : '';
      }
    }

    form.addEventListener('change', e => {
      if (e.target.dataset.opt) { sel[e.target.dataset.opt] = e.target.value; repaint(); }
      if (e.target.id === 'qty-input') {
        const step = p.pricing.step, min = p.pricing.min;
        let v = Math.max(min, Number(e.target.value) || min);
        v = min + Math.round((v - min) / step) * step;      // snap to the step
        qty = v; e.target.value = v; repaint();
      }
    });
    form.addEventListener('click', e => {
      const tier = e.target.closest('.tier');
      if (tier) { qty = Number(tier.dataset.qty); repaint(); return; }
      const stepBtn = e.target.closest('[data-step]');
      if (stepBtn) {
        const input = document.getElementById('qty-input');
        const next = Math.max(p.pricing.min, qty + Number(stepBtn.dataset.step) * p.pricing.step);
        qty = next; input.value = next; repaint();
      }
    });
    form.addEventListener('submit', e => {
      e.preventDefault();
      S.cart.add(p.id, sel, qty);
      toast(`${p.name} added to your cart.`, 'ok');
    });

    repaint();
  }

  /* =====================================================================
     VIEW: cart
     ===================================================================== */
  function viewCart() {
    const c = S.cart.summary();
    if (!c.lines.length) {
      main.innerHTML = `<div class="v-wrap"><h1 class="v-title">Your cart</h1>
        <div class="empty">
          <p>Your cart is empty.</p>
          <a class="btn btn-primary" href="#/">Browse products ${icon.arrow}</a>
        </div></div>`;
      return;
    }

    main.innerHTML = `
      <div class="v-wrap">
        <h1 class="v-title">Your cart</h1>
        <div class="cart">
          <div class="cart-lines">
            ${c.lines.map(l => `
              <article class="cl" data-key="${esc(l.key)}">
                <a class="cl-media" href="#/p/${l.product.id}" tabindex="-1" aria-hidden="true">
                  <img src="${esc(l.product.image)}" alt="" width="800" height="800" loading="lazy"/></a>
                <div class="cl-body">
                  <h2 class="cl-name"><a href="#/p/${l.product.id}">${esc(l.product.name)}</a></h2>
                  ${l.optionLabels.length ? `<ul class="cl-opts">${l.optionLabels.map(o =>
                    `<li><span>${esc(o.label)}</span> ${esc(o.value)}</li>`).join('')}</ul>` : ''}
                  <p class="cl-lead">Lead time ${l.product.leadTime} working days</p>
                </div>
                <div class="cl-qty">
                  ${l.product.pricing.type === 'tiers'
                    ? `<span class="cl-qty-fixed">${l.qty} units</span>`
                    : `<div class="qty qty-sm">
                         <button class="qty-btn" type="button" data-cart-step="-1" aria-label="Decrease">&minus;</button>
                         <input class="qty-input" type="number" value="${l.qty}"
                                min="${l.product.pricing.min}" step="${l.product.pricing.step}"
                                data-cart-qty aria-label="Quantity for ${esc(l.product.name)}"/>
                         <button class="qty-btn" type="button" data-cart-step="1" aria-label="Increase">+</button>
                       </div>`}
                  <span class="cl-unit">${money(l.unitPrice)}${l.product.pricing.type === 'tiers' ? ' / pack' : ' each'}</span>
                </div>
                <div class="cl-total">${money(l.total)}</div>
                <button class="cl-remove" type="button" data-remove aria-label="Remove ${esc(l.product.name)}">${icon.trash}</button>
              </article>`).join('')}
          </div>

          <aside class="cart-summary">
            <h2 class="cs-title">Summary</h2>
            <dl class="cs-rows">
              <div><dt>Subtotal</dt><dd>${money(c.subtotal)}</dd></div>
              <div><dt>VAT (15%)</dt><dd>${money(c.vat)}</dd></div>
              <div class="cs-total"><dt>Total</dt><dd>${money(c.total)}</dd></div>
            </dl>
            <p class="cs-lead">Longest lead time in this order: <strong>${c.leadTime} working days</strong>.</p>
            <a class="btn btn-primary btn-lg btn-block" href="#/checkout">Checkout ${icon.arrow}</a>
            <a class="btn btn-ghost btn-block" href="#/">Continue shopping</a>
          </aside>
        </div>
      </div>`;

    main.addEventListener('click', onCartClick);
    main.addEventListener('change', onCartChange);
  }

  function onCartClick(e) {
    const line = e.target.closest('.cl');
    if (!line) return;
    const key = line.dataset.key;
    if (e.target.closest('[data-remove]')) { S.cart.remove(key); render(); return; }
    const step = e.target.closest('[data-cart-step]');
    if (step) {
      const input = line.querySelector('[data-cart-qty]');
      const product = S.catalogue.get(line.querySelector('a[href^="#/p/"]').getAttribute('href').split('/').pop());
      const next = Number(input.value) + Number(step.dataset.cartStep) * product.pricing.step;
      S.cart.setQty(key, next); render();
    }
  }
  function onCartChange(e) {
    if (!e.target.matches('[data-cart-qty]')) return;
    const line = e.target.closest('.cl');
    S.cart.setQty(line.dataset.key, e.target.value);
    render();
  }

  /* =====================================================================
     VIEW: checkout
     ===================================================================== */
  function viewCheckout() {
    const c = S.cart.summary();
    if (!c.lines.length) { location.hash = '#/cart'; return; }
    const user = S.auth.current() || {};

    main.innerHTML = `
      <div class="v-wrap">
        <a class="v-back" href="#/cart">${icon.back}Back to cart</a>
        <h1 class="v-title">Checkout</h1>
        <form class="co" id="co-form" novalidate>
          <div class="co-main">
            <section class="co-block">
              <h2 class="co-h">Your details</h2>
              <div class="co-grid">
                ${field('name', 'Full name', 'text', true, user.name)}
                ${field('company', 'Company', 'text', false, user.company)}
                ${field('email', 'Email', 'email', true, user.email)}
                ${field('phone', 'Phone', 'tel', true, user.phone)}
              </div>
            </section>

            <section class="co-block">
              <h2 class="co-h">Delivery or collection</h2>
              <div class="ful">
                <label class="ful-opt">
                  <input type="radio" name="fulfilment" value="delivery" checked/>
                  <span><strong>Delivery</strong><em>Courier within Lesotho, quoted on confirmation</em></span>
                </label>
                <label class="ful-opt">
                  <input type="radio" name="fulfilment" value="collection"/>
                  <span><strong>Collection</strong><em>Thetsane Office Park, Maseru</em></span>
                </label>
              </div>
              <div class="co-grid" id="addr-fields">
                ${field('address', 'Delivery address', 'text', true, user.address)}
                ${field('city', 'Town / city', 'text', true, user.city)}
              </div>
            </section>

            <section class="co-block">
              <h2 class="co-h">Order notes</h2>
              <p class="co-field">
                <label class="co-label" for="notes">Anything we should know
                  <span class="co-opt">(optional)</span></label>
                <textarea class="co-input" id="notes" name="notes" rows="3"
                  placeholder="Size splits, deadlines, where to send artwork."></textarea>
              </p>
            </section>

            <section class="co-block">
              <h2 class="co-h">Payment</h2>
              <div class="pay-note">
                ${icon.lock}
                <div>
                  <p><strong>Card payment is not connected on this preview build.</strong></p>
                  <p>When it is, card details are entered on the payment provider&rsquo;s own secure page &mdash;
                     never on this site. Submitting now records the order and we will send payment
                     instructions by email.</p>
                </div>
              </div>
            </section>
          </div>

          <aside class="co-side">
            <h2 class="cs-title">${c.lines.length} item${c.lines.length === 1 ? '' : 's'}</h2>
            <ul class="co-lines">
              ${c.lines.map(l => `<li>
                <img src="${esc(l.product.image)}" alt="" width="800" height="800" loading="lazy"/>
                <span class="col-name">${esc(l.product.name)}<em>${S.pricing.qtyLabel(l.product, l.qty)}</em></span>
                <span class="col-total">${money(l.total)}</span></li>`).join('')}
            </ul>
            <dl class="cs-rows">
              <div><dt>Subtotal</dt><dd>${money(c.subtotal)}</dd></div>
              <div><dt>VAT (15%)</dt><dd>${money(c.vat)}</dd></div>
              <div class="cs-total"><dt>Total</dt><dd>${money(c.total)}</dd></div>
            </dl>
            <button class="btn btn-primary btn-lg btn-block" type="submit" form="co-form">Place order ${icon.arrow}</button>
            <p class="cs-fine">By placing this order you agree to our production and artwork terms.
               See our <a href="../privacy.html">privacy policy</a>.</p>
          </aside>
        </form>
      </div>`;

    const form = document.getElementById('co-form');
    const addr = document.getElementById('addr-fields');
    form.addEventListener('change', e => {
      if (e.target.name === 'fulfilment') addr.hidden = e.target.value === 'collection';
    });
    form.addEventListener('submit', onCheckoutSubmit);
  }

  function field(id, label, type, required, value) {
    return `<p class="co-field">
      <label class="co-label" for="${id}">${esc(label)}${required ? '' : ' <span class="co-opt">(optional)</span>'}</label>
      <input class="co-input" id="${id}" name="${id}" type="${type}" value="${esc(value || '')}"
             ${required ? 'required' : ''} autocomplete="${autocompleteFor(id)}"
             aria-describedby="${id}-err"/>
      <span class="co-err" id="${id}-err" aria-live="polite"></span></p>`;
  }
  const autocompleteFor = id => ({ name: 'name', company: 'organization', email: 'email',
    phone: 'tel', address: 'street-address', city: 'address-level2' }[id] || 'off');

  function onCheckoutSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const collection = form.querySelector('[name=fulfilment]:checked').value === 'collection';
    const need = ['name', 'email', 'phone'].concat(collection ? [] : ['address', 'city']);

    let ok = true, first = null;
    form.querySelectorAll('.co-input').forEach(i => setErr(i, ''));
    need.forEach(id => {
      const input = form.querySelector('#' + id);
      const v = input.value.trim();
      let msg = '';
      if (!v) msg = 'Required.';
      else if (id === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) msg = 'Enter a valid email address.';
      else if (id === 'phone' && v.replace(/\D/g, '').length < 7) msg = 'Enter a valid phone number.';
      if (msg) { setErr(input, msg); ok = false; if (!first) first = input; }
    });
    if (!ok) { first.focus(); toast('Check the highlighted fields.', 'bad'); return; }

    const val = id => (form.querySelector('#' + id) || {}).value || '';
    const customer = { name: val('name').trim(), company: val('company').trim(),
                       email: val('email').trim(), phone: val('phone').trim() };

    // remember the customer locally so order history has an owner
    S.auth.signIn(Object.assign({}, customer, {
      address: val('address').trim(), city: val('city').trim() }));

    const order = S.orders.create({
      customer,
      fulfilment: collection ? 'collection' : 'delivery',
      address: collection ? null : { line1: val('address').trim(), city: val('city').trim() },
      notes: val('notes').trim(),
      paymentMethod: 'card',
    });

    S.payments.begin(order.id).then(res => {
      if (!res.ok) toast(res.message, 'ok');
    }).catch(() => toast('Could not start payment. The order is saved.', 'bad'));

    location.hash = '#/order/' + order.id;
  }

  function setErr(input, msg) {
    const box = input.closest('.co-field');
    if (box) box.classList.toggle('has-error', Boolean(msg));
    const out = document.getElementById(input.id + '-err');
    if (out) out.textContent = msg;
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
  }

  /* =====================================================================
     VIEW: account
     ===================================================================== */
  function viewAccount() {
    const user = S.auth.current();
    main.innerHTML = user ? `
      <div class="v-wrap v-narrow">
        <h1 class="v-title">Your account</h1>
        <div class="acct-card">
          <div class="acct-avatar">${esc((user.name || user.email).slice(0, 2).toUpperCase())}</div>
          <div>
            <p class="acct-name">${esc(user.name || 'Customer')}</p>
            <p class="acct-email">${esc(user.email)}</p>
            ${user.company ? `<p class="acct-meta">${esc(user.company)}</p>` : ''}
          </div>
        </div>
        <form class="acct-form" id="acct-form">
          <div class="co-grid">
            ${field('name', 'Full name', 'text', true, user.name)}
            ${field('company', 'Company', 'text', false, user.company)}
            ${field('phone', 'Phone', 'tel', false, user.phone)}
            ${field('address', 'Delivery address', 'text', false, user.address)}
          </div>
          <div class="acct-actions">
            <button class="btn btn-primary" type="submit">Save details</button>
            <button class="btn btn-ghost" type="button" id="signout">Sign out</button>
          </div>
        </form>
        <a class="acct-link" href="#/orders">View your orders ${icon.arrow}</a>
      </div>` : `
      <div class="v-wrap v-narrow">
        <h1 class="v-title">Sign in</h1>
        <p class="v-lede">Enter your details to keep track of your orders.</p>
        <div class="demo-note">
          <strong>Preview build:</strong> this creates a profile in this browser only. There is no
          password and nothing is sent anywhere &mdash; real accounts need a server, so we deliberately
          do not ask you for one.
        </div>
        <form class="acct-form" id="signin-form">
          <div class="co-grid">
            ${field('name', 'Full name', 'text', true, '')}
            ${field('email', 'Email', 'email', true, '')}
            ${field('company', 'Company', 'text', false, '')}
            ${field('phone', 'Phone', 'tel', false, '')}
          </div>
          <button class="btn btn-primary btn-lg" type="submit">Continue ${icon.arrow}</button>
        </form>
      </div>`;

    const form = document.getElementById('acct-form') || document.getElementById('signin-form');
    form.addEventListener('submit', e => {
      e.preventDefault();
      const val = id => { const el = form.querySelector('#' + id); return el ? el.value.trim() : ''; };
      if (form.id === 'signin-form') {
        if (!val('name') || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val('email'))) {
          toast('Enter your name and a valid email.', 'bad'); return;
        }
        S.auth.signIn({ name: val('name'), email: val('email'),
                        company: val('company'), phone: val('phone'), role: 'buyer' });
        toast('Signed in.', 'ok');
        location.hash = '#/dashboard';
      } else {
        S.auth.update({ name: val('name'), company: val('company'),
                        phone: val('phone'), address: val('address') });
        toast('Details saved.', 'ok');
      }
    });
    const so = document.getElementById('signout');
    if (so) so.addEventListener('click', () => { S.auth.signOut(); toast('Signed out.'); render(); });
  }

  /* =====================================================================
     VIEW: order history
     ===================================================================== */
  function viewOrders() {
    const list = S.orders.list();
    const stages = S.orders.stages();
    main.innerHTML = `
      <div class="v-wrap">
        <h1 class="v-title">Your orders</h1>
        ${list.length ? `<div class="ord-list">` + list.map(o => {
          const st = stages[S.orders.stageIndex(o.stage)];
          return `<a class="ord" href="#/order/${o.id}">
            <div class="ord-main">
              <span class="ord-ref">${esc(o.reference)}</span>
              <span class="ord-date">${new Date(o.placedAt).toLocaleDateString('en-GB',
                { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              <span class="ord-items">${o.lines.length} item${o.lines.length === 1 ? '' : 's'}</span>
            </div>
            <div class="ord-side">
              <span class="pill pill-${esc(o.stage)}">${esc(st.label)}</span>
              <span class="ord-total">${money(o.total)}</span>
              ${icon.arrow}
            </div></a>`; }).join('') + `</div>`
        : `<div class="empty">
             <p>No orders yet.</p>
             <a class="btn btn-primary" href="#/">Browse products ${icon.arrow}</a>
           </div>`}
      </div>`;
  }

  /* =====================================================================
     VIEW: single order + tracking
     ===================================================================== */
  function viewOrder(id) {
    const o = S.orders.get(id);
    if (!o) return notFound();
    const stages = S.orders.stages();
    const at = S.orders.stageIndex(o.stage);
    const done = i => i < at, current = i => i === at;
    const stamp = sid => {
      const h = o.history.find(x => x.stage === sid);
      return h ? new Date(h.at).toLocaleDateString('en-GB',
        { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
    };

    main.innerHTML = `
      <div class="v-wrap">
        <a class="v-back" href="#/orders">${icon.back}All orders</a>

        <div class="oh">
          <div>
            <h1 class="v-title">${esc(o.reference)}</h1>
            <p class="v-lede">Placed ${new Date(o.placedAt).toLocaleDateString('en-GB',
              { day: 'numeric', month: 'long', year: 'numeric' })}
              &middot; due ${new Date(o.dueAt).toLocaleDateString('en-GB',
              { day: 'numeric', month: 'long' })}</p>
          </div>
          <span class="pill pill-lg pill-${esc(o.stage)}">${esc(stages[at].label)}</span>
        </div>

        ${o.payment.status !== 'paid' ? `<div class="pay-banner">
          ${icon.lock}<div><strong>Payment outstanding.</strong>
          Card payment is not connected on this preview build &mdash; we will email payment
          instructions for ${money(o.total)}.</div></div>` : ''}

        <section class="track">
          <h2 class="co-h">Progress</h2>
          <ol class="track-list">
            ${stages.map((s, i) => `
              <li class="tr ${done(i) ? 'is-done' : ''} ${current(i) ? 'is-now' : ''}">
                <span class="tr-dot">${done(i) ? icon.check : ''}</span>
                <div class="tr-body">
                  <span class="tr-label">${esc(s.label)}</span>
                  <span class="tr-blurb">${esc(s.blurb)}</span>
                  ${stamp(s.id) ? `<span class="tr-at">${stamp(s.id)}</span>` : ''}
                </div>
              </li>`).join('')}
          </ol>
          ${at < stages.length - 1 ? `<p class="track-note">
            Our production team updates this as your job moves through the studio.
            You&rsquo;ll be emailed when it changes.</p>` : ''}
        </section>

        <div class="od">
          <section class="od-items">
            <h2 class="co-h">Items</h2>
            ${o.lines.map(l => `<article class="oli">
              <img src="${esc(l.image)}" alt="" width="800" height="800" loading="lazy"/>
              <div><span class="oli-name">${esc(l.name)}</span>
                ${l.options.length ? `<span class="oli-opts">${l.options.map(x =>
                  esc(x.label) + ': ' + esc(x.value)).join(' &middot; ')}</span>` : ''}
                <span class="oli-qty">${l.qty} units</span></div>
              <span class="oli-total">${money(l.total)}</span></article>`).join('')}
          </section>
          <aside class="od-side">
            <h2 class="co-h">${o.fulfilment === 'collection' ? 'Collection' : 'Delivery'}</h2>
            <p class="od-addr">${o.fulfilment === 'collection'
              ? 'Thetsane Office Park, Office FF03,<br/>Maseru 100'
              : esc(o.address.line1) + '<br/>' + esc(o.address.city)}</p>
            ${o.notes ? `<h2 class="co-h">Notes</h2><p class="od-addr">${esc(o.notes)}</p>` : ''}
            <dl class="cs-rows">
              <div><dt>Subtotal</dt><dd>${money(o.subtotal)}</dd></div>
              <div><dt>VAT (15%)</dt><dd>${money(o.vat)}</dd></div>
              <div class="cs-total"><dt>Total</dt><dd>${money(o.total)}</dd></div>
            </dl>
          </aside>
        </div>
      </div>`;

  }

  /* =====================================================================
     VIEW: buyer dashboard
     ===================================================================== */
  function viewDashboard() {
    const user = S.auth.current();
    if (!user) { location.hash = '#/account'; return; }

    const list = S.orders.list();
    const stages = S.orders.stages();
    const spend = list.filter(o => o.payment.status === 'paid')
      .reduce((s, o) => s + o.total, 0);
    const inProd = list.filter(o => ['artwork', 'production', 'quality'].includes(o.stage)).length;
    const owing = list.filter(o => o.payment.status !== 'paid');
    const cartCount = S.cart.summary().count;

    const tile = (n, label, tone) =>
      `<div class="tile${tone ? ' tile-' + tone : ''}"><span class="tile-n">${n}</span>
       <span class="tile-l">${label}</span></div>`;

    main.innerHTML = `
      <div class="v-wrap">
        <div class="dash-head">
          <div>
            <span class="dash-hi">Welcome back</span>
            <h1 class="v-title">${esc((user.name || 'there').split(' ')[0])}</h1>
          </div>
          <a class="btn btn-primary" href="#/">Start an order ${icon.arrow}</a>
        </div>

        <div class="tiles">
          ${tile(list.length, 'Orders placed')}
          ${tile(inProd, 'In production', inProd ? 'live' : '')}
          ${tile(owing.length, 'Awaiting payment', owing.length ? 'warn' : '')}
          ${tile(money(spend), 'Paid to date')}
        </div>

        ${owing.length ? `<div class="pay-banner">${icon.lock}<div>
          <strong>${owing.length} order${owing.length === 1 ? '' : 's'} awaiting payment.</strong>
          We&rsquo;ll email payment instructions &mdash; card payment is not connected on this
          preview build.</div></div>` : ''}

        <div class="dash-grid">
          <section class="dash-panel">
            <div class="dash-panel-head">
              <h2 class="co-h">Recent orders</h2>
              ${list.length > 3 ? `<a class="dash-more" href="#/orders">See all ${icon.arrow}</a>` : ''}
            </div>
            ${list.length ? `<div class="ord-list">` + list.slice(0, 3).map(o => {
              const st = stages[S.orders.stageIndex(o.stage)];
              return `<a class="ord" href="#/order/${o.id}">
                <div class="ord-main">
                  <span class="ord-ref">${esc(o.reference)}</span>
                  <span class="ord-date">${new Date(o.placedAt).toLocaleDateString('en-GB',
                    { day: 'numeric', month: 'short' })}</span>
                  <span class="ord-items">${o.lines.length} item${o.lines.length === 1 ? '' : 's'}</span>
                </div>
                <div class="ord-side">
                  <span class="pill pill-${esc(o.stage)}">${esc(st.label)}</span>
                  <span class="ord-total">${money(o.total)}</span>${icon.arrow}
                </div></a>`; }).join('') + `</div>`
              : `<div class="empty"><p>You haven&rsquo;t ordered yet.</p>
                   <a class="btn btn-primary" href="#/">Browse products ${icon.arrow}</a></div>`}
          </section>

          <aside class="dash-side">
            <section class="dash-panel">
              <h2 class="co-h">Your details</h2>
              <p class="dash-kv"><span>Name</span>${esc(user.name || '—')}</p>
              <p class="dash-kv"><span>Email</span>${esc(user.email)}</p>
              ${user.company ? `<p class="dash-kv"><span>Company</span>${esc(user.company)}</p>` : ''}
              ${user.phone ? `<p class="dash-kv"><span>Phone</span>${esc(user.phone)}</p>` : ''}
              <a class="btn btn-ghost btn-block" href="#/account">Edit details</a>
            </section>
            ${cartCount ? `<section class="dash-panel">
              <h2 class="co-h">Cart</h2>
              <p class="dash-kv"><span>Waiting</span>${cartCount} item${cartCount === 1 ? '' : 's'}</p>
              <a class="btn btn-primary btn-block" href="#/cart">Go to cart ${icon.arrow}</a>
            </section>` : ''}
          </aside>
        </div>
      </div>`;
  }

  function notFound() {
    main.innerHTML = `<div class="v-wrap v-narrow"><h1 class="v-title">Not found</h1>
      <p class="v-lede">That page doesn&rsquo;t exist.</p>
      <a class="btn btn-primary" href="#/">Back to the shop ${icon.arrow}</a></div>`;
  }

  /* =====================================================================
     ROUTER
     ===================================================================== */
  function render() {
    const hash = location.hash || '#/';
    const parts = hash.replace(/^#\//, '').split('/');
    main.removeEventListener('click', onCartClick);
    main.removeEventListener('change', onCartChange);

    switch (parts[0]) {
      case '':         viewCatalogue(null, null); break;
      case 'c':        viewCatalogue(parts[1], null); break;
      case 'p':        viewProduct(parts[1]); break;
      case 'search':   viewCatalogue(null, decodeURIComponent(parts[1] || '')); break;
      case 'cart':     viewCart(); break;
      case 'checkout': viewCheckout(); break;
      case 'account':   viewAccount(); break;
      case 'dashboard': viewDashboard(); break;
      case 'orders':   viewOrders(); break;
      case 'order':    viewOrder(parts[1]); break;
      default:         notFound();
    }
    paintChrome();
    window.scrollTo(0, 0);
    const h1 = main.querySelector('h1');
    // A <br> contributes no whitespace to textContent, so the two lines of the
    // hero heading would run together in the tab title. Turn breaks into
    // spaces before stripping the remaining tags.
    const heading = h1
      ? h1.innerHTML
          .replace(/<br\s*\/?>/gi, ' ')
          .replace(/<[^>]+>/g, '')
          .replace(/\s+/g, ' ')
          .trim()
      : '';
    document.title = (heading ? heading + ' - ' : '') + 'Shop - Brand Corporations';
  }

  /* ---------- wiring ---------- */
  window.addEventListener('hashchange', render);
  window.addEventListener('cart:change', paintChrome);
  // a change of identity changes what most views should show, so re-render
  // the whole view rather than only the header chrome
  window.addEventListener('auth:change', render);

  document.querySelector('.shop-search').addEventListener('submit', e => {
    e.preventDefault();
    const q = document.getElementById('shop-search-input').value.trim();
    location.hash = q ? '#/search/' + encodeURIComponent(q) : '#/';
  });

  const banner = document.querySelector('.demo-banner');
  banner.querySelector('.demo-banner-close').addEventListener('click', () => banner.remove());
  document.getElementById('sf-year').textContent = new Date().getFullYear();

  render();
})();
