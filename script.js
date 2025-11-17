// ==================== EDITRON SCRIPT (UPDATED) ====================
// Safe utility helpers + full app logic (non-disruptive changes)

// ==================== SAFETY HELPERS ====================
// Safe DOM helper: get element by id (returns null-safe)
function $id(id) {
  return document.getElementById(id) || null;
}

// Safe DOM helper: toggle/add/remove class only if element exists
function safeToggleClass(idOrEl, action, className) {
  let el = null;
  if (!idOrEl) return;
  if (typeof idOrEl === 'string') el = $id(idOrEl);
  else if (idOrEl instanceof Element) el = idOrEl;

  if (!el) return;
  if (action === 'add') el.classList.add(className);
  else if (action === 'remove') el.classList.remove(className);
  else if (action === 'toggle') el.classList.toggle(className);
}

// Safe text setter
function safeSetText(idOrEl, text) {
  const el = (typeof idOrEl === 'string') ? $id(idOrEl) : idOrEl;
  if (!el) return;
  el.textContent = text;
}

// Show toast (already implemented elsewhere but keep safe fallback)
function showToast(message, type='info', timeout=3500) {
  const container = $id('toast-container');
  if (!container) {
    // fallback to alert if container is missing
    try { alert(message); } catch (e) { console.log(message); }
    return;
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(()=> {
    toast.style.transition = 'opacity 300ms, transform 300ms';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    setTimeout(()=> toast.remove(), 350);
  }, timeout);
}

// ===== Message sanitization helper (must exist) =====
function redactSensitiveNumbers(text) {
  if (text === null || text === undefined) return text;
  text = String(text);

  // 1) redact typical phone-like patterns (international and local, with separators)
  text = text.replace(/\b(?:\+?\d{1,3}[\s\-\.]?)?(?:\d[\d\-\s\.\(\)]{6,}\d)\b/g, match => '•'.repeat(Math.min(Math.max(4, match.length), 12)));

  // 2) redact long digit sequences (>=3 digits)
  text = text.replace(/\d{3,}/g, match => '•'.repeat(match.length));

  // 3) redact spelled-out numbers (one two three ... million)
  const wordNumbers = ['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety','hundred','thousand','lakh','million','billion'];
  const wordRegex = new RegExp('\\b(' + wordNumbers.join('|') + ')([\\s\\-]+(' + wordNumbers.join('|') + '))*\\b','gi');
  text = text.replace(wordRegex, match => match.split(/\s+/).map(w => '•'.repeat(Math.min(Math.max(1, w.length), 3))).join(' '));

  return text;
}

// ==================== CORE APPLICATION FUNCTIONS ====================

// Navigation functions
function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Show selected page (guarded)
    const pageEl = $id(pageId);
    if (pageEl) pageEl.classList.add('active');
    
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
}

function showRoleSelection() {
    safeToggleClass('login-page', 'add', 'hidden');
    safeToggleClass('role-selection', 'remove', 'hidden');
}

function backToLogin() {
    safeToggleClass('role-selection', 'add', 'hidden');
    safeToggleClass('login-page', 'remove', 'hidden');
}

function selectRole(role) {
    // Save the role selection
    localStorage.setItem('userRole', role);
    localStorage.setItem('userLoggedIn', 'true');
    
    // Show main app
    safeToggleClass('role-selection', 'add', 'hidden');
    safeToggleClass('main-app', 'remove', 'hidden');
    
    // Update UI based on role
    updateUIForRole(role);
    
    // Show dashboard by default
    showPage('dashboard');
}

function updateUIForRole(role) {
    const quickActions = $id('quick-actions');
    
    if (!quickActions) return;
    
    if (role === 'client') {
        // Client view
        quickActions.innerHTML = `
            <button class="action-btn" onclick="showPage('discover'); switchDiscoveryTab('editors')">
                <i class="fas fa-users"></i>
                <span>Find Editors</span>
            </button>
            <button class="action-btn" onclick="showCreateProject()">
                <i class="fas fa-plus"></i>
                <span>Post Project</span>
            </button>
        `;
    } else if (role === 'editor') {
        // Editor view
        quickActions.innerHTML = `
            <button class="action-btn" onclick="showPage('discover'); switchDiscoveryTab('projects')">
                <i class="fas fa-search"></i>
                <span>Find Projects</span>
            </button>
            <button class="action-btn" onclick="showPage('profile')">
                <i class="fas fa-portfolio"></i>
                <span>My Portfolio</span>
            </button>
        `;
    }
}

function showBusinessDemo() {
    // kept for backward compatibility; can be removed later
    alert('Business Logic Demo:\n\n✓ Commission System: 10% (5% for loyal editors)\n✓ Privacy System: Contact info hidden until payment\n✓ Reputation System: Points & badges for editors\n✓ Project Tracking: Auto-generated trackers\n\nCheck console for detailed examples!');
    
    console.log('=== BUSINESS LOGIC DEMO ===');
    const commission = CommissionSystem.calculateCommission('editor1', 1000);
    console.log('Commission for $1000 project:', commission);
    
    const editor = UserManager.getEditor('editor1');
    const reputation = ReputationSystem.calculateReputation(editor);
    console.log('Editor reputation:', reputation);
}

