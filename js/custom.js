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

  // ---- blog carousel arrows (native horizontal scroll) ----
  var blogSlider = document.querySelector('.blog-v1-slider');
  if (blogSlider) {
    var mask = blogSlider.querySelector('.blog-v1-mask');
    var left = blogSlider.querySelector('.w-slider-arrow-left');
    var right = blogSlider.querySelector('.w-slider-arrow-right');
    var scrollByCard = function (dir) {
      if (!mask) return;
      var card = mask.querySelector('.blog-v1-slide');
      var amount = card ? card.getBoundingClientRect().width + 24 : 300;
      mask.scrollBy({ left: dir * amount, behavior: 'smooth' });
    };
    if (left) left.addEventListener('click', function () { scrollByCard(-1); });
    if (right) right.addEventListener('click', function () { scrollByCard(1); });
  }

});
