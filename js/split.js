// Split PDF Functionality
const { PDFDocument } = PDFLib;

let selectedFile = null;
let totalPagesCount = 0;

// Get DOM elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
const pageSelection = document.getElementById('pageSelection');
const pageRange = document.getElementById('pageRange');
const totalPages = document.getElementById('totalPages');
const splitBtn = document.getElementById('splitBtn');
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
async function handleFile(file) {
    selectedFile = file;
    
    try {
        // Load PDF to get page count
        const fileData = await file.arrayBuffer();
        const pdf = await PDFDocument.load(fileData);
        totalPagesCount = pdf.getPageCount();
        
        totalPages.textContent = totalPagesCount;
        displayFileInfo();
        pageSelection.style.display = 'block';
        hideStatus();
        
    } catch (error) {
        console.error('Error loading PDF:', error);
        showStatus('Error loading PDF file', 'error');
    }
}

// Display file information
function displayFileInfo() {
    fileInfo.style.display = 'block';
    fileInfo.innerHTML = `
        <div class="file-item">
            <div class="file-name">${selectedFile.name}</div>
            <button class="remove-btn" onclick="resetTool()">Remove</button>
        </div>
    `;
}

// Enable split button when page range is entered
pageRange.addEventListener('input', () => {
    splitBtn.disabled = pageRange.value.trim() === '';
});

// Parse page range string
function parsePageRange(rangeString, maxPages) {
    const pages = new Set();
    const parts = rangeString.split(',');
    
    for (let part of parts) {
        part = part.trim();
        
        if (part.includes('-')) {
            // Range like "1-5"
            const [start, end] = part.split('-').map(n => parseInt(n.trim()));
            if (isNaN(start) || isNaN(end)) continue;
            
            for (let i = Math.max(1, start); i <= Math.min(maxPages, end); i++) {
                pages.add(i - 1); // Convert to 0-based index
            }
        } else {
            // Single page like "3"
            const pageNum = parseInt(part);
            if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= maxPages) {
                pages.add(pageNum - 1); // Convert to 0-based index
            }
        }
    }
    
    return Array.from(pages).sort((a, b) => a - b);
}

// Split PDF
splitBtn.addEventListener('click', async () => {
    if (!selectedFile) {
        showStatus('Please select a PDF file', 'error');
        return;
    }
    
    const rangeString = pageRange.value.trim();
    if (!rangeString) {
        showStatus('Please enter page numbers to extract', 'error');
        return;
    }
    
    try {
        splitBtn.disabled = true;
        splitBtn.textContent = 'Extracting Pages...';
        showStatus('Processing your PDF...', 'success');
        
        // Parse page range
        const pagesToExtract = parsePageRange(rangeString, totalPagesCount);
        
        if (pagesToExtract.length === 0) {
            showStatus('No valid pages specified. Please check your input.', 'error');
            splitBtn.textContent = 'Extract Pages';
            splitBtn.disabled = false;
            return;
        }
        
        // Load the PDF
        const fileData = await selectedFile.arrayBuffer();
        const pdfDoc = await PDFDocument.load(fileData);
        
        // Create new PDF with selected pages
        const newPdf = await PDFDocument.create();
        const copiedPages = await newPdf.copyPages(pdfDoc, pagesToExtract);
        copiedPages.forEach((page) => newPdf.addPage(page));
        
        // Save the new PDF
        const pdfBytes = await newPdf.save();
        
        // Create download link
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'extracted-pages-' + selectedFile.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showStatus(
            `✅ Successfully extracted ${pagesToExtract.length} page(s)! Download started.`,
            'success'
        );
        
        splitBtn.textContent = 'Extract Pages';
        splitBtn.disabled = false;
        
        // Reset after 3 seconds
        setTimeout(() => {
            resetTool();
        }, 3000);
        
    } catch (error) {
        console.error('Error splitting PDF:', error);
        showStatus('❌ Error splitting PDF. Please check your page numbers and try again.', 'error');
        splitBtn.textContent = 'Extract Pages';
        splitBtn.disabled = false;
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
    selectedFile = null;
    totalPagesCount = 0;
    fileInput.value = '';
    pageRange.value = '';
    fileInfo.style.display = 'none';
    pageSelection.style.display = 'none';
    splitBtn.disabled = true;
    hideStatus();
}