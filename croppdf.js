const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

// Initialize PDF.js worker
if(typeof pdfjsLib !== 'undefined'){
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  } catch(e) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'libs/pdf.worker.min.js';
  }
}

// Store PDF data globally with per-page crop storage
window.__cropState = {
  pdfDoc: null,
  originalFile: null,
  currentPage: 1,
  totalPages: 1,
  perPageCrops: {}, // Store crop values for each page: {1: {top,bottom,left,right}, 2: {...}}
  pageSize: {
    width: 0,
    height: 0
  }
};

function setStatus(t){ 
  const el = $('#statusLine');
  if(el) el.textContent=t; 
}

function setProgress(p){ 
  const el = $('#progressBar');
  if(el) el.style.width = `${Math.max(0,Math.min(100,p))}%`; 
}

function validateFile(file){
  const MAX = 20*1024*1024;
  if(!file) return {ok:false,msg:'No PDF selected.'};
  const isPdf = (file.name||'').toLowerCase().endsWith('.pdf') || file.type==='application/pdf';
  if(!isPdf) return {ok:false,msg:'Only PDF files are accepted.'};
  if((file.size||0) > MAX) return {ok:false,msg:'File exceeds 20 MB.'};
  return {ok:true};
}

function resetUI(){
  setStatus('Upload a PDF to begin.'); 
  setProgress(0);
  
  const cropCard = $('#cropCard');
  const kOriginalSize = $('#kOriginalSize');
  const kNewSize = $('#kNewSize');
  
  if(cropCard) cropCard.style.display = 'none';
  if(kOriginalSize) kOriginalSize.textContent = '—';
  if(kNewSize) kNewSize.textContent = '—';
  
  window.__cropState = {
    pdfDoc: null,
    originalFile: null,
    currentPage: 1,
    totalPages: 1,
    perPageCrops: {},
    pageSize: { width: 0, height: 0 }
  };
}

function getCurrentCrop(){
  const page = window.__cropState.currentPage;
  if(!window.__cropState.perPageCrops[page]){
    window.__cropState.perPageCrops[page] = { top: 0, bottom: 0, left: 0, right: 0 };
  }
  return window.__cropState.perPageCrops[page];
}

function saveCurrentCrop(cropValues){
  const page = window.__cropState.currentPage;
  window.__cropState.perPageCrops[page] = {...cropValues};
}

async function onFileChosen(file){
  const check = validateFile(file);
  if(!check.ok){ 
    setStatus(check.msg); 
    return; 
  }
  
  setStatus('📄 Loading PDF...'); 
  setProgress(20);
  
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({data: arrayBuffer});
    const pdfDoc = await loadingTask.promise;
    
    window.__cropState.pdfDoc = pdfDoc;
    window.__cropState.originalFile = file;
    window.__cropState.totalPages = pdfDoc.numPages;
    window.__cropState.currentPage = 1;
    window.__cropState.perPageCrops = {};
    
    setStatus('📐 Loading page preview...'); 
    setProgress(50);
    
    await renderCurrentPage();
    
    const cropCard = $('#cropCard');
    if(cropCard) cropCard.style.display = 'block';
    
    updatePageIndicator();
    updateNavigationButtons();
    
    setStatus('✅ PDF loaded. Drag edges or enter values to crop.'); 
    setProgress(100);
    
  } catch(err){
    console.error('PDF load error:', err);
    setStatus(`❌ Error loading PDF: ${err.message}`);
    setProgress(0);
  }
}

async function renderCurrentPage(){
  const loadingCrop = $('#loadingCrop');
  const cropContainer = $('#cropContainer');
  const canvas = $('#pageCanvas');
  
  if(loadingCrop) loadingCrop.style.display = 'flex';
  if(cropContainer) cropContainer.style.display = 'none';
  
  try {
    const page = await window.__cropState.pdfDoc.getPage(window.__cropState.currentPage);
    const viewport = page.getViewport({scale: 1.5});
    
    // Store page dimensions
    window.__cropState.pageSize.width = viewport.width;
    window.__cropState.pageSize.height = viewport.height;
    
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    const context = canvas.getContext('2d');
    
    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise;
    
    if(loadingCrop) loadingCrop.style.display = 'none';
    if(cropContainer) cropContainer.style.display = 'block';
    
    // Load crop values for this page
    const currentCrop = getCurrentCrop();
    
    // Update size displays
    updateSizeDisplays();
    
    // Update overlays and inputs with this page's crop values
    updateCropOverlays();
    updateNumericInputs();
    
  } catch(err){
    console.error('Page render error:', err);
    setStatus(`❌ Error rendering page: ${err.message}`);
  }
}

