// Frontend-only: multi-file validation, ordering UI, global drop overlay, persistent nav highlight.
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

function formatBytes(bytes){ if(bytes==null||isNaN(bytes)) return '—'; const u=['B','KB','MB','GB']; let i=0,v=bytes; while(v>=1024&&i<u.length-1){v/=1024;i++;} return `${v.toFixed(i===0?0:1)} ${u[i]}`; }
function estimatePagesFromSize(bytes){ if(!bytes) return '—'; const avg=120*1024; return Math.max(1, Math.round(bytes/avg)); }

function validateFiles(files){
  const MAX_TOTAL = 20*1024*1024;
  if(!files || !files.length) return {ok:false,msg:'No PDFs selected.'};
  let total=0;
  for(const f of files){
    const isPdf = (f.name||'').toLowerCase().endsWith('.pdf') || f.type==='application/pdf';
    if(!isPdf) return {ok:false,msg:'Only PDF files are accepted.'};
    total += f.size||0;
    if(total > MAX_TOTAL) return {ok:false,msg:'Total size exceeds 20 MB.'};
  }
  return {ok:true,total};
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
  setStatus('Add PDFs to begin.'); 
  setProgress(0);
  const kFilesCount = $('#kFilesCount');
  const kTotalSize = $('#kTotalSize');
  const kEstPages = $('#kEstPages');
  const downloadBloc = $('#downloadBloc');
  const convertBtn = $('#convertBtn');
  
  if(kFilesCount) kFilesCount.textContent='—';
  if(kTotalSize) kTotalSize.textContent='—';
  if(kEstPages) kEstPages.textContent='—';
  if(downloadBloc) downloadBloc.classList.add('hidden');
  if(convertBtn) convertBtn.disabled=true;
  renderList([]);
}

function renderList(files){
  const ul = $('#fileList');
  if(!ul) return;
  
  ul.innerHTML = '';
  files.forEach((f, idx)=>{
    const li = document.createElement('li');
    li.className = 'file-item';
    li.dataset.index = idx;
    li.innerHTML = `
      <span class="file-name" title="${f.name}">${f.name}</span>
      <span class="file-size">${formatBytes(f.size||0)}</span>
      <div class="file-ctrls">
        <button type="button" class="up">↑</button>
        <button type="button" class="down">↓</button>
        <button type="button" class="del">✕</button>
      </div>
    `;
    ul.appendChild(li);
  });
}

function onFilesChosen(fileList){
  const incoming = Array.from(fileList||[]);
  let files = (window.__mergeFiles || []).concat(incoming);
  const check = validateFiles(files);
  if(!check.ok){
    setStatus(check.msg);
    if(!window.__mergeFiles || !window.__mergeFiles.length){ resetUI(); }
    return;
  }
  
  window.__mergeFiles = files;
  renderList(files);
  
  const kFilesCount = $('#kFilesCount');
  const kTotalSize = $('#kTotalSize');
  const kEstPages = $('#kEstPages');
  const convertBtn = $('#convertBtn');
  
  if(kFilesCount) kFilesCount.textContent = files.length;
  if(kTotalSize) kTotalSize.textContent = formatBytes(check.total);
  
  const totalPagesEst = files.reduce((sum,f)=> sum + (typeof f.size==='number' ? estimatePagesFromSize(f.size) : 1), 0);
  if(kEstPages) kEstPages.textContent = totalPagesEst;
  
  setStatus('Ready to merge.');
  setProgress(12);
  if(convertBtn) convertBtn.disabled = false;
}

function bindListControls(){
  const fileList = $('#fileList');
  if(!fileList) return;
  
  fileList.addEventListener('click', (e)=>{
    const btn = e.target.closest('button'); if(!btn) return;
    const li = e.target.closest('.file-item'); if(!li) return;
    const idx = parseInt(li.dataset.index,10);
    let files = window.__mergeFiles || [];
    
    if(btn.classList.contains('up') && idx>0){
      [files[idx-1], files[idx]] = [files[idx], files[idx-1]];
    } else if(btn.classList.contains('down') && idx<files.length-1){
      [files[idx+1], files[idx]] = [files[idx], files[idx+1]];
    } else if(btn.classList.contains('del')){
      files.splice(idx,1);
    } else {
      return;
    }
    
    window.__mergeFiles = files;
    renderList(files);
    $$('#fileList .file-item').forEach((el,i)=> el.dataset.index = i);
    
    const total = files.reduce((s,f)=> s + (f.size||0), 0);
    const kFilesCount = $('#kFilesCount');
    const kTotalSize = $('#kTotalSize');
    const kEstPages = $('#kEstPages');
    const convertBtn = $('#convertBtn');
    
    if(kFilesCount) kFilesCount.textContent = files.length || '—';
    if(kTotalSize) kTotalSize.textContent = files.length ? formatBytes(total) : '—';
    if(kEstPages) kEstPages.textContent = files.length ? files.reduce((sum,f)=> sum + (typeof f.size==='number' ? estimatePagesFromSize(f.size) : 1), 0) : '—';
    if(convertBtn) convertBtn.disabled = files.length === 0;
    
    setStatus(files.length ? 'Ready to merge.' : 'Add PDFs to begin.');
  });
}

