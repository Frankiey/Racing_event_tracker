<script define:vars={{ allGlobeEvents, seriesMeta, landPolygons: LAND_POLYGONS }}>
  // ═══ Season Passport — Interactive 3D Globe ═══
  // Renders a rotating Earth with continent outlines, atmospheric effects,
  // and event dots using Canvas 2D. No external dependencies.

  const canvas = document.getElementById('globe-canvas');
  const ctx = canvas.getContext('2d');
  const tooltip = document.getElementById('globe-tooltip');
  const panel = document.getElementById('event-panel-content');
  const statsEl = document.getElementById('globe-stats');

  // ── State ──
  let width, height, cx, cy, radius;
  let rotX = -0.3;
  let rotY = 0.4;
  let autoRotate = true;
  let scale = 1;
  let dragging = false;
  let lastMouse = { x: 0, y: 0 };
  let hoveredEvent = null;
  let selectedEvent = null;
  let activeFilter = 'all';
  let animFrame;
  let velocityX = 0, velocityY = 0;
  let lastInteraction = 0;

  let events = allGlobeEvents;
  const meta = seriesMeta;

  function filteredEvents() {
    if (activeFilter === 'all') return events;
    return events.filter(e => e.seriesId === activeFilter);
  }

  // ── Star field (generated once) ──
  const stars = Array.from({ length: 350 }, () => ({
    x: Math.random(),
    y: Math.random(),
    r: Math.random() * 1.3 + 0.2,
    a: Math.random() * 0.5 + 0.1,
    twinkleSpeed: Math.random() * 0.003 + 0.001,
    twinklePhase: Math.random() * Math.PI * 2,
  }));

  // ── Projection (spherical -> screen) ──
  function project(lat, lng) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);

    let x = Math.sin(phi) * Math.cos(theta);
    let y = Math.cos(phi);
    let z = Math.sin(phi) * Math.sin(theta);

    // Rotate around Y axis (longitude)
    const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
    const x1 = x * cosY - z * sinY;
    const z1 = x * sinY + z * cosY;

    // Rotate around X axis (latitude tilt)
    const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
    const y1 = y * cosX - z1 * sinX;
    const z2 = y * sinX + z1 * cosX;

    return {
      x: cx + x1 * radius * scale,
      y: cy - y1 * radius * scale,
      z: z2,
      visible: z2 > -0.05,
    };
  }

  // ══════════════════════════════════════════════
  //  RENDERING LAYERS
  // ══════════════════════════════════════════════

  // ── 1. Star field ──
  function drawStars() {
    const t = Date.now();
    const rSafe = radius * scale + 6;
    for (const s of stars) {
      const sx = s.x * width;
      const sy = s.y * height;
      const dx = sx - cx, dy = sy - cy;
      if (dx * dx + dy * dy < rSafe * rSafe) continue;
      const twinkle = Math.sin(t * s.twinkleSpeed + s.twinklePhase) * 0.35 + 0.65;
      ctx.beginPath();
      ctx.arc(sx, sy, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(180, 200, 255, ${s.a * twinkle})`;
      ctx.fill();
    }
  }

  // ── 2. Atmosphere outer glow ──
  function drawAtmosphere() {
    const r = radius * scale;
    // Soft blue-white halo
    const grad = ctx.createRadialGradient(cx, cy, r * 0.96, cx, cy, r * 1.25);
    grad.addColorStop(0, 'rgba(80, 150, 255, 0.18)');
    grad.addColorStop(0.35, 'rgba(60, 130, 240, 0.08)');
    grad.addColorStop(0.7, 'rgba(40, 100, 200, 0.03)');
    grad.addColorStop(1, 'rgba(30, 80, 180, 0)');
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.25, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
  }

  // ── 3. Globe sphere (ocean) ──
  function drawOcean() {
    const r = radius * scale;
    // Deep blue ocean with directional lighting from upper-left
    const grad = ctx.createRadialGradient(
      cx - r * 0.3, cy - r * 0.3, r * 0.05,
      cx + r * 0.15, cy + r * 0.15, r
    );
    grad.addColorStop(0, '#1a3d5c');
    grad.addColorStop(0.4, '#122d4a');
    grad.addColorStop(0.7, '#0d2038');
    grad.addColorStop(1, '#091528');
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Subtle blue edge ring
    ctx.strokeStyle = 'rgba(80, 150, 255, 0.12)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // ── 4. Land masses ──
  function drawLand() {
    const r = radius * scale;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();

    for (const poly of landPolygons) {
      const projected = poly.map(([lat, lng]) => project(lat, lng));

      // Split into front-face visible segments
      const segments = [];
      let seg = [];
      for (const p of projected) {
        if (p.z > -0.15) {
          seg.push(p);
        } else {
          if (seg.length >= 3) segments.push(seg);
          seg = [];
        }
      }
      if (seg.length >= 3) segments.push(seg);

      for (const s of segments) {
        ctx.beginPath();
        ctx.moveTo(s[0].x, s[0].y);
        for (let i = 1; i < s.length; i++) {
          ctx.lineTo(s[i].x, s[i].y);
        }
        ctx.closePath();

        // Land fill — dark earthy green-gray
        ctx.fillStyle = '#1c2e25';
        ctx.fill();

        // Subtle coastline
        ctx.strokeStyle = 'rgba(70, 120, 90, 0.45)';
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // ── 5. Graticule (grid lines) ──
  function drawGraticule() {
    ctx.strokeStyle = 'rgba(50, 100, 150, 0.10)';
    ctx.lineWidth = 0.4;

    // Latitude lines every 30°
    for (let lat = -60; lat <= 60; lat += 30) {
      ctx.beginPath();
      let first = true;
      for (let lng = -180; lng <= 180; lng += 3) {
        const p = project(lat, lng);
        if (!p.visible) { first = true; continue; }
        if (first) { ctx.moveTo(p.x, p.y); first = false; }
        else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }

    // Longitude lines every 30°
    for (let lng = -180; lng < 180; lng += 30) {
      ctx.beginPath();
      let first = true;
      for (let lat = -90; lat <= 90; lat += 3) {
        const p = project(lat, lng);
        if (!p.visible) { first = true; continue; }
        if (first) { ctx.moveTo(p.x, p.y); first = false; }
        else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }
  }

  // ── 6. Series route lines ──
  function drawRoutes() {
    const filtered = filteredEvents();
    const bySeries = {};
    for (const e of filtered) {
      if (!bySeries[e.seriesId]) bySeries[e.seriesId] = [];
      bySeries[e.seriesId].push(e);
    }

    for (const [sid, sevents] of Object.entries(bySeries)) {
      const sorted = sevents.sort((a, b) => a.round - b.round);
      const color = meta[sid]?.color ?? '#71717a';
      ctx.strokeStyle = color + '25';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      let first = true;
      for (const e of sorted) {
        const p = project(e.lat, e.lng);
        if (!p.visible) { first = true; continue; }
        if (first) { ctx.moveTo(p.x, p.y); first = false; }
        else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  // ── 7. Event dots ──
  function drawDots() {
    const filtered = filteredEvents();

    const projected = filtered.map(e => ({ ...e, p: project(e.lat, e.lng) }))
      .filter(e => e.p.visible)
      .sort((a, b) => a.p.z - b.p.z);

    // Find next race per series
    const nextRace = {};
    for (const e of filtered) {
      if (e.isPast) continue;
      if (!nextRace[e.seriesId] || e.dateStart < nextRace[e.seriesId].dateStart) {
        nextRace[e.seriesId] = e;
      }
    }

    for (const e of projected) {
      const color = meta[e.seriesId]?.color ?? '#71717a';
      const isNext = nextRace[e.seriesId]?.id === e.id;
      const isHovered = hoveredEvent?.id === e.id;
      const isSelected = selectedEvent?.id === e.id;
      const dotRadius = isHovered || isSelected ? 7 : isNext ? 6 : 4;

      // Drop shadow for depth
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = 3;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;

      if (e.isPast) {
        ctx.beginPath();
        ctx.arc(e.p.x, e.p.y, dotRadius, 0, Math.PI * 2);
        ctx.fillStyle = color + '90';
        ctx.fill();
      } else if (isNext) {
        // Pulsing glow for next race
        const pulse = Math.sin(Date.now() / 400) * 0.3 + 0.7;
        ctx.shadowColor = color;
        ctx.shadowBlur = 15;
        // Outer glow ring
        ctx.beginPath();
        ctx.arc(e.p.x, e.p.y, dotRadius + 5, 0, Math.PI * 2);
        ctx.fillStyle = color + Math.round(pulse * 35).toString(16).padStart(2, '0');
        ctx.fill();
        // Solid dot
        ctx.beginPath();
        ctx.arc(e.p.x, e.p.y, dotRadius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else {
        // Hollow ring — upcoming
        ctx.beginPath();
        ctx.arc(e.p.x, e.p.y, dotRadius, 0, Math.PI * 2);
        ctx.strokeStyle = color + '80';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Reset shadow
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // Selection ring
      if (isHovered || isSelected) {
        ctx.beginPath();
        ctx.arc(e.p.x, e.p.y, dotRadius + 3, 0, Math.PI * 2);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    return projected;
  }

  // ── 8. Specular highlight (3D depth) ──
  function drawSpecular() {
    const r = radius * scale;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();

    // Upper-left highlight spot
    const grad = ctx.createRadialGradient(
      cx - r * 0.38, cy - r * 0.4, 0,
      cx - r * 0.2, cy - r * 0.2, r * 0.6
    );
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.07)');
    grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.025)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  // ── 9. Limb darkening + atmospheric edge ──
  function drawLimb() {
    const r = radius * scale;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();

    // Darkening at edges (limb effect)
    const grad = ctx.createRadialGradient(cx, cy, r * 0.55, cx, cy, r);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(0.8, 'rgba(0, 8, 25, 0.12)');
    grad.addColorStop(0.95, 'rgba(0, 10, 35, 0.30)');
    grad.addColorStop(1, 'rgba(0, 10, 40, 0.45)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Atmospheric blue edge
    const atmo = ctx.createRadialGradient(cx, cy, r * 0.92, cx, cy, r);
    atmo.addColorStop(0, 'rgba(60, 140, 255, 0)');
    atmo.addColorStop(0.7, 'rgba(60, 140, 255, 0.02)');
    atmo.addColorStop(1, 'rgba(80, 160, 255, 0.08)');
    ctx.fillStyle = atmo;
    ctx.fillRect(0, 0, width, height);

    ctx.restore();
  }

  // ══════════════════════════════════════════════
  //  MAIN RENDER LOOP
  // ══════════════════════════════════════════════

  let projected = [];
  function render() {
    resize();
    ctx.clearRect(0, 0, width, height);

    drawStars();
    drawAtmosphere();
    drawOcean();
    drawLand();
    drawGraticule();
    drawRoutes();
    projected = drawDots();
    drawSpecular();
    drawLimb();

    // Physics: momentum + auto-rotate
    if (!dragging) {
      if (Math.abs(velocityX) > 0.0001 || Math.abs(velocityY) > 0.0001) {
        rotY += velocityX;
        rotX += velocityY;
        rotX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotX));
        velocityX *= 0.94;
        velocityY *= 0.94;
      }
      // Auto-resume rotation after 5s idle
      if (!autoRotate && Date.now() - lastInteraction > 5000) {
        autoRotate = true;
      }
      if (autoRotate) {
        rotY += 0.002;
      }
    }

    animFrame = requestAnimationFrame(render);
  }

  // ── Resize handler ──
  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    width = rect.width;
    height = rect.height;
    cx = width / 2;
    cy = height / 2;
    radius = Math.min(width, height) * 0.38;
  }

  // ══════════════════════════════════════════════
  //  INTERACTIONS
  // ══════════════════════════════════════════════

  function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    return { x, y };
  }

  function findNearestDot(mx, my) {
    let best = null;
    let bestDist = 20;
    for (const e of projected) {
      const dx = e.p.x - mx;
      const dy = e.p.y - my;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < bestDist) {
        bestDist = dist;
        best = e;
      }
    }
    return best;
  }

  // ── Mouse ──
  canvas.addEventListener('mousedown', (e) => {
    dragging = true;
    autoRotate = false;
    lastInteraction = Date.now();
    lastMouse = getMousePos(e);
    velocityX = 0;
    velocityY = 0;
    canvas.style.cursor = 'grabbing';
  });

  window.addEventListener('mousemove', (e) => {
    const pos = getMousePos(e);
    if (dragging) {
      const dx = pos.x - lastMouse.x;
      const dy = pos.y - lastMouse.y;
      // Fixed: natural drag direction — surface follows your finger
      rotY -= dx * 0.005;
      rotX += dy * 0.005;
      rotX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotX));
      velocityX = -dx * 0.005;
      velocityY = dy * 0.005;
      lastMouse = pos;
    } else {
      // Hover detection
      const near = findNearestDot(pos.x, pos.y);
      hoveredEvent = near;
      canvas.style.cursor = near ? 'pointer' : 'grab';

      if (near) {
        const color = meta[near.seriesId]?.color ?? '#71717a';
        const label = meta[near.seriesId]?.shortLabel ?? near.seriesId;
        const dateStr = new Date(near.dateStart + 'T12:00:00Z').toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        tooltip.innerHTML = `
          <div class="flex items-center gap-1.5 mb-1">
            <span class="w-2 h-2 rounded-full" style="background:${color}"></span>
            <span class="text-[10px] font-bold uppercase tracking-wide" style="color:${color}">${label}</span>
            <span class="text-[10px] text-zinc-600 font-mono">R${near.round}</span>
          </div>
          <p class="text-sm font-semibold text-zinc-100">${near.name}</p>
          <p class="text-xs text-zinc-400">${near.circuit}</p>
          <p class="text-[10px] text-zinc-500 mt-1">${dateStr} · ${near.country}</p>
        `;
        tooltip.style.left = Math.min(pos.x + 12, width - 260) + 'px';
        tooltip.style.top = (pos.y - 10) + 'px';
        tooltip.classList.remove('hidden');
      } else {
        tooltip.classList.add('hidden');
      }
    }
  });

  window.addEventListener('mouseup', () => {
    if (dragging) {
      dragging = false;
      lastInteraction = Date.now();
      canvas.style.cursor = hoveredEvent ? 'pointer' : 'grab';
    }
  });

  // ── Touch ──
  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      dragging = true;
      autoRotate = false;
      lastInteraction = Date.now();
      lastMouse = getMousePos(e);
      velocityX = 0;
      velocityY = 0;
    }
  }, { passive: true });

  canvas.addEventListener('touchmove', (e) => {
    if (dragging && e.touches.length === 1) {
      const pos = getMousePos(e);
      const dx = pos.x - lastMouse.x;
      const dy = pos.y - lastMouse.y;
      rotY -= dx * 0.005;
      rotX += dy * 0.005;
      rotX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotX));
      velocityX = -dx * 0.005;
      velocityY = dy * 0.005;
      lastMouse = pos;
    }
  }, { passive: true });

  canvas.addEventListener('touchend', () => {
    dragging = false;
    lastInteraction = Date.now();
  });

  // ── Click to select ──
  canvas.addEventListener('click', (e) => {
    const pos = getMousePos(e);
    const near = findNearestDot(pos.x, pos.y);
    if (near) {
      selectedEvent = near;
      showEventPanel(near);
    }
  });

  // ── Zoom ──
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    scale *= e.deltaY > 0 ? 0.95 : 1.05;
    scale = Math.max(0.5, Math.min(3, scale));
    lastInteraction = Date.now();
    autoRotate = false;
  }, { passive: false });

  document.getElementById('globe-zoom-in').addEventListener('click', () => {
    scale = Math.min(3, scale * 1.15);
    lastInteraction = Date.now();
  });
  document.getElementById('globe-zoom-out').addEventListener('click', () => {
    scale = Math.max(0.5, scale * 0.85);
    lastInteraction = Date.now();
  });
  document.getElementById('globe-reset').addEventListener('click', () => {
    scale = 1;
    rotX = -0.3;
    rotY = 0.4;
    autoRotate = true;
    velocityX = 0;
    velocityY = 0;
    selectedEvent = null;
    panel.innerHTML = '<p class="text-sm text-zinc-600 text-center">Click a dot on the globe to see event details</p>';
  });

  // ══════════════════════════════════════════════
  //  EVENT PANEL
  // ══════════════════════════════════════════════

  function showEventPanel(e) {
    const color = meta[e.seriesId]?.color ?? '#71717a';
    const label = meta[e.seriesId]?.label ?? e.seriesId;
    const shortLabel = meta[e.seriesId]?.shortLabel ?? e.seriesId;
    const dateRange = formatDateRange(e.dateStart, e.dateEnd);
    const status = e.isPast ? 'Completed' : 'Upcoming';
    const statusClass = e.isPast ? 'bg-zinc-800 text-zinc-500' : '';

    let flag = '';
    if (e.countryCode && e.countryCode.length === 2) {
      const base = 0x1F1E6 - 0x41;
      flag = String.fromCodePoint(
        e.countryCode.toUpperCase().charCodeAt(0) + base,
        e.countryCode.toUpperCase().charCodeAt(1) + base
      );
    }

    panel.innerHTML = `
      <div class="w-full">
        <div class="flex items-center gap-2 mb-3">
          <span class="inline-block rounded font-bold uppercase tracking-wide text-white text-xs px-2 py-0.5" style="background:${color}">${shortLabel}</span>
          <span class="text-xs text-zinc-500 font-mono">Round ${e.round}</span>
          <span class="text-xs px-2 py-0.5 rounded-full font-semibold ${statusClass}" ${!e.isPast ? `style="background:${color}20;color:${color}"` : ''}>${status}</span>
        </div>

        <h3 class="text-xl font-black text-zinc-100 tracking-tight leading-tight mb-2">${e.name}</h3>

        <div class="space-y-3 mt-4">
          <div class="flex items-start gap-3">
            <svg class="w-4 h-4 text-zinc-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0 1 15 0Z"/>
            </svg>
            <div>
              <p class="text-sm font-medium text-zinc-200">${e.circuit}</p>
              <p class="text-xs text-zinc-500">${[e.city, e.country].filter(Boolean).join(', ')}</p>
            </div>
          </div>

          <div class="flex items-start gap-3">
            ${flag ? `<span class="text-lg leading-none mt-0.5">${flag}</span>` : `<svg class="w-4 h-4 text-zinc-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5"/></svg>`}
            <div>
              <p class="text-sm text-zinc-300">${e.country}</p>
            </div>
          </div>

          <div class="flex items-start gap-3">
            <svg class="w-4 h-4 text-zinc-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"/>
            </svg>
            <div>
              <p class="text-sm text-zinc-300">${dateRange}</p>
            </div>
          </div>

          <div class="flex items-start gap-3">
            <svg class="w-4 h-4 text-zinc-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z"/>
            </svg>
            <div>
              <p class="text-xs text-zinc-500 font-mono">${e.lat.toFixed(3)}, ${e.lng.toFixed(3)}</p>
            </div>
          </div>
        </div>

        <div class="mt-5 pt-4 border-t border-zinc-800/60">
          <button class="globe-open-modal text-xs font-medium px-3 py-2 rounded-lg border border-zinc-700/60 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors w-full" data-event-id="${e.id}">
            View full event details →
          </button>
        </div>
      </div>
    `;

    const btn = panel.querySelector('.globe-open-modal');
    if (btn) {
      btn.addEventListener('click', () => {
        const fullEvent = (window).__passportFullEvents?.find(ev => ev.id === e.id);
        if (fullEvent) {
          window.dispatchEvent(new CustomEvent('rt-open-event', { detail: fullEvent }));
        }
      });
    }
  }

  function formatDateRange(start, end) {
    const s = new Date(start + 'T12:00:00Z');
    const e = new Date(end + 'T12:00:00Z');
    const opts = { month: 'short', day: 'numeric' };
    if (start === end) return s.toLocaleDateString(undefined, opts);
    if (s.getMonth() === e.getMonth()) {
      return `${s.toLocaleDateString(undefined, opts)} – ${e.getDate()}`;
    }
    return `${s.toLocaleDateString(undefined, opts)} – ${e.toLocaleDateString(undefined, opts)}`;
  }

  // ══════════════════════════════════════════════
  //  FILTER + STATS
  // ══════════════════════════════════════════════

  document.querySelectorAll('.passport-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;
      activeFilter = filter;
      selectedEvent = null;
      panel.innerHTML = '<p class="text-sm text-zinc-600 text-center">Click a dot on the globe to see event details</p>';

      document.querySelectorAll('.passport-filter-btn').forEach(b => {
        if (b.dataset.filter === filter) {
          b.classList.add('bg-zinc-800', 'text-zinc-200', 'border-zinc-700');
          b.classList.remove('text-zinc-500', 'border-zinc-800');
        } else {
          b.classList.remove('bg-zinc-800', 'text-zinc-200', 'border-zinc-700');
          b.classList.add('text-zinc-500', 'border-zinc-800');
        }
      });

      updateStats();
    });
  });

  function updateStats() {
    const filtered = filteredEvents();
    const done = filtered.filter(e => e.isPast).length;
    const total = filtered.length;
    const countries = new Set(filtered.map(e => e.country)).size;
    const circuits = new Set(filtered.map(e => e.circuit)).size;

    statsEl.innerHTML = `
      <div>${done}/${total} rounds</div>
      <div>${countries} countries</div>
      <div>${circuits} circuits</div>
    `;
  }

  // ── Init ──
  updateStats();
  render();
</script>

<script>
  import calendarData from '../../data/gold/calendar.json';
  (window as any).__passportFullEvents = (calendarData as any).events;
</script>
