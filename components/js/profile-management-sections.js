/**
 * Profile Management Component - Sections
 * Section rendering functionality for the profile management component
 */

/**
 * Render personal information section
 * @param {HTMLElement} container Container element
 */
ProfileManagementComponent.prototype.renderPersonalSection = function(container) {
  container.innerHTML = `
    <div class="profile-section">
      <div class="profile-section-header">
        <h3 class="profile-section-title">Personal Information</h3>
        <button id="edit-personal-button" class="button secondary">
          <span class="icon">✏️</span> Edit
        </button>
      </div>
      <div class="profile-section-description">
        Your personal information is used to identify you in the UOR system.
      </div>
      
      <div class="profile-form" id="personal-info-view">
        <div class="form-group">
          <label>Username</label>
          <div>${this.profileData.username || 'Not set'}</div>
        </div>
        <div class="form-group">
          <label>Display Name</label>
          <div>${this.profileData.displayName || 'Not set'}</div>
        </div>
        <div class="form-group">
          <label>Email</label>
          <div>${this.profileData.email || 'Not set'}</div>
        </div>
        <div class="form-group">
          <label>Bio</label>
          <div>${this.profileData.bio || 'Not set'}</div>
        </div>
        <div class="form-group">
          <label>Location</label>
          <div>${this.profileData.location || 'Not set'}</div>
        </div>
        <div class="form-group">
          <label>Website</label>
          <div>${this.profileData.website ? `<a href="${this.profileData.website}" target="_blank">${this.profileData.website}</a>` : 'Not set'}</div>
        </div>
      </div>
      
      <form class="profile-form" id="personal-info-form" style="display: none;">
        <div class="form-group">
          <label for="username">Username</label>
          <input type="text" id="username" value="${this.profileData.username || ''}" readonly>
          <div class="help-text">Username cannot be changed</div>
        </div>
        <div class="form-group">
          <label for="display-name">Display Name</label>
          <input type="text" id="display-name" value="${this.profileData.displayName || ''}">
        </div>
        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" value="${this.profileData.email || ''}">
        </div>
        <div class="form-group profile-form-full">
          <label for="bio">Bio</label>
          <textarea id="bio" rows="4">${this.profileData.bio || ''}</textarea>
        </div>
        <div class="form-group">
          <label for="location">Location</label>
          <input type="text" id="location" value="${this.profileData.location || ''}">
        </div>
        <div class="form-group">
          <label for="website">Website</label>
          <input type="url" id="website" value="${this.profileData.website || ''}">
        </div>
        <div class="form-actions">
          <button type="button" id="cancel-personal-button" class="button secondary">Cancel</button>
          <button type="submit" class="button primary">Save Changes</button>
        </div>
      </form>
    </div>
    
    <div class="profile-section">
      <div class="profile-section-header">
        <h3 class="profile-section-title">Profile Statistics</h3>
      </div>
      <div class="profile-stats">
        <div class="profile-stat">
          <div class="profile-stat-value">${this.stats.objectCount || 0}</div>
          <div class="profile-stat-label">Objects</div>
        </div>
        <div class="profile-stat">
          <div class="profile-stat-value">${this.stats.connectionCount || 0}</div>
          <div class="profile-stat-label">Connections</div>
        </div>
        <div class="profile-stat">
          <div class="profile-stat-value">${this.stats.messageCount || 0}</div>
          <div class="profile-stat-label">Messages</div>
        </div>
        <div class="profile-stat">
          <div class="profile-stat-value">${this.stats.repositoryCount || 0}</div>
          <div class="profile-stat-label">Repositories</div>
        </div>
      </div>
    </div>
  `;
  
  const editButton = container.querySelector('#edit-personal-button');
  const personalInfoView = container.querySelector('#personal-info-view');
  const personalInfoForm = container.querySelector('#personal-info-form');
  
  if (editButton && personalInfoView && personalInfoForm) {
    editButton.addEventListener('click', () => {
      personalInfoView.style.display = 'none';
      personalInfoForm.style.display = 'grid';
    });
  }
  
  const cancelButton = container.querySelector('#cancel-personal-button');
  if (cancelButton && personalInfoView && personalInfoForm) {
    cancelButton.addEventListener('click', () => {
      personalInfoView.style.display = 'grid';
      personalInfoForm.style.display = 'none';
    });
  }
  
  const form = container.querySelector('#personal-info-form');
  if (form) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      
      const displayNameInput = form.querySelector('#display-name');
      const emailInput = form.querySelector('#email');
      const bioInput = form.querySelector('#bio');
      const locationInput = form.querySelector('#location');
      const websiteInput = form.querySelector('#website');
      
      const updatedProfile = {
        ...this.profileData,
        displayName: displayNameInput ? displayNameInput.value : this.profileData.displayName,
        email: emailInput ? emailInput.value : this.profileData.email,
        bio: bioInput ? bioInput.value : this.profileData.bio,
        location: locationInput ? locationInput.value : this.profileData.location,
        website: websiteInput ? websiteInput.value : this.profileData.website
      };
      
      try {
        await window.mcpClient.updateProfile(updatedProfile);
        
        this.profileData = updatedProfile;
        
        showMessage('Profile updated successfully', 'success');
        
        if (personalInfoView && personalInfoForm) {
          personalInfoView.style.display = 'grid';
          personalInfoForm.style.display = 'none';
        }
        
        this.renderPersonalSection(container);
        
      } catch (error) {
        console.error('Error updating profile:', error);
        showMessage(`Error updating profile: ${error.message}`, 'error');
      }
    });
  }
};

