// Main Application Controller & Interactive Logic
import { PROJECTS, CLIENT_WORK, ACHIEVEMENTS, SKILLS_DATA, EDUCATION_DATA, TEAM_MEMBERS, MORE_BUILDS, SIGNAL_MAP_DATA, ROCM_FLOW_DATA } from './data.js';

// DOM Elements
const docEl = document.documentElement;
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Mark JS readiness for progressive enhancement
docEl.classList.add('js-ready');

/* ==========================================================================
   1. THEME CONTROLLER (Dark / Light with persistence & system preference)
   ========================================================================== */
function initTheme() {
  const savedTheme = localStorage.getItem('portfolio_theme');
  if (savedTheme) {
    docEl.setAttribute('data-theme', savedTheme);
  } else {
    const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    docEl.setAttribute('data-theme', sysDark ? 'dark' : 'light');
  }

  const toggleBtns = document.querySelectorAll('.theme-toggle');
  toggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const current = docEl.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      docEl.setAttribute('data-theme', next);
      localStorage.setItem('portfolio_theme', next);
      updateCanvasColors();
    });
  });

  // System theme change listener
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    if (!localStorage.getItem('portfolio_theme')) {
      const next = e.matches ? 'dark' : 'light';
      docEl.setAttribute('data-theme', next);
      updateCanvasColors();
    }
  });
}

/* ==========================================================================
   2. SCROLL REVEALS & METRIC COUNTERS
   ========================================================================== */
function initScrollReveals() {
  if (prefersReduced || !('IntersectionObserver' in window)) {
    document.querySelectorAll('[data-r], .section-reveal-header').forEach(el => el.classList.add('in'));
    return;
  }

  // Automatic subtle staggering for sibling cards in grids
  const staggeredContainers = [
    '.flagship-grid',
    '.cert-cards-grid',
    '.archive-items-list',
    '.client-work-grid',
    '.skills-accordion',
    '.timeline'
  ];

  staggeredContainers.forEach(selector => {
    document.querySelectorAll(selector).forEach(container => {
      const items = container.querySelectorAll('[data-r]');
      items.forEach((item, idx) => {
        if (!item.hasAttribute('data-delay')) {
          item.style.transitionDelay = `${Math.min(idx * 90, 450)}ms`;
        }
      });
    });
  });

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('[data-r], .section-reveal-header').forEach(el => observer.observe(el));
}

/* ==========================================================================
   3. HERO CANVAS SCULPTURE (Cached styles & off-screen pause)
   ========================================================================== */
let updateCanvasColors = () => {};

function initHeroCanvas() {
  const canvas = document.getElementById('sculpt');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let width, height, dpr = Math.min(window.devicePixelRatio || 1, 2);
  let mouseX = 0, mouseY = 0, time = 0;
  let isVisible = true;
  let cachedStroke = '#eceae4';

  function refreshColors() {
    cachedStroke = getComputedStyle(docEl).getPropertyValue('--ink').trim() || '#eceae4';
  }
  refreshColors();
  updateCanvasColors = refreshColors;

  function resize() {
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  window.addEventListener('pointermove', e => {
    mouseX = (e.clientX / window.innerWidth) - 0.5;
    mouseY = (e.clientY / window.innerHeight) - 0.5;
  }, { passive: true });

  const visObserver = new IntersectionObserver(entries => {
    isVisible = entries[0].isIntersecting;
    if (isVisible && !prefersReduced) requestAnimationFrame(render);
  });
  visObserver.observe(canvas);

  let scrollParallaxY = 0;
  window.addEventListener('scroll', () => {
    if (window.scrollY < window.innerHeight * 1.5) {
      scrollParallaxY = window.scrollY * 0.12;
    }
  }, { passive: true });

  const rings = window.innerWidth < 700 ? 9 : 14;
  const nodes = window.innerWidth < 700 ? 18 : 26;

  function render() {
    if (!isVisible || prefersReduced) return;
    time += 0.0035;
    ctx.clearRect(0, 0, width, height);

    const isSmall = width < 700;
    const cx = width * (isSmall ? 0.5 : 0.68) + mouseX * 24;
    const cy = height * (isSmall ? 0.28 : 0.42) + mouseY * 18 + scrollParallaxY;
    const scale = Math.min(width, height) * (isSmall ? 0.35 : 0.38);

    const ax = 0.9 + mouseY * 0.25;
    const ay = time + mouseX * 0.4;
    const pointRings = [];

    for (let r = 0; r < rings; r++) {
      const yNorm = (r / (rings - 1) - 0.5) * 2;
      const radius = Math.sqrt(Math.max(0, 1 - yNorm * yNorm)) * (0.6 + 0.4 * Math.sin(r * 0.6 + time * 1.8) * 0.5);
      const ring = [];

      for (let n = 0; n < nodes; n++) {
        const angle = (n / nodes) * Math.PI * 2 + r * 0.16;
        const px = Math.cos(angle) * radius;
        const py = yNorm * 1.1;
        const pz = Math.sin(angle) * radius;

        const x1 = px * Math.cos(ay) - pz * Math.sin(ay);
        const z1 = px * Math.sin(ay) + pz * Math.cos(ay);
        const y2 = py * Math.cos(ax) - z1 * Math.sin(ax);
        const z2 = py * Math.sin(ax) + z1 * Math.cos(ax);

        const factor = 1 / (1.8 - z2 * 0.5);
        ring.push({
          x: cx + x1 * scale * factor,
          y: cy + y2 * scale * factor,
          z: z2
        });
      }
      pointRings.push(ring);
    }

    ctx.lineWidth = 1;
    pointRings.forEach((ring, idx) => {
      ctx.beginPath();
      ring.forEach((pt, pIdx) => (pIdx === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y)));
      ctx.closePath();
      ctx.strokeStyle = cachedStroke;
      ctx.globalAlpha = 0.14;
      ctx.stroke();

      if (idx > 0) {
        for (let j = 0; j < nodes; j += 2) {
          ctx.beginPath();
          ctx.moveTo(ring[j].x, ring[j].y);
          ctx.lineTo(pointRings[idx - 1][j].x, pointRings[idx - 1][j].y);
          ctx.globalAlpha = 0.06;
          ctx.stroke();
        }
      }

      ring.forEach((pt, jIdx) => {
        if ((idx * 3 + jIdx) % 7 === 0) {
          ctx.globalAlpha = 0.35 + pt.z * 0.4;
          ctx.fillStyle = (idx + jIdx) % 5 === 0 ? '#c9984f' : '#5b8cff';
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    });

    ctx.globalAlpha = 1;
    requestAnimationFrame(render);
  }

  render();
}

/* ==========================================================================
   4. IMPOSTR COMPACT SCROLL INTERACTION & STORYTELLING
   ========================================================================== */
function initImpostrInteraction() {
  const wrapper = document.querySelector('.impostr-scroll-wrapper');
  const simUrl = document.getElementById('simUrl');
  const panels = document.querySelectorAll('.stage-panel');
  const segments = document.querySelectorAll('.progress-segment');
  const stageCounter = document.getElementById('stageCounter');
  const stageName = document.getElementById('stageName');
  const flowFill = document.getElementById('flowLineFill');
  const flowNodes = document.querySelectorAll('.flow-step-node');
  const scoreRing = document.getElementById('scoreRingFill');
  const scoreCounter = document.getElementById('scoreCounter');
  const sampleBtns = document.querySelectorAll('.sample-target-btn');

  if (!wrapper) return;

  const STAGES = [
    { title: "01 · Target Ingestion & Normalization", text: "Normalization & lexical entropy" },
    { title: "02 · Infrastructure & Live Telemetry", text: "crt.sh / DNS / WHOIS verification" },
    { title: "03 · Feed Cross-Referencing & NLP", text: "URLhaus · OpenPhish · Threat datasets" },
    { title: "04 · Forensics Verdict & Entity Graph", text: "Illustrative Score: 88/100 (Suspicious)" }
  ];

  let currentStage = 0;
  let scoreAnimated = false;

  function animateScoreRing(targetScore) {
    if (!scoreRing) return;
    const circumference = 2 * Math.PI * 42; // ~263.89
    const offset = circumference - (targetScore / 100) * circumference;
    scoreRing.style.strokeDashoffset = offset;

    if (scoreCounter) {
      let current = 0;
      const duration = 800;
      const startTime = performance.now();
      function tick(now) {
        const progress = Math.min((now - startTime) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        scoreCounter.textContent = Math.round(targetScore * ease);
        if (progress < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }
  }

  function setStage(idx, isManual) {
    currentStage = Math.max(0, Math.min(3, idx));

    if (stageCounter) stageCounter.textContent = `0${currentStage + 1} / 04`;
    if (stageName) stageName.textContent = STAGES[currentStage].title;

    panels.forEach((p, i) => {
      p.classList.toggle('active', i === currentStage);
    });

    segments.forEach((s, i) => {
      s.classList.toggle('active', i <= currentStage);
    });

    flowNodes.forEach((node, i) => {
      node.classList.toggle('active', i === currentStage);
      node.classList.toggle('completed', i < currentStage);
    });

    if (flowFill) {
      const fillPercents = [10, 40, 70, 100];
      flowFill.style.width = `${fillPercents[currentStage]}%`;
    }

    if (currentStage === 3 && !scoreAnimated) {
      scoreAnimated = true;
      animateScoreRing(88);
    } else if (currentStage < 3) {
      scoreAnimated = false;
      if (scoreRing) {
        scoreRing.style.strokeDashoffset = '263.89';
      }
    }
  }

  // Sample target switching buttons
  sampleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      sampleBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const sample = btn.dataset.sample;
      if (simUrl) {
        simUrl.textContent = sample;
        simUrl.style.clipPath = 'inset(0 0 0 0)';
      }
      // Re-trigger stage update
      setStage(currentStage);
    });
  });

  // Direct click on flow step tabs
  flowNodes.forEach(node => {
    node.addEventListener('click', () => {
      const targetIdx = parseInt(node.dataset.stepNav, 10);
      setStage(targetIdx, true);
    });
  });

  if (prefersReduced) {
    setStage(0);
    return;
  }

  let ticking = false;
  function updateScroll() {
    ticking = false;
    const rect = wrapper.getBoundingClientRect();
    const scrollProgress = Math.min(1, Math.max(0, -rect.top / (rect.height - window.innerHeight)));

    const stageIdx = Math.min(3, Math.floor(scrollProgress * 4));

    if (simUrl) {
      const typePercent = Math.min(100, Math.max(0, scrollProgress * 300));
      simUrl.style.clipPath = `inset(0 ${100 - typePercent}% 0 0)`;
    }

    if (stageIdx !== currentStage) {
      setStage(stageIdx);
    }
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(updateScroll);
    }
  }, { passive: true });

  setStage(0);
}

