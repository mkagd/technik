/**
 * 💰 API Cost Monitor
 * Śledzi użycie Google Distance Matrix API i szacuje koszty
 * + Hard limity: $100/dzień, 20,000 requestów/dzień, 60 requestów/minutę
 */

class ApiCostMonitor {
  constructor() {
    // 🔒 Hard limity
    this.dailyBudgetLimit = 100; // MAX $100/dzień
    this.dailyRequestLimit = 20000; // MAX 20,000 requestów/dzień
    this.perMinuteLimit = 60; // MAX 60 requestów/minutę
    
    this.requests = {
      today: 0,
      total: 0,
      cached: 0,
      failed: 0
    };
    
    // Cennik Google Distance Matrix API
    this.pricing = {
      basic: 0.005, // $5 za 1000 requestów
      advanced: 0.010 // $10 za 1000 requestów (z ruchem)
    };
    
    this.lastMinuteRequests = [];
    
    // 📧 Email alert cooldown (1 hour between same type alerts)
    this.lastAlertSent = {
      budget_80: 0,
      budget_90: 0,
      requests_80: 0,
      requests_90: 0
    };
    
    this.loadStats();
  }
  
  loadStats() {
    try {
      const saved = localStorage.getItem('api_cost_monitor');
      if (saved) {
        const data = JSON.parse(saved);
        // Reset dziennych statystyk o północy
        const today = new Date().toDateString();
        if (data.date !== today) {
          this.requests.today = 0;
          this.lastMinuteRequests = [];
          this.lastAlertSent = {
            budget_80: 0,
            budget_90: 0,
            requests_80: 0,
            requests_90: 0
          };
        } else {
          this.requests = { ...this.requests, ...data.requests };
          this.lastMinuteRequests = data.lastMinuteRequests || [];
          this.lastAlertSent = data.lastAlertSent || {
            budget_80: 0,
            budget_90: 0,
            requests_80: 0,
            requests_90: 0
          };
        }
      }
    } catch (e) {
      console.warn('Failed to load API cost stats:', e);
    }
  }
  
  saveStats() {
    try {
      localStorage.setItem('api_cost_monitor', JSON.stringify({
        date: new Date().toDateString(),
        requests: this.requests,
        lastMinuteRequests: this.lastMinuteRequests,
        lastAlertSent: this.lastAlertSent
      }));
    } catch (e) {
      console.warn('Failed to save API cost stats:', e);
    }
  }
  
  /**
   * 🔒 Sprawdź czy można wykonać request (PRZED wywołaniem API)
   */
  canMakeRequest() {
    const todayCost = this.estimateCost().today;
    
    // 1️⃣ Sprawdź dzienny limit budżetu
    if (todayCost >= this.dailyBudgetLimit) {
      console.error(`🚨 DAILY BUDGET LIMIT EXCEEDED: $${todayCost.toFixed(2)}/$${this.dailyBudgetLimit}`);
      return {
        allowed: false,
        reason: `Daily budget limit exceeded ($${todayCost.toFixed(2)}/$${this.dailyBudgetLimit})`,
        limitType: 'budget'
      };
    }

    // 2️⃣ Sprawdź dzienny limit requestów
    if (this.requests.today >= this.dailyRequestLimit) {
      console.error(`🚨 DAILY REQUEST LIMIT EXCEEDED: ${this.requests.today}/${this.dailyRequestLimit}`);
      return {
        allowed: false,
        reason: `Daily request limit exceeded (${this.requests.today}/${this.dailyRequestLimit})`,
        limitType: 'requests'
      };
    }

    // 3️⃣ Sprawdź per-minute limit
    const now = Date.now();
    this.lastMinuteRequests = this.lastMinuteRequests.filter(timestamp => now - timestamp < 60000);

    if (this.lastMinuteRequests.length >= this.perMinuteLimit) {
      console.warn(`⚠️ PER-MINUTE LIMIT REACHED: ${this.lastMinuteRequests.length}/${this.perMinuteLimit}`);
      const oldestRequest = Math.min(...this.lastMinuteRequests);
      const retryAfter = 60 - Math.floor((now - oldestRequest) / 1000);
      
      return {
        allowed: false,
        reason: `Too many requests per minute (${this.lastMinuteRequests.length}/${this.perMinuteLimit}). Retry in ${retryAfter}s`,
        limitType: 'rate',
        retryAfter
      };
    }

    // ✅ Wszystkie limity OK
    return { allowed: true };
  }
  
