// Helpers de dibujo en <canvas>, sin librería de gráficos.
// Los colores se leen de las custom properties para seguir el modo claro/oscuro del sistema.
function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function setupCanvas(canvas, heightCss) {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.parentElement.clientWidth;
  canvas.width = w * dpr;
  canvas.height = heightCss * dpr;
  canvas.style.width = w + 'px';
  canvas.style.height = heightCss + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  return { ctx, w, h: heightCss };
}

function drawLineChart(canvas, points, opts = {}) {
  const color = opts.color || cssVar('--blue');
  const formatY = opts.formatY || ((v) => v);
  const formatX = opts.formatX || ((v) => v);
  const { ctx, w, h } = setupCanvas(canvas, 160);
  ctx.clearRect(0, 0, w, h);
  if (!points.length) return;

  const pad = { l: 46, r: 12, t: 16, b: 22 };
  const ys = points.map((p) => p.y);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const yRange = maxY - minY || 1;
  const plotW = w - pad.l - pad.r;
  const plotH = h - pad.t - pad.b;
  const xStep = points.length > 1 ? plotW / (points.length - 1) : 0;

  ctx.strokeStyle = cssVar('--separator');
  ctx.lineWidth = 1;
  [0, 1].forEach((f) => {
    const y = pad.t + plotH * f;
    ctx.beginPath();
    ctx.moveTo(pad.l, y);
    ctx.lineTo(w - pad.r, y);
    ctx.stroke();
  });

  ctx.fillStyle = cssVar('--label-2');
  ctx.font = '11px -apple-system, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(formatY(maxY), 2, pad.t + 4);
  ctx.fillText(formatY(minY), 2, pad.t + plotH + 2);

  const coords = points.map((p, i) => ({
    x: pad.l + i * xStep,
    y: pad.t + plotH - ((p.y - minY) / yRange) * plotH,
  }));

  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  coords.forEach((c, i) => (i === 0 ? ctx.moveTo(c.x, c.y) : ctx.lineTo(c.x, c.y)));
  ctx.stroke();

  ctx.fillStyle = color;
  coords.forEach((c) => {
    ctx.beginPath();
    ctx.arc(c.x, c.y, 3, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = cssVar('--label-2');
  ctx.font = '11px -apple-system, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(formatX(points[0].x), pad.l, h - 4);
  ctx.textAlign = 'right';
  ctx.fillText(formatX(points[points.length - 1].x), w - pad.r, h - 4);
}

function drawBarChart(canvas, bars, opts = {}) {
  const color = opts.color || cssVar('--green');
  const { ctx, w, h } = setupCanvas(canvas, 160);
  ctx.clearRect(0, 0, w, h);
  if (!bars.length) return;

  const pad = { l: 8, r: 8, t: 16, b: 20 };
  const maxV = Math.max(...bars.map((b) => b.value), 1);
  const plotW = w - pad.l - pad.r;
  const plotH = h - pad.t - pad.b;
  const gap = 8;
  const barW = (plotW - gap * (bars.length - 1)) / bars.length;

  ctx.font = '10px -apple-system, sans-serif';
  ctx.textAlign = 'center';
  bars.forEach((b, i) => {
    const x = pad.l + i * (barW + gap);
    const barH = Math.max((b.value / maxV) * plotH, 2);
    const y = pad.t + plotH - barH;
    ctx.fillStyle = color;
    roundRectPath(ctx, x, y, barW, barH, 4);
    ctx.fill();
    ctx.fillStyle = cssVar('--label-2');
    ctx.fillText(b.label, x + barW / 2, h - 5);
  });
}

function roundRectPath(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
