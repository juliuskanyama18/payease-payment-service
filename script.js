// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Real-time total calculation
const billAmountInput = document.getElementById('billAmount');
const billAmountDisplay = document.getElementById('billAmountDisplay');
const serviceFeeDisplay = document.getElementById('serviceFeeDisplay');
const totalAmountDisplay = document.getElementById('totalAmountDisplay');

billAmountInput.addEventListener('input', function() {
    const billAmount = parseFloat(this.value) || 0;
    const serviceFee = 150.00; // Fixed service fee in local currency
    const totalAmount = billAmount + serviceFee;
    
    billAmountDisplay.textContent = billAmount.toFixed(2);
    totalAmountDisplay.textContent = totalAmount.toFixed(2);
});

// Form submission handler
document.getElementById('billPaymentForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get form data
    const formData = new FormData(this);
    const billAmount = parseFloat(formData.get('billAmount'));
    const serviceFee = 150.00;
    const totalAmount = billAmount + serviceFee;
    const paymentMethod = formData.get('paymentMethod');
    const billType = formData.get('billType');
    const provider = formData.get('provider');
    
    // Create payment method text
    const paymentMethodText = {
        'bank': '🏦 Bank Transfer',
        'crypto': '₿ Cryptocurrency',
        'mobile': '📱 Mobile Money',
        'other': '💳 Other Method'
    }[paymentMethod] || paymentMethod;
    
    // Display confirmation with next steps
    alert(`✅ Bill Payment Request Submitted Successfully!\n\n` +
          `📋 Summary:\n` +
          `• ${billType.toUpperCase()} Bill - ${provider}\n` +
          `• Bill Amount: ${billAmount.toFixed(2)}\n` +
          `• Service Fee: ${serviceFee.toFixed(2)}\n` +
          `• Total Amount: ${totalAmount.toFixed(2)}\n` +
          `• Payment Method: ${paymentMethodText}\n\n` +
          `🚀 Next Steps:\n` +
          `1. We'll send payment instructions to your email within 30 minutes\n` +
          `2. Send us ${totalAmount.toFixed(2)} using your chosen payment method\n` +
          `3. We'll pay your bill within 24 hours\n` +
          `4. You'll receive the official receipt via email\n\n` +
          `Thank you for choosing our service! 🙏`);
    
    // Reset form
    this.reset();
    
    // Reset total display
    billAmountDisplay.textContent = '0.00';
    totalAmountDisplay.textContent = '150.00';
});

// Add floating animation to feature cards
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.animation = 'fadeInUp 0.6s ease forwards';
        }
    });
}, observerOptions);

document.querySelectorAll('.feature-card, .service-card, .step').forEach(card => {
    observer.observe(card);
});