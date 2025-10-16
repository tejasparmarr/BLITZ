const $ = s => document.querySelector(s);

// Configuration - UPDATE THIS AFTER DEPLOYMENT
const API_BASE = 'https://blitz-backend-wdwl.onrender.com'; // Change to your Render URL in production

let selectedFile = null;
let processedImageBlob = null;
let currentBackgroundColor = 'transparent';
let currentBackgroundImage = null;
let currentBackgroundType = 'color'; // 'color' or 'image'

// File size formatter
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Show status message
function setStatus(text, isError = false) {
  const statusLine = $('#statusLine');
  if (statusLine) {
    statusLine.textContent = text;
    statusLine.className = isError ? 'status-line' : 'status-line dim';
  }
}

// Update progress bar
function setProgress(percent) {
  const bar = $('#progressBar');
  if (bar) {
    bar.style.width = `${Math.max(0, Math.min(100, percent))}%`;
  }
}

// Update processing status
function setProcessingStatus(text) {
  const status = $('#processingStatus');
  if (status) status.textContent = text;
}

// Scroll to result section smoothly
function scrollToResults() {
  const resultCard = document.querySelector('.result-card');
  if (resultCard) {
    resultCard.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start' 
    });
  }
}

// Switch background tabs
function switchBackgroundTab(tabName) {
  const tabs = document.querySelectorAll('.bg-tab');
  const contents = document.querySelectorAll('.bg-tab-content');
  
  tabs.forEach(tab => {
    if (tab.getAttribute('data-tab') === tabName) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });
  
  if (tabName === 'color') {
    $('#colorTab')?.classList.remove('hidden');
    $('#imageTab')?.classList.add('hidden');
    currentBackgroundType = 'color';
  } else {
    $('#colorTab')?.classList.add('hidden');
    $('#imageTab')?.classList.remove('hidden');
    currentBackgroundType = 'image';
  }
  
  // Apply current background
  applyBackground();
}

// Handle main image file selection
function handleFileSelect(file) {
  if (!file) return;
  
  // Validate file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  if (!validTypes.includes(file.type)) {
    setStatus('❌ Invalid file type. Please upload JPG or PNG images.', true);
    return;
  }
  
  // Validate file size (10MB max)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    setStatus('❌ File too large. Maximum size is 10 MB.', true);
    return;
  }
  
  selectedFile = file;
  
  // Show preview
  const reader = new FileReader();
  reader.onload = (e) => {
    const preview = $('#originalPreview');
    if (preview) preview.src = e.target.result;
    
    $('#imageName').textContent = file.name;
    $('#imageSize').textContent = formatFileSize(file.size);
    
    $('#previewSection').classList.remove('hidden');
    $('#backgroundOptions').classList.remove('hidden');
    $('#removeBackgroundBtn').disabled = false;
    
    setStatus(`✅ Image loaded: ${file.name}`);
    setProcessingStatus('Ready');
  };
  reader.readAsDataURL(file);
}

// Handle background image selection
function handleBackgroundImageSelect(file) {
  if (!file) return;
  
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  if (!validTypes.includes(file.type)) {
    setStatus('❌ Invalid background image type.', true);
    return;
  }
  
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    setStatus('❌ Background image too large.', true);
    return;
  }
  
  const reader = new FileReader();
  reader.onload = (e) => {
    currentBackgroundImage = e.target.result;
    
    // Show preview
    const bgPreview = $('#bgPreviewImg');
    if (bgPreview) bgPreview.src = currentBackgroundImage;
    
    $('#bgImagePreview')?.classList.remove('hidden');
    $('#bgImageDropzone')?.classList.add('hidden');
    
    // Apply to result if already processed
    applyBackground();
    
    setStatus('✅ Background image loaded');
  };
  reader.readAsDataURL(file);
}

// Remove background image
function removeBackgroundImage() {
  currentBackgroundImage = null;
  $('#bgImagePreview')?.classList.add('hidden');
  $('#bgImageDropzone')?.classList.remove('hidden');
  
  const bgInput = $('#bgImageInput');
  if (bgInput) bgInput.value = '';
  
  // Reset to checkerboard
  applyBackground();
}

