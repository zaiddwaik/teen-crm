// Quick Backend Integration for Teen CRM
// Add this script to your index.html to connect to Railway backend

// Replace this with your actual Railway URL
const RAILWAY_API_URL = 'https://teen-crm-backend-production-xxxx.up.railway.app/api';

// Override the existing data store to use API calls
class BackendDataStore extends CRMDataStore {
  constructor() {
    super();
    this.apiToken = localStorage.getItem('crm_token');
  }

  async apiCall(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(this.apiToken && { 'Authorization': `Bearer ${this.apiToken}` })
    };

    try {
      const response = await fetch(`${RAILWAY_API_URL}${endpoint}`, {
        ...options,
        headers: { ...headers, ...options.headers }
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, redirect to login
          localStorage.removeItem('crm_token');
          this.showLoginForm();
          throw new Error('Authentication required');
        }
        
        const error = await response.json();
        throw new Error(error.message || 'API call failed');
      }

      return await response.json();
    } catch (error) {
      console.error('API call failed:', error);
      // Fallback to localStorage for offline mode
      return super.getData();
    }
  }

  // Override login to use backend authentication
  async login(email, password) {
    try {
      const response = await this.apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      if (response.success) {
        this.apiToken = response.data.accessToken;
        localStorage.setItem('crm_token', this.apiToken);
        this.currentUser = response.data.user;
        return { success: true, user: response.data.user };
      }
      
      throw new Error(response.message || 'Login failed');
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Override merchants to use backend
  async getMerchants() {
    try {
      const response = await this.apiCall('/merchants');
      return response.success ? response.data : [];
    } catch (error) {
      // Fallback to localStorage
      return super.getMerchants();
    }
  }

  // Override create merchant to use backend
  async createMerchant(merchantData) {
    try {
      const response = await this.apiCall('/merchants', {
        method: 'POST',
        body: JSON.stringify(merchantData)
      });
      
      if (response.success) {
        // Update local cache
        super.createMerchant(response.data);
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to create merchant');
    } catch (error) {
      console.error('Create merchant failed:', error);
      // Fallback to localStorage
      return super.createMerchant(merchantData);
    }
  }

  // Show simple login form
  showLoginForm() {
    const loginHtml = `
      <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 9999; display: flex; align-items: center; justify-content: center;">
        <div style="background: white; padding: 2rem; border-radius: 8px; max-width: 400px; width: 90%;">
          <h3>Login Required</h3>
          <form id="backendLoginForm">
            <div style="margin-bottom: 1rem;">
              <label>Email:</label>
              <input type="email" id="loginEmail" required style="width: 100%; padding: 0.5rem; margin-top: 0.25rem;">
            </div>
            <div style="margin-bottom: 1rem;">
              <label>Password:</label>
              <input type="password" id="loginPassword" required style="width: 100%; padding: 0.5rem; margin-top: 0.25rem;">
            </div>
            <button type="submit" style="background: #3b82f6; color: white; padding: 0.5rem 1rem; border: none; border-radius: 4px; width: 100%;">Login</button>
          </form>
          <div style="margin-top: 1rem; font-size: 0.875rem; color: #666;">
            <p><strong>Demo Accounts:</strong></p>
            <p>Admin: admin@teen-crm.com / admin123</p>
            <p>Rep: sami@teen-crm.com / rep123</p>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', loginHtml);

    document.getElementById('backendLoginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;

      const result = await this.login(email, password);
      if (result.success) {
        // Remove login form
        document.querySelector('[style*="position: fixed"]').remove();
        // Refresh the page to reload data
        location.reload();
      } else {
        alert('Login failed: ' + result.error);
      }
    });
  }
}

// Replace the global dataStore with backend version
if (typeof CRMDataStore !== 'undefined') {
  window.dataStore = new BackendDataStore();
  
  // Check if user is logged in on page load
  if (!localStorage.getItem('crm_token')) {
    // Show login form after page loads
    setTimeout(() => {
      window.dataStore.showLoginForm();
    }, 1000);
  }
}