/* ==========================================================================
   5. CASE STUDY MODAL ENGINE (Accessible dialog with focus trapping)
   ========================================================================== */
function initCaseStudyModal() {
  const modalBackdrop = document.getElementById('caseStudyModal');
  const closeBtn = document.getElementById('modalCloseBtn');
  const modalContent = document.getElementById('modalDynamicContent');
  let previouslyFocused = null;

  if (!modalBackdrop) return;

  function openModal(projectId) {
    const project = PROJECTS.find(p => p.id === projectId);
    if (!project || !project.caseStudy) return;

    previouslyFocused = document.activeElement;

    const cs = project.caseStudy;
    let decisionsHtml = '';
    if (cs.decisions && cs.decisions.length) {
      decisionsHtml = `
        <div class="modal-section">
          <h4>Key Engineering Decisions</h4>
          <div class="decisions-grid">
            ${cs.decisions.map(d => `
              <div class="decision-card">
                <h5>${d.title}</h5>
                <p>${d.detail}</p>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    let plannedHtml = '';
    if (cs.implementedVsPlanned) {
      plannedHtml = `
        <div class="modal-section">
          <h4>Feature Breakdown (Implemented vs Planned)</h4>
          <div class="planned-grid">
            <div class="planned-col">
              <h5 style="color:var(--acc)">Implemented in Repository</h5>
              <ul>
                ${cs.implementedVsPlanned.implemented.map(i => `<li>${i}</li>`).join('')}
              </ul>
            </div>
            <div class="planned-col">
              <h5 style="color:var(--mute)">Planned / Next Milestones</h5>
              <ul>
                ${cs.implementedVsPlanned.planned.map(i => `<li>${i}</li>`).join('')}
              </ul>
            </div>
          </div>
        </div>
      `;
    }

    modalContent.innerHTML = `
      <div class="modal-meta-top" style="display:flex; gap:8px; margin-bottom:12px;">
        <span class="badge ${project.statusType === 'live' ? 'badge-live' : 'badge-dev'}">${project.status}</span>
        ${project.awardBadge ? `<span class="badge badge-award">${project.awardBadge}</span>` : ''}
      </div>
      <h3 style="font-size:clamp(28px, 4vw, 44px); margin:8px 0 16px;">${project.title} — Case Study</h3>
      <p style="color:var(--mute); font-size:16px;">${project.summary}</p>
      
      <div class="modal-section">
        <h4>The Problem</h4>
        <p>${cs.problem}</p>
      </div>

      <div class="modal-section">
        <h4>Architecture &amp; Solution Flow</h4>
        <p>${cs.solution}</p>
        <div class="arch-diagram-wrapper">
          ${cs.architectureSvg || ''}
        </div>
      </div>

      <div class="modal-section">
        <h4>My Specific Contribution</h4>
        <p>${cs.contribution}</p>
      </div>

      ${decisionsHtml}
      ${plannedHtml}

      <div class="modal-section">
        <h4>Evidence &amp; Verification</h4>
        <p>${cs.evidence}</p>
      </div>

      <div class="modal-section">
        <h4>Current Limitations &amp; Next Steps</h4>
        <p><strong>Limitations:</strong> ${cs.limitations}</p>
        <p><strong>Next steps:</strong> ${cs.nextSteps}</p>
      </div>
    `;

    modalBackdrop.classList.add('open');
    modalBackdrop.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lock');

    setTimeout(() => closeBtn.focus(), 50);
  }

  function closeModal() {
    modalBackdrop.classList.remove('open');
    modalBackdrop.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lock');
    if (previouslyFocused) previouslyFocused.focus();
  }

  // Delegate clicks on case study trigger buttons
  document.addEventListener('click', e => {
    const trigger = e.target.closest('[data-case-study]');
    if (trigger) {
      e.preventDefault();
      openModal(trigger.dataset.caseStudy);
    }
  });

  closeBtn.addEventListener('click', closeModal);
  modalBackdrop.addEventListener('click', e => {
    if (e.target === modalBackdrop) closeModal();
  });

  window.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modalBackdrop.classList.contains('open')) {
      closeModal();
    }
  });

  // Focus trap inside modal
  modalBackdrop.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;
    const focusables = modalBackdrop.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
}

/* ==========================================================================
   6. PROOF CERTIFICATE MODAL
   ========================================================================== */