function updatePageIndicator(){
  const pageIndicator = $('#pageIndicator');
  if(pageIndicator){
    pageIndicator.textContent = `Page ${window.__cropState.currentPage} of ${window.__cropState.totalPages}`;
  }
  
  const pageJump = $('#pageJump');
  if(pageJump){
    pageJump.value = window.__cropState.currentPage;
    pageJump.max = window.__cropState.totalPages;
  }
}

function updateNavigationButtons(){
  const prevBtn = $('#prevPageBtn');
  const nextBtn = $('#nextPageBtn');
  
  if(prevBtn) prevBtn.disabled = window.__cropState.currentPage <= 1;
  if(nextBtn) nextBtn.disabled = window.__cropState.currentPage >= window.__cropState.totalPages;
}

function updateSizeDisplays(){
  const kOriginalSize = $('#kOriginalSize');
  const kNewSize = $('#kNewSize');
  
  const originalW = Math.round(window.__cropState.pageSize.width);
  const originalH = Math.round(window.__cropState.pageSize.height);
  
  const crop = getCurrentCrop();
  const newW = Math.max(0, originalW - crop.left - crop.right);
  const newH = Math.max(0, originalH - crop.top - crop.bottom);
  
  if(kOriginalSize) kOriginalSize.textContent = `${originalW} × ${originalH} px`;
  if(kNewSize) kNewSize.textContent = `${newW} × ${newH} px`;
}

function updateCropOverlays(){
  const crop = getCurrentCrop();
  
  const overlayTop = $('#overlayTop');
  const overlayBottom = $('#overlayBottom');
  const overlayLeft = $('#overlayLeft');
  const overlayRight = $('#overlayRight');
  
  if(overlayTop) overlayTop.style.height = `${crop.top}px`;
  if(overlayBottom) overlayBottom.style.height = `${crop.bottom}px`;
  if(overlayLeft) overlayLeft.style.width = `${crop.left}px`;
  if(overlayRight) overlayRight.style.width = `${crop.right}px`;
  
  // Update handles position
  const handleTop = $('#handleTop');
  const handleBottom = $('#handleBottom');
  const handleLeft = $('#handleLeft');
  const handleRight = $('#handleRight');
  
  if(handleTop) handleTop.style.top = `${crop.top}px`;
  if(handleBottom) handleBottom.style.bottom = `${crop.bottom}px`;
  if(handleLeft) handleLeft.style.left = `${crop.left}px`;
  if(handleRight) handleRight.style.right = `${crop.right}px`;
  
  updateSizeDisplays();
}

// FIXED: Draggable handles with BOTH mouse and touch support
function bindDraggableHandles(){
  const handles = {
    top: $('#handleTop'),
    bottom: $('#handleBottom'),
    left: $('#handleLeft'),
    right: $('#handleRight')
  };
  
  Object.keys(handles).forEach(side => {
    const handle = handles[side];
    if(!handle) return;
    
    let isDragging = false;
    let startPos = 0;
    let startCrop = 0;
    
    // Helper to get position from mouse or touch event
    const getPos = (e) => {
      if(e.touches && e.touches[0]){
        return side === 'top' || side === 'bottom' ? e.touches[0].clientY : e.touches[0].clientX;
      }
      return side === 'top' || side === 'bottom' ? e.clientY : e.clientX;
    };
    
    // Start drag (mouse or touch)
    const startDrag = (e) => {
      e.preventDefault();
      isDragging = true;
      startPos = getPos(e);
      
      const currentCrop = getCurrentCrop();
      startCrop = currentCrop[side];
      document.body.style.cursor = handle.style.cursor;
    };
    
    // Move drag
    const moveDrag = (e) => {
      if(!isDragging) return;
      e.preventDefault();
      
      const currentPos = getPos(e);
      let delta = 0;
      
      if(side === 'top'){
        delta = currentPos - startPos;
      } else if(side === 'bottom'){
        delta = startPos - currentPos;
      } else if(side === 'left'){
        delta = currentPos - startPos;
      } else if(side === 'right'){
        delta = startPos - currentPos;
      }
      
      const newValue = Math.max(0, startCrop + delta);
      const maxValue = side === 'top' || side === 'bottom' 
        ? window.__cropState.pageSize.height 
        : window.__cropState.pageSize.width;
      
      const currentCrop = getCurrentCrop();
      currentCrop[side] = Math.min(newValue, maxValue);
      saveCurrentCrop(currentCrop);
      
      updateCropOverlays();
      updateNumericInputs();
    };
    
    // End drag
    const endDrag = () => {
      if(isDragging){
        isDragging = false;
        document.body.style.cursor = 'default';
      }
    };
    
    // Mouse events
    handle.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', moveDrag);
    document.addEventListener('mouseup', endDrag);
    
    // Touch events for mobile
    handle.addEventListener('touchstart', startDrag, {passive: false});
    document.addEventListener('touchmove', moveDrag, {passive: false});
    document.addEventListener('touchend', endDrag);
    document.addEventListener('touchcancel', endDrag);
  });
}

