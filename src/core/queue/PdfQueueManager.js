const os = require('os');
const { randomUUID } = require('crypto');
const { generateHTML } = require('../generators/html');

class PdfQueueManager {
  constructor(queueConfig, dependencies = {}) {
    // Store dependencies
    this.appConfig = dependencies.config || require('../../config');
    this.analyticsDB = dependencies.analyticsDB || null;
    this.analyticsEnabled = dependencies.analyticsEnabled || false;
    this.buildAnalyticsContext = dependencies.buildAnalyticsContext || null;
    this.recordExportAnalytics = dependencies.recordExportAnalytics || null;
    this.formatAnalyticsTimestamp = dependencies.formatAnalyticsTimestamp || null;

    // Queue configuration
    this.config = {
      maxQueueSize: queueConfig.maxQueueSize || 50,
      maxPdfMemoryMB: queueConfig.maxPdfMemoryMB || 2048,
      avgInstanceMemoryMB: queueConfig.avgInstanceMemoryMB || 300,
      minConcurrency: queueConfig.minConcurrency || 1,
      maxConcurrency: queueConfig.maxConcurrency || 5,
      safetyMarginMB: queueConfig.safetyMarginMB || 500,
      avgProcessingTimeMs: queueConfig.avgProcessingTimeMs || 8000,
      memoryCheckIntervalMs: queueConfig.memoryCheckIntervalMs || 5000,
      stuckJobTimeoutMs: queueConfig.stuckJobTimeoutMs || 90000
    };

    this.queue = []; // FIFO queue of pending jobs
    this.activeJobs = new Map(); // Currently processing jobs
    this.stats = {
      totalProcessed: 0,
      totalFailed: 0,
      totalRejected: 0,
      peakQueueSize: 0,
      peakConcurrency: 0
    };

    // Start periodic cleanup of stuck jobs
    this.cleanupInterval = setInterval(() => {
      this.cleanupStuckJobs();
    }, 30000); // Run every 30 seconds

    // Log statistics every 5 minutes
    this.statsInterval = setInterval(() => {
      console.log(`[Queue] Stats: processed=${this.stats.totalProcessed}, failed=${this.stats.totalFailed}, rejected=${this.stats.totalRejected}, peak_queue=${this.stats.peakQueueSize}, peak_concurrency=${this.stats.peakConcurrency}`);
    }, 300000); // 5 minutes
  }

  /**
   * Calculate dynamic concurrency limit based on available memory
   */
  calculateConcurrencyLimit() {
    const memInfo = process.memoryUsage();
    const systemMemoryMB = os.totalmem() / (1024 * 1024);
    const usedMemoryMB = memInfo.heapUsed / (1024 * 1024);

    // Calculate available memory for PDF processing
    const availableForPdfMB = Math.min(
      this.config.maxPdfMemoryMB,
      systemMemoryMB - usedMemoryMB - this.config.safetyMarginMB
    );

    // How many instances can fit?
    const calculatedLimit = Math.floor(
      availableForPdfMB / this.config.avgInstanceMemoryMB
    );

    // Clamp between min and max
    const limit = Math.max(
      this.config.minConcurrency,
      Math.min(calculatedLimit, this.config.maxConcurrency)
    );

    return limit;
  }

  /**
   * Estimate wait time for a job at given position in queue
   */
  getWaitTimeEstimate(queuePosition) {
    const concurrencyLimit = this.calculateConcurrencyLimit();
    const jobsAhead = queuePosition;
    const fullBatches = Math.floor(jobsAhead / concurrencyLimit);
    const remainderJobs = jobsAhead % concurrencyLimit;

    let estimatedMs = 0;

    // Time for current batch to complete (~70% done assumption)
    if (this.activeJobs.size > 0) {
      estimatedMs += this.config.avgProcessingTimeMs * 0.7;
    }

    // Time for full batches
    estimatedMs += fullBatches * this.config.avgProcessingTimeMs;

    // Time for partial batch
    if (remainderJobs > 0) {
      estimatedMs += this.config.avgProcessingTimeMs;
    }

    return Math.ceil(estimatedMs);
  }

  /**
   * Check if queue is at capacity
   */
  isQueueFull() {
    return this.queue.length >= this.config.maxQueueSize;
  }

  /**
   * Get current queue status
   */
  getQueueStatus() {
    return {
      queueSize: this.queue.length,
      activeJobs: this.activeJobs.size,
      concurrencyLimit: this.calculateConcurrencyLimit(),
      estimatedWaitTimeMs: this.queue.length > 0 ? this.getWaitTimeEstimate(this.queue.length) : 0,
      limits: {
        maxQueueSize: this.config.maxQueueSize,
        maxConcurrency: this.config.maxConcurrency,
        memoryLimitMB: this.config.maxPdfMemoryMB
      }
    };
  }

  /**
   * Add a job to the queue and start processing
   */
  async enqueue(jobData, req, res) {
    const jobId = randomUUID();
    const position = this.queue.length;

    const job = {
      id: jobId,
      data: jobData,
      req: req,
      res: res,
      createdAt: Date.now(),
      startedAt: null,
      completedAt: null,
      status: 'pending'
    };

    this.queue.push(job);

    // Update peak queue size
    if (this.queue.length > this.stats.peakQueueSize) {
      this.stats.peakQueueSize = this.queue.length;
    }

    const estimatedWaitTimeMs = this.getWaitTimeEstimate(position);

    console.log(`[Queue] Job ${jobId} enqueued at position ${position} (queue size: ${this.queue.length})`);

    // Start processing next job
    setImmediate(() => this.processNext());

    return {
      jobId,
      position,
      estimatedWaitTimeMs
    };
  }

