/**
 * Profile Management Component - Modals
 * Modal dialog functionality for the profile management component
 */

/**
 * Show modal to change avatar
 */
ProfileManagementComponent.prototype.changeAvatar = function() {
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  
  fileInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
      await window.mcpClient.uploadAvatar(file);
      
      showMessage('Avatar updated successfully', 'success');
      
      this.loadProfileData();
      
    } catch (error) {
      console.error('Error uploading avatar:', error);
      showMessage(`Error uploading avatar: ${error.message}`, 'error');
    }
  });
  
  fileInput.click();
};

/**
 * Show modal to add a connection
 */
ProfileManagementComponent.prototype.showAddConnectionModal = function() {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>Add Connection</h3>
        <button class="close-button">&times;</button>
      </div>
      <div class="modal-body">
        <form id="add-connection-form">
          <div class="form-group">
            <label for="connection-username">Username</label>
            <input type="text" id="connection-username" required>
          </div>
          <div class="form-group">
            <label for="connection-message">Message (optional)</label>
            <textarea id="connection-message" rows="3"></textarea>
          </div>
          <div class="form-actions">
            <button type="button" class="button secondary cancel-button">Cancel</button>
            <button type="submit" class="button primary">Send Request</button>
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
  
  const form = modal.querySelector('#add-connection-form');
  if (form) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      
      const usernameInput = form.querySelector('#connection-username');
      const messageInput = form.querySelector('#connection-message');
      
      if (!usernameInput) return;
      
      const username = usernameInput.value.trim();
      const message = messageInput ? messageInput.value.trim() : '';
      
      try {
        await window.mcpClient.sendConnectionRequest(username, message);
        
        this.closeModal(modal);
        
        showMessage(`Connection request sent to ${username}`, 'success');
        
        this.loadProfileData();
        
      } catch (error) {
        console.error('Error sending connection request:', error);
        showMessage(`Error: ${error.message}`, 'error');
      }
    });
  }
};

/**
 * Show confirmation modal to remove a connection
 * @param {string} connectionId Connection ID
 */
ProfileManagementComponent.prototype.showRemoveConnectionConfirmation = function(connectionId) {
  const connection = this.connections.find(c => c.id === connectionId);
  if (!connection) return;
  
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>Remove Connection</h3>
        <button class="close-button">&times;</button>
      </div>
      <div class="modal-body">
        <p>Are you sure you want to remove ${connection.displayName || connection.username} from your connections?</p>
        <div class="modal-actions">
          <button class="button secondary cancel-button">Cancel</button>
          <button class="button danger confirm-button">Remove Connection</button>
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
  
  const confirmButton = modal.querySelector('.confirm-button');
  if (confirmButton) {
    confirmButton.addEventListener('click', async () => {
      try {
        await window.mcpClient.removeConnection(connectionId);
        
        this.closeModal(modal);
        
        showMessage('Connection removed successfully', 'success');
        
        this.loadProfileData();
        
      } catch (error) {
        console.error('Error removing connection:', error);
        showMessage(`Error: ${error.message}`, 'error');
        this.closeModal(modal);
      }
    });
  }
};

/**
 * Show modal to add a namespace resolver
 */
ProfileManagementComponent.prototype.showAddResolverModal = function() {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>Add Namespace Resolver</h3>
        <button class="close-button">&times;</button>
      </div>
      <div class="modal-body">
        <form id="add-resolver-form">
          <div class="form-group">
            <label for="resolver-source">Source Namespace</label>
            <input type="text" id="resolver-source" required>
          </div>
          <div class="form-group">
            <label for="resolver-target">Target Namespace</label>
            <input type="text" id="resolver-target" required>
          </div>
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" id="resolver-bidirectional">
              Bidirectional (resolve in both directions)
            </label>
          </div>
          <div class="form-actions">
            <button type="button" class="button secondary cancel-button">Cancel</button>
            <button type="submit" class="button primary">Add Resolver</button>
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
  
  const form = modal.querySelector('#add-resolver-form');
  if (form) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      
      const sourceInput = form.querySelector('#resolver-source');
      const targetInput = form.querySelector('#resolver-target');
      const bidirectionalInput = form.querySelector('#resolver-bidirectional');
      
      if (!sourceInput || !targetInput) return;
      
      const source = sourceInput.value.trim();
      const target = targetInput.value.trim();
      const bidirectional = bidirectionalInput ? bidirectionalInput.checked : false;
      
      try {
        await window.mcpClient.addNamespaceResolver({
          source,
          target,
          bidirectional
        });
        
        this.closeModal(modal);
        
        showMessage('Namespace resolver added successfully', 'success');
        
        this.loadProfileData();
        
      } catch (error) {
        console.error('Error adding namespace resolver:', error);
        showMessage(`Error: ${error.message}`, 'error');
      }
    });
  }
};

