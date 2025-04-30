/**
 * Content Management Interface Operations
 * CRUD operations functionality for the content manager component
 */


/**
 * Show modal to add new content
 */
ContentManagerComponent.prototype.showAddContentModal = function() {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>Create New ${this.currentType.charAt(0).toUpperCase() + this.currentType.slice(1)}</h3>
        <button class="close-button">&times;</button>
      </div>
      <div class="modal-body">
        <form id="add-content-form">
          <div class="form-group">
            <label for="content-name">Name</label>
            <input type="text" id="content-name" required>
          </div>
          <div class="form-group">
            <label for="content-description">Description</label>
            <textarea id="content-description" rows="4"></textarea>
          </div>
          <div class="form-group">
            <label for="content-tags">Tags (comma separated)</label>
            <input type="text" id="content-tags">
          </div>
          ${this.getTypeSpecificFields()}
          <div class="form-actions">
            <button type="button" class="button secondary cancel-button">Cancel</button>
            <button type="submit" class="button primary">Create</button>
          </div>
        </form>
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
  
  const cancelButton = modal.querySelector('.cancel-button');
  if (cancelButton) {
    cancelButton.addEventListener('click', () => {
      this.closeModal(modal);
    });
  }
  
  const form = modal.querySelector('#add-content-form');
  if (form) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      
      const nameInput = form.querySelector('#content-name');
      const descriptionInput = form.querySelector('#content-description');
      const tagsInput = form.querySelector('#content-tags');
      
      const data = {
        type: this.currentType,
        name: nameInput ? nameInput.value : '',
        description: descriptionInput ? descriptionInput.value : '',
        tags: tagsInput && tagsInput.value ? tagsInput.value.split(',').map(tag => tag.trim()) : []
      };
      
      this.addTypeSpecificData(data, form);
      
      try {
        await window.mcpClient.createUORObject(data);
        
        this.closeModal(modal);
        
        showMessage(`${this.currentType.charAt(0).toUpperCase() + this.currentType.slice(1)} created successfully`, 'success');
        
        this.loadContent();
      } catch (error) {
        console.error('Error creating object:', error);
        showMessage(`Error creating object: ${error.message}`, 'error');
      }
    });
  }
};

/**
 * Close a modal
 * @param {HTMLElement} modal Modal element
 */
ContentManagerComponent.prototype.closeModal = function(modal) {
  modal.classList.remove('show');
  setTimeout(() => {
    modal.remove();
  }, 300);
};

/**
 * Get type-specific form fields
 * @returns {string} HTML for type-specific fields
 */
ContentManagerComponent.prototype.getTypeSpecificFields = function() {
  switch (this.currentType) {
    case 'concept':
      return `
        <div class="form-group">
          <label for="concept-definition">Definition</label>
          <textarea id="concept-definition" rows="4"></textarea>
        </div>
        <div class="form-group">
          <label for="concept-examples">Examples (one per line)</label>
          <textarea id="concept-examples" rows="4"></textarea>
        </div>
      `;
    case 'resource':
      return `
        <div class="form-group">
          <label for="resource-url">URL</label>
          <input type="url" id="resource-url">
        </div>
        <div class="form-group">
          <label for="resource-mime-type">MIME Type</label>
          <input type="text" id="resource-mime-type" placeholder="text/html">
        </div>
      `;
    case 'topic':
      return `
        <div class="form-group">
          <label for="topic-summary">Summary</label>
          <textarea id="topic-summary" rows="4"></textarea>
        </div>
        <div class="form-group">
          <label for="topic-parent">Parent Topic (optional)</label>
          <input type="text" id="topic-parent" placeholder="uor://namespace/topic/id">
        </div>
      `;
    case 'predicate':
      return `
        <div class="form-group">
          <label for="predicate-domain">Domain</label>
          <input type="text" id="predicate-domain" placeholder="uor://namespace/concept/id">
        </div>
        <div class="form-group">
          <label for="predicate-range">Range</label>
          <input type="text" id="predicate-range" placeholder="uor://namespace/concept/id">
        </div>
      `;
    case 'resolver':
      return `
        <div class="form-group">
          <label for="resolver-source">Source Namespace</label>
          <input type="text" id="resolver-source" required>
        </div>
        <div class="form-group">
          <label for="resolver-target">Target Namespace</label>
          <input type="text" id="resolver-target" required>
        </div>
        <div class="form-group">
          <label for="resolver-bidirectional">Bidirectional</label>
          <input type="checkbox" id="resolver-bidirectional">
        </div>
      `;
    default:
      return '';
  }
};

/**
 * Add type-specific data to object
 * @param {Object} data Object data
 * @param {HTMLFormElement} form Form element
 */
