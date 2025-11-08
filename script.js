// ==================== BUSINESS LOGIC LAYER ====================

// Editor Commission & Loyalty System
class CommissionSystem {
    static calculateCommission(editorId, amount) {
        const editor = UserManager.getEditor(editorId);
        const loyaltyLevel = this.getLoyaltyLevel(editor);
        
        let commissionRate = 0.10; // Default 10%
        if (loyaltyLevel === 'Silver') {
            commissionRate = 0.05; // Loyalty reward 5%
        }
        
        const commission = amount * commissionRate;
        const editorEarnings = amount - commission;
        
        return {
            commissionRate,
            commission,
            editorEarnings,
            loyaltyLevel
        };
    }
    
    static getLoyaltyLevel(editor) {
        const successfulDeals = editor.completedDeals || 0;
        const lastActivity = editor.lastActivity ? new Date(editor.lastActivity) : new Date();
        const daysSinceActivity = (new Date() - lastActivity) / (1000 * 60 * 60 * 24);
        
        // Reset loyalty if inactive for 60 days
        if (daysSinceActivity > 60 && successfulDeals < 5) {
            return 'Bronze';
        }
        
        return successfulDeals >= 5 ? 'Silver' : 'Bronze';
    }
    
    static updateEditorActivity(editorId) {
        const editor = UserManager.getEditor(editorId);
        editor.lastActivity = new Date().toISOString();
        UserManager.updateEditor(editor);
    }
}

// Communication Privacy System
class CommunicationSystem {
    static filterSensitiveMessages(messages, hasAdvancePayment) {
        if (hasAdvancePayment) {
            return messages; // Show all messages
        }
        
        // Hide sensitive information
        return messages.map(message => ({
            ...message,
            content: this.sanitizeContent(message.content)
        }));
    }
    
    static sanitizeContent(content) {
        // Regex patterns to detect sensitive information
        const phoneRegex = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g;
        const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
        const urlRegex = /https?:\/\/[^\s]+/g;
        
        return content
            .replace(phoneRegex, '***-***-****')
            .replace(emailRegex, '***@***.***')
            .replace(urlRegex, '***');
    }
    
    static processAdvancePayment(dealId, amount) {
        const deal = DealManager.getDeal(dealId);
        const totalAmount = deal.budget;
        const requiredAdvance = totalAmount * 0.20;
        
        if (amount >= requiredAdvance) {
            deal.advancePaid = true;
            deal.advanceAmount = amount;
            deal.adminFee = amount * 0.05; // 5% admin fee
            
            DealManager.updateDeal(deal);
            return { success: true, adminFee: deal.adminFee };
        }
        
        return { success: false, requiredAmount: requiredAdvance };
    }
    
    static cancelDeal(dealId) {
        const deal = DealManager.getDeal(dealId);
        
        if (deal.advancePaid && !deal.workStarted) {
            // Refund advance minus admin fee
            const refundAmount = deal.advanceAmount - deal.adminFee;
            deal.status = 'cancelled';
            deal.refundAmount = refundAmount;
            
            DealManager.updateDeal(deal);
            return { refunded: true, amount: refundAmount, adminFee: deal.adminFee };
        }
        
        return { refunded: false };
    }
}

// Editor Reputation System
class ReputationSystem {
    static calculateReputation(editor) {
        const completedDeals = editor.completedDeals || 0;
        const cancelledDeals = editor.cancelledDeals || 0;
        const lateDeliveries = editor.lateDeliveries || 0;
        
        let points = (completedDeals * 10) - (cancelledDeals * 5) - (lateDeliveries * 5);
        points = Math.max(0, points); // No negative points
        
        return {
            points,
            badge: this.getBadge(points),
            level: this.getLevel(points)
        };
    }
    
    static getBadge(points) {
        if (points >= 101) return '💎 Gold';
        if (points >= 51) return '🌟 Silver';
        return '⭐ Bronze';
    }
    
