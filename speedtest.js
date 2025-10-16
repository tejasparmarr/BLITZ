const $ = s => document.querySelector(s);

// Configuration - UPDATE THIS AFTER DEPLOYMENT
const API_BASE = 'https://blitz-backend-wdwl.onrender.com'; // Change to your Render URL in production

let isTesting = false;
let testHistory = [];

// Utility functions
function formatBytes(bytes) {
  if (bytes == null || isNaN(bytes)) return '—';
  const u = ['B', 'KB', 'MB', 'GB'];
  let i = 0, v = bytes;
  while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${u[i]}`;
}

function formatSpeed(bytesPerSecond) {
  const mbps = (bytesPerSecond * 8) / 1000000;
  return mbps.toFixed(1);
}

// Load history from localStorage
function loadHistory() {
  const saved = localStorage.getItem('blitz_speedtest_history');
  if (saved) {
    try {
      testHistory = JSON.parse(saved);
      renderHistory();
    } catch (e) {
      console.error('Failed to load history:', e);
      testHistory = [];
    }
  }
}

// Save history to localStorage
function saveHistory() {
  try {
    localStorage.setItem('blitz_speedtest_history', JSON.stringify(testHistory));
  } catch (e) {
    console.error('Failed to save history:', e);
  }
}

// Render test history
function renderHistory() {
  const container = $('#testHistory');
  if (!container) return;

  if (testHistory.length === 0) {
    container.innerHTML = '<p class="empty-state">No tests yet. Start a test to see results here.</p>';
    return;
  }

  container.innerHTML = testHistory.map(test => `
    <div class="history-item">
      <div class="history-speeds">
        <span>⬇️ ${test.download}</span>
        <span>⬆️ ${test.upload}</span>
        <span>📡 ${test.ping}</span>
      </div>
      <div class="history-time">${test.time}</div>
    </div>
  `).join('');
}

// Update UI elements
function setProgress(percent) {
  const bar = $('#progressBar');
  if (bar) bar.style.width = `${Math.max(0, Math.min(100, percent))}%`;
}

function setStatus(text) {
  const status = $('#statusLine');
  if (status) status.textContent = text;
}

function setTestStatus(text) {
  const testStatus = $('#testStatus');
  if (testStatus) testStatus.textContent = text;
}

function setCurrentSpeed(speed) {
  const display = $('#currentSpeed');
  if (display) display.textContent = speed.toFixed(1);
  
  // Animate needle (0-180 degrees, max speed 1000 Mbps = 1 Gbps)
  const needle = $('#needle');
  if (needle) {
    const maxSpeed = 1000; // Mbps (1 Gbps)
    const angle = Math.min((speed / maxSpeed) * 180, 180);
    const rotation = -90 + angle; // Start at -90deg (left), rotate to +90deg (right)
    needle.style.transform = `rotate(${rotation}deg)`;
  }
  
  // Animate arc
  const arc = $('#speedArc');
  if (arc) {
    const maxSpeed = 1000; // Mbps
    const percent = Math.min((speed / maxSpeed) * 100, 100);
    const arcLength = 251; // Total arc length
    const offset = arcLength - (arcLength * percent / 100);
    arc.style.strokeDashoffset = offset;
  }
}

// Show connection quality
function showQuality(download, upload, ping) {
  const qualityBloc = $('#qualityBloc');
  const badge = $('#qualityBadge');
  const description = $('#qualityDescription');
  
  if (!qualityBloc || !badge || !description) return;
  
  let quality = 'poor';
  let text = 'Poor';
  let desc = 'Connection may struggle with video calls and streaming.';
  
  // Determine quality based on download speed (updated for high speeds)
  const downloadNum = parseFloat(download);
  
  if (downloadNum >= 200) {
    quality = 'excellent';
    text = 'Excellent';
    desc = 'Blazing fast! Perfect for 8K streaming, multi-device gaming, and instant downloads.';
  } else if (downloadNum >= 100) {
    quality = 'excellent';
    text = 'Excellent';
    desc = 'Perfect for 4K streaming, online gaming, and large file transfers.';
  } else if (downloadNum >= 50) {
    quality = 'good';
    text = 'Good';
    desc = 'Great for HD streaming, video calls, and smooth browsing.';
  } else if (downloadNum >= 25) {
    quality = 'good';
    text = 'Good';
    desc = 'Suitable for HD streaming and video conferencing.';
  } else if (downloadNum >= 10) {
    quality = 'fair';
    text = 'Fair';
    desc = 'Adequate for SD streaming and basic browsing.';
  }
  
  badge.textContent = text;
  badge.className = `chip quality-${quality}`;
  description.textContent = desc;
  qualityBloc.classList.remove('hidden');
}

// Test download speed with adaptive sizing
async function testDownloadSpeed() {
  // Use 50MB for accurate high-speed measurement (can measure up to 1 Gbps accurately)
  const sizeMB = 50; 
  const url = `${API_BASE}/api/speedtest/download/${sizeMB}`;

  setStatus('Testing download speed...');
  setTestStatus('Downloading test data from server...');
  setProgress(10);

  const startTime = performance.now();

  try {
    const response = await fetch(url, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
    });

    if (!response.ok) {
      throw new Error(`Download test failed: ${response.status}`);
    }

    // Stream the response for more accurate timing
    const reader = response.body.getReader();
    let receivedLength = 0;
    const chunks = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      receivedLength += value.length;
    }

    const endTime = performance.now();

    const duration = (endTime - startTime) / 1000; // seconds
    const sizeBytes = receivedLength;
    const bytesPerSecond = sizeBytes / duration;
    const mbps = formatSpeed(bytesPerSecond);

    console.log(`Download: ${formatBytes(sizeBytes)} in ${duration.toFixed(2)}s = ${mbps} Mbps`);

    setCurrentSpeed(parseFloat(mbps));
    $('#downloadSpeed').textContent = mbps;
    setProgress(40);

    return mbps;
  } catch (error) {
    console.error('Download test error:', error);
    $('#downloadSpeed').textContent = 'Error';
    setStatus('❌ Download test failed');
    throw error;
  }
}

// Test upload speed with adaptive sizing
async function testUploadSpeed() {
  // Use 25MB for upload (sufficient for 1 Gbps measurement, faster than download)
  const sizeMB = 25; 
  const url = `${API_BASE}/api/speedtest/upload`;

  setStatus('Testing upload speed...');
  setTestStatus('Uploading test data to server...');
  setProgress(50);

  // Create random data buffer efficiently
  const sizeBytes = sizeMB * 1024 * 1024;
  const buffer = new ArrayBuffer(sizeBytes);
  const view = new Uint32Array(buffer);
  
  // Fill with random data (faster with Uint32Array)
  for (let i = 0; i < view.length; i++) {
    view[i] = Math.random() * 0xFFFFFFFF;
  }

  const blob = new Blob([buffer]);
  const formData = new FormData();
  formData.append('file', blob, 'speedtest.bin');

  const startTime = performance.now();

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Upload test failed: ${response.status}`);
    }

    await response.json(); // Wait for server confirmation
    const endTime = performance.now();

    const duration = (endTime - startTime) / 1000; // seconds
    const bytesPerSecond = sizeBytes / duration;
    const mbps = formatSpeed(bytesPerSecond);

    console.log(`Upload: ${formatBytes(sizeBytes)} in ${duration.toFixed(2)}s = ${mbps} Mbps`);

    setCurrentSpeed(parseFloat(mbps));
    $('#uploadSpeed').textContent = mbps;
    setProgress(80);

    return mbps;
  } catch (error) {
    console.error('Upload test error:', error);
    $('#uploadSpeed').textContent = 'Error';
    setStatus('❌ Upload test failed');
    throw error;
  }
}

