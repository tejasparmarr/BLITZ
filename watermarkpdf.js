const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

function formatBytes(bytes) {
  if (bytes == null || isNaN(bytes)) return '—';
  const u = ['B', 'KB', 'MB', 'GB'];
  let i = 0, v = bytes;
  while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${u[i]}`;
}

function estimatePagesFromSize(bytes) {
  if (!bytes) return '—';
  const avg = 120 * 1024;
  return Math.max(1, Math.round(bytes / avg));
}

window.__watermarkFile = null;
window.__watermarkImageFile = null;

function validateFile(file) {
  const MAX = 20 * 1024 * 1024;
  if (!file) return { ok: false, msg: 'No PDF selected.' };
  const isPdf = (file.name || '').toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';
  if (!isPdf) return { ok: false, msg: 'Only PDF files are accepted.' };
  if ((file.size || 0) > MAX) return { ok: false, msg: 'File exceeds 20 MB.' };
  return { ok: true, size: file.size || 0 };
}

function setStatus(t) {
  const el = $('#statusLine');
  if (el) el.textContent = t;
}

function setProgress(p) {
  const el = $('#progressBar');
  if (el) el.style.width = `${Math.max(0, Math.min(100, p))}%`;
}

function resetUI() {
  setStatus('Add a PDF to begin.');
  setProgress(0);

  const kFileName = $('#kFileName');
  const kFileSize = $('#kFileSize');
  const kEstPages = $('#kEstPages');
  const downloadBloc = $('#downloadBloc');
  const convertBtn = $('#convertBtn');

  if (kFileName) kFileName.textContent = '—';
  if (kFileSize) kFileSize.textContent = '—';
  if (kEstPages) kEstPages.textContent = '—';
  if (downloadBloc) downloadBloc.classList.add('hidden');
  if (convertBtn) convertBtn.disabled = true;

  window.__watermarkFile = null;
  window.__watermarkImageFile = null;
}

function onFileChosen(file) {
  const check = validateFile(file);
  if (!check.ok) {
    setStatus(check.msg);
    resetUI();
    return;
  }

  window.__watermarkFile = file;

  const kFileName = $('#kFileName');
  const kFileSize = $('#kFileSize');
  const kEstPages = $('#kEstPages');
  const convertBtn = $('#convertBtn');

  if (kFileName) kFileName.textContent = file.name || '—';
  if (kFileSize) kFileSize.textContent = formatBytes(file.size || 0);
  if (kEstPages) kEstPages.textContent = estimatePagesFromSize(file.size || 0);

  setStatus('Ready to apply watermark.');
  setProgress(12);

  if (convertBtn) convertBtn.disabled = false;
}

function bindDropzone() {
  const dz = $('#dropzone'), input = $('#fileInput'), browseBtn = $('#browseBtn');
  if (!dz || !input || !browseBtn) return;

  browseBtn.addEventListener('click', () => input.click());
  input.addEventListener('change', e => {
    const f = e.target.files?.[0];
    if (f) onFileChosen(f);
  });

  dz.addEventListener('dragenter', e => { e.preventDefault(); dz.classList.add('drag'); });
  dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('drag'); });
  dz.addEventListener('dragleave', e => { e.preventDefault(); dz.classList.remove('drag'); });
  dz.addEventListener('drop', e => {
    e.preventDefault();
    e.stopPropagation();
    dz.classList.remove('drag');
    const f = e.dataTransfer?.files?.[0];
    if (f) onFileChosen(f);
  });

  dz.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      input.click();
    }
  });
}

function bindGlobalDrop() {
  const overlay = $('#globalDrop');
  if (!overlay) return;

  let dragDepth = 0;
  const show = () => overlay.classList.add('show');
  const hide = () => overlay.classList.remove('show');

  document.addEventListener('dragenter', e => {
    if (e.dataTransfer && e.dataTransfer.types && e.dataTransfer.types.indexOf('Files') !== -1) {
      dragDepth++;
      show();
    }
  });

  document.addEventListener('dragover', e => {
    if (overlay.classList.contains('show')) e.preventDefault();
  });

  document.addEventListener('dragleave', () => {
    dragDepth = Math.max(0, dragDepth - 1);
    if (dragDepth === 0) hide();
  });

  document.addEventListener('drop', e => {
    if (overlay.classList.contains('show')) {
      e.preventDefault();
      e.stopPropagation();
    }
    hide();
    dragDepth = 0;
    const files = e.dataTransfer?.files;
    if (files && files.length) { onFileChosen(files[0]); }
  });
}

function bindWatermarkTypeSwitch() {
  const typeSelect = $('#watermarkType');
  const textOptions = $('#textWatermarkOptions');
  const imageOptions = $('#imageWatermarkOptions');

  if (!typeSelect || !textOptions || !imageOptions) return;

  typeSelect.addEventListener('change', () => {
    if (typeSelect.value === 'text') {
      textOptions.classList.remove('hidden');
      imageOptions.classList.add('hidden');
    } else {
      textOptions.classList.add('hidden');
      imageOptions.classList.remove('hidden');
    }
  });
}

function bindOpacitySlider() {
  const slider = $('#opacity');
  const display = $('#opacityValue');
  if (!slider || !display) return;

  slider.addEventListener('input', () => {
    display.textContent = `${slider.value}%`;
  });
}

function bindWatermarkImageInput() {
  const input = $('#watermarkImageInput');
  if (!input) return;

  input.addEventListener('change', e => {
    const f = e.target.files?.[0];
    if (f) {
      window.__watermarkImageFile = f;
      setStatus('Watermark image selected.');
    }
  });
}

function bindActions() {
  const resetBtn = $('#resetBtn');
  const convertBtn = $('#convertBtn');

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      const input = $('#fileInput');
      const imageInput = $('#watermarkImageInput');
      if (input) input.value = '';
      if (imageInput) imageInput.value = '';
      resetUI();
    });
  }

  if (convertBtn) {
    convertBtn.addEventListener('click', async () => {
      const file = window.__watermarkFile;
      const check = validateFile(file);
      if (!check.ok) {
        setStatus(check.msg);
        return;
      }

      const watermarkType = $('#watermarkType')?.value || 'text';
      const watermarkText = $('#watermarkText')?.value || 'CONFIDENTIAL';
      const fontSize = $('#fontSize')?.value || '40';
      const textColor = $('#textColor')?.value || '#000000';
      const position = $('#position')?.value || 'center';
      const opacity = $('#opacity')?.value || '30';
      const rotation = $('#rotation')?.value || '45';

      try {
        convertBtn.disabled = true;
        const downloadBloc = $('#downloadBloc');
        if (downloadBloc) downloadBloc.classList.add('hidden');

        setStatus('📦 Preparing PDF...');
        setProgress(15);

        const formData = new FormData();
        formData.append('pdf', file);
        formData.append('watermarkType', watermarkType);
        formData.append('watermarkText', watermarkText);
        formData.append('fontSize', fontSize);
        formData.append('textColor', textColor);
        formData.append('position', position);
        formData.append('opacity', opacity);
        formData.append('rotation', rotation);

        if (watermarkType === 'image' && window.__watermarkImageFile) {
          formData.append('watermarkImage', window.__watermarkImageFile);
        }

        setStatus('☁️ Uploading to server...');
        setProgress(35);

        const response = await fetch('http://localhost:3000/api/watermark-pdf', {
          method: 'POST',
          body: formData
        });

        setStatus('🖍️ Applying watermark...');
        setProgress(65);

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `Server error: ${response.status}`);
        }

        setStatus('📥 Preparing download...');
        setProgress(85);

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const base = (file.name.replace(/\.pdf$/i, '') || 'document');
        const filename = `${base}-watermarked.pdf`;

        setProgress(100);
        setStatus('✅ Watermark applied!');

        const downloadLink = $('#downloadLink');
        if (downloadLink) {
          downloadLink.setAttribute('href', url);
          downloadLink.setAttribute('download', filename);
        }
        if (downloadBloc) downloadBloc.classList.remove('hidden');

        const tempLink = document.createElement('a');
        tempLink.href = url;
        tempLink.download = filename;
        tempLink.click();

        convertBtn.disabled = false;

      } catch (err) {
        console.error('Watermark failed:', err);
        setStatus(`❌ Error: ${err.message}`);
        setProgress(0);
        convertBtn.disabled = false;
      }
    });
  }
}

function highlightActive() {
  const fileNav = document.getElementById('navFilePdf');
  const fileDrawerNav = document.getElementById('drawerFilePdf');
  if (fileNav) fileNav.classList.add('active');
  if (fileDrawerNav) fileDrawerNav.classList.add('active');
}

document.addEventListener('DOMContentLoaded', () => {
  bindDropzone();
  bindGlobalDrop();
  bindWatermarkTypeSwitch();
  bindOpacitySlider();
  bindWatermarkImageInput();
  bindActions();
  resetUI();
  highlightActive();
  document.documentElement.classList.add('route-ready');
});