function updateNumericInputs(){
  const crop = getCurrentCrop();
  
  const cropTop = $('#cropTop');
  const cropBottom = $('#cropBottom');
  const cropLeft = $('#cropLeft');
  const cropRight = $('#cropRight');
  
  if(cropTop) cropTop.value = Math.round(crop.top);
  if(cropBottom) cropBottom.value = Math.round(crop.bottom);
  if(cropLeft) cropLeft.value = Math.round(crop.left);
  if(cropRight) cropRight.value = Math.round(crop.right);
}

function bindNumericInputs(){
  const inputs = {
    cropTop: 'top',
    cropBottom: 'bottom',
    cropLeft: 'left',
    cropRight: 'right'
  };
  
  Object.keys(inputs).forEach(id => {
    const input = $(`#${id}`);
    if(!input) return;
    
    input.addEventListener('input', () => {
      const value = Math.max(0, parseInt(input.value) || 0);
      const side = inputs[id];
      
      const maxValue = side === 'top' || side === 'bottom' 
        ? window.__cropState.pageSize.height 
        : window.__cropState.pageSize.width;
      
      const currentCrop = getCurrentCrop();
      currentCrop[side] = Math.min(value, maxValue);
      saveCurrentCrop(currentCrop);
      
      updateCropOverlays();
    });
  });
}

function bindPageNavigation(){
  const prevBtn = $('#prevPageBtn');
  const nextBtn = $('#nextPageBtn');
  const goBtn = $('#goPageBtn');
  const pageJump = $('#pageJump');
  
  if(prevBtn){
    prevBtn.addEventListener('click', async () => {
      if(window.__cropState.currentPage > 1){
        window.__cropState.currentPage--;
        await renderCurrentPage();
        updatePageIndicator();
        updateNavigationButtons();
      }
    });
  }
  
  if(nextBtn){
    nextBtn.addEventListener('click', async () => {
      if(window.__cropState.currentPage < window.__cropState.totalPages){
        window.__cropState.currentPage++;
        await renderCurrentPage();
        updatePageIndicator();
        updateNavigationButtons();
      }
    });
  }
  
  if(goBtn && pageJump){
    goBtn.addEventListener('click', async () => {
      const targetPage = parseInt(pageJump.value) || 1;
      if(targetPage >= 1 && targetPage <= window.__cropState.totalPages){
        window.__cropState.currentPage = targetPage;
        await renderCurrentPage();
        updatePageIndicator();
        updateNavigationButtons();
      } else {
        setStatus(`❌ Invalid page number. Must be between 1 and ${window.__cropState.totalPages}.`);
      }
    });
    
    pageJump.addEventListener('keypress', (e) => {
      if(e.key === 'Enter') goBtn.click();
    });
  }
}

function bindDropzone(){
  const dz=$('#dropzone'), input=$('#fileInput'), browseBtn=$('#browseBtn');
  if(!dz || !input || !browseBtn) return;
  
  browseBtn.addEventListener('click', ()=> input.click());
  input.addEventListener('change', e=> {
    const f = e.target.files?.[0];
    if(f) onFileChosen(f);
  });
  
  dz.addEventListener('dragenter', e=>{ e.preventDefault(); dz.classList.add('drag'); });
  dz.addEventListener('dragover', e=>{ e.preventDefault(); dz.classList.add('drag'); });
  dz.addEventListener('dragleave', e=>{ e.preventDefault(); dz.classList.remove('drag'); });
  dz.addEventListener('drop', e=>{ 
    e.preventDefault(); 
    e.stopPropagation();
    dz.classList.remove('drag'); 
    const f = e.dataTransfer?.files?.[0];
    if(f) onFileChosen(f);
  });
  
  dz.addEventListener('keydown', e=>{ 
    if(e.key==='Enter'||e.key===' '){ 
      e.preventDefault(); 
      input.click(); 
    }
  });
}

