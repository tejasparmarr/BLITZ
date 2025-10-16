const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

// Initialize PDF.js worker - Try CDN first, fallback to local
if(typeof pdfjsLib !== 'undefined'){
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  } catch(e) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'libs/pdf.worker.min.js';
  }
}

// Store PDF data globally
window.__organizeState = {
  pdfDoc: null,
  originalFile: null,
  pages: [] // Array of {pageNum, rotation, deleted}
};

let sortableInstance = null;

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
  
  const pagesCard = $('#pagesCard');
  const pagesGrid = $('#pagesGrid');
  const pageCount = $('#pageCount');
  
  if(pagesCard) pagesCard.style.display = 'none';
  if(pagesGrid) pagesGrid.innerHTML = '';
  if(pageCount) pageCount.textContent = '0 pages';
  
  window.__organizeState = {
    pdfDoc: null,
    originalFile: null,
    pages: []
  };
  
  if(sortableInstance){
    sortableInstance.destroy();
    sortableInstance = null;
  }
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
    
    window.__organizeState.pdfDoc = pdfDoc;
    window.__organizeState.originalFile = file;
    window.__organizeState.pages = [];
    
    // Initialize pages array
    for(let i = 1; i <= pdfDoc.numPages; i++){
      window.__organizeState.pages.push({
        pageNum: i,
        rotation: 0,
        deleted: false
      });
    }
    
    setStatus('🖼️ Rendering thumbnails...'); 
    setProgress(40);
    
    await renderAllThumbnails(pdfDoc);
    
    const pagesCard = $('#pagesCard');
    const pageCount = $('#pageCount');
    
    if(pagesCard) pagesCard.style.display = 'block';
    if(pageCount) pageCount.textContent = `${pdfDoc.numPages} pages`;
    
    setStatus('✅ PDF loaded. Drag to reorder, rotate or delete pages.'); 
    setProgress(100);
    
    initializeSortable();
    
  } catch(err){
    console.error('PDF load error:', err);
    setStatus(`❌ Error loading PDF: ${err.message}`);
    setProgress(0);
  }
}

async function renderAllThumbnails(pdfDoc){
  const pagesGrid = $('#pagesGrid');
  const loadingMessage = $('#loadingMessage');
  
  if(!pagesGrid) return;
  
  if(loadingMessage) loadingMessage.style.display = 'flex';
  pagesGrid.innerHTML = '';
  
  for(let i = 0; i < window.__organizeState.pages.length; i++){
    const pageData = window.__organizeState.pages[i];
    if(pageData.deleted) continue;
    
    const pageCard = await createPageCard(pdfDoc, pageData, i);
    pagesGrid.appendChild(pageCard);
  }
  
  if(loadingMessage) loadingMessage.style.display = 'none';
}

async function createPageCard(pdfDoc, pageData, index){
  const card = document.createElement('div');
  card.className = 'page-card';
  card.dataset.index = index;
  card.dataset.rotation = pageData.rotation;
  
  // Thumbnail container
  const thumbnail = document.createElement('div');
  thumbnail.className = 'page-thumbnail';
  
  // Page number badge
  const pageNum = document.createElement('div');
  pageNum.className = 'page-number';
  pageNum.textContent = `Page ${pageData.pageNum}`;
  thumbnail.appendChild(pageNum);
  
  // Rotation indicator
  const rotationIndicator = document.createElement('div');
  rotationIndicator.className = 'page-rotation-indicator';
  rotationIndicator.textContent = `${pageData.rotation}°`;
  thumbnail.appendChild(rotationIndicator);
  
  // Render canvas
  try {
    const page = await pdfDoc.getPage(pageData.pageNum);
    const viewport = page.getViewport({scale: 0.5, rotation: pageData.rotation});
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise;
    
    thumbnail.appendChild(canvas);
  } catch(err){
    console.error('Thumbnail render error:', err);
    thumbnail.innerHTML += '<p style="color:#f87171;font-size:.85rem;">Error loading</p>';
  }
  
  card.appendChild(thumbnail);
  
  // Actions
  const actions = document.createElement('div');
  actions.className = 'page-actions';
  
  const rotateBtn = document.createElement('button');
  rotateBtn.className = 'page-btn rotate-btn';
  rotateBtn.innerHTML = '🔄';
  rotateBtn.addEventListener('click', () => rotatePage(index));
  
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'page-btn delete-btn';
  deleteBtn.innerHTML = '🗑️';
  deleteBtn.addEventListener('click', () => deletePage(index));
  
  actions.appendChild(rotateBtn);
  actions.appendChild(deleteBtn);
  card.appendChild(actions);
  
  return card;
}

