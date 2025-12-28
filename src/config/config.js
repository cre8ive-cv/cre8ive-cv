const os = require('os');

const cpuCount = Math.max(1, os.cpus()?.length || 1);
const defaultMaxConcurrency = Math.min(Math.max(2, cpuCount), 4); 
const defaultMinConcurrency = Math.max(1, Math.min(defaultMaxConcurrency, Math.floor(defaultMaxConcurrency / 2)));

const config = {
  version: '0.1.0',
  appUrl: 'https://cre8ive.cv',
  defaultTheme: 'default',
  defaultColor: 'blue',
  defaultMode: 'dark',
  limits: {
    maxResumeJsonBytes: 1 * 1024 * 1024, 
    maxPhotoBase64Bytes: 1.5 * 1024 * 1024
  },

  
  turnstile: {
    enabled: false
  },

  labels: {
    present: 'Present',
    technologies: 'Technologies',
    link: 'Link'
  },

  pdf: {
    timeouts: {
      pageLoad: parseInt(process.env.PDF_TIMEOUT_PAGE_LOAD) || 35000,
      networkIdle: parseInt(process.env.PDF_TIMEOUT_NETWORK_IDLE) || 25000,
      scriptExecution: parseInt(process.env.PDF_TIMEOUT_SCRIPT) || 10000,  
      pdfGeneration: parseInt(process.env.PDF_TIMEOUT_PDF_GEN) || 45000, 
      totalOperation: parseInt(process.env.PDF_TIMEOUT_TOTAL) || 55000
    },

    queue: {
      maxQueueSize: parseInt(process.env.PDF_QUEUE_MAX_SIZE) || 40, 
      maxPdfMemoryMB: parseInt(process.env.PDF_MAX_MEMORY_MB) || 2048,
      avgInstanceMemoryMB: parseInt(process.env.PDF_AVG_INSTANCE_MB) || 250,
      minConcurrency: parseInt(process.env.PDF_MIN_CONCURRENCY) || defaultMinConcurrency,
      maxConcurrency: parseInt(process.env.PDF_MAX_CONCURRENCY) || defaultMaxConcurrency,
      safetyMarginMB: parseInt(process.env.PDF_SAFETY_MARGIN_MB) || 512,
      avgProcessingTimeMs: parseInt(process.env.PDF_AVG_TIME_MS) || 10000,
      memoryCheckIntervalMs: parseInt(process.env.PDF_MEMORY_CHECK_MS) || 5000,
      stuckJobTimeoutMs: parseInt(process.env.PDF_STUCK_JOB_TIMEOUT_MS) || 100000 
    },

    cluster: {
      concurrencyMode: 'CONCURRENCY_CONTEXT', 
      taskTimeoutMs: parseInt(process.env.PDF_TASK_TIMEOUT_MS) || 100000,
      retryLimit: parseInt(process.env.PDF_RETRY_LIMIT) || 0, 
      retryDelayMs: parseInt(process.env.PDF_RETRY_DELAY_MS) || 0,
      monitorIntervalMs: parseInt(process.env.PDF_MONITOR_INTERVAL_MS) || 5000,
      puppeteerOptions: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-web-security',
          '--font-render-hinting=none',
          '--disable-gpu' 
        ]
      }
    }
  }
};

module.exports = config;
