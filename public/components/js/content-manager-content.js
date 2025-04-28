/**
 * Content Management Interface Content Loading and Rendering
 * Content loading and rendering functionality for the content manager component
 */


/**
 * Load content based on current type, filters, and search
 */
ContentManagerComponent.prototype.loadContent = async function() {
  if (!this.container) return;
  
  const contentLoading = this.container.querySelector('#content-loading');
  const contentEmpty = this.container.querySelector('#content-empty');
  const contentGrid = this.container.querySelector('#content-grid');
  
  if (contentLoading) contentLoading.style.display = 'block';
  if (contentEmpty) contentEmpty.style.display = 'none';
  if (contentGrid) contentGrid.innerHTML = '';
  
  try {
    if (!window.authService || !window.authService.isAuthenticated()) {
      if (contentLoading) contentLoading.style.display = 'none';
      if (contentGrid) {
        contentGrid.innerHTML = `
          <div class="auth-required">
            <p>You need to authenticate with GitHub to view your content.</p>
            <button id="content-auth-button" class="button primary">Authenticate</button>
          </div>
        `;
        
        const authButton = contentGrid.querySelector('#content-auth-button');
        if (authButton) {
          authButton.addEventListener('click', () => {
            const mainAuthButton = document.getElementById('github-auth-button');
            if (mainAuthButton) {
              mainAuthButton.click();
            }
          });
        }
      }
      return;
    }
    
    try {
      const params = {
        type: this.currentType,
        search: this.searchQuery,
        sortField: this.sortField,
        sortDirection: this.sortDirection,
        page: this.currentPage,
        pageSize: this.pageSize,
        ...this.filterCriteria
      };
      
      const result = await window.mcpClient.listUORObjects(params);
      
      this.currentObjects = result.objects || [];
      this.totalPages = result.totalPages || 1;
      
      const countElement = this.container.querySelector('#content-count');
      if (countElement) {
        countElement.textContent = `${result.totalCount || 0} items`;
      }
      
      this.updatePagination();
      
      this.renderContent();
      
      this.renderVisualization();
      
      this.loadAvailableTags();
    } catch (error) {
      console.error(`Error listing ${this.currentType}s:`, error);
      
      if (contentLoading) contentLoading.style.display = 'none';
      
      if (contentGrid) {
        if (error.message.includes('Authentication required')) {
          contentGrid.innerHTML = `
            <div class="auth-required">
              <p>You need to authenticate with GitHub to view your content.</p>
              <button id="content-auth-button" class="button primary">Authenticate</button>
            </div>
          `;
          
          const authButton = contentGrid.querySelector('#content-auth-button');
          if (authButton) {
            authButton.addEventListener('click', () => {
              const mainAuthButton = document.getElementById('github-auth-button');
              if (mainAuthButton) {
                mainAuthButton.click();
              }
            });
          }
        } else {
          contentGrid.innerHTML = `
            <div class="error-message">
              <p>Error: ${error.message}</p>
              <button id="retry-button" class="button secondary">Retry</button>
            </div>
          `;
          
          const retryButton = contentGrid.querySelector('#retry-button');
          if (retryButton) {
            retryButton.addEventListener('click', () => {
              this.loadContent();
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('Error in loadContent:', error);
    
    if (contentLoading) contentLoading.style.display = 'none';
    
    if (contentGrid) {
      contentGrid.innerHTML = `
        <div class="error-message">
          <p>Error: ${error.message}</p>
          <button id="retry-button" class="button secondary">Retry</button>
        </div>
      `;
      
      const retryButton = contentGrid.querySelector('#retry-button');
      if (retryButton) {
        retryButton.addEventListener('click', () => {
          this.loadContent();
        });
      }
    }
  }
};

/**
 * Render content based on current view
 */
ContentManagerComponent.prototype.renderContent = function() {
  if (!this.container) return;
  
  const contentLoading = this.container.querySelector('#content-loading');
  const contentEmpty = this.container.querySelector('#content-empty');
  const contentGrid = this.container.querySelector('#content-grid');
  
  if (!contentLoading || !contentEmpty || !contentGrid) return;
  
  contentLoading.style.display = 'none';
  
  if (this.currentObjects.length === 0) {
    contentEmpty.style.display = 'block';
    contentGrid.innerHTML = '';
  } else {
    contentEmpty.style.display = 'none';
    
    if (this.currentView === 'grid') {
      contentGrid.innerHTML = this.currentObjects.map(obj => this.renderGridItem(obj)).join('');
    } else {
      contentGrid.innerHTML = `
        <table class="content-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Created</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${this.currentObjects.map(obj => this.renderListItem(obj)).join('')}
          </tbody>
        </table>
      `;
    }
    
    this.attachContentItemEventHandlers();
  }
};

/**
 * Render a grid item
 * @param {Object} obj Object to render
 * @returns {string} HTML for the grid item
 */
ContentManagerComponent.prototype.renderGridItem = function(obj) {
  const createdAt = new Date(obj.createdAt).toLocaleString();
  const updatedAt = new Date(obj.updatedAt).toLocaleString();
  
  const tags = obj.tags && obj.tags.length > 0
    ? obj.tags.map(tag => `<span class="content-tag">${tag}</span>`).join('')
    : '';
  
  return `
    <div class="content-item" data-id="${obj.id}">
      <div class="content-item-header">
        <div>
          <h4 class="content-item-title">${obj.name || obj.id}</h4>
          <div class="content-item-type">${obj.type}</div>
        </div>
      </div>
      <div class="content-item-body">
        <p class="content-item-description">${obj.description || 'No description'}</p>
        <div class="content-item-meta">
          <span>Created: ${createdAt}</span>
          <span>Updated: ${updatedAt}</span>
        </div>
        ${tags ? `<div class="content-item-tags">${tags}</div>` : ''}
        <div class="content-item-actions">
          <button class="content-action-button view-button" data-id="${obj.id}">
            <span class="icon">👁️</span> View
          </button>
          <button class="content-action-button edit-button" data-id="${obj.id}">
            <span class="icon">✏️</span> Edit
          </button>
          <button class="content-action-button delete-button" data-id="${obj.id}">
            <span class="icon">🗑️</span> Delete
          </button>
        </div>
      </div>
    </div>
  `;
};

/**
 * Render a list item
 * @param {Object} obj Object to render
 * @returns {string} HTML for the list item
 */
ContentManagerComponent.prototype.renderListItem = function(obj) {
  const createdAt = new Date(obj.createdAt).toLocaleString();
  const updatedAt = new Date(obj.updatedAt).toLocaleString();
  
  return `
    <tr class="content-row" data-id="${obj.id}">
      <td>${obj.name || obj.id}</td>
      <td>${obj.description || 'No description'}</td>
      <td>${createdAt}</td>
      <td>${updatedAt}</td>
      <td>
        <div class="content-item-actions">
          <button class="content-action-button view-button" data-id="${obj.id}">
            <span class="icon">👁️</span>
          </button>
          <button class="content-action-button edit-button" data-id="${obj.id}">
            <span class="icon">✏️</span>
          </button>
          <button class="content-action-button delete-button" data-id="${obj.id}">
            <span class="icon">🗑️</span>
          </button>
        </div>
      </td>
    </tr>
  `;
};

/**
 * Attach event handlers to content items
 */
ContentManagerComponent.prototype.attachContentItemEventHandlers = function() {
  if (!this.container) return;
  
  const viewButtons = this.container.querySelectorAll('.view-button');
  viewButtons.forEach(button => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      const id = button.getAttribute('data-id');
      this.viewContentItem(id);
    });
  });
  
  const editButtons = this.container.querySelectorAll('.edit-button');
  editButtons.forEach(button => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      const id = button.getAttribute('data-id');
      this.editContentItem(id);
    });
  });
  
  const deleteButtons = this.container.querySelectorAll('.delete-button');
  deleteButtons.forEach(button => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      const id = button.getAttribute('data-id');
      this.deleteContentItem(id);
    });
  });
  
  const contentItems = this.container.querySelectorAll('.content-item');
  contentItems.forEach(item => {
    item.addEventListener('click', () => {
      const id = item.getAttribute('data-id');
      this.viewContentItem(id);
    });
  });
  
  const contentRows = this.container.querySelectorAll('.content-row');
  contentRows.forEach(row => {
    row.addEventListener('click', () => {
      const id = row.getAttribute('data-id');
      this.viewContentItem(id);
    });
  });
};