function bindSortButtons(){
  const sortName = $('#sortName');
  const sortTime = $('#sortTime');
  const clearList = $('#clearList');
  
  if(sortName){
    sortName.addEventListener('click', ()=>{
      let files = window.__mergeFiles || [];
      files.sort((a,b)=> (a.name||'').localeCompare(b.name||''));
      window.__mergeFiles = files; 
      renderList(files); 
      $$('#fileList .file-item').forEach((el,i)=> el.dataset.index=i);
    });
  }
  
  if(sortTime){
    sortTime.addEventListener('click', ()=>{
      let files = window.__mergeFiles || [];
      files.sort((a,b)=> (a.lastModified||0) - (b.lastModified||0));
      window.__mergeFiles = files; 
      renderList(files); 
      $$('#fileList .file-item').forEach((el,i)=> el.dataset.index=i);
    });
  }
  
  if(clearList){
    clearList.addEventListener('click', ()=>{ 
      window.__mergeFiles=[]; 
      resetUI(); 
    });
  }
}

function bindDropzone(){
  const dz=$('#dropzone'), input=$('#fileInput'), browseBtn=$('#browseBtn');
  if(!dz || !input || !browseBtn) return;
  
  browseBtn.addEventListener('click', ()=> input.click());
  input.addEventListener('change', e=> onFilesChosen(e.target.files));
  
  dz.addEventListener('dragenter', e=>{ e.preventDefault(); dz.classList.add('drag'); });
  dz.addEventListener('dragover', e=>{ e.preventDefault(); dz.classList.add('drag'); });
  dz.addEventListener('dragleave', e=>{ e.preventDefault(); dz.classList.remove('drag'); });
  dz.addEventListener('drop', e=>{ 
    e.preventDefault(); 
    e.stopPropagation();
    dz.classList.remove('drag'); 
    onFilesChosen(e.dataTransfer?.files);
  });
  dz.addEventListener('keydown', e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); input.click(); }});
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
    if(files && files.length){ onFilesChosen(files); }
  });
}

function bindActions(){
  const resetBtn = $('#resetBtn');
  const convertBtn = $('#convertBtn');
  
  if(resetBtn){
    resetBtn.addEventListener('click', ()=>{
      const input=$('#fileInput'); 
      if(input) input.value='';
      window.__mergeFiles = [];
      resetUI();
    });
  }

  if(convertBtn){
    convertBtn.addEventListener('click', async ()=>{
      const files = window.__mergeFiles || [];
      const check = validateFiles(files);
      if(!check.ok){ setStatus(check.msg); return; }

      // ✨ REAL BACKEND CONVERSION
      try {
        convertBtn.disabled = true;
        const downloadBloc = $('#downloadBloc');
        if(downloadBloc) downloadBloc.classList.add('hidden');
        
        setStatus('📦 Preparing PDFs...'); 
        setProgress(15);
        
        const formData = new FormData();
        files.forEach(file => {
          formData.append('files', file);
        });
        
        setStatus('☁️ Uploading to server...'); 
        setProgress(35);
        
        const response = await fetch('https://blitz-backend-wdwl.onrender.com/api/merge-pdf', {
          method: 'POST',
          body: formData
        });
        
        setStatus('🔄 Merging PDFs...'); 
        setProgress(65);
        
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `Server error: ${response.status}`);
        }
        
        setStatus('📥 Preparing download...'); 
        setProgress(85);
        
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const filename = 'merged.pdf';
        
        setProgress(100);
        setStatus('✅ Merge complete!');
        
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
        console.error('Merge failed:', err);
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
  bindListControls();
  bindSortButtons();
  bindActions();
  resetUI();
  highlightActive();
  document.documentElement.classList.add('route-ready');
});
