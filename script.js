// script.js — simple interactivity for Unknown Urbexer blog
(function(){
  // Short helpers
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  // Mobile nav toggle
  const navToggle = $('#navToggle');
  const mainNav = $('#mainNav');
  navToggle && navToggle.addEventListener('click', () => {
    const expanded = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!expanded));
    if(mainNav) mainNav.style.display = expanded ? 'flex' : 'flex';
    // simple toggle for small screens: add/remove class
    mainNav && mainNav.classList.toggle('mobile-open');
  });

  // Keyboard: close mobile nav with Escape
  document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape'){
      if(mainNav && mainNav.classList.contains('mobile-open')){
        mainNav.classList.remove('mobile-open');
        navToggle && navToggle.setAttribute('aria-expanded','false');
      }
      // close reader if open
      closeReader();
    }
  });

  // Sample post data (could be replaced by real CMS)
  const POSTS = {
    1: {
      id:1,
      title: "Midnight at the Abandoned Station",
      kicker: "Exploration",
      date: "2025-11-12",
      image: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1400' height='800'><rect width='100%' height='100%' fill='%23000000'/><text x='50%' y='50%' fill='%23e11d48' font-size='48' font-family='Inter, sans-serif' text-anchor='middle' dominant-baseline='middle'>Abandoned Station — Night</text></svg>",
      body: `<p>The platform still smelled of old diesel and rain. I found a rusted timetable and a tiny hand-scribbled note wedged under a bench. There are traces left by people who passed through — a chipped bottle, a name scratched into a support beam.</p>
             <p>Walking past the ticket barriers, the echo of my boots felt like an intruder sound. The station's fluorescent panels buzzed faintly; some panels had long since gone dark. You learn quickly to read the building: where puddles gather, where the floor slopes, how the light keys can betray a weak step.</p>
             <p><strong>Safety note:</strong> Urbex is best enjoyed with respect: no vandalism, no trespassing, and always prioritize personal safety. Bring a charged phone, a headlamp, and tell someone where you'll be.</p>`
    },
    2: {
      id:2,
      title: "Skyline from a Factory Rooftop",
      kicker: "Photography",
      date: "2025-10-03",
      image: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1400' height='800'><rect width='100%' height='100%' fill='%23000000'/><text x='50%' y='50%' fill='%23e11d48' font-size='48' font-family='Inter, sans-serif' text-anchor='middle' dominant-baseline='middle'>Factory Rooftop</text></svg>",
      body: `<p>Broken glass, concrete waves, and a silence heavy enough to photograph. The city's glow was softened by humidity; towers bled light into the low clouds. From this height, you feel both distant and uncomfortably close.</p>
             <p>Compositions happen quickly: a line of pipes leading into the frame, a rusted crane silhouetted, a small rooftop garden that someone once kept. I spent an hour waiting for the cloud to break and the light to hit an old water tower in the right way.</p>`
    },
    3: {
      id:3,
      title: "A Quiet Guide to Abandoned Tunnels",
      kicker: "Guide",
      date: "2025-09-15",
      image: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1400' height='800'><rect width='100%' height='100%' fill='%23000000'/><text x='50%' y='50%' fill='%23e11d48' font-size='48' font-family='Inter, sans-serif' text-anchor='middle' dominant-baseline='middle'>Abandoned Tunnel Guide</text></svg>",
      body: `<p>Tunnels keep their own climates. Bring a headlamp, watch the water lines, and leave no trace. Cell reception may fail; plan accordingly. The best practice is to go with someone and tell a friend where you'll be and when you'll return.</p>
             <p>Look for markers that indicate hazards: fresh paint (recent maintenance), barricades, or water stains near electrical panels. Respect the space and its history.</p>`
    }
  };

  // Reader modal logic
  const reader = $('#reader');
  const readerInner = reader && reader.querySelector('.reader-inner');
  const readerTitle = $('#readerTitle');
  const readerKicker = $('#readerKicker');
  const readerDate = $('#readerDate');
  const readerImage = $('#readerImage');
  const readerBody = $('#readerBody');
  const readerClose = $('#readerClose');

  function openReader(id){
    const post = POSTS[id];
    if(!post) return;
    if(reader) reader.setAttribute('aria-hidden','false');
    if(readerInner) readerInner.focus();
    if(readerTitle) readerTitle.textContent = post.title;
    if(readerKicker) readerKicker.textContent = post.kicker;
    if(readerDate) { readerDate.textContent = new Date(post.date).toLocaleDateString(); readerDate.setAttribute('datetime', post.date); }
    if(readerImage) readerImage.src = post.image;
    if(readerBody) readerBody.innerHTML = post.body;
    // update read buttons aria-expanded
    $$('.read-btn').forEach(btn => btn.setAttribute('aria-expanded', String(btn.dataset.id == id)));
    // trap focus simple: add class to body to prevent scroll
    document.body.style.overflow = 'hidden';
  }

  function closeReader(){
    if(!reader) return;
    reader.setAttribute('aria-hidden','true');
    // restore
    document.body.style.overflow = '';
    // reset aria-expanded on read buttons
    $$('.read-btn').forEach(btn => btn.setAttribute('aria-expanded','false'));
  }

  // Attach click handlers to read buttons and recent links
  $$('.read-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = btn.dataset.id;
      openReader(id);
    });
  });

  $$('.recent-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const id = link.dataset.id;
      openReader(id);
    });
  });

  // Allow Enter key on post cards to open reader
  $$('.post-card').forEach(card => {
    card.addEventListener('keydown', (e) => {
      if(e.key === 'Enter' || e.key === ' ') {
        const id = card.dataset.id;
        openReader(id);
      }
    });
    // click the Read button when clicking the whole card (makes it feel snappy)
    card.addEventListener('click', (e) => {
      // ignore clicks on links or buttons inside the card
      if(e.target.tagName.toLowerCase() === 'a' || e.target.closest('button')) return;
      const id = card.dataset.id;
      openReader(id);
    });
  });

  // close controls
  readerClose && readerClose.addEventListener('click', closeReader);
  reader && reader.addEventListener('click', (e) => {
    // close when clicking outside inner
    if(e.target === reader) closeReader();
  });

  // set copyright year
  const yearNode = $('#copyYear');
  yearNode && (yearNode.textContent = new Date().getFullYear());

  // Accessibility: focus trap (basic)
  document.addEventListener('focus', function(ev){
    if(reader && reader.getAttribute('aria-hidden') === 'false' && !reader.contains(ev.target)){
      ev.stopPropagation();
      readerInner && readerInner.focus();
    }
  }, true);

})();
