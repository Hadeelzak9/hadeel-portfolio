// Always open the page at the very top — stops the browser from
    // restoring whatever scroll position was last used on this page.
    // (Direct scrollTop assignment is instant and ignores the smooth
    // scroll-behavior set on <html>, unlike window.scrollTo().)
    // Note: document.body doesn't exist yet at this point (we're still
    // inside <head>), so only documentElement is safe to touch here —
    // body.scrollTop is reset by the script right after <body> opens.
    if ('scrollRestoration' in history) { history.scrollRestoration = 'manual'; }
    if (!location.hash) {
      document.documentElement.scrollTop = 0;
    }

// Re-assert immediately once <body> exists too — some browsers apply
  // their own scroll restoration right as the body attaches.
  if (!location.hash) {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }

window.addEventListener('load', () => {
    if (location.hash) return; // respect an intentional deep link (e.g. "#competitions")
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  });

  const els = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold:0, rootMargin:'0px 0px -8% 0px' });   // reveal as soon as the top edge scrolls in — a % threshold can never be reached by a section taller than the screen (e.g. the photography section on a phone)
  els.forEach(el=>io.observe(el));

  // Shared "word-intro" reveal (hero wordmark + photography intro): fires once each enters view
  const wordIntros = document.querySelectorAll('.word-intro');
  const wiObserver = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); wiObserver.unobserve(e.target); } });
  }, { threshold:.2 });
  wordIntros.forEach(el=>wiObserver.observe(el));


  // Gallery tiles: 1st click reveals analysis overlay, 2nd click opens the side-by-side lightbox.
  function handleTileClick(tile){
    if(!tile.classList.contains('active')){
      tile.classList.add('active');
      return;
    }
    openLightbox(tile);
  }


  function openLightbox(tile){
    const baseSrc = tile.querySelector('img.base').getAttribute('src');
    const analysisSrc = tile.querySelector('img.analysis').getAttribute('src');
    const location = tile.getAttribute('data-location') || '';
    const caption = tile.getAttribute('data-caption') || '';

    document.getElementById('lightboxBase').src = baseSrc;
    document.getElementById('lightboxAnalysis').src = analysisSrc;
    document.getElementById('lightboxLocation').textContent = location;
    const captionEl = document.getElementById('lightboxCaption');
    captionEl.textContent = caption;
    captionEl.style.display = caption ? '' : 'none';

    document.getElementById('lightboxOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  // Skills: expand/collapse each skill's sub-category bubbles or image grid
  function toggleSkill(btn){
    btn.classList.toggle('open');
    const panel = btn.nextElementSibling;
    if(panel && (panel.classList.contains('skill-subrow') || panel.classList.contains('skill-imagegrid'))){
      panel.classList.toggle('open');
    }
  }

  // Ambient background accent: crossfades a soft, blurred wash of the active project's own image
  // (uses the image directly as a CSS background rather than reading pixels, so it works even under file:// / local previews)
  let bgAccentActiveLayer = 'A';
  function applyAccentFromImage(url){
    const nextEl = document.getElementById(bgAccentActiveLayer === 'A' ? 'bgLayerB' : 'bgLayerA');
    const prevEl = document.getElementById(bgAccentActiveLayer === 'A' ? 'bgLayerA' : 'bgLayerB');
    if(!nextEl || !prevEl) return;
    const preload = new Image();
    preload.onload = () => {
      nextEl.style.backgroundImage = `url("${url}")`;
      nextEl.classList.add('is-active');
      prevEl.classList.remove('is-active');
      bgAccentActiveLayer = bgAccentActiveLayer === 'A' ? 'B' : 'A';
    };
    preload.src = url;
  }

  // Architecture case-viewer: sidebar + frame + thumbnail rail driven entirely by data-* attributes on each thumb
  (function initCaseViewer(){
    const viewer = document.getElementById('caseViewer');
    if(!viewer) return;
    const thumbs = Array.from(viewer.querySelectorAll('.case-thumb'));
    const mainImg = document.getElementById('caseMainImg');
    const link = document.getElementById('caseLink');
    const progressBar = document.getElementById('caseProgressBar');
    document.getElementById('caseTotal').textContent = String(thumbs.length).padStart(2,'0');

    function activate(thumb, userInitiated){
      thumbs.forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
      const d = thumb.dataset;
      document.getElementById('caseNo').textContent = d.no;
      document.getElementById('caseIndex').textContent = d.no;
      document.getElementById('caseTitle').textContent = d.title;
      document.getElementById('caseYear').textContent = d.year;
      document.getElementById('caseTag').textContent = d.tag;
      document.getElementById('caseDesc').textContent = d.desc;
      document.getElementById('caseFrameName').textContent = d.title.toUpperCase();
      mainImg.src = d.img;
      mainImg.alt = d.title;
      if(d.href){ link.href = d.href; link.style.display = ''; link.textContent = d.linkLabel || 'View Project →'; }
      else { link.style.display = 'none'; }
      const idx = thumbs.indexOf(thumb);
      progressBar.style.width = (((idx + 1) / thumbs.length) * 100) + '%';
      // Only scroll the thumbnail strip itself when a person actually clicked/paged —
      // never on the initial load-time activation, since scrollIntoView can end up
      // scrolling the *whole page* to this section if it isn't in view yet.
      if (userInitiated) { thumb.scrollIntoView({ block:'nearest', behavior:'smooth' }); }
      applyAccentFromImage(d.img);
    }

    thumbs.forEach(t => t.addEventListener('click', () => activate(t, true)));

    document.getElementById('casePrev').addEventListener('click', () => {
      const i = thumbs.findIndex(t => t.classList.contains('active'));
      activate(thumbs[(i - 1 + thumbs.length) % thumbs.length], true);
    });
    document.getElementById('caseNext').addEventListener('click', () => {
      const i = thumbs.findIndex(t => t.classList.contains('active'));
      activate(thumbs[(i + 1) % thumbs.length], true);
    });
    mainImg.style.cursor = 'zoom-in';
    mainImg.addEventListener('click', () => openImageViewer(mainImg.src));

    activate(thumbs[0], false);
  })();

  function closeLightbox(){
    document.getElementById('lightboxOverlay').classList.remove('open');
    document.body.style.overflow = '';
  }

  // Simple zoom viewer for theme images
  function openImageViewer(src){
    document.getElementById('imageViewerImg').src = src;
    document.getElementById('imageViewerOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeImageViewer(){
    document.getElementById('imageViewerOverlay').classList.remove('open');
    document.body.style.overflow = '';
  }

  // Before/After compare slider (Rethinking Bab Al Wazir)
  (function(){
    const slider = document.getElementById('hssSlider');
    if(!slider) return;
    const afterImg = document.getElementById('hssAfterImg');
    const handle = document.getElementById('hssHandle');
    let dragging = false;

    function setPercent(percent){
      percent = Math.max(0, Math.min(100, percent));
      afterImg.style.clipPath = `inset(0 ${100 - percent}% 0 0)`;
      handle.style.left = percent + '%';
    }

    function percentFromEvent(e){
      const rect = slider.getBoundingClientRect();
      return ((e.clientX - rect.left) / rect.width) * 100;
    }

    handle.addEventListener('pointerdown', (e)=>{
      e.stopPropagation();
      dragging = true;
      handle.setPointerCapture(e.pointerId);
    });
    handle.addEventListener('pointermove', (e)=>{
      if(!dragging) return;
      setPercent(percentFromEvent(e));
    });
    handle.addEventListener('pointerup', ()=>{ dragging = false; });
    handle.addEventListener('pointercancel', ()=>{ dragging = false; });
    handle.addEventListener('click', (e)=>{ e.stopPropagation(); });

    // Clicking the image itself (not the handle) opens the full poster
    slider.addEventListener('click', ()=>{
      openImageViewer('Images/Historyofurban.jpg');
    });
  })();

  document.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape'){ closeLightbox(); closeImageViewer(); }
  });


  // ===================================================================================
  // Photography gallery: three switchable layouts (mosaic / rows / strip) that glide into
  // each other, a soft cascade reveal, drifting columns, and cursor tilt + glow on hover.
  // ===================================================================================
  (function(){
    const grid = document.getElementById('photoBento');
    if(!grid) return;
    const tiles  = Array.from(grid.querySelectorAll('.bento-item'));
    const photos = tiles.filter(t => t.classList.contains('bento-photo'));
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fineHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    let mode = 'mosaic';
    let driftPausedUntil = 0;

    // ---- 1. number + location label on every photo ----
    photos.forEach((t, i)=>{
      const label = document.createElement('div');
      label.className = 'loc';
      const no = document.createElement('span');
      no.className = 'loc-no';
      no.textContent = String(i + 1).padStart(2, '0');
      label.appendChild(no);
      const place = t.getAttribute('data-location');
      if(place){
        const nm = document.createElement('span');
        nm.className = 'loc-name';
        nm.textContent = place;
        label.appendChild(nm);
      }
      t.appendChild(label);
      t.querySelectorAll('img').forEach(im => im.setAttribute('draggable', 'false'));
    });

    // ---- 2. layout switcher ----
    const MODES = [
      { id:'mosaic', label:'Mosaic', icon:'<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="1.5" y="1.5" width="5" height="7"/><rect x="9.5" y="1.5" width="5" height="4"/><rect x="1.5" y="11" width="5" height="3.5"/><rect x="9.5" y="8" width="5" height="6.5"/></svg>' },
      { id:'rows',   label:'Rows',   icon:'<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="1.5" y="2" width="6" height="5"/><rect x="9.5" y="2" width="5" height="5"/><rect x="1.5" y="9.5" width="4" height="5"/><rect x="7.5" y="9.5" width="7" height="5"/></svg>' },
      { id:'strip',  label:'Strip',  icon:'<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="0.75" y="4" width="3.5" height="8"/><rect x="6" y="3" width="4.5" height="10"/><rect x="12" y="4" width="3.25" height="8"/></svg>' }
    ];
    const bar = document.createElement('div');
    bar.className = 'gallery-modes';
    bar.dataset.mode = mode;
    const group = document.createElement('div');
    group.className = 'gm-group';
    group.setAttribute('role', 'group');
    group.setAttribute('aria-label', 'Gallery layout');
    const buttons = MODES.map(m=>{
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'gm-btn';
      b.dataset.mode = m.id;
      b.setAttribute('aria-pressed', m.id === mode ? 'true' : 'false');
      b.innerHTML = m.icon + '<span>' + m.label + '</span>';
      b.addEventListener('click', ()=> setMode(m.id));
      group.appendChild(b);
      return b;
    });
    const arrows = document.createElement('div');
    arrows.className = 'gm-arrows';
    [['‹', -1, 'Scroll left'], ['›', 1, 'Scroll right']].forEach(([ch, dir, label])=>{
      const a = document.createElement('button');
      a.type = 'button';
      a.className = 'gm-arrow';
      a.textContent = ch;
      a.setAttribute('aria-label', label);
      a.addEventListener('click', ()=> grid.scrollBy({ left: dir * grid.clientWidth * 0.8, behavior: reduce ? 'auto' : 'smooth' }));
      arrows.appendChild(a);
    });
    bar.appendChild(group);
    bar.appendChild(arrows);
    const prevEl = grid.previousElementSibling;
    if(prevEl && prevEl.classList.contains('wrap')) prevEl.appendChild(bar);
    else grid.parentNode.insertBefore(bar, grid);

    // ---- 3. cascade reveal as tiles enter view ----
    let revealIO = null;
    if(!reduce && 'IntersectionObserver' in window){
      document.documentElement.classList.add('js-gallery');
      tiles.forEach(t => t.classList.add('gv-hide'));
      revealIO = new IntersectionObserver((entries)=>{
        const batch = entries.filter(e => e.isIntersecting).sort((a, b)=>{
          const ra = a.boundingClientRect, rb = b.boundingClientRect;
          return (ra.top - rb.top) || (ra.left - rb.left);
        });
        batch.forEach((e, i)=>{
          const t = e.target, delay = Math.min(i * 80, 480);
          t.style.setProperty('--gv-d', delay + 'ms');
          t.classList.replace('gv-hide', 'gv-show');
          revealIO.unobserve(t);
          setTimeout(()=>{ t.classList.remove('gv-show'); t.style.removeProperty('--gv-d'); }, delay + 1900);
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -5% 0px' });
      tiles.forEach(t => revealIO.observe(t));
    }
    function revealAll(){
      tiles.forEach(t=>{
        if(revealIO) revealIO.unobserve(t);
        t.classList.remove('gv-hide', 'gv-show');
        t.style.removeProperty('--gv-d');
      });
    }

    // ---- 4. drifting columns (mosaic layout, wide screens only) ----
    const speeds = [-0.045, 0.03, -0.025, 0.05];
    let colOf = new Map(), ticking = false;
    function mapColumns(){
      const lefts = [...new Set(tiles.map(t => t.offsetLeft))].sort((a, b)=> a - b);
      colOf = new Map(tiles.map(t => [t, lefts.indexOf(t.offsetLeft)]));
    }
    function clearDrift(){ tiles.forEach(t=>{ t.style.translate = ''; t.dataset.dy = '0'; }); }
    function drift(){
      ticking = false;
      if(reduce) return;
      if(mode !== 'mosaic' || window.innerWidth <= 860 || performance.now() < driftPausedUntil){
        if(mode !== 'mosaic' || window.innerWidth <= 860) clearDrift();
        return;
      }
      const vc = window.innerHeight / 2;
      tiles.forEach(t=>{
        const prev = parseFloat(t.dataset.dy || '0');
        const r = t.getBoundingClientRect();
        if(r.bottom < -120 || r.top > window.innerHeight + 120) return;
        const base = r.top + r.height / 2 - prev;
        const s = speeds[(colOf.get(t) || 0) % speeds.length];
        const dy = Math.max(-26, Math.min(26, (base - vc) * s));
        t.dataset.dy = dy.toFixed(1);
        t.style.translate = '0 ' + dy.toFixed(1) + 'px';
      });
    }
    function queue(){ if(!ticking){ ticking = true; requestAnimationFrame(drift); } }
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', ()=>{ mapColumns(); queue(); });
    window.addEventListener('load', ()=>{ mapColumns(); queue(); });
    mapColumns(); queue();

    // ---- 5. switching layouts: measure first, change layout, then glide every tile from old to new place (FLIP) ----
    function setMode(next){
      if(next === mode) return;
      revealAll();
      clearDrift();
      const first = tiles.map(t => t.getBoundingClientRect());
      grid.classList.remove('mode-' + mode);
      grid.classList.add('mode-' + next);
      mode = next;
      grid.scrollLeft = 0;
      bar.dataset.mode = next;
      buttons.forEach(b => b.setAttribute('aria-pressed', b.dataset.mode === next ? 'true' : 'false'));
      mapColumns();
      driftPausedUntil = performance.now() + 1300;
      setTimeout(queue, 1320);

      // bring the switcher near the top so the reshuffle plays in view
      const br = bar.getBoundingClientRect();
      if(br.top > window.innerHeight * 0.5 || br.top < 70){
        window.scrollTo({ top: br.top + window.scrollY - 100, behavior: reduce ? 'auto' : 'smooth' });
      }

      if(reduce) return;
      const vw = window.innerWidth, vh = window.innerHeight;
      tiles.forEach((t, i)=>{
        const f = first[i], l = t.getBoundingClientRect();
        const farAway = (r)=> r.bottom < -vh * 0.5 || r.top > vh * 1.5 || r.right < -vw * 0.5 || r.left > vw * 1.5;
        if(farAway(f) && farAway(l)) return;
        const dx = f.left - l.left, dy = f.top - l.top;
        const sx = f.width / l.width, sy = f.height / l.height;
        if(!isFinite(sx) || !isFinite(sy) || !l.width || !l.height) return;
        if(Math.abs(dx) < 1 && Math.abs(dy) < 1 && Math.abs(sx - 1) < 0.01 && Math.abs(sy - 1) < 0.01) return;
        t.animate([
          { transformOrigin: '0 0', transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + sx + ',' + sy + ')' },
          { transformOrigin: '0 0', transform: 'none' }
        ], { duration: 900, delay: Math.min(i * 16, 320), easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' });
      });
    }

    // ---- 6. cursor tilt + glow on photos (mouse / trackpad only) ----
    if(fineHover && !reduce){
      grid.addEventListener('pointermove', (e)=>{
        const t = e.target.closest ? e.target.closest('.bento-photo') : null;
        if(!t || grid.classList.contains('dragging')) return;
        const r = t.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        t.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
        t.style.setProperty('--my', (y * 100).toFixed(1) + '%');
        t.style.setProperty('--ry', ((x - 0.5) * 7).toFixed(2) + 'deg');
        t.style.setProperty('--rx', ((0.5 - y) * 7).toFixed(2) + 'deg');
      });
      grid.addEventListener('pointerout', (e)=>{
        const t = e.target.closest ? e.target.closest('.bento-photo') : null;
        if(!t || t.contains(e.relatedTarget)) return;
        t.style.setProperty('--rx', '0deg');
        t.style.setProperty('--ry', '0deg');
      });
    }

    // ---- 6b. analysis reveal grows from the click point; photos work with the keyboard too ----
    photos.forEach(t=>{
      t.setAttribute('tabindex', '0');
      t.setAttribute('role', 'button');
      const alt = t.querySelector('img.base');
      t.setAttribute('aria-label', (alt ? alt.alt : 'Photo') + ' — reveal analysis');
      t.addEventListener('keydown', (e)=>{
        if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); t.click(); }
      });
    });
    grid.addEventListener('click', (e)=>{
      const t = e.target.closest ? e.target.closest('.bento-photo') : null;
      if(!t || t.classList.contains('active')) return;
      const r = t.getBoundingClientRect();
      const fromKeyboard = e.detail === 0 || !r.width;
      const x = fromKeyboard ? 50 : (e.clientX - r.left) / r.width * 100;
      const y = fromKeyboard ? 50 : (e.clientY - r.top) / r.height * 100;
      t.style.setProperty('--cx', x.toFixed(1) + '%');
      t.style.setProperty('--cy', y.toFixed(1) + '%');
      const hint = t.querySelector('.hint');
      if(hint) hint.textContent = 'Click again to open side by side';
    }, true);

    // ---- 7. strip: drag with the mouse (touch + trackpad scroll natively); a drag must not count as a click ----
    let drag = null, dragMoved = false;
    grid.addEventListener('pointerdown', (e)=>{
      if(mode !== 'strip' || e.pointerType !== 'mouse' || e.button !== 0) return;
      drag = { x: e.clientX, left: grid.scrollLeft };
      dragMoved = false;
    });
    window.addEventListener('pointermove', (e)=>{
      if(!drag) return;
      const dx = e.clientX - drag.x;
      if(!dragMoved && Math.abs(dx) > 6){ dragMoved = true; grid.classList.add('dragging'); }
      if(dragMoved) grid.scrollLeft = drag.left - dx;
    });
    function endDrag(){
      if(!drag) return;
      drag = null;
      grid.classList.remove('dragging');
      setTimeout(()=>{ dragMoved = false; }, 60);
    }
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);
    grid.addEventListener('click', (e)=>{
      if(dragMoved){ e.stopPropagation(); e.preventDefault(); }
    }, true);
  })();
