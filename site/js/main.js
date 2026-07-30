/* Only Tattoo — интерактив: меню, появление секций, фильтры, лайтбокс */
(function () {
  'use strict';

  var $  = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* ── Год в подвале ─────────────────────────────────────── */
  var yearEl = $('#year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ── Липкая шапка ──────────────────────────────────────── */
  var header = $('#siteHeader');
  var onScroll = function () {
    header.classList.toggle('is-stuck', window.scrollY > 24);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ── Мобильное меню ───────────────────────────────────── */
  var burger = $('#burger');
  var nav = $('#nav');

  var setMenu = function (open) {
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    // фон не должен уезжать под открытой панелью меню
    document.body.classList.toggle('is-locked', open);
  };

  burger.addEventListener('click', function () {
    setMenu(burger.getAttribute('aria-expanded') !== 'true');
  });

  // закрываем меню после перехода по ссылке и по Escape
  nav.addEventListener('click', function (e) {
    if (e.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) {
      setMenu(false);
      burger.focus();
    }
  });

  // при повороте экрана или переходе к десктопной раскладке бургер
  // исчезает — меню нужно закрыть, иначе прокрутка останется заблокированной
  var desktop = window.matchMedia('(min-width: 901px)');
  var onDesktop = function () {
    if (desktop.matches && nav.classList.contains('is-open')) setMenu(false);
  };
  if (desktop.addEventListener) desktop.addEventListener('change', onDesktop);
  else desktop.addListener(onDesktop);   // Safari < 14

  /* ── Появление элементов при скролле ──────────────────── */
  var revealables = $$('.reveal');

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    revealables.forEach(function (el, i) {
      // лёгкая каскадная задержка внутри одной группы
      var siblings = el.parentElement ? $$('.reveal', el.parentElement) : [];
      var index = siblings.indexOf(el);
      el.style.transitionDelay = (index > 0 ? Math.min(index, 6) * 70 : 0) + 'ms';
      io.observe(el);
    });
  } else {
    revealables.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ── Галерея: общее состояние ─────────────────────────── */
  var chips    = $$('.chip');
  var items    = $$('.gallery__item');
  var emptyMsg = $('#galleryEmpty');
  var visible  = items.slice();   // работы, видимые с учётом фильтра

  /* ── Фильтры галереи ──────────────────────────────────── */
  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var filter = chip.dataset.filter;

      chips.forEach(function (c) {
        var active = c === chip;
        c.classList.toggle('is-active', active);
        c.setAttribute('aria-pressed', String(active));
      });

      var shown = 0;
      items.forEach(function (item) {
        var match = filter === 'all' || item.dataset.style === filter;
        item.hidden = !match;
        if (match) shown++;
      });

      if (emptyMsg) emptyMsg.hidden = shown > 0;
      visible = items.filter(function (i) { return !i.hidden; });
    });
  });

  /* ── Лайтбокс ─────────────────────────────────────────── */
  var lb        = $('#lightbox');
  var lbImg     = $('#lbImg');
  var lbCaption = $('#lbCaption');
  var lbClose   = $('#lbClose');
  var lbPrev    = $('#lbPrev');
  var lbNext    = $('#lbNext');

  var current = 0;
  var lastFocused = null;

  var render = function () {
    var btn = $('.gallery__btn', visible[current]);
    var img = $('img', btn);
    lbImg.src = btn.dataset.full;
    lbImg.alt = img ? img.alt : '';
    lbCaption.textContent = btn.dataset.caption || '';

    var many = visible.length > 1;
    lbPrev.hidden = !many;
    lbNext.hidden = !many;
  };

  var open = function (item) {
    current = visible.indexOf(item);
    if (current < 0) current = 0;
    lastFocused = document.activeElement;
    render();
    lb.hidden = false;
    document.body.classList.add('is-locked');
    lbClose.focus();
  };

  var close = function () {
    lb.hidden = true;
    lbImg.src = '';
    document.body.classList.remove('is-locked');
    if (lastFocused) lastFocused.focus();
  };

  var step = function (delta) {
    current = (current + delta + visible.length) % visible.length;
    render();
  };

  items.forEach(function (item) {
    $('.gallery__btn', item).addEventListener('click', function () { open(item); });
  });

  lbClose.addEventListener('click', close);
  lbPrev.addEventListener('click', function () { step(-1); });
  lbNext.addEventListener('click', function () { step(1); });

  // клик по затемнённому фону закрывает просмотр
  lb.addEventListener('click', function (e) {
    if (e.target === lb || e.target.classList.contains('lightbox__figure')) close();
  });

  document.addEventListener('keydown', function (e) {
    if (lb.hidden) return;

    if (e.key === 'Escape')     { close(); }
    else if (e.key === 'ArrowLeft')  { step(-1); }
    else if (e.key === 'ArrowRight') { step(1); }
    else if (e.key === 'Tab') {
      // держим фокус внутри лайтбокса
      var focusable = [lbClose, lbPrev, lbNext].filter(function (el) { return !el.hidden; });
      var first = focusable[0];
      var last  = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  // свайпы на мобильных
  var touchX = null;
  lb.addEventListener('touchstart', function (e) { touchX = e.changedTouches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', function (e) {
    if (touchX === null || visible.length < 2) return;
    var dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 45) step(dx < 0 ? 1 : -1);
    touchX = null;
  }, { passive: true });
})();
