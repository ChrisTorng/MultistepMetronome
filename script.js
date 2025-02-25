// 添加歌曲資訊
const songInfo = {
  title: "出水蓮"
};

// Can't be delete because this is the final settings
// const sections = [
//   { bpm: 80, beatsPerMeasure: 8, measures: 32, mute: false },
//   { bpm: 80, beatsPerMeasure: 8, measures: 3, mute: true },
//   { bpm: 120, beatsPerMeasure: 4, measures: 17, mute: false },
//   { bpm: 144, beatsPerMeasure: 4, measures: 17, mute: false },
//   { bpm: 160, beatsPerMeasure: 4, measures: 13, mute: false }
// ];

// For fast testing only
const sections = [
    { bpm: 80, beatsPerMeasure: 8, measures: 1, mute: false },
    { bpm: 80, beatsPerMeasure: 8, measures: 1, mute: true },
    { bpm: 120, beatsPerMeasure: 4, measures: 1, mute: false },
    { bpm: 144, beatsPerMeasure: 4, measures: 1, mute: false },
    { bpm: 160, beatsPerMeasure: 4, measures: 1, mute: false }
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

// 在頁面載入時顯示歌曲名稱
const songTitleElement = document.getElementById('songTitle');

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

  // 更新所有進度條
  for (let i = 0; i < sections.length; i++) {
    const fill = progressContainer.children[i].querySelector('.progress-fill');
    
    if (i < currentSection) {
      // 已完成的段落進度為100%
      fill.style.width = '100%';
    } else if (i > currentSection) {
      // 未開始的段落進度為0%
      fill.style.width = '0%';
    } else {
      // 當前段落顯示實際進度
      const totalBeats = secData.beatsPerMeasure * secData.measures;
      const completedBeats = (currentMeasure - 1) * secData.beatsPerMeasure + currentBeat;
      const percentage = (completedBeats / totalBeats) * 100;
      fill.style.width = `${percentage}%`;
    }
  }
}

function playBeat() {
  const secData = sections[currentSection];
  
  // 如果當前段落是靜音的，則不播放聲音
  if (secData.mute) return;
  
  if (!audioCtx) audioCtx = new AudioContext();
  
  // 創建更接近「嗒」聲的聲音
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  // 設置為更低的頻率
  osc.frequency.value = 440;
  
  // 設置快速衰減的音量包絡
  gain.gain.setValueAtTime(0.6, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  osc.start();
  osc.stop(audioCtx.currentTime + 0.08);
  
  document.body.classList.remove('flash');
  if (currentBeat === 1) {
    document.body.classList.add('flash');
  }
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
  
  // 使用當前段落的 BPM 計算下一次 tick 的時間間隔
  const nextTickTime = (60 / sections[currentSection].bpm) * 1000;
  intervalId = setTimeout(tick, nextTickTime);
}

function startMetronome() {
  if (isRunning) return;
  isRunning = true;
  // 移除固定間隔，使用當前段落的 BPM
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
  
  // 清空所有進度條
  document.querySelectorAll('.progress-fill').forEach(fill => {
    fill.style.width = '0%';
  });
  
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
  // 顯示歌曲名稱
  songTitleElement.textContent = songInfo.title;
  
  initProgressBars();
  resetMetronome(); // 改用 resetMetronome 代替 updateDisplay，確保進度條狀態正確
};