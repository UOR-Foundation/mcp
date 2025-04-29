/**
 * Landing Page Component
 * Provides enhanced landing page with system information and getting started guides
 */

class LandingPageComponent {
  constructor() {
    this.container = null;
    this.initialized = false;
  }
  
  /**
   * Initialize the landing page component
   * @param {HTMLElement} container Container element
   */
  initialize(container) {
    this.container = container;
    this.render();
    this.bindEvents();
    this.initialized = true;
  }
  
  /**
   * Render the landing page content
   */
  render() {
    if (!this.container) return;
    
    this.container.innerHTML = `
      <div class="landing-hero">
        <div class="hero-content">
          <h1>Universal Object Reference Framework</h1>
          <p class="hero-subtitle">A distributed, version-controlled system for structured data management</p>
          <div class="hero-actions">
            <button id="get-started-button" class="button primary large">Get Started</button>
            <button id="learn-more-button" class="button secondary large">Learn More</button>
          </div>
        </div>
        <div class="hero-image">
          <img src="./img/uor-diagram.svg" alt="UOR Framework Diagram" onerror="this.src='./img/uor-diagram-placeholder.png'; this.onerror=null;">
        </div>
      </div>
      
      <div class="feature-section">
        <h2>Key Features</h2>
        <div class="feature-grid">
          <div class="feature-card">
            <div class="feature-icon">🔄</div>
            <h3>Trilateral Coherence</h3>
            <p>Maintain coherent relationships between objects, representations, and observer frames</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🔍</div>
            <h3>Universal References</h3>
            <p>Reference any object across different namespaces with a standardized format</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">📊</div>
            <h3>Prime Decomposition</h3>
            <p>Break down complex objects into fundamental components for better analysis</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🔗</div>
            <h3>Cross-Namespace Resolution</h3>
            <p>Seamlessly access objects across different user repositories</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">📡</div>
            <h3>Publish/Subscribe</h3>
            <p>Real-time notifications and updates for changes to objects you care about</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🔒</div>
            <h3>GitHub Integration</h3>
            <p>Secure storage and version control using your GitHub account</p>
          </div>
        </div>
      </div>
      
      <div class="getting-started-section">
        <h2>Getting Started</h2>
        <div class="steps-container">
          <div class="step-card">
            <div class="step-number">1</div>
            <h3>Authenticate with GitHub</h3>
            <p>Connect your GitHub account to create and access your UOR repository</p>
            <button id="auth-step-button" class="button primary">Authenticate</button>
          </div>
          <div class="step-card">
            <div class="step-number">2</div>
            <h3>Initialize Repository</h3>
            <p>Set up your personal UOR database with the standard structure</p>
          </div>
          <div class="step-card">
            <div class="step-number">3</div>
            <h3>Create UOR Objects</h3>
            <p>Start adding concepts, resources, topics, and predicates to your repository</p>
          </div>
          <div class="step-card">
            <div class="step-number">4</div>
            <h3>Connect with Others</h3>
            <p>Create resolvers to access objects in other users' namespaces</p>
          </div>
        </div>
      </div>
      
      <div class="use-cases-section">
        <h2>Use Cases</h2>
        <div class="use-case-tabs">
          <button class="use-case-tab active" data-tab="research">Research</button>
          <button class="use-case-tab" data-tab="knowledge">Knowledge Management</button>
          <button class="use-case-tab" data-tab="collaboration">Collaboration</button>
          <button class="use-case-tab" data-tab="ai">AI Integration</button>
        </div>
        <div class="use-case-content">
          <div id="research-tab" class="use-case-pane active">
            <h3>Research Data Management</h3>
            <p>Store, version, and share research data with precise references and structured relationships. Track the evolution of concepts and maintain coherent representations across different contexts.</p>
            <ul>
              <li>Version control for research objects</li>
              <li>Cross-referencing between datasets</li>
              <li>Structured representation of complex relationships</li>
              <li>Collaborative data analysis</li>
            </ul>
          </div>
          <div id="knowledge-tab" class="use-case-pane">
            <h3>Knowledge Management</h3>
            <p>Build interconnected knowledge bases with precise semantic relationships. Organize concepts, resources, and topics in a structured, navigable format.</p>
            <ul>
              <li>Semantic knowledge graphs</li>
              <li>Concept mapping and relationship tracking</li>
              <li>Distributed knowledge repositories</li>
              <li>Versioned knowledge evolution</li>
            </ul>
          </div>
          <div id="collaboration-tab" class="use-case-pane">
            <h3>Team Collaboration</h3>
            <p>Share and collaborate on structured data across teams and organizations. Maintain coherent views of shared objects while allowing for contextual adaptations.</p>
            <ul>
              <li>Cross-team reference resolution</li>
              <li>Shared object repositories</li>
              <li>Contextual object views</li>
              <li>Real-time updates via pub/sub</li>
            </ul>
          </div>
          <div id="ai-tab" class="use-case-pane">
            <h3>AI Integration</h3>
            <p>Provide structured, versioned data for AI models with precise references and semantic relationships. Enable AI systems to understand and manipulate complex object structures.</p>
            <ul>
              <li>Structured data for LLM context</li>
              <li>Semantic relationship understanding</li>
              <li>Versioned training data</li>
              <li>Cross-reference resolution</li>
            </ul>
          </div>
        </div>
      </div>
      
      <div class="cta-section">
        <h2>Ready to Get Started?</h2>
        <p>Create your UOR repository and start building your structured data ecosystem today.</p>
        <button id="cta-auth-button" class="button primary large">Authenticate with GitHub</button>
      </div>
    `;
  }
  
