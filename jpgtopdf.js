// Frontend-only: multi-file validation, UX, global drop overlay, persistent nav highlight.
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

function formatBytes(bytes){ if(bytes==null||isNaN(bytes)) return '—'; const u=['B','KB','MB','GB']; let i=0,v=bytes; while(v>=1024&&i<u.length-1){v/=1024;i++;} return `${v.toFixed(i===0?0:1)} ${u[i]}`; }

function validateFiles(files){
  const MAX_TOTAL = 20*1024*1024;
  if(!files || !files.length) return {ok:false,msg:'No images selected.'};
  let total=0;
  for(const f of files){
    const name=(f.name||'').toLowerCase();
    const type=f.type||'';
    const isImg = name.endsWith('.jpg')||name.endsWith('.jpeg')||name.endsWith('.png')||
      type==='image/jpeg'||type==='image/png';
    if(!isImg) return {ok:false,msg:'Only JPG or PNG images are accepted.'};
    total += f.size||0;
    if(total > MAX_TOTAL) return {ok:false,msg:'Total size exceeds 20 MB.'};
  }
  return {ok:true,total};
}

function setStatus(t){ $('#statusLine').textContent=t; }
function setProgress(p){ $('#progressBar').style.width = `${Math.max(0,Math.min(100,p))}%`; }
function resetUI(){
  setStatus('Select images to begin.'); setProgress(0);
  $('#kFilesCount').textContent='—'; $('#kTotalSize').textContent='—'; $('#kEstPages').textContent='—';
  $('#downloadBloc').classList.add('hidden'); 
  const btn = $('#convertBtn');
  if(btn) btn.disabled=true;
}

function onImagesChosen(fileList){
  const files = Array.from(fileList||[]);
  const check = validateFiles(files);
  if(!check.ok){ setStatus(check.msg); resetUI(); return; }

  // Default sort by name
  files.sort((a,b)=> (a.name||'').localeCompare(b.name||''));

  $('#kFilesCount').textContent = files.length;
  $('#kTotalSize').textContent = formatBytes(check.total);
  $('#kEstPages').textContent = files.length;
  setStatus('Ready to convert.');
  setProgress(12);
  const btn = $('#convertBtn');
  if(btn) btn.disabled = false;

  // keep for later
  window.__jpgToPdfFiles = files;
}

function bindDropzone(){
  const dz=$('#dropzone'), input=$('#fileInput'), browseBtn=$('#browseBtn');
  if(!dz || !input || !browseBtn) return;
  
  browseBtn.addEventListener('click', ()=> input.click());
  input.addEventListener('change', e=> onImagesChosen(e.target.files));

  ['dragenter','dragover'].forEach(ev=> dz.addEventListener(ev, e=>{ e.preventDefault(); dz.classList.add('drag'); }));
  ['dragleave','drop'].forEach(ev=> dz.addEventListener(ev, e=>{ e.preventDefault(); dz.classList.remove('drag'); }));
  dz.addEventListener('drop', e=> onImagesChosen(e.dataTransfer?.files));
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
    if(files && files.length){ onImagesChosen(files); }
  });
}

function bindActions(){
  const resetBtn = $('#resetBtn');
  const convertBtn = $('#convertBtn');
  
  if(resetBtn){
    resetBtn.addEventListener('click', ()=>{
      const input=$('#fileInput'); 
      if(input) input.value='';
      window.__jpgToPdfFiles = undefined;
      resetUI();
    });
  }

  if(convertBtn){
    convertBtn.addEventListener('click', async ()=>{
      const files = window.__jpgToPdfFiles || [];
      const check = validateFiles(files);
      if(!check.ok){ setStatus(check.msg); return; }

      // ✨ REAL BACKEND CONVERSION
      try {
        convertBtn.disabled = true;
        $('#downloadBloc').classList.add('hidden');
        
        setStatus('📦 Preparing images...'); 
        setProgress(15);
        
        const formData = new FormData();
        files.forEach(file => {
          formData.append('files', file);
        });
        
        setStatus('☁️ Uploading to server...'); 
        setProgress(35);
        
        const response = await fetch('https://blitz-backend-wdwl.onrender.com/api/jpg-to-pdf', {
          method: 'POST',
          body: formData
        });
        
        setStatus('🔄 Converting images → PDF...'); 
        setProgress(65);
        
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `Server error: ${response.status}`);
        }
        
        setStatus('📥 Preparing download...'); 
        setProgress(85);
        
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const filename = 'images-converted.pdf';
        
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
