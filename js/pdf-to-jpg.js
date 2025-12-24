// PDF to JPG Functionality
let selectedFile = null;
let totalPagesCount = 0;

// Get DOM elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
const conversionOptions = document.getElementById('conversionOptions');
const totalPages = document.getElementById('totalPages');
const convertBtn = document.getElementById('convertBtn');
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
        const pdf = await pdfjsLib.getDocument({ data: fileData }).promise;
        totalPagesCount = pdf.numPages;
        
        totalPages.textContent = totalPagesCount;
        displayFileInfo();
        conversionOptions.style.display = 'block';
        convertBtn.disabled = false;
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

// Convert PDF to JPG
convertBtn.addEventListener('click', async () => {
    if (!selectedFile) {
        showStatus('Please select a PDF file', 'error');
        return;
    }
    
    try {
        convertBtn.disabled = true;
        convertBtn.textContent = 'Converting...';
        showStatus('Loading PDF...', 'success');
        
        // Get options
        const quality = parseFloat(document.querySelector('input[name="quality"]:checked').value);
        const convertPages = document.querySelector('input[name="convertPages"]:checked').value;
        
        // Load PDF
        const fileData = await selectedFile.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: fileData }).promise;
        
        const pagesToConvert = convertPages === 'all' ? 
            Array.from({ length: pdf.numPages }, (_, i) => i + 1) : 
            [1];
        
        // Create ZIP file for multiple images
        const zip = new JSZip();
        
        // Convert each page
        for (let i = 0; i < pagesToConvert.length; i++) {
            const pageNum = pagesToConvert[i];
            showStatus(`Converting page ${i + 1} of ${pagesToConvert.length}...`, 'success');
            
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale: quality });
            
            // Create canvas
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            
            // Render PDF page to canvas
            await page.render({
                canvasContext: context,
                viewport: viewport
            }).promise;
            
            // Convert canvas to blob
            const blob = await new Promise(resolve => {
                canvas.toBlob(resolve, 'image/jpeg', 0.95);
            });
            
            // Add to ZIP
            const fileName = pagesToConvert.length === 1 ? 
                `${selectedFile.name.replace('.pdf', '')}.jpg` :
                `${selectedFile.name.replace('.pdf', '')}_page_${pageNum}.jpg`;
            
            zip.file(fileName, blob);
        }
        
        showStatus('Creating download file...', 'success');
        
        // Generate ZIP or single file
        if (pagesToConvert.length === 1) {
            // Download single image
            const blob = await zip.file(Object.keys(zip.files)[0]).async('blob');
            saveAs(blob, `${selectedFile.name.replace('.pdf', '')}.jpg`);
        } else {
            // Download ZIP of all images
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            saveAs(zipBlob, `${selectedFile.name.replace('.pdf', '')}_images.zip`);
        }
        
        showStatus(
            `✅ Successfully converted ${pagesToConvert.length} page(s) to JPG! Download started.`,
            'success'
        );
        
        convertBtn.textContent = 'Convert to JPG';
        convertBtn.disabled = false;
        
        // Reset after 3 seconds
        setTimeout(() => {
            resetTool();
        }, 3000);
        
    } catch (error) {
        console.error('Error converting PDF to JPG:', error);
        showStatus('❌ Error converting PDF. Please try again.', 'error');
        convertBtn.textContent = 'Convert to JPG';
        convertBtn.disabled = false;
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
    fileInfo.style.display = 'none';
    conversionOptions.style.display = 'none';
    convertBtn.disabled = true;
    hideStatus();
    
    // Reset radio buttons
    document.querySelector('input[name="quality"][value="1.5"]').checked = true;
    document.querySelector('input[name="convertPages"][value="all"]').checked = true;
}