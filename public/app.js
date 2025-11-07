// State
let selectedFile = null;

// Elements
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const browseBtn = document.getElementById('browseBtn');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const clearBtn = document.getElementById('clearBtn');
const uploadBtn = document.getElementById('uploadBtn');
const progressSection = document.getElementById('progressSection');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const errorSection = document.getElementById('errorSection');
const errorMessage = document.getElementById('errorMessage');
const uploadSection = document.getElementById('uploadSection');
const successSection = document.getElementById('successSection');
const shareableLink = document.getElementById('shareableLink');
const copyBtn = document.getElementById('copyBtn');
const viewLink = document.getElementById('viewLink');
const uploadAnotherBtn = document.getElementById('uploadAnotherBtn');

// Format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Show file info
function showFileInfo(file) {
  selectedFile = file;
  fileName.textContent = file.name;
  fileSize.textContent = formatFileSize(file.size);
  fileInfo.classList.remove('hidden');
  uploadBtn.classList.remove('hidden');
  hideError();
}

// Clear file
function clearFile() {
  selectedFile = null;
  fileInput.value = '';
  fileInfo.classList.add('hidden');
  uploadBtn.classList.add('hidden');
  hideError();
}

// Show error
function showError(message) {
  errorMessage.textContent = message;
  errorSection.classList.remove('hidden');
}

// Hide error
function hideError() {
  errorSection.classList.add('hidden');
}

// Show progress
function showProgress(percent, text) {
  progressSection.classList.remove('hidden');
  progressBar.style.width = percent + '%';
  progressText.textContent = text;
}

// Hide progress
function hideProgress() {
  progressSection.classList.add('hidden');
  progressBar.style.width = '0%';
}

// Upload file
async function uploadFile() {
  if (!selectedFile) return;

  hideError();
  uploadBtn.disabled = true;
  showProgress(20, 'Uploading...');

  const formData = new FormData();
  formData.append('file', selectedFile);

  try {
    showProgress(40, 'Processing...');

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    showProgress(60, 'Generating HTML...');

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Upload failed');
    }

    showProgress(100, 'Complete!');

    // Show success section
    setTimeout(() => {
      hideProgress();
      uploadSection.classList.add('hidden');
      successSection.classList.remove('hidden');
      shareableLink.value = data.url;
      viewLink.href = data.url;
    }, 500);
  } catch (error) {
    hideProgress();
    uploadBtn.disabled = false;
    showError(error.message || 'Failed to upload file. Please try again.');
  }
}

// Copy link to clipboard
async function copyLink() {
  try {
    await navigator.clipboard.writeText(shareableLink.value);
    const originalText = copyBtn.innerHTML;
    copyBtn.innerHTML = `
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
      </svg>
      <span>Copied!</span>
    `;
    setTimeout(() => {
      copyBtn.innerHTML = originalText;
    }, 2000);
  } catch (error) {
    alert('Failed to copy link');
  }
}

// Reset to upload another
function uploadAnother() {
  successSection.classList.add('hidden');
  uploadSection.classList.remove('hidden');
  clearFile();
}

// Drag and drop handlers
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', (e) => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');

  const files = e.dataTransfer.files;
  if (files.length > 0) {
    const file = files[0];
    if (file.name.endsWith('.jsonl')) {
      showFileInfo(file);
    } else {
      showError('Please select a .jsonl file');
    }
  }
});

// Click to browse
dropZone.addEventListener('click', (e) => {
  if (e.target !== clearBtn && !e.target.closest('#clearBtn')) {
    fileInput.click();
  }
});

browseBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  fileInput.click();
});

// File input change
fileInput.addEventListener('change', (e) => {
  const files = e.target.files;
  if (files.length > 0) {
    const file = files[0];
    if (file.name.endsWith('.jsonl')) {
      showFileInfo(file);
    } else {
      showError('Please select a .jsonl file');
    }
  }
});

// Clear button
clearBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  clearFile();
});

// Upload button
uploadBtn.addEventListener('click', uploadFile);

// Copy button
copyBtn.addEventListener('click', copyLink);

// Upload another button
uploadAnotherBtn.addEventListener('click', uploadAnother);