    static getLevel(points) {
        if (points >= 101) return 'Gold';
        if (points >= 51) return 'Silver';
        return 'Bronze';
    }
    
    static updateReputation(editorId, action) {
        const editor = UserManager.getEditor(editorId);
        
        switch(action) {
            case 'deal_completed':
                editor.completedDeals = (editor.completedDeals || 0) + 1;
                break;
            case 'deal_cancelled':
                editor.cancelledDeals = (editor.cancelledDeals || 0) + 1;
                break;
            case 'late_delivery':
                editor.lateDeliveries = (editor.lateDeliveries || 0) + 1;
                break;
        }
        
        UserManager.updateEditor(editor);
        return this.calculateReputation(editor);
    }
}

// Project Tracking System
class ProjectTracker {
    static createTracker(dealId) {
        const tracker = {
            dealId,
            startDate: new Date().toISOString(),
            status: 'Not Started',
            milestones: [],
            progress: 0,
            lastUpdated: new Date().toISOString()
        };
        
        TrackerManager.saveTracker(tracker);
        return tracker;
    }
    
    static updateProgress(dealId, status, progress) {
        const tracker = TrackerManager.getTracker(dealId);
        
        if (tracker) {
            tracker.status = status;
            tracker.progress = progress;
            tracker.lastUpdated = new Date().toISOString();
            
            TrackerManager.saveTracker(tracker);
            
            // Auto-update UI if on project page
            this.updateProgressUI(dealId);
        }
    }
    
    static addMilestone(dealId, milestone) {
        const tracker = TrackerManager.getTracker(dealId);
        
        if (tracker) {
            milestone.id = Date.now();
            milestone.date = new Date().toISOString();
            milestone.completed = false;
            
            tracker.milestones.push(milestone);
            TrackerManager.saveTracker(tracker);
        }
    }
    
    static completeMilestone(dealId, milestoneId) {
        const tracker = TrackerManager.getTracker(dealId);
        
        if (tracker) {
            const milestone = tracker.milestones.find(m => m.id === milestoneId);
            if (milestone) {
                milestone.completed = true;
                milestone.completedDate = new Date().toISOString();
                TrackerManager.saveTracker(tracker);
            }
        }
    }
    
    static updateProgressUI(dealId) {
        // This would update the visual progress bars in the UI
        const progressElement = document.querySelector(`[data-deal-id="${dealId}"] .progress-bar`);
        if (progressElement) {
            const tracker = TrackerManager.getTracker(dealId);
            progressElement.style.width = `${tracker.progress}%`;
            progressElement.textContent = `${tracker.progress}%`;
        }
    }
}

// ==================== DATA MANAGEMENT ====================

class UserManager {
    static getEditor(editorId) {
        const editors = this.getEditors();
        return editors.find(editor => editor.id === editorId) || this.createDefaultEditor(editorId);
    }
    
    static updateEditor(editorData) {
        const editors = this.getEditors();
        const index = editors.findIndex(editor => editor.id === editorData.id);
        
        if (index !== -1) {
            editors[index] = { ...editors[index], ...editorData };
        } else {
            editors.push(editorData);
        }
        
        localStorage.setItem('editors', JSON.stringify(editors));
    }
    
    static getEditors() {
        const stored = localStorage.getItem('editors');
        if (stored) return JSON.parse(stored);
        
        // Initialize with sample editors
        const sampleEditors = [
            {
                id: 'editor1',
                name: 'Michael Chen',
                completedDeals: 8,
                cancelledDeals: 1,
                lateDeliveries: 0,
                lastActivity: new Date().toISOString()
            },
            {
                id: 'editor2', 
                name: 'Sarah Williams',
                completedDeals: 12,
                cancelledDeals: 0,
                lateDeliveries: 1,
                lastActivity: new Date().toISOString()
            },
            {
                id: 'editor3',
                name: 'Emma Thompson',
                completedDeals: 3,
                cancelledDeals: 0,
                lateDeliveries: 0,
                lastActivity: new Date().toISOString()
            }
        ];
        
        localStorage.setItem('editors', JSON.stringify(sampleEditors));
        return sampleEditors;
    }
    
