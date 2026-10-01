import re

with open('/Users/danielnweke/.gemini/antigravity/scratch/layman-lens/app.js', 'r') as f:
    content = f.read()

# 1. Initialize Quill
content = content.replace(
    "const editor = document.getElementById('source-editor');",
    "const quill = new Quill('#source-editor', {\n        theme: 'snow',\n        placeholder: 'Paste your dense legal, academic, medical, financial, or any jargon-heavy document here... Then highlight a paragraph to see the magic.',\n        modules: { toolbar: false }\n    });"
)

# 2. editor.value = '' -> quill.setText('')
content = content.replace("editor.value = '';", "quill.setText('');")
content = content.replace("editor.value = PRESETS[presetType];", "quill.setText(PRESETS[presetType]);")

# 3. editor selection
content = content.replace("editor.focus();", "quill.focus();")
content = content.replace("editor.setSelectionRange(0, textToSelect.length);", "quill.setSelection(0, textToSelect.length);")

# 4. updateWordCount
content = content.replace("const text = editor.value.trim();", "const text = quill.getText().trim();")
content = content.replace("editor.addEventListener('input', updateWordCount);", "quill.on('text-change', updateWordCount);")

# 5. file upload
content = content.replace('editor.value = "Extracting text from document, please wait...";', 'quill.setText("Extracting text from document, please wait...");')
content = content.replace("editor.value = data.text;", "quill.setText(data.text);")
content = content.replace('editor.value = "Error extracting text from document.";', 'quill.setText("Error extracting text from document.");')

# 6. full_context payload
content = content.replace("full_context: editor.value,", "full_context: quill.getText(),")

# 7. handleSelection rewrite
handle_selection_old = """    // Handle floating button positioning
    let selectionTimeout;
    editor.addEventListener('mouseup', handleSelection);
    editor.addEventListener('keyup', handleSelection);

    function handleSelection(e) {
        const selectionStart = editor.selectionStart;
        const selectionEnd = editor.selectionEnd;
        
        if (selectionStart === selectionEnd) {
            floatingBtn.classList.add('hidden');
            return;
        }

        const selectedText = editor.value.substring(selectionStart, selectionEnd).trim();
        
        if (selectedText.length < 2) {
            floatingBtn.classList.add('hidden');
            return;
        }

        currentSelectedText = selectedText;
        currentSelectionStart = selectionStart;
        currentSelectionEnd = selectionEnd;

        // Position the floating button near the mouse if it's a mouse event
        if (e && (e.type === 'mouseup' || e.type === 'click')) {
            // Rough approximation for textarea cursor position
            floatingBtn.style.left = `${e.clientX}px`;
            floatingBtn.style.top = `${e.clientY - 15}px`;
        } else {
            // fallback for keyboard selection
            floatingBtn.style.left = `50%`;
            floatingBtn.style.top = `30%`;
        }

        floatingBtn.classList.remove('hidden');
    }"""

handle_selection_new = """    // Handle floating button positioning
    quill.on('selection-change', function(range) {
        if (!range || range.length === 0) {
            floatingBtn.classList.add('hidden');
            return;
        }

        const selectedText = quill.getText(range.index, range.length).trim();
        
        if (selectedText.length < 2) {
            floatingBtn.classList.add('hidden');
            return;
        }

        currentSelectedText = selectedText;
        currentSelectionStart = range.index;
        currentSelectionEnd = range.index + range.length;

        const bounds = quill.getBounds(range.index, range.length);
        
        // Convert bounds relative to quill container to viewport coordinates
        const quillContainer = document.querySelector('#source-editor').getBoundingClientRect();
        
        floatingBtn.style.left = `${quillContainer.left + bounds.left + bounds.width / 2}px`;
        floatingBtn.style.top = `${quillContainer.top + bounds.top - 20}px`;
        floatingBtn.style.transform = 'translate(-50%, -100%)';

        floatingBtn.classList.remove('hidden');
    });"""
content = content.replace(handle_selection_old, handle_selection_new)

# 8. replaceBtn onclick
replaceBtn_old = """            replaceBtn.onclick = () => {
                // Strip simple markdown (**, __, etc.) before inserting
                const cleanText = resultText.replace(/(\*\*|__|\*|_)/g, '').trim();
                editor.setRangeText(cleanText, currentSelectionStart, currentSelectionEnd, 'end');
                updateWordCount();
                closeSidebar();
                setLensState('empty');
            };"""
replaceBtn_new = """            replaceBtn.onclick = () => {
                const cleanText = resultText.replace(/(\*\*|__|\*|_)/g, '').trim();
                const length = currentSelectionEnd - currentSelectionStart;
                
                quill.deleteText(currentSelectionStart, length);
                quill.insertText(currentSelectionStart, cleanText, {
                    'background': 'rgba(16, 185, 129, 0.2)' // highlight green
                });
                
                updateWordCount();
                closeSidebar();
                setLensState('empty');
            };"""
content = content.replace(replaceBtn_old, replaceBtn_new)

# Fix simulate mouse event in preset click
preset_simulate_old = """            // Simulate a mouse event to trigger the floating button
            handleSelection({ type: 'mouseup', clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 });"""
preset_simulate_new = """            // Quill selection event handles it automatically"""
content = content.replace(preset_simulate_old, preset_simulate_new)

with open('/Users/danielnweke/.gemini/antigravity/scratch/layman-lens/app.js', 'w') as f:
    f.write(content)

print("done")