function login() {
    const emailEl = $id('email');
    const passwordEl = $id('password');
    const email = emailEl ? emailEl.value : '';
    const password = passwordEl ? passwordEl.value : '';
    
    if (!email || !password) {
        showToast ? showToast('Please enter both email and password','error') : alert('Please enter both email and password');
        return;
    }
    
    // Demo-only: set role and show main app
    const demo = JSON.parse(localStorage.getItem('demo_user') || 'null');
    const roleToSet = demo && demo.role ? demo.role : 'client';
    localStorage.setItem('userRole', roleToSet);
    localStorage.setItem('userLoggedIn', 'true');
    
    safeToggleClass('login-page', 'add', 'hidden');
    safeToggleClass('main-app', 'remove', 'hidden');

    updateUIForRole(roleToSet);
    showPage('dashboard');
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        safeToggleClass('main-app', 'add', 'hidden');
        safeToggleClass('login-page', 'remove', 'hidden');
        
        // Clear form fields safely
        try { if ($id('email')) $id('email').value = ''; } catch(e){}
        try { if ($id('password')) $id('password').value = ''; } catch(e){}
        
        // Clear stored data
        localStorage.removeItem('userRole');
        localStorage.removeItem('userLoggedIn');
    }
}

// Toggle dropdown menu
function toggleDropdown() {
    const dropdown = $id('dropdownMenu');
    if (!dropdown) return;
    dropdown.classList.toggle('show');
}

// Toggle mobile menu
function toggleMobileMenu() {
    const nav = document.querySelector('.main-nav');
    const toggle = document.querySelector('.mobile-menu-toggle');
    const body = document.body;
    if (!nav || !toggle) return;
    
    nav.classList.toggle('active');
    toggle.classList.toggle('active');
    body.classList.toggle('menu-open');
    
    // Close dropdown if open
    const dropdown = $id('dropdownMenu');
    if (dropdown) {
        dropdown.classList.remove('show');
    }
}

function closeMobileMenu() {
    const nav = document.querySelector('.main-nav');
    const toggle = document.querySelector('.mobile-menu-toggle');
    const body = document.body;
    if (nav) nav.classList.remove('active');
    if (toggle) toggle.classList.remove('active');
    if (body) body.classList.remove('menu-open');
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
        if (nav && nav.classList.contains('active') && !nav.contains(event.target) && (!toggle || !toggle.contains(event.target))) {
            closeMobileMenu();
        }
    }
}

// Discovery tab switching
function switchDiscoveryTab(tab) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    // Try to activate button that contains the tab name
    const btn = Array.from(document.querySelectorAll('.tab-btn')).find(b => b.getAttribute('onclick') && b.getAttribute('onclick').includes(tab));
    if (btn) btn.classList.add('active');
    
    // Show corresponding tab content
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    const contentEl = $id(`${tab}-tab`);
    if (contentEl) contentEl.classList.add('active');
}

// Project creation modal
function showCreateProject() {
    safeToggleClass('create-project-modal', 'remove', 'hidden');
}

function closeCreateProject() {
    safeToggleClass('create-project-modal', 'add', 'hidden');
}

// Signup modal helpers (front-end only)
function openSignup() {
  const modal = $id('signup-modal');
  if (!modal) return;
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
}

function closeSignup() {
  const modal = $id('signup-modal');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
}

function signupSubmit() {
  const name = ($id('signup-name') || {}).value ? ($id('signup-name').value.trim()) : '';
  const email = ($id('signup-email') || {}).value ? ($id('signup-email').value.trim()) : '';
  const pwd = ($id('signup-password') || {}).value || '';
  const roleNode = document.querySelector('input[name="signup-role"]:checked');
  const role = roleNode ? roleNode.value : 'client';

  if (!name || !email || !pwd) {
    showToast ? showToast('Please fill all fields', 'error') : alert('Please fill all fields');
    return;
  }

  // Save demo user client-side (replace with backend later)
  try { localStorage.setItem('demo_user', JSON.stringify({ name, email, role })); } catch (e) { console.warn('LocalStorage write failed', e); }

  localStorage.setItem('userRole', role);
  localStorage.setItem('userLoggedIn', 'true');
  safeToggleClass('role-selection', 'add', 'hidden');
  safeToggleClass('main-app', 'remove', 'hidden');
  updateUIForRole(role);
  showPage('dashboard');

  closeSignup();
  if (typeof showToast === 'function') showToast('Account created (demo). You are signed in.', 'success');
}

// Profile editing
let isEditMode = false;