  /**
   * Get next job from queue (FIFO)
   */
  dequeue() {
    return this.queue.shift();
  }

  /**
   * Process next job in queue if concurrency allows
   */
  async processNext() {
    // Check if we can process more jobs
    const currentConcurrency = this.activeJobs.size;
    const maxConcurrency = this.calculateConcurrencyLimit();

    if (currentConcurrency >= maxConcurrency) {
      return;
    }

    // Get next job from queue
    const job = this.dequeue();
    if (!job) {
      return; // Queue is empty
    }

    // Mark job as active
    job.status = 'processing';
    job.startedAt = Date.now();
    this.activeJobs.set(job.id, job);

    // Update peak concurrency
    if (this.activeJobs.size > this.stats.peakConcurrency) {
      this.stats.peakConcurrency = this.activeJobs.size;
    }

    console.log(`[Queue] Processing job ${job.id} (${this.activeJobs.size}/${maxConcurrency} active, ${this.queue.length} queued)`);

    // Process the job asynchronously
    this.processJob(job)
      .then(() => {
        const duration = Date.now() - job.startedAt;
        console.log(`[Queue] Job ${job.id} completed in ${duration}ms`);
        this.stats.totalProcessed++;
      })
      .catch((error) => {
        console.error(`[Queue] Job ${job.id} failed:`, error.message);
        this.stats.totalFailed++;
      })
      .finally(() => {
        // Remove from active jobs
        this.activeJobs.delete(job.id);
        job.completedAt = Date.now();

        // Process next job in queue
        setImmediate(() => this.processNext());
      });
  }

  /**
   * Process a single job: generate HTML, generate PDF, send response
   */
  async processJob(job) {
    const { data, res, req } = job;

    try {
      // Generate HTML
      const htmlContent = generateHTML(
        data.resumeData,
        data.photoBase64,
        data.theme,
        data.palette,
        data.customSectionNames,
        data.showWatermark,
        this.appConfig.labels
      );

      // Generate PDF with memory tracking
      const { generatePDFWithMemoryTracking } = require('../generators/pdf');
      const pdfBuffer = await generatePDFWithMemoryTracking(
        htmlContent,
        (memoryInfo) => {
          console.log(`[Queue] Job ${job.id} memory: ${memoryInfo.phase} - ${memoryInfo.memoryMB.toFixed(2)}MB`);
        }
      );

      console.log(`[Queue] Job ${job.id} PDF generated (${pdfBuffer.length} bytes)`);

      // Record analytics (if enabled and functions are provided)
      if (this.analyticsEnabled && this.buildAnalyticsContext && this.recordExportAnalytics) {
        const { normalizedMeta, resolvedMode, resolvedSourceUrl } = this.buildAnalyticsContext(
          req,
          data.analyticsMeta,
          {
            themeName: data.theme.name,
            colorName: data.colorName,
            showWatermark: data.showWatermark,
            customSectionNames: data.customSectionNames || {},
            enabledSections: data.enabledSections || {}
          }
        );

        this.recordExportAnalytics({
          exportType: 'pdf',
          meta: normalizedMeta,
          mode: resolvedMode,
          sourceUrl: resolvedSourceUrl
        });
      }

      // Check if response hasn't been sent yet (client might have disconnected)
      if (!res.headersSent) {
        // Send response
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="resume.pdf"');
        res.setHeader('Content-Length', pdfBuffer.length);
        res.end(pdfBuffer, 'binary');
      } else {
        console.log(`[Queue] Job ${job.id} completed but client disconnected`);
      }

    } catch (error) {
      console.error(`[Queue] Job ${job.id} processing error:`, error);

      // Check if response hasn't been sent yet
      if (!res.headersSent) {
        res.status(500).json({
          error: 'PDF generation failed',
          message: error.message
        });
      }

      throw error; // Re-throw for stats tracking
    }
  }

  /**
   * Clean up jobs that have been running for too long (stuck jobs)
   */
  cleanupStuckJobs() {
    const now = Date.now();
    const stuckJobs = [];

    for (const [jobId, job] of this.activeJobs.entries()) {
      const runningTime = now - job.startedAt;
      if (runningTime > this.config.stuckJobTimeoutMs) {
        stuckJobs.push(job);
      }
    }

    if (stuckJobs.length > 0) {
      console.warn(`[Queue] Found ${stuckJobs.length} stuck jobs, cleaning up...`);

      stuckJobs.forEach(job => {
        console.warn(`[Queue] Removing stuck job ${job.id} (running for ${Math.floor((now - job.startedAt) / 1000)}s)`);

        // Remove from active jobs
        this.activeJobs.delete(job.id);

        // Send error response if possible
        if (!job.res.headersSent) {
          job.res.status(500).json({
            error: 'PDF generation timeout',
            message: 'The PDF generation process took too long and was terminated'
          });
        }

        this.stats.totalFailed++;
      });

      // Process next jobs
      setImmediate(() => this.processNext());
    }
  }

  /**
   * Shutdown the queue manager gracefully
   */
  shutdown() {
    console.log('[Queue] Shutting down PDF queue manager...');

    // Clear intervals
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
    }

    // Send error response to all queued jobs
    this.queue.forEach(job => {
      if (!job.res.headersSent) {
        job.res.status(503).json({
          error: 'Server is shutting down',
          message: 'Please try again shortly'
        });
      }
    });

    this.queue = [];

    console.log(`[Queue] ${this.activeJobs.size} active jobs still processing...`);
  }
}

module.exports = PdfQueueManager;
