const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const clearBtn = document.getElementById('clearBtn');
const statusText = document.getElementById('statusText');
const sampleCountEl = document.getElementById('sampleCount');
const avgXEl = document.getElementById('avgX');
const avgYEl = document.getElementById('avgY');
const heatmapCanvas = document.getElementById('heatmapCanvas');
const gazeDot = document.getElementById('gazeDot');
const ctx = heatmapCanvas.getContext('2d');

let isTracking = false;
let sampleCount = 0;
let sumX = 0;
let sumY = 0;

function resizeCanvas() {
  heatmapCanvas.width = window.innerWidth;
  heatmapCanvas.height = window.innerHeight;
}

function setStatus(text) {
  statusText.textContent = text;
}

function drawHeatPoint(x, y) {
  const gradient = ctx.createRadialGradient(x, y, 4, x, y, 40);
  gradient.addColorStop(0, 'rgba(255, 90, 122, 0.35)');
  gradient.addColorStop(1, 'rgba(255, 90, 122, 0)');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, 40, 0, Math.PI * 2);
  ctx.fill();
}

function updateMetrics(x, y) {
  sampleCount += 1;
  sumX += x;
  sumY += y;

  sampleCountEl.textContent = String(sampleCount);
  avgXEl.textContent = (sumX / sampleCount).toFixed(0);
  avgYEl.textContent = (sumY / sampleCount).toFixed(0);
}

function resetMetrics() {
  sampleCount = 0;
  sumX = 0;
  sumY = 0;
  sampleCountEl.textContent = '0';
  avgXEl.textContent = '0';
  avgYEl.textContent = '0';
}

async function startTracking() {
  if (!window.webgazer) {
    setStatus('Ошибка: библиотека WebGazer не загружена.');
    return;
  }

  try {
    await window.webgazer
      .setRegression('ridge')
      .setGazeListener((data) => {
        if (!isTracking || !data) {
          return;
        }

        const x = Math.max(0, Math.min(window.innerWidth, data.x));
        const y = Math.max(0, Math.min(window.innerHeight, data.y));

        gazeDot.style.display = 'block';
        gazeDot.style.left = `${x}px`;
        gazeDot.style.top = `${y}px`;

        drawHeatPoint(x, y);
        updateMetrics(x, y);
      })
      .begin();

    window.webgazer.showVideoPreview(true).showPredictionPoints(false);

    isTracking = true;
    setStatus('Трекинг запущен. Смотрите на макет рекламы.');
    startBtn.disabled = true;
    stopBtn.disabled = false;
    clearBtn.disabled = false;
  } catch (error) {
    setStatus(`Не удалось запустить трекинг: ${error.message}`);
  }
}

function stopTracking() {
  if (!window.webgazer) {
    return;
  }

  isTracking = false;
  gazeDot.style.display = 'none';
  window.webgazer.pause();

  setStatus('Трекинг остановлен. Можно снова запустить.');
  startBtn.disabled = false;
  stopBtn.disabled = true;
}

function clearHeatmap() {
  ctx.clearRect(0, 0, heatmapCanvas.width, heatmapCanvas.height);
  resetMetrics();
  setStatus('Теплокарта и метрики очищены.');
}

window.addEventListener('resize', resizeCanvas);
startBtn.addEventListener('click', startTracking);
stopBtn.addEventListener('click', stopTracking);
clearBtn.addEventListener('click', clearHeatmap);

window.addEventListener('beforeunload', () => {
  if (window.webgazer) {
    window.webgazer.end();
  }
});

resizeCanvas();
