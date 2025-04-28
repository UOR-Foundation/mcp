/**
 * User Dashboard Component
 * Provides enhanced dashboard with repository status, recent activity, and content management
 */

class DashboardComponent {
  constructor() {
    this.container = null;
    this.initialized = false;
    this.recentActivity = [];
  }
  
  /**
   * Initialize the dashboard component
   * @param {HTMLElement} container Container element
   */
  initialize(container) {
    this.container = container;
    this.render();
    this.bindEvents();
    this.initialized = true;
    
    this.loadRecentActivity();
  }
  
  /**
   * Render the dashboard content
   */
  render() {
    if (!this.container) return;
    
    this.container.innerHTML = `
      <div class="dashboard-header">
        <h2>Your UOR Dashboard</h2>
        <div class="dashboard-actions">
          <button id="refresh-dashboard-button" class="button secondary">
            <span class="icon">🔄</span> Refresh
          </button>
        </div>
      </div>
      
      <div class="dashboard-grid">
        <div class="dashboard-main">
          <div class="dashboard-card" id="repository-status-card">
            <div class="card-header">
              <h3>Repository Status</h3>
            </div>
            <div class="card-content" id="repository-status">
              <p>Loading repository status...</p>
            </div>
          </div>
          
          <div class="dashboard-card" id="content-stats-card">
            <div class="card-header">
              <h3>Content Statistics</h3>
            </div>
            <div class="card-content" id="content-stats">
              <p>Loading content statistics...</p>
            </div>
          </div>
          
          <div class="dashboard-card" id="recent-activity-card">
            <div class="card-header">
              <h3>Recent Activity</h3>
            </div>
            <div class="card-content" id="recent-activity">
              <p>Loading recent activity...</p>
            </div>
          </div>
        </div>
        
        <div class="dashboard-sidebar">
          <div class="dashboard-card" id="quick-actions-card">
            <div class="card-header">
              <h3>Quick Actions</h3>
            </div>
            <div class="card-content">
              <div class="action-buttons">
                <button id="init-repo-button" class="action-button">
                  <span class="icon">📁</span>
                  <span class="label">Initialize Repository</span>
                </button>
                <button id="create-concept-button" class="action-button">
                  <span class="icon">💡</span>
                  <span class="label">New Concept</span>
                </button>
                <button id="create-resource-button" class="action-button">
                  <span class="icon">📄</span>
                  <span class="label">New Resource</span>
                </button>
                <button id="create-topic-button" class="action-button">
                  <span class="icon">📚</span>
                  <span class="label">New Topic</span>
                </button>
                <button id="create-predicate-button" class="action-button">
                  <span class="icon">🔗</span>
                  <span class="label">New Predicate</span>
                </button>
                <button id="create-resolver-button" class="action-button">
                  <span class="icon">🔍</span>
                  <span class="label">New Resolver</span>
                </button>
              </div>
            </div>
          </div>
          
          <div class="dashboard-card" id="notifications-card">
            <div class="card-header">
              <h3>Notifications</h3>
              <span class="badge" id="notification-count">0</span>
            </div>
            <div class="card-content" id="notifications">
              <p>No new notifications</p>
            </div>
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
    
    const refreshButton = this.container.querySelector('#refresh-dashboard-button');
    if (refreshButton) {
      refreshButton.addEventListener('click', () => {
        this.refreshDashboard();
      });
    }
    
    const initRepoButton = this.container.querySelector('#init-repo-button');
    if (initRepoButton) {
      initRepoButton.addEventListener('click', () => {
        if (window.uordbManager) {
          window.uordbManager.handleInitRepository();
        }
      });
    }
    
    const createButtons = {
      '#create-concept-button': 'concept',
      '#create-resource-button': 'resource',
      '#create-topic-button': 'topic',
      '#create-predicate-button': 'predicate',
      '#create-resolver-button': 'resolver'
    };
    
    Object.entries(createButtons).forEach(([selector, type]) => {
      const button = this.container.querySelector(selector);
      if (button) {
        button.addEventListener('click', () => {
          const addButton = document.querySelector(`.add-button[data-type="${type}"]`);
          if (addButton) {
            addButton.click();
          }
        });
      }
    });
  }
  
  /**
   * Refresh the dashboard
   */
  async refreshDashboard() {
    if (!this.container) return;
    
    const refreshButton = this.container.querySelector('#refresh-dashboard-button');
    if (refreshButton) {
      refreshButton.disabled = true;
      refreshButton.innerHTML = '<span class="icon">🔄</span> Refreshing...';
    }
    
    try {
      if (window.uordbManager) {
        await window.uordbManager.refreshRepositoryStatus();
        await window.uordbManager.refreshCurrentObjects();
      }
      
      await this.loadRecentActivity();
      
      await this.loadNotifications();
      
      showMessage('Dashboard refreshed successfully', 'success');
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
      showMessage(`Error refreshing dashboard: ${error.message}`, 'error');
    } finally {
      if (refreshButton) {
        refreshButton.disabled = false;
        refreshButton.innerHTML = '<span class="icon">🔄</span> Refresh';
      }
    }
  }
  
  /**
   * Load recent activity
   */
  async loadRecentActivity() {
    if (!this.container) return;
    
    const activityContainer = this.container.querySelector('#recent-activity');
    if (!activityContainer) return;
    
    try {
      if (!window.authService || !window.authService.isAuthenticated()) {
        activityContainer.innerHTML = `
          <p>You need to authenticate with GitHub to view your recent activity.</p>
        `;
        return;
      }
      
      activityContainer.innerHTML = '<p>Loading activity...</p>';
      
      try {
        const activity = await window.mcpClient.getRecentActivity();
        this.recentActivity = activity || [];
        
        if (activity && activity.length > 0) {
          const activityHtml = activity.map(item => this.renderActivityItem(item)).join('');
          activityContainer.innerHTML = `
            <div class="activity-list">
              ${activityHtml}
            </div>
          `;
        } else {
          activityContainer.innerHTML = `
            <p>No recent activity found. Start creating UOR objects to see activity here.</p>
          `;
        }
      } catch (error) {
        console.error('Error loading recent activity:', error);
        
        if (error.message.includes('Authentication required')) {
          activityContainer.innerHTML = `
            <p>You need to authenticate with GitHub to view your recent activity.</p>
          `;
        } else {
          activityContainer.innerHTML = `
            <p class="error">Error loading activity: ${error.message}</p>
          `;
        }
      }
    } catch (error) {
      console.error('Error in loadRecentActivity:', error);
      activityContainer.innerHTML = `
        <p class="error">Error loading activity: ${error.message}</p>
      `;
    }
  }
  
  /**
   * Render an activity item
   * @param {Object} item Activity item
   * @returns {string} HTML for the activity item
   */
  renderActivityItem(item) {
    const timestamp = new Date(item.timestamp).toLocaleString();
    let icon = '📄';
    
    switch (item.action) {
      case 'create':
        icon = '➕';
        break;
      case 'update':
        icon = '✏️';
        break;
      case 'delete':
        icon = '🗑️';
        break;
      case 'view':
        icon = '👁️';
        break;
    }
    
    return `
      <div class="activity-item">
        <div class="activity-icon">${icon}</div>
        <div class="activity-content">
          <div class="activity-header">
            <span class="activity-action">${item.action.charAt(0).toUpperCase() + item.action.slice(1)}</span>
            <span class="activity-type">${item.objectType}</span>
            <span class="activity-time">${timestamp}</span>
          </div>
          <div class="activity-details">
            ${item.objectName ? `<strong>${item.objectName}</strong>` : item.objectId}
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Load notifications
   */
  async loadNotifications() {
    if (!this.container) return;
    
    const notificationsContainer = this.container.querySelector('#notifications');
    const notificationCount = this.container.querySelector('#notification-count');
    
    if (!notificationsContainer || !notificationCount) return;
    
    try {
      if (!window.authService || !window.authService.isAuthenticated()) {
        notificationsContainer.innerHTML = `
          <p>You need to authenticate with GitHub to view your notifications.</p>
        `;
        notificationCount.textContent = '0';
        return;
      }
      
      notificationsContainer.innerHTML = '<p>Loading notifications...</p>';
      
      try {
        const notifications = await window.mcpClient.getNotifications();
        
        if (notifications && notifications.length > 0) {
          notificationCount.textContent = notifications.length.toString();
          
          const notificationsHtml = notifications.map(item => this.renderNotificationItem(item)).join('');
          notificationsContainer.innerHTML = `
            <div class="notification-list">
              ${notificationsHtml}
            </div>
          `;
        } else {
          notificationCount.textContent = '0';
          notificationsContainer.innerHTML = `
            <p>No new notifications</p>
          `;
        }
      } catch (error) {
        console.error('Error loading notifications:', error);
        
        if (error.message.includes('Authentication required')) {
          notificationsContainer.innerHTML = `
            <p>You need to authenticate with GitHub to view your notifications.</p>
          `;
        } else {
          notificationsContainer.innerHTML = `
            <p class="error">Error loading notifications: ${error.message}</p>
          `;
        }
        
        notificationCount.textContent = '0';
      }
    } catch (error) {
      console.error('Error in loadNotifications:', error);
      notificationsContainer.innerHTML = `
        <p class="error">Error loading notifications: ${error.message}</p>
      `;
      notificationCount.textContent = '0';
    }
  }
  
  /**
   * Render a notification item
   * @param {Object} item Notification item
   * @returns {string} HTML for the notification item
   */
  renderNotificationItem(item) {
    const timestamp = new Date(item.timestamp).toLocaleString();
    let icon = '🔔';
    
    switch (item.type) {
      case 'update':
        icon = '✏️';
        break;
      case 'mention':
        icon = '📣';
        break;
      case 'share':
        icon = '🔗';
        break;
      case 'system':
        icon = '⚙️';
        break;
    }
    
    return `
      <div class="notification-item ${item.read ? 'read' : 'unread'}">
        <div class="notification-icon">${icon}</div>
        <div class="notification-content">
          <div class="notification-message">${item.message}</div>
          <div class="notification-time">${timestamp}</div>
        </div>
        ${!item.read ? '<div class="unread-indicator"></div>' : ''}
      </div>
    `;
  }
}

window.DashboardComponent = new DashboardComponent();
