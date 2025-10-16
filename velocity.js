const $ = s => document.querySelector(s);

// Configuration
let watchId = null;
let isTracking = false;
let tripStartTime = null;
let lastPosition = null;
let totalDistance = 0; // in meters
let speedReadings = [];
let maxSpeedReached = 0;

// Unit conversion factors (from m/s)
const UNITS = {
  kmh: { factor: 3.6, label: 'km/h', max: 300 }, // 300 km/h max scale
  mph: { factor: 2.23694, label: 'mph', max: 186 }, // ~300 km/h in mph
  ms: { factor: 1, label: 'm/s', max: 83.33 }, // ~300 km/h in m/s
  knots: { factor: 1.94384, label: 'knots', max: 162 }, // ~300 km/h in knots
  fps: { factor: 3.28084, label: 'ft/s', max: 273 } // ~300 km/h in ft/s
};

let currentUnit = 'kmh';

// Utility functions
function convertSpeed(speedMS, unit) {
  if (speedMS === null || speedMS === undefined || isNaN(speedMS)) return 0;
  return speedMS * UNITS[unit].factor;
}

function formatSpeed(speed) {
  return speed.toFixed(1);
}

function formatDistance(meters) {
  if (meters < 1000) {
    return `${meters.toFixed(0)} m`;
  }
  return `${(meters / 1000).toFixed(2)} km`;
}

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  // Haversine formula for distance between two GPS coordinates
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in meters
}

function getCompassDirection(heading) {
  if (heading === null || heading === undefined) return '—';
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(heading / 45) % 8;
  return `${directions[index]} (${Math.round(heading)}°)`;
}

// Update speedometer needle and arc
function updateSpeedometer(speed) {
  const maxSpeed = UNITS[currentUnit].max;
  const needle = $('#needle');
  const arc = $('#speedArc');
  
  if (needle) {
    // Calculate angle (0-180 degrees)
    const percent = Math.min(speed / maxSpeed, 1);
    const angle = percent * 180;
    const rotation = -90 + angle; // Start at -90deg (left)
    needle.style.transform = `rotate(${rotation}deg)`;
  }
  
  if (arc) {
    // Animate arc based on speed
    const percent = Math.min((speed / maxSpeed) * 100, 100);
    const arcLength = 251;
    const offset = arcLength - (arcLength * percent / 100);
    arc.style.strokeDashoffset = offset;
  }
}

// Update all UI displays
function updateDisplay(speed) {
  const convertedSpeed = convertSpeed(speed, currentUnit);
  const unitLabel = UNITS[currentUnit].label;
  
  // Main speedometer
  $('#currentSpeed').textContent = formatSpeed(convertedSpeed);
  $('#speedUnit').textContent = unitLabel;
  
  // KPI cards
  $('#currentSpeedKPI').textContent = formatSpeed(convertedSpeed);
  $('#currentUnitKPI').textContent = unitLabel;
  
  // Update max speed if exceeded
  if (convertedSpeed > maxSpeedReached) {
    maxSpeedReached = convertedSpeed;
    $('#maxSpeed').textContent = formatSpeed(maxSpeedReached);
    $('#maxUnitKPI').textContent = unitLabel;
  }
  
  // Update speedometer visual
  updateSpeedometer(convertedSpeed);
  
  // Add to speed readings for average calculation
  if (convertedSpeed > 0.5) { // Only count speeds above 0.5 to avoid GPS drift
    speedReadings.push(convertedSpeed);
    
    // Calculate average speed
    const avgSpeed = speedReadings.reduce((a, b) => a + b, 0) / speedReadings.length;
    $('#avgSpeed').textContent = formatSpeed(avgSpeed);
    $('#avgUnitKPI').textContent = unitLabel;
  }
  
  // Update trip duration
  if (tripStartTime) {
    const elapsed = (Date.now() - tripStartTime) / 1000; // seconds
    $('#duration').textContent = formatDuration(elapsed);
  }
}