    static createDefaultEditor(editorId) {
        return {
            id: editorId,
            name: 'Unknown Editor',
            completedDeals: 0,
            cancelledDeals: 0,
            lateDeliveries: 0,
            lastActivity: new Date().toISOString()
        };
    }
}

class DealManager {
    static getDeal(dealId) {
        const deals = this.getDeals();
        return deals.find(deal => deal.id === dealId) || this.createDefaultDeal(dealId);
    }
    
    static updateDeal(dealData) {
        const deals = this.getDeals();
        const index = deals.findIndex(deal => deal.id === dealData.id);
        
        if (index !== -1) {
            deals[index] = { ...deals[index], ...dealData };
        } else {
            deals.push(dealData);
        }
        
        localStorage.setItem('deals', JSON.stringify(deals));
    }
    
    static getDeals() {
        const stored = localStorage.getItem('deals');
        return stored ? JSON.parse(stored) : [];
    }
    
    static createDefaultDeal(dealId) {
        return {
            id: dealId,
            budget: 0,
            advancePaid: false,
            advanceAmount: 0,
            adminFee: 0,
            status: 'pending',
            workStarted: false
        };
    }
}

class TrackerManager {
    static saveTracker(tracker) {
        const trackers = this.getTrackers();
        const index = trackers.findIndex(t => t.dealId === tracker.dealId);
        
        if (index !== -1) {
            trackers[index] = tracker;
        } else {
            trackers.push(tracker);
        }
        
        localStorage.setItem('projectTrackers', JSON.stringify(trackers));
    }
    
    static getTracker(dealId) {
        const trackers = this.getTrackers();
        return trackers.find(tracker => tracker.dealId === dealId);
    }
    
    static getTrackers() {
        const stored = localStorage.getItem('projectTrackers');
        return stored ? JSON.parse(stored) : [];
    }
}

// ==================== UI INTEGRATION (Non-disruptive) ====================

// Enhanced editor card rendering with reputation badges
function enhanceEditorCards() {
    const editorCards = document.querySelectorAll('.editor-card');
    
    editorCards.forEach(card => {
        const editorName = card.querySelector('h3').textContent;
        const editors = UserManager.getEditors();
        const editor = editors.find(e => e.name === editorName);
        
        if (editor) {
            const reputation = ReputationSystem.calculateReputation(editor);
            const loyaltyLevel = CommissionSystem.getLoyaltyLevel(editor);
            
            // Add reputation badge
            const ratingElement = card.querySelector('.rating');
            if (ratingElement && !card.querySelector('.reputation-badge')) {
                const badge = document.createElement('span');
                badge.className = 'reputation-badge';
                badge.textContent = reputation.badge;
                badge.style.marginLeft = '10px';
                badge.style.fontSize = '0.8em';
                badge.style.background = 'linear-gradient(135deg, #6a11cb, #2575fc)';
                badge.style.color = 'white';
                badge.style.padding = '2px 8px';
                badge.style.borderRadius = '10px';
                ratingElement.appendChild(badge);
            }
            
            // Add loyalty level to bio
            const bioElement = card.querySelector('.editor-bio');
            if (bioElement) {
                const loyaltyText = ` • ${loyaltyLevel} Level Editor`;
                if (!bioElement.textContent.includes('Level Editor')) {
                    bioElement.textContent += loyaltyText;
                }
            }
        }
    });
}

