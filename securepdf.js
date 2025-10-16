const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

function formatBytes(bytes){ if(bytes==null||isNaN(bytes)) return '—'; const u=['B','KB','MB','GB']; let i=0,v=bytes; while(v>=1024&&i<u.length-1){v/=1024;i++;} return `${v.toFixed(i===0?0:1)} ${u[i]}`; }
function estimatePagesFromSize(bytes){ if(!bytes) return '—'; const avg=120*1024; return Math.max(1, Math.round(bytes/avg)); }

// Store selected file globally
window.__secureFile = null;

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
  const password = $('#password');
  const confirmPassword = $('#confirmPassword');
  const togglePassword = $('#togglePassword');
  const toggleConfirmPassword = $('#toggleConfirmPassword');
  
  if(kFileName) kFileName.textContent='—';
  if(kFileSize) kFileSize.textContent='—';
  if(kEstPages) kEstPages.textContent='—';
  if(downloadBloc) downloadBloc.classList.add('hidden');
  if(convertBtn) convertBtn.disabled = true;
  if(password) {
    password.value = '';
    password.setAttribute('type', 'password');
  }
  if(confirmPassword) {
    confirmPassword.value = '';
    confirmPassword.setAttribute('type', 'password');
  }
  
  // Reset toggle buttons
  if(togglePassword){
    togglePassword.setAttribute('aria-label', 'Show password');
    const icon = togglePassword.querySelector('.eye-icon');
    if(icon) icon.textContent = '👁️';
  }
  if(toggleConfirmPassword){
    toggleConfirmPassword.setAttribute('aria-label', 'Show password');
    const icon = toggleConfirmPassword.querySelector('.eye-icon');
    if(icon) icon.textContent = '👁️';
  }
  
  window.__secureFile = null;
}

function onFileChosen(file){
  const check = validateFile(file);
  if(!check.ok){ 
    setStatus(check.msg); 
    resetUI();
    return; 
  }
  
  window.__secureFile = file;
  
  const kFileName = $('#kFileName');
  const kFileSize = $('#kFileSize');
  const kEstPages = $('#kEstPages');
  const convertBtn = $('#convertBtn');
  
  if(kFileName) kFileName.textContent = file.name || '—';
  if(kFileSize) kFileSize.textContent = formatBytes(file.size||0);
  if(kEstPages) kEstPages.textContent = estimatePagesFromSize(file.size||0);
  
  setStatus('Ready to secure PDF. Enter a password.');
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

function bindPasswordToggles(){
  const togglePassword = $('#togglePassword');
  const toggleConfirmPassword = $('#toggleConfirmPassword');
  const passwordInput = $('#password');
  const confirmPasswordInput = $('#confirmPassword');
  
  if(togglePassword && passwordInput){
    togglePassword.addEventListener('click', ()=>{
      const type = passwordInput.getAttribute('type');
      const icon = togglePassword.querySelector('.eye-icon');
      
      if(type === 'password'){
        passwordInput.setAttribute('type', 'text');
        togglePassword.setAttribute('aria-label', 'Hide password');
        if(icon) icon.textContent = '🙈';
      } else {
        passwordInput.setAttribute('type', 'password');
        togglePassword.setAttribute('aria-label', 'Show password');
        if(icon) icon.textContent = '👁️';
      }
    });
  }
  
  if(toggleConfirmPassword && confirmPasswordInput){
    toggleConfirmPassword.addEventListener('click', ()=>{
      const type = confirmPasswordInput.getAttribute('type');
      const icon = toggleConfirmPassword.querySelector('.eye-icon');
      
      if(type === 'password'){
        confirmPasswordInput.setAttribute('type', 'text');
        toggleConfirmPassword.setAttribute('aria-label', 'Hide password');
        if(icon) icon.textContent = '🙈';
      } else {
        confirmPasswordInput.setAttribute('type', 'password');
        toggleConfirmPassword.setAttribute('aria-label', 'Show password');
        if(icon) icon.textContent = '👁️';
      }
    });
  }
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
      const file = window.__secureFile;
      const check = validateFile(file);
      if(!check.ok){ 
        setStatus(check.msg); 
        return; 
      }

      const password = $('#password')?.value?.trim();
      const confirmPassword = $('#confirmPassword')?.value?.trim();
      
      // Validate password
      if(!password){
        setStatus('❌ Please enter a password.');
        return;
      }
      
      if(password.length < 6){
        setStatus('❌ Password must be at least 6 characters.');
        return;
      }
      
      if(password !== confirmPassword){
        setStatus('❌ Passwords do not match.');
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
        formData.append('password', password);
        
        setStatus('☁️ Uploading to server...'); 
        setProgress(35);
        
        const response = await fetch('http://localhost:3000/api/secure-pdf', {
          method: 'POST',
          body: formData
        });
        
        setStatus('🔒 Encrypting PDF...'); 
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
        const filename = `${base}-secured.pdf`;
        
        setProgress(100);
        setStatus('✅ PDF secured successfully!');
        
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
        console.error('Secure failed:', err);
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
  bindPasswordToggles();
  bindActions();
  resetUI();
  highlightActive();
  document.documentElement.classList.add('route-ready');
});
