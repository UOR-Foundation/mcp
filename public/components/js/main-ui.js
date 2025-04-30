/**
 * Main UI Component
 * Integrates all UI components for the MCP-UOR system
 */

class MainUIComponent {
  constructor() {
    this.container = null;
    this.initialized = false;
    this.currentView = 'dashboard';
    this.sidebarOpen = false;
  }
  
  /**
   * Initialize the main UI component
   * @param {HTMLElement} container Container element
   */
  initialize(container) {
    this.container = container;
    this.render();
    this.bindEvents();
    this.initialized = true;
    
    this.updateAuthState();
    
    if (window.authService) {
      window.authService.onAuthStateChanged(() => {
        this.updateAuthState();
      });
    }
  }
  
  /**
   * Render the main UI
   */
  render() {
    if (!this.container) return;
    
    this.container.innerHTML = `
      <header class="main-header">
        <div class="header-left">
          <button id="sidebar-toggle" class="mobile-menu-toggle">
            <span></span>
          </button>
          <div class="logo">
            <img src="/assets/logo.svg" alt="UOR Logo" class="logo-image">
            <span class="logo-text">MCP-UOR</span>
          </div>
        </div>
        <div class="header-center">
          <nav class="main-nav hide-on-mobile">
            <ul class="nav-list">
              <li class="nav-item" data-view="dashboard">
                <a href="#dashboard">Dashboard</a>
              </li>
              <li class="nav-item" data-view="content">
                <a href="#content">Content</a>
              </li>
              <li class="nav-item" data-view="messaging">
                <a href="#messaging">Messaging</a>
              </li>
              <li class="nav-item" data-view="profile">
                <a href="#profile">Profile</a>
              </li>
            </ul>
          </nav>
        </div>
        <div class="header-right">
          <div class="search-bar hide-on-mobile">
            <input type="text" id="global-search" placeholder="Search UOR objects...">
            <button id="search-button" class="search-button">
              <span class="icon">🔍</span>
            </button>
          </div>
          <div class="user-menu">
            <button id="user-menu-button" class="user-menu-button">
              <div class="user-avatar" id="user-avatar">?</div>
              <span class="user-name hide-on-mobile" id="user-name">Guest</span>
            </button>
            <div class="user-dropdown" id="user-dropdown">
              <div class="user-dropdown-header" id="user-dropdown-header">
                <div class="user-info">
                  <div class="user-avatar-large" id="user-avatar-large">?</div>
                  <div class="user-details">
                    <div class="user-name-large" id="user-name-large">Guest</div>
                    <div class="user-email" id="user-email"></div>
                  </div>
                </div>
              </div>
              <ul class="user-dropdown-menu">
                <li class="user-dropdown-item" data-view="profile">
                  <span class="icon">👤</span> Profile
                </li>
                <li class="user-dropdown-item" data-view="settings">
                  <span class="icon">⚙️</span> Settings
                </li>
                <li class="user-dropdown-divider"></li>
                <li class="user-dropdown-item" id="auth-action">
                  <span class="icon">🔑</span> <span id="auth-action-text">Sign In</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </header>
      
      <div class="main-container">
        <aside class="sidebar" id="sidebar">
          <div class="sidebar-header">
            <h3>Navigation</h3>
            <button id="sidebar-close" class="sidebar-close">×</button>
          </div>
          <nav class="sidebar-nav">
            <ul class="sidebar-nav-list">
              <li class="sidebar-nav-item" data-view="dashboard">
                <span class="icon">📊</span> Dashboard
              </li>
              <li class="sidebar-nav-item" data-view="content">
                <span class="icon">📄</span> Content
              </li>
              <li class="sidebar-nav-item" data-view="messaging">
                <span class="icon">💬</span> Messaging
              </li>
              <li class="sidebar-nav-item" data-view="profile">
                <span class="icon">👤</span> Profile
              </li>
              <li class="sidebar-nav-divider"></li>
              <li class="sidebar-nav-item" data-view="concepts">
                <span class="icon">💡</span> Concepts
              </li>
              <li class="sidebar-nav-item" data-view="resources">
                <span class="icon">📚</span> Resources
              </li>
              <li class="sidebar-nav-item" data-view="topics">
                <span class="icon">📌</span> Topics
              </li>
              <li class="sidebar-nav-item" data-view="predicates">
                <span class="icon">🔗</span> Predicates
              </li>
              <li class="sidebar-nav-divider"></li>
              <li class="sidebar-nav-item" data-view="settings">
                <span class="icon">⚙️</span> Settings
              </li>
              <li class="sidebar-nav-item" data-view="help">
                <span class="icon">❓</span> Help
              </li>
            </ul>
          </nav>
        </aside>
        
        <div class="sidebar-overlay" id="sidebar-overlay"></div>
        
        <main class="main-content" id="main-content">
          <div id="view-container">
            <!-- View content will be inserted here -->
            <div class="loading-indicator">
              <p>Loading...</p>
            </div>
          </div>
        </main>
      </div>
      
      <footer class="main-footer">
        <div class="footer-left">
          <p>&copy; 2025 UOR Foundation</p>
        </div>
        <div class="footer-right">
          <a href="#terms">Terms</a>
          <a href="#privacy">Privacy</a>
          <a href="#about">About</a>
        </div>
      </footer>
      
      <div id="toast-container" class="toast-container"></div>
    `;
    
    this.loadView(this.currentView);
  }
  
