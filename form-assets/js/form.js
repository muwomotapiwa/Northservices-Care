/**
 * NorthService Care - Client Contract Form
 * Interactive form with section validation and progressive unlocking
 */

// ============================================
// CONFIGURATION
// ============================================
const sectionConfig = [
    {
        id: 'section-0',
        name: 'Patient Details',
        requiredFields: ['patientName', 'patientID', 'patientAge', 'patientCell', 'patientAddress'],
        requiredRadios: ['patientGender'],
        optional: false
    },
    {
        id: 'section-1',
        name: 'Family Member 1',
        requiredFields: ['family1Name', 'family1Contact'],
        requiredRadios: [],
        optional: false
    },
    {
        id: 'section-2',
        name: 'Family Member 2',
        requiredFields: [],
        requiredRadios: [],
        optional: true
    },
    {
        id: 'section-3',
        name: 'Emergency Contacts',
        requiredFields: [],
        requiredRadios: [],
        optional: true
    },
    {
        id: 'section-4',
        name: 'Payment Info',
        requiredFields: ['paymentName', 'paymentID', 'paymentAddress', 'paymentCell', 'paymentEmail'],
        requiredRadios: [],
        optional: false
    },
    {
        id: 'section-5',
        name: 'Terms & Conditions',
        requiredFields: [],
        requiredRadios: [],
        requiredCheckboxes: ['agreeTerms'],
        optional: false
    },
    {
        id: 'section-6',
        name: 'Signature',
        requiredFields: ['signedByName', 'signedByDate'],
        requiredRadios: [],
        requiresSignature: true,
        optional: false
    }
];

// Track section completion status
let sectionStatus = sectionConfig.map(() => false);
let signaturePad;
let isSubmitting = false;
const notificationEmail = 'muwomotapiwa@gmail.com';

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    initSignaturePad();
    initFormValidation();
    initProgressNavigation();
    initMobileSections();
    updateAllSections();
    setDefaultDate();
});

// ============================================
// SIGNATURE PAD
// ============================================
function initSignaturePad() {
    const canvas = document.getElementById('signature-pad');
    signaturePad = new SignaturePad(canvas, {
        backgroundColor: 'rgb(255, 255, 255)',
        penColor: 'rgb(0, 0, 0)'
    });

    // Resize canvas to fit container
    function resizeCanvas() {
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        const container = canvas.parentElement;
        canvas.width = container.offsetWidth * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        canvas.getContext("2d").scale(ratio, ratio);
        signaturePad.clear();
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Track signature changes
    signaturePad.addEventListener('endStroke', function() {
        document.getElementById('signaturePadContainer').classList.add('has-signature');
        validateSection(6);
        updateAllSections();
    });

    // Clear signature button
    document.getElementById('clearSignature').addEventListener('click', () => {
        signaturePad.clear();
        document.getElementById('signaturePadContainer').classList.remove('has-signature');
        validateSection(6);
        updateAllSections();
    });

    // Download signature button
    document.getElementById('downloadSignature').addEventListener('click', () => {
        if (signaturePad.isEmpty()) {
            alert('Please provide a signature first.');
            return;
        }
        const dataURL = signaturePad.toDataURL();
        const link = document.createElement('a');
        link.download = 'signature.png';
        link.href = dataURL;
        link.click();
    });
}

// ============================================
// FORM VALIDATION
// ============================================
function initFormValidation() {
    // Listen to all form inputs
    document.querySelectorAll('.form-control, input[type="radio"], input[type="checkbox"]').forEach(input => {
        const events = ['input', 'change', 'blur'];
        events.forEach(event => {
            input.addEventListener(event, function() {
                const sectionIndex = parseInt(this.dataset.section);
                if (!isNaN(sectionIndex)) {
                    validateSection(sectionIndex);
                    updateAllSections();
                    updateSummary();
                }
            });
        });
    });

    // Form submission handler
    const submitBtn = document.getElementById('submitBtn');
    const submitStatus = document.getElementById('submitStatus');
    const originalBtnHTML = submitBtn ? submitBtn.innerHTML : '';

    document.getElementById('clientContractForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        if (isSubmitting) return;

        // Check if all required sections are complete
        const allComplete = sectionStatus.every((status, index) => status || sectionConfig[index].optional);
        
        if (!allComplete) {
            alert('Please complete all required sections before submitting.');
            const firstIncomplete = sectionStatus.findIndex((status, index) => !status && !sectionConfig[index].optional);
            if (firstIncomplete !== -1) {
                scrollToSection(firstIncomplete);
            }
            return;
        }

        if (signaturePad.isEmpty()) {
            alert('Please provide your signature before submitting.');
            scrollToSection(6);
            return;
        }

        // Add signature data + timestamp to form (for Google Sheets)
        upsertHiddenInput(this, 'signature', signaturePad.toDataURL());
        upsertHiddenInput(this, 'submittedAt', new Date().toISOString());

        // UI: show submitting state
        isSubmitting = true;
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.classList.add('loading');
            submitBtn.innerHTML = 'Submitting...';
        }
        if (submitStatus) {
            submitStatus.classList.remove('incomplete');
            submitStatus.classList.add('ready');
            submitStatus.innerHTML = '<strong>Submitting...</strong><br>Please wait while we save your contract.';
        }

        const formData = new FormData(this);
        const urlEncoded = new URLSearchParams();
        formData.forEach((value, key) => urlEncoded.append(key, value));

        try {
            // Submit to Google Apps Script (data destination)
            await fetch(this.action, {
                method: 'POST',
                mode: 'no-cors',
                body: urlEncoded
            });

            // Fire-and-forget notification email
            sendNotificationEmail(formData);

            // Redirect to local thank-you page so the Apps Script URL never shows in the browser
            window.location.href = 'thank-you.html';
        } catch (error) {
            isSubmitting = false;
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.classList.remove('loading');
                submitBtn.innerHTML = originalBtnHTML || 'Submit Contract';
            }
            if (submitStatus) {
                submitStatus.classList.remove('ready');
                submitStatus.classList.add('incomplete');
                submitStatus.innerHTML = '<strong>Submission failed.</strong><br>Please check your connection and try again.';
            }
            alert('We could not submit the contract. Please check your connection and try again.');
        }
    });
}