function bindGlobalDrop(){
  const overlay=$('#globalDrop'); 
  if(!overlay) return;
  
  let dragDepth=0;
  const show=()=> overlay.classList.add('show');
  const hide=()=> overlay.classList.remove('show');

  document.addEventListener('dragenter', e=>{
    if(e.dataTransfer && e.dataTransfer.types && e.dataTransfer.types.indexOf('Files') !== -1) { 
      dragDepth++; 
      show(); 
    }
  });
  
  document.addEventListener('dragover', e=>{ 
    if(overlay.classList.contains('show')) e.preventDefault(); 
  });
  
  document.addEventListener('dragleave', ()=>{ 
    dragDepth=Math.max(0,dragDepth-1); 
    if(dragDepth===0) hide(); 
  });
  
  document.addEventListener('drop', e=>{
    if(overlay.classList.contains('show')) {
      e.preventDefault();
      e.stopPropagation();
    }
    hide(); 
    dragDepth=0;
    const files=e.dataTransfer?.files;
    if(files && files.length){ onFileChosen(files[0]); }
  });
}

function bindActions(){
  const resetBtn = $('#resetBtn');
  const resetCropBtn = $('#resetCropBtn');
  const downloadBtn = $('#downloadBtn');
  
  if(resetBtn){
    resetBtn.addEventListener('click', ()=>{
      const input=$('#fileInput'); 
      if(input) input.value='';
      resetUI();
    });
  }
  
  if(resetCropBtn){
    resetCropBtn.addEventListener('click', ()=>{
      const currentCrop = getCurrentCrop();
      currentCrop.top = 0;
      currentCrop.bottom = 0;
      currentCrop.left = 0;
      currentCrop.right = 0;
      saveCurrentCrop(currentCrop);
      
      updateCropOverlays();
      updateNumericInputs();
      setStatus('✅ Crop values reset for current page.');
    });
  }

  if(downloadBtn){
    downloadBtn.addEventListener('click', async ()=>{
      if(!window.__cropState.pdfDoc){
        setStatus('❌ No PDF loaded.');
        return;
      }
      
      const applyToAll = $('#applyToAll')?.checked || false;
      const currentCrop = getCurrentCrop();
      
      // Check if any crop values exist
      let hasCrop = false;
      if(applyToAll){
        hasCrop = currentCrop.top > 0 || currentCrop.bottom > 0 || currentCrop.left > 0 || currentCrop.right > 0;
      } else {
        // Check if any page has crop values
        hasCrop = Object.values(window.__cropState.perPageCrops).some(c => 
          c.top > 0 || c.bottom > 0 || c.left > 0 || c.right > 0
        );
      }
      
      if(!hasCrop){
        setStatus('❌ No crop values set. Please drag edges or enter values.');
        return;
      }
      
      setStatus('📦 Preparing cropped PDF...');
      setProgress(50);
      
      try {
        const formData = new FormData();
        formData.append('pdf', window.__cropState.originalFile);
        formData.append('applyToAll', applyToAll);
        
        if(applyToAll){
          // Send current page crop to apply to all
          formData.append('cropTop', currentCrop.top);
          formData.append('cropBottom', currentCrop.bottom);
          formData.append('cropLeft', currentCrop.left);
          formData.append('cropRight', currentCrop.right);
        } else {
          // Send all per-page crops
          formData.append('perPageCrops', JSON.stringify(window.__cropState.perPageCrops));
        }
        
        setStatus('☁️ Uploading to server...');
        setProgress(70);
        
        const response = await fetch('https://blitz-backend-wdwl.onrender.com/api/crop-pdf', {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `Server error: ${response.status}`);
        }
        
        setStatus('📥 Preparing download...');
        setProgress(90);
        
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const filename = 'cropped.pdf';
        
        const tempLink = document.createElement('a');
        tempLink.href = url;
        tempLink.download = filename;
        tempLink.click();
        
        setProgress(100);
        setStatus('✅ Cropped PDF downloaded!');
        
      } catch(err){
        console.error('Crop failed:', err);
        setStatus(`❌ Error: ${err.message}`);
        setProgress(0);
      }
    });
  }
}

function highlightActive(){
  const fileNav = document.getElementById('navFilePdf');
  const fileDrawerNav = document.getElementById('drawerFilePdf');
  if(fileNav) fileNav.classList.add('active');
  if(fileDrawerNav) fileDrawerNav.classList.add('active');
}

document.addEventListener('DOMContentLoaded', ()=>{
  bindDropzone();
  bindGlobalDrop();
  bindDraggableHandles();
  bindNumericInputs();
  bindPageNavigation();
  bindActions();
  resetUI();
  highlightActive();
  document.documentElement.classList.add('route-ready');
});