// Enhanced profile page with detailed stats
function enhanceProfilePage() {
    const profilePage = document.getElementById('profile');
    if (profilePage && profilePage.classList.contains('active')) {
        const editor = UserManager.getEditor('current'); // In real app, use actual editor ID
        
        const reputation = ReputationSystem.calculateReputation(editor);
        const loyaltyLevel = CommissionSystem.getLoyaltyLevel(editor);
        
        // Add reputation section if not exists
        if (!document.querySelector('.reputation-section')) {
            const profileContent = document.querySelector('.profile-content');
            const reputationSection = document.createElement('div');
            reputationSection.className = 'profile-section reputation-section';
            reputationSection.innerHTML = `
                <h3>Editor Reputation</h3>
                <div class="reputation-info" style="display: flex; align-items: center; gap: 20px;">
                    <div class="reputation-badge-large" style="font-size: 2rem; background: linear-gradient(135deg, #6a11cb, #2575fc); color: white; padding: 15px; border-radius: 50%; width: 80px; height: 80px; display: flex; align-items: center; justify-content: center;">${reputation.badge.split(' ')[0]}</div>
                    <div class="reputation-stats">
                        <p><strong>Reputation Points:</strong> ${reputation.points}</p>
                        <p><strong>Loyalty Level:</strong> ${loyaltyLevel}</p>
                        <p><strong>Commission Rate:</strong> ${loyaltyLevel === 'Silver' ? '5%' : '10%'}</p>
                        <p><strong>Badge:</strong> ${reputation.badge}</p>
                    </div>
                </div>
            `;
            profileContent.insertBefore(reputationSection, profileContent.firstChild);
        }
    }
}

// Enhanced project handling
function handleProjectCreation(projectData) {
    const dealId = 'deal_' + Date.now();
    
    // Create project tracker
    ProjectTracker.createTracker(dealId);
    
    // Update editor reputation when deal is completed
    setTimeout(() => {
        ReputationSystem.updateReputation('editor1', 'deal_completed'); // Example
    }, 1000);
}

// Enhanced chat system with privacy
function enhanceChatSystem() {
    const chatInput = document.querySelector('.chat-input input');
    const sendButton = document.querySelector('.btn-send');
    
    if (chatInput && sendButton) {
        // Override send functionality to include privacy filtering
        const originalSend = window.sendMessage;
        
        window.sendMessage = function() {
            const message = chatInput.value.trim();
            if (message) {
                // Check if advance payment is made (in real app, check actual deal status)
                const hasAdvancePayment = false; // This would come from deal data
                
                const filteredMessage = CommunicationSystem.sanitizeContent(message);
                
                // In real implementation, you would save the original and filtered versions
                console.log('Original:', message);
                console.log('Filtered:', filteredMessage);
                
                // Call original send function with filtered message
                if (originalSend) {
                    originalSend();
                }
            }
        };
    }
}

// ==================== EXISTING CODE (Modified with Business Logic) ====================

// Navigation functions
function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Show selected page
    document.getElementById(pageId).classList.add('active');
    
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Find and activate the corresponding nav item
    const activeNavItem = document.querySelector(`[onclick="showPage('${pageId}')"]`);
    if (activeNavItem) {
        activeNavItem.classList.add('active');
    }
    
    // Close mobile menu if open
    closeMobileMenu();
    
    // Enhance specific pages with business logic
    setTimeout(() => {
        if (pageId === 'profile') {
            enhanceProfilePage();
        }
        if (pageId === 'discover') {
            enhanceEditorCards();
        }
    }, 100);
}

function showRoleSelection() {
    document.getElementById('login-page').classList.add('hidden');
    document.getElementById('role-selection').classList.remove('hidden');
}

function backToLogin() {
    document.getElementById('role-selection').classList.add('hidden');
    document.getElementById('login-page').classList.remove('hidden');
}

function selectRole(role) {
    // In a real app, you would save the role selection
    console.log(`Role selected: ${role}`);
    
    // Store role in localStorage for demo purposes
    localStorage.setItem('userRole', role);
    
    // Show main app
    document.getElementById('role-selection').classList.add('hidden');
    document.getElementById('main-app').classList.remove('hidden');
    
    // Update UI based on role
    updateUIForRole(role);
    
    // Show dashboard by default
    showPage('dashboard');
}

