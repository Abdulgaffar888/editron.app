// Navigation functions
function showEditorLogin() {
    document.getElementById('landing-page').classList.add('hidden');
    document.getElementById('editor-login').classList.remove('hidden');
}

function showCustomerLogin() {
    document.getElementById('landing-page').classList.add('hidden');
    document.getElementById('customer-login').classList.remove('hidden');
}

function backToHome() {
    document.getElementById('editor-login').classList.add('hidden');
    document.getElementById('customer-login').classList.add('hidden');
    document.getElementById('editor-dashboard').classList.add('hidden');
    document.getElementById('customer-dashboard').classList.add('hidden');
    document.getElementById('landing-page').classList.remove('hidden');
}

// OTP functions
function sendOTP(type) {
    const name = document.getElementById(`${type}-name`).value;
    const email = document.getElementById(`${type}-email`).value;
    const phone = document.getElementById(`${type}-phone`).value;
    
    if (!name || !email || !phone) {
        alert('Please fill in all fields');
        return;
    }
    
    // Show OTP container
    document.getElementById(`${type}-otp-container`).style.display = 'block';
    document.getElementById(`${type}-login-btn`).classList.add('hidden');
    document.getElementById(`${type}-verify-btn`).classList.remove('hidden');
    
    // Start OTP timer
    startOTPTimer(type);
    
    // In a real app, you would send the OTP to the user's phone here
    alert(`OTP sent to ${phone}. In a real application, this would be sent via SMS.`);
}

function verifyOTP(type) {
    // In a real app, you would verify the OTP here
    // For demo purposes, we'll just proceed to the dashboard
    
    if (type === 'editor') {
        document.getElementById('editor-login').classList.add('hidden');
        document.getElementById('editor-dashboard').classList.remove('hidden');
    } else {
        document.getElementById('customer-login').classList.add('hidden');
        document.getElementById('customer-dashboard').classList.remove('hidden');
    }
}

function resendOTP(type) {
    // In a real app, you would resend the OTP here
    alert(`OTP resent to your phone. In a real application, this would be sent via SMS.`);
    startOTPTimer(type);
}

function startOTPTimer(type) {
    let timeLeft = 120; // 2 minutes in seconds
    const timerElement = document.getElementById(`${type}-otp-timer`);
    const resendElement = document.getElementById(`${type}-resend-otp`);
    
    resendElement.style.display = 'none';
    
    const timer = setInterval(() => {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        
        timerElement.textContent = `OTP will expire in ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        if (timeLeft <= 0) {
            clearInterval(timer);
            timerElement.textContent = 'OTP expired';
            resendElement.style.display = 'block';
        }
        
        timeLeft--;
    }, 1000);
}

function moveToNext(input, type) {
    const inputs = document.querySelectorAll(`#${type}-otp-container .otp-input`);
    const index = Array.from(inputs).indexOf(input);
    
    if (input.value.length === 1 && index < inputs.length - 1) {
        inputs[index + 1].focus();
    }
}

// Toggle dropdown menu
function toggleDropdown() {
    const dropdown = document.getElementById('dropdownMenu');
    if (dropdown) {
        dropdown.classList.toggle('show');
    }
    
    const customerDropdown = document.getElementById('dropdownMenuCustomer');
    if (customerDropdown) {
        customerDropdown.classList.toggle('show');
    }
}

// Toggle sidebar for mobile
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const customerSidebar = document.getElementById('customer-sidebar');
    const hamburger = document.querySelector('.hamburger');
    
    if (sidebar) {
        sidebar.classList.toggle('active');
    }
    if (customerSidebar) {
        customerSidebar.classList.toggle('active');
    }
    if (hamburger) {
        hamburger.classList.toggle('active');
    }
}

// Show different pages
function showPage(pageId) {
    // Hide all pages
    const pages = document.querySelectorAll('.page-content');
    pages.forEach(page => {
        page.classList.remove('active');
    });
    
    // Show selected page
    document.getElementById(pageId).classList.add('active');
    
    // Update active menu item
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.classList.remove('active');
    });
    event.currentTarget.classList.add('active');
    
    // Close sidebar on mobile after selection
    if (window.innerWidth <= 768) {
        toggleSidebar();
    }
}

// Close dropdown when clicking outside
window.onclick = function(event) {
    if (!event.target.matches('.user-avatar')) {
        const dropdowns = document.getElementsByClassName("dropdown-menu");
        for (let i = 0; i < dropdowns.length; i++) {
            const openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('show')) {
                openDropdown.classList.remove('show');
            }
        }
    }
}

// Settings page functionality
document.addEventListener('DOMContentLoaded', function() {
    // Function to handle toggle switches
    document.querySelectorAll('.toggle input').forEach(toggle => {
        toggle.addEventListener('change', function() {
            const section = this.closest('.settings-section');
            const sectionName = section.querySelector('h3').textContent;
            const isEnabled = this.checked;
            
            console.log(`${sectionName} - ${isEnabled ? 'Enabled' : 'Disabled'}`);
            // Add your toggle functionality here
        });
    });

    // Function to handle button clicks in settings
    document.querySelectorAll('.settings-content .btn').forEach(button => {
        button.addEventListener('click', function() {
            const action = this.textContent.trim();
            const section = this.closest('.settings-section');
            const sectionName = section.querySelector('h3').textContent;
            
            console.log(`Clicked: ${action} in ${sectionName}`);
            // Add your button functionality here
            
            // Example: Show alert for dangerous actions
            if (this.classList.contains('btn-danger')) {
                if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                    // Proceed with account deletion
                    alert('Account deletion process initiated.');
                }
            }
            
            if (this.classList.contains('btn-warning')) {
                if (confirm('Are you sure you want to deactivate your account?')) {
                    // Proceed with account deactivation
                    alert('Account deactivation process initiated.');
                }
            }
        });
    });

    // Function to handle form submissions in settings
    document.querySelectorAll('.settings-content form').forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            // Add your form submission logic here
            alert('Settings saved successfully!');
        });
    });
});