function toggleEditMode() {
    isEditMode = !isEditMode;
    
    const profileName = $id('profile-name');
    const profileAbout = $id('profile-about');
    const profileSkills = $id('profile-skills');
    const editButton = document.querySelector('.btn-outline');
    
    if (isEditMode) {
        if (profileName) profileName.contentEditable = true;
        if (profileAbout) profileAbout.contentEditable = true;
        if (profileSkills) profileSkills.contentEditable = true;
        
        if (profileName) profileName.style.border = '1px dashed #ccc';
        if (profileAbout) profileAbout.style.border = '1px dashed #ccc';
        if (profileSkills) profileSkills.style.border = '1px dashed #ccc';
        
        if (editButton) {
          editButton.innerHTML = '<i class="fas fa-save"></i> Save Profile';
          editButton.classList.remove('btn-outline');
          editButton.classList.add('btn-primary');
        }
        
        showToast ? showToast('Profile is now in edit mode. Click Save when done.','info') : null;
    } else {
        if (profileName) profileName.contentEditable = false;
        if (profileAbout) profileAbout.contentEditable = false;
        if (profileSkills) profileSkills.contentEditable = false;
        
        if (profileName) profileName.style.border = 'none';
        if (profileAbout) profileAbout.style.border = 'none';
        if (profileSkills) profileSkills.style.border = 'none';
        
        if (editButton) {
          editButton.innerHTML = '<i class="fas fa-edit"></i> Edit Profile';
          editButton.classList.remove('btn-primary');
          editButton.classList.add('btn-outline');
        }
        
        // Save to localStorage
        const profileData = {
            name: profileName ? profileName.textContent : '',
            about: profileAbout ? profileAbout.textContent : '',
            skills: profileSkills ? profileSkills.innerHTML : ''
        };
        try { localStorage.setItem('profileData', JSON.stringify(profileData)); } catch(e){console.warn(e);}        
        showToast ? showToast('Profile saved successfully!','success') : alert('Profile saved successfully!');
    }
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
                const profileAvatar = $id('profile-avatar');
                const userAvatar = document.querySelector('.user-avatar img');
                
                if (profileAvatar) profileAvatar.src = newImageUrl;
                if (userAvatar) userAvatar.src = newImageUrl;
                
                try { localStorage.setItem('profilePicture', newImageUrl); } catch(e){console.warn(e);}                
                showToast ? showToast('Profile picture updated successfully!','success') : alert('Profile picture updated successfully!');
            };
            reader.readAsDataURL(file);
        }
    };
    
    fileInput.click();
}

// Initialize filters
function initializeFilters() {
    const skillFilter = $id('editor-skill');
    const ratingFilter = $id('editor-rating');
    const categoryFilter = $id('project-category');
    const budgetFilter = $id('project-budget');
    
    if (skillFilter && ratingFilter) {
        skillFilter.addEventListener('change', filterEditors);
        ratingFilter.addEventListener('change', filterEditors);
    }
    
    if (categoryFilter && budgetFilter) {
        categoryFilter.addEventListener('change', filterProjects);
        budgetFilter.addEventListener('change', filterProjects);
    }
}

function filterEditors() {
    const skillFilterEl = $id('editor-skill');
    const ratingFilterEl = $id('editor-rating');
    const skillFilter = skillFilterEl ? skillFilterEl.value : '';
    const ratingFilter = ratingFilterEl ? ratingFilterEl.value : '';
    const editorCards = document.querySelectorAll('.editor-card');
    
    editorCards.forEach(card => {
        let showCard = true;
        
        // Filter by skill
        if (skillFilter && skillFilter !== 'All Skills') {
            const skills = card.getAttribute('data-skills') || '';
            if (!skills.includes(skillFilter)) showCard = false;
        }
        
        // Filter by rating
        if (showCard && ratingFilter && ratingFilter !== 'Any Rating') {
            const rating = parseFloat(card.getAttribute('data-rating') || '0');
            if (ratingFilter === '4+ Stars' && rating < 4) showCard = false;
            else if (ratingFilter === '4.5+ Stars' && rating < 4.5) showCard = false;
        }
        
        if (showCard) card.classList.remove('hidden'); else card.classList.add('hidden');
    });
}

function filterProjects() {
    const categoryFilterEl = $id('project-category');
    const budgetFilterEl = $id('project-budget');
    const categoryFilter = categoryFilterEl ? categoryFilterEl.value : '';
    const budgetFilter = budgetFilterEl ? budgetFilterEl.value : '';
    const projectListings = document.querySelectorAll('.project-listing');
    
    projectListings.forEach(project => {
        let showProject = true;
        
        // Filter by category
        if (categoryFilter && categoryFilter !== 'All Categories') {
            const category = project.getAttribute('data-category') || '';
            if (category !== categoryFilter) showProject = false;
        }
        
        // Filter by budget
        if (showProject && budgetFilter && budgetFilter !== 'Any Budget') {
            const budget = parseInt(project.getAttribute('data-budget') || '0');
            if (budgetFilter === 'Under $500' && budget >= 500) showProject = false;
            else if (budgetFilter === '$500 - $1000' && (budget < 500 || budget > 1000)) showProject = false;
            else if (budgetFilter === '$1000+' && budget <= 1000) showProject = false;
        }
        
        if (showProject) project.classList.remove('hidden'); else project.classList.add('hidden');
    });
}

// ==================== PAYMENT GATEWAY FUNCTIONALITY ====================

let currentPaymentMethod = '';
let currentPaymentAmount = 0;

// Show payment modal
function showPaymentModal(amount, projectId) {
    currentPaymentAmount = amount;
    
    const paymentAmountEl = $id('payment-amount');
    const platformFeeEl = $id('platform-fee');
    const totalAmountEl = $id('total-amount');
    if (paymentAmountEl) paymentAmountEl.textContent = `$${amount.toFixed(2)}`;
    const platformFee = amount * 0.05;
    if (platformFeeEl) platformFeeEl.textContent = `$${platformFee.toFixed(2)}`;
    if (totalAmountEl) totalAmountEl.textContent = `$${(amount + platformFee).toFixed(2)}`;
    
    const paymentModal = $id('payment-modal');
    if (paymentModal) paymentModal.setAttribute('data-project-id', projectId);
    safeToggleClass('payment-modal', 'remove', 'hidden');
    if (paymentModal) paymentModal.classList.remove('hidden');
}