/**
 * Render security section
 * @param {HTMLElement} container Container element
 */
ProfileManagementComponent.prototype.renderSecuritySection = function(container) {
  container.innerHTML = `
    <div class="profile-section">
      <div class="profile-section-header">
        <h3 class="profile-section-title">Security Settings</h3>
      </div>
      <div class="profile-section-description">
        Manage your security settings and access tokens.
      </div>
      
      <div class="profile-form">
        <div class="form-group profile-form-full">
          <label>GitHub Authentication</label>
          <div class="verification-badge">
            <span class="icon">✓</span> Connected to GitHub
          </div>
        </div>
        
        <div class="form-group profile-form-full">
          <label>Access Tokens</label>
          <div class="profile-card">
            <div class="profile-card-header">
              <h4 class="profile-card-title">GitHub Access Token</h4>
              <div class="profile-card-actions">
                <button id="revoke-github-token" class="button danger small">Revoke</button>
              </div>
            </div>
            <div class="profile-card-content">
              <p>This token allows the UOR system to access your GitHub repositories.</p>
              <p>Last used: ${new Date(this.profileData.lastTokenUse || Date.now()).toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        <div class="form-group profile-form-full">
          <label>Two-Factor Authentication</label>
          <div class="profile-card">
            <div class="profile-card-header">
              <h4 class="profile-card-title">Two-Factor Authentication</h4>
              <div class="profile-card-actions">
                <button id="setup-2fa" class="button secondary small">Setup</button>
              </div>
            </div>
            <div class="profile-card-content">
              <p>Add an extra layer of security to your account by requiring a verification code.</p>
              <p>Status: Not configured</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="profile-section">
      <div class="profile-section-header">
        <h3 class="profile-section-title">Account Actions</h3>
      </div>
      <div class="profile-section-description">
        Manage your account settings and data.
      </div>
      
      <div class="profile-form">
        <div class="form-group profile-form-full">
          <button id="export-data-button" class="button secondary">
            <span class="icon">📤</span> Export Account Data
          </button>
          <div class="help-text">Download all your UOR data in a portable format.</div>
        </div>
        
        <div class="form-group profile-form-full">
          <button id="delete-account-button" class="button danger">
            <span class="icon">🗑️</span> Delete Account
          </button>
          <div class="help-text">Permanently delete your account and all associated data.</div>
        </div>
      </div>
    </div>
  `;
  
  const revokeTokenButton = container.querySelector('#revoke-github-token');
  if (revokeTokenButton) {
    revokeTokenButton.addEventListener('click', () => {
      this.showRevokeTokenConfirmation();
    });
  }
  
  const setup2FAButton = container.querySelector('#setup-2fa');
  if (setup2FAButton) {
    setup2FAButton.addEventListener('click', () => {
      showMessage('Two-factor authentication setup is not yet available', 'info');
    });
  }
  
  const exportDataButton = container.querySelector('#export-data-button');
  if (exportDataButton) {
    exportDataButton.addEventListener('click', async () => {
      try {
        await window.mcpClient.exportAccountData();
        showMessage('Your data export has been initiated. You will receive a download link via email.', 'success');
      } catch (error) {
        console.error('Error exporting data:', error);
        showMessage(`Error exporting data: ${error.message}`, 'error');
      }
    });
  }
  
  const deleteAccountButton = container.querySelector('#delete-account-button');
  if (deleteAccountButton) {
    deleteAccountButton.addEventListener('click', () => {
      this.showDeleteAccountConfirmation();
    });
  }
};