// Remove background from main image
async function removeBackground() {
  if (!selectedFile) return;
  
  const removeBtn = $('#removeBackgroundBtn');
  const resetBtn = $('#resetBtn');
  
  // Auto-scroll to top
  scrollToResults();
  
  // Small delay to let scroll happen
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Disable buttons
  if (removeBtn) {
    removeBtn.disabled = true;
    removeBtn.innerHTML = '<span class="btn-icon">⏳</span>Processing...';
  }
  if (resetBtn) resetBtn.disabled = true;
  
  setStatus('🔄 Removing background... This may take 2-5 seconds.');
  setProgress(10);
  setProcessingStatus('Processing...');
  
  try {
    // Create form data
    const formData = new FormData();
    formData.append('image', selectedFile);
    
    setProgress(30);
    
    // Call backend API
    const response = await fetch(`${API_BASE}/api/remove-background`, {
      method: 'POST',
      body: formData
    });
    
    setProgress(60);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }
    
    // Get the processed image
    const blob = await response.blob();
    processedImageBlob = blob;
    
    setProgress(80);
    
    // Display result - BOTH images show the SAME content but After has no background
    const originalURL = URL.createObjectURL(selectedFile);
    const resultURL = URL.createObjectURL(blob);
    
    // Before = Original with background
    $('#beforeImage').src = originalURL;
    
    // After = Same image WITHOUT background
    $('#afterImage').src = resultURL;
    
    setProgress(100);
    
    // Show result section
    $('#resultSection').classList.remove('hidden');
    
    // Enable download button
    $('#downloadBtn').disabled = false;
    
    setStatus('✅ Background removed successfully!');
    setProcessingStatus('Complete');
    
    // Apply current background to the after image
    applyBackground();
    
    // Reset slider to middle position
    const slider = $('#comparisonSlider');
    if (slider) {
      slider.value = 50;
      handleSlider();
    }
    
  } catch (error) {
    console.error('Background removal error:', error);
    setStatus(`❌ Error: ${error.message}`, true);
    setProcessingStatus('Failed');
    setProgress(0);
  } finally {
    // Re-enable buttons
    if (removeBtn) {
      removeBtn.disabled = false;
      removeBtn.innerHTML = '<span class="btn-icon">✨</span>Remove Background';
    }
    if (resetBtn) resetBtn.disabled = false;
  }
}

// Apply background (color or image) to preview - ONLY to the AFTER image container
function applyBackground() {
  const afterContainer = $('#afterImageContainer');
  if (!afterContainer) return;
  
  if (currentBackgroundType === 'image' && currentBackgroundImage) {
    // Apply custom background image
    afterContainer.style.backgroundImage = `url(${currentBackgroundImage})`;
    afterContainer.style.backgroundSize = 'cover';
    afterContainer.style.backgroundPosition = 'center';
    afterContainer.style.backgroundColor = '';
  } else if (currentBackgroundType === 'color') {
    // Apply color background
    if (currentBackgroundColor === 'transparent') {
      // Checkerboard pattern
      afterContainer.style.backgroundImage = `
        linear-gradient(45deg, #555 25%, transparent 25%),
        linear-gradient(-45deg, #555 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, #555 75%),
        linear-gradient(-45deg, transparent 75%, #555 75%)
      `;
      afterContainer.style.backgroundSize = '20px 20px';
      afterContainer.style.backgroundPosition = '0 0, 0 10px, 10px -10px, -10px 0px';
      afterContainer.style.backgroundColor = '';
    } else {
      // Solid color
      afterContainer.style.backgroundImage = 'none';
      afterContainer.style.backgroundColor = currentBackgroundColor;
    }
  }
}