function initProofModal() {
  const modal = document.getElementById('proofModal');
  const closeBtn = document.getElementById('proofCloseBtn');
  const imgEl = document.getElementById('proofModalImg');
  const titleEl = document.getElementById('proofModalTitle');
  let prevFocus = null;

  if (!modal) return;

  function openProof(src, title) {
    prevFocus = document.activeElement;
    imgEl.src = src;
    imgEl.alt = title;
    titleEl.textContent = title;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lock');
    setTimeout(() => closeBtn.focus(), 50);
  }

  function closeProof() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lock');
    if (prevFocus) prevFocus.focus();
  }

  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-view-proof]');
    if (btn) {
      e.preventDefault();
      openProof(btn.dataset.viewProof, btn.dataset.proofTitle || "Proof of Achievement");
    }
  });

  // Support Enter and Space on elements with role="button" having data-view-proof
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      const btn = e.target.closest('[data-view-proof]');
      if (btn && btn.tagName !== 'BUTTON') {
        e.preventDefault();
        openProof(btn.dataset.viewProof, btn.dataset.proofTitle || "Proof of Achievement");
      }
    }
  });

  closeBtn.addEventListener('click', closeProof);
  modal.addEventListener('click', e => {
    if (e.target === modal) closeProof();
  });

  window.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeProof();
  });

  // Focus trap
  modal.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;
    const focusables = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
}

/* ==========================================================================
   6B. ACHIEVEMENT DETAIL MODAL (SecLeaf CTF 2026 Interactive Dialog)
   ========================================================================== */
function initAchievementModal() {
  const modal = document.getElementById('achievementModal');
  const closeBtn = document.getElementById('achievementCloseBtn');
  const contentEl = document.getElementById('achievementDynamicContent');
  let prevFocus = null;

  if (!modal || !contentEl) return;

  function renderSecLeafModal() {
    const feat = ACHIEVEMENTS.featured;
    contentEl.innerHTML = `
      <div>
        <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:12px; margin-bottom:12px;">
          <div>
            <span class="badge badge-silver">Runner-up · Rank 2</span>
            <h3 style="font-size:clamp(24px, 3.5vw, 36px); margin:8px 0 4px;">${feat.title}</h3>
            <span class="mono" style="font-size:13px; color:var(--mute);">Team: <strong>${feat.project}</strong> · International Cybersecurity Competition</span>
          </div>
          <a class="btn sm solid" href="${feat.proofUrl}" target="_blank" rel="noopener noreferrer">
            View LinkedIn Announcement ↗
          </a>
        </div>
        <p style="color:var(--mute); font-size:15px; line-height:1.6; margin:0;">
          ${feat.description}
        </p>
      </div>

      <div class="achievement-modal-hero">
        <img src="${feat.resultsImage}" alt="SecLeaf Q4 Operations CTF 2026 official winners results poster" loading="lazy">
        <div class="achievement-modal-hero-cap">
          <span>Official SecLeaf Q4 Operations Results Poster — Merp Era (Rank 2)</span>
          <button type="button" class="btn sm outline-acc" data-view-proof="${feat.resultsImage}" data-proof-title="SecLeaf Q4 Operations CTF 2026 Winners Poster">
            Enlarge Poster ↗
          </button>
        </div>
      </div>

      <div class="achievement-modal-grid">
        <div class="achievement-modal-section">
          <h4 style="font-family:var(--m); font-size:12px; text-transform:uppercase; color:var(--mute); letter-spacing:0.06em; margin-bottom:12px;">
            Competition Metrics &amp; Team
          </h4>
          <div class="achievement-stats-list">
            <div class="achievement-stat-item">
              <span class="achievement-stat-label">Final Score</span>
              <span class="achievement-stat-val" style="color:var(--silver);">${feat.score}</span>
            </div>
            <div class="achievement-stat-item">
              <span class="achievement-stat-label">Duration</span>
              <span class="achievement-stat-val">${feat.duration}</span>
            </div>
            <div class="achievement-stat-item">
              <span class="achievement-stat-label">Dates</span>
              <span class="achievement-stat-val">${feat.date}</span>
            </div>
            <div class="achievement-stat-item">
              <span class="achievement-stat-label">Placement</span>
              <span class="achievement-stat-val">2nd Place (Podium)</span>
            </div>
          </div>

          <h4 style="font-family:var(--m); font-size:12px; text-transform:uppercase; color:var(--mute); letter-spacing:0.06em; margin:20px 0 8px;">
            Team Merp Era Members
          </h4>
          <ul style="list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:8px;">
            ${feat.team.map(m => `
              <li style="display:flex; align-items:center; gap:8px; font-size:14px; color:var(--ink);">
                <span class="live-pulse-dot" style="background:var(--silver); box-shadow:none;" aria-hidden="true"></span>
                <span>${m}</span>
              </li>
            `).join('')}
          </ul>
        </div>

        <div class="achievement-cert-preview-card">
          <h4 style="font-family:var(--m); font-size:12px; text-transform:uppercase; color:var(--mute); letter-spacing:0.06em; margin:0;">
            Individual Certificate
          </h4>
          <div class="achievement-cert-preview-thumb" data-view-proof="${feat.certificateImage}" data-proof-title="Saugat Rauniyar — SecLeaf CTF 2026 Certificate (Rank 2)" role="button" tabindex="0" aria-label="Open Certificate in Large View">
            <img src="${feat.certificateImage}" alt="SecLeaf Q4 Operations CTF Certificate of Achievement preview" loading="lazy">
            <div class="achievement-cert-zoom-btn">
              <span>Click to Enlarge ↗</span>
            </div>
          </div>
          <button type="button" class="btn sm outline-acc" data-view-proof="${feat.certificateImage}" data-proof-title="Saugat Rauniyar — SecLeaf CTF 2026 Certificate (Rank 2)">
            Open Certificate in Large View ↗
          </button>
        </div>
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; padding-top:16px; border-top:1px solid var(--line);">
        <span class="mono" style="font-size:11px; color:var(--mute);">SecLeaf Q4 Operations CTF 2026 · Verified Achievement Archive</span>
        <a class="btn sm solid" href="${feat.proofUrl}" target="_blank" rel="noopener noreferrer">
          View LinkedIn Announcement ↗
        </a>
      </div>
    `;
  }

  function openAchievementModal() {
    prevFocus = document.activeElement;
    renderSecLeafModal();
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lock');
    setTimeout(() => closeBtn.focus(), 50);
  }

  function closeAchievementModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lock');
    if (prevFocus) prevFocus.focus();
  }

  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-open-achievement-modal]');
    if (btn) {
      e.preventDefault();
      openAchievementModal();
    }
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      const btn = e.target.closest('[data-open-achievement-modal]');
      if (btn && btn.tagName !== 'BUTTON') {
        e.preventDefault();
        openAchievementModal();
      }
    }
  });

  closeBtn.addEventListener('click', closeAchievementModal);
  modal.addEventListener('click', e => {
    if (e.target === modal) closeAchievementModal();
  });

  window.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeAchievementModal();
  });

  // Focus trap
  modal.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;
    const focusables = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
}

/* ==========================================================================
   7. SKILLS ACCORDION (Semantic buttons with ARIA states)
   ========================================================================== */
