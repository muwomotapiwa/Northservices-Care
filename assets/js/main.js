document.addEventListener('DOMContentLoaded', function () {
    // Mobile menu toggle
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navLinks = document.getElementById('navLinks');

    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.setAttribute('role', 'button');
        mobileMenuBtn.setAttribute('tabindex', '0');
        mobileMenuBtn.setAttribute('aria-label', 'Toggle navigation menu');
        mobileMenuBtn.setAttribute('aria-expanded', 'false');

        const toggleMenu = () => {
            const isOpen = navLinks.classList.toggle('active');
            mobileMenuBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            document.body.classList.toggle('menu-open', isOpen);
        };

        mobileMenuBtn.addEventListener('click', toggleMenu);
        mobileMenuBtn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleMenu();
            }
        });

        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                mobileMenuBtn.setAttribute('aria-expanded', 'false');
                document.body.classList.remove('menu-open');
            });
        });

        document.addEventListener('click', (e) => {
            if (!navLinks.contains(e.target) && !mobileMenuBtn.contains(e.target) && navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                mobileMenuBtn.setAttribute('aria-expanded', 'false');
                document.body.classList.remove('menu-open');
            }
        });
    }

    // Contact form handling (Contact page only)
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        const statusBox = document.getElementById('formStatus');
        const fields = {
            name: document.getElementById('name'),
            email: document.getElementById('email'),
            phone: document.getElementById('phone'),
            message: document.getElementById('message'),
            agree: document.getElementById('agree'),
            honeypot: document.getElementById('website')
        };

        const errorEls = {};
        document.querySelectorAll('.error-message[data-error-for]').forEach(el => {
            errorEls[el.getAttribute('data-error-for')] = el;
        });

        const validators = {
            name: value => value.trim().length >= 2 ? '' : 'Please enter your full name.',
            email: value => /^[\w-.]+@([\w-]+\.)+[\w-]{2,}$/i.test(value.trim()) ? '' : 'Enter a valid email address.',
            phone: value => value.replace(/\D/g, '').length >= 9 ? '' : 'Enter a valid phone number.',
            message: value => value.trim().length >= 10 ? '' : 'Please provide a brief description of your needs.',
            agree: checked => checked ? '' : 'Please confirm you agree to the Terms and Privacy Policy.'
        };

        const setError = (fieldKey, message) => {
            const field = fields[fieldKey];
            const errorEl = errorEls[fieldKey];
            if (message) {
                field?.classList.add('input-error');
                if (errorEl) errorEl.textContent = message;
            } else {
                field?.classList.remove('input-error');
                if (errorEl) errorEl.textContent = '';
            }
        };

        const clearStatus = () => {
            if (statusBox) {
                statusBox.classList.remove('success', 'error', 'info');
                statusBox.style.display = 'none';
                statusBox.textContent = '';
            }
        };

        const showStatus = (message, type = 'success') => {
            if (!statusBox) return;
            statusBox.textContent = message;
            statusBox.classList.remove('success', 'error', 'info');
            statusBox.classList.add(type);
            statusBox.style.display = 'block';
        };

        const setSubmitting = (isSubmitting) => {
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            if (!submitBtn) return;
            submitBtn.disabled = isSubmitting;
            submitBtn.textContent = isSubmitting ? 'Sending...' : 'Submit Inquiry';
        };

        const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxjlChRq3ZUklBLv9HGDnsrMWz41755CvmFKz13TS7zzHUmmTStplXDp6XyqXkKiXCILQ/exec';
        const sheetTab = contactForm.dataset.sheetTab || 'ContactForm';

        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();
            clearStatus();
            setSubmitting(true);

            if (fields.honeypot && fields.honeypot.value.trim() !== '') {
                showStatus('Submission blocked.', 'error');
                setSubmitting(false);
                return;
            }

            let hasError = false;
            Object.keys(validators).forEach(key => {
                const field = fields[key];
                const value = key === 'agree' ? field?.checked : field?.value || '';
                const errorMsg = validators[key](value);
                setError(key, errorMsg);
                if (errorMsg) hasError = true;
            });

            if (hasError) {
                showStatus('Please correct the highlighted fields.', 'error');
                setSubmitting(false);
                return;
            }

            const name = fields.name?.value.trim() || 'there';
            const urgency = document.getElementById('urgency')?.value || 'Standard';
            const service = document.getElementById('service')?.value || 'General';
            let responseTime = '2-4 hours';
            if (urgency === 'Emergency') responseTime = '15 minutes';
            if (urgency === 'Urgent') responseTime = '1 hour';

            if (!GOOGLE_SCRIPT_URL.includes('REPLACE_WITH_DEPLOYMENT_ID')) {
                showStatus('Sending your message...', 'info');

                const formData = new FormData();
                formData.append('timestamp', new Date().toISOString());
                formData.append('name', fields.name?.value.trim() || '');
                formData.append('email', fields.email?.value.trim() || '');
                formData.append('phone', fields.phone?.value.trim() || '');
                formData.append('service', service);
                formData.append('urgency', urgency);
                formData.append('message', fields.message?.value.trim() || '');
                formData.append('page', window.location.href);
                formData.append('sheetTab', sheetTab);

                fetch(GOOGLE_SCRIPT_URL, {
                    method: 'POST',
                    body: formData,
                    mode: 'cors',
                    credentials: 'omit'
                })
                    .then(res => res.text().catch(() => ''))
                    .then(() => {
                        showStatus(`Thank you, ${name}! We have your inquiry. For ${urgency.toLowerCase()} requests, we aim to respond within ${responseTime}.`, 'success');
                        contactForm.reset();
                    })
                    .catch(err => {
                        const fallback = 'We could not send your message right now. Please try again or call us.';
                        showStatus(err.name === 'AbortError' ? 'Request timed out. Please try again.' : fallback, 'error');
                    })
                    .finally(() => setSubmitting(false));
            } else {
                showStatus('Form not connected yet. Please add your Google Apps Script URL.', 'error');
                setSubmitting(false);
            }
        });

        ['input', 'change', 'blur'].forEach(evt => {
            contactForm.addEventListener(evt, () => clearStatus());
        });
    }

    // FAQ toggles (Contact page)
    document.querySelectorAll('.faq-question').forEach(question => {
        question.addEventListener('click', () => toggleFAQ(question));
    });
});

// FAQ toggle (Contact page)
function toggleFAQ(element) {
    const answer = element.nextElementSibling;
    const icon = element.querySelector('i');

    if (!answer || !icon) return;

    answer.classList.toggle('active');
    icon.style.transform = answer.classList.contains('active') ? 'rotate(180deg)' : 'rotate(0deg)';
}
