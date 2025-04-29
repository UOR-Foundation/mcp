/**
 * Content Management Interface Component
 * Provides enhanced interface for managing UOR content objects
 */

class ContentManagerComponent {
  constructor() {
    this.container = null;
    this.initialized = false;
    this.currentType = 'concept';
    this.currentObjects = [];
    this.currentView = 'grid'; // 'grid' or 'list'
    this.searchQuery = '';
    this.filterCriteria = {};
    this.sortField = 'updatedAt';
    this.sortDirection = 'desc';
    this.currentPage = 1;
    this.pageSize = 12;
    this.totalPages = 1;
  }
  
  /**
   * Initialize the content manager component
   * @param {HTMLElement} container Container element
   */
  initialize(container) {
    this.container = container;
    this.render();
    this.bindEvents();
    this.initialized = true;
    
    this.loadContent();
  }
  
  /**
   * Render the content manager
   */
  render() {
    if (!this.container) return;
    
    this.container.innerHTML = `
      <div class="content-manager-header">
        <h2>Content Management</h2>
        <div class="content-manager-actions">
          <div class="search-container">
            <input type="text" id="content-search" class="search-input" placeholder="Search content...">
            <button id="search-button" class="button secondary">
              <span class="icon">🔍</span>
            </button>
          </div>
          <div class="view-toggle">
            <button id="grid-view-button" class="view-button ${this.currentView === 'grid' ? 'active' : ''}">
              <span class="icon">📊</span>
            </button>
            <button id="list-view-button" class="view-button ${this.currentView === 'list' ? 'active' : ''}">
              <span class="icon">📋</span>
            </button>
          </div>
        </div>
      </div>
      
      <div class="content-manager-container">
        <div class="content-sidebar">
          <div class="content-types">
            <h3>Content Types</h3>
            <ul class="content-type-list">
              <li class="content-type-item ${this.currentType === 'concept' ? 'active' : ''}" data-type="concept">
                <span class="icon">💡</span>
                <span class="label">Concepts</span>
              </li>
              <li class="content-type-item ${this.currentType === 'resource' ? 'active' : ''}" data-type="resource">
                <span class="icon">📄</span>
                <span class="label">Resources</span>
              </li>
              <li class="content-type-item ${this.currentType === 'topic' ? 'active' : ''}" data-type="topic">
                <span class="icon">📚</span>
                <span class="label">Topics</span>
              </li>
              <li class="content-type-item ${this.currentType === 'predicate' ? 'active' : ''}" data-type="predicate">
                <span class="icon">🔗</span>
                <span class="label">Predicates</span>
              </li>
              <li class="content-type-item ${this.currentType === 'resolver' ? 'active' : ''}" data-type="resolver">
                <span class="icon">🔍</span>
                <span class="label">Resolvers</span>
              </li>
            </ul>
          </div>
          
          <div class="content-filters">
            <h3>Filters</h3>
            <div class="filter-group">
              <label for="filter-date">Date Range</label>
              <select id="filter-date" class="filter-select">
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
            </div>
            
            <div class="filter-group">
              <label for="filter-sort">Sort By</label>
              <select id="filter-sort" class="filter-select">
                <option value="updatedAt-desc">Last Updated</option>
                <option value="createdAt-desc">Newest First</option>
                <option value="createdAt-asc">Oldest First</option>
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
              </select>
            </div>
            
            <div class="filter-group" id="tag-filter-container">
              <label>Tags</label>
              <div class="tag-list" id="filter-tags">
                <!-- Tags will be inserted here -->
                <div class="empty-tags">No tags available</div>
              </div>
            </div>
            
            <button id="apply-filters-button" class="button secondary full-width">
              Apply Filters
            </button>
            <button id="clear-filters-button" class="button text full-width">
              Clear Filters
            </button>
          </div>
        </div>
        
        <div class="content-main">
          <div class="content-toolbar">
            <div class="content-info">
              <h3 id="content-type-title">Concepts</h3>
              <span id="content-count" class="content-count">0 items</span>
            </div>
            <div class="content-actions">
              <button id="refresh-content-button" class="button secondary">
                <span class="icon">🔄</span> Refresh
              </button>
              <button id="add-content-button" class="button primary">
                <span class="icon">➕</span> New <span id="add-button-type">Concept</span>
              </button>
            </div>
          </div>
          
          <div id="content-visualization" class="content-visualization">
            <!-- Visualization will be inserted here -->
          </div>
          
          <div id="content-container" class="content-container ${this.currentView === 'grid' ? 'grid-view' : 'list-view'}">
            <div id="content-loading" class="content-loading">
              <p>Loading content...</p>
            </div>
            <div id="content-empty" class="content-empty" style="display: none;">
              <p>No content found. Click "New <span class="content-type-label">Concept</span>" to create one.</p>
            </div>
            <div id="content-grid" class="content-grid">
              <!-- Content items will be inserted here -->
            </div>
          </div>
          
          <div class="content-pagination">
            <button id="prev-page-button" class="pagination-button" disabled>
              <span class="icon">◀</span> Previous
            </button>
            <span id="pagination-info" class="pagination-info">Page 1 of 1</span>
            <button id="next-page-button" class="pagination-button" disabled>
              Next <span class="icon">▶</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }
}

window.ContentManagerComponent = new ContentManagerComponent();