function updateUIForRole(role) {
    const quickActions = document.getElementById('quick-actions');
    
    if (role === 'client') {
        // Client view
        if (quickActions) {
            quickActions.innerHTML = `
                <button class="action-btn" onclick="showPage('discover'); switchDiscoveryTab('editors')">
                    <i class="fas fa-users"></i>
                    <span>Find Editors</span>
                </button>
                <button class="action-btn" onclick="showCreateProject()">
                    <i class="fas fa-plus"></i>
                    <span>Post Project</span>
                </button>
                <button class="action-btn" onclick="showBusinessDemo()">
                    <i class="fas fa-chart-line"></i>
                    <span>Business Demo</span>
                </button>
            `;
        }
    } else if (role === 'editor') {
        // Editor view
        if (quickActions) {
            quickActions.innerHTML = `
                <button class="action-btn" onclick="showPage('discover'); switchDiscoveryTab('projects')">
                    <i class="fas fa-search"></i>
                    <span>Find Projects</span>
                </button>
                <button class="action-btn" onclick="showPage('profile')">
                    <i class="fas fa-portfolio"></i>
                    <span>My Portfolio</span>
                </button>
                <button class="action-btn" onclick="showBusinessDemo()">
                    <i class="fas fa-chart-line"></i>
                    <span>Business Demo</span>
                </button>
            `;
        }
    }
}

function showBusinessDemo() {
    alert('Business Logic Demo:\n\n✓ Commission System: 10% (5% for loyal editors)\n✓ Privacy System: Contact info hidden until payment\n✓ Reputation System: Points & badges for editors\n✓ Project Tracking: Auto-generated trackers\n\nCheck console for detailed examples!');
    
    // Demo business logic
    console.log('=== BUSINESS LOGIC DEMO ===');
    const commission = CommissionSystem.calculateCommission('editor1', 1000);
    console.log('Commission for $1000 project:', commission);
    
    const editor = UserManager.getEditor('editor1');
    const reputation = ReputationSystem.calculateReputation(editor);
    console.log('Editor reputation:', reputation);
}

function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        alert('Please enter both email and password');
        return;
    }
    
    // In a real app, you would authenticate here
    // For demo, we'll show role selection
    showRoleSelection();
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        document.getElementById('main-app').classList.add('hidden');
        document.getElementById('login-page').classList.remove('hidden');
        
        // Clear form fields
        document.getElementById('email').value = '';
        document.getElementById('password').value = '';
        
        // Clear stored role
        localStorage.removeItem('userRole');
    }
}

// Toggle dropdown menu
function toggleDropdown() {
    const dropdown = document.getElementById('dropdownMenu');
    dropdown.classList.toggle('show');
}

// Toggle mobile menu
function toggleMobileMenu() {
    const nav = document.querySelector('.main-nav');
    const toggle = document.querySelector('.mobile-menu-toggle');
    const body = document.body;
    
    nav.classList.toggle('active');
    toggle.classList.toggle('active');
    body.classList.toggle('menu-open');
    
    // Close dropdown if open
    const dropdown = document.getElementById('dropdownMenu');
    if (dropdown) {
        dropdown.classList.remove('show');
    }
}

function closeMobileMenu() {
    const nav = document.querySelector('.main-nav');
    const toggle = document.querySelector('.mobile-menu-toggle');
    const body = document.body;
    
    nav.classList.remove('active');
    toggle.classList.remove('active');
    body.classList.remove('menu-open');
}

// Close dropdown when clicking outside
window.onclick = function(event) {
    if (!event.target.matches('.user-avatar') && !event.target.closest('.user-avatar')) {
        const dropdowns = document.getElementsByClassName("dropdown-menu");
        for (let i = 0; i < dropdowns.length; i++) {
            const openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('show')) {
                openDropdown.classList.remove('show');
            }
        }
    }
    
    // Close mobile menu when clicking outside
    if (window.innerWidth <= 768) {
        const nav = document.querySelector('.main-nav');
        const toggle = document.querySelector('.mobile-menu-toggle');
        
        if (nav.classList.contains('active') && 
            !nav.contains(event.target) && 
            !toggle.contains(event.target)) {
            closeMobileMenu();
        }
    }
}

