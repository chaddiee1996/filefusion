// Merge PDF Functionality
const { PDFDocument } = PDFLib;

let selectedFiles = [];

// Get DOM elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('fileList');
const mergeBtn = document.getElementById('mergeBtn');
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
    
    const files = Array.from(e.dataTransfer.files).filter(file => file.type === 'application/pdf');
    if (files.length > 0) {
        addFiles(files);
    } else {
        showStatus('Please drop only PDF files', 'error');
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
    const files = Array.from(e.target.files);
    addFiles(files);
}

// Add files to the list
function addFiles(files) {
    files.forEach(file => {
        if (file.type === 'application/pdf') {
            selectedFiles.push(file);
        }
    });
    
    updateFileList();
    updateMergeButton();
}

// Update file list display
function updateFileList() {
    if (selectedFiles.length === 0) {
        fileList.style.display = 'none';
        return;
    }
    
    fileList.style.display = 'block';
    fileList.innerHTML = '';
    
    selectedFiles.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <span class="file-name">${index + 1}. ${file.name}</span>
            <button class="remove-btn" onclick="removeFile(${index})">Remove</button>
        `;
        fileList.appendChild(fileItem);
    });
}

// Remove file from list
function removeFile(index) {
    selectedFiles.splice(index, 1);
    updateFileList();
    updateMergeButton();
    hideStatus();
}

// Update merge button state
function updateMergeButton() {
    mergeBtn.disabled = selectedFiles.length < 2;
}

// Merge PDFs
mergeBtn.addEventListener('click', async () => {
    if (selectedFiles.length < 2) {
        showStatus('Please select at least 2 PDF files to merge', 'error');
        return;
    }
    
    try {
        mergeBtn.disabled = true;
        mergeBtn.textContent = 'Merging PDFs...';
        showStatus('Processing your files...', 'success');
        
        // Create a new PDF document
        const mergedPdf = await PDFDocument.create();
        
        // Process each file
        for (let i = 0; i < selectedFiles.length; i++) {
            showStatus(`Processing file ${i + 1} of ${selectedFiles.length}...`, 'success');
            
            const fileData = await selectedFiles[i].arrayBuffer();
            const pdf = await PDFDocument.load(fileData);
            const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            copiedPages.forEach((page) => mergedPdf.addPage(page));
        }
        
        // Save the merged PDF
        const mergedPdfBytes = await mergedPdf.save();
        
        // Create download link
        const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'merged-document.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showStatus('✅ PDF files merged successfully! Download started.', 'success');
        mergeBtn.textContent = 'Merge PDFs';
        mergeBtn.disabled = false;
        
        // Reset after 3 seconds
        setTimeout(() => {
            resetTool();
        }, 3000);
        
    } catch (error) {
        console.error('Error merging PDFs:', error);
        showStatus('❌ Error merging PDFs. Please try again.', 'error');
        mergeBtn.textContent = 'Merge PDFs';
        mergeBtn.disabled = false;
    }
});

// Show status message
function showStatus(message, type) {
    status.style.display = 'block';
    status.textContent = message;
    status.className = type;
}

// Hide status message
function hideStatus() {
    status.style.display = 'none';
}

// Reset tool
function resetTool() {
    selectedFiles = [];
    fileInput.value = '';
    updateFileList();
    updateMergeButton();
    hideStatus();
}