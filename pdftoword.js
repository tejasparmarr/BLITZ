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

function setStatus(t){ $('#statusLine').textContent=t; }
function setProgress(p){ $('#progressBar').style.width = `${Math.max(0,Math.min(100,p))}%`; }
function resetUI(){
  setStatus('Select a PDF to begin.'); setProgress(0);
  $('#kFileName').textContent='—'; $('#kFileSize').textContent='—'; $('#kPages').textContent='—';
  $('#downloadBloc').classList.add('hidden'); 
  const btn = $('#convertBtn');
  if(btn) btn.disabled=true;
}

function onFileChosen(file){
  const check=validateFile(file);
  if(!check.ok){ setStatus(check.msg); resetUI(); return; }
  
  // Store file globally
  window.__pdfToJpgFile = file;
  
  $('#kFileName').textContent=file.name;
  $('#kFileSize').textContent=formatBytes(file.size);
  $('#kPages').textContent=estimatePagesFromSize(file.size);
  setStatus('Ready to convert.'); setProgress(12); 
  const btn = $('#convertBtn');
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
  
  ['dragenter','dragover'].forEach(ev=> dz.addEventListener(ev, e=>{ e.preventDefault(); dz.classList.add('drag'); }));
  ['dragleave','drop'].forEach(ev=> dz.addEventListener(ev, e=>{ e.preventDefault(); dz.classList.remove('drag'); }));
  dz.addEventListener('drop', e=>{ 
    const f=e.dataTransfer?.files?.[0]; 
    if(f) onFileChosen(f); 
  });
  dz.addEventListener('keydown', e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); input.click(); }});
}

function bindGlobalDrop(){
  const overlay=$('#globalDrop'); 
  if(!overlay) return;
  
  let dragDepth=0;
  const show=()=> overlay.classList.add('show');
  const hide=()=> overlay.classList.remove('show');

  window.addEventListener('dragenter', e=>{
    if(e.dataTransfer && Array.from(e.dataTransfer.types).includes('Files')){ dragDepth++; show(); }
  });
  window.addEventListener('dragover', e=>{ if(overlay.classList.contains('show')) e.preventDefault(); });
  window.addEventListener('dragleave', ()=>{ dragDepth=Math.max(0,dragDepth-1); if(dragDepth===0) hide(); });
  window.addEventListener('drop', e=>{
    if(overlay.classList.contains('show')) e.preventDefault();
    hide(); dragDepth=0;
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
      if(!check.ok){ setStatus(check.msg); return; }

      // ✨ REAL BACKEND CONVERSION
      try {
        convertBtn.disabled = true;
        $('#downloadBloc').classList.add('hidden');
        
        setStatus('📦 Preparing PDF...'); 
        setProgress(15);
        
        const formData = new FormData();
        formData.append('file', file);
        
        const dpi = $('#dpi')?.value || '150';
        const quality = $('#quality')?.value || '85';
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
        
        $('#downloadLink').setAttribute('href', url);
        $('#downloadLink').setAttribute('download', filename);
        $('#downloadBloc').classList.remove('hidden');
        
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