ContentManagerComponent.prototype.addTypeSpecificData = function(data, form) {
  switch (this.currentType) {
    case 'concept': {
      const definitionInput = form.querySelector('#concept-definition');
      const examplesInput = form.querySelector('#concept-examples');
      
      if (definitionInput) {
        data.definition = definitionInput.value;
      }
      
      if (examplesInput && examplesInput.value) {
        data.examples = examplesInput.value.split('\n').filter(example => example.trim());
      }
      break;
    }
    
    case 'resource': {
      const urlInput = form.querySelector('#resource-url');
      const mimeTypeInput = form.querySelector('#resource-mime-type');
      
      if (urlInput) {
        data.url = urlInput.value;
      }
      
      if (mimeTypeInput) {
        data.mimeType = mimeTypeInput.value;
      }
      break;
    }
    
    case 'topic': {
      const summaryInput = form.querySelector('#topic-summary');
      const parentInput = form.querySelector('#topic-parent');
      
      if (summaryInput) {
        data.summary = summaryInput.value;
      }
      
      if (parentInput && parentInput.value) {
        data.parent = parentInput.value;
      }
      break;
    }
    
    case 'predicate': {
      const domainInput = form.querySelector('#predicate-domain');
      const rangeInput = form.querySelector('#predicate-range');
      
      if (domainInput) {
        data.domain = domainInput.value;
      }
      
      if (rangeInput) {
        data.range = rangeInput.value;
      }
      break;
    }
    
    case 'resolver': {
      const sourceInput = form.querySelector('#resolver-source');
      const targetInput = form.querySelector('#resolver-target');
      const bidirectionalInput = form.querySelector('#resolver-bidirectional');
      
      if (sourceInput) {
        data.source = sourceInput.value;
      }
      
      if (targetInput) {
        data.target = targetInput.value;
      }
      
      if (bidirectionalInput) {
        data.bidirectional = bidirectionalInput.checked;
      }
      break;
    }
  }
};

/**
 * View a content item
 * @param {string} id Item ID
 */