// Close payment modal
function closePaymentModal() {
    safeToggleClass('payment-modal', 'add', 'hidden');
    const pm = $id('payment-modal'); if (pm) pm.classList.add('hidden');
    resetPaymentForm();
}

// Select payment method
function selectPaymentMethod(method) {
    currentPaymentMethod = method;
    
    document.querySelectorAll('.payment-method').forEach(el => el.classList.remove('selected'));
    // event.currentTarget may not be defined when called programmatically, so find the element
    const el = Array.from(document.querySelectorAll('.payment-method')).find(e => e.getAttribute('onclick') && e.getAttribute('onclick').includes(method));
    if (el) el.classList.add('selected');
    
    const cardPayment = $id('card-payment'); if (cardPayment) cardPayment.classList.add('hidden');
    const otherPayment = $id('other-payment'); if (otherPayment) otherPayment.classList.add('hidden');
    
    if (method === 'card') { if (cardPayment) cardPayment.classList.remove('hidden'); }
    else { if (otherPayment) otherPayment.classList.remove('hidden'); }
}

// Format card number
function formatCardNumber(input) {
    if (!input) return;
    let value = input.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    let matches = value.match(/\d{4,16}/g);
    let match = matches && matches[0] || '';
    let parts = [];
    
    for (let i = 0; i < match.length; i += 4) {
        parts.push(match.substring(i, i + 4));
    }
    
    if (parts.length) input.value = parts.join(' ');
    else input.value = value;
}

// Format expiry date
function formatExpiryDate(input) {
    if (!input) return;
    let value = input.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (value.length >= 2) input.value = value.substring(0, 2) + '/' + value.substring(2, 4);
}

// Process payment
function processPayment() {
    if (!currentPaymentMethod) { showToast ? showToast('Please select a payment method','error') : alert('Please select a payment method'); return; }
    const projectModal = $id('payment-modal');
    const projectId = projectModal ? projectModal.getAttribute('data-project-id') : null;
    const totalAmount = currentPaymentAmount + (currentPaymentAmount * 0.05);
    
    const payButton = document.querySelector('.payment-actions .btn-primary');
    if (!payButton) { showToast('Payment button missing','error'); return; }
    const originalText = payButton.textContent;
    payButton.textContent = 'Processing...';
    payButton.disabled = true;
    
    setTimeout(() => {
        payButton.textContent = originalText;
        payButton.disabled = false;
        closePaymentModal();
        
        // Create project tracker if projectId
        if (projectId) ProjectTracker.createTracker(projectId);
        
        showToast ? showToast(`Payment of $${totalAmount.toFixed(2)} completed successfully!`,`success`) : alert(`Payment of $${totalAmount.toFixed(2)} completed successfully!`);
    }, 2000);
}

// Reset payment form
function resetPaymentForm() {
    currentPaymentMethod = '';
    document.querySelectorAll('.payment-method').forEach(el => el.classList.remove('selected'));
    document.querySelectorAll('.payment-form input').forEach(input => input.value = '');
}

// ==================== TIMELINE FUNCTIONALITY ====================
// timeline related functions kept but not auto-initialized to avoid errors if removed from DOM

function initializeTimeline() {
    const tp = $id('timeline'); if (!tp) return;
    loadTimelineProjects();
    setupTimelineFilters();
}