function upsertHiddenInput(form, name, value) {
    let input = form.querySelector(`input[name="${name}"]`);
    if (!input) {
        input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        form.appendChild(input);
    }
    input.value = value;
}

/**
 * Silently send a notification email with key fields so the team knows to check the sheet.
 * Uses formsubmit.co which supports CORS form posts without exposing the email address publicly.
 */
function sendNotificationEmail(formData) {
    try {
        const payload = new FormData();
        payload.append('Client Name', formData.get('patientName') || 'N/A');
        payload.append('Payer Name', formData.get('paymentName') || 'N/A');
        payload.append('Payer Email', formData.get('paymentEmail') || 'N/A');
        payload.append('Payer Phone', formData.get('paymentCell') || 'N/A');
        payload.append('_subject', 'New client contract submitted');
        payload.append('_captcha', 'false');
        payload.append('_template', 'table');

        fetch(`https://formsubmit.co/ajax/${notificationEmail}`, {
            method: 'POST',
            body: payload,
            headers: {
                'Accept': 'application/json'
            }
        }).catch(() => {
            /* ignore notification errors to avoid blocking the user */
        });
    } catch (err) {
        /* ignore notification errors */
    }
}


// ============================================
// PROGRESS NAVIGATION
// ============================================
function initProgressNavigation() {
    document.querySelectorAll('.progress-step').forEach((step) => {
        step.addEventListener('click', function() {
            const sectionIndex = parseInt(this.dataset.section);
            if (this.classList.contains('unlocked') || 
                this.classList.contains('completed') || 
                this.classList.contains('active')) {
                scrollToSection(sectionIndex);
            }
        });
    });
}

// ============================================
// MOBILE SECTIONS
// ============================================
function initMobileSections() {
    if (window.innerWidth < 1024) {
        document.querySelectorAll('.section-content').forEach((content, index) => {
            if (index > 0) {
                content.classList.add('collapsed');
            }
        });
    }
}

window.addEventListener('resize', function() {
    if (window.innerWidth >= 1024) {
        document.querySelectorAll('.section-content').forEach(content => {
            content.classList.remove('collapsed');
        });
    }
});

// ============================================
// SECTION TOGGLE
// ============================================
function toggleSection(header) {
    if (window.innerWidth >= 1024) return;
    
    const section = header.closest('.form-section');
    if (section.classList.contains('locked')) return;

    const content = header.nextElementSibling;
    const toggle = header.querySelector('.section-toggle');
    
    content.classList.toggle('collapsed');
    toggle.classList.toggle('open');
}

// ============================================
// DEFAULT DATE
// ============================================
function setDefaultDate() {
    document.getElementById('signedByDate').valueAsDate = new Date();
}

