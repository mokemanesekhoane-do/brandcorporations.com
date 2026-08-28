/* =========================================================================
   Brand Corporations Shop — Administration dashboard
   Hash-routed views rendered into #admin-main. Every privileged read or
   write goes through Store.admin.*, which passes through Store.guard().
   Nothing here talks to storage directly.
   ========================================================================= */
(function () {
  'use strict';

  const S = window.Store;
  const main = document.getElementById('admin-main');
  const gate = document.getElementById('gate');
  const shell = document.getElementById('shell');
  const esc = s => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const money = S.money;

  let toastTimer;
  function toast(msg, kind) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = 'toast is-visible' + (kind ? ' is-' + kind : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.className = 'toast'; }, 3200);
  }

  const I = {
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h13M12.5 6l6 6-6 6"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H6M11.5 6l-6 6 6 6"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><path d="M12 5.5v13M5.5 12h13"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4.5 6.5h15M9.5 6.5V4.8h5v1.7M6.6 6.5l.9 12.2a1.6 1.6 0 0 0 1.6 1.5h5.8a1.6 1.6 0 0 0 1.6-1.5l.9-12.2"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.6 4.6 4.4L19 7"/></svg>',
  };

  const date = (iso, withTime) => new Date(iso).toLocaleDateString('en-GB', Object.assign(
    { day: 'numeric', month: 'short', year: 'numeric' },
    withTime ? { hour: '2-digit', minute: '2-digit' } : {}));

  /* =====================================================================
     GATE  (see the caveat in admin.html — this is separation, not security)
     ===================================================================== */
  function showGate() {
    gate.hidden = false;
    shell.hidden = true;
    document.getElementById('gate-email').focus();
  }
  function showShell() {
    gate.hidden = true;
    shell.hidden = false;
    const u = S.auth.current();
    document.getElementById('side-name').textContent = u.name || u.email;
    document.getElementById('side-role').textContent = u.title || 'Administrator';
    document.getElementById('side-avatar').textContent =
      (u.name || u.email).slice(0, 2).toUpperCase();
    render();
  }

  document.getElementById('gate-form').addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('gate-email').value;
    const res = S.auth.signInStaff(email);
    const err = document.getElementById('gate-err');
    if (!res.ok) { err.textContent = res.message; return; }
    err.textContent = '';
    showShell();
  });

  document.getElementById('signout').addEventListener('click', () => {
    S.auth.signOut();
    location.hash = '#/';
    showGate();
  });

  /* =====================================================================
     OVERVIEW
     ===================================================================== */
  function viewOverview() {
    const st = S.admin.stats();
    const recent = S.admin.orders().slice(0, 6);
    const log = S.admin.activity().slice(0, 6);
    const stages = S.orders.stages();

    const kpi = (n, label, sub, tone) => `
      <div class="kpi${tone ? ' kpi-' + tone : ''}">
        <span class="kpi-n">${n}</span>
        <span class="kpi-l">${label}</span>
        ${sub ? `<span class="kpi-s">${sub}</span>` : ''}
      </div>`;

    const maxStage = Math.max(1, ...st.byStage.map(s => s.count));

    main.innerHTML = `
      <div class="kpis">
        ${kpi(st.orders, 'Orders', st.ordersToday + ' today')}
        ${kpi(money(st.revenue), 'Paid revenue', st.orders - st.awaitingPayment + ' settled')}
        ${kpi(st.awaitingPayment, 'Awaiting payment', money(st.pipeline) + ' in pipeline', st.awaitingPayment ? 'warn' : '')}
        ${kpi(st.inProduction, 'In production', st.open + ' open', st.inProduction ? 'live' : '')}
        ${kpi(st.products, 'Products', st.hidden + ' hidden')}
        ${kpi(st.customers, 'Customers', '')}
      </div>

      <div class="cols">
        <section class="panel">
          <div class="panel-head">
            <h2 class="panel-title">Recent orders</h2>
            <a class="panel-more" href="#/orders">All orders ${I.arrow}</a>
          </div>
          ${recent.length ? table(
            ['Reference', 'Customer', 'Stage', 'Payment', 'Total'],
            recent.map(o => ({
              href: '#/order/' + o.id,
              cells: [
                `<strong>${esc(o.reference)}</strong><em class="sub">${date(o.placedAt)}</em>`,
                `${esc(o.customer.name)}<em class="sub">${esc(o.customer.company || o.customer.email)}</em>`,
                stagePill(o.stage),
                payPill(o.payment.status),
                `<strong>${money(o.total)}</strong>`,
              ] }))) : empty('No orders yet.')}
        </section>

        <aside class="stack">
          <section class="panel">
            <h2 class="panel-title">Production pipeline</h2>
            <ul class="bars">
              ${st.byStage.map(s => `<li>
                <span class="bar-l">${esc(s.label)}</span>
                <span class="bar-track"><span class="bar-fill" style="width:${
                  Math.round((s.count / maxStage) * 100)}%"></span></span>
                <span class="bar-n">${s.count}</span></li>`).join('')}
            </ul>
          </section>
          <section class="panel">
            <div class="panel-head">
              <h2 class="panel-title">Activity</h2>
              <a class="panel-more" href="#/activity">All ${I.arrow}</a>
            </div>
            ${log.length ? `<ul class="log">${log.map(e => `<li>
              <span class="log-a">${esc(e.action)}</span>
              <span class="log-m">${esc(e.by)} &middot; ${date(e.at, true)}</span></li>`).join('')}</ul>`
              : empty('Nothing logged yet.')}
          </section>
        </aside>
      </div>`;
  }

  /* =====================================================================
     ORDERS
     ===================================================================== */
  let orderFilter = { stage: 'all', payment: 'all', q: '' };

  function viewOrders() {
    const stages = S.orders.stages();
    const rows = S.admin.orders(orderFilter);

    main.innerHTML = `
      <div class="toolbar">
        <div class="field-inline">
          <label for="f-stage">Stage</label>
          <div class="sel"><select id="f-stage">
            <option value="all">All stages</option>
            ${stages.map(s => `<option value="${s.id}"${orderFilter.stage === s.id ? ' selected' : ''}>${esc(s.label)}</option>`).join('')}
          </select></div>
        </div>
        <div class="field-inline">
          <label for="f-pay">Payment</label>
          <div class="sel"><select id="f-pay">
            ${['all', 'pending', 'paid', 'refunded'].map(v =>
              `<option value="${v}"${orderFilter.payment === v ? ' selected' : ''}>${
                v === 'all' ? 'Any' : v[0].toUpperCase() + v.slice(1)}</option>`).join('')}
          </select></div>
        </div>
        <input class="search" id="f-q" type="search" placeholder="Search reference, customer, company"
               value="${esc(orderFilter.q)}"/>
        <span class="toolbar-count">${rows.length} order${rows.length === 1 ? '' : 's'}</span>
      </div>

      ${rows.length ? table(
        ['Reference', 'Customer', 'Placed', 'Due', 'Stage', 'Payment', 'Total'],
        rows.map(o => ({
          href: '#/order/' + o.id,
          cells: [
            `<strong>${esc(o.reference)}</strong><em class="sub">${o.lines.length} item${o.lines.length === 1 ? '' : 's'}</em>`,
            `${esc(o.customer.name)}<em class="sub">${esc(o.customer.company || o.customer.email)}</em>`,
            date(o.placedAt),
            date(o.dueAt),
            stagePill(o.stage),
            payPill(o.payment.status),
            `<strong>${money(o.total)}</strong>`,
          ] }))) : empty('No orders match those filters.')}`;

    const rerun = () => {
      orderFilter.stage = document.getElementById('f-stage').value;
      orderFilter.payment = document.getElementById('f-pay').value;
      orderFilter.q = document.getElementById('f-q').value.trim();
      viewOrders();
    };
    document.getElementById('f-stage').addEventListener('change', rerun);
    document.getElementById('f-pay').addEventListener('change', rerun);
    let t; document.getElementById('f-q').addEventListener('input', () => {
      clearTimeout(t); t = setTimeout(rerun, 250);
    });
  }

  function viewOrder(id) {
    const o = S.admin.order(id);
    if (!o) return notFound();
    const stages = S.orders.stages();
    const at = S.orders.stageIndex(o.stage);

    main.innerHTML = `
      <a class="back" href="#/orders">${I.back}All orders</a>

      <div class="rec-head">
        <div>
          <h2 class="rec-title">${esc(o.reference)}</h2>
          <p class="rec-sub">Placed ${date(o.placedAt, true)} &middot; due ${date(o.dueAt)}</p>
        </div>
        <div class="rec-head-side">${stagePill(o.stage)}${payPill(o.payment.status)}
          <span class="rec-total">${money(o.total)}</span></div>
      </div>

      <div class="cols">
        <div class="stack">
          <section class="panel">
            <h2 class="panel-title">Move this order</h2>
            <p class="panel-note">Each change is stamped with your name and the time.</p>
            <div class="stage-row">
              ${stages.map((s, i) => `<button class="stage-btn${
                i === at ? ' is-now' : i < at ? ' is-done' : ''}" type="button"
                data-stage="${s.id}">${i < at ? I.check : ''}<span>${esc(s.label)}</span></button>`).join('')}
            </div>
          </section>

          <section class="panel">
            <h2 class="panel-title">Items</h2>
            ${table(['Product', 'Qty', 'Unit', 'Total'], o.lines.map(l => ({
              cells: [
                `<div class="cellmedia"><img src="${esc(l.image)}" alt="" width="800" height="800" loading="lazy"/>
                 <span><strong>${esc(l.name)}</strong>${l.options.length
                   ? `<em class="sub">${l.options.map(x => esc(x.label) + ': ' + esc(x.value)).join(' · ')}</em>` : ''}</span></div>`,
                l.qty, money(l.unitPrice), `<strong>${money(l.total)}</strong>`,
              ] })))}
            <dl class="totals">
              <div><dt>Subtotal</dt><dd>${money(o.subtotal)}</dd></div>
              <div><dt>VAT (15%)</dt><dd>${money(o.vat)}</dd></div>
              <div class="totals-grand"><dt>Total</dt><dd>${money(o.total)}</dd></div>
            </dl>
          </section>

          <section class="panel">
            <h2 class="panel-title">History</h2>
            <ul class="log">
              ${o.history.slice().reverse().map(h => {
                const s = stages.find(x => x.id === h.stage);
                return `<li><span class="log-a">${esc(h.note || (s ? s.label : h.stage))}</span>
                  <span class="log-m">${esc(h.by || 'system')} &middot; ${date(h.at, true)}</span></li>`;
              }).join('')}
            </ul>
          </section>
        </div>

        <aside class="stack">
          <section class="panel">
            <h2 class="panel-title">Customer</h2>
            <p class="kv"><span>Name</span>${esc(o.customer.name)}</p>
            ${o.customer.company ? `<p class="kv"><span>Company</span>${esc(o.customer.company)}</p>` : ''}
            <p class="kv"><span>Email</span><a href="mailto:${esc(o.customer.email)}">${esc(o.customer.email)}</a></p>
            <p class="kv"><span>Phone</span><a href="tel:${esc(o.customer.phone)}">${esc(o.customer.phone)}</a></p>
          </section>

          <section class="panel">
            <h2 class="panel-title">${o.fulfilment === 'collection' ? 'Collection' : 'Delivery'}</h2>
            <p class="kv-block">${o.fulfilment === 'collection'
              ? 'Thetsane Office Park, Office FF03,<br/>Maseru 100'
              : esc(o.address.line1) + '<br/>' + esc(o.address.city)}</p>
            ${o.notes ? `<h2 class="panel-title">Notes</h2><p class="kv-block">${esc(o.notes)}</p>` : ''}
          </section>

          <section class="panel">
            <h2 class="panel-title">Payment</h2>
            <p class="panel-note">On the live system this is set by the provider's webhook.
               Change it by hand only to reconcile an EFT or cash payment.</p>
            <p class="kv"><span>Status</span>${payPill(o.payment.status)}</p>
            <p class="kv"><span>Method</span>${esc(o.payment.method)}</p>
            <p class="fld">
              <label class="fld-label" for="payref">Reference</label>
              <input class="fld-input" id="payref" value="${esc(o.payment.reference || '')}"
                     placeholder="EFT reference"/>
            </p>
            <div class="btn-row">
              <button class="btn btn-sm" type="button" data-pay="paid">Mark paid</button>
              <button class="btn btn-sm btn-ghost" type="button" data-pay="pending">Mark pending</button>
            </div>
          </section>
        </aside>
      </div>`;

    main.querySelectorAll('[data-stage]').forEach(b => b.addEventListener('click', () => {
      try {
        S.admin.setStage(o.id, b.dataset.stage);
        toast('Moved to "' + b.textContent.trim() + '".', 'ok');
        render();
      } catch (e) { toast(e.message, 'bad'); }
    }));
    main.querySelectorAll('[data-pay]').forEach(b => b.addEventListener('click', () => {
      try {
        S.admin.setPayment(o.id, b.dataset.pay, document.getElementById('payref').value.trim());
        toast('Payment marked ' + b.dataset.pay + '.', 'ok');
        render();
      } catch (e) { toast(e.message, 'bad'); }
    }));
  }

  /* =====================================================================
     PRODUCTS
     ===================================================================== */
  let productFilter = { category: 'all', availability: 'all', q: '' };

  function viewProducts() {
    const cats = S.catalogue.categories();
    const avail = S.catalogue.availability();
    const rows = S.admin.products(productFilter);

    main.innerHTML = `
      <div class="toolbar">
        <div class="field-inline">
          <label for="p-cat">Category</label>
          <div class="sel"><select id="p-cat">
            <option value="all">All categories</option>
            ${cats.map(c => `<option value="${c.id}"${productFilter.category === c.id ? ' selected' : ''}>${esc(c.name)}</option>`).join('')}
          </select></div>
        </div>
        <div class="field-inline">
          <label for="p-av">Availability</label>
          <div class="sel"><select id="p-av">
            <option value="all">Any</option>
            ${avail.map(a => `<option value="${a.id}"${productFilter.availability === a.id ? ' selected' : ''}>${esc(a.label)}</option>`).join('')}
          </select></div>
        </div>
        <input class="search" id="p-q" type="search" placeholder="Search products" value="${esc(productFilter.q)}"/>
        <button class="btn btn-sm" type="button" id="new-product">${I.plus} New product</button>
        <button class="btn btn-sm btn-ghost" type="button" id="reset-cat">Reset catalogue</button>
      </div>

      ${rows.length ? table(
        ['Product', 'Category', 'Pricing', 'Lead', 'Availability', ''],
        rows.map(p => ({
          cells: [
            `<div class="cellmedia"><img src="${esc(p.image)}" alt="" width="800" height="800" loading="lazy"/>
             <span><strong>${esc(p.name)}</strong><em class="sub">${esc(p.id)}</em></span></div>`,
            esc((cats.find(c => c.id === p.category) || {}).name || p.category),
            p.pricing.type === 'tiers'
              ? `${p.pricing.tiers.length} tiers<em class="sub">from ${money(S.catalogue.from(p))}</em>`
              : `Per unit<em class="sub">from ${money(S.catalogue.from(p))}</em>`,
            p.leadTime + ' d',
            availPill(p),
            `<span class="row-actions">
               <a class="mini" href="#/product/${p.id}">Edit</a>
               <button class="mini mini-bad" type="button" data-del="${p.id}">Delete</button>
             </span>`,
          ] }))) : empty('No products match those filters.')}`;

    const rerun = () => {
      productFilter.category = document.getElementById('p-cat').value;
      productFilter.availability = document.getElementById('p-av').value;
      productFilter.q = document.getElementById('p-q').value.trim();
      viewProducts();
    };
    document.getElementById('p-cat').addEventListener('change', rerun);
    document.getElementById('p-av').addEventListener('change', rerun);
    let t; document.getElementById('p-q').addEventListener('input', () => {
      clearTimeout(t); t = setTimeout(rerun, 250);
    });
    document.getElementById('new-product').addEventListener('click', () => { location.hash = '#/product/new'; });
    document.getElementById('reset-cat').addEventListener('click', () => {
      if (!confirm('Restore the seed catalogue? Products you have added or edited will be lost.')) return;
      S.admin.resetProducts(); toast('Catalogue reset.', 'ok'); viewProducts();
    });
    main.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => {
      const p = S.catalogue.get(b.dataset.del);
      if (!confirm('Delete "' + p.name + '"? This cannot be undone.')) return;
      S.admin.deleteProduct(b.dataset.del); toast('Product deleted.', 'ok'); viewProducts();
    }));
  }

  /* ---------- product editor ---------- */
  function viewProductEditor(id) {
    const isNew = id === 'new';
    const p = isNew ? {
      id: '', name: '', category: 'print', blurb: '', description: '',
      image: '../assets/projects/print/print-01-800.webp',
      specs: [], options: [], leadTime: 5, availability: 'made-to-order', stockQty: null,
      pricing: { type: 'unit', min: 1, step: 1, price: 0, breaks: [] },
    } : S.catalogue.get(id);
    if (!p) return notFound();

    const cats = S.catalogue.categories();
    const avail = S.catalogue.availability();

    main.innerHTML = `
      <a class="back" href="#/products">${I.back}All products</a>
      <form class="editor" id="editor">
        <div class="cols">
          <div class="stack">
            <section class="panel">
              <h2 class="panel-title">Details</h2>
              <div class="grid2">
                ${fld('name', 'Product name', p.name, 'text', true)}
                <p class="fld"><label class="fld-label" for="category">Category</label>
                  <span class="sel"><select class="fld-input" id="category">
                    ${cats.map(c => `<option value="${c.id}"${p.category === c.id ? ' selected' : ''}>${esc(c.name)}</option>`).join('')}
                  </select></span></p>
              </div>
              ${fld('blurb', 'Short line (shown on the card)', p.blurb, 'text')}
              <p class="fld"><label class="fld-label" for="description">Description</label>
                <textarea class="fld-input" id="description" rows="3">${esc(p.description)}</textarea></p>
              <div class="grid2">
                ${fld('image', 'Image path', p.image, 'text')}
                ${fld('leadTime', 'Lead time (working days)', p.leadTime, 'number')}
              </div>
              <div class="img-preview"><img id="img-preview" src="${esc(p.image)}" alt=""
                width="800" height="800"/><span>Preview</span></div>
            </section>

            <section class="panel">
              <div class="panel-head">
                <h2 class="panel-title">Specifications</h2>
                <button class="mini" type="button" id="add-spec">${I.plus} Add row</button>
              </div>
              <div class="rows" id="specs">
                ${(p.specs || []).map((s, i) => specRow(s[0], s[1], i)).join('')}
              </div>
              <p class="panel-note">Shown as the spec table on the product page.</p>
            </section>

            <section class="panel">
              <div class="panel-head">
                <h2 class="panel-title">Options</h2>
                <button class="mini" type="button" id="add-opt">${I.plus} Add option</button>
              </div>
              <div class="rows" id="options">
                ${(p.options || []).map((o, i) => optionBlock(o, i)).join('')}
              </div>
              <p class="panel-note">Each choice can add to or subtract from the unit price.</p>
            </section>
          </div>

          <aside class="stack">
            <section class="panel">
              <h2 class="panel-title">Availability</h2>
              <p class="fld"><label class="fld-label" for="availability">Status</label>
                <span class="sel"><select class="fld-input" id="availability">
                  ${avail.map(a => `<option value="${a.id}"${p.availability === a.id ? ' selected' : ''}>${esc(a.label)}</option>`).join('')}
                </select></span></p>
              ${fld('stockQty', 'Stock on hand (blank = not tracked)', p.stockQty == null ? '' : p.stockQty, 'number')}
              <p class="panel-note">Out of stock and draft products are hidden from the shop.</p>
            </section>

            <section class="panel">
              <h2 class="panel-title">Pricing</h2>
              <p class="fld"><label class="fld-label" for="ptype">Model</label>
                <span class="sel"><select class="fld-input" id="ptype">
                  <option value="tiers"${p.pricing.type === 'tiers' ? ' selected' : ''}>Quantity tiers (print runs)</option>
                  <option value="unit"${p.pricing.type === 'unit' ? ' selected' : ''}>Per unit with breaks</option>
                </select></span></p>

              <div id="pricing-tiers"${p.pricing.type !== 'tiers' ? ' hidden' : ''}>
                <div class="panel-head"><span class="mini-label">Tiers</span>
                  <button class="mini" type="button" id="add-tier">${I.plus} Add</button></div>
                <div class="rows" id="tiers">
                  ${(p.pricing.tiers || []).map((t, i) => tierRow(t.qty, t.price, i)).join('')}
                </div>
              </div>

              <div id="pricing-unit"${p.pricing.type !== 'unit' ? ' hidden' : ''}>
                <div class="grid2">
                  ${fld('u-price', 'Unit price', p.pricing.price || 0, 'number')}
                  ${fld('u-min', 'Minimum qty', p.pricing.min || 1, 'number')}
                </div>
                ${fld('u-step', 'Order in steps of', p.pricing.step || 1, 'number')}
                <div class="panel-head"><span class="mini-label">Quantity breaks</span>
                  <button class="mini" type="button" id="add-break">${I.plus} Add</button></div>
                <div class="rows" id="breaks">
                  ${(p.pricing.breaks || []).map((b, i) => breakRow(b.from, b.price, i)).join('')}
                </div>
              </div>
            </section>

            <section class="panel">
              <button class="btn btn-block" type="submit">${isNew ? 'Create product' : 'Save changes'}</button>
              <a class="btn btn-ghost btn-block" href="#/products">Cancel</a>
              ${!isNew ? `<p class="panel-note">Last updated ${p.updatedAt ? date(p.updatedAt, true) : 'unknown'}</p>` : ''}
            </section>
          </aside>
        </div>
      </form>`;

    wireEditor(p, isNew);
  }

  const specRow = (k, v, i) => `<div class="row" data-row>
    <input class="fld-input" placeholder="Label" value="${esc(k)}" data-spec-k aria-label="Spec label ${i + 1}"/>
    <input class="fld-input" placeholder="Value" value="${esc(v)}" data-spec-v aria-label="Spec value ${i + 1}"/>
    <button class="row-x" type="button" data-x aria-label="Remove row">${I.trash}</button></div>`;

  const tierRow = (q, pr, i) => `<div class="row" data-row>
    <input class="fld-input" type="number" placeholder="Qty" value="${q}" data-tier-q aria-label="Tier quantity ${i + 1}"/>
    <input class="fld-input" type="number" placeholder="Price" value="${pr}" data-tier-p aria-label="Tier price ${i + 1}"/>
    <button class="row-x" type="button" data-x aria-label="Remove tier">${I.trash}</button></div>`;

  const breakRow = (f, pr, i) => `<div class="row" data-row>
    <input class="fld-input" type="number" placeholder="From qty" value="${f}" data-break-f aria-label="Break from ${i + 1}"/>
    <input class="fld-input" type="number" placeholder="Unit price" value="${pr}" data-break-p aria-label="Break price ${i + 1}"/>
    <button class="row-x" type="button" data-x aria-label="Remove break">${I.trash}</button></div>`;

  const optionBlock = (o, i) => `<div class="optblock" data-optblock>
    <div class="row">
      <input class="fld-input" placeholder="Option id (e.g. stock)" value="${esc(o.id || '')}" data-opt-id aria-label="Option id"/>
      <input class="fld-input" placeholder="Label (e.g. Card stock)" value="${esc(o.label || '')}" data-opt-label aria-label="Option label"/>
      <button class="row-x" type="button" data-x aria-label="Remove option">${I.trash}</button>
    </div>
    <div class="choices" data-choices>
      ${(o.choices || []).map(c => choiceRow(c)).join('')}
    </div>
    <button class="mini" type="button" data-add-choice>${I.plus} Add choice</button>
  </div>`;

  const choiceRow = (c) => `<div class="row row-choice" data-row>
    <input class="fld-input" placeholder="id" value="${esc((c && c.id) || '')}" data-ch-id aria-label="Choice id"/>
    <input class="fld-input" placeholder="Label" value="${esc((c && c.label) || '')}" data-ch-label aria-label="Choice label"/>
    <input class="fld-input" type="number" placeholder="+/- price" value="${(c && c.delta) || 0}" data-ch-delta aria-label="Choice price delta"/>
    <button class="row-x" type="button" data-x aria-label="Remove choice">${I.trash}</button></div>`;

  function fld(id, label, value, type, required) {
    return `<p class="fld"><label class="fld-label" for="${id}">${esc(label)}</label>
      <input class="fld-input" id="${id}" type="${type || 'text'}" value="${esc(value)}"
             ${required ? 'required' : ''}/>
      <span class="fld-err" id="${id}-err" aria-live="polite"></span></p>`;
  }

  function wireEditor(p, isNew) {
    const form = document.getElementById('editor');
    const val = id => (document.getElementById(id) || {}).value || '';

    // live image preview
    document.getElementById('image').addEventListener('input', e => {
      document.getElementById('img-preview').src = e.target.value;
    });

    // pricing model switch
    document.getElementById('ptype').addEventListener('change', e => {
      document.getElementById('pricing-tiers').hidden = e.target.value !== 'tiers';
      document.getElementById('pricing-unit').hidden = e.target.value !== 'unit';
    });

    // repeatable rows
    const addTo = (containerId, html) =>
      document.getElementById(containerId).insertAdjacentHTML('beforeend', html);
    document.getElementById('add-spec').addEventListener('click', () => addTo('specs', specRow('', '', 0)));
    document.getElementById('add-tier').addEventListener('click', () => addTo('tiers', tierRow('', '', 0)));
    document.getElementById('add-break').addEventListener('click', () => addTo('breaks', breakRow('', '', 0)));
    document.getElementById('add-opt').addEventListener('click', () =>
      addTo('options', optionBlock({ id: '', label: '', choices: [{ id: '', label: '', delta: 0 }] }, 0)));

    form.addEventListener('click', e => {
      const x = e.target.closest('[data-x]');
      if (x) { x.closest('[data-row]') ? x.closest('[data-row]').remove()
                                       : x.closest('[data-optblock]').remove(); return; }
      const addCh = e.target.closest('[data-add-choice]');
      if (addCh) {
        addCh.closest('[data-optblock]').querySelector('[data-choices]')
          .insertAdjacentHTML('beforeend', choiceRow({}));
      }
    });

    form.addEventListener('submit', e => {
      e.preventDefault();
      const name = val('name').trim();
      const errEl = document.getElementById('name-err');
      if (!name) { errEl.textContent = 'A product name is required.'; toast('Give the product a name.', 'bad'); return; }
      errEl.textContent = '';

      const specs = [...document.querySelectorAll('#specs [data-row]')].map(r => [
        r.querySelector('[data-spec-k]').value.trim(),
        r.querySelector('[data-spec-v]').value.trim(),
      ]).filter(s => s[0] || s[1]);

      const options = [...document.querySelectorAll('[data-optblock]')].map(b => ({
        id: b.querySelector('[data-opt-id]').value.trim() || S.slugify(b.querySelector('[data-opt-label]').value),
        label: b.querySelector('[data-opt-label]').value.trim(),
        choices: [...b.querySelectorAll('[data-choices] [data-row]')].map(r => ({
          id: r.querySelector('[data-ch-id]').value.trim() || S.slugify(r.querySelector('[data-ch-label]').value),
          label: r.querySelector('[data-ch-label]').value.trim(),
          delta: Number(r.querySelector('[data-ch-delta]').value) || 0,
        })).filter(c => c.label),
      })).filter(o => o.label && o.choices.length);

      const ptype = val('ptype');
      let priceModel;
      if (ptype === 'tiers') {
        const tiers = [...document.querySelectorAll('#tiers [data-row]')].map(r => ({
          qty: Number(r.querySelector('[data-tier-q]').value),
          price: Number(r.querySelector('[data-tier-p]').value),
        })).filter(t => t.qty > 0).sort((a, b) => a.qty - b.qty);
        if (!tiers.length) { toast('Add at least one quantity tier.', 'bad'); return; }
        priceModel = { type: 'tiers', unit: 'pack', tiers };
      } else {
        const breaks = [...document.querySelectorAll('#breaks [data-row]')].map(r => ({
          from: Number(r.querySelector('[data-break-f]').value),
          price: Number(r.querySelector('[data-break-p]').value),
        })).filter(b => b.from > 0).sort((a, b) => a.from - b.from);
        priceModel = {
          type: 'unit',
          price: Number(val('u-price')) || 0,
          min: Number(val('u-min')) || 1,
          step: Number(val('u-step')) || 1,
          breaks,
        };
      }

      try {
        const saved = S.admin.saveProduct({
          id: isNew ? '' : p.id,
          name, category: val('category'),
          blurb: val('blurb').trim(), description: val('description').trim(),
          image: val('image').trim(), leadTime: Number(val('leadTime')) || 1,
          availability: val('availability'),
          stockQty: val('stockQty') === '' ? null : Number(val('stockQty')),
          specs, options, pricing: priceModel,
        });
        toast(isNew ? 'Product created.' : 'Changes saved.', 'ok');
        location.hash = '#/products';
      } catch (err) { toast(err.message, 'bad'); }
    });
  }

  /* =====================================================================
     CUSTOMERS / ACTIVITY
     ===================================================================== */
  function viewCustomers() {
    const rows = S.admin.customers();
    main.innerHTML = rows.length ? table(
      ['Customer', 'Company', 'Orders', 'Spend', 'Last order'],
      rows.map(c => ({ cells: [
        `<strong>${esc(c.name)}</strong><em class="sub">${esc(c.email)}</em>`,
        esc(c.company || '—'), c.orders, `<strong>${money(c.spend)}</strong>`, date(c.last),
      ] }))) : empty('No customers yet. They appear here once an order is placed.');
  }

  function viewActivity() {
    const log = S.admin.activity();
    main.innerHTML = `<section class="panel">
      <h2 class="panel-title">Activity log</h2>
      <p class="panel-note">Every change made from this dashboard. Local to this browser
         in the preview build; on the live system this belongs in the database.</p>
      ${log.length ? `<ul class="log">${log.map(e => `<li>
        <span class="log-a">${esc(e.action)}</span>
        <span class="log-m">${esc(e.by)} &middot; ${date(e.at, true)}</span></li>`).join('')}</ul>`
        : empty('Nothing logged yet.')}
    </section>`;
  }

  /* =====================================================================
     shared bits
     ===================================================================== */
  function table(head, rows) {
    return `<div class="tablewrap"><table class="tbl">
      <thead><tr>${head.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead>
      <tbody>${rows.map(r => `<tr${r.href ? ` class="is-link" data-href="${r.href}"` : ''}>${
        r.cells.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>
    </table></div>`;
  }
  const empty = msg => `<div class="empty"><p>${esc(msg)}</p></div>`;
  const stagePill = id => {
    const s = S.orders.stages().find(x => x.id === id) || { label: id };
    return `<span class="pill pill-${esc(id)}">${esc(s.label)}</span>`;
  };
  const payPill = status =>
    `<span class="pill pill-pay-${esc(status)}">${esc(status[0].toUpperCase() + status.slice(1))}</span>`;
  const availPill = p => {
    const a = S.catalogue.availability().find(x => x.id === p.availability) || { label: p.availability };
    const stock = p.stockQty == null ? '' : `<em class="sub">${p.stockQty} on hand</em>`;
    return `<span class="pill pill-av-${esc(p.availability)}">${esc(a.label)}</span>${stock}`;
  };
  function notFound() {
    main.innerHTML = `<div class="empty"><p>Not found.</p>
      <a class="btn btn-sm" href="#/">Back to overview</a></div>`;
  }

  /* =====================================================================
     ROUTER
     ===================================================================== */
  const TITLES = { '': 'Overview', orders: 'Orders', order: 'Order',
                   products: 'Products', product: 'Product', customers: 'Customers',
                   activity: 'Activity' };

  function render() {
    if (!S.auth.isAdmin()) { showGate(); return; }
    const parts = (location.hash || '#/').replace(/^#\//, '').split('/');
    try {
      switch (parts[0]) {
        case '':          viewOverview(); break;
        case 'orders':    viewOrders(); break;
        case 'order':     viewOrder(parts[1]); break;
        case 'products':  viewProducts(); break;
        case 'product':   viewProductEditor(parts[1]); break;
        case 'customers': viewCustomers(); break;
        case 'activity':  viewActivity(); break;
        default:          notFound();
      }
    } catch (e) {
      // a FORBIDDEN here means the session lost its role mid-session
      if (e.code === 'FORBIDDEN') { showGate(); return; }
      throw e;
    }

    document.getElementById('topbar-title').textContent = TITLES[parts[0]] || 'Dashboard';
    document.title = (TITLES[parts[0]] || 'Dashboard') + ' - Admin - Brand Corporations';
    document.querySelectorAll('.side-link[data-nav]').forEach(a =>
      a.classList.toggle('is-active', a.dataset.nav === parts[0]));

    const st = S.admin.stats();
    document.getElementById('count-orders').textContent = st.open || '';
    document.getElementById('count-products').textContent = st.products;

    // whole-row links in tables
    main.querySelectorAll('tr.is-link').forEach(tr => {
      tr.addEventListener('click', e => {
        if (e.target.closest('a, button')) return;
        location.hash = tr.dataset.href;
      });
    });
    main.scrollTop = 0;
  }

  window.addEventListener('hashchange', render);
  window.addEventListener('orders:change', () => { if (S.auth.isAdmin()) render(); });
  window.addEventListener('products:change', () => {});

  const toggle = document.getElementById('side-toggle');
  toggle.addEventListener('click', () => {
    const open = document.getElementById('side').classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  main.addEventListener('click', () => document.getElementById('side').classList.remove('is-open'));

  /* boot */
  if (S.auth.isAdmin()) showShell(); else showGate();
})();
