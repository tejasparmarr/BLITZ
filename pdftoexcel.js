// Frontend-only: validation, UX, global drop overlay, persistent nav highlight.
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

function formatBytes(bytes){ if(bytes==null||isNaN(bytes)) return '—'; const u=['B','KB','MB','GB']; let i=0,v=bytes; while(v>=1024&&i<u.length-1){v/=1024;i++;} return `${v.toFixed(i===0?0:1)} ${u[i]}`; }
function estimatePagesFromSize(bytes){ if(!bytes) return '—'; const avg=120*1024; return Math.max(1, Math.round(bytes/avg)); }

function validateFile(file){
  const MAX = 20*1024*1024;
  if(!file) return {ok:false,msg:'No file selected.'};
  const isPdf = file.type==='application/pdf' || (file.name||'').toLowerCase().endsWith('.pdf');
  if(!isPdf) return {ok:false,msg:'Only PDF files are accepted.'};
  if(file.size > MAX) return {ok:false,msg:'File exceeds 20 MB limit.'};
  return {ok:true};
}
function parseRange(input){
  if(!input || input.trim().toLowerCase()==='all') return null;
  const parts=input.split(',').map(p=>p.trim()).filter(Boolean);
  const ranges=[];
  for(const p of parts){
    if(/^\d+$/.test(p)){ ranges.push({from:+p,to:+p}); continue; }
    const m=p.match(/^(\d+)\s*-\s*(\d+)$/);
    if(m){ const a=+m[1], b=+m[2]; if(a>0&&b>0&&b>=a) ranges.push({from:a,to:b}); else return {error:'Invalid range order.'}; }
    else return {error:'Invalid range format.'};
  }
  return {ranges};
}

function setStatus(t){ $('#statusLine').textContent=t; }
function setProgress(p){ $('#progressBar').style.width = `${Math.max(0,Math.min(100,p))}%`; }
function resetUI(){
  setStatus('Select a PDF to begin.'); setProgress(0);
  $('#kFileName').textContent='—'; $('#kFileSize').textContent='—'; $('#kPages').textContent='—';
  $('#downloadBloc').classList.add('hidden'); $('#convertBtn').disabled=true;
}

function onFileChosen(file){
  const check=validateFile(file);
  if(!check.ok){ setStatus(check.msg); resetUI(); return; }
  $('#kFileName').textContent=file.name;
  $('#kFileSize').textContent=formatBytes(file.size);
  $('#kPages').textContent=estimatePagesFromSize(file.size);
  setStatus('Ready to convert.'); setProgress(12); $('#convertBtn').disabled=false;
}

function bindDropzone(){
  const dz=$('#dropzone'), input=$('#fileInput'), browseBtn=$('#browseBtn');
  browseBtn?.addEventListener('click', ()=> input?.click());
  input?.addEventListener('change', e=>{ const f=e.target.files?.[0]; onFileChosen(f); });
  ['dragenter','dragover'].forEach(ev=> dz.addEventListener(ev, e=>{ e.preventDefault(); dz.classList.add('drag'); }));
  ['dragleave','drop'].forEach(ev=> dz.addEventListener(ev, e=>{ e.preventDefault(); dz.classList.remove('drag'); }));
  dz.addEventListener('drop', e=>{ const f=e.dataTransfer?.files?.[0]; onFileChosen(f); });
  dz.addEventListener('keydown', e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); input?.click(); }});
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

function bindActions(){
  $('#resetBtn')?.addEventListener('click', ()=>{
    const input=$('#fileInput'); if(input) input.value='';
    $('#pageRange').value=''; $('#detectMode').value='auto'; $('#mergeSheets').value='per-page';
    $('#headerRows').value=''; $('#footerRows').value=''; $('#splitCols').value='auto';
    $('#numericLocale').value='auto'; $('#keepFormatting').value='minimal'; $('#timeout').value='';
    $('#cellsAsText').value='auto'; $('#trimWhitespace').value='on'; $('#removeDuplicates').value='off';
    resetUI();
  });

  $('#convertBtn')?.addEventListener('click', ()=>{
    const file=$('#fileInput')?.files?.[0];
    const check=validateFile(file); if(!check.ok){ setStatus(check.msg); return; }

    const parsed=parseRange($('#pageRange').value.trim());
    if(parsed?.error){ setStatus(parsed.error); return; }

    const jobOptions={
      ranges: parsed?.ranges || null,
      detectMode: $('#detectMode').value,
      mergeSheets: $('#mergeSheets').value,
      headerRows: $('#headerRows').value?parseInt($('#headerRows').value,10):undefined,
      footerRows: $('#footerRows').value?parseInt($('#footerRows').value,10):undefined,
      splitCols: $('#splitCols').value,
      numericLocale: $('#numericLocale').value,
      keepFormatting: $('#keepFormatting').value,
      timeout: $('#timeout').value?parseInt($('#timeout').value,10):undefined,
      cellsAsText: $('#cellsAsText').value,
      trimWhitespace: $('#trimWhitespace').value === 'on',
      removeDuplicates: $('#removeDuplicates').value === 'on'
    };

    setStatus('Queuing conversion (placeholder)…'); setProgress(25);
    setTimeout(()=>{ setStatus('Uploading (placeholder)…'); setProgress(45); }, 600);
    setTimeout(()=>{ setStatus('Detecting tables (placeholder)…'); setProgress(70); }, 1300);
    setTimeout(()=>{ setStatus('Finalizing (placeholder)…'); setProgress(90); }, 2000);
    setTimeout(()=>{
      setStatus('Done (placeholder). Backend wiring will enable download.');
      setProgress(100);
      $('#downloadBloc').classList.remove('hidden');
      $('#downloadLink').setAttribute('href','#');
      const base = (file?.name?.replace(/\.pdf$/i,'') || 'table');
      $('#downloadLink').setAttribute('download', `${base}.xlsx`);
    }, 2700);

    window.__lastPdfToExcelJob = { name:file?.name, size:file?.size, options:jobOptions };
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