/**
 * Render visualization of content relationships
 */
ContentManagerComponent.prototype.renderVisualization = function() {
  if (!this.container) return;
  
  const visualizationContainer = this.container.querySelector('#content-visualization');
  if (!visualizationContainer) return;
  
  if (this.currentObjects.length === 0) {
    visualizationContainer.style.display = 'none';
    return;
  }
  
  visualizationContainer.style.display = 'block';
  
  visualizationContainer.innerHTML = `
    <h3>Content Relationships</h3>
    <p>Visualization of ${this.currentObjects.length} ${this.currentType} objects and their relationships.</p>
    <div class="visualization-placeholder">
      <p>Interactive visualization will be rendered here.</p>
      <p>This feature is under development.</p>
    </div>
  `;
};

/**
 * Load available tags for filtering
 */
ContentManagerComponent.prototype.loadAvailableTags = async function() {
  if (!this.container) return;
  
  const tagContainer = this.container.querySelector('#filter-tags');
  if (!tagContainer) return;
  
  try {
    const tags = await window.mcpClient.getContentTags(this.currentType);
    
    if (tags && tags.length > 0) {
      const tagsHtml = tags.map(tag => `
        <div class="tag-filter" data-tag="${tag}">
          ${tag}
        </div>
      `).join('');
      
      tagContainer.innerHTML = tagsHtml;
      
      const tagElements = tagContainer.querySelectorAll('.tag-filter');
      tagElements.forEach(tag => {
        tag.addEventListener('click', () => {
          tag.classList.toggle('selected');
        });
      });
    } else {
      tagContainer.innerHTML = '<div class="empty-tags">No tags available</div>';
    }
  } catch (error) {
    console.error('Error loading tags:', error);
    tagContainer.innerHTML = '<div class="empty-tags">Error loading tags</div>';
  }
};