  /**
   * Bind event handlers
   */
  bindEvents() {
    if (!this.container) return;
    
    const getStartedButton = this.container.querySelector('#get-started-button');
    if (getStartedButton) {
      getStartedButton.addEventListener('click', () => {
        document.querySelector('.getting-started-section').scrollIntoView({ 
          behavior: 'smooth' 
        });
      });
    }
    
    const learnMoreButton = this.container.querySelector('#learn-more-button');
    if (learnMoreButton) {
      learnMoreButton.addEventListener('click', () => {
        document.querySelector('.feature-section').scrollIntoView({ 
          behavior: 'smooth' 
        });
      });
    }
    
    const authStepButton = this.container.querySelector('#auth-step-button');
    if (authStepButton) {
      authStepButton.addEventListener('click', () => {
        if (window.authService) {
          if (window.authService.isAuthenticated()) {
            document.getElementById('user-section').scrollIntoView({ 
              behavior: 'smooth' 
            });
          } else {
            const authButton = document.getElementById('github-auth-button');
            if (authButton) {
              authButton.click();
            }
          }
        }
      });
    }
    
    const ctaAuthButton = this.container.querySelector('#cta-auth-button');
    if (ctaAuthButton) {
      ctaAuthButton.addEventListener('click', () => {
        const authButton = document.getElementById('github-auth-button');
        if (authButton) {
          authButton.click();
        }
      });
    }
    
    const useCaseTabs = this.container.querySelectorAll('.use-case-tab');
    useCaseTabs.forEach(tab => {
      tab.addEventListener('click', (event) => {
        useCaseTabs.forEach(t => t.classList.remove('active'));
        event.target.classList.add('active');
        
        const tabType = event.target.getAttribute('data-tab');
        const panes = this.container.querySelectorAll('.use-case-pane');
        panes.forEach(pane => pane.classList.remove('active'));
        this.container.querySelector(`#${tabType}-tab`).classList.add('active');
      });
    });
  }
  
  /**
   * Update authentication state in the UI
   * @param {boolean} isAuthenticated Whether the user is authenticated
   * @param {Object} user User information
   */
  updateAuthState(isAuthenticated, user) {
    if (!this.container) return;
    
    const authStepButton = this.container.querySelector('#auth-step-button');
    const ctaAuthButton = this.container.querySelector('#cta-auth-button');
    
    if (isAuthenticated && user) {
      if (authStepButton) {
        authStepButton.textContent = 'Go to Dashboard';
      }
      
      if (ctaAuthButton) {
        ctaAuthButton.textContent = 'Go to Dashboard';
      }
    } else {
      if (authStepButton) {
        authStepButton.textContent = 'Authenticate';
      }
      
      if (ctaAuthButton) {
        ctaAuthButton.textContent = 'Authenticate with GitHub';
      }
    }
  }
}

window.LandingPageComponent = new LandingPageComponent();