// Download result
function downloadResult() {
  if (!processedImageBlob) return;
  
  const url = URL.createObjectURL(processedImageBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `removed-bg-${Date.now()}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  setStatus('✅ Downloaded transparent PNG!');
}

// Reset everything
function resetTool() {
  selectedFile = null;
  processedImageBlob = null;
  currentBackgroundColor = 'transparent';
  currentBackgroundImage = null;
  currentBackgroundType = 'color';
  
  $('#previewSection').classList.add('hidden');
  $('#backgroundOptions').classList.add('hidden');
  $('#resultSection').classList.add('hidden');
  $('#removeBackgroundBtn').disabled = true;
  
  // Reset color buttons
  document.querySelectorAll('.color-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  document.querySelector('.color-btn[data-color="transparent"]')?.classList.add('active');
  
  // Reset background image
  removeBackgroundImage();
  
  // Reset tabs
  switchBackgroundTab('color');
  
  setStatus('Upload an image to begin background removal.');
  setProgress(0);
  setProcessingStatus('Ready');
  
  // Clear file inputs
  const imageInput = $('#imageInput');
  if (imageInput) imageInput.value = '';
  
  const bgInput = $('#bgImageInput');
  if (bgInput) bgInput.value = '';
}

// Handle comparison slider - Shows original on left, background-removed on right
function handleSlider() {
  const slider = $('#comparisonSlider');
  const afterImage = $('.after-image');
  const sliderLine = $('#sliderLine');
  
  if (!slider || !afterImage || !sliderLine) return;
  
  const value = slider.value;
  
  // The after-image (background removed) is revealed as you slide RIGHT
  // clip-path controls how much of the after image is visible
  afterImage.style.clipPath = `inset(0 ${100 - value}% 0 0)`;
  sliderLine.style.left = `${value}%`;
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  const imageInput = $('#imageInput');
  const imageDrop = $('#imageDrop');
  const browseBtn = $('#browseImageBtn');
  const removeBtn = $('#removeBackgroundBtn');
  const downloadBtn = $('#downloadBtn');
  const resetBtn = $('#resetBtn');
  const comparisonSlider = $('#comparisonSlider');
  const colorBtns = document.querySelectorAll('.color-btn');
  const customColorInput = $('#customColor');
  const bgTabs = document.querySelectorAll('.bg-tab');
  const bgImageInput = $('#bgImageInput');
  const bgImageDropzone = $('#bgImageDropzone');
  const browseBgBtn = $('#browseBgBtn');
  const removeBgImageBtn = $('#removeBgImageBtn');
  
  // Main image input change
  if (imageInput) {
    imageInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) handleFileSelect(file);
    });
  }
  
  // Browse button click
  if (browseBtn) {
    browseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      imageInput?.click();
    });
  }
  
  // Dropzone click
  if (imageDrop) {
    imageDrop.addEventListener('click', () => {
      imageInput?.click();
    });
    
    // Drag and drop
    imageDrop.addEventListener('dragover', (e) => {
      e.preventDefault();
      imageDrop.classList.add('drag-over');
    });
    
    imageDrop.addEventListener('dragleave', () => {
      imageDrop.classList.remove('drag-over');
    });
    
    imageDrop.addEventListener('drop', (e) => {
      e.preventDefault();
      imageDrop.classList.remove('drag-over');
      
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    });
  }
  
  // Global drag and drop
  const globalDrop = $('#globalDrop');
  let dragCounter = 0;
  
  document.addEventListener('dragenter', (e) => {
    e.preventDefault();
    dragCounter++;
    if (globalDrop && dragCounter === 1) {
      globalDrop.classList.add('show');
    }
  });
  
  document.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dragCounter--;
    if (globalDrop && dragCounter === 0) {
      globalDrop.classList.remove('show');
    }
  });
  
  document.addEventListener('dragover', (e) => {
    e.preventDefault();
  });
  
  document.addEventListener('drop', (e) => {
    e.preventDefault();
    dragCounter = 0;
    if (globalDrop) globalDrop.classList.remove('show');
    
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  });
  
  // Remove background button
  if (removeBtn) {
    removeBtn.addEventListener('click', removeBackground);
  }
  
  // Download button
  if (downloadBtn) {
    downloadBtn.addEventListener('click', downloadResult);
  }
  
  // Reset button
  if (resetBtn) {
    resetBtn.addEventListener('click', resetTool);
  }
  
  // Comparison slider
  if (comparisonSlider) {
    comparisonSlider.addEventListener('input', handleSlider);
  }
  
  // Background tabs
  bgTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.getAttribute('data-tab');
      switchBackgroundTab(tabName);
    });
  });
  
  // Color buttons
  colorBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active from all
      colorBtns.forEach(b => b.classList.remove('active'));
      // Add active to clicked
      btn.classList.add('active');
      
      const color = btn.getAttribute('data-color');
      
      if (color === 'custom' && customColorInput) {
        currentBackgroundColor = customColorInput.value;
      } else {
        currentBackgroundColor = color;
      }
      
      currentBackgroundType = 'color';
      applyBackground();
    });
  });
  
  // Custom color picker
  if (customColorInput) {
    customColorInput.addEventListener('input', (e) => {
      // Activate custom button
      colorBtns.forEach(b => b.classList.remove('active'));
      document.querySelector('.custom-color')?.classList.add('active');
      
      currentBackgroundColor = e.target.value;
      currentBackgroundType = 'color';
      applyBackground();
    });
  }
  
  // Background image input
  if (bgImageInput) {
    bgImageInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) handleBackgroundImageSelect(file);
    });
  }
  
  // Background image dropzone
  if (bgImageDropzone) {
    bgImageDropzone.addEventListener('click', () => {
      bgImageInput?.click();
    });
    
    bgImageDropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      bgImageDropzone.classList.add('drag-over');
    });
    
    bgImageDropzone.addEventListener('dragleave', () => {
      bgImageDropzone.classList.remove('drag-over');
    });
    
    bgImageDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      bgImageDropzone.classList.remove('drag-over');
      
      const file = e.dataTransfer.files[0];
      if (file) handleBackgroundImageSelect(file);
    });
  }
  
  // Browse background image button
  if (browseBgBtn) {
    browseBgBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      bgImageInput?.click();
    });
  }
  
  // Remove background image button
  if (removeBgImageBtn) {
    removeBgImageBtn.addEventListener('click', removeBackgroundImage);
  }
  
  // Initialize
  setProcessingStatus('Ready');
  
  // Add route-ready class for page transitions
  document.documentElement.classList.add('route-ready');
});
