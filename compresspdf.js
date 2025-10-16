const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

function formatBytes(bytes){ if(bytes==null||isNaN(bytes)) return '—'; const u=['B','KB','MB','GB']; let i=0,v=bytes; while(v>=1024&&i<u.length-1){v/=1024;i++;} return `${v.toFixed(i===0?0:1)} ${u[i]}`; }
function estimatePagesFromSize(bytes){ if(!bytes) return '—'; const avg=120*1024; return Math.max(1, Math.round(bytes/avg)); }

// Store selected file and original size globally
window.__compressFile = null;
window.__originalSize = 0;

function validateFile(file){
  const MAX = 20*1024*1024;
  if(!file) return {ok:false,msg:'No PDF selected.'};
  const isPdf = (file.name||'').toLowerCase().endsWith('.pdf') || file.type==='application/pdf';
  if(!isPdf) return {ok:false,msg:'Only PDF files are accepted.'};
  if((file.size||0) > MAX) return {ok:false,msg:'File exceeds 20 MB.'};
  return {ok:true,size:file.size||0};
}

function setStatus(t){ 
  const el = $('#statusLine');
  if(el) el.textContent=t; 
}

function setProgress(p){ 
  const el = $('#progressBar');
  if(el) el.style.width = `${Math.max(0,Math.min(100,p))}%`; 
}

function resetUI(){
  setStatus('Add a PDF to begin.'); 
  setProgress(0);
  
  const kFileName = $('#kFileName');
  const kFileSize = $('#kFileSize');
  const kEstPages = $('#kEstPages');
  const downloadBloc = $('#downloadBloc');
  const convertBtn = $('#convertBtn');
  const compressionLevel = $('#compressionLevel');
  
  if(kFileName) kFileName.textContent='—';
  if(kFileSize) kFileSize.textContent='—';
  if(kEstPages) kEstPages.textContent='—';
  if(downloadBloc) downloadBloc.classList.add('hidden');
  if(convertBtn) convertBtn.disabled = true;
  if(compressionLevel) compressionLevel.value = 'medium';
  
  window.__compressFile = null;
  window.__originalSize = 0;
}

function onFileChosen(file){
  const check = validateFile(file);
  if(!check.ok){ 
    setStatus(check.msg); 
    resetUI();
    return; 
  }
  
  window.__compressFile = file;
  window.__originalSize = file.size || 0;
  
  const kFileName = $('#kFileName');
  const kFileSize = $('#kFileSize');
  const kEstPages = $('#kEstPages');
  const convertBtn = $('#convertBtn');
  
  if(kFileName) kFileName.textContent = file.name || '—';
  if(kFileSize) kFileSize.textContent = formatBytes(file.size||0);
  if(kEstPages) kEstPages.textContent = estimatePagesFromSize(file.size||0);
  
  setStatus('Ready to compress PDF.');
  setProgress(12);
  
  if(convertBtn) convertBtn.disabled = false;
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
  const convertBtn = $('#convertBtn');
  
  if(resetBtn){
    resetBtn.addEventListener('click', ()=>{
      const input=$('#fileInput'); 
      if(input) input.value='';
      resetUI();
    });
  }

  if(convertBtn){
    convertBtn.addEventListener('click', async ()=>{
      const file = window.__compressFile;
      const check = validateFile(file);
      if(!check.ok){ 
        setStatus(check.msg); 
        return; 
      }

      const compressionLevel = $('#compressionLevel')?.value || 'medium';

      // ✨ REAL BACKEND CONVERSION
      try {
        convertBtn.disabled = true;
        const downloadBloc = $('#downloadBloc');
        if(downloadBloc) downloadBloc.classList.add('hidden');
        
        setStatus('📦 Preparing PDF...'); 
        setProgress(15);
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('level', compressionLevel);
        
        setStatus('☁️ Uploading to server...'); 
        setProgress(35);
        
        const response = await fetch('https://blitz-backend-wdwl.onrender.com/api/compress-pdf', {
          method: 'POST',
          body: formData
        });
        
        setStatus('🗜️ Compressing PDF...'); 
        setProgress(65);
        
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `Server error: ${response.status}`);
        }
        
        setStatus('📥 Preparing download...'); 
        setProgress(85);
        
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const base = (file.name.replace(/\.pdf$/i,'') || 'document');
        const filename = `${base}-compressed.pdf`;
        
        // Calculate compression stats
        const newSize = blob.size;
        const originalSize = window.__originalSize;
        const reduction = originalSize > 0 ? Math.round((1 - newSize / originalSize) * 100) : 0;
        
        setProgress(100);
        setStatus('✅ Compression complete!');
        
        // Update stats
        const newSizeEl = $('#newSize');
        const reductionEl = $('#reduction');
        if(newSizeEl) newSizeEl.textContent = formatBytes(newSize);
        if(reductionEl) reductionEl.textContent = reduction > 0 ? `${reduction}% smaller` : 'No reduction';
        
        const downloadLink = $('#downloadLink');
        if(downloadLink) {
          downloadLink.setAttribute('href', url);
          downloadLink.setAttribute('download', filename);
        }
        if(downloadBloc) downloadBloc.classList.remove('hidden');
        
        // Auto-download
        const tempLink = document.createElement('a');
        tempLink.href = url;
        tempLink.download = filename;
        tempLink.click();
        
        convertBtn.disabled = false;
        
      } catch (err) {
        console.error('Compress failed:', err);
        setStatus(`❌ Error: ${err.message}`);
        setProgress(0);
        convertBtn.disabled = false;
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