function loadTimelineProjects() {
    const timelineProjects = $id('timeline-projects');
    if (!timelineProjects) return;
    const projects = getTimelineProjects();
    timelineProjects.innerHTML = projects.map(project => `
        <div class="timeline-project" data-status="${project.status}">
            <div class="timeline-project-header">
                <div class="timeline-project-info">
                    <h3>${project.title}</h3>
                    <div class="timeline-project-meta">
                        <span class="budget">$${project.budget}</span>
                        <span class="deadline">Due: ${project.deadline}</span>
                        <span class="client">Client: ${project.client}</span>
                    </div>
                </div>
                <span class="timeline-project-status status-${project.status}">${project.status.charAt(0).toUpperCase() + project.status.slice(1)}</span>
            </div>
            <div class="timeline-content">
                <div class="timeline-progress">
                    <div class="progress-bar-container">
                        <div class="progress-bar" style="width: ${project.progress}%"></div>
                    </div>
                    <div class="progress-info">
                        <span>Project Progress</span>
                        <span>${project.progress}%</span>
                    </div>
                </div>
                <div class="timeline-milestones">
                    ${project.milestones.map(milestone => `
                        <div class="milestone ${milestone.completed ? 'completed' : ''}">
                            <div class="milestone-icon">
                                <i class="fas ${milestone.completed ? 'fa-check' : 'fa-circle'}"></i>
                            </div>
                            <div class="milestone-content">
                                <h4>${milestone.title}</h4>
                                <p>${milestone.description}</p>
                                <span class="milestone-date">${milestone.date}</span>
                            </div>
                            ${!milestone.completed ? `
                                <button class="btn btn-sm btn-outline" onclick="completeMilestone('${project.id}', '${milestone.id}')">
                                    Mark Complete
                                </button>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `).join('');
}

function getTimelineProjects() { /* unchanged sample data */
    return [
        { id: 'project1', title: 'Corporate Brand Video', budget: 800, deadline: 'Dec 15, 2024', client: 'Tech Innovations Inc.', status: 'active', progress: 65, milestones: [ { id: 'm1', title: 'Initial Consultation', description: 'Discuss project requirements and expectations', date: 'Nov 20, 2024', completed: true }, { id: 'm2', title: 'First Draft', description: 'Deliver initial video draft for review', date: 'Dec 5, 2024', completed: true }, { id: 'm3', title: 'Client Feedback', description: 'Incorporate client feedback and revisions', date: 'Dec 10, 2024', completed: false }, { id: 'm4', title: 'Final Delivery', description: 'Deliver final video files', date: 'Dec 15, 2024', completed: false } ] },
        { id: 'project2', title: 'Social Media Ads', budget: 450, deadline: 'Dec 20, 2024', client: 'Fashion Brand Co.', status: 'pending', progress: 0, milestones: [ { id: 'm1', title: 'Project Kickoff', description: 'Start project and gather assets', date: 'Dec 10, 2024', completed: false } ] }
    ];
}

function setupTimelineFilters() {
    const statusFilter = $id('timeline-status');
    const searchFilter = $id('timeline-search');
    if (statusFilter && searchFilter) {
        statusFilter.addEventListener('change', filterTimelineProjects);
        searchFilter.addEventListener('input', filterTimelineProjects);
    }
}

function filterTimelineProjects() {
    const statusFilterEl = $id('timeline-status');
    const searchFilterEl = $id('timeline-search');
    const statusFilter = statusFilterEl ? statusFilterEl.value : 'all';
    const searchFilter = searchFilterEl ? searchFilterEl.value.toLowerCase() : '';
    const projects = document.querySelectorAll('.timeline-project');
    projects.forEach(project => {
        const status = project.getAttribute('data-status');
        const title = (project.querySelector('h3') && project.querySelector('h3').textContent) ? project.querySelector('h3').textContent.toLowerCase() : '';
        const client = (project.querySelector('.client') && project.querySelector('.client').textContent) ? project.querySelector('.client').textContent.toLowerCase() : '';
        let showProject = true;
        if (statusFilter !== 'all' && status !== statusFilter) showProject = false;
        if (showProject && searchFilter && !title.includes(searchFilter) && !client.includes(searchFilter)) showProject = false;
        project.style.display = showProject ? 'block' : 'none';
    });
}

function completeMilestone(projectId, milestoneId) {
    const projects = document.querySelectorAll('.timeline-project');
    projects.forEach(project => {
        const titleEl = project.querySelector('h3');
        if (titleEl && titleEl.textContent && titleEl.textContent.includes(projectId)) {
            const milestones = project.querySelectorAll('.milestone');
            milestones.forEach(milestone => {
                const h4 = milestone.querySelector('h4');
                if (h4 && h4.textContent && h4.textContent.includes(milestoneId)) {
                    milestone.classList.add('completed');
                    const icon = milestone.querySelector('.milestone-icon i'); if (icon) icon.className = 'fas fa-check';
                    const button = milestone.querySelector('button'); if (button) button.remove();
                    updateProjectProgress(project);
                }
            });
        }
    });
}

function updateProjectProgress(projectElement) {
    const milestones = projectElement.querySelectorAll('.milestone');
    if (!milestones || milestones.length === 0) return;
    const completed = projectElement.querySelectorAll('.milestone.completed');
    const progress = Math.round((completed.length / milestones.length) * 100);
    const progressBar = projectElement.querySelector('.progress-bar');
    const progressText = projectElement.querySelector('.progress-info span:last-child');
    if (progressBar) progressBar.style.width = `${progress}%`;
    if (progressText) progressText.textContent = `${progress}%`;
}

// ==================== PROJECT DETAILS ====================
function showProjectDetails(projectId) {
    const projects = { project1: { title: 'Corporate Brand Video', description: 'Editing a 2-minute brand video for tech startup', budget: 800, deadline: 'Dec 15, 2024', status: 'Active', client: 'Tech Innovations Inc.', progress: 65 }, project2: { title: 'Social Media Ads', description: 'Create 3 short ads for Instagram and TikTok', budget: 450, deadline: 'Dec 20, 2024', status: 'Active', client: 'Fashion Brand Co.', progress: 30 } };
    const project = projects[projectId]; if (!project) return;
    const content = $id('project-details-content'); if (!content) return;
    content.innerHTML = `
        <div class="project-details-info">
            <h3>${project.title}</h3>
            <p>${project.description}</p>
            <div class="project-meta">
                <div class="meta-item"><strong>Budget:</strong> $${project.budget}</div>
                <div class="meta-item"><strong>Deadline:</strong> ${project.deadline}</div>
                <div class="meta-item"><strong>Status:</strong> <span class="project-status active">${project.status}</span></div>
                <div class="meta-item"><strong>Client:</strong> ${project.client}</div>
                <div class="meta-item"><strong>Progress:</strong> ${project.progress}%</div>
            </div>
            <div class="project-actions" style="margin-top: 20px;">
                <button class="btn btn-primary" onclick="showPage('messages')">Message Client</button>
                <button class="btn btn-outline" onclick="closeProjectDetails()">Close</button>
            </div>
        </div>
    `;
    const modal = $id('project-details-modal'); if (modal) modal.classList.remove('hidden');
}

function closeProjectDetails() { safeToggleClass('project-details-modal','add','hidden'); const m=$id('project-details-modal'); if (m) m.classList.add('hidden'); }

// ==================== SETTINGS FUNCTIONALITY ====================
function saveAccountSettings() {
    const name = $id('settings-name') ? $id('settings-name').value : '';
    const email = $id('settings-email') ? $id('settings-email').value : '';
    const bio = $id('settings-bio') ? $id('settings-bio').value : '';
    const profileName = $id('profile-name'); const profileAbout = $id('profile-about');
    if (profileName) profileName.textContent = name;
    if (profileAbout) profileAbout.textContent = bio;
    const settings = { name, email, bio };
    try { localStorage.setItem('accountSettings', JSON.stringify(settings)); } catch(e){console.warn(e);}    
    showToast ? showToast('Account settings saved successfully!','success') : alert('Account settings saved successfully!');
}

function showChangePassword() { safeToggleClass('change-password-modal','remove','hidden'); const m=$id('change-password-modal'); if (m) m.classList.remove('hidden'); }
function closeChangePassword() { safeToggleClass('change-password-modal','add','hidden'); const m=$id('change-password-modal'); if (m) m.classList.add('hidden'); }

// ==================== BUSINESS LOGIC LAYER ====================
// (Remains unchanged)
class CommissionSystem { static calculateCommission(editorId, amount) { const editor = UserManager.getEditor(editorId); const loyaltyLevel = this.getLoyaltyLevel(editor); let commissionRate = 0.10; if (loyaltyLevel === 'Silver') commissionRate = 0.05; const commission = amount * commissionRate; const editorEarnings = amount - commission; return { commissionRate, commission, editorEarnings, loyaltyLevel }; } static getLoyaltyLevel(editor) { const successfulDeals = editor.completedDeals || 0; const lastActivity = editor.lastActivity ? new Date(editor.lastActivity) : new Date(); const daysSinceActivity = (new Date() - lastActivity) / (1000 * 60 * 60 * 24); if (daysSinceActivity > 60 && successfulDeals < 5) return 'Bronze'; return successfulDeals >= 5 ? 'Silver' : 'Bronze'; } static updateEditorActivity(editorId) { const editor = UserManager.getEditor(editorId); editor.lastActivity = new Date().toISOString(); UserManager.updateEditor(editor); } }

class CommunicationSystem { static filterSensitiveMessages(messages, hasAdvancePayment) { if (hasAdvancePayment) return messages; return messages.map(message => ({ ...message, content: this.sanitizeContent(message.content) })); } static sanitizeContent(content) { const phoneRegex = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g; const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g; const urlRegex = /https?:\/\/[^\s]+/g; return String(content).replace(phoneRegex, '***-***-****').replace(emailRegex, '***@***.***').replace(urlRegex, '***'); } static processAdvancePayment(dealId, amount) { const deal = DealManager.getDeal(dealId); const totalAmount = deal.budget; const requiredAdvance = totalAmount * 0.20; if (amount >= requiredAdvance) { deal.advancePaid = true; deal.advanceAmount = amount; deal.adminFee = amount * 0.05; DealManager.updateDeal(deal); return { success: true, adminFee: deal.adminFee }; } return { success: false, requiredAmount: requiredAdvance }; } static cancelDeal(dealId) { const deal = DealManager.getDeal(dealId); if (deal.advancePaid && !deal.workStarted) { const refundAmount = deal.advanceAmount - deal.adminFee; deal.status = 'cancelled'; deal.refundAmount = refundAmount; DealManager.updateDeal(deal); return { refunded: true, amount: refundAmount, adminFee: deal.adminFee }; } return { refunded: false }; } }

class ReputationSystem { static calculateReputation(editor) { const completedDeals = editor.completedDeals || 0; const cancelledDeals = editor.cancelledDeals || 0; const lateDeliveries = editor.lateDeliveries || 0; let points = (completedDeals * 10) - (cancelledDeals * 5) - (lateDeliveries * 5); points = Math.max(0, points); return { points, badge: this.getBadge(points), level: this.getLevel(points) }; } static getBadge(points) { if (points >= 101) return '💎 Gold'; if (points >= 51) return '🌟 Silver'; return '⭐ Bronze'; } static getLevel(points) { if (points >= 101) return 'Gold'; if (points >= 51) return 'Silver'; return 'Bronze'; } static updateReputation(editorId, action) { const editor = UserManager.getEditor(editorId); switch(action) { case 'deal_completed': editor.completedDeals = (editor.completedDeals || 0) + 1; break; case 'deal_cancelled': editor.cancelledDeals = (editor.cancelledDeals || 0) + 1; break; case 'late_delivery': editor.lateDeliveries = (editor.lateDeliveries || 0) + 1; break; } UserManager.updateEditor(editor); return this.calculateReputation(editor); } }

class ProjectTracker { static createTracker(dealId) { const tracker = { dealId, startDate: new Date().toISOString(), status: 'Not Started', milestones: [], progress: 0, lastUpdated: new Date().toISOString() }; TrackerManager.saveTracker(tracker); return tracker; } static updateProgress(dealId, status, progress) { const tracker = TrackerManager.getTracker(dealId); if (tracker) { tracker.status = status; tracker.progress = progress; tracker.lastUpdated = new Date().toISOString(); TrackerManager.saveTracker(tracker); this.updateProgressUI(dealId); } } static addMilestone(dealId, milestone) { const tracker = TrackerManager.getTracker(dealId); if (tracker) { milestone.id = Date.now(); milestone.date = new Date().toISOString(); milestone.completed = false; tracker.milestones.push(milestone); TrackerManager.saveTracker(tracker); } } static completeMilestone(dealId, milestoneId) { const tracker = TrackerManager.getTracker(dealId); if (tracker) { const milestone = tracker.milestones.find(m => m.id === milestoneId); if (milestone) { milestone.completed = true; milestone.completedDate = new Date().toISOString(); TrackerManager.saveTracker(tracker); } } } static updateProgressUI(dealId) { const progressElement = document.querySelector(`[data-deal-id="${dealId}"] .progress-bar`); if (progressElement) { const tracker = TrackerManager.getTracker(dealId); progressElement.style.width = `${tracker.progress}%`; progressElement.textContent = `${tracker.progress}%`; } } }

// ==================== DATA MANAGEMENT ====================
// (UserManager, DealManager, TrackerManager unchanged from original but safe DOM use applied elsewhere)

class UserManager { static getEditor(editorId) { const editors = this.getEditors(); return editors.find(editor => editor.id === editorId) || this.createDefaultEditor(editorId); } static updateEditor(editorData) { const editors = this.getEditors(); const index = editors.findIndex(editor => editor.id === editorData.id); if (index !== -1) editors[index] = { ...editors[index], ...editorData }; else editors.push(editorData); localStorage.setItem('editors', JSON.stringify(editors)); } static getEditors() { const stored = localStorage.getItem('editors'); if (stored) return JSON.parse(stored); const sampleEditors = [ { id: 'editor1', name: 'Michael Chen', completedDeals: 8, cancelledDeals: 1, lateDeliveries: 0, lastActivity: new Date().toISOString() }, { id: 'editor2', name: 'Sarah Williams', completedDeals: 12, cancelledDeals: 0, lateDeliveries: 1, lastActivity: new Date().toISOString() }, { id: 'editor3', name: 'Emma Thompson', completedDeals: 3, cancelledDeals: 0, lateDeliveries: 0, lastActivity: new Date().toISOString() } ]; localStorage.setItem('editors', JSON.stringify(sampleEditors)); return sampleEditors; } static createDefaultEditor(editorId) { return { id: editorId, name: 'Unknown Editor', completedDeals: 0, cancelledDeals: 0, lateDeliveries: 0, lastActivity: new Date().toISOString() }; } }

class DealManager { static getDeal(dealId) { const deals = this.getDeals(); return deals.find(deal => deal.id === dealId) || this.createDefaultDeal(dealId); } static updateDeal(dealData) { const deals = this.getDeals(); const index = deals.findIndex(deal => deal.id === dealData.id); if (index !== -1) deals[index] = { ...deals[index], ...dealData }; else deals.push(dealData); localStorage.setItem('deals', JSON.stringify(deals)); } static getDeals() { const stored = localStorage.getItem('deals'); return stored ? JSON.parse(stored) : []; } static createDefaultDeal(dealId) { return { id: dealId, budget: 0, advancePaid: false, advanceAmount: 0, adminFee: 0, status: 'pending', workStarted: false }; } }

class TrackerManager { static saveTracker(tracker) { const trackers = this.getTrackers(); const index = trackers.findIndex(t => t.dealId === tracker.dealId); if (index !== -1) trackers[index] = tracker; else trackers.push(tracker); localStorage.setItem('projectTrackers', JSON.stringify(trackers)); } static getTracker(dealId) { const trackers = this.getTrackers(); return trackers.find(tracker => tracker.dealId === dealId); } static getTrackers() { const stored = localStorage.getItem('projectTrackers'); return stored ? JSON.parse(stored) : []; } }

// ==================== EVENT LISTENERS ====================

document.addEventListener('DOMContentLoaded', function() {
    // Project form submission
    const projectForm = $id('project-form');
    if (projectForm) {
        projectForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            const projectData = Object.fromEntries(formData);
            const projectId = 'project_' + Date.now();
            ProjectTracker.createTracker(projectId);
            showToast ? showToast('Project created successfully! A project tracker has been generated.','success') : null;
            closeCreateProject();
            this.reset();
        });
    }
    
    // Password form submission
    const passwordForm = $id('password-form');
    if (passwordForm) {
        passwordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            showToast ? showToast('Password changed successfully!','success') : alert('Password changed successfully!');
            closeChangePassword();
            this.reset();
        });
    }
    
    // Chat functionality
    const chatInput = document.querySelector('.chat-input input');
    const sendButton = document.querySelector('.btn-send');
    if (chatInput && sendButton) {
        sendButton.addEventListener('click', sendMessage);
        chatInput.addEventListener('keypress', function(e) { if (e.key === 'Enter') sendMessage(); });
    }
    
    // Conversation selection
    document.querySelectorAll('.conversation').forEach(conv => conv.addEventListener('click', function() {
        document.querySelectorAll('.conversation').forEach(c => c.classList.remove('active'));
        this.classList.add('active');
        const partnerName = this.querySelector('h4') ? this.querySelector('h4').textContent : '';
        const partnerHeader = document.querySelector('.chat-partner h4'); if (partnerHeader) partnerHeader.textContent = partnerName;
    }));
    
    // Toggle switch functionality
    document.querySelectorAll('.toggle input').forEach(toggle => toggle.addEventListener('change', function() { const setting = this.closest('.notification-item') ? this.closest('.notification-item').querySelector('h4')?.textContent || 'Unknown' : 'Unknown'; console.log(`${setting} ${this.checked ? 'enabled' : 'disabled'}`); }));
    
    // Close mobile menu when clicking on nav items
    document.querySelectorAll('.nav-item').forEach(item => item.addEventListener('click', function() { if (window.innerWidth <= 768) closeMobileMenu(); }));
    
    // Close dropdown when clicking on dropdown items
    document.querySelectorAll('.dropdown-item').forEach(item => item.addEventListener('click', function() { const dropdown = $id('dropdownMenu'); if (dropdown) dropdown.classList.remove('show'); }));
    
    // Initialize filters
    initializeFilters();
    
    // Load saved data
    loadSavedData();

    // Sanitize any existing messages already present in the DOM
    (function sanitizeExistingMessages(){
      const chatMessages = document.querySelectorAll('.chat-messages .message');
      chatMessages.forEach(msgEl => {
        const p = msgEl.querySelector('p');
        if (p && p.textContent) {
          p.textContent = redactSensitiveNumbers(p.textContent);
          if (p.textContent.indexOf('•') !== -1) msgEl.classList.add('message-filtered');
        }
      });
    })();
    
    // Check if user is already logged in
    const savedRole = localStorage.getItem('userRole');
    const isLoggedIn = localStorage.getItem('userLoggedIn');
    if (savedRole && isLoggedIn) {
        safeToggleClass('login-page','add','hidden');
        safeToggleClass('main-app','remove','hidden');
        updateUIForRole(savedRole);
        showPage('dashboard');
    }
    
    // Demo business logic on load
    console.log('=== EDITRON BUSINESS LOGIC INITIALIZED ===');
    console.log('\u2713 Commission System: Ready');
    console.log('\u2713 Privacy System: Ready');
    console.log('\u2713 Reputation System: Ready');
    console.log('\u2713 Project Tracking: Ready');
    console.log('\u2713 Payment Gateway: Ready');

    // Set footer year safely
    const footerYearEl = $id('footer-year'); if (footerYearEl) footerYearEl.textContent = new Date().getFullYear();
});