// Discovery tab switching
function switchDiscoveryTab(tab) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.currentTarget.classList.add('active');
    
    // Show corresponding tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tab}-tab`).classList.add('active');
    
    // Enhance editor cards with business logic
    if (tab === 'editors') {
        setTimeout(enhanceEditorCards, 100);
    }
}

// Project creation modal
function showCreateProject() {
    document.getElementById('create-project-modal').classList.remove('hidden');
}

function closeCreateProject() {
    document.getElementById('create-project-modal').classList.add('hidden');
}

// Enhanced project creation with business logic
function handleProjectSubmit(formData) {
    const dealId = 'deal_' + Date.now();
    
    // Create project tracker
    ProjectTracker.createTracker(dealId);
    
    // Initialize deal data
    const deal = {
        id: dealId,
        budget: parseFloat(formData.budget) || 0,
        advancePaid: false,
        status: 'active',
        workStarted: false
    };
    
    DealManager.updateDeal(deal);
    
    alert('Project created successfully! A project tracker has been automatically generated.');
    console.log('New deal created:', deal);
}

// Profile editing
function editProfile() {
    alert('Edit profile functionality would open here');
    // In a real app, this would enable form editing
}

// Profile picture functionality
function changeProfilePicture() {
    // Create file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    
    fileInput.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const newImageUrl = event.target.result;
                
                // Update both profile and user avatars
                const profileAvatar = document.getElementById('profile-avatar');
                const userAvatar = document.querySelector('.user-avatar img');
                
                if (profileAvatar) {
                    profileAvatar.src = newImageUrl;
                }
                if (userAvatar) {
                    userAvatar.src = newImageUrl;
                }
                
                // In a real app, you would upload the image to your server
                alert('Profile picture updated successfully!');
            };
            reader.readAsDataURL(file);
        }
    };
    
    fileInput.click();
}

// Editor filter functionality
function initializeEditorFilters() {
    const skillFilter = document.getElementById('editor-skill');
    const ratingFilter = document.getElementById('editor-rating');
    
    if (skillFilter && ratingFilter) {
        skillFilter.addEventListener('change', filterEditors);
        ratingFilter.addEventListener('change', filterEditors);
    }
}

function filterEditors() {
    const skillFilter = document.getElementById('editor-skill').value;
    const ratingFilter = document.getElementById('editor-rating').value;
    const editorCards = document.querySelectorAll('.editor-card');
    
    editorCards.forEach(card => {
        let showCard = true;
        
        // Filter by skill
        if (skillFilter && skillFilter !== 'All Skills') {
            const skills = card.getAttribute('data-skills');
            if (!skills.includes(skillFilter)) {
                showCard = false;
            }
        }
        
        // Filter by rating
        if (showCard && ratingFilter && ratingFilter !== 'Any Rating') {
            const rating = parseFloat(card.getAttribute('data-rating'));
            
            if (ratingFilter === '4+ Stars' && rating < 4) {
                showCard = false;
            } else if (ratingFilter === '4.5+ Stars' && rating < 4.5) {
                showCard = false;
            }
        }
        
        // Show/hide card
        if (showCard) {
            card.classList.remove('hidden');
        } else {
            card.classList.add('hidden');
        }
    });
}

// Project filter functionality
function initializeProjectFilters() {
    const categoryFilter = document.getElementById('project-category');
    const budgetFilter = document.getElementById('project-budget');
    
    if (categoryFilter && budgetFilter) {
        categoryFilter.addEventListener('change', filterProjects);
        budgetFilter.addEventListener('change', filterProjects);
    }
}