/**
 * Show confirmation modal to remove a namespace resolver
 * @param {string} resolverId Resolver ID
 */
ProfileManagementComponent.prototype.showRemoveResolverConfirmation = function(resolverId) {
  const resolver = this.profileData.resolvers.find(r => r.id === resolverId);
  if (!resolver) return;
  
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>Remove Namespace Resolver</h3>
        <button class="close-button">&times;</button>
      </div>
      <div class="modal-body">
        <p>Are you sure you want to remove the resolver from ${resolver.source} to ${resolver.target}?</p>
        <p>This may affect UOR resolution across namespaces.</p>
        <div class="modal-actions">
          <button class="button secondary cancel-button">Cancel</button>
          <button class="button danger confirm-button">Remove Resolver</button>
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
  
  const confirmButton = modal.querySelector('.confirm-button');
  if (confirmButton) {
    confirmButton.addEventListener('click', async () => {
      try {
        await window.mcpClient.removeNamespaceResolver(resolverId);
        
        this.closeModal(modal);
        
        showMessage('Namespace resolver removed successfully', 'success');
        
        this.loadProfileData();
        
      } catch (error) {
        console.error('Error removing namespace resolver:', error);
        showMessage(`Error: ${error.message}`, 'error');
        this.closeModal(modal);
      }
    });
  }
};

/**
 * Show confirmation modal to revoke GitHub token
 */
ProfileManagementComponent.prototype.showRevokeTokenConfirmation = function() {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>Revoke GitHub Token</h3>
        <button class="close-button">&times;</button>
      </div>
      <div class="modal-body">
        <p>Are you sure you want to revoke your GitHub access token?</p>
        <p>This will disconnect your account from GitHub and you will need to re-authenticate.</p>
        <div class="modal-actions">
          <button class="button secondary cancel-button">Cancel</button>
          <button class="button danger confirm-button">Revoke Token</button>
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
  
  const confirmButton = modal.querySelector('.confirm-button');
  if (confirmButton) {
    confirmButton.addEventListener('click', async () => {
      try {
        await window.authService.revokeToken();
        
        this.closeModal(modal);
        
        showMessage('GitHub token revoked successfully', 'success');
        
        this.loadProfileData();
        
      } catch (error) {
        console.error('Error revoking token:', error);
        showMessage(`Error: ${error.message}`, 'error');
        this.closeModal(modal);
      }
    });
  }
};

/**
 * Show confirmation modal to delete account
 */
ProfileManagementComponent.prototype.showDeleteAccountConfirmation = function() {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>Delete Account</h3>
        <button class="close-button">&times;</button>
      </div>
      <div class="modal-body">
        <p>Are you sure you want to permanently delete your account?</p>
        <p>This action cannot be undone and will remove all your data from the UOR system.</p>
        <div class="form-group">
          <label for="delete-confirmation">Type "DELETE" to confirm</label>
          <input type="text" id="delete-confirmation" required>
        </div>
        <div class="modal-actions">
          <button class="button secondary cancel-button">Cancel</button>
          <button class="button danger confirm-button" disabled>Delete Account</button>
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
  
  const confirmationInput = modal.querySelector('#delete-confirmation');
  const confirmButton = modal.querySelector('.confirm-button');
  
  if (confirmationInput && confirmButton) {
    confirmationInput.addEventListener('input', () => {
      confirmButton.disabled = confirmationInput.value !== 'DELETE';
    });
  }
  
  if (confirmButton) {
    confirmButton.addEventListener('click', async () => {
      try {
        await window.mcpClient.deleteAccount();
        
        this.closeModal(modal);
        
        showMessage('Your account has been deleted successfully', 'success');
        
        await window.authService.logout();
        
        window.location.href = '/';
        
      } catch (error) {
        console.error('Error deleting account:', error);
        showMessage(`Error: ${error.message}`, 'error');
        this.closeModal(modal);
      }
    });
  }
};
