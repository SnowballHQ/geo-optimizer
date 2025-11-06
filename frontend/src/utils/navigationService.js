/**
 * Navigation Service
 *
 * This service provides a way for non-React modules (like api.js)
 * to access React Router's navigate function.
 *
 * Usage:
 * 1. In App.jsx or a top-level component, register the navigate function:
 *    navigationService.setNavigate(navigate)
 *
 * 2. In non-React code (like api.js interceptors):
 *    navigationService.navigate('/login', { replace: true })
 */

class NavigationService {
  constructor() {
    this.navigate = null;
    this.location = null;
  }

  /**
   * Register the navigate function from useNavigate hook
   * @param {Function} navigateFn - The navigate function from useNavigate()
   * @param {Object} locationObj - The location object from useLocation()
   */
  setNavigate(navigateFn, locationObj = null) {
    this.navigate = navigateFn;
    this.location = locationObj;
  }

  /**
   * Navigate to a route
   * @param {string|number} to - The route path or -1 for back navigation
   * @param {Object} options - Navigation options (replace, state, etc.)
   */
  navigateTo(to, options = {}) {
    if (!this.navigate) {
      console.error('Navigation function not registered. Call setNavigate() first.');
      // Fallback to hard redirect if navigate not available
      if (typeof to === 'string') {
        window.location.href = to;
      } else if (to === -1) {
        window.history.back();
      }
      return;
    }

    this.navigate(to, options);
  }

  /**
   * Get current location pathname
   * @returns {string} Current pathname
   */
  getCurrentPath() {
    if (this.location) {
      return this.location.pathname;
    }
    return window.location.pathname;
  }

  /**
   * Check if navigate function is registered
   * @returns {boolean}
   */
  isReady() {
    return this.navigate !== null;
  }
}

// Export singleton instance
export const navigationService = new NavigationService();
export default navigationService;
