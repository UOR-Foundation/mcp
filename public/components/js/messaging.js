/**
 * Messaging Interface Component
 * Provides enhanced messaging interface for UOR users
 */

class MessagingComponent {
  constructor() {
    this.container = null;
    this.initialized = false;
    this.currentThreadId = null;
    this.threads = [];
    this.messages = [];
    this.pollingInterval = null;
    this.composerAttachments = [];
  }
  
  /**
   * Initialize the messaging component
   * @param {HTMLElement} container Container element
   */
  initialize(container) {
    this.container = container;
    this.render();
    this.bindEvents();
    this.initialized = true;
    
    this.startPolling();
    
    this.loadThreads();
  }
  
  /**
   * Render the messaging interface
   */
  render() {
    if (!this.container) return;
    
    this.container.innerHTML = `
      <div class="messaging-header">
        <h2>Messaging</h2>
        <div class="messaging-actions">
          <button id="new-thread-button" class="button primary">
            <span class="icon">✉️</span> New Message
          </button>
        </div>
      </div>
      
      <div class="messaging-container">
        <div class="thread-sidebar">
          <div class="thread-search">
            <input type="text" id="thread-search" class="thread-search-input" placeholder="Search threads...">
          </div>
          
          <div id="thread-list" class="thread-list">
            <div id="thread-loading" class="loading-indicator">
              <p>Loading threads...</p>
            </div>
          </div>
          
          <div class="thread-actions">
            <button id="refresh-threads-button" class="button secondary">
              <span class="icon">🔄</span> Refresh
            </button>
          </div>
        </div>
        
        <div id="message-container" class="message-container">
          <div id="empty-message-state" class="empty-state">
            <div class="empty-state-icon">💬</div>
            <h3 class="empty-state-title">No Thread Selected</h3>
            <p class="empty-state-text">Select a thread from the sidebar or create a new message.</p>
            <button id="empty-new-thread-button" class="button primary">
              <span class="icon">✉️</span> New Message
            </button>
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
    
    const newThreadButton = this.container.querySelector('#new-thread-button');
    if (newThreadButton) {
      newThreadButton.addEventListener('click', () => {
        this.showNewThreadModal();
      });
    }
    
    const emptyNewThreadButton = this.container.querySelector('#empty-new-thread-button');
    if (emptyNewThreadButton) {
      emptyNewThreadButton.addEventListener('click', () => {
        this.showNewThreadModal();
      });
    }
    
    const threadSearch = this.container.querySelector('#thread-search');
    if (threadSearch) {
      threadSearch.addEventListener('input', () => {
        this.filterThreads(threadSearch.value);
      });
    }
    
    const refreshThreadsButton = this.container.querySelector('#refresh-threads-button');
    if (refreshThreadsButton) {
      refreshThreadsButton.addEventListener('click', () => {
        this.loadThreads();
      });
    }
  }
  
  /**
   * Start polling for new messages
   */
  startPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
    
    this.pollingInterval = setInterval(() => {
      if (window.authService && window.authService.isAuthenticated()) {
        this.loadThreads(true);
        
        if (this.currentThreadId) {
          this.loadMessages(this.currentThreadId, true);
        }
      }
    }, 10000);
  }
  
  /**
   * Stop polling for new messages
   */
  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }
  
  /**
   * Load threads from the server
   * @param {boolean} silent Whether to show loading indicator
   */
  async loadThreads(silent = false) {
    if (!this.container) return;
    
    const threadList = this.container.querySelector('#thread-list');
    const threadLoading = this.container.querySelector('#thread-loading');
    
    if (!threadList || !threadLoading) return;
    
    if (!silent) {
      threadLoading.style.display = 'flex';
      threadList.innerHTML = '';
    }
    
    try {
      if (!window.authService || !window.authService.isAuthenticated()) {
        threadList.innerHTML = `
          <div class="auth-required">
            <p>You need to authenticate with GitHub to view your messages.</p>
            <button id="messaging-auth-button" class="button primary">Authenticate</button>
          </div>
        `;
        
        const authButton = threadList.querySelector('#messaging-auth-button');
        if (authButton) {
          authButton.addEventListener('click', () => {
            const mainAuthButton = document.getElementById('github-auth-button');
            if (mainAuthButton) {
              mainAuthButton.click();
            }
          });
        }
        
        if (threadLoading) {
          threadLoading.style.display = 'none';
        }
        return;
      }
      
      const threads = await window.mcpClient.getThreads();
      this.threads = threads || [];
      
      if (threadLoading) {
        threadLoading.style.display = 'none';
      }
      
      this.renderThreads();
      
    } catch (error) {
      console.error('Error loading threads:', error);
      
      if (threadLoading) {
        threadLoading.style.display = 'none';
      }
      
      threadList.innerHTML = `
        <div class="error-message">
          <p>Error: ${error.message}</p>
          <button id="retry-threads-button" class="button secondary">Retry</button>
        </div>
      `;
      
      const retryButton = threadList.querySelector('#retry-threads-button');
      if (retryButton) {
        retryButton.addEventListener('click', () => {
          this.loadThreads();
        });
      }
    }
  }
  
  /**
   * Render threads in the sidebar
   */
  renderThreads() {
    if (!this.container) return;
    
    const threadList = this.container.querySelector('#thread-list');
    if (!threadList) return;
    
    if (this.threads.length === 0) {
      threadList.innerHTML = `
        <div class="empty-state">
          <p>No threads found.</p>
          <button id="thread-list-new-button" class="button secondary">New Message</button>
        </div>
      `;
      
      const newButton = threadList.querySelector('#thread-list-new-button');
      if (newButton) {
        newButton.addEventListener('click', () => {
          this.showNewThreadModal();
        });
      }
      
      return;
    }
    
    const sortedThreads = [...this.threads].sort((a, b) => {
      return new Date(b.lastMessageTime) - new Date(a.lastMessageTime);
    });
    
    threadList.innerHTML = sortedThreads.map(thread => {
      const isActive = thread.id === this.currentThreadId;
      const isUnread = thread.unreadCount > 0;
      const lastMessageTime = new Date(thread.lastMessageTime).toLocaleString();
      
      return `
        <div class="thread-item ${isActive ? 'active' : ''} ${isUnread ? 'unread' : ''}" data-id="${thread.id}">
          <div class="thread-item-header">
            <h4 class="thread-item-title">${thread.title || 'No Subject'}</h4>
            <span class="thread-item-time">${lastMessageTime}</span>
          </div>
          <div class="thread-item-preview">${thread.lastMessage || 'No messages'}</div>
          <div class="thread-item-meta">
            <span class="thread-item-participants">${thread.participants.join(', ')}</span>
            ${isUnread ? `<span class="thread-item-count">${thread.unreadCount}</span>` : ''}
          </div>
        </div>
      `;
    }).join('');
    
    const threadItems = threadList.querySelectorAll('.thread-item');
    threadItems.forEach(item => {
      item.addEventListener('click', () => {
        const threadId = item.getAttribute('data-id');
        this.selectThread(threadId);
      });
    });
  }
  
  /**
   * Filter threads by search query
   * @param {string} query Search query
   */
  filterThreads(query) {
    if (!this.container) return;
    
    const threadItems = this.container.querySelectorAll('.thread-item');
    const normalizedQuery = query.toLowerCase().trim();
    
    threadItems.forEach(item => {
      const title = item.querySelector('.thread-item-title').textContent.toLowerCase();
      const preview = item.querySelector('.thread-item-preview').textContent.toLowerCase();
      const participants = item.querySelector('.thread-item-participants').textContent.toLowerCase();
      
      const matches = title.includes(normalizedQuery) || 
                      preview.includes(normalizedQuery) || 
                      participants.includes(normalizedQuery);
      
      item.style.display = matches ? 'block' : 'none';
    });
  }
  
  /**
   * Select a thread and load its messages
   * @param {string} threadId Thread ID
   */
  selectThread(threadId) {
    if (this.currentThreadId === threadId) return;
    
    this.currentThreadId = threadId;
    
    const threadItems = this.container.querySelectorAll('.thread-item');
    threadItems.forEach(item => {
      const itemId = item.getAttribute('data-id');
      item.classList.toggle('active', itemId === threadId);
    });
    
    this.loadMessages(threadId);
  }
  
  /**
   * Load messages for a thread
   * @param {string} threadId Thread ID
   * @param {boolean} silent Whether to show loading indicator
   */
  async loadMessages(threadId, silent = false) {
    if (!this.container) return;
    
    const messageContainer = this.container.querySelector('#message-container');
    if (!messageContainer) return;
    
    if (!silent) {
      messageContainer.innerHTML = `
        <div class="loading-indicator">
          <p>Loading messages...</p>
        </div>
      `;
    }
    
    try {
      const thread = this.threads.find(t => t.id === threadId);
      if (!thread) {
        throw new Error('Thread not found');
      }
      
      const messages = await window.mcpClient.getMessages(threadId);
      this.messages = messages || [];
      
      if (thread.unreadCount > 0) {
        await window.mcpClient.markThreadAsRead(threadId);
        
        thread.unreadCount = 0;
        
        this.renderThreads();
      }
      
      this.renderMessages(thread);
      
    } catch (error) {
      console.error('Error loading messages:', error);
      
      messageContainer.innerHTML = `
        <div class="error-message">
          <p>Error: ${error.message}</p>
          <button id="retry-messages-button" class="button secondary">Retry</button>
        </div>
      `;
      
      const retryButton = messageContainer.querySelector('#retry-messages-button');
      if (retryButton) {
        retryButton.addEventListener('click', () => {
          this.loadMessages(threadId);
        });
      }
    }
  }
  
  /**
   * Render messages for a thread
   * @param {Object} thread Thread object
   */
  renderMessages(thread) {
    if (!this.container) return;
    
    const messageContainer = this.container.querySelector('#message-container');
    if (!messageContainer) return;
    
    messageContainer.innerHTML = `
      <div class="message-header">
        <div>
          <h3 class="message-title">${thread.title || 'No Subject'}</h3>
          <div class="message-participants">
            ${thread.participants.join(', ')}
          </div>
        </div>
        <div class="message-header-actions">
          <button id="thread-options-button" class="button secondary">
            <span class="icon">⚙️</span>
          </button>
        </div>
      </div>
      
      <div id="message-list" class="message-list">
        ${this.renderMessageItems()}
      </div>
      
      <div class="message-composer">
        <div class="composer-container">
          <textarea id="composer-input" class="composer-input" placeholder="Type your message..."></textarea>
          <div class="composer-toolbar">
            <div class="composer-actions">
              <button id="attach-file-button" class="composer-button">
                <span class="icon">📎</span>
              </button>
              <button id="emoji-button" class="composer-button">
                <span class="icon">😊</span>
              </button>
            </div>
            <div class="composer-send">
              <button id="send-message-button" class="button primary">
                <span class="icon">📤</span> Send
              </button>
            </div>
          </div>
        </div>
        <div id="attachment-preview" class="attachment-preview"></div>
      </div>
    `;
    
    const messageList = messageContainer.querySelector('#message-list');
    if (messageList) {
      messageList.scrollTop = messageList.scrollHeight;
    }
    
    this.bindMessageEvents();
  }
  
  /**
   * Render message items
   * @returns {string} HTML for message items
   */
  renderMessageItems() {
    if (this.messages.length === 0) {
      return `
        <div class="empty-state">
          <p>No messages in this thread yet.</p>
          <p>Type a message below to start the conversation.</p>
        </div>
      `;
    }
    
    const messagesByDate = {};
    this.messages.forEach(message => {
      const date = new Date(message.timestamp).toLocaleDateString();
      if (!messagesByDate[date]) {
        messagesByDate[date] = [];
      }
      messagesByDate[date].push(message);
    });
    
    let html = '';
    Object.keys(messagesByDate).forEach(date => {
      html += `<div class="message-date-separator">${date}</div>`;
      
      messagesByDate[date].forEach(message => {
        const isOutgoing = message.sender === window.authService.getCurrentUser().username;
        const time = new Date(message.timestamp).toLocaleTimeString();
        
        html += `
          <div class="message-item ${isOutgoing ? 'outgoing' : ''}" data-id="${message.id}">
            <div class="message-avatar">
              ${message.sender.charAt(0).toUpperCase()}
            </div>
            <div class="message-content">
              <div class="message-bubble-arrow"></div>
              <div class="message-sender">${message.sender}</div>
              <p class="message-text">${message.content}</p>
              ${message.attachments && message.attachments.length > 0 ? `
                <div class="message-attachments">
                  ${message.attachments.map(attachment => `
                    <a href="${attachment.url}" target="_blank" class="message-attachment">
                      <span class="icon">📎</span> ${attachment.name}
                    </a>
                  `).join('')}
                </div>
              ` : ''}
              <div class="message-time">${time}</div>
              ${isOutgoing ? `
                <div class="message-status ${message.read ? 'read' : message.delivered ? 'delivered' : ''}">
                  ${message.read ? 'Read' : message.delivered ? 'Delivered' : 'Sent'}
                </div>
              ` : ''}
            </div>
          </div>
        `;
      });
    });
    
    return html;
  }
  
  /**
   * Bind message-specific event handlers
   */
  bindMessageEvents() {
    if (!this.container) return;
    
    const messageContainer = this.container.querySelector('#message-container');
    if (!messageContainer) return;
    
    const optionsButton = messageContainer.querySelector('#thread-options-button');
    if (optionsButton) {
      optionsButton.addEventListener('click', () => {
        this.showThreadOptionsMenu();
      });
    }
    
    const sendButton = messageContainer.querySelector('#send-message-button');
    const composerInput = messageContainer.querySelector('#composer-input');
    
    if (sendButton && composerInput) {
      sendButton.addEventListener('click', () => {
        this.sendMessage(composerInput.value);
      });
      
      composerInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          this.sendMessage(composerInput.value);
        }
      });
    }
    
    const attachButton = messageContainer.querySelector('#attach-file-button');
    if (attachButton) {
      attachButton.addEventListener('click', () => {
        this.showAttachFileDialog();
      });
    }
    
    const emojiButton = messageContainer.querySelector('#emoji-button');
    if (emojiButton) {
      emojiButton.addEventListener('click', () => {
        this.showEmojiPicker();
      });
    }
  }
  
  /**
   * Send a message
   * @param {string} content Message content
   */
  async sendMessage(content) {
    if (!content || content.trim() === '') return;
    
    if (!this.currentThreadId) {
      showMessage('No thread selected', 'error');
      return;
    }
    
    const composerInput = this.container.querySelector('#composer-input');
    if (!composerInput) return;
    
    try {
      composerInput.value = '';
      
      const message = {
        threadId: this.currentThreadId,
        content: content.trim(),
        attachments: this.composerAttachments
      };
      
      await window.mcpClient.sendMessage(message);
      
      this.composerAttachments = [];
      const attachmentPreview = this.container.querySelector('#attachment-preview');
      if (attachmentPreview) {
        attachmentPreview.innerHTML = '';
      }
      
      this.loadMessages(this.currentThreadId);
      
      this.loadThreads(true);
      
    } catch (error) {
      console.error('Error sending message:', error);
      showMessage(`Error sending message: ${error.message}`, 'error');
    }
  }
  
  /**
   * Show new thread modal
   */
  showNewThreadModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>New Message</h3>
          <button class="close-button">&times;</button>
        </div>
        <div class="modal-body">
          <form id="new-thread-form">
            <div class="form-group">
              <label for="thread-recipients">To (comma separated usernames)</label>
              <input type="text" id="thread-recipients" required>
            </div>
            <div class="form-group">
              <label for="thread-subject">Subject</label>
              <input type="text" id="thread-subject" required>
            </div>
            <div class="form-group">
              <label for="thread-message">Message</label>
              <textarea id="thread-message" rows="4" required></textarea>
            </div>
            <div class="form-actions">
              <button type="button" class="button secondary cancel-button">Cancel</button>
              <button type="submit" class="button primary">Send</button>
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
    
    const form = modal.querySelector('#new-thread-form');
    if (form) {
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const recipientsInput = form.querySelector('#thread-recipients');
        const subjectInput = form.querySelector('#thread-subject');
        const messageInput = form.querySelector('#thread-message');
        
        if (!recipientsInput || !subjectInput || !messageInput) return;
        
        try {
          const thread = {
            recipients: recipientsInput.value.split(',').map(r => r.trim()),
            subject: subjectInput.value.trim(),
            message: messageInput.value.trim()
          };
          
          const newThread = await window.mcpClient.createThread(thread);
          
          this.closeModal(modal);
          
          showMessage('Thread created successfully', 'success');
          
          await this.loadThreads();
          
          if (newThread && newThread.id) {
            this.selectThread(newThread.id);
          }
          
        } catch (error) {
          console.error('Error creating thread:', error);
          showMessage(`Error creating thread: ${error.message}`, 'error');
        }
      });
    }
  }
  
  /**
   * Show thread options menu
   */
  showThreadOptionsMenu() {
    if (!this.currentThreadId) return;
    
    const thread = this.threads.find(t => t.id === this.currentThreadId);
    if (!thread) return;
    
    const optionsButton = this.container.querySelector('#thread-options-button');
    if (!optionsButton) return;
    
    const menu = document.createElement('div');
    menu.className = 'dropdown-menu';
    menu.innerHTML = `
      <ul class="dropdown-list">
        <li class="dropdown-item" id="mute-thread-option">
          ${thread.muted ? 'Unmute Thread' : 'Mute Thread'}
        </li>
        <li class="dropdown-item" id="add-participant-option">
          Add Participant
        </li>
        <li class="dropdown-item" id="leave-thread-option">
          Leave Thread
        </li>
        <li class="dropdown-item danger" id="delete-thread-option">
          Delete Thread
        </li>
      </ul>
    `;
    
    const rect = optionsButton.getBoundingClientRect();
    menu.style.position = 'absolute';
    menu.style.top = `${rect.bottom + window.scrollY}px`;
    menu.style.right = `${window.innerWidth - rect.right - window.scrollX}px`;
    
    document.body.appendChild(menu);
    
    const muteOption = menu.querySelector('#mute-thread-option');
    if (muteOption) {
      muteOption.addEventListener('click', () => {
        this.toggleMuteThread(thread);
        document.body.removeChild(menu);
      });
    }
    
    const addParticipantOption = menu.querySelector('#add-participant-option');
    if (addParticipantOption) {
      addParticipantOption.addEventListener('click', () => {
        this.showAddParticipantModal(thread);
        document.body.removeChild(menu);
      });
    }
    
    const leaveOption = menu.querySelector('#leave-thread-option');
    if (leaveOption) {
      leaveOption.addEventListener('click', () => {
        this.leaveThread(thread);
        document.body.removeChild(menu);
      });
    }
    
    const deleteOption = menu.querySelector('#delete-thread-option');
    if (deleteOption) {
      deleteOption.addEventListener('click', () => {
        this.deleteThread(thread);
        document.body.removeChild(menu);
      });
    }
    
    const closeMenu = (event) => {
      if (!menu.contains(event.target) && event.target !== optionsButton) {
        document.body.removeChild(menu);
        document.removeEventListener('click', closeMenu);
      }
    };
    
    setTimeout(() => {
      document.addEventListener('click', closeMenu);
    }, 100);
  }
  
  /**
   * Toggle mute status for a thread
   * @param {Object} thread Thread object
   */
  async toggleMuteThread(thread) {
    try {
      await window.mcpClient.toggleMuteThread(thread.id);
      
      thread.muted = !thread.muted;
      
      showMessage(`Thread ${thread.muted ? 'muted' : 'unmuted'} successfully`, 'success');
      
    } catch (error) {
      console.error('Error toggling mute status:', error);
      showMessage(`Error: ${error.message}`, 'error');
    }
  }
  
  /**
   * Show modal to add participant to thread
   * @param {Object} thread Thread object
   */
  showAddParticipantModal(thread) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Add Participant</h3>
          <button class="close-button">&times;</button>
        </div>
        <div class="modal-body">
          <form id="add-participant-form">
            <div class="form-group">
              <label for="participant-username">Username</label>
              <input type="text" id="participant-username" required>
            </div>
            <div class="form-actions">
              <button type="button" class="button secondary cancel-button">Cancel</button>
              <button type="submit" class="button primary">Add</button>
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
    
    const form = modal.querySelector('#add-participant-form');
    if (form) {
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const usernameInput = form.querySelector('#participant-username');
        if (!usernameInput) return;
        
        const username = usernameInput.value.trim();
        
        try {
          await window.mcpClient.addThreadParticipant(thread.id, username);
          
          this.closeModal(modal);
          
          showMessage(`${username} added to thread`, 'success');
          
          this.loadMessages(thread.id);
          
        } catch (error) {
          console.error('Error adding participant:', error);
          showMessage(`Error: ${error.message}`, 'error');
        }
      });
    }
  }
  
  /**
   * Leave a thread
   * @param {Object} thread Thread object
   */
  async leaveThread(thread) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Leave Thread</h3>
          <button class="close-button">&times;</button>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to leave this thread?</p>
          <p>You will no longer receive messages from this conversation.</p>
          <div class="modal-actions">
            <button class="button secondary cancel-button">Cancel</button>
            <button class="button danger confirm-button">Leave Thread</button>
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
          await window.mcpClient.leaveThread(thread.id);
          
          this.closeModal(modal);
          
          showMessage('You have left the thread', 'success');
          
          this.loadThreads();
          
          this.currentThreadId = null;
          
          const messageContainer = this.container.querySelector('#message-container');
          if (messageContainer) {
            messageContainer.innerHTML = `
              <div class="empty-state">
                <div class="empty-state-icon">💬</div>
                <h3 class="empty-state-title">No Thread Selected</h3>
                <p class="empty-state-text">Select a thread from the sidebar or create a new message.</p>
                <button id="empty-new-thread-button" class="button primary">
                  <span class="icon">✉️</span> New Message
                </button>
              </div>
            `;
            
            const newThreadButton = messageContainer.querySelector('#empty-new-thread-button');
            if (newThreadButton) {
              newThreadButton.addEventListener('click', () => {
                this.showNewThreadModal();
              });
            }
          }
          
        } catch (error) {
          console.error('Error leaving thread:', error);
          showMessage(`Error: ${error.message}`, 'error');
          this.closeModal(modal);
        }
      });
    }
  }
  
  /**
   * Delete a thread
   * @param {Object} thread Thread object
   */
  async deleteThread(thread) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Delete Thread</h3>
          <button class="close-button">&times;</button>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to delete this thread?</p>
          <p>This action cannot be undone and will remove the thread for all participants.</p>
          <div class="modal-actions">
            <button class="button secondary cancel-button">Cancel</button>
            <button class="button danger confirm-button">Delete Thread</button>
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
          await window.mcpClient.deleteThread(thread.id);
          
          this.closeModal(modal);
          
          showMessage('Thread deleted successfully', 'success');
          
          this.loadThreads();
          
          this.currentThreadId = null;
          
          const messageContainer = this.container.querySelector('#message-container');
          if (messageContainer) {
            messageContainer.innerHTML = `
              <div class="empty-state">
                <div class="empty-state-icon">💬</div>
                <h3 class="empty-state-title">No Thread Selected</h3>
                <p class="empty-state-text">Select a thread from the sidebar or create a new message.</p>
                <button id="empty-new-thread-button" class="button primary">
                  <span class="icon">✉️</span> New Message
                </button>
              </div>
            `;
            
            const newThreadButton = messageContainer.querySelector('#empty-new-thread-button');
            if (newThreadButton) {
              newThreadButton.addEventListener('click', () => {
                this.showNewThreadModal();
              });
            }
          }
          
        } catch (error) {
          console.error('Error deleting thread:', error);
          showMessage(`Error: ${error.message}`, 'error');
          this.closeModal(modal);
        }
      });
    }
  }
  
  /**
   * Show attach file dialog
   */
  showAttachFileDialog() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true;
    
    fileInput.addEventListener('change', (event) => {
      const files = event.target.files;
      if (!files || files.length === 0) return;
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        this.composerAttachments.push({
          name: file.name,
          type: file.type,
          size: file.size,
          data: file
        });
      }
      
      this.updateAttachmentPreview();
    });
    
    fileInput.click();
  }
  
  /**
   * Update attachment preview
   */
  updateAttachmentPreview() {
    const attachmentPreview = this.container.querySelector('#attachment-preview');
    if (!attachmentPreview) return;
    
    if (this.composerAttachments.length === 0) {
      attachmentPreview.innerHTML = '';
      return;
    }
    
    attachmentPreview.innerHTML = `
      <div class="attachment-list">
        ${this.composerAttachments.map((attachment, index) => `
          <div class="attachment-item">
            <span class="attachment-name">${attachment.name}</span>
            <span class="attachment-size">(${this.formatFileSize(attachment.size)})</span>
            <button class="attachment-remove" data-index="${index}">×</button>
          </div>
        `).join('')}
      </div>
    `;
    
    const removeButtons = attachmentPreview.querySelectorAll('.attachment-remove');
    removeButtons.forEach(button => {
      button.addEventListener('click', () => {
        const index = parseInt(button.getAttribute('data-index'), 10);
        this.composerAttachments.splice(index, 1);
        this.updateAttachmentPreview();
      });
    });
  }
  
  /**
   * Format file size
   * @param {number} bytes File size in bytes
   * @returns {string} Formatted file size
   */
  formatFileSize(bytes) {
    if (bytes < 1024) {
      return bytes + ' B';
    } else if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(1) + ' KB';
    } else if (bytes < 1024 * 1024 * 1024) {
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    } else {
      return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
    }
  }
  
  /**
   * Show emoji picker
   */
  showEmojiPicker() {
    const picker = document.createElement('div');
    picker.className = 'emoji-picker';
    
    const emojis = ['😊', '😂', '❤️', '👍', '🎉', '🔥', '😎', '🤔', '😢', '😡', '🙏', '👋', '🤝', '👀', '💯', '✅', '❌', '⭐', '💡', '📝'];
    
    picker.innerHTML = `
      <div class="emoji-grid">
        ${emojis.map(emoji => `
          <div class="emoji-item" data-emoji="${emoji}">${emoji}</div>
        `).join('')}
      </div>
    `;
    
    const emojiButton = this.container.querySelector('#emoji-button');
    if (!emojiButton) return;
    
    const rect = emojiButton.getBoundingClientRect();
    picker.style.position = 'absolute';
    picker.style.bottom = `${window.innerHeight - rect.top + window.scrollY}px`;
    picker.style.left = `${rect.left + window.scrollX}px`;
    
    document.body.appendChild(picker);
    
    const emojiItems = picker.querySelectorAll('.emoji-item');
    emojiItems.forEach(item => {
      item.addEventListener('click', () => {
        const emoji = item.getAttribute('data-emoji');
        const composerInput = this.container.querySelector('#composer-input');
        if (composerInput) {
          const start = composerInput.selectionStart;
          const end = composerInput.selectionEnd;
          const text = composerInput.value;
          composerInput.value = text.substring(0, start) + emoji + text.substring(end);
          
          composerInput.selectionStart = composerInput.selectionEnd = start + emoji.length;
          
          composerInput.focus();
        }
        
        document.body.removeChild(picker);
      });
    });
    
    const closePicker = (event) => {
      if (!picker.contains(event.target) && event.target !== emojiButton) {
        document.body.removeChild(picker);
        document.removeEventListener('click', closePicker);
      }
    };
    
    setTimeout(() => {
      document.addEventListener('click', closePicker);
    }, 100);
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
   * @param {boolean} isAuthenticated Whether the user is authenticated
   */
  updateAuthState(isAuthenticated) {
    if (isAuthenticated) {
      this.loadThreads();
    } else {
      this.threads = [];
      this.currentThreadId = null;
      
      const threadList = this.container.querySelector('#thread-list');
      if (threadList) {
        threadList.innerHTML = `
          <div class="auth-required">
            <p>You need to authenticate with GitHub to view your messages.</p>
            <button id="messaging-auth-button" class="button primary">Authenticate</button>
          </div>
        `;
        
        const authButton = threadList.querySelector('#messaging-auth-button');
        if (authButton) {
          authButton.addEventListener('click', () => {
            const mainAuthButton = document.getElementById('github-auth-button');
            if (mainAuthButton) {
              mainAuthButton.click();
            }
          });
        }
      }
      
      const messageContainer = this.container.querySelector('#message-container');
      if (messageContainer) {
        messageContainer.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">💬</div>
            <h3 class="empty-state-title">No Thread Selected</h3>
            <p class="empty-state-text">Select a thread from the sidebar or create a new message.</p>
            <button id="empty-new-thread-button" class="button primary">
              <span class="icon">✉️</span> New Message
            </button>
          </div>
        `;
        
        const newThreadButton = messageContainer.querySelector('#empty-new-thread-button');
        if (newThreadButton) {
          newThreadButton.addEventListener('click', () => {
            this.showNewThreadModal();
          });
        }
      }
    }
  }
}

window.MessagingComponent = new MessagingComponent();
