const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

function formatBytes(bytes){ if(bytes==null||isNaN(bytes)) return '—'; const u=['B','KB','MB','GB']; let i=0,v=bytes; while(v>=1024&&i<u.length-1){v/=1024;i++;} return `${v.toFixed(i===0?0:1)} ${u[i]}`; }
function estimatePagesFromSize(bytes){ if(!bytes) return '—'; const avg=120*1024; return Math.max(1, Math.round(bytes/avg)); }

// Store files globally
window.__signState = { pdf: null, sig: null };

function validatePdf(file){
  const MAX = 20*1024*1024;
  if(!file) return {ok:false,msg:'No PDF selected.'};
  const isPdf = (file.name||'').toLowerCase().endsWith('.pdf') || file.type==='application/pdf';
  if(!isPdf) return {ok:false,msg:'Only PDF files are accepted.'};
  if((file.size||0) > MAX) return {ok:false,msg:'PDF exceeds 20 MB.'};
  return {ok:true,size:file.size||0};
}

function validateImage(file){
  const MAX = 5*1024*1024;
  if(!file) return {ok:false,msg:'No signature image selected.'};
  const isOk = /(\.png|\.jpg|\.jpeg)$/i.test(file.name||'') || /^image\/(png|jpeg)$/.test(file.type||'');
  if(!isOk) return {ok:false,msg:'Signature must be PNG or JPG.'};
  if((file.size||0) > MAX) return {ok:false,msg:'Signature image exceeds 5 MB.'};
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
  setStatus('Add a PDF and signature image to begin.'); 
  setProgress(0);
  
  const kFileName = $('#kFileName');
  const kSigName = $('#kSigName');
  const kEstPages = $('#kEstPages');
  const downloadBloc = $('#downloadBloc');
  const convertBtn = $('#convertBtn');
  const targetPages = $('#targetPages');
  const customRange = $('#customRange');
  const positionMode = $('#positionMode');
  const posPreset = $('#posPreset');
  const scalePct = $('#scalePct');
  const manualX = $('#manualX');
  const manualY = $('#manualY');
  
  if(kFileName) kFileName.textContent='—';
  if(kSigName) kSigName.textContent='—';
  if(kEstPages) kEstPages.textContent='—';
  if(downloadBloc) downloadBloc.classList.add('hidden');
  if(convertBtn) convertBtn.disabled = true;
  if(targetPages) targetPages.value='last';
  if(customRange) customRange.value='';
  if(positionMode) positionMode.value='preset';
  if(posPreset) posPreset.value='bottom-right';
  if(scalePct) scalePct.value='100';
  if(manualX) manualX.value='';
  if(manualY) manualY.value='';
  
  togglePositionMode();
  toggleCustomRange();
  
  window.__signState = { pdf: null, sig: null };
}

function togglePositionMode(){
  const mode = $('#positionMode')?.value;
  const presetGroup = $('#presetGroup');
  const manualGroup = $('#manualGroup');
  
  if(mode === 'manual'){
    if(presetGroup) presetGroup.style.display = 'none';
    if(manualGroup) manualGroup.style.display = 'grid';
  } else {
    if(presetGroup) presetGroup.style.display = 'block';
    if(manualGroup) manualGroup.style.display = 'none';
  }
}

function toggleCustomRange(){
  const pages = $('#targetPages')?.value;
  const customGroup = $('#customRangeGroup');
  
  if(pages === 'custom'){
    if(customGroup) customGroup.style.display = 'block';
  } else {
    if(customGroup) customGroup.style.display = 'none';
  }
}

function updateConvertButton(){
  const convertBtn = $('#convertBtn');
  if(!convertBtn) return;
  
  const hasBoth = window.__signState.pdf && window.__signState.sig;
  convertBtn.disabled = !hasBoth;
  
  if(hasBoth){
    setStatus('Ready to sign PDF.');
    setProgress(12);
  }
}

function onPdfChosen(file){
  const check = validatePdf(file);
  if(!check.ok){ 
    setStatus(check.msg); 
    return; 
  }
  
  window.__signState.pdf = file;
  
  const kFileName = $('#kFileName');
  const kEstPages = $('#kEstPages');
  
  if(kFileName) kFileName.textContent = file.name || '—';
  if(kEstPages) kEstPages.textContent = estimatePagesFromSize(file.size||0);
  
  updateConvertButton();
}

function onSigChosen(file){
  const check = validateImage(file);
  if(!check.ok){ 
    setStatus(check.msg); 
    return; 
  }
  
  window.__signState.sig = file;
  
  const kSigName = $('#kSigName');
  if(kSigName) kSigName.textContent = file.name || '—';
  
  updateConvertButton();
}

