/**
 * Profile Management Component - Base
 * Provides enhanced profile management interface for UOR users
 */

class ProfileManagementComponent {
  constructor() {
    this.container = null;
    this.initialized = false;
    this.currentSection = 'personal';
    this.profileData = null;
    this.connections = [];
    this.activities = [];
    this.stats = {};
  }
  
  /**
   * Initialize the profile management component
   * @param {HTMLElement} container Container element
   */
  initialize(container) {
    this.container = container;
    this.render();
    this.bindEvents();
    this.initialized = true;
    
    this.loadProfileData();
  }
  
  /**
   * Render the profile management interface
   */
  render() {
    if (!this.container) return;
    
    this.container.innerHTML = `
      <div class="profile-header">
        <h2>Profile Management</h2>
        <div class="profile-actions">
          <button id="refresh-profile-button" class="button secondary">
            <span class="icon">🔄</span> Refresh
          </button>
        </div>
      </div>
      
      <div class="profile-container">
        <div class="profile-sidebar">
          <div class="profile-avatar-container">
            <div class="profile-avatar" id="profile-avatar">
              <div id="avatar-placeholder">?</div>
              <img id="avatar-image" style="display: none;" alt="Profile Avatar">
              <div class="profile-avatar-overlay">
                <div class="profile-avatar-overlay-text">Change Avatar</div>
              </div>
            </div>
            <div class="profile-username" id="profile-username">Loading...</div>
            <div class="profile-email" id="profile-email"></div>
          </div>
          
          <div class="profile-nav">
            <div class="profile-nav-item active" data-section="personal">
              <span class="profile-nav-icon">👤</span>
              <span>Personal Information</span>
            </div>
            <div class="profile-nav-item" data-section="security">
              <span class="profile-nav-icon">🔒</span>
              <span>Security</span>
            </div>
            <div class="profile-nav-item" data-section="connections">
              <span class="profile-nav-icon">🔗</span>
              <span>Connections</span>
            </div>
            <div class="profile-nav-item" data-section="activity">
              <span class="profile-nav-icon">📊</span>
              <span>Activity</span>
            </div>
            <div class="profile-nav-item" data-section="preferences">
              <span class="profile-nav-icon">⚙️</span>
              <span>Preferences</span>
            </div>
          </div>
        </div>
        
        <div class="profile-main">
          <div id="profile-loading" class="loading-indicator">
            <p>Loading profile data...</p>
          </div>
          
          <div id="profile-content" style="display: none;">
            <!-- Content will be inserted here based on selected section -->
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Bind event handlers
   */
  bindEvents() {
    if (!this.container) return;
    
    const navItems = this.container.querySelectorAll('.profile-nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        navItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        
        const section = item.getAttribute('data-section');
        this.showSection(section);
      });
    });
    
    const refreshButton = this.container.querySelector('#refresh-profile-button');
    if (refreshButton) {
      refreshButton.addEventListener('click', () => {
        this.loadProfileData();
      });
    }
    
    const avatar = this.container.querySelector('#profile-avatar');
    if (avatar) {
      avatar.addEventListener('click', () => {
        this.changeAvatar();
      });
    }
  }
  
  /**
   * Load profile data from the server
   */
  async loadProfileData() {
    if (!this.container) return;
    
    const profileLoading = this.container.querySelector('#profile-loading');
    const profileContent = this.container.querySelector('#profile-content');
    
    if (!profileLoading || !profileContent) return;
    
    profileLoading.style.display = 'flex';
    profileContent.style.display = 'none';
    
    try {
      if (!window.authService || !window.authService.isAuthenticated()) {
        profileLoading.style.display = 'none';
        profileContent.style.display = 'block';
        profileContent.innerHTML = `
          <div class="auth-required">
            <p>You need to authenticate with GitHub to view your profile.</p>
            <button id="profile-auth-button" class="button primary">Authenticate</button>
          </div>
        `;
        
        const authButton = profileContent.querySelector('#profile-auth-button');
        if (authButton) {
          authButton.addEventListener('click', () => {
            const mainAuthButton = document.getElementById('github-auth-button');
            if (mainAuthButton) {
              mainAuthButton.click();
            }
          });
        }
        return;
      }
      
      this.profileData = await window.mcpClient.getProfile();
      
      this.connections = await window.mcpClient.getConnections();
      
      this.activities = await window.mcpClient.getActivity();
      
      this.stats = await window.mcpClient.getProfileStats();
      
      this.updateProfileHeader();
      
      profileLoading.style.display = 'none';
      profileContent.style.display = 'block';
      
      this.showSection(this.currentSection);
      
    } catch (error) {
      console.error('Error loading profile data:', error);
      
      profileLoading.style.display = 'none';
      profileContent.style.display = 'block';
      
      if (error.message.includes('Authentication required')) {
        profileContent.innerHTML = `
          <div class="auth-required">
            <p>You need to authenticate with GitHub to view your profile.</p>
            <button id="profile-auth-button" class="button primary">Authenticate</button>
          </div>
        `;
        
        const authButton = profileContent.querySelector('#profile-auth-button');
        if (authButton) {
          authButton.addEventListener('click', () => {
            const mainAuthButton = document.getElementById('github-auth-button');
            if (mainAuthButton) {
              mainAuthButton.click();
            }
          });
        }
      } else {
        profileContent.innerHTML = `
          <div class="error-message">
            <p>Error: ${error.message}</p>
            <button id="retry-profile-button" class="button secondary">Retry</button>
          </div>
        `;
        
        const retryButton = profileContent.querySelector('#retry-profile-button');
        if (retryButton) {
          retryButton.addEventListener('click', () => {
            this.loadProfileData();
          });
        }
      }
    }
  }
  
  /**
   * Update profile header with avatar and username
   */
  updateProfileHeader() {
    if (!this.container || !this.profileData) return;
    
    const avatarPlaceholder = this.container.querySelector('#avatar-placeholder');
    const avatarImage = this.container.querySelector('#avatar-image');
    const usernameElement = this.container.querySelector('#profile-username');
    const emailElement = this.container.querySelector('#profile-email');
    
    if (avatarPlaceholder && avatarImage && usernameElement && emailElement) {
      if (this.profileData.avatarUrl) {
        avatarPlaceholder.style.display = 'none';
        avatarImage.src = this.profileData.avatarUrl;
        avatarImage.style.display = 'block';
      } else {
        avatarPlaceholder.textContent = this.profileData.username ? this.profileData.username.charAt(0).toUpperCase() : '?';
        avatarPlaceholder.style.display = 'flex';
        avatarImage.style.display = 'none';
      }
      
      usernameElement.textContent = this.profileData.username || 'Unknown User';
      emailElement.textContent = this.profileData.email || '';
    }
  }
  
  /**
   * Show a specific section
   * @param {string} section Section to show
   */
  showSection(section) {
    if (!this.container || !this.profileData) return;
    
    this.currentSection = section;
    
    const profileContent = this.container.querySelector('#profile-content');
    if (!profileContent) return;
    
    switch (section) {
      case 'personal':
        this.renderPersonalSection(profileContent);
        break;
      case 'security':
        this.renderSecuritySection(profileContent);
        break;
      case 'connections':
        this.renderConnectionsSection(profileContent);
        break;
      case 'activity':
        this.renderActivitySection(profileContent);
        break;
      case 'preferences':
        this.renderPreferencesSection(profileContent);
        break;
      default:
        this.renderPersonalSection(profileContent);
    }
  }
  
  /**
   * Close a modal
   * @param {HTMLElement} modal Modal element
   */
  closeModal(modal) {
    modal.classList.remove('show');
    setTimeout(() => {
      modal.remove();
    }, 300);
  }
}

window.ProfileManagementComponent = new ProfileManagementComponent();
