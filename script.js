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
  }, { threshold:.12 });
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

  // Photography gallery: tiles unveil in a soft cascade as they enter view, and the columns
  // drift at slightly different speeds while scrolling (desktop only). Skipped for reduced motion.
  (function(){
    const grid = document.getElementById('photoBento');
    if(!grid || !('IntersectionObserver' in window)) return;
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const tiles = Array.from(grid.querySelectorAll('.bento-item'));
    document.documentElement.classList.add('js-gallery');
    tiles.forEach(t => t.classList.add('gv-hide'));

    // --- cascade reveal ---
    const revealIO = new IntersectionObserver((entries)=>{
      const batch = entries.filter(e => e.isIntersecting).sort((a,b)=>{
        const ra = a.boundingClientRect, rb = b.boundingClientRect;
        return (ra.top - rb.top) || (ra.left - rb.left);
      });
      batch.forEach((e, i)=>{
        const t = e.target, delay = Math.min(i * 80, 480);
        t.style.setProperty('--gv-d', delay + 'ms');
        t.classList.replace('gv-hide', 'gv-show');
        revealIO.unobserve(t);
        // hand control back to the normal hover styles once the intro has finished
        setTimeout(()=>{
          t.classList.remove('gv-show');
          t.style.removeProperty('--gv-d');
        }, delay + 1900);
      });
    }, { threshold:.1, rootMargin:'0px 0px -5% 0px' });
    tiles.forEach(t => revealIO.observe(t));

    // --- drifting columns ---
    const speeds = [-0.045, 0.03, -0.025, 0.05];
    let colOf = new Map(), ticking = false;
    function mapColumns(){
      const lefts = [...new Set(tiles.map(t => t.offsetLeft))].sort((a,b)=>a-b);
      colOf = new Map(tiles.map(t => [t, lefts.indexOf(t.offsetLeft)]));
    }
    function drift(){
      ticking = false;
      const on = window.innerWidth > 860;
      const vc = window.innerHeight / 2;
      tiles.forEach(t=>{
        const prev = parseFloat(t.dataset.dy || '0');
        if(!on){ if(prev){ t.style.translate = ''; t.dataset.dy = '0'; } return; }
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
    mapColumns(); queue();
    window.addEventListener('scroll', queue, { passive:true });
    window.addEventListener('resize', ()=>{ mapColumns(); queue(); });
    window.addEventListener('load', ()=>{ mapColumns(); queue(); });
  })();
