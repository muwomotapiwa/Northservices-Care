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
            navLinks.classList.toggle('active');
            const isOpen = navLinks.classList.contains('active');
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
                document.body.classList.remove('menu-open');
                mobileMenuBtn.setAttribute('aria-expanded', 'false');
            });
        });

        document.addEventListener('click', (e) => {
            if (!navLinks.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
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
            email: value => /^[\\w-.]+@([\\w-]+\\.)+[\\w-]{2,}$/i.test(value.trim()) ? '' : 'Enter a valid email address.',
            phone: value => value.replace(/\\D/g, '').length >= 9 ? '' : 'Enter a valid phone number.',
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
                statusBox.classList.remove('success', 'error');
                statusBox.style.display = 'none';
                statusBox.textContent = '';
            }
        };

        const showStatus = (message, type = 'success') => {
            if (!statusBox) return;
            statusBox.textContent = message;
            statusBox.classList.remove('success', 'error');
            statusBox.classList.add(type);
            statusBox.style.display = 'block';
        };

        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();
            clearStatus();

            if (fields.honeypot && fields.honeypot.value.trim() !== '') {
                showStatus('Submission blocked.', 'error');
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
                return;
            }

            const name = fields.name?.value.trim() || 'there';
            const urgency = document.getElementById('urgency')?.value || 'Standard';
            let responseTime = '2–4 hours';
            if (urgency === 'Emergency') responseTime = '15 minutes';
            if (urgency === 'Urgent') responseTime = '1 hour';

            showStatus(`Thank you, ${name}! We have your inquiry. For ${urgency.toLowerCase()} requests, we aim to respond within ${responseTime}.`, 'success');
            contactForm.reset();
        });

        ['input', 'change', 'blur'].forEach(evt => {
            contactForm.addEventListener(evt, () => clearStatus());
        });
    }
});

// FAQ toggle (Contact page)
function toggleFAQ(element) {
    const answer = element.nextElementSibling;
    const icon = element.querySelector('i');

    if (!answer || !icon) return;

    answer.classList.toggle('active');
    icon.style.transform = answer.classList.contains('active') ? 'rotate(180deg)' : 'rotate(0deg)';
}
