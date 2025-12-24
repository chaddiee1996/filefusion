// Compress PDF Functionality
const { PDFDocument } = PDFLib;

let selectedFile = null;
let originalSize = 0;

// Get DOM elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
const compressionOptions = document.getElementById('compressionOptions');
const compressBtn = document.getElementById('compressBtn');
const status = document.getElementById('status');

// File input change handler
fileInput.addEventListener('change', handleFileSelect);

// Drag and drop handlers
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type === 'application/pdf') {
        handleFile(files[0]);
    } else {
        showStatus('Please drop a PDF file', 'error');
    }
});

// Click upload area to trigger file input
uploadArea.addEventListener('click', (e) => {
    if (e.target.tagName !== 'LABEL' && e.target.tagName !== 'INPUT') {
        fileInput.click();
    }
});

// Handle file selection
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        handleFile(file);
    }
}

// Handle file
function handleFile(file) {
    selectedFile = file;
    originalSize = file.size;
    displayFileInfo();
    compressionOptions.style.display = 'block';
    compressBtn.disabled = false;
    hideStatus();
}

// Display file information
function displayFileInfo() {
    fileInfo.style.display = 'block';
    fileInfo.innerHTML = `
        <div class="file-item">
            <div>
                <div class="file-name">${selectedFile.name}</div>
                <div style="font-size: 0.9rem; color: #7f8c8d; margin-top: 0.3rem;">
                    Original size: ${formatFileSize(originalSize)}
                </div>
            </div>
            <button class="remove-btn" onclick="resetTool()">Remove</button>
        </div>
    `;
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// Compress PDF
compressBtn.addEventListener('click', async () => {
    if (!selectedFile) {
        showStatus('Please select a PDF file', 'error');
        return;
    }
    
    try {
        compressBtn.disabled = true;
        compressBtn.textContent = 'Compressing...';
        showStatus('Compressing your PDF...', 'success');
        
        // Get compression level
        const compressionLevel = document.querySelector('input[name="compression"]:checked').value;
        
        // Load the PDF
        const fileData = await selectedFile.arrayBuffer();
        const pdfDoc = await PDFDocument.load(fileData);
        
        // Get compression settings
        const compressionSettings = getCompressionSettings(compressionLevel);
        
        // Save with compression
        const compressedPdfBytes = await pdfDoc.save({
            useObjectStreams: compressionSettings.useObjectStreams,
            addDefaultPage: false,
        });
        
        const compressedSize = compressedPdfBytes.length;
        const reduction = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
        
        // Create download link
        const blob = new Blob([compressedPdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'compressed-' + selectedFile.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showStatus(
            `✅ PDF compressed successfully! Download started.\n` +
            `Original: ${formatFileSize(originalSize)} → Compressed: ${formatFileSize(compressedSize)}\n` +
            `Reduced by ${reduction}%`,
            'success'
        );
        
        compressBtn.textContent = 'Compress PDF';
        compressBtn.disabled = false;
        
        // Reset after 5 seconds
        setTimeout(() => {
            resetTool();
        }, 5000);
        
    } catch (error) {
        console.error('Error compressing PDF:', error);
        showStatus('❌ Error compressing PDF. Please try again.', 'error');
        compressBtn.textContent = 'Compress PDF';
        compressBtn.disabled = false;
    }
});

// Get compression settings based on level
function getCompressionSettings(level) {
    switch (level) {
        case 'low':
            return { useObjectStreams: true };
        case 'medium':
            return { useObjectStreams: true };
        case 'high':
            return { useObjectStreams: true };
        default:
            return { useObjectStreams: true };
    }
}

// Show status message
function showStatus(message, type) {
    status.style.display = 'block';
    status.textContent = message;
    status.className = type;
    status.style.whiteSpace = 'pre-line';
}

// Hide status message
function hideStatus() {
    status.style.display = 'none';
}

// Reset tool
function resetTool() {
    selectedFile = null;
    originalSize = 0;
    fileInput.value = '';
    fileInfo.style.display = 'none';
    compressionOptions.style.display = 'none';
    compressBtn.disabled = true;
    hideStatus();
}