/**
 * Render connections section
 * @param {HTMLElement} container Container element
 */
ProfileManagementComponent.prototype.renderConnectionsSection = function(container) {
  container.innerHTML = `
    <div class="profile-section">
      <div class="profile-section-header">
        <h3 class="profile-section-title">Your Connections</h3>
        <button id="add-connection-button" class="button primary">
          <span class="icon">➕</span> Add Connection
        </button>
      </div>
      <div class="profile-section-description">
        Manage your connections to other users in the UOR system.
      </div>
      
      <div class="profile-tabs">
        <button class="profile-tab active" data-tab="all">All Connections</button>
        <button class="profile-tab" data-tab="pending">Pending Requests</button>
        <button class="profile-tab" data-tab="suggested">Suggested</button>
      </div>
      
      <div id="all-tab" class="profile-tab-content active">
        ${this.connections.length > 0 ? `
          <div class="profile-connections">
            ${this.connections.map(connection => `
              <div class="connection-card">
                <div class="connection-avatar">
                  ${connection.username.charAt(0).toUpperCase()}
                </div>
                <div class="connection-info">
                  <h4 class="connection-name">${connection.displayName || connection.username}</h4>
                  <div class="connection-meta">${connection.mutualConnections} mutual connections</div>
                </div>
                <div class="connection-actions">
                  <button class="button secondary small remove-connection-button" data-id="${connection.id}">
                    <span class="icon">✖️</span>
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        ` : `
          <div class="empty-state">
            <p>You don't have any connections yet.</p>
            <button id="empty-add-connection-button" class="button secondary">Add Connection</button>
          </div>
        `}
      </div>
      
      <div id="pending-tab" class="profile-tab-content">
        <div class="empty-state">
          <p>You don't have any pending connection requests.</p>
        </div>
      </div>
      
      <div id="suggested-tab" class="profile-tab-content">
        <div class="empty-state">
          <p>No suggested connections available.</p>
        </div>
      </div>
    </div>
    
    <div class="profile-section">
      <div class="profile-section-header">
        <h3 class="profile-section-title">Namespace Resolvers</h3>
        <button id="add-resolver-button" class="button primary">
          <span class="icon">➕</span> Add Resolver
        </button>
      </div>
      <div class="profile-section-description">
        Manage namespace resolvers to access objects across different namespaces.
      </div>
      
      <div id="resolvers-container">
        ${this.profileData.resolvers && this.profileData.resolvers.length > 0 ? `
          <div class="profile-connections">
            ${this.profileData.resolvers.map(resolver => `
              <div class="connection-card">
                <div class="connection-avatar">
                  🔍
                </div>
                <div class="connection-info">
                  <h4 class="connection-name">${resolver.source} → ${resolver.target}</h4>
                  <div class="connection-meta">${resolver.bidirectional ? 'Bidirectional' : 'One-way'}</div>
                </div>
                <div class="connection-actions">
                  <button class="button secondary small remove-resolver-button" data-id="${resolver.id}">
                    <span class="icon">✖️</span>
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        ` : `
          <div class="empty-state">
            <p>You don't have any namespace resolvers yet.</p>
            <button id="empty-add-resolver-button" class="button secondary">Add Resolver</button>
          </div>
        `}
      </div>
    </div>
  `;
  
  const tabs = container.querySelectorAll('.profile-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      const tabType = tab.getAttribute('data-tab');
      const panes = container.querySelectorAll('.profile-tab-content');
      panes.forEach(pane => pane.classList.remove('active'));
      container.querySelector(`#${tabType}-tab`).classList.add('active');
    });
  });
  
  const addConnectionButton = container.querySelector('#add-connection-button');
  const emptyAddConnectionButton = container.querySelector('#empty-add-connection-button');
  
  const addConnectionHandler = () => {
    this.showAddConnectionModal();
  };
  
  if (addConnectionButton) {
    addConnectionButton.addEventListener('click', addConnectionHandler);
  }
  
  if (emptyAddConnectionButton) {
    emptyAddConnectionButton.addEventListener('click', addConnectionHandler);
  }
  
  const removeConnectionButtons = container.querySelectorAll('.remove-connection-button');
  removeConnectionButtons.forEach(button => {
    button.addEventListener('click', () => {
      const connectionId = button.getAttribute('data-id');
      this.showRemoveConnectionConfirmation(connectionId);
    });
  });
  
  const addResolverButton = container.querySelector('#add-resolver-button');
  const emptyAddResolverButton = container.querySelector('#empty-add-resolver-button');
  
  const addResolverHandler = () => {
    this.showAddResolverModal();
  };
  
  if (addResolverButton) {
    addResolverButton.addEventListener('click', addResolverHandler);
  }
  
  if (emptyAddResolverButton) {
    emptyAddResolverButton.addEventListener('click', addResolverHandler);
  }
  
  const removeResolverButtons = container.querySelectorAll('.remove-resolver-button');
  removeResolverButtons.forEach(button => {
    button.addEventListener('click', () => {
      const resolverId = button.getAttribute('data-id');
      this.showRemoveResolverConfirmation(resolverId);
    });
  });
};

