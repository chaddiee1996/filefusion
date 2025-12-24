// PDF to Word Functionality
let selectedFile = null;

// Get DOM elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
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
function handleFile(file) {
    selectedFile = file;
    displayFileInfo();
    convertBtn.disabled = false;
    hideStatus();
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

// Convert PDF to Word
convertBtn.addEventListener('click', async () => {
    if (!selectedFile) {
        showStatus('Please select a PDF file', 'error');
        return;
    }
    
    try {
        convertBtn.disabled = true;
        convertBtn.textContent = 'Converting...';
        showStatus('Extracting text from PDF...', 'success');
        
        // Read the PDF file
        const fileData = await selectedFile.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: fileData }).promise;
        
        let fullText = '';
        const totalPages = pdf.numPages;
        
        // Extract text from each page
        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
            showStatus(`Processing page ${pageNum} of ${totalPages}...`, 'success');
            
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + '\n\n';
        }
        
        showStatus('Creating Word document...', 'success');
        
        // Create Word document using docx library
        const doc = new docx.Document({
            sections: [{
                properties: {},
                children: [
                    new docx.Paragraph({
                        children: [
                            new docx.TextRun({
                                text: fullText,
                                size: 24, // 12pt font
                            }),
                        ],
                    }),
                ],
            }],
        });
        
        // Generate Word file
        const blob = await docx.Packer.toBlob(doc);
        
        // Download the file
        const fileName = selectedFile.name.replace('.pdf', '.docx');
        saveAs(blob, fileName);
        
        showStatus('✅ PDF converted to Word successfully! Download started.', 'success');
        convertBtn.textContent = 'Convert to Word';
        convertBtn.disabled = false;
        
        // Reset after 3 seconds
        setTimeout(() => {
            resetTool();
        }, 3000);
        
    } catch (error) {
        console.error('Error converting PDF to Word:', error);
        showStatus('❌ Error converting PDF. Please try again.', 'error');
        convertBtn.textContent = 'Convert to Word';
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
    fileInput.value = '';
    fileInfo.style.display = 'none';
    convertBtn.disabled = true;
    hideStatus();
}