// Handle position update from GPS
function handlePosition(position) {
  const { latitude, longitude, altitude, speed, heading, accuracy } = position.coords;
  
  console.log('GPS Update:', {
    lat: latitude.toFixed(6),
    lon: longitude.toFixed(6),
    speed: speed,
    accuracy: Math.round(accuracy)
  });
  
  // Update location info
  $('#latitude').textContent = latitude.toFixed(6);
  $('#longitude').textContent = longitude.toFixed(6);
  $('#altitude').textContent = altitude !== null ? `${Math.round(altitude)} m` : '—';
  $('#heading').textContent = getCompassDirection(heading);
  
  // Update GPS accuracy chip
  const accuracyChip = $('#accuracyChip');
  if (accuracyChip) {
    if (accuracy <= 10) {
      accuracyChip.textContent = 'Excellent';
      accuracyChip.className = 'chip gps-active';
    } else if (accuracy <= 30) {
      accuracyChip.textContent = 'Good';
      accuracyChip.className = 'chip gps-active';
    } else {
      accuracyChip.textContent = `±${Math.round(accuracy)}m`;
      accuracyChip.className = 'chip gps-searching';
    }
  }
  
  // Calculate distance traveled
  if (lastPosition && speed && speed > 0.5) {
    const distance = calculateDistance(
      lastPosition.latitude,
      lastPosition.longitude,
      latitude,
      longitude
    );
    
    // Only add distance if it's reasonable (prevents GPS jump errors)
    if (distance < 500) { // Max 500m between readings
      totalDistance += distance;
      $('#distance').textContent = formatDistance(totalDistance);
    }
  }
  
  // Update last position
  lastPosition = { latitude, longitude };
  
  // Update speed display
  // GPS speed is in m/s (or null if stationary)
  const speedMS = speed !== null ? Math.max(0, speed) : 0;
  updateDisplay(speedMS);
  
  // Update status
  if (speedMS < 0.5) {
    $('#gpsStatusText').textContent = 'Stationary (waiting for movement...)';
  } else if (speedMS < 2) {
    $('#gpsStatusText').textContent = 'Walking pace detected';
  } else if (speedMS < 5) {
    $('#gpsStatusText').textContent = 'Running pace detected';
  } else if (speedMS < 15) {
    $('#gpsStatusText').textContent = 'Cycling speed detected';
  } else {
    $('#gpsStatusText').textContent = 'Vehicle speed detected';
  }
}

// Handle GPS errors
function handleError(error) {
  console.error('GPS Error:', error);
  
  let message = 'GPS error occurred';
  
  switch (error.code) {
    case error.PERMISSION_DENIED:
      message = '❌ Location permission denied. Please enable GPS access.';
      break;
    case error.POSITION_UNAVAILABLE:
      message = '⚠️ GPS signal unavailable. Move to an open area.';
      break;
    case error.TIMEOUT:
      message = '⏱️ GPS timeout. Retrying...';
      break;
    default:
      message = `❌ GPS error: ${error.message}`;
  }
  
  $('#gpsStatusText').textContent = message;
  $('#statusLine').textContent = message;
  
  const gpsStatus = $('#gpsStatus');
  if (gpsStatus) {
    gpsStatus.textContent = 'GPS Error';
    gpsStatus.className = 'chip';
  }
}