/**
 * Render activity section
 * @param {HTMLElement} container Container element
 */
ProfileManagementComponent.prototype.renderActivitySection = function(container) {
  container.innerHTML = `
    <div class="profile-section">
      <div class="profile-section-header">
        <h3 class="profile-section-title">Recent Activity</h3>
      </div>
      <div class="profile-section-description">
        Your recent activity in the UOR system.
      </div>
      
      <div class="profile-activity">
        ${this.activities.length > 0 ? `
          <div class="activity-timeline">
            ${this.activities.map(activity => `
              <div class="activity-item">
                <div class="activity-time">${new Date(activity.timestamp).toLocaleString()}</div>
                <div class="activity-content">
                  <h4 class="activity-title">${activity.title}</h4>
                  <p class="activity-description">${activity.description}</p>
                </div>
              </div>
            `).join('')}
          </div>
        ` : `
          <div class="empty-state">
            <p>No recent activity to display.</p>
          </div>
        `}
      </div>
    </div>
    
    <div class="profile-section">
      <div class="profile-section-header">
        <h3 class="profile-section-title">Activity Settings</h3>
      </div>
      <div class="profile-section-description">
        Configure what activities are tracked and displayed.
      </div>
      
      <div class="profile-form">
        <div class="form-group profile-form-full">
          <label for="activity-privacy">Activity Privacy</label>
          <select id="activity-privacy" class="form-control">
            <option value="public" ${this.profileData.activityPrivacy === 'public' ? 'selected' : ''}>Public - Anyone can see your activity</option>
            <option value="connections" ${this.profileData.activityPrivacy === 'connections' ? 'selected' : ''}>Connections Only - Only your connections can see your activity</option>
            <option value="private" ${this.profileData.activityPrivacy === 'private' ? 'selected' : ''}>Private - Only you can see your activity</option>
          </select>
        </div>
        
        <div class="form-group profile-form-full">
          <label>Activity Types to Track</label>
          <div class="checkbox-group">
            <label class="checkbox-label">
              <input type="checkbox" id="track-content-changes" ${this.profileData.trackContentChanges ? 'checked' : ''}>
              Content Changes
            </label>
            <label class="checkbox-label">
              <input type="checkbox" id="track-connections" ${this.profileData.trackConnections ? 'checked' : ''}>
              Connection Changes
            </label>
            <label class="checkbox-label">
              <input type="checkbox" id="track-profile-updates" ${this.profileData.trackProfileUpdates ? 'checked' : ''}>
              Profile Updates
            </label>
            <label class="checkbox-label">
              <input type="checkbox" id="track-repository-changes" ${this.profileData.trackRepositoryChanges ? 'checked' : ''}>
              Repository Changes
            </label>
          </div>
        </div>
        
        <div class="form-actions">
          <button id="save-activity-settings" class="button primary">Save Settings</button>
        </div>
      </div>
    </div>
  `;
  
  const saveButton = container.querySelector('#save-activity-settings');
  if (saveButton) {
    saveButton.addEventListener('click', async () => {
      const activityPrivacy = container.querySelector('#activity-privacy').value;
      const trackContentChanges = container.querySelector('#track-content-changes').checked;
      const trackConnections = container.querySelector('#track-connections').checked;
      const trackProfileUpdates = container.querySelector('#track-profile-updates').checked;
      const trackRepositoryChanges = container.querySelector('#track-repository-changes').checked;
      
      try {
        await window.mcpClient.updateActivitySettings({
          activityPrivacy,
          trackContentChanges,
          trackConnections,
          trackProfileUpdates,
          trackRepositoryChanges
        });
        
        this.profileData = {
          ...this.profileData,
          activityPrivacy,
          trackContentChanges,
          trackConnections,
          trackProfileUpdates,
          trackRepositoryChanges
        };
        
        showMessage('Activity settings updated successfully', 'success');
        
      } catch (error) {
        console.error('Error updating activity settings:', error);
        showMessage(`Error updating activity settings: ${error.message}`, 'error');
      }
    });
  }
};