// ============================================
// VALIDATION FUNCTIONS
// ============================================
function validateSection(sectionIndex) {
    const config = sectionConfig[sectionIndex];
    const section = document.getElementById(config.id);
    
    if (section.classList.contains('locked')) {
        return false;
    }

    let isValid = true;

    // Check required text fields
    if (config.requiredFields) {
        config.requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                const value = field.value.trim();
                if (!value) {
                    isValid = false;
                    field.classList.remove('valid');
                    field.classList.add('invalid');
                } else {
                    field.classList.remove('invalid');
                    field.classList.add('valid');
                }
            }
        });
    }

    // Check required radio buttons
    if (config.requiredRadios) {
        config.requiredRadios.forEach(radioName => {
            const radios = document.querySelectorAll(`input[name="${radioName}"]`);
            const isChecked = Array.from(radios).some(radio => radio.checked);
            if (!isChecked) {
                isValid = false;
            }
            // Update radio option styling
            radios.forEach(radio => {
                const option = radio.closest('.radio-option');
                if (option) {
                    option.classList.toggle('selected', radio.checked);
                }
            });
        });
    }

    // Check required checkboxes
    if (config.requiredCheckboxes) {
        config.requiredCheckboxes.forEach(checkboxId => {
            const checkbox = document.getElementById(checkboxId);
            if (checkbox && !checkbox.checked) {
                isValid = false;
            }
            if (checkbox) {
                const option = checkbox.closest('.checkbox-option');
                if (option) {
                    option.classList.toggle('selected', checkbox.checked);
                }
            }
        });
    }

    // Check signature requirement
    if (config.requiresSignature && signaturePad && signaturePad.isEmpty()) {
        isValid = false;
    }

    // For optional sections, they're always "valid" for progression
    if (config.optional) {
        isValid = true;
    }

    sectionStatus[sectionIndex] = isValid;
    updateSectionUI(sectionIndex, isValid);
    
    return isValid;
}

function updateSectionUI(sectionIndex, isComplete) {
    const config = sectionConfig[sectionIndex];
    const section = document.getElementById(config.id);
    const validation = document.getElementById(`validation-${sectionIndex}`);
    const statusIcon = section.querySelector('.section-status');

    if (isComplete) {
        section.classList.add('completed');
        section.classList.remove('locked');
        if (validation) {
            validation.classList.add('success');
            validation.innerHTML = '<span class="section-validation-icon">✅</span><span>Section complete!</span>';
        }
        if (statusIcon) {
            statusIcon.textContent = '✅';
        }
    } else {
        section.classList.remove('completed');
        if (validation) {
            validation.classList.remove('success');
            if (config.optional) {
                validation.innerHTML = '<span class="section-validation-icon">ℹ️</span><span>This section is optional.</span>';
            } else {
                validation.innerHTML = '<span class="section-validation-icon">⚠️</span><span>Please fill in all required fields marked with *</span>';
            }
        }
        if (statusIcon && !section.classList.contains('locked')) {
            statusIcon.textContent = '📝';
        }
    }
}

function updateAllSections() {
    // Validate all unlocked sections
    sectionConfig.forEach((config, index) => {
        const section = document.getElementById(config.id);
        if (!section.classList.contains('locked')) {
            validateSection(index);
        }
    });

    // Update lock status for each section
    for (let i = 1; i < sectionConfig.length; i++) {
        const prevComplete = sectionStatus[i - 1] || sectionConfig[i - 1].optional;
        const currentSection = document.getElementById(sectionConfig[i].id);
        const statusIcon = currentSection.querySelector('.section-status');

        if (prevComplete) {
            // Unlock this section
            if (currentSection.classList.contains('locked')) {
                currentSection.classList.remove('locked');
                currentSection.classList.add('just-unlocked');
                setTimeout(() => currentSection.classList.remove('just-unlocked'), 500);
                
                // Enable fields
                currentSection.querySelectorAll('.form-control, input[type="radio"], input[type="checkbox"]').forEach(field => {
                    field.disabled = false;
                });

                if (statusIcon) {
                    statusIcon.textContent = '📝';
                }

                // On mobile, expand the newly unlocked section
                if (window.innerWidth < 1024) {
                    const content = currentSection.querySelector('.section-content');
                    if (content) {
                        content.classList.remove('collapsed');
                    }
                }
            }
        } else {
            // Lock this section
            currentSection.classList.add('locked');
            currentSection.classList.remove('completed');
            
            // Disable fields
            currentSection.querySelectorAll('.form-control, input[type="radio"], input[type="checkbox"]').forEach(field => {
                field.disabled = true;
            });

            if (statusIcon) {
                statusIcon.textContent = '🔒';
            }
        }
    }

    // Update UI components
    updateProgressIndicators();
    updateSubmitButton();
    updateCompletionPercentage();
}

