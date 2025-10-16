// Backend-integrated Word → PDF converter with real API calls
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

// Keep your existing helper functions
function formatBytes(bytes){ if(bytes==null||isNaN(bytes)) return '—'; const u=['B','KB','MB','GB']; let i=0,v=bytes; while(v>=1024&&i<u.length-1){v/=1024;i++;} return `${v.toFixed(i===0?0:1)} ${u[i]}`; }
function estimatePagesFromSize(bytes){ if(!bytes) return '—'; const avg=160*1024; return Math.max(1, Math.round(bytes/avg)); }

function validateFile(file){
  const MAX = 20*1024*1024;
  if(!file) return {ok:false,msg:'No file selected.'};
  const name = (file.name||'').toLowerCase();
  const type = file.type || '';
  const isDoc = name.endsWith('.docx') || name.endsWith('.doc') ||
    type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    type === 'application/msword';
  if(!isDoc) return {ok:false,msg:'Only .docx or .doc files are accepted.'};
  if(file.size > MAX) return {ok:false,msg:'File exceeds 20 MB limit.'};
  return {ok:true};
}

function setStatus(t){ $('#statusLine').textContent=t; }
function setProgress(p){ $('#progressBar').style.width = `${Math.max(0,Math.min(100,p))}%`; }
function resetUI(){
  setStatus('Select a Word file to begin.'); setProgress(0);
  $('#kFileName').textContent='—'; $('#kFileSize').textContent='—'; $('#kPages').textContent='—';
  $('#downloadBloc').classList.add('hidden'); $('#convertBtn').disabled=true;
}

// Store the current file globally so both drag-drop and browse can access it
let currentFile = null;

function onFileChosen(file){
  const check=validateFile(file);
  if(!check.ok){ setStatus(check.msg); resetUI(); return; }
  
  // Store file globally
  currentFile = file;
  
  $('#kFileName').textContent=file.name;
  $('#kFileSize').textContent=formatBytes(file.size);
  $('#kPages').textContent=estimatePagesFromSize(file.size);
  setStatus('Ready to convert.'); setProgress(12); $('#convertBtn').disabled=false;
}

function bindDropzone(){
  const dz=$('#dropzone'), input=$('#fileInput'), browseBtn=$('#browseBtn');
  
  browseBtn?.addEventListener('click', ()=> input?.click());
  
  input?.addEventListener('change', e=>{ 
    const f=e.target.files?.[0]; 
    if(f) onFileChosen(f); 
  });
  
  ['dragenter','dragover'].forEach(ev=> dz.addEventListener(ev, e=>{ 
    e.preventDefault(); 
    dz.classList.add('drag'); 
  }));
  
  ['dragleave','drop'].forEach(ev=> dz.addEventListener(ev, e=>{ 
    e.preventDefault(); 
    dz.classList.remove('drag'); 
  }));
  
  dz.addEventListener('drop', e=>{ 
    const f=e.dataTransfer?.files?.[0]; 
    if(f) {
      onFileChosen(f);
      // Also update the input element so form works consistently
      const dt = new DataTransfer();
      dt.items.add(f);
      input.files = dt.files;
    }
  });
  
  dz.addEventListener('keydown', e=>{ 
    if(e.key==='Enter'||e.key===' '){ 
      e.preventDefault(); 
      input?.click(); 
    }
  });
}


function bindGlobalDrop(){
  const overlay=$('#globalDrop'); let dragDepth=0;
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

// ✨ NEW: Real backend conversion
async function convertWordToPdf(file) {
  const API_URL = 'https://blitz-backend-wdwl.onrender.com/api/word-to-pdf';
  
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    setStatus('Uploading to server...'); 
    setProgress(30);
    
    const response = await fetch(API_URL, {
      method: 'POST',
      body: formData
    });
    
    setProgress(60);
    setStatus('Converting Word → PDF...');
    
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Server error: ${response.status}`);
    }
    
    setProgress(90);
    setStatus('Finalizing download...');
    
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const base = (file?.name?.replace(/\.(docx|doc)$/i,'') || 'document');
    const filename = `${base}.pdf`;
    
    // Update download link
    $('#downloadLink').setAttribute('href', url);
    $('#downloadLink').setAttribute('download', filename);
    $('#downloadBloc').classList.remove('hidden');
    
    setProgress(100);
    setStatus('✅ Conversion complete! Click download below.');
    
    // Auto-trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    
  } catch (err) {
    console.error('Conversion failed:', err);
    setStatus(`❌ Error: ${err.message}`);
    setProgress(0);
  }
}

function bindActions(){
  $('#resetBtn')?.addEventListener('click', ()=>{
    const input=$('#fileInput'); if(input) input.value='';
    $('#pageRange').value=''; $('#pageSize').value='auto'; $('#margins').value='doc';
    $('#embedFonts').value='auto'; $('#imagePolicy').value='keep'; $('#imageMax').value='';
    $('#pdfVersion').value='1.7'; $('#compress').value='auto'; $('#dpi').value='';
    $('#bookmarks').value='auto'; $('#comments').value='hide'; $('#trackChanges').value='final';
    resetUI();
  });

  $('#convertBtn')?.addEventListener('click', async ()=>{
  // Use the globally stored file instead of reading from input
  const file = currentFile || $('#fileInput')?.files?.[0];
  const check=validateFile(file); 
  if(!check.ok){ setStatus(check.msg); return; }
  
  $('#convertBtn').disabled = true;
  await convertWordToPdf(file);
  $('#convertBtn').disabled = false;
});

}

function highlightActive(){
  const fileNav = document.getElementById('navFilePdf');
  const fileDrawerNav = document.getElementById('drawerFilePdf');
  fileNav && fileNav.classList.add('active');
  fileDrawerNav && fileDrawerNav.classList.add('active');
}

document.addEventListener('DOMContentLoaded', ()=>{
  bindDropzone();
  bindGlobalDrop();
  bindActions();
  resetUI();
  highlightActive();
  document.documentElement.classList.add('route-ready');
});