function initializeSortable(){
  const pagesGrid = $('#pagesGrid');
  if(!pagesGrid) return;
  
  if(sortableInstance){
    sortableInstance.destroy();
  }
  
  sortableInstance = Sortable.create(pagesGrid, {
    animation: 150,
    ghostClass: 'sortable-ghost',
    dragClass: 'sortable-drag',
    onEnd: function(evt){
      // Update internal pages array order
      const oldIndex = evt.oldIndex;
      const newIndex = evt.newIndex;
      
      if(oldIndex !== newIndex){
        const movedPage = window.__organizeState.pages.splice(oldIndex, 1)[0];
        window.__organizeState.pages.splice(newIndex, 0, movedPage);
        
        setStatus(`✅ Page moved from position ${oldIndex + 1} to ${newIndex + 1}`);
      }
    }
  });
}

async function rotatePage(index){
  const pageData = window.__organizeState.pages[index];
  if(!pageData || pageData.deleted) return;
  
  pageData.rotation = (pageData.rotation + 90) % 360;
  
  setStatus(`🔄 Rotating page ${pageData.pageNum} to ${pageData.rotation}°...`);
  
  // Re-render just this card
  const pagesGrid = $('#pagesGrid');
  const cards = pagesGrid.querySelectorAll('.page-card');
  const card = cards[index];
  
  const newCard = await createPageCard(window.__organizeState.pdfDoc, pageData, index);
  card.replaceWith(newCard);
  
  setStatus(`✅ Page ${pageData.pageNum} rotated to ${pageData.rotation}°`);
}

function deletePage(index){
  const pageData = window.__organizeState.pages[index];
  if(!pageData || pageData.deleted) return;
  
  if(!confirm(`Delete page ${pageData.pageNum}?`)) return;
  
  pageData.deleted = true;
  
  const pagesGrid = $('#pagesGrid');
  const cards = pagesGrid.querySelectorAll('.page-card');
  const card = cards[index];
  
  if(card){
    card.style.opacity = '0';
    card.style.transform = 'scale(0.8)';
    setTimeout(() => card.remove(), 200);
  }
  
  const remaining = window.__organizeState.pages.filter(p => !p.deleted).length;
  const pageCount = $('#pageCount');
  if(pageCount) pageCount.textContent = `${remaining} pages`;
  
  setStatus(`🗑️ Page ${pageData.pageNum} deleted. ${remaining} pages remaining.`);
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
  const downloadBtn = $('#downloadBtn');
  
  if(resetBtn){
    resetBtn.addEventListener('click', ()=>{
      const input=$('#fileInput'); 
      if(input) input.value='';
      resetUI();
    });
  }

  if(downloadBtn){
    downloadBtn.addEventListener('click', async ()=>{
      if(!window.__organizeState.pdfDoc){
        setStatus('❌ No PDF loaded.');
        return;
      }
      
      const activePagesCount = window.__organizeState.pages.filter(p => !p.deleted).length;
      
      if(activePagesCount === 0){
        setStatus('❌ No pages to download. All pages were deleted.');
        return;
      }
      
      setStatus('📦 Preparing organized PDF...');
      setProgress(50);
      
      try {
        const formData = new FormData();
        formData.append('pdf', window.__organizeState.originalFile);
        
        const operations = window.__organizeState.pages
          .map((p, idx) => ({
            originalPage: p.pageNum,
            newPosition: idx + 1,
            rotation: p.rotation,
            deleted: p.deleted
          }));
        
        formData.append('operations', JSON.stringify(operations));
        
        setStatus('☁️ Uploading to server...');
        setProgress(70);
        
        const response = await fetch('http://localhost:3000/api/organize-pdf', {
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
        const filename = 'organized.pdf';
        
        const tempLink = document.createElement('a');
        tempLink.href = url;
        tempLink.download = filename;
        tempLink.click();
        
        setProgress(100);
        setStatus('✅ Organized PDF downloaded!');
        
      } catch(err){
        console.error('Download failed:', err);
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
  bindActions();
  resetUI();
  highlightActive();
  document.documentElement.classList.add('route-ready');
});