// Test ping latency
async function testPing() {
  const url = `${API_BASE}/api/speedtest/ping`;

  setStatus('Testing ping latency...');
  setTestStatus('Measuring server response time...');
  setProgress(85);

  let totalLatency = 0;
  const tests = 5; // Average of 5 pings

  try {
    for (let i = 0; i < tests; i++) {
      const startTime = performance.now();

      await fetch(url, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
      });

      const endTime = performance.now();
      totalLatency += (endTime - startTime);
      
      // Small delay between pings
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const avgLatency = Math.round(totalLatency / tests);
    console.log(`Ping: ${avgLatency}ms (average of ${tests} tests)`);

    $('#pingLatency').textContent = avgLatency;
    setProgress(100);

    return avgLatency;
  } catch (error) {
    console.error('Ping test error:', error);
    $('#pingLatency').textContent = 'Error';
    setStatus('❌ Ping test failed');
    throw error;
  }
}

// Run full speed test
async function runSpeedTest() {
  if (isTesting) return;

  isTesting = true;
  const btn = $('#startTestBtn');
  const container = $('.speedometer-container');

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span class="btn-icon">⏳</span>Testing...';
  }

  if (container) container.classList.add('testing');

  // Reset displays
  setCurrentSpeed(0);
  $('#downloadSpeed').textContent = '—';
  $('#uploadSpeed').textContent = '—';
  $('#pingLatency').textContent = '—';
  setProgress(0);
  setStatus('Starting speed test...');
  setTestStatus('Initializing connection...');
  
  // Hide quality bloc
  const qualityBloc = $('#qualityBloc');
  if (qualityBloc) qualityBloc.classList.add('hidden');

  try {
    // Run tests sequentially
    const download = await testDownloadSpeed();
    await new Promise(resolve => setTimeout(resolve, 500)); // Brief pause

    const upload = await testUploadSpeed();
    await new Promise(resolve => setTimeout(resolve, 500)); // Brief pause

    const ping = await testPing();

    // Test complete
    setProgress(100);
    setStatus('✅ Speed test complete!');
    setTestStatus(`Download: ${download} Mbps • Upload: ${upload} Mbps • Ping: ${ping}ms`);
    setCurrentSpeed(parseFloat(download)); // Show final download speed

    // Show connection quality
    showQuality(download, upload, ping);

    // Save to history
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    testHistory.unshift({
      download: `${download} Mbps`,
      upload: `${upload} Mbps`,
      ping: `${ping} ms`,
      time: timeStr,
      timestamp: now.getTime()
    });

    // Keep only last 10 tests
    if (testHistory.length > 10) {
      testHistory = testHistory.slice(0, 10);
    }

    saveHistory();
    renderHistory();

  } catch (error) {
    console.error('Speed test failed:', error);
    setStatus('❌ Test failed. Please check your connection and try again.');
    setTestStatus('An error occurred during testing.');
    setProgress(0);
    setCurrentSpeed(0);
  } finally {
    isTesting = false;
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<span class="btn-icon">⚡</span>Start Speed Test';
    }
    if (container) container.classList.remove('testing');
  }
}

// Clear history
function clearHistory() {
  if (!confirm('Clear all test history?')) return;
  
  testHistory = [];
  saveHistory();
  renderHistory();
  
  // Hide quality bloc
  const qualityBloc = $('#qualityBloc');
  if (qualityBloc) qualityBloc.classList.add('hidden');
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  const startBtn = $('#startTestBtn');
  const clearBtn = $('#clearHistoryBtn');

  if (startBtn) {
    startBtn.addEventListener('click', runSpeedTest);
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', clearHistory);
  }

  // Load saved history
  loadHistory();

  // Add route-ready class for page transitions
  document.documentElement.classList.add('route-ready');
});