function initSkillsAccordion() {
  const container = document.getElementById('skillsAccordionContainer');
  if (!container) return;

  container.innerHTML = SKILLS_DATA.map((group, idx) => `
    <div class="accordion-group ${idx === 0 ? 'is-open' : ''}" data-r style="transition-delay:${idx * 80}ms">
      <button type="button" class="accordion-trigger" 
              id="skill-btn-${group.id}" 
              aria-expanded="${idx === 0 ? 'true' : 'false'}" 
              aria-controls="skill-panel-${group.id}">
        <span>${group.category}</span>
        <span class="accordion-icon" aria-hidden="true">+</span>
      </button>
      <div id="skill-panel-${group.id}" 
           class="accordion-content" 
           role="region" 
           aria-labelledby="skill-btn-${group.id}">
        <ul class="skill-pills-list">
          ${group.skills.map(s => `
            <li>
              ${s.project ? `
                <a href="#${s.project === 'impostr' ? 'projects' : s.project === 'dormex' ? 'projects' : s.project === 'lucerna' ? 'projects' : s.project}" class="skill-pill-link">
                  <span>${s.name}</span>
                  <small>↗ ${s.projectName}</small>
                </a>
              ` : `
                <span class="skill-pill-link" style="cursor:default">
                  <span>${s.name}</span>
                  <small>• ${s.projectName}</small>
                </span>
              `}
            </li>
          `).join('')}
        </ul>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.accordion-trigger').forEach(btn => {
    btn.addEventListener('click', () => {
      const group = btn.closest('.accordion-group');
      const isOpen = group.classList.contains('is-open');

      group.classList.toggle('is-open', !isOpen);
      btn.setAttribute('aria-expanded', String(!isOpen));
    });
  });

  if (!prefersReduced && 'IntersectionObserver' in window) {
    const skillsObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    container.querySelectorAll('.accordion-group[data-r]').forEach(item => skillsObserver.observe(item));
  }
}

/* ==========================================================================
   8. CERTIFICATES & LEARNING RENDERER (Curated 6 Initial + View All 10 Expandable)
   ========================================================================== */
function initCertificatesRenderer() {
  const container = document.getElementById('certCardsContainer');
  const spotlightContainer = document.getElementById('featuredRocmSpotlight');
  const tabBtns = document.querySelectorAll('.cert-tab-btn');
  const toggleBtn = document.getElementById('certToggleViewBtn');
  const toggleWrap = document.getElementById('certViewMoreWrap');
  if (!container) return;

  const certCategory = ACHIEVEMENTS.categories.find(c => c.name === "Certifications & Learning");
  if (!certCategory || !certCategory.items) return;

  const allCerts = certCategory.items;
  const rocmCert = allCerts.find(c => c.id === 'amd-rocm');

  // Curated 6 default items based on relevance & evidence
  const curatedIds = [
    'amd-rocm',
    'nvidia-jetson',
    'anthropic-claude',
    'infosys-neural-nlp',
    'infosys-aws',
    'scaler-os'
  ];

  let isExpanded = false;
  let activeFilter = 'all';

  // 1. Render Featured AMD ROCm Spotlight Card
  if (spotlightContainer && rocmCert) {
    spotlightContainer.innerHTML = `
      <div class="rocm-spotlight-inner" id="cert-amd-rocm">
        <div>
          <span class="rocm-brand-badge">✦ NEWEST FEATURED CREDENTIAL · AMD AI ACADEMY</span>
          <h4>${rocmCert.title}</h4>
          <span class="rocm-formal-title">${rocmCert.formalTitle}</span>
          <p class="rocm-summary">${rocmCert.summary}</p>

          <div class="rocm-curriculum-grid">
            ${rocmCert.curriculum ? rocmCert.curriculum.map(c => `<div class="rocm-curriculum-item">${c}</div>`).join('') : ''}
          </div>

          <div class="rocm-actions">
            <a class="btn sm solid" href="${rocmCert.proofLink}" target="_blank" rel="noopener noreferrer">
              Verify Credential ↗
            </a>
            <a class="btn sm" href="${rocmCert.linkedInUrl}" target="_blank" rel="noopener noreferrer">
              LinkedIn Announcement ↗
            </a>
            <a class="btn sm outline-acc" href="#gpuComputeExperience">
              Explore ROCm Systems Flow ↓
            </a>
          </div>
        </div>

        <div class="rocm-side-telemetry">
          <div class="rocm-meta-row">
            <span>ISSUING BODY</span>
            <strong>AMD AI Academy</strong>
          </div>
          <div class="rocm-meta-row">
            <span>VERIFIED DATE</span>
            <strong>November 2026</strong>
          </div>
          <div class="rocm-meta-row">
            <span>FOCUS AREAS</span>
            <strong>ROCm · Instinct · HIP · AI</strong>
          </div>
          <div class="rocm-meta-row">
            <span>OFFICIAL PROGRAM</span>
            <a href="${rocmCert.officialUrl}" target="_blank" rel="noopener noreferrer" class="mono" style="font-size:11px; color:var(--acc);">
              developer.amd.com ↗
            </a>
          </div>
        </div>
      </div>
    `;
  }

  // Helper to determine action button text & style
  function renderActionBtn(cert) {
    if (!cert.proofLink) {
      return `<span class="mono" style="color:var(--mute); font-size:11px;">Completed</span>`;
    }

    let primaryBtn = '';
    if (cert.isImage) {
      primaryBtn = `
        <button type="button" class="btn sm outline-acc" data-view-proof="${cert.proofLink}" data-proof-title="${cert.title} — ${cert.organization}">
          Preview ↗
        </button>
      `;
    } else if (cert.id === 'amd-rocm') {
      primaryBtn = `
        <a class="btn sm solid" href="${cert.proofLink}" target="_blank" rel="noopener noreferrer">
          Verify Credential ↗
        </a>
      `;
    } else {
      primaryBtn = `
        <a class="btn sm outline-acc" href="${cert.proofLink}" target="_blank" rel="noopener noreferrer">
          View Certificate ↗
        </a>
      `;
    }

    const linkedInBtn = cert.linkedInUrl ? `
      <a class="btn sm" href="${cert.linkedInUrl}" target="_blank" rel="noopener noreferrer">
        Announcement ↗
      </a>
    ` : '';

    return `<div style="display:flex; gap:8px; flex-wrap:wrap;">${primaryBtn}${linkedInBtn}</div>`;
  }

  // 2. Render Grid Cards with Curation & Filtering
  function renderGrid() {
    let filtered = activeFilter === 'all' ? allCerts : allCerts.filter(c => c.category === activeFilter);

    // If 'all' is active and NOT expanded, slice to curated 6 entries
    let displayList = filtered;
    if (activeFilter === 'all' && !isExpanded) {
      // Prioritize curatedIds first
      const curatedItems = curatedIds.map(id => allCerts.find(c => c.id === id)).filter(Boolean);
      displayList = curatedItems;
    }

    // Toggle button visibility & label
    if (toggleWrap && toggleBtn) {
      if (activeFilter === 'all') {
        toggleWrap.style.display = 'flex';
        toggleBtn.setAttribute('aria-expanded', String(isExpanded));
        if (isExpanded) {
          toggleBtn.innerHTML = `
            <span class="cert-toggle-text">Show 6 Featured Credentials</span>
            <span class="cert-toggle-icon" aria-hidden="true">↑</span>
          `;
        } else {
          toggleBtn.innerHTML = `
            <span class="cert-toggle-text">View All 10 Credentials</span>
            <span class="cert-toggle-count mono">(+4 Archive Entries)</span>
            <span class="cert-toggle-icon" aria-hidden="true">↓</span>
          `;
        }
      } else {
        // When filtered by specific category, all items in that category are shown
        toggleWrap.style.display = 'none';
      }
    }

    container.innerHTML = displayList.map((cert, idx) => `
      <article class="cert-card ${cert.featured ? 'is-featured-border' : ''}" id="cert-${cert.id || idx}" data-r style="transition-delay:${Math.min(idx * 50, 350)}ms">
        <div class="cert-card-header">
          <div>
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
              <span class="mono" style="font-size:10px; color:var(--acc); text-transform:uppercase;">${cert.category || 'Certification'}</span>
              ${cert.featured ? '<span class="badge" style="font-size:9px; padding:2px 6px; background:rgba(245,158,11,0.15); color:#f59e0b; border:1px solid rgba(245,158,11,0.3)">Featured</span>' : ''}
            </div>
            <h4>${cert.title}</h4>
            <span class="cert-issuer">${cert.organization}</span>
          </div>
          <span class="mono cert-card-date">${cert.date}</span>
        </div>
        <p class="cert-summary">${cert.summary}</p>
        <div class="cert-card-footer">
          <span class="mono" style="color:var(--mute); font-size:11px;">${cert.proofType}</span>
          ${renderActionBtn(cert)}
        </div>
      </article>
    `).join('');

    // Re-observe dynamically rendered cert cards
    if (!prefersReduced && 'IntersectionObserver' in window) {
      const certObserver = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });
      container.querySelectorAll('.cert-card[data-r]').forEach(card => certObserver.observe(card));
    }
  }

  // Toggle View All / Collapse Button
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      isExpanded = !isExpanded;
      renderGrid();
      if (!isExpanded && container) {
        // Smoothly adjust scroll position back to top of container
        container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }

  // Filter tab events
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      activeFilter = btn.dataset.certFilter;
      renderGrid();
    });
  });

  renderGrid();
}

/* ==========================================================================
   8.5 ENGINEERING SIGNAL MAP INTERACTIVE CONTROLLER
   ========================================================================== */
function initSignalMap() {
  const svg = document.getElementById('signalMapSvg');
  const edgesGroup = document.getElementById('signalMapEdgesGroup');
  const nodesGroup = document.getElementById('signalMapNodesGroup');
  const inspector = document.getElementById('signalNodeInspector');
  const inspectorTitle = document.getElementById('inspectorTitle');
  const inspectorBadge = document.getElementById('inspectorBadge');
  const inspectorMeta = document.getElementById('inspectorMeta');
  const inspectorDesc = document.getElementById('inspectorDesc');
  const inspectorPills = document.getElementById('inspectorPills');
  const inspectorAction = document.getElementById('inspectorAction');
  const mobileContainer = document.getElementById('signalMapMobile');

  if (!svg || !edgesGroup || !nodesGroup || !SIGNAL_MAP_DATA) return;

  // Center coords for 1000x600 viewBox
  const CX = 500;
  const CY = 295;
  const RADIUS = 175;

  // Domain Node Coordinates
  const domainNodes = SIGNAL_MAP_DATA.domains.map((domain, i) => {
    const angle = (i * (2 * Math.PI / SIGNAL_MAP_DATA.domains.length)) - (Math.PI / 2);
    const x = Math.round(CX + RADIUS * Math.cos(angle));
    const y = Math.round(CY + RADIUS * Math.sin(angle));
    return {
      ...domain,
      x,
      y,
      angle,
      idx: i
    };
  });

  // Render SVG Edges (Center to each domain)
  edgesGroup.innerHTML = domainNodes.map(d => `
    <line class="map-edge" id="edge-${d.id}" x1="${CX}" y1="${CY}" x2="${d.x}" y2="${d.y}" />
  `).join('');

  // Render SVG Nodes (Center + 5 domains)
  let nodesHtml = `
    <!-- Center Node: Saugat -->
    <g class="map-node-group" id="node-saugat" role="button" tabindex="0" aria-label="Center Node: Saugat Rauniyar">
      <circle class="map-node-circle" cx="${CX}" cy="${CY}" r="42" fill="var(--card-bg-elevated)" stroke="var(--ink)" stroke-width="2" />
      <circle cx="${CX}" cy="${CY}" r="34" fill="rgba(var(--acc-rgb), 0.08)" stroke="var(--line)" stroke-width="1" />
      <text class="map-node-label" x="${CX}" y="${CY - 5}" text-anchor="middle" font-size="11">SAUGAT</text>
      <text class="map-node-label" x="${CX}" y="${CY + 9}" text-anchor="middle" font-size="10" fill="var(--mute)">RAUNIYAR</text>
      <text class="map-node-sublabel" x="${CX}" y="${CY + 22}" text-anchor="middle" font-size="8.5">CORE NODE</text>
    </g>
  `;

  nodesHtml += domainNodes.map(d => {
    let titleY, subY;
    if (d.idx === 0) {
      // Top node (Cybersecurity) - position above circle (circle top is d.y - 34)
      titleY = d.y - 58;
      subY = d.y - 41;
    } else {
      // Bottom/side nodes - position below circle (circle bottom is d.y + 34)
      titleY = d.y + 57;
      subY = d.y + 75;
    }
    return `
      <g class="map-node-group" id="node-${d.id}" role="button" tabindex="0" aria-label="Engineering Domain: ${d.name}">
        <circle class="map-node-circle" cx="${d.x}" cy="${d.y}" r="34" fill="var(--card-bg-elevated)" stroke="${d.color}" stroke-width="2" />
        <circle cx="${d.x}" cy="${d.y}" r="4" fill="${d.color}" />
        <text class="map-node-label" x="${d.x}" y="${titleY}" text-anchor="middle">${d.name}</text>
        <text class="map-node-sublabel" x="${d.x}" y="${subY}" text-anchor="middle">${d.short}</text>
      </g>
    `;
  }).join('');

  nodesGroup.innerHTML = nodesHtml;

  // Active state controller
  function inspectDomain(domain) {
    if (!inspector) return;

    // Update active SVG classes and dim unrelated connections
    document.querySelectorAll('.map-edge').forEach(e => {
      e.classList.remove('active');
      e.classList.add('dimmed');
    });
    document.querySelectorAll('.map-node-group').forEach(n => {
      n.classList.remove('active');
      n.classList.add('dimmed');
    });

    const edgeEl = document.getElementById(`edge-${domain.id}`);
    const nodeEl = document.getElementById(`node-${domain.id}`);
    const centerNode = document.getElementById('node-saugat');

    if (edgeEl) {
      edgeEl.classList.remove('dimmed');
      edgeEl.classList.add('active');
    }
    if (nodeEl) {
      nodeEl.classList.remove('dimmed');
      nodeEl.classList.add('active');
    }
    if (centerNode) {
      centerNode.classList.remove('dimmed');
    }

    // Update inspector content
    if (inspectorBadge) inspectorBadge.textContent = 'ENGINEERING DOMAIN';
    if (inspectorMeta) inspectorMeta.textContent = `${domain.connections.length} Direct Connections`;
    if (inspectorTitle) inspectorTitle.textContent = domain.name;
    if (inspectorDesc) inspectorDesc.textContent = domain.description;

    if (inspectorPills) {
      inspectorPills.innerHTML = domain.connections.map(c => `
        <a class="inspector-pill-link" href="#${c.targetId}">
          <div class="pill-meta-col">
            <strong>${c.name}</strong>
            <small>${c.summary}</small>
          </div>
          <span class="pill-nav-btn">Navigate ↗</span>
        </a>
      `).join('');
    }

    if (inspectorAction) {
      inspectorAction.innerHTML = `
        <a class="btn sm solid inspector-cta-btn" href="#${domain.connections[0]?.targetId || 'projects'}">
          Explore Related System (${domain.connections[0]?.name}) ↗
        </a>
      `;
    }
  }

  function inspectCenter() {
    document.querySelectorAll('.map-edge').forEach(e => {
      e.classList.remove('active', 'dimmed');
    });
    document.querySelectorAll('.map-node-group').forEach(n => {
      n.classList.remove('active', 'dimmed');
    });
    const centerNode = document.getElementById('node-saugat');
    if (centerNode) centerNode.classList.add('active');

    if (inspectorBadge) inspectorBadge.textContent = 'CENTRAL ARCHITECTURE';
    if (inspectorMeta) inspectorMeta.textContent = '5 Domains Interconnected';
    if (inspectorTitle) inspectorTitle.textContent = SIGNAL_MAP_DATA.center.label;
    if (inspectorDesc) inspectorDesc.textContent = `${SIGNAL_MAP_DATA.center.role} — ${SIGNAL_MAP_DATA.center.summary}. Select any satellite node to trace how technical interests connect to deployed codebases and certifications.`;

    if (inspectorPills) {
      inspectorPills.innerHTML = SIGNAL_MAP_DATA.domains.map(d => `
        <button type="button" class="inspector-pill-link" data-select-domain="${d.id}" style="width:100%; text-align:left; cursor:pointer;">
          <div>
            <strong>${d.name}</strong>
            <small style="display:block; color:var(--mute); font-size:11px;">${d.short}</small>
          </div>
          <span style="color:var(--acc); font-size:12px;">Trace ✦</span>
        </button>
      `).join('');

      inspectorPills.querySelectorAll('[data-select-domain]').forEach(btn => {
        btn.addEventListener('click', () => {
          const found = SIGNAL_MAP_DATA.domains.find(d => d.id === btn.dataset.selectDomain);
          if (found) inspectDomain(found);
        });
      });
    }

    if (inspectorAction) {
      inspectorAction.innerHTML = `
        <a class="btn sm outline-acc inspector-cta-btn" href="#projects">
          Inspect Flagship Projects ↓
        </a>
      `;
    }
  }

  // Bind mouse, click and keyboard events
  const centerEl = document.getElementById('node-saugat');
  if (centerEl) {
    centerEl.addEventListener('mouseenter', inspectCenter);
    centerEl.addEventListener('click', inspectCenter);
    centerEl.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        inspectCenter();
      }
    });
  }

  domainNodes.forEach(domain => {
    const el = document.getElementById(`node-${domain.id}`);
    if (el) {
      el.addEventListener('mouseenter', () => inspectDomain(domain));
      el.addEventListener('click', () => inspectDomain(domain));
      el.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          inspectDomain(domain);
        }
      });
    }
  });

  // Render Mobile Accessible Domain Cards
  if (mobileContainer) {
    mobileContainer.innerHTML = SIGNAL_MAP_DATA.domains.map(domain => `
      <div class="mobile-signal-domain-card">
        <h4>${domain.name}</h4>
        <span class="mono" style="font-size:11px; color:var(--acc); display:block; margin-bottom:6px;">${domain.short}</span>
        <p>${domain.description}</p>
        <div class="mobile-signal-pills">
          ${domain.connections.map(c => `
            <a class="inspector-pill-link" href="#${c.targetId}">
              <div>
                <strong>${c.name}</strong>
                <small style="display:block; color:var(--mute); font-size:11px;">${c.summary}</small>
              </div>
              <span style="color:var(--acc); font-size:12px;">↗</span>
            </a>
          `).join('')}
        </div>
      </div>
    `).join('');
  }

  inspectDomain(domainNodes[0]);
}

/* ==========================================================================
   8.6 GPU COMPUTING CONCEPTUAL EXPERIENCE CONTROLLER
   ========================================================================== */
function initGpuExperience() {
  const navContainer = document.querySelector('.rocm-flow-nav');
  const panel = document.getElementById('rocmFlowDetailPanel');
  if (!navContainer || !panel || !ROCM_FLOW_DATA) return;

  function setStep(idx) {
    const step = ROCM_FLOW_DATA[idx];
    if (!step) return;

    navContainer.querySelectorAll('.rocm-step-btn').forEach((btn, i) => {
      btn.classList.toggle('active', i === idx);
      btn.setAttribute('aria-selected', String(i === idx));
    });

    panel.classList.remove('panel-reveal');
    void panel.offsetWidth; // trigger reflow for smooth step transition
    panel.classList.add('panel-reveal');

    panel.innerHTML = `
      <span class="rocm-detail-badge">CURRICULUM MODULE ${step.step} / 05</span>
      <h4>${step.title}</h4>
      <div class="rocm-detail-headline">${step.headline}</div>
      <p>${step.detail}</p>
      <div style="margin-top:8px; display:flex; gap:12px; flex-wrap:wrap;">
        <a class="btn sm solid" href="https://developer.amd.com/rocm-certified/" target="_blank" rel="noopener noreferrer">
          AMD ROCm Official Docs ↗
        </a>
        <a class="btn sm outline-acc" href="#cert-amd-rocm">
          View Verified Credential ↑
        </a>
      </div>
    `;
  }

  navContainer.innerHTML = ROCM_FLOW_DATA.map((step, idx) => `
    <button type="button" class="rocm-step-btn ${idx === 0 ? 'active' : ''}" role="tab" aria-selected="${idx === 0 ? 'true' : 'false'}" data-rocm-step="${idx}">
      <span class="rocm-step-num">${step.step}</span>
      <span>${step.title}</span>
    </button>
  `).join('');

  navContainer.querySelectorAll('.rocm-step-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.rocmStep, 10);
      setStep(idx);
    });
  });

  setStep(0);
}

/* ==========================================================================
   9. MOBILE NAVIGATION DRAWER
   ========================================================================== */
function initMobileNav() {
  const toggleBtn = document.getElementById('mobileMenuToggle');
  const menu = document.getElementById('mobileMenu');
  if (!toggleBtn || !menu) return;

  function toggle(open) {
    const shouldOpen = open !== undefined ? open : !menu.classList.contains('open');
    menu.classList.toggle('open', shouldOpen);
    toggleBtn.classList.toggle('open', shouldOpen);
    toggleBtn.setAttribute('aria-expanded', String(shouldOpen));
    toggleBtn.setAttribute('aria-label', shouldOpen ? 'Close menu' : 'Open menu');
    document.body.classList.toggle('lock', shouldOpen);
  }

  toggleBtn.addEventListener('click', () => toggle());

  menu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      toggle(false);
    });
  });

  window.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menu.classList.contains('open')) toggle(false);
  });
}

/* ==========================================================================
   10. MARQUEE SCROLL CONTROLLER
   ========================================================================== */
function initMarquee() {
  const rows = [...document.querySelectorAll('.marquee-row')];
  if (!rows.length || prefersReduced) return;

  let ticking = false;

  function onScroll() {
    ticking = false;
    const h = window.innerHeight;

    rows.forEach(r => {
      const rc = r.getBoundingClientRect();
      const d = (rc.top + rc.height / 2 - h / 2) / h;
      const w = r.scrollWidth - window.innerWidth;
      const dir = parseFloat(r.dataset.d || '1');

      if (dir > 0) {
        r.style.transform = `translate3d(${-w * Math.max(0, Math.min(1, 0.5 - d * 0.9))}px, 0, 0)`;
      } else {
        r.style.transform = `translate3d(${-w * Math.max(0, Math.min(1, 0.5 + d * 0.9))}px, 0, 0)`;
      }

      r.classList.toggle('active', Math.abs(d) < 0.35);
    });
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onScroll);
    }
  }, { passive: true });

  onScroll();
}

/* ==========================================================================
   11. TERMINAL (SAUGAT.OS) — XSS Fixed, Escaped Inputs & Full Trapping
   ========================================================================== */
function initTerminal() {
  const term = document.getElementById('term');
  const out = document.getElementById('terminalOutput');
  const inp = document.getElementById('terminalInput');
  const openBtns = [document.getElementById('osNavBtn'), document.getElementById('osMobileBtn')].filter(Boolean);
  const closeBtn = document.getElementById('termCloseBtn');

  if (!term || !out || !inp) return;

  let history = [];
  let histIdx = 0;
  let isBooted = false;
  let prevFocus = null;

  // Safe HTML escape helper
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function printLine(html) {
    const line = document.createElement('div');
    line.innerHTML = html;
    out.appendChild(line);
    out.scrollTop = out.scrollHeight;
  }

  const COMMANDS = {
    help: () => `<span style="color:var(--acc)">SAUGAT.OS COMMAND DIRECTORY:</span>

<strong style="color:var(--ink)">PROFILE:</strong>
  whoami        - System persona & academic standing
  about         - Background & engineering focus
  skills        - Core languages, frameworks & platforms
  interests     - Off-duty interests & personal hobbies

<strong style="color:var(--ink)">ENGINEERING:</strong>
  projects      - Flagship systems (IMPOSTR, LUCERNA, DORMEX)
  signal        - Engineering Signal Map breakdown
  gpu           - AMD ROCm & GPU computing curriculum walkthrough
  impostr       - Inspect IMPOSTR threat analysis platform
  lucerna       - Inspect LUCERNA human-in-the-loop workstation
  dormex        - Inspect DORMEX hostel allocation engine
  clients       - Real commercial production sites

<strong style="color:var(--ink)">RECOGNITION:</strong>
  achievements  - SecLeaf CTF 2nd Place & HackaFest 3rd Place
  certifications- Verified credential collection (10 milestones)
  writing       - Technical Medium article on web forensics

<strong style="color:var(--ink)">CONNECT & SYSTEM:</strong>
  contact       - Direct email and phone
  social        - GitHub, LinkedIn & Medium profiles
  resume        - Download or open verified PDF resume
  neofetch      - System summary info
  clear         - Clear terminal console
  gui           - Exit terminal and return to page
  open &lt;id&gt;    - Jump to section (e.g. "open rocm", "open impostr")

<span style="color:var(--mute)">Type "help all" to display the full unformatted command dictionary.</span>`,

    "help all": () => `FULL COMMAND DIRECTORY:
  about, whoami, skills, interests, projects, certifications, signal, gpu,
  achievements, impostr, lucerna, dormex, clients, writing, resume,
  education, contact, social, neofetch, clear, gui, open <id>`,

    interests: () => `<span style="color:var(--bronze)">OFF-DUTY INTERESTS:</span>
  ✦ Singing & Jamming (Vocal & acoustic sessions)
  ✦ Badminton & Cricket (Campus sports)
  ✦ Systems Exploration (GPU computing, Linux kernels, CTF labs)`,

    about: () => `Saugat Rauniyar — Computer Science undergraduate at Siddaganga Institute of Technology
building intelligent software, cybersecurity forensics engines, and high-performance systems across
AI, threat intelligence, and GPU computing.`,

    whoami: () => `<span style="color:var(--acc)">SAUGAT RAUNIYAR</span>
Role: Software Engineer · Cybersecurity Builder · AI & GPU Developer
Institution: Siddaganga Institute of Technology (CSE @ SIT)
Academic Standing: Undergraduate CSE Candidate (2025 — 2029)
Focus: GPU-Accelerated AI, Web Threat Forensics, Heterogeneous Systems`,

    certifications: () => {
      const certCat = ACHIEVEMENTS.categories.find(c => c.name === "Certifications & Learning");
      if (!certCat || !certCat.items) return "No certifications found.";
      return `<span style="color:var(--bronze)">VERIFIED CREDENTIALS (10 Total Milestones):</span>\n\n` +
        certCat.items.map((c, i) => `[0${i + 1}] <span style="color:var(--acc)">${c.title}</span>\n     Issuer: ${c.organization} (${c.date})\n     Focus: ${c.summary}`).join('\n\n');
    },

    signal: () => `ENGINEERING SIGNAL MAP:
Central Core: SAUGAT RAUNIYAR
Interconnected Domains:
  1. CYBERSECURITY         -> IMPOSTR, SecLeaf CTF (2nd Place), Threat Forensics Paper
  2. ARTIFICIAL INTELLIGENCE -> LUCERNA Workstation, NLP Scanner, NVIDIA Jetson Edge AI Certificate
  3. GPU COMPUTING          -> AMD ROCm Certified Associate, ROCm Curriculum Flow, Edge AI Competency
  4. FULL-STACK ENGINEERING -> Capital Marketing, ShubhLabh Construction, SAUGAT.OS
  5. SYSTEMS & INFRASTRUCTURE -> DORMEX Platform, Scaler OS Course, AWS Developer Course`,

    gpu: () => `<span style="color:#f59e0b">AMD ROCm™ SOFTWARE APPLICATION DEVELOPMENT:</span>
Core Curriculum Modules:
  01. ROCm Environment & Setup (AMDKFD / ROCr / HSA Runtime)
  02. AMD GPU Architecture (CDNA / RDNA Compute Units & Matrix Cores)
  03. ROCm Libraries & Frameworks (MIOpen, rocBLAS, PyTorch / ONNX backends)
  04. HIP Programming & CUDA Porting (HIPIFY clang/perl conversion)
  05. Performance Optimization & Profiling (rocprof, Omnitrace & Roofline)`,

    skills: () => SKILLS_DATA.map(g => `<span style="color:var(--acc)">${g.category}</span>\n  ${g.skills.map(s => s.name).join(', ')}`).join('\n\n'),

    projects: () => `01 — IMPOSTR (Live · HackaFest 2026 3rd Place)
02 — LUCERNA (In development · Healthcare AI & Human-in-the-loop)
03 — DORMEX (In development · Student Hostel Management Platform)

More builds:
  - AI Quiz Generator
  - Vehicle Number Plate Detection / Parking System
  - ATM Management System
  - Obstacle Avoiding Robot
  - Student Portfolio Dashboard
  - Wearable SpO₂ Monitoring System

Type "impostr", "lucerna", or "dormex" for comprehensive specs.`,

    impostr: () => `<span style="color:var(--bronze)">IMPOSTR</span> — AI Threat Analysis Platform
Category: Cybersecurity · Threat Intelligence · AI
Award: 3rd Place — HackaFest 2026 (Biratnagar International College)
Telemetry: URLhaus, PhishTank, OpenPhish, crt.sh, DNS/WHOIS/SSL
Live Demo: <a href="https://impostr-virid.vercel.app/" target="_blank" rel="noopener">impostr-virid.vercel.app ↗</a>`,

    lucerna: () => `<span style="color:var(--acc)">LUCERNA</span> — Radiological Imaging Workstation
Category: Healthcare AI · Human-in-the-Loop Review
Status: In development
Notice: Prototype under development, not a clinically validated diagnostic product.
Focus: Clinician auditability, spatial confidence heatmaps, manual override ergonomics.`,

    dormex: () => `<span style="color:var(--acc)">DORMEX</span> — Campus Accommodation Engine
Category: Full-Stack · Workflow Automation · Student Services
Status: In development
Core: PostgreSQL partial unique index concurrency locks, server-authoritative turn scheduler.`,

    clients: () => `Capital Marketing: <a href="https://capitalmarketingnp.com" target="_blank" rel="noopener">capitalmarketingnp.com ↗</a>
ShubhLabh Construction: <a href="https://shubhlabhconstruction.com.np/" target="_blank" rel="noopener">shubhlabhconstruction.com.np ↗</a>`,

    achievements: () => `<span style="color:var(--silver)">2nd Place · SecLeaf Q4 Operations CTF 2026</span>
Team: Merp Era (Saugat Rauniyar, Prem Gopal Soni, Snehil Pandey)
Score: 7,407 points · 24-Hour International CTF (31 Oct – 1 Nov 2026)
Official Post: <a href="https://lnkd.in/p/gqNaKX9i" target="_blank" rel="noopener">lnkd.in/p/gqNaKX9i ↗</a>

<span style="color:var(--bronze)">3rd Place · HackaFest 2026</span>
Awarded by: Biratnagar International College
Project: IMPOSTR (Team CyberDNA)
Verified certificates and results available in the achievements archive.`,

    writing: () => `Medium Article: "From URL to Verdict: Constructing a Multi-Vector Web Threat Forensics Engine"
Read: <a href="https://medium.com/@saugat.rauniyar.work/from-url-to-verdict-constructing-a-multi-vector-web-threat-forensics-engine-c9eb4722d352" target="_blank" rel="noopener">medium.com/@saugat.rauniyar.work/... ↗</a>`,

    resume: () => `<a href="./assets/saugat-resume.pdf" target="_blank" rel="noopener">[OPEN RESUME PDF ↗]</a>  <a href="./assets/saugat-resume.pdf" download="Saugat_Rauniyar_Resume.pdf">[DOWNLOAD RESUME]</a>`,

    education: () => `Siddaganga Institute of Technology
  B.E. Computer Science and Engineering, 2025 — 2029 (Undergraduate Degree)

Shikshadeep Higher Secondary School, Biratnagar
  Science, 2023 — 2025, GPA 3.46 / 4.0

DAV School, Biratnagar
  Secondary, 2023, GPA 3.14 / 4.0`,

    contact: () => `Email: saugat.rauniyar.work@gmail.com
Phone: +91 8050812045
GitHub: github.com/saugat2737
LinkedIn: linkedin.com/in/saugat-rauniyar`,

    social: () => `GitHub: <a href="https://github.com/saugat2737" target="_blank" rel="noopener">github.com/saugat2737 ↗</a>
LinkedIn: <a href="https://www.linkedin.com/in/saugat-rauniyar" target="_blank" rel="noopener">linkedin.com/in/saugat-rauniyar ↗</a>
Medium: <a href="https://medium.com/@saugat.rauniyar.work/" target="_blank" rel="noopener">medium.com/@saugat.rauniyar.work/ ↗</a>`,

    neofetch: () => `SAUGAT
────────────────────
OS: SAUGAT.OS (AI × Cybersecurity Engineering Console)
Role: Software Engineer · Cybersecurity Builder · AI & GPU Developer
Focus: GPU Compute (AMD ROCm), Threat Forensics, Heterogeneous Systems
Education: CSE @ Siddaganga Institute of Technology
HackaFest: 3rd Place (Team CyberDNA)
SecLeaf CTF: 2nd Place (Team Merp Era, 7,407 pts)
Certifications: AMD ROCm, Scaler OS, NVIDIA, Anthropic, NASSCOM, Infosys (10 Total)
Status: Building & Exploring...`,

    gui: () => {
      closeTerminal();
      return '';
    },

    clear: () => {
      out.innerHTML = '';
      return '';
    }
  };

  function execute(raw) {
    const trimmed = raw.trim();
    if (!trimmed) return;
    history.push(trimmed);
    histIdx = history.length;

    // Safe command echo
    printLine(`<span style="color:var(--acc)">saugat@saugatrauniyar:~$</span> ${escapeHtml(trimmed)}`);

    const lower = trimmed.toLowerCase();

    // Handle "open <target>" navigation safely
    if (lower.startsWith('open ')) {
      const target = lower.slice(5).trim();
      const sectionMap = {
        impostr: 'projects',
        lucerna: 'projects',
        dormex: 'projects',
        projects: 'projects',
        signal: 'signal-map',
        map: 'signal-map',
        rocm: 'certifications',
        gpu: 'gpuComputeExperience',
        certifications: 'certifications',
        clients: 'clients',
        achievements: 'achievements',
        writing: 'writing',
        resume: 'skills-education',
        skills: 'skills-education',
        contact: 'contact'
      };

      if (sectionMap[target]) {
        printLine(`<span style="color:var(--mute)">Navigating to ${escapeHtml(target)}...</span>`);
        setTimeout(() => {
          closeTerminal();
          const el = document.getElementById(sectionMap[target]);
          if (el) el.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth' });
        }, 300);
        return;
      } else {
        printLine(`Target unknown: "${escapeHtml(target)}". Valid targets: projects, impostr, lucerna, dormex, clients, achievements, writing, resume, contact.`);
        return;
      }
    }

    if (COMMANDS[lower]) {
      const res = COMMANDS[lower]();
      if (res) printLine(res);
      return;
    }

    printLine(`Command not found: "${escapeHtml(trimmed)}". Type "help" to see valid commands.`);
  }

  function boot() {
    isBooted = true;
    printLine(`┌──────────────────────────────────────────────┐
│ <span style="color:var(--acc)">SAUGAT.OS (v2.6)</span>                             │
│ Interactive Portfolio Terminal Engine        │
│                                              │
│ Type "help" for command directory.           │
│ Type "gui" or press ESC to return.           │
└──────────────────────────────────────────────┘`);
  }

  function openTerminal() {
    prevFocus = document.activeElement;
    term.classList.add('open');
    term.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lock');
    if (!isBooted) boot();
    setTimeout(() => inp.focus(), 60);
  }

  function closeTerminal() {
    term.classList.remove('open');
    term.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lock');
    if (prevFocus) prevFocus.focus();
  }

  openBtns.forEach(btn => btn.addEventListener('click', openTerminal));
  if (closeBtn) closeBtn.addEventListener('click', closeTerminal);

  term.addEventListener('click', e => {
    if (e.target === term) closeTerminal();
  });

  window.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      term.classList.contains('open') ? closeTerminal() : openTerminal();
    }
    if (e.key === 'Escape' && term.classList.contains('open')) {
      closeTerminal();
    }
  });

  inp.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const val = inp.value;
      inp.value = '';
      execute(val);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (histIdx > 0) {
        histIdx--;
        inp.value = history[histIdx] || '';
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (histIdx < history.length - 1) {
        histIdx++;
        inp.value = history[histIdx] || '';
      } else {
        histIdx = history.length;
        inp.value = '';
      }
    }
  });

  // Focus trap inside terminal
  term.addEventListener('keydown', e => {
    if (e.key === 'Tab') {
      e.preventDefault();
      inp.focus();
    }
  });
}

/* ==========================================================================
   11. SR MONOGRAM CINEMATIC INTRO CONTROLLER
   ========================================================================== */
function initSrIntro() {
  const overlay = document.getElementById('srIntroOverlay');
  if (overlay) overlay.remove();
}

/* ==========================================================================
   12. REAL-TIME REEL / FLIP CLOCK CONTROLLER
   ========================================================================== */
function initReelClock() {
  // Clock simplified out for clean, uncluttered sticky navigation
}

/* ==========================================================================
   13. ACTIVE NAVIGATION SCROLL SPY
   ========================================================================== */
function initNavSpy() {
  const sections = document.querySelectorAll('section[id], header.hero[id]');
  const navLinks = document.querySelectorAll('.nav-links a');
  if (!sections.length || !navLinks.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          const href = link.getAttribute('href');
          if (href === `#${id}`) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    });
  }, { rootMargin: '-20% 0px -70% 0px' });

  sections.forEach(sec => observer.observe(sec));
}

