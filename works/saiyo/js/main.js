(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // reduced motion: stop the SMIL dot on the hero arc (CSS hides it too; this stops the timer)
  if (reduce) document.querySelectorAll('animateMotion').forEach(a => a.remove());

  // header: menu
  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.getElementById('global-nav');
  const setMenu = (open) => {
    if (open) {
      const hb = header.getBoundingClientRect().bottom;
      nav.style.setProperty('--nav-top', Math.round(hb) + 'px');
    }
    toggle.setAttribute('aria-expanded', String(open));
    toggle.querySelector('.sr-only').textContent = open ? 'メニューを閉じる' : 'メニューを開く';
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
  };
  if (toggle && nav) {
    toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); toggle.focus(); } });
    window.matchMedia('(min-width: 1181px)').addEventListener('change', e => { if (e.matches) setMenu(false); });
  }

  // header: shadow after scroll
  if (header) {
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // nav: current section
  const navLinks = [...document.querySelectorAll('.global-nav a[href^="#"]:not(.btn)')];
  const sections = navLinks.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  if (sections.length && 'IntersectionObserver' in window) {
    const visible = new Map();
    const setCurrent = () => {
      let best = null, bestTop = Infinity;
      visible.forEach((top, id) => { if (top < bestTop) { bestTop = top; best = id; } });
      navLinks.forEach(a => {
        const on = best && a.getAttribute('href') === '#' + best;
        a.classList.toggle('is-current', !!on);
        if (on) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
      });
    };
    const sio = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) visible.set(en.target.id, Math.abs(en.boundingClientRect.top));
        else visible.delete(en.target.id);
      });
      setCurrent();
    }, { rootMargin: '-40% 0px -50% 0px', threshold: 0 });
    sections.forEach(s => sio.observe(s));
  }

  // CTA links that preselect "casual interview"
  document.querySelectorAll('[data-entry-type="casual"]').forEach(a => {
    a.addEventListener('click', () => {
      const r = document.querySelector('input[name="kind"][value="casual"]');
      if (r) r.checked = true;
    });
  });

  // reveal on scroll (numbers roll in from .is-in on their card)
  const items = document.querySelectorAll('.reveal');
  if (reduce || !('IntersectionObserver' in window)) {
    items.forEach(el => el.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach(el => io.observe(el));
  }

  // mobile CTA: show after hero, hide at entry
  const mcta = document.querySelector('.mobile-cta');
  const hero = document.querySelector('.hero');
  const entry = document.getElementById('entry');
  if (mcta && hero && 'IntersectionObserver' in window) {
    let pastHero = false, atEntry = false;
    const update = () => mcta.classList.toggle('is-visible', pastHero && !atEntry);
    new IntersectionObserver(([en]) => { pastHero = !en.isIntersecting; update(); }).observe(hero);
    if (entry) new IntersectionObserver(([en]) => { atEntry = en.isIntersecting; update(); }, { threshold: 0.15 }).observe(entry);
  }

  // demo form: never submits
  const form = document.getElementById('entry-form');
  const btn = document.getElementById('form-submit');
  const result = document.getElementById('form-result');
  if (form) form.addEventListener('submit', e => e.preventDefault());
  if (btn && result) {
    btn.addEventListener('click', () => {
      result.textContent = 'デモサイトのため送信されません。実際のエントリーは受け付けていません。';
      result.classList.add('is-shown');
    });
  }
})();
