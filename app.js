document.addEventListener('DOMContentLoaded', () => {
    // Landing Page Logic
    const landingPage = document.getElementById('landing-page');
    const launchBtn = document.getElementById('launch-btn');
    if (launchBtn && landingPage) {
        launchBtn.addEventListener('click', () => {
            landingPage.classList.add('fade-out');
            setTimeout(() => {
                landingPage.remove();
            }, 600); // Matches CSS transition duration
        });
    }

    // Tab Navigation Logic
    const tabWorkspace = document.getElementById('tab-workspace');
    const tabHowitworks = document.getElementById('tab-howitworks');
    const tabSettings = document.getElementById('tab-settings');
    const viewWorkspace = document.getElementById('view-workspace');
    const viewHowitworks = document.getElementById('view-howitworks');
    const viewSettings = document.getElementById('view-settings');

    // --- Usage Tracker ---
    let currentUsage = parseInt(localStorage.getItem('apiUsageCount') || '0', 10);
    
    function updateUsageTracker() {
        const usageLabel = document.getElementById('statusbar-usage');
        const settingsCount = document.getElementById('settings-usage-count');
        const settingsBar = document.getElementById('settings-usage-bar');
        
        if (usageLabel) usageLabel.textContent = `${currentUsage}/20 Requests`;
        if (settingsCount) settingsCount.textContent = currentUsage;
        if (settingsBar) settingsBar.style.width = `${Math.min((currentUsage / 20) * 100, 100)}%`;
    }
    updateUsageTracker();

    function incrementUsage() {
        currentUsage += 1;
        localStorage.setItem('apiUsageCount', currentUsage.toString());
        updateUsageTracker();
    }
    
    // Real-time sync across multiple tabs
    window.addEventListener('storage', (e) => {
        if (e.key === 'apiUsageCount') {
            currentUsage = parseInt(e.newValue || '0', 10);
            updateUsageTracker();
        }
    });
    // ----------------------

    function resetTabs() {
        [tabWorkspace, tabHowitworks, tabSettings].forEach(t => t?.classList.remove('active'));
        [viewWorkspace, viewHowitworks, viewSettings].forEach(v => v?.classList.remove('active'));
    }

    if (tabWorkspace && tabHowitworks && tabSettings) {
        tabWorkspace.addEventListener('click', () => {
            resetTabs();
            tabWorkspace.classList.add('active');
            viewWorkspace.classList.add('active');
        });

        tabHowitworks.addEventListener('click', () => {
            resetTabs();
            tabHowitworks.classList.add('active');
            viewHowitworks.classList.add('active');
        });

        tabSettings.addEventListener('click', () => {
            resetTabs();
            tabSettings.classList.add('active');
            viewSettings.classList.add('active');
        });
    }

    const quill = new Quill('#source-editor', {
        theme: 'snow',
        placeholder: 'Paste your dense legal, academic, medical, financial, or any jargon-heavy document here... Then highlight a paragraph to see the magic.',
        modules: { toolbar: false }
    });
    const clearBtn = document.getElementById('clear-btn');
    const floatingBtn = document.getElementById('floating-action-btn');
    const explainBtn = document.getElementById('explain-btn');
    const sidebar = document.getElementById('sidebar-pane');
    const closeSidebarBtn = document.getElementById('close-sidebar-btn');
    
    // Lens States
    const stateEmpty = document.getElementById('lens-empty');
    const stateLoading = document.getElementById('lens-loading');
    const stateResult = document.getElementById('lens-result');
    const statusIndicator = document.querySelector('.status-indicator');
    
    // Result Elements
    const snippetText = document.getElementById('snippet-text');
    const explanationText = document.getElementById('explanation-text');
    const chatHistoryContainer = document.getElementById('chat-history');
    const followupInput = document.getElementById('followup-input');
    const presetBtns = document.querySelectorAll('.preset-btn');
    const complexitySlider = document.getElementById('complexity-slider');
    const complexityLabel = document.getElementById('complexity-label');
    const dynamicExplanationLabel = document.getElementById('dynamic-explanation-label');
    const uploadPdfBtn = document.getElementById('upload-pdf-btn');
    const pdfUpload = document.getElementById('pdf-upload');
    const wordCountDisplay = document.getElementById('word-count');
    const aiStatusDisplay = document.getElementById('ai-status');

    let currentSelectedText = "";
    let currentSelectionStart = 0;
    let currentSelectionEnd = 0;
    let chatHistory = []; // {role: 'user'|'model', content: ''}
    
    const COMPLEXITY_LEVELS = {
        "1": "5-year-old",
        "2": "High Schooler",
        "3": "College Grad"
    };
    let currentComplexity = "5-year-old";

    if(complexitySlider) {
        complexitySlider.addEventListener('input', (e) => {
            currentComplexity = COMPLEXITY_LEVELS[e.target.value];
            complexityLabel.textContent = currentComplexity;
        });
        
        // Trigger re-explanation when they finish dragging
        complexitySlider.addEventListener('change', () => {
            if (currentSelectedText && !sidebar.classList.contains('hidden')) {
                triggerExplanation();
            }
        });
    }

    const PRESETS = {
        medical: `CLINICAL SUMMARY:
The patient, a 54-year-old male, presented to the emergency department with acute onset of retrosternal diaphoresis and radiating angina pectoris. An initial electrocardiogram revealed ST-segment elevation in leads V2-V4, consistent with an anterior wall myocardial infarction. 

Echocardiography demonstrated severe hypokinesis of the anteroseptal myocardium with a left ventricular ejection fraction estimated at 35%. The patient was immediately started on dual antiplatelet therapy and transferred for percutaneous coronary intervention (PCI). 

During the procedure, angiography revealed a 95% occlusion of the proximal left anterior descending (LAD) artery, which was successfully treated with the deployment of a drug-eluting stent. Post-procedure, the patient was hemodynamically stable. We will monitor closely for arrhythmias or signs of cardiogenic shock.`,
        
        legal: `MUTUAL NON-DISCLOSURE AND CONFIDENTIALITY AGREEMENT:
1. Definition of Confidential Information. "Confidential Information" shall mean any proprietary data, trade secrets, or business methodologies disclosed by the Disclosing Party to the Receiving Party, whether in tangible or intangible form. 

2. Injunctive Relief. In the event of a material breach of this Agreement by the Receiving Party, the Disclosing Party shall be entitled to seek specific performance and injunctive or other equitable relief as a remedy for any such breach, without the necessity of proving actual damages. 

3. Severability. If any provision of this Agreement is held to be unenforceable or invalid by a court of competent jurisdiction, such provision shall be severed from the Agreement, and the remaining provisions shall remain in full force and effect. The Receiving Party further agrees to waive any requirement for the securing or posting of any bond in connection with equitable remedies.`,
        
        tech: `SYSTEM ARCHITECTURE AND DEPLOYMENT PROPOSAL:
The proposed microservices architecture aims to decouple the monolithic backend into independently scalable bounded contexts. By adopting an event-driven paradigm utilizing an asynchronous message broker (e.g., Apache Kafka), we can achieve high eventual consistency across distributed nodes.

However, developers must be extremely careful to implement idempotent consumers. If a consumer fails to acknowledge a message due to a transient network partition, the broker's at-least-once delivery guarantee may result in processing the same payload multiple times. 

Furthermore, to mitigate the risk of race conditions in our stateful persistence layer, we will implement optimistic concurrency control using entity versioning. This ensures that concurrent mutations to the same database record will trigger a rollback rather than silently overwriting state.`,

        finance: `QUARTERLY MARKET ANALYSIS & PROJECTIONS:
The central bank's recent shift toward quantitative tightening has significantly impacted the yield curve, leading to a prolonged inversion where short-term Treasury bills offer higher yields than long-term bonds. This macroeconomic environment places heavy downward pressure on high-growth equities.

To hedge against this systemic risk, our portfolio strategy involves increasing exposure to collateralized debt obligations (CDOs) and entering into interest rate swap agreements. By leveraging these derivative instruments, we can mitigate our duration risk while maintaining a delta-neutral position in the broader market.

Retail investors should be warned against panic selling, as the current market volatility is largely driven by algorithmic high-frequency trading (HFT) capitalizing on transient arbitrage opportunities rather than fundamental macroeconomic deterioration.`,

        science: `RESEARCH PAPER: QUANTUM DECOHERENCE:
In the standard interpretation of quantum mechanics, a system exists in a superposition of multiple eigenstates until an observation forces a wave function collapse. However, interacting with the macroscopic environment introduces quantum decoherence, where the system's phase information leaks into the surrounding thermal bath.

This environmental entanglement effectively destroys the quantum interference patterns, causing the system to transition from a probabilistic quantum state into a classical statistical mixture. This is why Schrödinger's cat paradox is never observed in reality; the macroscopic nature of the cat ensures instantaneous decoherence.

To preserve these fragile quantum states for computation, physicists employ superconducting qubits cooled to near absolute zero in dilution refrigerators, drastically reducing phonon interactions that would otherwise trigger premature decoherence.`,

        philosophy: `ESSAY ON EXISTENTIAL PHENOMENOLOGY:
According to Heidegger's seminal work, the concept of "Dasein" (being-there) fundamentally challenges the Cartesian dualism of mind and body. Rather than existing as an isolated, rational subject observing an objective world, Dasein is inherently "thrown" into a pre-existing world of meaning and relationality.

This ontological framework suggests that our most authentic state of being is realized when we confront our own "being-toward-death." By accepting our finitude, we are freed from the homogenized, conformist pressures of "the They" (das Man).

Consequently, existential anxiety (Angst) is not viewed as a psychological pathology to be cured, but rather as a profound ontological awakening that reveals the inherent groundlessness of our existence and forces us to take absolute responsibility for our radical freedom.`
    };

    function setLensState(state) {
        stateEmpty.classList.remove('active');
        stateLoading.classList.remove('active');
        stateResult.classList.remove('active');
        
        if (state === 'empty') stateEmpty.classList.add('active');
        if (state === 'loading') stateLoading.classList.add('active');
        if (state === 'result') stateResult.classList.add('active');

        if (state === 'result') {
            statusIndicator.classList.add('active');
        } else {
            statusIndicator.classList.remove('active');
        }
    }

    function openSidebar() {
        sidebar.classList.remove('hidden');
    }

    function closeSidebar() {
        sidebar.classList.add('hidden');
    }

    closeSidebarBtn.addEventListener('click', closeSidebar);

    clearBtn.addEventListener('click', () => {
        quill.setText('');
        closeSidebar();
        setLensState('empty');
        floatingBtn.classList.add('hidden');
    });

    presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const presetType = btn.getAttribute('data-preset');
            quill.setText(PRESETS[presetType]);
            
            // Auto select a portion of the text to trigger the magic immediately
            const textToSelect = PRESETS[presetType].substring(0, Math.min(PRESETS[presetType].length, 150));
            quill.focus();
            quill.setSelection(0, textToSelect.length);
            // Quill selection event handles it automatically
        });
    });

    uploadPdfBtn.addEventListener('click', () => {
        pdfUpload.click();
    });

    function updateWordCount() {
        const text = quill.getText().trim();
        const words = text ? text.split(/\s+/).length : 0;
        wordCountDisplay.textContent = `${words} words`;
    }
    quill.on('text-change', updateWordCount);

    pdfUpload.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        quill.setText("Extracting text from document, please wait...");
        uploadPdfBtn.textContent = "⏳ Uploading...";
        uploadPdfBtn.disabled = true;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/upload-document', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error('Failed to parse document');
            const data = await response.json();
            quill.setText(data.text);
            updateWordCount();
        } catch (error) {
            console.error(error);
            quill.setText("Error extracting text from document.");
        } finally {
            uploadPdfBtn.textContent = "📁 Upload Doc/PDF";
            uploadPdfBtn.disabled = false;
            pdfUpload.value = ''; // Reset input
        }
    });

    // Handle floating button positioning
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
    });

    function triggerExplanation() {
        chatHistory = []; // Reset history on new explanation
        
        // Reset chat UI
        const messages = chatHistoryContainer.querySelectorAll('.user-message, .ai-message:not(:first-child)');
        messages.forEach(m => m.remove());
        const existingReplaceBtn = document.querySelector('.replace-btn');
        if (existingReplaceBtn) existingReplaceBtn.remove();
        
        // Update the label to match the chosen complexity
        if (dynamicExplanationLabel) {
            dynamicExplanationLabel.textContent = `Explained for a ${currentComplexity}:`;
        }
        
        processExplanation(currentSelectedText);
    }

    explainBtn.addEventListener('click', () => {
        floatingBtn.classList.add('hidden');
        openSidebar();
        triggerExplanation();
    });

    async function processExplanation(text) {
        setLensState('loading');
        aiStatusDisplay.textContent = "⚙️ AI Generating...";
        aiStatusDisplay.style.color = "var(--accent-color)";
        snippetText.textContent = text.length > 150 ? text.substring(0, 150) + '...' : text;
        explanationText.innerHTML = ''; 

        try {
            incrementUsage(); // Record the request

            const response = await fetch('/simplify-stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    full_context: quill.getText(),
                    highlighted_text: text,
                    chat_history: [],
                    new_question: null,
                    complexity: currentComplexity
                })
            });

            if (!response.ok) throw new Error('API Request Failed');

            setLensState('result');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let resultText = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                resultText += decoder.decode(value, { stream: true });
                explanationText.innerHTML = marked.parse(resultText);
                chatHistoryContainer.scrollTop = chatHistoryContainer.scrollHeight;
            }
            
            // Save to history
            chatHistory.push({role: 'model', content: resultText});
            
            // Remove any existing buttons to prevent duplicates from rapid slider drags
            const existingBtns = explanationText.parentElement.querySelectorAll('.replace-btn');
            existingBtns.forEach(btn => btn.remove());

            // Add "Replace in Document" Button
            const replaceBtn = document.createElement('button');
            replaceBtn.className = 'replace-btn';
            replaceBtn.innerHTML = '🪄 Replace in Document';
            replaceBtn.onclick = () => {
                const cleanText = resultText.replace(/(\*\*|__|\*|_)/g, '').trim();
                const length = currentSelectionEnd - currentSelectionStart;
                
                quill.deleteText(currentSelectionStart, length);
                quill.insertText(currentSelectionStart, cleanText, {
                    'background': 'rgba(16, 185, 129, 0.2)' // highlight green
                });
                
                updateWordCount();
                closeSidebar();
                setLensState('empty');
            };
            explanationText.parentElement.appendChild(replaceBtn);
            
        } catch (error) {
            console.error('Error fetching simplification:', error);
            explanationText.innerHTML = '<p style="color: #ef4444;">Sorry, something went wrong. Make sure the backend server is running!</p>';
            setLensState('result');
        } finally {
            aiStatusDisplay.textContent = "AI Idle";
            aiStatusDisplay.style.color = "var(--text-muted)";
        }
    }

    // Follow-up chat
    followupInput.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter' && followupInput.value.trim() !== '') {
            const question = followupInput.value.trim();
            followupInput.value = '';
            
            // Add user message to UI
            const userMsg = document.createElement('div');
            userMsg.className = 'user-message';
            userMsg.textContent = question;
            chatHistoryContainer.appendChild(userMsg);
            
            // Add loading AI message box
            const aiMsg = document.createElement('div');
            aiMsg.className = 'explanation-box ai-message';
            const label = document.createElement('span');
            label.className = 'label accent';
            label.textContent = 'Layman Lens:';
            const textDiv = document.createElement('div');
            aiMsg.appendChild(label);
            aiMsg.appendChild(textDiv);
            chatHistoryContainer.appendChild(aiMsg);
            
            chatHistoryContainer.scrollTop = chatHistoryContainer.scrollHeight;
            
            aiStatusDisplay.textContent = "⚙️ AI Generating...";
            aiStatusDisplay.style.color = "var(--accent-color)";
            
            try {
                const response = await fetch('http://127.0.0.1:8000/simplify-stream', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        full_context: quill.getText(),
                        highlighted_text: currentSelectedText,
                        chat_history: chatHistory,
                        new_question: question,
                        complexity: currentComplexity
                    })
                });

                if (!response.ok) throw new Error('API Request Failed');

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let resultText = '';

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    
                    resultText += decoder.decode(value, { stream: true });
                    textDiv.innerHTML = marked.parse(resultText);
                    chatHistoryContainer.scrollTop = chatHistoryContainer.scrollHeight;
                }
                
                chatHistory.push({role: 'user', content: question});
                chatHistory.push({role: 'model', content: resultText});

            } catch (error) {
                console.error(error);
                textDiv.innerHTML = '<p style="color: #ef4444;">Sorry, something went wrong.</p>';
            } finally {
                aiStatusDisplay.textContent = "AI Idle";
                aiStatusDisplay.style.color = "var(--text-muted)";
            }
        }
    });
});