/**
 * Render preferences section
 * @param {HTMLElement} container Container element
 */
ProfileManagementComponent.prototype.renderPreferencesSection = function(container) {
  container.innerHTML = `
    <div class="profile-section">
      <div class="profile-section-header">
        <h3 class="profile-section-title">Interface Preferences</h3>
      </div>
      <div class="profile-section-description">
        Customize your UOR interface experience.
      </div>
      
      <div class="profile-form">
        <div class="form-group">
          <label for="theme-preference">Theme</label>
          <select id="theme-preference" class="form-control">
            <option value="light" ${this.profileData.theme === 'light' ? 'selected' : ''}>Light</option>
            <option value="dark" ${this.profileData.theme === 'dark' ? 'selected' : ''}>Dark</option>
            <option value="system" ${this.profileData.theme === 'system' ? 'selected' : ''}>System Default</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="language-preference">Language</label>
          <select id="language-preference" class="form-control">
            <option value="en" ${this.profileData.language === 'en' ? 'selected' : ''}>English</option>
            <option value="es" ${this.profileData.language === 'es' ? 'selected' : ''}>Español</option>
            <option value="fr" ${this.profileData.language === 'fr' ? 'selected' : ''}>Français</option>
            <option value="de" ${this.profileData.language === 'de' ? 'selected' : ''}>Deutsch</option>
            <option value="ja" ${this.profileData.language === 'ja' ? 'selected' : ''}>日本語</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="timezone-preference">Timezone</label>
          <select id="timezone-preference" class="form-control">
            <option value="UTC" ${this.profileData.timezone === 'UTC' ? 'selected' : ''}>UTC</option>
            <option value="America/New_York" ${this.profileData.timezone === 'America/New_York' ? 'selected' : ''}>Eastern Time (ET)</option>
            <option value="America/Chicago" ${this.profileData.timezone === 'America/Chicago' ? 'selected' : ''}>Central Time (CT)</option>
            <option value="America/Denver" ${this.profileData.timezone === 'America/Denver' ? 'selected' : ''}>Mountain Time (MT)</option>
            <option value="America/Los_Angeles" ${this.profileData.timezone === 'America/Los_Angeles' ? 'selected' : ''}>Pacific Time (PT)</option>
            <option value="Europe/London" ${this.profileData.timezone === 'Europe/London' ? 'selected' : ''}>London (GMT)</option>
            <option value="Europe/Paris" ${this.profileData.timezone === 'Europe/Paris' ? 'selected' : ''}>Paris (CET)</option>
            <option value="Asia/Tokyo" ${this.profileData.timezone === 'Asia/Tokyo' ? 'selected' : ''}>Tokyo (JST)</option>
          </select>
        </div>
      </div>
    </div>
    
    <div class="profile-section">
      <div class="profile-section-header">
        <h3 class="profile-section-title">Notification Preferences</h3>
      </div>
      <div class="profile-section-description">
        Configure how and when you receive notifications.
      </div>
      
      <div class="profile-form">
        <div class="form-group profile-form-full">
          <label>Email Notifications</label>
          <div class="checkbox-group">
            <label class="checkbox-label">
              <input type="checkbox" id="email-messages" ${this.profileData.emailNotifications?.messages ? 'checked' : ''}>
              New Messages
            </label>
            <label class="checkbox-label">
              <input type="checkbox" id="email-connections" ${this.profileData.emailNotifications?.connections ? 'checked' : ''}>
              Connection Requests
            </label>
            <label class="checkbox-label">
              <input type="checkbox" id="email-mentions" ${this.profileData.emailNotifications?.mentions ? 'checked' : ''}>
              Mentions
            </label>
            <label class="checkbox-label">
              <input type="checkbox" id="email-updates" ${this.profileData.emailNotifications?.updates ? 'checked' : ''}>
              System Updates
            </label>
          </div>
        </div>
        
        <div class="form-group profile-form-full">
          <label>In-App Notifications</label>
          <div class="checkbox-group">
            <label class="checkbox-label">
              <input type="checkbox" id="inapp-messages" ${this.profileData.inAppNotifications?.messages ? 'checked' : ''}>
              New Messages
            </label>
            <label class="checkbox-label">
              <input type="checkbox" id="inapp-connections" ${this.profileData.inAppNotifications?.connections ? 'checked' : ''}>
              Connection Requests
            </label>
            <label class="checkbox-label">
              <input type="checkbox" id="inapp-mentions" ${this.profileData.inAppNotifications?.mentions ? 'checked' : ''}>
              Mentions
            </label>
            <label class="checkbox-label">
              <input type="checkbox" id="inapp-updates" ${this.profileData.inAppNotifications?.updates ? 'checked' : ''}>
              System Updates
            </label>
          </div>
        </div>
        
        <div class="form-actions">
          <button id="save-preferences-button" class="button primary">Save Preferences</button>
        </div>
      </div>
    </div>
  `;
  
  const saveButton = container.querySelector('#save-preferences-button');
  if (saveButton) {
    saveButton.addEventListener('click', async () => {
      const theme = container.querySelector('#theme-preference').value;
      const language = container.querySelector('#language-preference').value;
      const timezone = container.querySelector('#timezone-preference').value;
      
      const emailNotifications = {
        messages: container.querySelector('#email-messages').checked,
        connections: container.querySelector('#email-connections').checked,
        mentions: container.querySelector('#email-mentions').checked,
        updates: container.querySelector('#email-updates').checked
      };
      
      const inAppNotifications = {
        messages: container.querySelector('#inapp-messages').checked,
        connections: container.querySelector('#inapp-connections').checked,
        mentions: container.querySelector('#inapp-mentions').checked,
        updates: container.querySelector('#inapp-updates').checked
      };
      
      try {
        await window.mcpClient.updatePreferences({
          theme,
          language,
          timezone,
          emailNotifications,
          inAppNotifications
        });
        
        this.profileData = {
          ...this.profileData,
          theme,
          language,
          timezone,
          emailNotifications,
          inAppNotifications
        };
        
        showMessage('Preferences updated successfully', 'success');
        
        if (theme !== 'system') {
          document.documentElement.setAttribute('data-theme', theme);
        } else {
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        }
        
      } catch (error) {
        console.error('Error updating preferences:', error);
        showMessage(`Error updating preferences: ${error.message}`, 'error');
      }
    });
  }
};
