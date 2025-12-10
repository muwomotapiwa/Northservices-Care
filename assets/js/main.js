document.addEventListener('DOMContentLoaded', function () {
    // Mobile menu toggle
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navLinks = document.getElementById('navLinks');

    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', function () {
            navLinks.classList.toggle('active');
        });

        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => navLinks.classList.remove('active'));
        });
    }

    // Contact form handling (Contact page only)
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const name = document.getElementById('name')?.value || 'there';
            const urgency = document.getElementById('urgency')?.value || 'Standard';

            let responseTime = '2-4 hours';
            if (urgency === 'Emergency') responseTime = '15 minutes';
            if (urgency === 'Urgent') responseTime = '1 hour';

            alert(
                'Thank you for your inquiry, ' +
                name +
                '! We have received your message and will contact you as soon as possible.\n\n' +
                'For ' +
                urgency.toLowerCase() +
                ' inquiries, we aim to respond within ' +
                responseTime +
                '.'
            );

            contactForm.reset();
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
