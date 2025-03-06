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
    { bpm: 80, beatsPerMeasure: 8, measures: 1, mute: true },
    { bpm: 120, beatsPerMeasure: 4, measures: 1, mute: false },
    { bpm: 144, beatsPerMeasure: 4, measures: 1, mute: false },
    { bpm: 160, beatsPerMeasure: 4, measures: 1, mute: false }
  ] : 
  // Production configuration
  [
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
let schedulerId;
let nextTickTime;
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
    
    // 新增: 為進度條添加點擊事件處理器
    bar.addEventListener('click', () => {
      jumpToSection(index);
    });
  });
}

// 新增: 跳轉至指定段落的函數
function jumpToSection(sectionIndex) {
  if (sectionIndex < 0 || sectionIndex >= sections.length) return;
  
  // 無論當前是否在播放，跳轉後都進入暫停狀態
  if (isRunning) {
    stopMetronome();
  }
  
  // 設置新的段落位置
  currentSection = sectionIndex;
  currentMeasure = 1;
  currentBeat = 1;
  
  // 更新顯示
  updateDisplay();
}

function updateDisplay() {
  const secData = sections[currentSection];
  sectionDisplay.textContent = `${currentSection + 1} / ${sections.length}`;
  bpmDisplay.textContent = secData.bpm;
  measureDisplay.textContent = `${currentMeasure} / ${secData.measures}`;
  beatDisplay.textContent = currentBeat;
  
  // 修改: 更新所有進度條，包括在停止狀態下
  for (let i = 0; i < sections.length; i++) {
    const fill = progressContainer.children[i].querySelector('.progress-fill');
    
    if (i < currentSection) {
      // 當前段落之前的段落總是顯示100%
      fill.style.width = '100%';
    } else if (i > currentSection) {
      // 當前段落之後的段落總是顯示0%
      fill.style.width = '0%';
    } else if (!isRunning) {
      // 停止狀態下當前段落顯示0%（表示準備從頭開始）
      fill.style.width = '0%';
    } else {
      // 運行狀態下當前段落根據進度顯示
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
  
  // 根據目前節拍計算下一拍時間，使用秒為單位
  nextTickTime += 60 / secData.bpm;
}

function scheduler() {
  // 若停止了，則不再調度
  if (!isRunning) return;
  
  // 確保音訊環境處於正常狀態
  if (audioCtx && audioCtx.state !== 'running') {
    audioCtx.resume().then(() => {
      if (isRunning) {
        schedulerId = requestAnimationFrame(scheduler);
      }
    });
    return;
  }
  
  // 當前時間超過等候時間則觸發 tick()
  if (audioCtx.currentTime >= nextTickTime) {
    tick();
  }
  
  schedulerId = requestAnimationFrame(scheduler);
}

function startMetronome() {
  if (isRunning) return;
  
  // 修正：確保在結束後可以重新播放
  if (currentSection >= sections.length) {
    currentSection = 0;
    currentMeasure = 1;
    currentBeat = 1;
  }
  
  isRunning = true;
  // 確保 audioCtx 已初始化
  if (!audioCtx) audioCtx = new AudioContext();
  else if (audioCtx.state === 'suspended') {
    // 如果音訊環境被暫停，嘗試恢復它
    audioCtx.resume();
  }
  
  // 設定 scheduler 的起始時間為當前音訊時間
  nextTickTime = audioCtx.currentTime;
  // 啟動 scheduler 循環
  schedulerId = requestAnimationFrame(scheduler);
  
  // 更新按鈕顯示
  startPauseBtn.textContent = '⏸️ 暫停';
  
  // 更新顯示
  updateDisplay();
}

function stopMetronome() {
  // 取消 scheduler 調度
  cancelAnimationFrame(schedulerId);
  isRunning = false;
  startPauseBtn.textContent = '▶️ 開始';
  
  // 馬上更新顯示，確保界面與暫停狀態一致
  updateDisplay();
}

function resetMetronome() {
  stopMetronome();
  currentSection = 0;
  currentMeasure = 1;
  currentBeat = 1;
  updateDisplay();
  
  // 確保重置後可以重新播放
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
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
  } else if (event.code === 'KeyR') {
    resetMetronome();
  }
});