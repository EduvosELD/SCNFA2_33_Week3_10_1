(function() {
    // --- LOCAL AUDIO FILE ASSETS ---
    const clickSound = new Audio('audio/click.mp3');
    const failureSound = new Audio('audio/failure.mp3');
    const victorySound = new Audio('audio/victory.mp3');
    
    clickSound.preload = 'auto';
    failureSound.preload = 'auto';
    victorySound.preload = 'auto';

    function playSound(type) {
        if (type === 'snap') {
            clickSound.currentTime = 0; 
            clickSound.play().catch(err => console.log("Audio play blocked:", err));
        } 
        else if (type === 'fail') {
            failureSound.currentTime = 0;
            failureSound.play().catch(err => console.log("Audio play blocked:", err));
        } 
        else if (type === 'success') {
            victorySound.currentTime = 0;
            victorySound.play().catch(err => console.log("Audio play blocked:", err));
        }
    }

    // Strict exact match engine: Case-insensitive and drops edge whitespace padding
    function checkExactMatch(userInput, targetPhrases) {
        const cleanInput = userInput.trim().toLowerCase();
        if (!cleanInput) return false;

        return targetPhrases.map(p => p.toLowerCase()).includes(cleanInput);
    }

    document.addEventListener("DOMContentLoaded", function() {
        // --- INJECT DEFEAT MODAL INTO DOM ---
        if (!document.getElementById('failure-modal')) {
            const failModalHTML = `
                <div class="modal fade" role="dialog" tabindex="-1" id="failure-modal" style="display:none;background:rgba(0,0,0,0.6);align-items:center;justify-content:center;">
                    <div class="modal-dialog" role="document" style="margin:auto;max-width:500px;width:100%;padding:15px;">
                        <div class="modal-content" style="text-align:center;padding:35px;border-radius:16px;border:none;box-shadow:0 20px 25px -5px rgba(0,0,0,0.1);">
                            <div class="modal-crown-icon" style="font-size: 40px; margin-bottom: 10px;">❌</div>
                            <h2 style="font-weight:700; color:#ef4444; margin-top:0;">Not Quite!</h2>
                            <h3 style="font-size:1.2rem; color:#64748b; margin-bottom:20px;">Review Your Answers</h3>
                            <div id="failure-report-box" style="background-color:#f8fafc; padding:15px; border-radius:8px; text-align:left; margin-bottom:20px; font-size:15px; line-height:1.6;">
                            </div>
                            <button class="btn btn-danger" id="retry-modal-btn" style="width:140px;padding:10px 20px;font-weight:600;border-radius:8px;background-color:#ef4444;border:none;align-self:center;" type="button">Try Again</button>
                        </div>
                    </div>
                </div>`;
            document.body.insertAdjacentHTML('beforeend', failModalHTML);
        }

        const draggables = document.querySelectorAll('.item');
        const dropzones = document.querySelectorAll('.dropzone');
        const zoneContainers = document.querySelectorAll('.dropzone-container');
        const submitBtn = document.getElementById('submit-btn');
        const resetBtn = document.getElementById('reset-btn');
        const successModal = document.getElementById('success-modal');
        const failureModal = document.getElementById('failure-modal');
        const closeModalBtn = document.getElementById('close-modal-btn');
        const retryModalBtn = document.getElementById('retry-modal-btn');

        const q4Input = document.querySelector('#activity-3 input[style*="width: 628px"]');
        const q5Input = document.querySelector('#activity-3 input[style*="width: 280px"]');
        
        if (q4Input) q4Input.id = "q4-input";
        if (q5Input) q5Input.id = "q5-input";

        // --- LIVE INPUT FILTERS (PREVENT MULTIPLE SPACES & STARTING SPACES) ---
        [q4Input, q5Input].forEach(input => {
            if (!input) return;
            input.addEventListener('input', function() {
                // Collapses double spaces and blocks an initial space bar entry
                let cleaned = this.value.replace(/ {2,}/g, ' ');
                if (cleaned.startsWith(' ')) {
                    cleaned = cleaned.trimStart();
                }
                // Cursor-safe conditional text replacement
                if (this.value !== cleaned) {
                    this.value = cleaned;
                }
            });
        });

        let isLocked = false;

        function setLockState(lock) {
            isLocked = lock;
            draggables.forEach(d => d.setAttribute('draggable', lock ? "false" : "true"));
            if (q4Input) q4Input.disabled = lock;
            if (q5Input) q5Input.disabled = lock;
            document.querySelectorAll('.dropdown-toggle').forEach(b => b.disabled = lock);
        }

        // --- SELECT DROPDOWN FUNCTIONALITY ---
        document.querySelectorAll('.dropdown-item').forEach(item => {
            item.addEventListener('click', function(e) {
                if (isLocked) return;
                e.preventDefault();
                const dropdownContainer = this.closest('.dropdown');
                const toggleBtn = dropdownContainer.querySelector('.dropdown-toggle');
                
                toggleBtn.textContent = this.textContent;
                dropdownContainer.setAttribute('data-selected-id', this.id);
                
                dropdownContainer.classList.remove('show');
                dropdownContainer.querySelector('.dropdown-menu').classList.remove('show');
                
                playSound('snap');
                clearFeedback();
            });
        });

        // --- DRAG AND DROP HANDLERS ---
        draggables.forEach(draggable => {
            draggable.addEventListener('dragstart', (e) => {
                if (isLocked) { e.preventDefault(); return; }
                draggable.classList.add('dragging');
            });

            draggable.addEventListener('dragend', () => {
                draggable.classList.remove('dragging');
            });

            draggable.addEventListener('click', () => {
                if (isLocked) return;
                if (draggable.parentElement.classList.contains('dropzone')) {
                    const section = draggable.closest('.activity-section');
                    const pool = section.querySelector('.left-col');
                    pool.appendChild(draggable);
                    playSound('snap'); 
                    clearFeedback();
                }
            });
        });

        dropzones.forEach(zone => {
            const container = zone.closest('.dropzone-container');
            const currentActivityId = zone.closest('.activity-section').id;

            zone.addEventListener('dragover', (e) => {
                if (isLocked) return;
                const draggingItem = document.querySelector('.dragging');
                if (!draggingItem) return;
                const itemActivityId = draggingItem.closest('.activity-section').id;
                
                if (zone.children.length === 0 && currentActivityId === itemActivityId) {
                    e.preventDefault();
                    container.classList.add('drag-over');
                }
            });

            zone.addEventListener('dragleave', () => {
                container.classList.remove('drag-over');
            });

            zone.addEventListener('drop', (e) => {
                if (isLocked) return;
                e.preventDefault();
                container.classList.remove('drag-over');
                const draggingItem = document.querySelector('.dragging');
                
                if (draggingItem && zone.children.length === 0) {
                    zone.appendChild(draggingItem);
                    playSound('snap'); 
                    clearFeedback();
                }
            });
        });

        // --- SUBMIT EVALUATION SYSTEM ---
        submitBtn.addEventListener('click', () => {
            if (isLocked) return;
            clearFeedback();

            let reportErrors = [];
            let act1Correct = true;
            let act2Correct = true;
            let q3Correct = true;
            let q4Correct = false;
            let q5Correct = false;

            let elementsToScrollTo = [];

            // Evaluate Activity 1 & 2
            zoneContainers.forEach(container => {
                const zone = container.querySelector('.dropzone');
                const expectedId = container.getAttribute('data-correct-id');
                const placedItem = zone.querySelector('.item');
                const sectionId = container.closest('.activity-section').id;
                const feedbackWrapper = container.querySelector('.feedback-wrapper');

                const icon = document.createElement('span');
                icon.classList.add('feedback-icon');

                if (placedItem) {
                    const actualId = placedItem.getAttribute('data-id');
                    if (actualId === expectedId) {
                        container.classList.add('correct-zone');
                        icon.innerHTML = ' &#10004;';
                        icon.classList.add('correct-text');
                        feedbackWrapper.appendChild(icon);
                    } else {
                        container.classList.add('wrong-zone');
                        icon.innerHTML = ' &#10006;';
                        icon.classList.add('wrong-text');
                        feedbackWrapper.appendChild(icon);
                        if (sectionId === 'activity-1') act1Correct = false;
                        if (sectionId === 'activity-2') act2Correct = false;
                    }
                } else {
                    container.classList.add('wrong-zone');
                    if (sectionId === 'activity-1') act1Correct = false;
                    if (sectionId === 'activity-2') act2Correct = false;
                }
            });

            if (!act1Correct) {
                reportErrors.push("❌ <strong>Activity 1:</strong> Section 1 pairs are incomplete or incorrect.");
                elementsToScrollTo.push(document.getElementById('activity-1'));
            }
            if (!act2Correct) {
                reportErrors.push("❌ <strong>Activity 2:</strong> Section 2 pairs are incomplete or incorrect.");
                elementsToScrollTo.push(document.getElementById('activity-2'));
            }

            // Evaluate Question 3 (Dropdown True/False)
            const q3Dropdown = document.querySelector('#activity-3 .dropdown');
            const q3Selection = q3Dropdown ? q3Dropdown.getAttribute('data-selected-id') : null;
            if (q3Selection === 'T') {
                if (q3Dropdown) q3Dropdown.classList.add('correct-zone');
            } else {
                if (q3Dropdown) q3Dropdown.classList.add('wrong-zone');
                q3Correct = false;
                reportErrors.push("❌ <strong>Question 3:</strong> Incorrect or incomplete answer provided.");
                if (q3Dropdown) elementsToScrollTo.push(q3Dropdown.parentElement);
            }

            // Evaluate Question 4 (Your Array of Exact Casing-Insensitive Strings)
            if (q4Input) {
                const q4ValidAnswers = ["adh", "antidiuretic", "antidiuretic hormone", "adh antidiuretic hormone", "antidiuretic adh hormone", "antidiuretic hormone adh"];
                if (checkExactMatch(q4Input.value, q4ValidAnswers)) {
                    q4Input.style.borderColor = "#22c55e";
                    q4Input.style.backgroundColor = "#f0fdf4";
                    q4Correct = true;
                } else {
                    q4Input.style.borderColor = "#ef4444";
                    q4Input.style.backgroundColor = "#fef2f2";
                    reportErrors.push("❌ <strong>Question 4:</strong> Incorrect answer provided.");
                    elementsToScrollTo.push(q4Input.parentElement);
                }
            }

            // Evaluate Question 5 (Exact Match check)
            if (q5Input) {
                const q5ValidAnswers = ["diuretic"];
                if (checkExactMatch(q5Input.value, q5ValidAnswers)) {
                    q5Input.style.borderColor = "#22c55e";
                    q5Input.style.backgroundColor = "#f0fdf4";
                    q5Correct = true;
                } else {
                    q5Input.style.borderColor = "#ef4444";
                    q5Input.style.backgroundColor = "#fef2f2";
                    reportErrors.push("❌ <strong>Question 5:</strong> Incorrect answer provided.");
                    elementsToScrollTo.push(q5Input.parentElement);
                }
            }

            // Route completion feedback display triggers
            if (act1Correct && act2Correct && q3Correct && q4Correct && q5Correct) {
                playSound('success');
                setLockState(true);
                successModal.style.setProperty('display', 'flex', 'important');
                successModal.classList.add('show');
            } else {
                playSound('fail');
                setLockState(true); // Freeze background experience interactions
                
                const reportContainer = document.getElementById('failure-report-box');
                if (reportContainer) {
                    reportContainer.innerHTML = reportErrors.join('<br><br>');
                }
                
                failureModal.style.setProperty('display', 'flex', 'important');
                failureModal.classList.add('show');

                // Save layout array context references for automatic scrolling on modal close
                window._missedElements = elementsToScrollTo;
            }
        });

        // --- GLOBAL RESET CONTROLLER ---
        function runFullReset() {
            setLockState(false);
            
            // Return draggable elements back to their base panels
            draggables.forEach(item => {
                const section = item.closest('.activity-section');
                if(section) {
                    const pool = section.querySelector('.left-col');
                    if (pool) pool.appendChild(item);
                }
            });

            // Wipes custom interactive selections and dropdown button context
            const q3Toggle = document.querySelector('#activity-3 .dropdown-toggle');
            if (q3Toggle) q3Toggle.textContent = 'Choose';
            document.querySelector('#activity-3 .dropdown')?.removeAttribute('data-selected-id');

            if (q4Input) {
                q4Input.value = '';
                q4Input.style.borderColor = '';
                q4Input.style.backgroundColor = '';
            }
            if (q5Input) {
                q5Input.value = '';
                q5Input.style.borderColor = '';
                q5Input.style.backgroundColor = '';
            }

            clearFeedback();
        }

        resetBtn.addEventListener('click', runFullReset);

        function clearFeedback() {
            zoneContainers.forEach(container => {
                container.classList.remove('correct-zone', 'wrong-zone');
                const icon = container.querySelector('.feedback-icon');
                if (icon) icon.remove();
            });
            document.querySelectorAll('.dropdown').forEach(d => d.classList.remove('correct-zone', 'wrong-zone'));
        }

        // --- MODAL TRIGGER HANDLERS ---
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => { 
                successModal.style.setProperty('display', 'none', 'important');
                successModal.classList.remove('show');
            });
        }

        if (retryModalBtn) {
            retryModalBtn.addEventListener('click', () => {
                // Clear failure display panel
                failureModal.style.setProperty('display', 'none', 'important');
                failureModal.classList.remove('show');
                
                // Fire instant full wipe
                runFullReset();

                // Snap camera down smoothly targeting the layout error zone
                if (window._missedElements && window._missedElements.length > 0) {
                    setTimeout(() => {
                        window._missedElements[0].scrollIntoView({
                            behavior: 'smooth',
                            block: 'center'
                        });
                        window._missedElements = null; 
                    }, 250);
                }
            });
        }
    });
})();