// Start GPS tracking
function startTracking() {
  if (!navigator.geolocation) {
    $('#gpsStatusText').textContent = '❌ Geolocation not supported by this browser';
    $('#statusLine').textContent = 'Your browser does not support GPS tracking.';
    return;
  }
  
  if (isTracking) return;
  
  isTracking = true;
  tripStartTime = Date.now();
  
  const startBtn = $('#startBtn');
  const resetBtn = $('#resetBtn');
  const container = $('.speedometer-container');
  
  if (startBtn) {
    startBtn.innerHTML = '<span class="btn-icon">⏸️</span>Stop Tracking';
    startBtn.classList.remove('primary');
  }
  
  if (resetBtn) resetBtn.disabled = false;
  if (container) container.classList.add('tracking');
  
  const gpsStatus = $('#gpsStatus');
  if (gpsStatus) {
    gpsStatus.textContent = 'Searching...';
    gpsStatus.className = 'chip gps-searching';
  }
  
  $('#gpsStatusText').textContent = 'Acquiring GPS signal...';
  $('#statusLine').textContent = 'GPS enabled. Waiting for signal acquisition...';
  
  // Start watching position with high accuracy
  watchId = navigator.geolocation.watchPosition(
    handlePosition,
    handleError,
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
  
  // After first successful reading
  setTimeout(() => {
    const gpsStatus = $('#gpsStatus');
    if (gpsStatus && isTracking) {
      gpsStatus.textContent = 'GPS Active';
      gpsStatus.className = 'chip gps-active';
    }
  }, 2000);
}

// Stop GPS tracking
function stopTracking() {
  if (!isTracking) return;
  
  isTracking = false;
  
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
  
  const startBtn = $('#startBtn');
  const container = $('.speedometer-container');
  
  if (startBtn) {
    startBtn.innerHTML = '<span class="btn-icon">🚀</span>Start Tracking';
    startBtn.classList.add('primary');
  }
  
  if (container) container.classList.remove('tracking');
  
  const gpsStatus = $('#gpsStatus');
  if (gpsStatus) {
    gpsStatus.textContent = 'GPS Off';
    gpsStatus.className = 'chip';
  }
  
  $('#gpsStatusText').textContent = 'Tracking stopped. Click "Start Tracking" to resume.';
  $('#statusLine').textContent = 'Tracking paused. Your trip statistics are saved.';
}

// Reset all statistics
function resetStats() {
  if (!confirm('Reset all trip statistics? This cannot be undone.')) return;
  
  // Stop tracking first
  stopTracking();
  
  // Reset all variables
  tripStartTime = null;
  lastPosition = null;
  totalDistance = 0;
  speedReadings = [];
  maxSpeedReached = 0;
  
  // Reset displays
  const unitLabel = UNITS[currentUnit].label;
  $('#currentSpeed').textContent = '0.0';
  $('#currentSpeedKPI').textContent = '0.0';
  $('#maxSpeed').textContent = '0.0';
  $('#avgSpeed').textContent = '0.0';
  $('#distance').textContent = '0.00';
  $('#duration').textContent = '00:00';
  $('#latitude').textContent = '—';
  $('#longitude').textContent = '—';
  $('#altitude').textContent = '—';
  $('#heading').textContent = '—';
  
  $('#speedUnit').textContent = unitLabel;
  $('#currentUnitKPI').textContent = unitLabel;
  $('#maxUnitKPI').textContent = unitLabel;
  $('#avgUnitKPI').textContent = unitLabel;
  
  updateSpeedometer(0);
  
  $('#gpsStatusText').textContent = 'Statistics reset. Click "Start Tracking" to begin.';
  $('#statusLine').textContent = 'All statistics cleared. Ready for new trip.';
  
  const accuracyChip = $('#accuracyChip');
  if (accuracyChip) {
    accuracyChip.textContent = '—';
    accuracyChip.className = 'chip';
  }
  
  const resetBtn = $('#resetBtn');
  if (resetBtn) resetBtn.disabled = true;
}

// Change speed unit
function changeUnit() {
  const unitSelect = $('#unitSelect');
  if (!unitSelect) return;
  
  currentUnit = unitSelect.value;
  const unitLabel = UNITS[currentUnit].label;
  
  // Update all unit labels
  $('#speedUnit').textContent = unitLabel;
  $('#currentUnitKPI').textContent = unitLabel;
  $('#maxUnitKPI').textContent = unitLabel;
  $('#avgUnitKPI').textContent = unitLabel;
  
  // Recalculate and update displays with new unit
  if (lastPosition && isTracking) {
    // Trigger a display update with last known speed
    // Speed is stored in m/s internally
    const lastSpeedMS = speedReadings.length > 0 ? 
      speedReadings[speedReadings.length - 1] / UNITS[currentUnit].factor : 0;
    updateDisplay(lastSpeedMS);
  } else {
    // Just update the speedometer scale
    updateSpeedometer(0);
  }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  const startBtn = $('#startBtn');
  const resetBtn = $('#resetBtn');
  const unitSelect = $('#unitSelect');
  
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      if (isTracking) {
        stopTracking();
      } else {
        startTracking();
      }
    });
  }
  
  if (resetBtn) {
    resetBtn.addEventListener('click', resetStats);
  }
  
  if (unitSelect) {
    unitSelect.addEventListener('change', changeUnit);
  }
  
  // Initialize display
  updateSpeedometer(0);
  
  // Add route-ready class for page transitions
  document.documentElement.classList.add('route-ready');
});