// Load saved data from localStorage (safe operations)
function loadSavedData() {
    const profileData = localStorage.getItem('profileData');
    if (profileData) {
        try {
            const data = JSON.parse(profileData);
            if ($id('profile-name')) $id('profile-name').textContent = data.name || '';
            if ($id('profile-about')) $id('profile-about').textContent = data.about || '';
            if ($id('profile-skills')) $id('profile-skills').innerHTML = data.skills || '';
        } catch(e){console.warn('profileData parse error',e);}    }
    const accountSettings = localStorage.getItem('accountSettings');
    if (accountSettings) {
        try {
            const settings = JSON.parse(accountSettings);
            if ($id('settings-name')) $id('settings-name').value = settings.name || '';
            if ($id('settings-email')) $id('settings-email').value = settings.email || '';
            if ($id('settings-bio')) $id('settings-bio').value = settings.bio || '';
        } catch(e){console.warn('accountSettings parse error',e);}    }
    const profilePicture = localStorage.getItem('profilePicture');
    if (profilePicture) {
        if ($id('profile-avatar')) $id('profile-avatar').src = profilePicture;
        const ua = document.querySelector('.user-avatar img'); if (ua) ua.src = profilePicture;
    }
}

// Send message function (uses sanitizer)
function sendMessage() {
  const chatInput = document.querySelector('.chat-input input');
  if (!chatInput) return;
  const message = chatInput.value.trim();
  if (!message) return;
  const chatMessages = document.querySelector('.chat-messages');
  if (!chatMessages) return;
  const messageElement = document.createElement('div');
  messageElement.className = 'message sent';
  const sanitized = (typeof redactSensitiveNumbers === 'function') ? redactSensitiveNumbers(message) : message;
  const p = document.createElement('p'); p.textContent = sanitized;
  const timeSpan = document.createElement('span'); timeSpan.className = 'message-time'; timeSpan.textContent = 'Just now';
  messageElement.appendChild(p); messageElement.appendChild(timeSpan);
  if (sanitized.includes('•')) messageElement.classList.add('message-filtered');
  chatMessages.appendChild(messageElement);
  chatInput.value = '';
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Expose necessary functions globally
window.showPaymentModal = showPaymentModal;
window.closePaymentModal = closePaymentModal;
window.selectPaymentMethod = selectPaymentMethod;
window.processPayment = processPayment;
window.formatCardNumber = formatCardNumber;
window.formatExpiryDate = formatExpiryDate;
window.completeMilestone = completeMilestone;
window.showProjectDetails = showProjectDetails;
window.closeProjectDetails = closeProjectDetails;
window.showChangePassword = showChangePassword;
window.closeChangePassword = closeChangePassword;
window.saveAccountSettings = saveAccountSettings;
window.login = login;
window.showRoleSelection = showRoleSelection;
window.backToLogin = backToLogin;
window.selectRole = selectRole;
window.showPage = showPage;
window.logout = logout;
window.toggleDropdown = toggleDropdown;
window.toggleMobileMenu = toggleMobileMenu;
window.switchDiscoveryTab = switchDiscoveryTab;
window.showCreateProject = showCreateProject;
window.closeCreateProject = closeCreateProject;
window.toggleEditMode = toggleEditMode;
window.changeProfilePicture = changeProfilePicture;

// End of updated script