/* ==========================================================================
   14. GLOBAL SCROLL PROGRESS & SCROLL-TO-TOP CONTROLLER
   ========================================================================== */
function initScrollProgressAndBackToTop() {
  const thumb = document.getElementById('scrollProgressThumb');
  const topBtn = document.getElementById('scrollToTopBtn');
  const nav = document.querySelector('nav');

  if (!thumb && !topBtn && !nav) return;

  let ticking = false;

  function update() {
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? Math.min(100, Math.max(0, (scrollY / docHeight) * 100)) : 0;

    if (thumb) {
      if (window.innerWidth <= 768) {
        thumb.style.width = `${progress}%`;
        thumb.style.height = '100%';
      } else {
        thumb.style.height = `${progress}%`;
        thumb.style.width = '100%';
      }
    }

    if (topBtn) {
      if (scrollY > 350) {
        topBtn.classList.add('visible');
      } else {
        topBtn.classList.remove('visible');
      }
    }

    if (nav) {
      if (scrollY > 40) {
        nav.classList.add('nav-scrolled');
      } else {
        nav.classList.remove('nav-scrolled');
      }
    }

    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });

  window.addEventListener('resize', () => {
    if (!ticking) {
      window.requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });

  if (topBtn) {
    topBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  // Initial call
  update();
}

/* ==========================================================================
   INITIALIZATION
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initNavSpy();
  initScrollProgressAndBackToTop();
  initScrollReveals();
  initHeroCanvas();
  initImpostrInteraction();
  initCaseStudyModal();
  initProofModal();
  initAchievementModal();
  initSkillsAccordion();
  initCertificatesRenderer();
  initSignalMap();
  initGpuExperience();
  initMobileNav();
  initMarquee();
  initTerminal();
});

