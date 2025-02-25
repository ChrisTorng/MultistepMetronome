const sections = [
  { bpm: 80, beatsPerMeasure: 8, measures: 32 },
  { bpm: 80, beatsPerMeasure: 8, measures: 3 },
  { bpm: 120, beatsPerMeasure: 4, measures: 17 },
  { bpm: 144, beatsPerMeasure: 4, measures: 17 },
  { bpm: 160, beatsPerMeasure: 4, measures: 13 }
];

let currentSection = 0;
let currentMeasure = 1;
let currentBeat = 1;
let isRunning = false;
let intervalId;
let audioCtx = null;

const sectionDisplay = document.getElementById('sectionDisplay');
const bpmDisplay = document.getElementById('bpmDisplay');
const measureDisplay = document.getElementById('measureDisplay');
const beatDisplay = document.getElementById('beatDisplay');
const progressContainer = document.getElementById('progressContainer');
const startPauseBtn = document.getElementById('startPauseBtn');
const resetBtn = document.getElementById('resetBtn');

function initProgressBars() {
  progressContainer.innerHTML = '';
  sections.forEach((sec, index) => {
    const bar = document.createElement('div');
    bar.classList.add('progress-bar');
    const fill = document.createElement('div');
    fill.classList.add('progress-fill');
    bar.appendChild(fill);
    progressContainer.appendChild(bar);
  });
}

function updateDisplay() {
  const secData = sections[currentSection];
  sectionDisplay.textContent = `${currentSection + 1} / ${sections.length}`;
  bpmDisplay.textContent = secData.bpm;
  measureDisplay.textContent = `${currentMeasure} / ${secData.measures}`;
  beatDisplay.textContent = currentBeat;

  const fill = progressContainer.children[currentSection].querySelector('.progress-fill');
  const totalBeats = secData.beatsPerMeasure * secData.measures;
  const completedBeats = (currentMeasure - 1) * secData.beatsPerMeasure + (currentBeat - 1);
  fill.style.width = `${(completedBeats / totalBeats) * 100}%`;
}

function playBeat() {
  if (!audioCtx) audioCtx = new AudioContext();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.frequency.value = 600;
  gain.gain.value = 0.5;
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  osc.start();
  osc.stop(audioCtx.currentTime + 0.05);
  
  document.body.classList.remove('flash');
  if (currentBeat === 1) {
    document.body.classList.add('flash');
  }
}

function tick() {
  playBeat();
  updateDisplay();
  
  const secData = sections[currentSection];
  
  if (currentBeat < secData.beatsPerMeasure) {
    currentBeat++;
  } else {
    currentBeat = 1;
    if (currentMeasure < secData.measures) {
      currentMeasure++;
    } else {
      currentMeasure = 1;
      currentSection++;
      if (currentSection >= sections.length) {
        stopMetronome();
        return;
      }
    }
  }
}

function startMetronome() {
  if (isRunning) return;
  isRunning = true;
  intervalId = setInterval(tick, (60 / sections[currentSection].bpm) * 1000);
}

function stopMetronome() {
  clearInterval(intervalId);
  isRunning = false;
  startPauseBtn.textContent = '開始';
}

function resetMetronome() {
  stopMetronome();
  currentSection = 0;
  currentMeasure = 1;
  currentBeat = 1;
  updateDisplay();
}

startPauseBtn.addEventListener('click', () => {
  if (!isRunning) {
    startMetronome();
    startPauseBtn.textContent = '暫停';
  } else {
    stopMetronome();
  }
});

resetBtn.addEventListener('click', resetMetronome);

window.onload = () => {
  initProgressBars();
  updateDisplay();
};