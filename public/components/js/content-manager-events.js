/**
 * Content Management Interface Events
 * Event handlers and functionality for the content manager component
 */


/**
 * Bind event handlers for the content manager
 */
ContentManagerComponent.prototype.bindEvents = function() {
  if (!this.container) return;
  
  const typeItems = this.container.querySelectorAll('.content-type-item');
  typeItems.forEach(item => {
    item.addEventListener('click', () => {
      typeItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      
      this.currentType = item.getAttribute('data-type');
      this.updateContentTypeUI();
      this.loadContent();
    });
  });
  
  const gridViewButton = this.container.querySelector('#grid-view-button');
  const listViewButton = this.container.querySelector('#list-view-button');
  
  if (gridViewButton) {
    gridViewButton.addEventListener('click', () => {
      this.setView('grid');
    });
  }
  
  if (listViewButton) {
    listViewButton.addEventListener('click', () => {
      this.setView('list');
    });
  }
  
  const searchInput = this.container.querySelector('#content-search');
  const searchButton = this.container.querySelector('#search-button');
  
  if (searchInput) {
    searchInput.addEventListener('keyup', (event) => {
      if (event.key === 'Enter') {
        this.searchQuery = searchInput.value.trim();
        this.loadContent();
      }
    });
  }
  
  if (searchButton) {
    searchButton.addEventListener('click', () => {
      if (searchInput) {
        this.searchQuery = searchInput.value.trim();
        this.loadContent();
      }
    });
  }
  
  const applyFiltersButton = this.container.querySelector('#apply-filters-button');
  const clearFiltersButton = this.container.querySelector('#clear-filters-button');
  
  if (applyFiltersButton) {
    applyFiltersButton.addEventListener('click', () => {
      this.applyFilters();
    });
  }
  
  if (clearFiltersButton) {
    clearFiltersButton.addEventListener('click', () => {
      this.clearFilters();
    });
  }
  
  const sortSelect = this.container.querySelector('#filter-sort');
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      const [field, direction] = sortSelect.value.split('-');
      this.sortField = field;
      this.sortDirection = direction;
    });
  }
  
  const refreshButton = this.container.querySelector('#refresh-content-button');
  if (refreshButton) {
    refreshButton.addEventListener('click', () => {
      this.loadContent();
    });
  }
  
  const addButton = this.container.querySelector('#add-content-button');
  if (addButton) {
    addButton.addEventListener('click', () => {
      this.showAddContentModal();
    });
  }
  
  const prevPageButton = this.container.querySelector('#prev-page-button');
  const nextPageButton = this.container.querySelector('#next-page-button');
  
  if (prevPageButton) {
    prevPageButton.addEventListener('click', () => {
      this.goToPreviousPage();
    });
  }
  
  if (nextPageButton) {
    nextPageButton.addEventListener('click', () => {
      this.goToNextPage();
    });
  }
};

/**
 * Set the current view (grid or list)
 * @param {string} view View type ('grid' or 'list')
 */
ContentManagerComponent.prototype.setView = function(view) {
  if (view !== 'grid' && view !== 'list') return;
  
  this.currentView = view;
  
  const gridViewButton = this.container.querySelector('#grid-view-button');
  const listViewButton = this.container.querySelector('#list-view-button');
  
  if (gridViewButton) {
    gridViewButton.classList.toggle('active', view === 'grid');
  }
  
  if (listViewButton) {
    listViewButton.classList.toggle('active', view === 'list');
  }
  
  const contentContainer = this.container.querySelector('#content-container');
  if (contentContainer) {
    contentContainer.classList.remove('grid-view', 'list-view');
    contentContainer.classList.add(`${view}-view`);
  }
  
  this.renderContent();
};

/**
 * Update UI elements for the current content type
 */
ContentManagerComponent.prototype.updateContentTypeUI = function() {
  if (!this.container) return;
  
  const titleElement = this.container.querySelector('#content-type-title');
  if (titleElement) {
    titleElement.textContent = `${this.currentType.charAt(0).toUpperCase() + this.currentType.slice(1)}s`;
  }
  
  const addButtonType = this.container.querySelector('#add-button-type');
  if (addButtonType) {
    addButtonType.textContent = this.currentType.charAt(0).toUpperCase() + this.currentType.slice(1);
  }
  
  const contentTypeLabels = this.container.querySelectorAll('.content-type-label');
  contentTypeLabels.forEach(label => {
    label.textContent = this.currentType.charAt(0).toUpperCase() + this.currentType.slice(1);
  });
};

/**
 * Apply filters to content
 */
ContentManagerComponent.prototype.applyFilters = function() {
  const dateFilter = this.container.querySelector('#filter-date');
  if (dateFilter) {
    this.filterCriteria.dateRange = dateFilter.value;
  }
  
  const sortFilter = this.container.querySelector('#filter-sort');
  if (sortFilter) {
    const [field, direction] = sortFilter.value.split('-');
    this.sortField = field;
    this.sortDirection = direction;
  }
  
  const selectedTags = Array.from(this.container.querySelectorAll('.tag-filter.selected'))
    .map(tag => tag.getAttribute('data-tag'));
  
  if (selectedTags.length > 0) {
    this.filterCriteria.tags = selectedTags;
  } else {
    delete this.filterCriteria.tags;
  }
  
  this.currentPage = 1;
  
  this.loadContent();
};

/**
 * Clear all filters
 */
ContentManagerComponent.prototype.clearFilters = function() {
  const dateFilter = this.container.querySelector('#filter-date');
  if (dateFilter) {
    dateFilter.value = 'all';
  }
  
  const sortFilter = this.container.querySelector('#filter-sort');
  if (sortFilter) {
    sortFilter.value = 'updatedAt-desc';
  }
  
  const selectedTags = this.container.querySelectorAll('.tag-filter.selected');
  selectedTags.forEach(tag => {
    tag.classList.remove('selected');
  });
  
  this.filterCriteria = {};
  this.sortField = 'updatedAt';
  this.sortDirection = 'desc';
  this.searchQuery = '';
  this.currentPage = 1;
  
  const searchInput = this.container.querySelector('#content-search');
  if (searchInput) {
    searchInput.value = '';
  }
  
  this.loadContent();
};

/**
 * Go to previous page
 */
ContentManagerComponent.prototype.goToPreviousPage = function() {
  if (this.currentPage > 1) {
    this.currentPage--;
    this.loadContent();
  }
};

/**
 * Go to next page
 */
ContentManagerComponent.prototype.goToNextPage = function() {
  if (this.currentPage < this.totalPages) {
    this.currentPage++;
    this.loadContent();
  }
};

/**
 * Update pagination controls
 */
ContentManagerComponent.prototype.updatePagination = function() {
  if (!this.container) return;
  
  const prevPageButton = this.container.querySelector('#prev-page-button');
  const nextPageButton = this.container.querySelector('#next-page-button');
  const paginationInfo = this.container.querySelector('#pagination-info');
  
  if (prevPageButton) {
    prevPageButton.disabled = this.currentPage <= 1;
  }
  
  if (nextPageButton) {
    nextPageButton.disabled = this.currentPage >= this.totalPages;
  }
  
  if (paginationInfo) {
    paginationInfo.textContent = `Page ${this.currentPage} of ${this.totalPages}`;
  }
};