ContentManagerComponent.prototype.viewContentItem = async function(id) {
  try {
    const object = await window.mcpClient.getUORObject(id);
    
    if (!object) {
      showMessage(`Object not found: ${id}`, 'error');
      return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>${object.name || object.id}</h3>
          <button class="close-button">&times;</button>
        </div>
        <div class="modal-body">
          <div class="object-details">
            <div class="object-meta">
              <div class="meta-item">
                <span class="meta-label">Type:</span>
                <span class="meta-value">${object.type}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">ID:</span>
                <span class="meta-value">${object.id}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Created:</span>
                <span class="meta-value">${new Date(object.createdAt).toLocaleString()}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Updated:</span>
                <span class="meta-value">${new Date(object.updatedAt).toLocaleString()}</span>
              </div>
            </div>
            
            <div class="object-section">
              <h4>Description</h4>
              <p>${object.description || 'No description'}</p>
            </div>
            
            ${this.renderTypeSpecificDetails(object)}
            
            ${object.tags && object.tags.length > 0 ? `
              <div class="object-section">
                <h4>Tags</h4>
                <div class="content-item-tags">
                  ${object.tags.map(tag => `<span class="content-tag">${tag}</span>`).join('')}
                </div>
              </div>
            ` : ''}
            
            <div class="object-section">
              <h4>Revision History</h4>
              <div class="revision-history" id="revision-history">
                <p>Loading revision history...</p>
              </div>
            </div>
          </div>
          
          <div class="modal-actions">
            <button class="button secondary close-modal-button">Close</button>
            <button class="button primary edit-object-button" data-id="${object.id}">Edit</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    setTimeout(() => {
      modal.classList.add('show');
    }, 10);
    
    const closeButtons = modal.querySelectorAll('.close-button, .close-modal-button');
    closeButtons.forEach(button => {
      button.addEventListener('click', () => {
        this.closeModal(modal);
      });
    });
    
    const editButton = modal.querySelector('.edit-object-button');
    if (editButton) {
      editButton.addEventListener('click', () => {
        const id = editButton.getAttribute('data-id');
        this.closeModal(modal);
        this.editContentItem(id);
      });
    }
    
    this.loadRevisionHistory(object.id, modal.querySelector('#revision-history'));
    
  } catch (error) {
    console.error('Error viewing object:', error);
    showMessage(`Error viewing object: ${error.message}`, 'error');
  }
};

/**
 * Render type-specific details
 * @param {Object} object Object to render
 * @returns {string} HTML for type-specific details
 */
ContentManagerComponent.prototype.renderTypeSpecificDetails = function(object) {
  switch (object.type) {
    case 'concept':
      return `
        <div class="object-section">
          <h4>Definition</h4>
          <p>${object.definition || 'No definition'}</p>
        </div>
        ${object.examples && object.examples.length > 0 ? `
          <div class="object-section">
            <h4>Examples</h4>
            <ul>
              ${object.examples.map(example => `<li>${example}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      `;
    
    case 'resource':
      return `
        <div class="object-section">
          <h4>URL</h4>
          <p>${object.url ? `<a href="${object.url}" target="_blank">${object.url}</a>` : 'No URL'}</p>
        </div>
        <div class="object-section">
          <h4>MIME Type</h4>
          <p>${object.mimeType || 'Not specified'}</p>
        </div>
      `;
    
    case 'topic':
      return `
        <div class="object-section">
          <h4>Summary</h4>
          <p>${object.summary || 'No summary'}</p>
        </div>
        ${object.parent ? `
          <div class="object-section">
            <h4>Parent Topic</h4>
            <p>${object.parent}</p>
          </div>
        ` : ''}
      `;
    
    case 'predicate':
      return `
        <div class="object-section">
          <h4>Domain</h4>
          <p>${object.domain || 'Not specified'}</p>
        </div>
        <div class="object-section">
          <h4>Range</h4>
          <p>${object.range || 'Not specified'}</p>
        </div>
      `;
    
    case 'resolver':
      return `
        <div class="object-section">
          <h4>Source Namespace</h4>
          <p>${object.source || 'Not specified'}</p>
        </div>
        <div class="object-section">
          <h4>Target Namespace</h4>
          <p>${object.target || 'Not specified'}</p>
        </div>
        <div class="object-section">
          <h4>Bidirectional</h4>
          <p>${object.bidirectional ? 'Yes' : 'No'}</p>
        </div>
      `;
    
    default:
      return '';
  }
};

/**
 * Load revision history for an object
 * @param {string} id Object ID
 * @param {HTMLElement} container Container element
 */
ContentManagerComponent.prototype.loadRevisionHistory = async function(id, container) {
  if (!container) return;
  
  try {
    const revisions = await window.mcpClient.getObjectRevisions(id);
    
    if (revisions && revisions.length > 0) {
      const revisionsHtml = revisions.map((revision, index) => `
        <div class="revision-item">
          <div class="revision-header">
            <span class="revision-number">v${revisions.length - index}</span>
            <span class="revision-date">${new Date(revision.timestamp).toLocaleString()}</span>
          </div>
          <div class="revision-details">
            <div class="revision-author">${revision.author || 'Unknown'}</div>
            <div class="revision-message">${revision.message || 'No message'}</div>
          </div>
        </div>
      `).join('');
      
      container.innerHTML = `
        <div class="revision-list">
          ${revisionsHtml}
        </div>
      `;
    } else {
      container.innerHTML = '<p>No revision history available</p>';
    }
  } catch (error) {
    console.error('Error loading revision history:', error);
    container.innerHTML = `<p class="error">Error loading revision history: ${error.message}</p>`;
  }
};

/**
 * Edit a content item
 * @param {string} id Item ID
 */
ContentManagerComponent.prototype.editContentItem = async function(id) {
  try {
    const object = await window.mcpClient.getUORObject(id);
    
    if (!object) {
      showMessage(`Object not found: ${id}`, 'error');
      return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Edit ${object.type.charAt(0).toUpperCase() + object.type.slice(1)}</h3>
          <button class="close-button">&times;</button>
        </div>
        <div class="modal-body">
          <form id="edit-content-form">
            <div class="form-group">
              <label for="content-name">Name</label>
              <input type="text" id="content-name" value="${object.name || ''}" required>
            </div>
            <div class="form-group">
              <label for="content-description">Description</label>
              <textarea id="content-description" rows="4">${object.description || ''}</textarea>
            </div>
            <div class="form-group">
              <label for="content-tags">Tags (comma separated)</label>
              <input type="text" id="content-tags" value="${object.tags ? object.tags.join(', ') : ''}">
            </div>
            ${this.getTypeSpecificFieldsWithValues(object)}
            <div class="form-actions">
              <button type="button" class="button secondary cancel-button">Cancel</button>
              <button type="submit" class="button primary">Save Changes</button>
            </div>
          </form>
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
    
    const cancelButton = modal.querySelector('.cancel-button');
    if (cancelButton) {
      cancelButton.addEventListener('click', () => {
        this.closeModal(modal);
      });
    }
    
    const form = modal.querySelector('#edit-content-form');
    if (form) {
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const nameInput = form.querySelector('#content-name');
        const descriptionInput = form.querySelector('#content-description');
        const tagsInput = form.querySelector('#content-tags');
        
        const data = {
          id: object.id,
          type: object.type,
          name: nameInput ? nameInput.value : '',
          description: descriptionInput ? descriptionInput.value : '',
          tags: tagsInput && tagsInput.value ? tagsInput.value.split(',').map(tag => tag.trim()) : []
        };
        
        this.addTypeSpecificData(data, form);
        
        try {
          await window.mcpClient.updateUORObject(data);
          
          this.closeModal(modal);
          
          showMessage(`${object.type.charAt(0).toUpperCase() + object.type.slice(1)} updated successfully`, 'success');
          
          this.loadContent();
        } catch (error) {
          console.error('Error updating object:', error);
          showMessage(`Error updating object: ${error.message}`, 'error');
        }
      });
    }
  } catch (error) {
    console.error('Error editing object:', error);
    showMessage(`Error editing object: ${error.message}`, 'error');
  }
};

/**
 * Get type-specific form fields with values
 * @param {Object} object Object to get fields for
 * @returns {string} HTML for type-specific fields
 */
ContentManagerComponent.prototype.getTypeSpecificFieldsWithValues = function(object) {
  switch (object.type) {
    case 'concept':
      return `
        <div class="form-group">
          <label for="concept-definition">Definition</label>
          <textarea id="concept-definition" rows="4">${object.definition || ''}</textarea>
        </div>
        <div class="form-group">
          <label for="concept-examples">Examples (one per line)</label>
          <textarea id="concept-examples" rows="4">${object.examples ? object.examples.join('\n') : ''}</textarea>
        </div>
      `;
    case 'resource':
      return `
        <div class="form-group">
          <label for="resource-url">URL</label>
          <input type="url" id="resource-url" value="${object.url || ''}">
        </div>
        <div class="form-group">
          <label for="resource-mime-type">MIME Type</label>
          <input type="text" id="resource-mime-type" placeholder="text/html" value="${object.mimeType || ''}">
        </div>
      `;
    case 'topic':
      return `
        <div class="form-group">
          <label for="topic-summary">Summary</label>
          <textarea id="topic-summary" rows="4">${object.summary || ''}</textarea>
        </div>
        <div class="form-group">
          <label for="topic-parent">Parent Topic (optional)</label>
          <input type="text" id="topic-parent" placeholder="uor://namespace/topic/id" value="${object.parent || ''}">
        </div>
      `;
    case 'predicate':
      return `
        <div class="form-group">
          <label for="predicate-domain">Domain</label>
          <input type="text" id="predicate-domain" placeholder="uor://namespace/concept/id" value="${object.domain || ''}">
        </div>
        <div class="form-group">
          <label for="predicate-range">Range</label>
          <input type="text" id="predicate-range" placeholder="uor://namespace/concept/id" value="${object.range || ''}">
        </div>
      `;
    case 'resolver':
      return `
        <div class="form-group">
          <label for="resolver-source">Source Namespace</label>
          <input type="text" id="resolver-source" required value="${object.source || ''}">
        </div>
        <div class="form-group">
          <label for="resolver-target">Target Namespace</label>
          <input type="text" id="resolver-target" required value="${object.target || ''}">
        </div>
        <div class="form-group">
          <label for="resolver-bidirectional">Bidirectional</label>
          <input type="checkbox" id="resolver-bidirectional" ${object.bidirectional ? 'checked' : ''}>
        </div>
      `;
    default:
      return '';
  }
};

/**
 * Delete a content item
 * @param {string} id Item ID
 */
ContentManagerComponent.prototype.deleteContentItem = function(id) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>Confirm Deletion</h3>
        <button class="close-button">&times;</button>
      </div>
      <div class="modal-body">
        <p>Are you sure you want to delete this ${this.currentType}?</p>
        <p>This action cannot be undone.</p>
        <div class="modal-actions">
          <button class="button secondary cancel-button">Cancel</button>
          <button class="button danger confirm-delete-button">Delete</button>
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
  
  const cancelButton = modal.querySelector('.cancel-button');
  if (cancelButton) {
    cancelButton.addEventListener('click', () => {
      this.closeModal(modal);
    });
  }
  
  const confirmButton = modal.querySelector('.confirm-delete-button');
  if (confirmButton) {
    confirmButton.addEventListener('click', async () => {
      try {
        await window.mcpClient.deleteUORObject(id);
        
        this.closeModal(modal);
        
        showMessage(`${this.currentType.charAt(0).toUpperCase() + this.currentType.slice(1)} deleted successfully`, 'success');
        
        this.loadContent();
      } catch (error) {
        console.error('Error deleting object:', error);
        showMessage(`Error deleting object: ${error.message}`, 'error');
        this.closeModal(modal);
      }
    });
  }
};
