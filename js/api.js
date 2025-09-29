// API Service for Teen CRM
class APIService {
  constructor() {
    this.baseURL = CONFIG.API_BASE_URL;
    this.token = localStorage.getItem(CONFIG.TOKEN_STORAGE_KEY);
  }

  // Set authentication token
  setToken(token) {
    this.token = token;
    localStorage.setItem(CONFIG.TOKEN_STORAGE_KEY, token);
  }

  // Get authentication headers
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  // Generic API request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      headers: this.getHeaders(),
      ...options
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, redirect to login
          this.clearAuth();
          window.location.href = '/login.html';
          return;
        }
        
        const error = await response.json();
        throw new Error(error.message || 'API request failed');
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication methods
  async login(email, password) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    if (response.success) {
      this.setToken(response.data.accessToken);
      localStorage.setItem(CONFIG.REFRESH_TOKEN_KEY, response.data.refreshToken);
    }
    
    return response;
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.clearAuth();
    }
  }

  clearAuth() {
    this.token = null;
    localStorage.removeItem(CONFIG.TOKEN_STORAGE_KEY);
    localStorage.removeItem(CONFIG.REFRESH_TOKEN_KEY);
  }

  // Merchant methods
  async getMerchants(filters = {}) {
    const params = new URLSearchParams(filters);
    return await this.request(`/merchants?${params}`);
  }

  async getMerchant(id) {
    return await this.request(`/merchants/${id}`);
  }

  async createMerchant(merchantData) {
    return await this.request('/merchants', {
      method: 'POST',
      body: JSON.stringify(merchantData)
    });
  }

  async updateMerchant(id, merchantData) {
    return await this.request(`/merchants/${id}`, {
      method: 'PUT',
      body: JSON.stringify(merchantData)
    });
  }

  // Pipeline methods
  async updatePipelineStage(merchantId, stageData) {
    return await this.request(`/pipeline/${merchantId}/stage`, {
      method: 'PATCH',
      body: JSON.stringify(stageData)
    });
  }

  // Activity methods
  async getActivities(filters = {}) {
    const params = new URLSearchParams(filters);
    return await this.request(`/activities?${params}`);
  }

  async createActivity(activityData) {
    return await this.request('/activities', {
      method: 'POST',
      body: JSON.stringify(activityData)
    });
  }

  // Analytics methods
  async getDashboardData() {
    return await this.request('/analytics/dashboard');
  }
}

// Create global API instance
window.api = new APIService();