  /**
   * Bind event handlers
   */
  bindEvents() {
    if (!this.container) return;
    
    const sidebarToggle = this.container.querySelector('#sidebar-toggle');
    const sidebar = this.container.querySelector('#sidebar');
    const sidebarOverlay = this.container.querySelector('#sidebar-overlay');
    const sidebarClose = this.container.querySelector('#sidebar-close');
    
    if (sidebarToggle && sidebar && sidebarOverlay && sidebarClose) {
      sidebarToggle.addEventListener('click', () => {
        this.toggleSidebar();
      });
      
      sidebarClose.addEventListener('click', () => {
        this.closeSidebar();
      });
      
      sidebarOverlay.addEventListener('click', () => {
        this.closeSidebar();
      });
    }
    
    const navItems = this.container.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', (event) => {
        event.preventDefault();
        const view = item.getAttribute('data-view');
        this.navigateTo(view);
      });
    });
    
    const sidebarNavItems = this.container.querySelectorAll('.sidebar-nav-item');
    sidebarNavItems.forEach(item => {
      item.addEventListener('click', () => {
        const view = item.getAttribute('data-view');
        this.navigateTo(view);
        this.closeSidebar();
      });
    });
    
    const userMenuButton = this.container.querySelector('#user-menu-button');
    const userDropdown = this.container.querySelector('#user-dropdown');
    
    if (userMenuButton && userDropdown) {
      userMenuButton.addEventListener('click', () => {
        userDropdown.classList.toggle('show');
      });
      
      document.addEventListener('click', (event) => {
        if (!userMenuButton.contains(event.target) && !userDropdown.contains(event.target)) {
          userDropdown.classList.remove('show');
        }
      });
    }
    
    const userDropdownItems = this.container.querySelectorAll('.user-dropdown-item');
    userDropdownItems.forEach(item => {
      item.addEventListener('click', () => {
        const view = item.getAttribute('data-view');
        if (view) {
          this.navigateTo(view);
        }
        userDropdown.classList.remove('show');
      });
    });
    
    const authAction = this.container.querySelector('#auth-action');
    if (authAction) {
      authAction.addEventListener('click', () => {
        if (window.authService && window.authService.isAuthenticated()) {
          window.authService.logout();
        } else {
          window.authService.startAuthFlow();
        }
        userDropdown.classList.remove('show');
      });
    }
    
    const searchButton = this.container.querySelector('#search-button');
    const globalSearch = this.container.querySelector('#global-search');
    
    if (searchButton && globalSearch) {
      searchButton.addEventListener('click', () => {
        this.performSearch(globalSearch.value);
      });
      
      globalSearch.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
          this.performSearch(globalSearch.value);
        }
      });
    }
    
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.substring(1);
      if (hash) {
        this.navigateTo(hash);
      }
    });
  }
  
  /**
   * Toggle sidebar visibility
   */
  toggleSidebar() {
    const sidebar = this.container.querySelector('#sidebar');
    const sidebarOverlay = this.container.querySelector('#sidebar-overlay');
    const sidebarToggle = this.container.querySelector('#sidebar-toggle');
    
    if (sidebar && sidebarOverlay && sidebarToggle) {
      this.sidebarOpen = !this.sidebarOpen;
      sidebar.classList.toggle('open', this.sidebarOpen);
      sidebarOverlay.classList.toggle('active', this.sidebarOpen);
      sidebarToggle.classList.toggle('active', this.sidebarOpen);
    }
  }
  
  /**
   * Close sidebar
   */
  closeSidebar() {
    const sidebar = this.container.querySelector('#sidebar');
    const sidebarOverlay = this.container.querySelector('#sidebar-overlay');
    const sidebarToggle = this.container.querySelector('#sidebar-toggle');
    
    if (sidebar && sidebarOverlay && sidebarToggle) {
      this.sidebarOpen = false;
      sidebar.classList.remove('open');
      sidebarOverlay.classList.remove('active');
      sidebarToggle.classList.remove('active');
    }
  }
  
  /**
   * Navigate to a view
   * @param {string} view View name
   */
  navigateTo(view) {
    if (this.currentView === view) return;
    
    this.currentView = view;
    window.location.hash = view;
    
    const navItems = this.container.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      const itemView = item.getAttribute('data-view');
      item.classList.toggle('active', itemView === view);
    });
    
    const sidebarNavItems = this.container.querySelectorAll('.sidebar-nav-item');
    sidebarNavItems.forEach(item => {
      const itemView = item.getAttribute('data-view');
      item.classList.toggle('active', itemView === view);
    });
    
    this.loadView(view);
  }
  
  /**
   * Load a view
   * @param {string} view View name
   */
  loadView(view) {
    const viewContainer = this.container.querySelector('#view-container');
    if (!viewContainer) return;
    
    viewContainer.innerHTML = `
      <div class="loading-indicator">
        <p>Loading ${view}...</p>
      </div>
    `;
    
    const viewElement = document.createElement('div');
    viewElement.id = `${view}-view`;
    viewElement.className = 'view';
    
    viewContainer.innerHTML = '';
    viewContainer.appendChild(viewElement);
    
    switch (view) {
      case 'dashboard':
        if (window.DashboardComponent) {
          window.DashboardComponent.initialize(viewElement);
        } else {
          this.showComponentError(viewElement, 'Dashboard');
        }
        break;
      case 'content':
        if (window.ContentManagerComponent) {
          window.ContentManagerComponent.initialize(viewElement);
        } else {
          this.showComponentError(viewElement, 'Content Manager');
        }
        break;
      case 'messaging':
        if (window.MessagingComponent) {
          window.MessagingComponent.initialize(viewElement);
        } else {
          this.showComponentError(viewElement, 'Messaging');
        }
        break;
      case 'profile':
        if (window.ProfileManagementComponent) {
          window.ProfileManagementComponent.initialize(viewElement);
        } else {
          this.showComponentError(viewElement, 'Profile Management');
        }
        break;
      case 'concepts':
      case 'resources':
      case 'topics':
      case 'predicates':
        if (window.ContentManagerComponent) {
          window.ContentManagerComponent.initialize(viewElement, view);
        } else {
          this.showComponentError(viewElement, 'Content Manager');
        }
        break;
      case 'settings':
        this.showSettingsView(viewElement);
        break;
      case 'help':
        this.showHelpView(viewElement);
        break;
      default:
        if (window.LandingPageComponent) {
          window.LandingPageComponent.initialize(viewElement);
        } else {
          this.showComponentError(viewElement, 'Landing Page');
        }
    }
  }
  
  /**
   * Show component error
   * @param {HTMLElement} container Container element
   * @param {string} componentName Component name
   */
  showComponentError(container, componentName) {
    container.innerHTML = `
      <div class="error-message">
        <h3>Component Error</h3>
        <p>The ${componentName} component could not be loaded.</p>
        <p>Please make sure all required scripts are included.</p>
      </div>
    `;
  }
  
  /**
   * Show settings view
   * @param {HTMLElement} container Container element
   */
  showSettingsView(container) {
    container.innerHTML = `
      <div class="settings-view">
        <h2>Settings</h2>
        <p>System settings will be available here.</p>
        <p>For user-specific settings, please visit the Profile section.</p>
      </div>
    `;
  }
  
  /**
   * Show help view
   * @param {HTMLElement} container Container element
   */
  showHelpView(container) {
    container.innerHTML = `
      <div class="help-view">
        <h2>Help & Documentation</h2>
        <p>Welcome to the MCP-UOR system!</p>
        <p>This system provides a standardized interface for accessing and manipulating Universal Object References (UOR).</p>
        <h3>Getting Started</h3>
        <ul>
          <li>Sign in with your GitHub account to access your UOR objects</li>
          <li>Use the Dashboard to view an overview of your UOR system</li>
          <li>Manage your content in the Content section</li>
          <li>Communicate with other users in the Messaging section</li>
          <li>Update your profile and preferences in the Profile section</li>
        </ul>
        <h3>Documentation</h3>
        <p>For more detailed documentation, please visit the <a href="https://docs.uor-foundation.org" target="_blank">UOR Foundation Documentation</a>.</p>
      </div>
    `;
  }
  
  /**
   * Perform global search
   * @param {string} query Search query
   */
  performSearch(query) {
    if (!query || query.trim() === '') return;
    
    const viewContainer = this.container.querySelector('#view-container');
    if (!viewContainer) return;
    
    viewContainer.innerHTML = `
      <div class="search-results-view">
        <h2>Search Results for "${query}"</h2>
        <div class="loading-indicator">
          <p>Searching...</p>
        </div>
      </div>
    `;
    
    if (window.mcpClient) {
      window.mcpClient.search(query)
        .then(results => {
          this.showSearchResults(viewContainer, query, results);
        })
        .catch(error => {
          console.error('Search error:', error);
          viewContainer.innerHTML = `
            <div class="search-results-view">
              <h2>Search Results for "${query}"</h2>
              <div class="error-message">
                <p>Error: ${error.message}</p>
              </div>
            </div>
          `;
        });
    } else {
      viewContainer.innerHTML = `
        <div class="search-results-view">
          <h2>Search Results for "${query}"</h2>
          <div class="error-message">
            <p>Search functionality is not available.</p>
            <p>Please make sure the MCP client is properly initialized.</p>
          </div>
        </div>
      `;
    }
  }
  
  /**
   * Show search results
   * @param {HTMLElement} container Container element
   * @param {string} query Search query
   * @param {Array} results Search results
   */
  showSearchResults(container, query, results) {
    if (!container) return;
    
    if (!results || results.length === 0) {
      container.innerHTML = `
        <div class="search-results-view">
          <h2>Search Results for "${query}"</h2>
          <div class="empty-state">
            <p>No results found for "${query}".</p>
            <p>Try using different keywords or check your spelling.</p>
          </div>
        </div>
      `;
      return;
    }
    
    const groupedResults = {};
    results.forEach(result => {
      if (!groupedResults[result.type]) {
        groupedResults[result.type] = [];
      }
      groupedResults[result.type].push(result);
    });
    
    let html = `
      <div class="search-results-view">
        <h2>Search Results for "${query}"</h2>
        <p>Found ${results.length} results</p>
    `;
    
    Object.keys(groupedResults).forEach(type => {
      const typeResults = groupedResults[type];
      html += `
        <div class="search-results-section">
          <h3>${type.charAt(0).toUpperCase() + type.slice(1)}s (${typeResults.length})</h3>
          <div class="search-results-list">
      `;
      
      typeResults.forEach(result => {
        html += `
          <div class="search-result-item" data-id="${result.id}" data-type="${result.type}">
            <div class="search-result-header">
              <h4 class="search-result-title">${result.title || result.name || 'Untitled'}</h4>
              <span class="search-result-namespace">${result.namespace}</span>
            </div>
            <div class="search-result-content">
              <p>${result.description || result.snippet || 'No description available'}</p>
            </div>
            <div class="search-result-footer">
              <span class="search-result-type">${result.type}</span>
              <span class="search-result-date">${new Date(result.updatedAt || result.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        `;
      });
      
      html += `
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    
    container.innerHTML = html;
    
    const resultItems = container.querySelectorAll('.search-result-item');
    resultItems.forEach(item => {
      item.addEventListener('click', () => {
        const id = item.getAttribute('data-id');
        const type = item.getAttribute('data-type');
        this.openObject(id, type);
      });
    });
  }
  
  /**
   * Open a UOR object
   * @param {string} id Object ID
   * @param {string} type Object type
   */
  openObject(id, type) {
    switch (type) {
      case 'concept':
      case 'resource':
      case 'topic':
      case 'predicate':
        this.navigateTo('content');
        if (window.ContentManagerComponent) {
          window.ContentManagerComponent.openObject(id, type);
        }
        break;
      case 'message':
      case 'thread':
        this.navigateTo('messaging');
        if (window.MessagingComponent) {
          window.MessagingComponent.openThread(id);
        }
        break;
      case 'profile':
      case 'identity':
        this.navigateTo('profile');
        if (window.ProfileManagementComponent) {
          window.ProfileManagementComponent.openSection('personal');
        }
        break;
      default:
        this.showObjectDetailsModal(id, type);
    }
  }
  
  /**
   * Show object details modal
   * @param {string} id Object ID
   * @param {string} type Object type
   */
  showObjectDetailsModal(id, type) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Object Details</h3>
          <button class="close-button">&times;</button>
        </div>
        <div class="modal-body">
          <div class="loading-indicator">
            <p>Loading object details...</p>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    setTimeout(() => {
      modal.classList.add('show');
    }, 10);
    
    const closeButton = modal.querySelector('.close-button');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        this.closeModal(modal);
      });
    }
    
    if (window.mcpClient) {
      window.mcpClient.getObject(id, type)
        .then(object => {
          this.renderObjectDetails(modal, object);
        })
        .catch(error => {
          console.error('Error loading object details:', error);
          const modalBody = modal.querySelector('.modal-body');
          if (modalBody) {
            modalBody.innerHTML = `
              <div class="error-message">
                <p>Error: ${error.message}</p>
              </div>
            `;
          }
        });
    } else {
      const modalBody = modal.querySelector('.modal-body');
      if (modalBody) {
        modalBody.innerHTML = `
          <div class="error-message">
            <p>Object details cannot be loaded.</p>
            <p>Please make sure the MCP client is properly initialized.</p>
          </div>
        `;
      }
    }
  }
  
  /**
   * Render object details in modal
   * @param {HTMLElement} modal Modal element
   * @param {Object} object Object data
   */
  renderObjectDetails(modal, object) {
    const modalBody = modal.querySelector('.modal-body');
    if (!modalBody) return;
    
    let html = `
      <div class="object-details">
        <div class="object-header">
          <h3 class="object-title">${object.title || object.name || 'Untitled'}</h3>
          <div class="object-meta">
            <span class="object-type">${object.type}</span>
            <span class="object-namespace">${object.namespace}</span>
          </div>
        </div>
        <div class="object-content">
    `;
    
    if (object.description) {
      html += `
        <div class="object-section">
          <h4>Description</h4>
          <p>${object.description}</p>
        </div>
      `;
    }
    
    if (object.data) {
      html += `
        <div class="object-section">
          <h4>Data</h4>
          <pre class="object-data">${JSON.stringify(object.data, null, 2)}</pre>
        </div>
      `;
    }
    
    html += `
      <div class="object-section">
        <h4>Metadata</h4>
        <table class="object-metadata">
          <tr>
            <th>ID</th>
            <td>${object.id}</td>
          </tr>
          <tr>
            <th>Type</th>
            <td>${object.type}</td>
          </tr>
          <tr>
            <th>Namespace</th>
            <td>${object.namespace}</td>
          </tr>
          <tr>
            <th>Created</th>
            <td>${new Date(object.createdAt).toLocaleString()}</td>
          </tr>
          <tr>
            <th>Updated</th>
            <td>${new Date(object.updatedAt).toLocaleString()}</td>
          </tr>
        </table>
      </div>
    `;
    
    if (object.references && object.references.length > 0) {
      html += `
        <div class="object-section">
          <h4>References</h4>
          <ul class="object-references">
      `;
      
      object.references.forEach(reference => {
        html += `
          <li class="object-reference" data-id="${reference.id}" data-type="${reference.type}">
            <span class="reference-type">${reference.type}</span>
            <span class="reference-name">${reference.name || reference.id}</span>
          </li>
        `;
      });
      
      html += `
          </ul>
        </div>
      `;
    }
    
    html += `
        </div>
        <div class="object-actions">
          <button class="button secondary" id="view-object-button">View in Context</button>
        </div>
      </div>
    `;
    
    modalBody.innerHTML = html;
    
    const references = modalBody.querySelectorAll('.object-reference');
    references.forEach(reference => {
      reference.addEventListener('click', () => {
        const id = reference.getAttribute('data-id');
        const type = reference.getAttribute('data-type');
        this.closeModal(modal);
        this.openObject(id, type);
      });
    });
    
    const viewButton = modalBody.querySelector('#view-object-button');
    if (viewButton) {
      viewButton.addEventListener('click', () => {
        this.closeModal(modal);
        this.openObject(object.id, object.type);
      });
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
  
  /**
   * Update authentication state in the UI
   */
  updateAuthState() {
    const isAuthenticated = window.authService && window.authService.isAuthenticated();
    
    const authActionText = this.container.querySelector('#auth-action-text');
    if (authActionText) {
      authActionText.textContent = isAuthenticated ? 'Sign Out' : 'Sign In';
    }
    
    if (isAuthenticated) {
      const user = window.authService.getCurrentUser();
      
      const userName = this.container.querySelector('#user-name');
      const userNameLarge = this.container.querySelector('#user-name-large');
      
      if (userName && userNameLarge) {
        userName.textContent = user.displayName || user.username;
        userNameLarge.textContent = user.displayName || user.username;
      }
      
      const userEmail = this.container.querySelector('#user-email');
      if (userEmail) {
        userEmail.textContent = user.email || '';
      }
      
      const userAvatar = this.container.querySelector('#user-avatar');
      const userAvatarLarge = this.container.querySelector('#user-avatar-large');
      
      if (userAvatar && userAvatarLarge) {
        if (user.avatarUrl) {
          userAvatar.innerHTML = `<img src='${user.avatarUrl}' alt='${user.username}'>`;
          userAvatarLarge.innerHTML = `<img src='${user.avatarUrl}' alt='${user.username}'>`;
        } else {
          const initial = user.username ? user.username.charAt(0).toUpperCase() : '?';
          userAvatar.textContent = initial;
          userAvatarLarge.textContent = initial;
        }
      }
    } else {
      const userName = this.container.querySelector('#user-name');
      const userNameLarge = this.container.querySelector('#user-name-large');
      
      if (userName && userNameLarge) {
        userName.textContent = 'Guest';
        userNameLarge.textContent = 'Guest';
      }
      
      const userEmail = this.container.querySelector('#user-email');
      if (userEmail) {
        userEmail.textContent = '';
      }
      
      const userAvatar = this.container.querySelector('#user-avatar');
      const userAvatarLarge = this.container.querySelector('#user-avatar-large');
      
      if (userAvatar && userAvatarLarge) {
        userAvatar.textContent = '?';
        userAvatarLarge.textContent = '?';
      }
    }
    
    if (window.DashboardComponent && window.DashboardComponent.updateAuthState) {
      window.DashboardComponent.updateAuthState(isAuthenticated);
    }
    
    if (window.ContentManagerComponent && window.ContentManagerComponent.updateAuthState) {
      window.ContentManagerComponent.updateAuthState(isAuthenticated);
    }
    
    if (window.MessagingComponent && window.MessagingComponent.updateAuthState) {
      window.MessagingComponent.updateAuthState(isAuthenticated);
    }
    
    if (window.ProfileManagementComponent && window.ProfileManagementComponent.updateAuthState) {
      window.ProfileManagementComponent.updateAuthState(isAuthenticated);
    }
  }
}

window.MainUIComponent = new MainUIComponent();
