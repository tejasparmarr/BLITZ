// Frontend-only: validation, UX state, global drop overlay, persistent nav highlight.
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

function formatBytes(bytes){ if(bytes==null||isNaN(bytes)) return '—'; const u=['B','KB','MB','GB']; let i=0,v=bytes; while(v>=1024&&i<u.length-1){v/=1024;i++;} return `${v.toFixed(i===0?0:1)} ${u[i]}`; }
function estimatePagesFromSize(bytes){ if(!bytes) return '—'; const avg=120*1024; return Math.max(1, Math.round(bytes/avg)); }

// Store selected file globally
window.__pdfToJpgFile = null;

function validateFile(file){
  const MAX = 20*1024*1024;
  if(!file) return {ok:false,msg:'No file selected.'};
  const isPdf = file.type==='application/pdf' || (file.name||'').toLowerCase().endsWith('.pdf');
  if(!isPdf) return {ok:false,msg:'Only PDF files are accepted.'};
  if(file.size > MAX) return {ok:false,msg:'File exceeds 20 MB limit.'};
  return {ok:true};
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
  setStatus('Select a PDF to begin.'); 
  setProgress(0);
  const kFileName = $('#kFileName');
  const kFileSize = $('#kFileSize');
  const kPages = $('#kPages');
  const downloadBloc = $('#downloadBloc');
  const btn = $('#convertBtn');
  
  if(kFileName) kFileName.textContent='—';
  if(kFileSize) kFileSize.textContent='—';
  if(kPages) kPages.textContent='—';
  if(downloadBloc) downloadBloc.classList.add('hidden');
  if(btn) btn.disabled=true;
}

function onFileChosen(file){
  const check=validateFile(file);
  if(!check.ok){ 
    setStatus(check.msg); 
    resetUI(); 
    return; 
  }
  
  // Store file globally
  window.__pdfToJpgFile = file;
  
  const kFileName = $('#kFileName');
  const kFileSize = $('#kFileSize');
  const kPages = $('#kPages');
  const btn = $('#convertBtn');
  
  if(kFileName) kFileName.textContent=file.name;
  if(kFileSize) kFileSize.textContent=formatBytes(file.size);
  if(kPages) kPages.textContent=estimatePagesFromSize(file.size);
  
  setStatus('Ready to convert.'); 
  setProgress(12); 
  
  if(btn) btn.disabled=false;
}

function bindDropzone(){
  const dz=$('#dropzone'), input=$('#fileInput'), browseBtn=$('#browseBtn');
  if(!dz || !input || !browseBtn) return;
  
  browseBtn.addEventListener('click', ()=> input.click());
  
  input.addEventListener('change', e=>{ 
    const f=e.target.files?.[0]; 
    if(f) onFileChosen(f); 
  });
  
  dz.addEventListener('dragenter', e=>{ 
    e.preventDefault(); 
    dz.classList.add('drag'); 
  });
  
  dz.addEventListener('dragover', e=>{ 
    e.preventDefault(); 
    dz.classList.add('drag'); 
  });
  
  dz.addEventListener('dragleave', e=>{ 
    e.preventDefault(); 
    dz.classList.remove('drag'); 
  });
  
  dz.addEventListener('drop', e=>{ 
    e.preventDefault(); 
    e.stopPropagation();
    dz.classList.remove('drag');
    const f=e.dataTransfer?.files?.[0]; 
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
    // Only show if dragging files
    if(e.dataTransfer && e.dataTransfer.types && e.dataTransfer.types.indexOf('Files') !== -1) { 
      dragDepth++; 
      show(); 
    }
  });
  
  document.addEventListener('dragover', e=>{ 
    if(overlay.classList.contains('show')) {
      e.preventDefault();
    }
  });
  
  document.addEventListener('dragleave', e=>{ 
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
    if(files && files.length){ 
      onFileChosen(files[0]); 
    }
  });
}

function bindActions(){
  const resetBtn = $('#resetBtn');
  const convertBtn = $('#convertBtn');
  
  if(resetBtn){
    resetBtn.addEventListener('click', ()=>{
      const input=$('#fileInput'); 
      if(input) input.value='';
      window.__pdfToJpgFile = null;
      const dpiSelect = $('#dpi');
      const qualitySelect = $('#quality');
      if(dpiSelect) dpiSelect.value='150';
      if(qualitySelect) qualitySelect.value='85';
      resetUI();
    });
  }

  if(convertBtn){
    convertBtn.addEventListener('click', async ()=>{
      const file = window.__pdfToJpgFile;
      const check=validateFile(file); 
      if(!check.ok){ 
        setStatus(check.msg); 
        return; 
      }

      // ✨ REAL BACKEND CONVERSION
      try {
        convertBtn.disabled = true;
        const downloadBloc = $('#downloadBloc');
        if(downloadBloc) downloadBloc.classList.add('hidden');
        
        setStatus('📦 Preparing PDF...'); 
        setProgress(15);
        
        const formData = new FormData();
        formData.append('file', file);
        
        const dpiSelect = $('#dpi');
        const qualitySelect = $('#quality');
        const dpi = dpiSelect?.value || '150';
        const quality = qualitySelect?.value || '85';
        formData.append('dpi', dpi);
        formData.append('quality', quality);
        
        setStatus('☁️ Uploading to server...'); 
        setProgress(35);
        
        const response = await fetch('http://localhost:3000/api/pdf-to-jpg', {
          method: 'POST',
          body: formData
        });
        
        setStatus('🔄 Converting PDF → JPG...'); 
        setProgress(65);
        
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `Server error: ${response.status}`);
        }
        
        setStatus('📥 Preparing download...'); 
        setProgress(85);
        
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const base = (file.name.replace(/\.pdf$/i,'') || 'pages');
        const filename = `${base}.zip`;
        
        setProgress(100);
        setStatus('✅ Conversion complete!');
        
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
        console.error('Conversion failed:', err);
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
