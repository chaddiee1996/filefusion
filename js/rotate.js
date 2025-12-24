// Rotate PDF Functionality
const { PDFDocument, degrees } = PDFLib;

let selectedFile = null;
let totalPagesCount = 0;

// Get DOM elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
const rotationOptions = document.getElementById('rotationOptions');
const totalPages = document.getElementById('totalPages');
const specificPages = document.getElementById('specificPages');
const rotateBtn = document.getElementById('rotateBtn');
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
        rotationOptions.style.display = 'block';
        rotateBtn.disabled = false;
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

// Handle "Apply to" radio button change
document.querySelectorAll('input[name="applyTo"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        specificPages.disabled = e.target.value === 'all';
        if (e.target.value === 'all') {
            specificPages.value = '';
        }
    });
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

// Rotate PDF
rotateBtn.addEventListener('click', async () => {
    if (!selectedFile) {
        showStatus('Please select a PDF file', 'error');
        return;
    }
    
    try {
        rotateBtn.disabled = true;
        rotateBtn.textContent = 'Rotating...';
        showStatus('Rotating your PDF...', 'success');
        
        // Get rotation angle
        const rotationAngle = parseInt(document.querySelector('input[name="rotation"]:checked').value);
        
        // Get pages to rotate
        const applyTo = document.querySelector('input[name="applyTo"]:checked').value;
        let pagesToRotate;
        
        if (applyTo === 'all') {
            pagesToRotate = Array.from({ length: totalPagesCount }, (_, i) => i);
        } else {
            const rangeString = specificPages.value.trim();
            if (!rangeString) {
                showStatus('Please enter page numbers to rotate', 'error');
                rotateBtn.textContent = 'Rotate PDF';
                rotateBtn.disabled = false;
                return;
            }
            pagesToRotate = parsePageRange(rangeString, totalPagesCount);
            
            if (pagesToRotate.length === 0) {
                showStatus('No valid pages specified. Please check your input.', 'error');
                rotateBtn.textContent = 'Rotate PDF';
                rotateBtn.disabled = false;
                return;
            }
        }
        
        // Load the PDF
        const fileData = await selectedFile.arrayBuffer();
        const pdfDoc = await PDFDocument.load(fileData);
        const pages = pdfDoc.getPages();
        
        // Rotate specified pages
        pagesToRotate.forEach(pageIndex => {
            const page = pages[pageIndex];
            page.setRotation(degrees(rotationAngle));
        });
        
        // Save the rotated PDF
        const pdfBytes = await pdfDoc.save();
        
        // Create download link
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'rotated-' + selectedFile.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showStatus(
            `✅ Successfully rotated ${pagesToRotate.length} page(s) by ${rotationAngle}°! Download started.`,
            'success'
        );
        
        rotateBtn.textContent = 'Rotate PDF';
        rotateBtn.disabled = false;
        
        // Reset after 3 seconds
        setTimeout(() => {
            resetTool();
        }, 3000);
        
    } catch (error) {
        console.error('Error rotating PDF:', error);
        showStatus('❌ Error rotating PDF. Please try again.', 'error');
        rotateBtn.textContent = 'Rotate PDF';
        rotateBtn.disabled = false;
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
    specificPages.value = '';
    specificPages.disabled = true;
    fileInfo.style.display = 'none';
    rotationOptions.style.display = 'none';
    rotateBtn.disabled = true;
    hideStatus();
    
    // Reset radio buttons
    document.querySelector('input[name="rotation"][value="90"]').checked = true;
    document.querySelector('input[name="applyTo"][value="all"]').checked = true;
}