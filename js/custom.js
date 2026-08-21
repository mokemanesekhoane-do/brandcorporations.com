// Brand Corporations -- minimal vanilla-JS behaviour to replace the parts of
// Webflow's runtime (IX2 interactions, tabs, slider) that aren't included in
// this static export. Everything here targets the same classes the Stuxen
// design system already ships, so no visual/CSS changes were needed.

document.addEventListener('DOMContentLoaded', function () {

  // ---- opaque navbar once the page is scrolled (it's transparent over the hero by design) ----
  var navbarEl = document.querySelector('.navbar');
  if (navbarEl) {
    var updateNavBg = function () {
      navbarEl.classList.toggle('nav-scrolled', window.scrollY > 40);
    };
    updateNavBg();
    window.addEventListener('scroll', updateNavBg, { passive: true });
  }

  // ---- mobile nav toggle ----
  var navButton = document.querySelector('.menu-button');
  var navMenu = document.querySelector('.nav-menu');
  if (navButton && navMenu) {
    navButton.addEventListener('click', function () {
      navMenu.classList.toggle('nav-open');
      var expanded = navMenu.classList.contains('nav-open');
      navButton.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    });
    // close menu when a link is tapped (mobile)
    navMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navMenu.classList.remove('nav-open');
      });
    });
  }


  // ---- hamburger open/close state (drives the CSS bars-to-X) ----
  if (navButton) {
    var syncBurger = function () {
      navButton.classList.toggle('is-open', navMenu && navMenu.classList.contains('nav-open'));
    };
    navButton.addEventListener('click', syncBurger);
    if (navMenu) navMenu.querySelectorAll('a').forEach(function (l) {
      l.addEventListener('click', syncBurger);
    });
    // close the panel on Escape or on an outside tap
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && navMenu && navMenu.classList.contains('nav-open')) {
        navMenu.classList.remove('nav-open'); syncBurger();
      }
    });
    document.addEventListener('click', function (e) {
      if (!navMenu || !navMenu.classList.contains('nav-open')) return;
      if (navMenu.contains(e.target) || navButton.contains(e.target)) return;
      navMenu.classList.remove('nav-open'); syncBurger();
    });
  }

  // ---- scroll spy: mark the nav link for the section in view ----
  var spyLinks = Array.prototype.slice.call(
    document.querySelectorAll('.nav-menu-link[href^="#"]')
  );
  var homeLink = document.querySelector('.nav-menu-link[href="index.html"]');
  if (spyLinks.length && 'IntersectionObserver' in window) {
    var setCurrent = function (link) {
      spyLinks.concat(homeLink ? [homeLink] : []).forEach(function (l) {
        if (l) l.classList.remove('w--current');
      });
      if (link) link.classList.add('w--current');
    };
    var visible = {};
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { visible[en.target.id] = en.isIntersecting ? en.intersectionRatio : 0; });
      if (window.scrollY < 120) { setCurrent(homeLink); return; }
      var bestId = null, best = 0;
      Object.keys(visible).forEach(function (id) { if (visible[id] > best) { best = visible[id]; bestId = id; } });
      setCurrent(bestId ? document.querySelector('.nav-menu-link[href="#' + bestId + '"]') : homeLink);
    }, { rootMargin: '-96px 0px -45% 0px', threshold: [0, .15, .35, .6, 1] });
    spyLinks.forEach(function (l) {
      var sec = document.querySelector(l.getAttribute('href'));
      if (sec) spy.observe(sec);
    });
  }

  // ---- smooth scrolling for in-page anchors ----
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (!id || id === '#' || a.hasAttribute('data-gallery')) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'start'
      });
    });
  });

  // ---- generic Webflow-style tabs (.w-tabs) ----
  // works for both the FAQ accordion and the testimonials tab switcher
  document.querySelectorAll('.w-tabs').forEach(function (tabs) {
    var links = tabs.querySelectorAll('.w-tab-link');
    var panes = tabs.querySelectorAll('.w-tab-pane');
    links.forEach(function (link, i) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        links.forEach(function (l) { l.classList.remove('w--current'); });
        panes.forEach(function (p) { p.classList.remove('w--tab-active'); });
        link.classList.add('w--current');
        if (panes[i]) panes[i].classList.add('w--tab-active');
      });
    });
  });

  // ---- portfolio lightbox --------------------------------------------
  // Card buttons carry data-gallery (the category slug) and
  // data-gallery-count. Derivatives are named by convention at build time
  // (assets/projects/<slug>/<slug>-<NN>-<width>.webp), so the gallery is
  // reconstructed from those two attributes -- no data blob to keep in sync.
  //
  // The chrome floats over the artwork rather than stacking above and below
  // it, so the image itself gets nearly the whole viewport.
  var galleryTriggers = document.querySelectorAll('[data-gallery]');
  if (galleryTriggers.length) {
    var srcFor = function (slug, i, w) {
      var n = String(i + 1).padStart(2, '0');
      return 'assets/projects/' + slug + '/' + slug + '-' + n + '-' + w + '.webp';
    };

    var box = document.createElement('div');
    box.className = 'pf-lightbox';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', 'Project gallery');
    box.innerHTML =
      '<div class="pf-stage">' +
        '<button class="pf-nav pf-prev" type="button" aria-label="Previous project">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>' +
        '</button>' +
        '<figure class="pf-figure">' +
          '<img class="pf-image" alt=""/>' +
          '<span class="pf-spinner" aria-hidden="true"></span>' +
        '</figure>' +
        '<button class="pf-nav pf-next" type="button" aria-label="Next project">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>' +
        '</button>' +
      '</div>' +
      '<button class="pf-close" type="button" aria-label="Close gallery">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
      '</button>' +
      '<div class="pf-hud">' +
        '<div class="pf-hud-label"><span class="pf-hud-dot"></span><span class="pf-title"></span></div>' +
        '<div class="pf-thumbs" role="tablist" aria-label="Gallery thumbnails"></div>' +
        '<div class="pf-counter"><span class="pf-index">01</span><span class="pf-sep">/</span><span class="pf-total">01</span></div>' +
      '</div>';
    document.body.appendChild(box);

    var elTitle  = box.querySelector('.pf-title');
    var elIndex  = box.querySelector('.pf-index');
    var elTotal  = box.querySelector('.pf-total');
    var elImage  = box.querySelector('.pf-image');
    var elFigure = box.querySelector('.pf-figure');
    var elThumbs = box.querySelector('.pf-thumbs');
    var elPrev   = box.querySelector('.pf-prev');
    var elNext   = box.querySelector('.pf-next');
    var elClose  = box.querySelector('.pf-close');

    var slug = '', label = '', total = 0, index = 0, lastFocus = null;

    var pad = function (n) { return String(n).padStart(2, '0'); };

    var show = function (i, dir) {
      index = (i + total) % total;
      elImage.classList.remove('is-loaded', 'from-left', 'from-right');
      if (dir > 0) elImage.classList.add('from-right');
      else if (dir < 0) elImage.classList.add('from-left');
      elFigure.classList.add('is-loading');

      elImage.src = srcFor(slug, index, 1254);
      elImage.alt = label + ' — project ' + (index + 1) + ' of ' + total;
      elIndex.textContent = pad(index + 1);
      elTotal.textContent = pad(total);

      elThumbs.querySelectorAll('.pf-thumb').forEach(function (t, ti) {
        var on = ti === index;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        if (on) t.scrollIntoView({ block: 'nearest', inline: 'center' });
      });
      // warm the neighbours so paging feels instant
      [index + 1, index - 1].forEach(function (k) {
        var img = new Image(); img.src = srcFor(slug, (k + total) % total, 1254);
      });
    };

    elImage.addEventListener('load', function () {
      elFigure.classList.remove('is-loading');
      elImage.classList.remove('from-left', 'from-right');
      elImage.classList.add('is-loaded');
    });

    var open = function (trigger) {
      slug  = trigger.getAttribute('data-gallery');
      label = trigger.getAttribute('data-gallery-title') || '';
      total = parseInt(trigger.getAttribute('data-gallery-count'), 10) || 0;
      if (!slug || !total) return;
      lastFocus = trigger;

      elTitle.textContent = label;
      var single = total < 2;
      elPrev.hidden = single;
      elNext.hidden = single;

      elThumbs.innerHTML = '';
      elThumbs.hidden = single;
      for (var i = 0; i < total; i++) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'pf-thumb';
        b.setAttribute('role', 'tab');
        b.setAttribute('aria-label', label + ' project ' + (i + 1));
        b.innerHTML = '<img src="' + srcFor(slug, i, 480) + '" alt="" loading="lazy"/>';
        (function (n) { b.addEventListener('click', function () { show(n, n > index ? 1 : -1); }); })(i);
        elThumbs.appendChild(b);
      }

      box.classList.add('is-open');
      document.body.classList.add('pf-lock');
      void box.offsetWidth;              // force reflow so the transition runs
      box.classList.add('is-visible');
      show(0, 0);
      elClose.focus();
    };

    var close = function () {
      box.classList.remove('is-visible');
      document.body.classList.remove('pf-lock');
      window.setTimeout(function () {
        box.classList.remove('is-open');
        elImage.removeAttribute('src');
      }, 300);
      if (lastFocus) lastFocus.focus();
    };

    galleryTriggers.forEach(function (t) {
      t.addEventListener('click', function (e) { e.preventDefault(); open(t); });
    });
    elPrev.addEventListener('click', function () { show(index - 1, -1); });
    elNext.addEventListener('click', function () { show(index + 1, 1); });
    elClose.addEventListener('click', close);
    // tapping the artwork advances; tapping the surround closes
    elImage.addEventListener('click', function () { if (total > 1) show(index + 1, 1); });
    box.addEventListener('click', function (e) {
      if (e.target === box || e.target.classList.contains('pf-stage') ||
          e.target.classList.contains('pf-figure')) close();
    });
    document.addEventListener('keydown', function (e) {
      if (!box.classList.contains('is-open')) return;
      if (e.key === 'Escape') { close(); }
      else if (e.key === 'ArrowRight') { show(index + 1, 1); }
      else if (e.key === 'ArrowLeft')  { show(index - 1, -1); }
      else if (e.key === 'Tab') {
        var f = box.querySelectorAll('button:not([hidden])');
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  // ---- scroll progress hairline in the navbar ----
  var navWrap = document.querySelector('.nav-content-wrap');
  if (navWrap && !navWrap.querySelector('.nav-progress')) {
    var prog = document.createElement('div');
    prog.className = 'nav-progress';
    prog.innerHTML = '<span class="nav-progress-bar"></span>';
    navWrap.appendChild(prog);
    var progBar = prog.firstChild;
    var updateProgress = function () {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var pct = max > 0 ? (window.scrollY / max) * 100 : 0;
      progBar.style.width = Math.max(0, Math.min(100, pct)) + '%';
    };
    updateProgress();
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);
  }

  // ---- reveal-on-scroll ----
  var reveals = document.querySelectorAll('[data-reveal]');
  if (reveals.length) {
    if ('IntersectionObserver' in window) {
      var ro = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('is-revealed'); ro.unobserve(en.target); }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: .06 });
      reveals.forEach(function (el) { ro.observe(el); });
      // safety net: never leave content invisible if the observer never fires
      window.setTimeout(function () {
        reveals.forEach(function (el) { el.classList.add('is-revealed'); });
      }, 1600);
    } else {
      reveals.forEach(function (el) { el.classList.add('is-revealed'); });
    }
  }

  // ---- footer year ----
  var yr = document.getElementById('ft-year');
  if (yr) yr.textContent = new Date().getFullYear();

  // ---- Get in touch form ----
  var form = document.getElementById('get-in-touch');
  if (form) {
    var statusEl = document.getElementById('gt-status');
    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    var setError = function (input, msg) {
      var wrap = input.closest('.gt-field');
      var out = document.getElementById(input.id + '-error');
      if (wrap) wrap.classList.toggle('has-error', !!msg);
      if (out) out.textContent = msg || '';
      input.setAttribute('aria-invalid', msg ? 'true' : 'false');
      return !msg;
    };

    var validate = function (input) {
      var v = (input.value || '').trim();
      // resolve via the for/id association: a wrapped control (the select)
      // is not its label's next sibling
      var labelEl = form.querySelector('label[for="' + input.id + '"]');
      var label = (labelEl ? labelEl.textContent : input.name)
                    .replace('*', '').replace('optional', '').trim();
      if (input.hasAttribute('required') && !v) return setError(input, label + ' is required.');
      if (input.type === 'email' && v && !EMAIL_RE.test(v)) return setError(input, 'Enter a valid email address.');
      if (input.type === 'tel' && v && v.replace(/[^\d]/g, '').length < 7) return setError(input, 'Enter a valid phone number.');
      if (input.id === 'message' && v && v.length < 10) return setError(input, 'Please add a little more detail.');
      return setError(input, '');
    };

    var fields = Array.prototype.slice.call(form.querySelectorAll('.gt-input'));
    fields.forEach(function (f) {
      f.addEventListener('blur', function () { validate(f); });
      f.addEventListener('input', function () {
        if (f.closest('.gt-field').classList.contains('has-error')) validate(f);
      });
      f.addEventListener('change', function () { if (f.tagName === 'SELECT') validate(f); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      statusEl.textContent = '';
      statusEl.className = 'gt-status';

      var ok = true, firstBad = null;
      fields.forEach(function (f) {
        if (!validate(f)) { ok = false; if (!firstBad) firstBad = f; }
      });
      if (!ok) {
        statusEl.textContent = 'Please fix the highlighted fields and try again.';
        statusEl.className = 'gt-status is-bad';
        if (firstBad) firstBad.focus();
        return;
      }

      var data = {};
      fields.forEach(function (f) { data[f.name] = (f.value || '').trim(); });

      var endpoint = form.getAttribute('data-endpoint');
      var btn = form.querySelector('.gt-submit');

      // No endpoint wired yet: hand the enquiry to the visitor's mail client so
      // the form still does something real on a purely static host. Swap in a
      // form service (Formspree/Netlify/Basin) via data-endpoint to POST instead.
      if (!endpoint) {
        var body =
          'Name: ' + data.name + '\n' +
          'Company: ' + (data.company || '-') + '\n' +
          'Email: ' + data.email + '\n' +
          'Phone: ' + (data.phone || '-') + '\n' +
          'Service: ' + data.service + '\n\n' +
          data.message;
        window.location.href = 'mailto:info@brandcorporations.com'
          + '?subject=' + encodeURIComponent(data.subject)
          + '&body=' + encodeURIComponent(body);
        statusEl.textContent = 'Opening your email app with the message ready to send.';
        statusEl.className = 'gt-status is-ok';
        return;
      }

      btn.disabled = true;
      btn.querySelector('.gt-submit-label').textContent = 'Sending...';
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      }).then(function (res) {
        if (!res.ok) throw new Error('bad status ' + res.status);
        form.reset();
        fields.forEach(function (f) { setError(f, ''); });
        statusEl.textContent = 'Thanks — your message is on its way. We’ll reply within one working day.';
        statusEl.className = 'gt-status is-ok';
      }).catch(function () {
        statusEl.textContent = 'Something went wrong sending that. Please email info@brandcorporations.com directly.';
        statusEl.className = 'gt-status is-bad';
      }).then(function () {
        btn.disabled = false;
        btn.querySelector('.gt-submit-label').textContent = 'Send message';
      });
    });
  }


  // ---- article reader ---------------------------------------------------
  // Card buttons carry data-article pointing at a <template> holding the full
  // text. The template is cloned into the overlay on open, so the article
  // bodies cost nothing until someone actually asks for one.
  var artButtons = document.querySelectorAll('[data-article]');
  if (artButtons.length) {
    var rd = document.createElement('div');
    rd.className = 'rd-overlay';
    rd.setAttribute('role', 'dialog');
    rd.setAttribute('aria-modal', 'true');
    rd.setAttribute('aria-labelledby', 'rd-title');
    rd.innerHTML =
      '<article class="rd-panel">' +
        '<header class="rd-head">' +
          '<span class="rd-eyebrow"></span>' +
          '<button class="rd-close" type="button" aria-label="Close article">&#10005;</button>' +
        '</header>' +
        '<div class="rd-body">' +
          '<h2 class="rd-title" id="rd-title"></h2>' +
          '<div class="rd-meta">' +
            '<span class="rd-avatar" aria-hidden="true"></span>' +
            '<span class="rd-meta-text"><span class="rd-meta-name"></span><span class="rd-meta-sub"></span></span>' +
          '</div>' +
          '<div class="rd-content"></div>' +
        '</div>' +
      '</article>';
    document.body.appendChild(rd);

    var rdEyebrow = rd.querySelector('.rd-eyebrow');
    var rdTitle   = rd.querySelector('.rd-title');
    var rdAvatar  = rd.querySelector('.rd-avatar');
    var rdName    = rd.querySelector('.rd-meta-name');
    var rdSub     = rd.querySelector('.rd-meta-sub');
    var rdContent = rd.querySelector('.rd-content');
    var rdClose   = rd.querySelector('.rd-close');
    var rdPanel   = rd.querySelector('.rd-panel');
    var rdLast    = null;

    var initials = function (n) {
      return n.split(/\s+/).map(function (w) { return w.charAt(0); }).join('').slice(0, 2).toUpperCase();
    };

    var openArticle = function (btn) {
      var tpl = document.getElementById(btn.getAttribute('data-article'));
      if (!tpl) return;
      rdLast = btn;

      var name = tpl.getAttribute('data-name') || '';
      var role = tpl.getAttribute('data-role') || '';
      var read = tpl.getAttribute('data-read') || '';

      rdEyebrow.textContent = tpl.getAttribute('data-topic') || 'Article';
      rdTitle.textContent = tpl.getAttribute('data-title') || '';
      rdAvatar.textContent = initials(name);
      rdName.textContent = name;
      rdSub.textContent = [role, read].filter(Boolean).join('  ·  ');

      rdContent.innerHTML = '';
      rdContent.appendChild(tpl.content.cloneNode(true));

      rd.classList.add('is-open');
      document.body.classList.add('rd-lock');
      void rd.offsetWidth;               // force reflow so the transition runs
      rd.classList.add('is-visible');
      rd.scrollTop = 0;
      rdClose.focus();
    };

    var closeArticle = function () {
      rd.classList.remove('is-visible');
      document.body.classList.remove('rd-lock');
      window.setTimeout(function () {
        rd.classList.remove('is-open');
        rdContent.innerHTML = '';
      }, 280);
      if (rdLast) rdLast.focus();
    };

    artButtons.forEach(function (b) {
      b.addEventListener('click', function () { openArticle(b); });
    });
    rdClose.addEventListener('click', closeArticle);
    rd.addEventListener('click', function (e) { if (!rdPanel.contains(e.target)) closeArticle(); });
    document.addEventListener('keydown', function (e) {
      if (!rd.classList.contains('is-open')) return;
      if (e.key === 'Escape') { closeArticle(); return; }
      if (e.key === 'Tab') {
        var f = rd.querySelectorAll('button, a[href]');
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

});