function filterProjects() {
    const categoryFilter = document.getElementById('project-category').value;
    const budgetFilter = document.getElementById('project-budget').value;
    const projectListings = document.querySelectorAll('.project-listing');
    
    projectListings.forEach(project => {
        let showProject = true;
        
        // Filter by category
        if (categoryFilter && categoryFilter !== 'All Categories') {
            const category = project.getAttribute('data-category');
            if (category !== categoryFilter) {
                showProject = false;
            }
        }
        
        // Filter by budget
        if (showProject && budgetFilter && budgetFilter !== 'Any Budget') {
            const budget = parseInt(project.getAttribute('data-budget'));
            
            if (budgetFilter === 'Under $500' && budget >= 500) {
                showProject = false;
            } else if (budgetFilter === '$500 - $1000' && (budget < 500 || budget > 1000)) {
                showProject = false;
            } else if (budgetFilter === '$1000+' && budget <= 1000) {
                showProject = false;
            }
        }
        
        // Show/hide project
        if (showProject) {
            project.classList.remove('hidden');
        } else {
            project.classList.add('hidden');
        }
    });
}

// Form submission handlers
document.addEventListener('DOMContentLoaded', function() {
    // Project form submission
    const projectForm = document.querySelector('.project-form');
    if (projectForm) {
        projectForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            const projectData = Object.fromEntries(formData);
            
            handleProjectSubmit(projectData);
            closeCreateProject();
            this.reset();
        });
    }
    
    // Settings form submission
    const settingsForm = document.querySelector('.settings-form');
    if (settingsForm) {
        settingsForm.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('Settings saved successfully!');
        });
    }
    
    // Chat functionality
    const chatInput = document.querySelector('.chat-input input');
    const sendButton = document.querySelector('.btn-send');
    
    if (chatInput && sendButton) {
        function sendMessage() {
            const message = chatInput.value.trim();
            if (message) {
                // In a real app, you would send the message to the server
                const chatMessages = document.querySelector('.chat-messages');
                const messageElement = document.createElement('div');
                messageElement.className = 'message sent';
                
                // Apply privacy filtering
                const filteredMessage = CommunicationSystem.sanitizeContent(message);
                
                messageElement.innerHTML = `
                    <p>${filteredMessage}</p>
                    <span class="message-time">Just now</span>
                `;
                chatMessages.appendChild(messageElement);
                chatInput.value = '';
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
        }
        
        sendButton.addEventListener('click', sendMessage);
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
    
    // Conversation selection
    document.querySelectorAll('.conversation').forEach(conv => {
        conv.addEventListener('click', function() {
            document.querySelectorAll('.conversation').forEach(c => {
                c.classList.remove('active');
            });
            this.classList.add('active');
            
            // In a real app, you would load the conversation messages
            const partnerName = this.querySelector('h4').textContent;
            document.querySelector('.chat-partner h4').textContent = partnerName;
        });
    });
    
    // Toggle switch functionality
    document.querySelectorAll('.toggle input').forEach(toggle => {
        toggle.addEventListener('change', function() {
            const setting = this.closest('.notification-item')?.querySelector('h4')?.textContent || 'Unknown';
            console.log(`${setting} ${this.checked ? 'enabled' : 'disabled'}`);
        });
    });
    
    // Close mobile menu when clicking on nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                closeMobileMenu();
            }
        });
    });
    
    // Close dropdown when clicking on dropdown items
    document.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', function() {
            const dropdown = document.getElementById('dropdownMenu');
            if (dropdown) {
                dropdown.classList.remove('show');
            }
        });
    });
    
    // Initialize filters
    initializeEditorFilters();
    initializeProjectFilters();
    
    // Initialize business logic
    enhanceEditorCards();
    enhanceChatSystem();
    
    // Check if user is already logged in (for demo purposes)
    const savedRole = localStorage.getItem('userRole');
    if (savedRole) {
        document.getElementById('login-page').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');
        updateUIForRole(savedRole);
        showPage('dashboard');
    }
    
    // Demo business logic on load
    console.log('=== EDITRON BUSINESS LOGIC INITIALIZED ===');
    console.log('✓ Commission System: Ready');
    console.log('✓ Privacy System: Ready'); 
    console.log('✓ Reputation System: Ready');
    console.log('✓ Project Tracking: Ready');
});
