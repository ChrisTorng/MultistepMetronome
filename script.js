// Song information
const songInfo = {
  title: "出水蓮"
};

// Choose configuration based on environment
// Check if running in local development environment
const isLocalDevelopment = window.location.hostname === 'localhost' || 
                          window.location.hostname === '127.0.0.1' ||
                          window.location.protocol === 'file:';

// Select appropriate configuration
const sections = isLocalDevelopment ? 
  // Quick test configuration
  [
    { bpm: 80, beatsPerMeasure: 8, measures: 1, mute: false },
    { bpm: 80, beatsPerMeasure: 8, measures: 1, mute: false },
    { bpm: 80, beatsPerMeasure: 8, measures: 1, mute: true },
    { bpm: 120, beatsPerMeasure: 4, measures: 1, mute: false },
    { bpm: 144, beatsPerMeasure: 4, measures: 1, mute: false },
    { bpm: 160, beatsPerMeasure: 4, measures: 1, mute: false }
  ] : 
  // Production configuration
  [
    { bpm: 80, beatsPerMeasure: 8, measures: 2, mute: false },
    { bpm: 80, beatsPerMeasure: 8, measures: 32, mute: false },
    { bpm: 80, beatsPerMeasure: 8, measures: 3, mute: true },
    { bpm: 120, beatsPerMeasure: 4, measures: 17, mute: false },
    { bpm: 144, beatsPerMeasure: 4, measures: 17, mute: false },
    { bpm: 160, beatsPerMeasure: 4, measures: 13, mute: false }
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

// Display song title on page load
const songTitleElement = document.getElementById('songTitle');

function initProgressBars() {
  progressContainer.innerHTML = '';
  sections.forEach((sec, index) => {
    const bar = document.createElement('div');
    bar.classList.add('progress-bar');
    if (sec.mute) {
      bar.classList.add('mute');
    }
    const fill = document.createElement('div');
    fill.classList.add('progress-fill');
    fill.style.width = '0'; // Ensure initial width is 0
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
  
  // Update all progress bars
  for (let i = 0; i < sections.length; i++) {
    const fill = progressContainer.children[i].querySelector('.progress-fill');
    
    if (!isRunning) {
      // When stopped, all progress bars should be 0
      fill.style.width = '0%';
    } else if (i < currentSection) {
      fill.style.width = '100%';
    } else if (i > currentSection) {
      fill.style.width = '0%';
    } else {
      const totalBeats = secData.beatsPerMeasure * secData.measures;
      const completedBeats = (currentMeasure - 1) * secData.beatsPerMeasure + (currentBeat - 0);
      const percentage = (completedBeats / totalBeats) * 100;
      fill.style.width = `${percentage}%`;
    }
  }
}

function playBeat() {
  const secData = sections[currentSection];
  
  document.body.classList.remove('flash');
  if (currentBeat === 1) {
    document.body.classList.add('flash');
  }
  
  // Skip sound if current section is muted
  if (secData.mute) return;
  
  if (!audioCtx) audioCtx = new AudioContext();
  
  // Create a more "tick" like sound
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  // Set to lower frequency
  osc.frequency.value = 440;
  
  // Set quick decay envelope
  gain.gain.setValueAtTime(0.6, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  osc.start();
  osc.stop(audioCtx.currentTime + 0.08);
}

function tick() {
  if (!isRunning) return;
  
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
  
  // Calculate next tick interval based on current section's BPM
  const nextTickTime = (60 / sections[currentSection].bpm) * 1000;
  intervalId = setTimeout(tick, nextTickTime);
}

function startMetronome() {
  if (isRunning) return;
  
  // Restart from beginning if reached the end
  if (currentSection >= sections.length) {
    resetMetronome();
  }
  
  isRunning = true;
  tick();
}

function stopMetronome() {
  clearTimeout(intervalId);
  isRunning = false;
  startPauseBtn.textContent = '▶️ 開始';
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
    startPauseBtn.textContent = '⏸️ 暫停';
  } else {
    stopMetronome();
  }
});

resetBtn.addEventListener('click', resetMetronome);

window.onload = () => {
  // Display song title
  songTitleElement.textContent = songInfo.title;
  document.title = `${songInfo.title} - 多步驟節拍器`;
  
  // Initialize progress bars
  initProgressBars();
  
  // Reset all counters and progress
  resetMetronome();
};

// Add keyboard shortcuts
document.addEventListener('keydown', (event) => {
  if (event.code === 'Space') {
    event.preventDefault(); // 防止空白鍵捲動頁面
    if (!isRunning) {
      startMetronome();
      startPauseBtn.textContent = '⏸️ 暫停';
    } else {
      stopMetronome();
    }
  } else if (event.key.toLowerCase() === 'r') {
    resetMetronome();
  }
});