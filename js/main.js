/* ─── Nav scroll ─────────────────────────────────────────────────────────── */
const nav = document.getElementById('main-nav');
if (nav) {
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });
}

/* ─── Hamburger ──────────────────────────────────────────────────────────── */
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('nav-links');
if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', open);
  });
  navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      navLinks.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    });
  });
}

/* ─── Smooth scroll ──────────────────────────────────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

/* ─── Fade-up (IntersectionObserver) ────────────────────────────────────── */
const io = new IntersectionObserver((entries) => {
  entries.forEach(el => {
    if (el.isIntersecting) {
      el.target.classList.add('visible');
      io.unobserve(el.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.fade-up').forEach(el => io.observe(el));

/* ─── News ───────────────────────────────────────────────────────────────── */
const newsGrid    = document.getElementById('news-grid');
const newsFilters = document.getElementById('news-filters');
let allNews = [];

function formatDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('fr-CH', { day: 'numeric', month: 'short', year: 'numeric' });
}

const CAT_LABELS = {
  reglementation: 'Réglementation',
  marche:         'Marché',
  technologie:    'Technologie',
  formation:      'Formation',
};

function renderNews(items) {
  if (!newsGrid) return;
  if (!items.length) {
    newsGrid.innerHTML = '<p style="color:var(--text-3);grid-column:1/-1">Aucune actualité dans cette catégorie.</p>';
    return;
  }
  newsGrid.innerHTML = items.map(n => `
    <article class="news-card fade-up" data-cat="${n.categorie}">
      <div class="news-meta">
        <span class="news-cat cat-${n.categorie}">${CAT_LABELS[n.categorie] || n.categorie}</span>
        <time datetime="${n.date}">${formatDate(n.date)}</time>
      </div>
      <h3 class="news-title">${n.titre}</h3>
      <p class="news-resume">${n.resume}</p>
      <div class="news-footer">
        <span class="news-source">${n.source}</span>
        ${n.url ? `<a href="${n.url}" target="_blank" rel="noopener" class="news-link">Source →</a>` : ''}
      </div>
    </article>
  `).join('');
  /* observe newly created fade-up elements */
  newsGrid.querySelectorAll('.fade-up').forEach(el => io.observe(el));
}

async function loadNews() {
  if (!newsGrid) return;
  try {
    const res = await fetch('data/news.json');
    if (!res.ok) throw new Error('fetch failed');
    allNews = await res.json();
    allNews.sort((a, b) => new Date(b.date) - new Date(a.date));
    renderNews(allNews);
    initFilters();
  } catch {
    newsGrid.innerHTML = '<p style="color:var(--text-3);grid-column:1/-1">Veille temporairement indisponible.</p>';
  }
}

function initFilters() {
  if (!newsFilters) return;
  newsFilters.querySelectorAll('[data-cat]').forEach(btn => {
    btn.addEventListener('click', () => {
      newsFilters.querySelectorAll('[data-cat]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.dataset.cat;
      renderNews(cat === 'all' ? allNews : allNews.filter(n => n.categorie === cat));
    });
  });
}

loadNews();

/* ─── Beta form ──────────────────────────────────────────────────────────── */
const betaForm    = document.getElementById('beta-form');
const betaSuccess = document.getElementById('beta-success');

if (betaForm) {
  /* Restore success state if already signed up */
  try {
    if (localStorage.getItem('flytech_beta')) {
      betaForm.style.display = 'none';
      if (betaSuccess) betaSuccess.style.display = 'flex';
    }
  } catch {}

  betaForm.addEventListener('submit', async e => {
    e.preventDefault();
    const emailInput = betaForm.querySelector('input[type="email"]');
    const submitBtn  = betaForm.querySelector('button[type="submit"]');
    const email      = emailInput ? emailInput.value.trim() : '';
    if (!email) return;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Envoi…';

    try {
      const res = await fetch(betaForm.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        try { localStorage.setItem('flytech_beta', '1'); } catch {}
        betaForm.style.display = 'none';
        if (betaSuccess) betaSuccess.style.display = 'flex';
      } else {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Rejoindre la bêta →';
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      }
    } catch {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Rejoindre la bêta →';
      alert('Connexion impossible. Vérifiez votre réseau.');
    }
  });
}

/* ─── Contact form ───────────────────────────────────────────────────────── */
const contactForm = document.getElementById('contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', async e => {
    e.preventDefault();
    const submitBtn = contactForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Envoi…';

    const data = Object.fromEntries(new FormData(contactForm));
    try {
      const res = await fetch(contactForm.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        contactForm.innerHTML = `
          <div style="text-align:center;padding:2rem 0">
            <div style="font-size:2rem;margin-bottom:.75rem">✓</div>
            <p style="color:var(--text)">Message envoyé — nous revenons vers vous sous 24h.</p>
          </div>`;
      } else {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Envoyer';
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      }
    } catch {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Envoyer';
      alert('Connexion impossible. Vérifiez votre réseau.');
    }
  });
}