  /**
   * 📧 Wyślij email alert (z cooldown 1h)
   */
  async sendAlert(alertType, percentage) {
    const now = Date.now();
    const alertKey = `${alertType}_${percentage}`;
    const lastSent = this.lastAlertSent[alertKey] || 0;
    const hourInMs = 60 * 60 * 1000;

    // Cooldown: max 1 alert tego samego typu na godzinę
    if (now - lastSent < hourInMs) {
      console.log(`⏳ Alert cooldown active for ${alertKey} (${Math.floor((hourInMs - (now - lastSent)) / 60000)}m remaining)`);
      return;
    }

    try {
      console.log(`📧 Sending ${alertType} alert (${percentage}%)...`);
      
      const response = await fetch('/api/send-cost-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alertType,
          percentage,
          stats: this.getStats()
        })
      });

      if (response.ok) {
        console.log(`✅ Alert email sent successfully for ${alertKey}`);
        this.lastAlertSent[alertKey] = now;
        this.saveStats();
      } else {
        const error = await response.json();
        console.error(`❌ Failed to send alert email:`, error);
      }
    } catch (error) {
      console.error(`❌ Error sending alert email:`, error);
    }
  }

  logRequest(type = 'api') {
    if (type === 'api') {
      this.requests.today++;
      this.requests.total++;
      this.lastMinuteRequests.push(Date.now());
      
      const cost = this.estimateCost();
      const budgetPercentage = (cost.today / this.dailyBudgetLimit) * 100;
      const requestPercentage = (this.requests.today / this.dailyRequestLimit) * 100;
      
      console.log(`💰 API Request #${this.requests.today} | Cost: $${(this.pricing.basic).toFixed(4)} | Today: $${cost.today.toFixed(2)}/$${this.dailyBudgetLimit} (${budgetPercentage.toFixed(1)}%)`);
      
      // Alert przy 80% limitu budżetu
      if (budgetPercentage >= 80 && budgetPercentage < 81) {
        console.warn(`🚨 WARNING: 80% of daily budget used ($${cost.today.toFixed(2)}/$${this.dailyBudgetLimit})`);
        this.sendAlert('budget', 80);
      }

      // Alert przy 90% budżetu
      if (budgetPercentage >= 90 && budgetPercentage < 91) {
        console.warn(`🚨 CRITICAL: 90% of daily budget used ($${cost.today.toFixed(2)}/$${this.dailyBudgetLimit})`);
        this.sendAlert('budget', 90);
      }

      // Alert przy 80% limitu requestów
      if (requestPercentage >= 80 && requestPercentage < 81) {
        console.warn(`🚨 WARNING: 80% of daily request limit used (${this.requests.today}/${this.dailyRequestLimit})`);
        this.sendAlert('requests', 80);
      }

      // Alert przy 90% requestów
      if (requestPercentage >= 90 && requestPercentage < 91) {
        console.warn(`🚨 CRITICAL: 90% of daily request limit used (${this.requests.today}/${this.dailyRequestLimit})`);
        this.sendAlert('requests', 90);
      }
    } else if (type === 'cache') {
      this.requests.cached++;
      console.log(`💚 Cache HIT #${this.requests.cached} - FREE`);
    } else if (type === 'failed') {
      this.requests.failed++;
    }
    
    this.saveStats();
    
    // Log co 10 requestów
    if ((this.requests.today + this.requests.cached) % 10 === 0) {
      this.printStats();
    }
  }
  
  estimateCost(useAdvanced = true) {
    const pricePerRequest = useAdvanced ? this.pricing.advanced : this.pricing.basic;
    return {
      today: this.requests.today * pricePerRequest,
      total: this.requests.total * pricePerRequest
    };
  }
  
  printStats() {
    const cost = this.estimateCost();
    const cacheRate = this.requests.cached / (this.requests.today + this.requests.cached) * 100;
    
    console.log(`
╔════════════════════════════════════════════════════════╗
║           💰 API COST MONITOR - SUMMARY               ║
╠════════════════════════════════════════════════════════╣
║ 📊 Today's Requests:     ${String(this.requests.today).padStart(6)}                 ║
║ 💾 Cache Hits:           ${String(this.requests.cached).padStart(6)} (${cacheRate.toFixed(1)}%)        ║
║ ❌ Failed:               ${String(this.requests.failed).padStart(6)}                 ║
║ 💵 Estimated Cost Today: $${cost.today.toFixed(2).padStart(5)}                ║
║ 💰 Total Cost:           $${cost.total.toFixed(2).padStart(5)}                ║
╠════════════════════════════════════════════════════════╣
║ 💡 Cache Rate: ${cacheRate > 90 ? '✅ EXCELLENT' : cacheRate > 70 ? '⚠️  GOOD' : '🚨 POOR'}                             ║
║ 💡 Daily Limit: ${this.requests.today > 500 ? '🚨 HIGH USAGE!' : this.requests.today > 200 ? '⚠️  MODERATE' : '✅ LOW'}                         ║
╚════════════════════════════════════════════════════════╝
    `);
  }
  
  getStats() {
    const cost = this.estimateCost();
    const cacheHitRate = this.requests.today + this.requests.cached > 0
      ? (this.requests.cached / (this.requests.today + this.requests.cached) * 100).toFixed(1)
      : 0;
    
    return {
      requests: {
        total: this.requests.today + this.requests.cached + this.requests.failed,
        api: this.requests.today,
        cache: this.requests.cached,
        failed: this.requests.failed
      },
      estimatedCost: cost.today,
      estimatedMonthlyCost: cost.today * 30, // Prosta projekcja
      dailyBudgetLimit: this.dailyBudgetLimit,
      dailyRequestLimit: this.dailyRequestLimit,
      perMinuteLimit: this.perMinuteLimit,
      costPerRequest: this.pricing.basic,
      cacheHitRate: parseFloat(cacheHitRate),
      lastRequestAt: Date.now(),
      alerts: this.getActiveAlerts()
    };
  }

  getActiveAlerts() {
    const alerts = [];
    const cost = this.estimateCost();
    const budgetPercentage = (cost.today / this.dailyBudgetLimit) * 100;
    const requestPercentage = (this.requests.today / this.dailyRequestLimit) * 100;

    if (budgetPercentage >= 90) {
      alerts.push(`🔴 KRYTYCZNE: Budżet dzienny na poziomie ${budgetPercentage.toFixed(1)}%`);
    } else if (budgetPercentage >= 80) {
      alerts.push(`🟡 OSTRZEŻENIE: Budżet dzienny na poziomie ${budgetPercentage.toFixed(1)}%`);
    }

    if (requestPercentage >= 90) {
      alerts.push(`🔴 KRYTYCZNE: Zapytania dzienne na poziomie ${requestPercentage.toFixed(1)}%`);
    } else if (requestPercentage >= 80) {
      alerts.push(`🟡 OSTRZEŻENIE: Zapytania dzienne na poziomie ${requestPercentage.toFixed(1)}%`);
    }

    return alerts;
  }
  
  resetStats() {
    this.requests = {
      today: 0,
      total: 0,
      cached: 0,
      failed: 0
    };
    this.lastMinuteRequests = [];
    this.lastAlertSent = {
      budget_80: 0,
      budget_90: 0,
      requests_80: 0,
      requests_90: 0
    };
    this.saveStats();
    console.log('✅ API Cost Monitor stats reset');
  }
}

// Singleton
let monitorInstance = null;

export const getApiCostMonitor = () => {
  if (!monitorInstance) {
    monitorInstance = new ApiCostMonitor();
  }
  return monitorInstance;
};

export default ApiCostMonitor;