function bindDropzone(){
  // PDF dropzone
  const pdfDz=$('#pdfDrop'), pdfInput=$('#pdfInput'), pdfBtn=$('#browsePdfBtn');
  if(pdfDz && pdfInput && pdfBtn){
    pdfBtn.addEventListener('click', ()=> pdfInput.click());
    pdfInput.addEventListener('change', e=> {
      const f = e.target.files?.[0];
      if(f) onPdfChosen(f);
    });
    
    pdfDz.addEventListener('dragenter', e=>{ e.preventDefault(); pdfDz.classList.add('drag'); });
    pdfDz.addEventListener('dragover', e=>{ e.preventDefault(); pdfDz.classList.add('drag'); });
    pdfDz.addEventListener('dragleave', e=>{ e.preventDefault(); pdfDz.classList.remove('drag'); });
    pdfDz.addEventListener('drop', e=>{ 
      e.preventDefault(); 
      e.stopPropagation();
      pdfDz.classList.remove('drag'); 
      const f = e.dataTransfer?.files?.[0];
      if(f) onPdfChosen(f);
    });
    pdfDz.addEventListener('keydown', e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); pdfInput.click(); }});
  }

  // Signature dropzone
  const sigDz=$('#sigDrop'), sigInput=$('#sigInput'), sigBtn=$('#browseSigBtn');
  if(sigDz && sigInput && sigBtn){
    sigBtn.addEventListener('click', ()=> sigInput.click());
    sigInput.addEventListener('change', e=> {
      const f = e.target.files?.[0];
      if(f) onSigChosen(f);
    });
    
    sigDz.addEventListener('dragenter', e=>{ e.preventDefault(); sigDz.classList.add('drag'); });
    sigDz.addEventListener('dragover', e=>{ e.preventDefault(); sigDz.classList.add('drag'); });
    sigDz.addEventListener('dragleave', e=>{ e.preventDefault(); sigDz.classList.remove('drag'); });
    sigDz.addEventListener('drop', e=>{ 
      e.preventDefault(); 
      e.stopPropagation();
      sigDz.classList.remove('drag'); 
      const f = e.dataTransfer?.files?.[0];
      if(f) onSigChosen(f);
    });
    sigDz.addEventListener('keydown', e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); sigInput.click(); }});
  }
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
    if(files && files.length){
      // Smart detection: PDF or image
      const pdf = Array.from(files).find(f=>(/\.pdf$/i.test(f.name||'') || f.type==='application/pdf'));
      const img = Array.from(files).find(f=>/\.(png|jpe?g)$/i.test(f.name||'') || /^image\/(png|jpeg)$/.test(f.type||''));
      
      if(pdf) onPdfChosen(pdf);
      if(img) onSigChosen(img);
    }
  });
}

function bindModeToggles(){
  const positionMode = $('#positionMode');
  const targetPages = $('#targetPages');
  
  if(positionMode){
    positionMode.addEventListener('change', togglePositionMode);
  }
  
  if(targetPages){
    targetPages.addEventListener('change', toggleCustomRange);
  }
}

function bindActions(){
  const resetBtn = $('#resetBtn');
  const convertBtn = $('#convertBtn');
  
  if(resetBtn){
    resetBtn.addEventListener('click', ()=>{
      const pdfInput=$('#pdfInput');
      const sigInput=$('#sigInput'); 
      if(pdfInput) pdfInput.value='';
      if(sigInput) sigInput.value='';
      resetUI();
    });
  }

  if(convertBtn){
    convertBtn.addEventListener('click', async ()=>{
      const st = window.__signState;
      
      const pdfCheck = validatePdf(st.pdf);
      const sigCheck = validateImage(st.sig);
      
      if(!pdfCheck.ok){ setStatus(pdfCheck.msg); return; }
      if(!sigCheck.ok){ setStatus(sigCheck.msg); return; }

      const targetPages = $('#targetPages');
      const customRange = $('#customRange');
      const positionMode = $('#positionMode');
      const posPreset = $('#posPreset');
      const manualX = $('#manualX');
      const manualY = $('#manualY');
      const scalePct = $('#scalePct');
      
      const pagesMode = targetPages?.value || 'last';
      const rangeValue = customRange?.value?.trim() || '';
      
      // Validate custom range if selected
      if(pagesMode === 'custom' && !rangeValue){
        setStatus('❌ Please enter a page range (e.g., 1-3, 5, 7-10)');
        return;
      }

      // ✨ REAL BACKEND CONVERSION
      try {
        convertBtn.disabled = true;
        const downloadBloc = $('#downloadBloc');
        if(downloadBloc) downloadBloc.classList.add('hidden');
        
        setStatus('📦 Preparing files...'); 
        setProgress(15);
        
        const formData = new FormData();
        formData.append('pdf', st.pdf);
        formData.append('signature', st.sig);
        formData.append('pages', pagesMode === 'custom' ? rangeValue : pagesMode);
        formData.append('scale', scalePct?.value || '100');
        
        const posMode = positionMode?.value;
        if(posMode === 'manual'){
          const x = manualX?.value?.trim();
          const y = manualY?.value?.trim();
          if(!x || !y){
            setStatus('❌ Please enter both X and Y coordinates');
            convertBtn.disabled = false;
            return;
          }
          formData.append('position', 'manual');
          formData.append('x', x);
          formData.append('y', y);
        } else {
          formData.append('position', posPreset?.value || 'bottom-right');
        }
        
        setStatus('☁️ Uploading to server...'); 
        setProgress(35);
        
        const response = await fetch('http://localhost:3000/api/sign-pdf', {
          method: 'POST',
          body: formData
        });
        
        setStatus('✍️ Adding signature to PDF...'); 
        setProgress(65);
        
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `Server error: ${response.status}`);
        }
        
        setStatus('📥 Preparing download...'); 
        setProgress(85);
        
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const base = (st.pdf.name.replace(/\.pdf$/i,'') || 'document');
        const filename = `${base}-signed.pdf`;
        
        setProgress(100);
        setStatus('✅ Signature added successfully!');
        
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
        console.error('Sign failed:', err);
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
  bindModeToggles();
  bindActions();
  resetUI();
  highlightActive();
  document.documentElement.classList.add('route-ready');
});
