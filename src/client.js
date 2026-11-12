(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Mobile menu
  const burger = $('.burger'), nav = $('.nav');
  if (burger && nav) {
    burger.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', open);
    });
    $$('a', nav).forEach(a => a.addEventListener('click', () => { nav.classList.remove('open'); burger.setAttribute('aria-expanded', false); }));
  }
  // Close language menu on outside click
  document.addEventListener('click', e => { $$('details.lang[open]').forEach(d => { if (!d.contains(e.target)) d.open = false; }); });

  // Hero slideshow (images after the first load lazily)
  const slides = $$('.slides img');
  if (slides.length > 1 && !reduce) {
    let i = 0;
    const load = img => { if (img.dataset.src) { img.src = img.dataset.src; if (img.dataset.srcset) img.srcset = img.dataset.srcset; delete img.dataset.src; } };
    setTimeout(() => slides.forEach(load), 2500);
    setInterval(() => {
      if (document.hidden) return;
      slides[i].classList.remove('on');
      i = (i + 1) % slides.length;
      load(slides[i]);
      slides[i].classList.add('on');
    }, 6000);
  }

  // Lightbox
  const lb = $('dialog.lb');
  if (lb) {
    const img = $('img', lb), cap = $('p', lb);
    $$('.gal button').forEach(b => b.addEventListener('click', () => {
      img.src = b.dataset.full; img.alt = b.dataset.cap || ''; cap.textContent = b.dataset.cap || '';
      lb.showModal();
    }));
    $('button', lb).addEventListener('click', () => lb.close());
    lb.addEventListener('click', e => { if (e.target === lb) lb.close(); });
  }

  // Video: load player only on click
  $$('.vid .play').forEach(btn => btn.addEventListener('click', () => {
    const box = btn.closest('.vid'), src = box.dataset.src, kind = box.dataset.kind;
    let el;
    if (kind === 'yt') {
      el = document.createElement('iframe');
      el.src = 'https://www.youtube-nocookie.com/embed/' + src + '?autoplay=1&rel=0';
      el.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      el.title = btn.getAttribute('aria-label') || 'Video';
    } else {
      el = document.createElement('video');
      el.src = src; el.controls = true; el.autoplay = true; el.playsInline = true;
    }
    box.innerHTML = ''; box.appendChild(el);
  }));

  // Map: load only after consent click
  const map = $('.map');
  if (map) $('button', map)?.addEventListener('click', () => {
    const f = document.createElement('iframe');
    f.src = 'https://www.google.com/maps?q=' + encodeURIComponent(map.dataset.q) + '&output=embed';
    f.loading = 'lazy'; f.title = 'Map'; f.referrerPolicy = 'no-referrer-when-downgrade';
    map.innerHTML = ''; map.classList.add('on'); map.appendChild(f);
  });

  // Form: Web3Forms if a key is set, otherwise open WhatsApp with the request
  const form = $('form.form');
  if (form) form.addEventListener('submit', async e => {
    e.preventDefault();
    const d = form.dataset, msg = $('.msg', form), btn = $('button[type=submit]', form);
    const fd = new FormData(form);
    if (fd.get('botcheck')) return;
    const text = `${fd.get('service')}\n${fd.get('name')} — ${fd.get('phone')}\n${fd.get('message') || ''}`.trim();
    msg.className = 'msg'; msg.textContent = '';
    if (d.key) {
      btn.disabled = true; const label = btn.textContent; btn.textContent = d.sending;
      try {
        fd.append('access_key', d.key); fd.append('subject', d.subject);
        const r = await fetch('https://api.web3forms.com/submit', { method: 'POST', body: fd, headers: { Accept: 'application/json' } });
        const j = await r.json();
        if (!j.success) throw 0;
        msg.className = 'msg ok'; msg.textContent = d.ok; form.reset();
      } catch { msg.className = 'msg err'; msg.textContent = d.err; }
      btn.disabled = false; btn.textContent = label;
    } else if (d.wa) {
      window.open('https://wa.me/' + d.wa + '?text=' + encodeURIComponent(text), '_blank', 'noopener');
      msg.className = 'msg ok'; msg.textContent = d.ok;
    } else {
      location.href = 'mailto:' + d.mail + '?subject=' + encodeURIComponent(d.subject) + '&body=' + encodeURIComponent(text);
    }
  });
})();