// ============================================
// PROGRESS INDICATORS
// ============================================
function updateProgressIndicators() {
    const mobileSteps = document.querySelectorAll('#mobileProgressSteps .progress-step');
    const desktopSteps = document.querySelectorAll('#desktopProgressSteps .progress-step');

    [mobileSteps, desktopSteps].forEach(steps => {
        steps.forEach((step, index) => {
            const section = document.getElementById(sectionConfig[index].id);
            const isLocked = section.classList.contains('locked');
            const isComplete = sectionStatus[index];

            step.classList.remove('active', 'completed', 'unlocked');

            if (isComplete) {
                step.classList.add('completed');
            } else if (!isLocked) {
                const isActive = !sectionStatus.slice(0, index).every((s, i) => s || sectionConfig[i].optional) === false &&
                                (index === 0 || sectionStatus[index - 1] || sectionConfig[index - 1].optional);
                
                if (isActive && !sectionStatus[index]) {
                    step.classList.add('active');
                } else {
                    step.classList.add('unlocked');
                }
            }
        });
    });

    // Determine current active section
    let currentActive = 0;
    for (let i = 0; i < sectionStatus.length; i++) {
        if (!sectionStatus[i] && !sectionConfig[i].optional) {
            currentActive = i;
            break;
        }
        if (i === sectionStatus.length - 1) {
            currentActive = i;
        }
    }

    // Set the current active section
    [mobileSteps, desktopSteps].forEach(steps => {
        steps.forEach((step, index) => {
            if (index === currentActive && !sectionStatus[index]) {
                step.classList.remove('unlocked');
                step.classList.add('active');
            }
        });
    });
}

// ============================================
// SUBMIT BUTTON
// ============================================
function updateSubmitButton() {
    const submitBtn = document.getElementById('submitBtn');
    const submitStatus = document.getElementById('submitStatus');
    
    const allComplete = sectionConfig.every((config, index) => 
        sectionStatus[index] || config.optional
    );

    const hasSignature = signaturePad && !signaturePad.isEmpty();

    if (allComplete && hasSignature) {
        submitBtn.disabled = false;
        submitStatus.classList.remove('incomplete');
        submitStatus.classList.add('ready');
        submitStatus.innerHTML = '<strong>✅ Ready to Submit!</strong><br>All sections complete.';
    } else {
        submitBtn.disabled = true;
        submitStatus.classList.remove('ready');
        submitStatus.classList.add('incomplete');
        
        let missingItems = [];
        sectionConfig.forEach((config, index) => {
            if (!sectionStatus[index] && !config.optional) {
                missingItems.push(config.name);
            }
        });
        if (!hasSignature) {
            missingItems.push('Signature');
        }
        
        submitStatus.innerHTML = `<strong>⚠️ Incomplete</strong><br>Missing: ${missingItems.join(', ')}`;
    }
}

// ============================================
// COMPLETION PERCENTAGE
// ============================================
function updateCompletionPercentage() {
    const requiredSections = sectionConfig.filter(c => !c.optional);
    const completedRequired = requiredSections.filter((c, i) => {
        const actualIndex = sectionConfig.indexOf(c);
        return sectionStatus[actualIndex];
    });

    const percentage = Math.round((completedRequired.length / requiredSections.length) * 100);
    
    const completionText = document.getElementById('completionText');
    const completionFill = document.getElementById('completionFill');
    
    if (completionText) {
        completionText.textContent = `${percentage}% Complete`;
    }
    if (completionFill) {
        completionFill.style.width = `${percentage}%`;
    }
}

// ============================================
// SCROLL TO SECTION
// ============================================
function scrollToSection(index) {
    const section = document.getElementById(sectionConfig[index].id);
    if (section) {
        // On mobile, expand the section first
        if (window.innerWidth < 1024 && !section.classList.contains('locked')) {
            const content = section.querySelector('.section-content');
            const toggle = section.querySelector('.section-toggle');
            if (content) content.classList.remove('collapsed');
            if (toggle) toggle.classList.add('open');
        }
        
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// ============================================
// SUMMARY UPDATE
// ============================================
function updateSummary() {
    const patientName = document.getElementById('patientName').value;
    const patientCell = document.getElementById('patientCell').value;
    const paymentName = document.getElementById('paymentName').value;
    const paymentEmail = document.getElementById('paymentEmail').value;
    
    const summaryContent = document.getElementById('summaryContent');
    if (!summaryContent) return;
    
    let html = '';
    if (patientName) {
        html += `<p style="font-size: 12px; margin-bottom: 6px; padding: 6px; background: var(--bg-light); border-radius: 4px;"><strong>Patient:</strong> ${patientName}</p>`;
    }
    if (patientCell) {
        html += `<p style="font-size: 12px; margin-bottom: 6px; padding: 6px; background: var(--bg-light); border-radius: 4px;"><strong>Cell:</strong> ${patientCell}</p>`;
    }
    if (paymentName) {
        html += `<p style="font-size: 12px; margin-bottom: 6px; padding: 6px; background: var(--bg-light); border-radius: 4px;"><strong>Payer:</strong> ${paymentName}</p>`;
    }
    if (paymentEmail) {
        html += `<p style="font-size: 12px; margin-bottom: 6px; padding: 6px; background: var(--bg-light); border-radius: 4px;"><strong>Email:</strong> ${paymentEmail}</p>`;
    }
    
    summaryContent.innerHTML = html;
}
