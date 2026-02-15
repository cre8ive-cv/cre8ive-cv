/**
 * SQLite database initialization and management
 * Stores resume export analytics
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

class AnalyticsDatabase {
  constructor(dbPath = null) {
    // Default database path
    if (!dbPath) {
      dbPath = path.join(__dirname, 'analytics.db');
    }
    this.dbPath = dbPath;

    // Ensure directory exists
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Initialize database
    this.db = new Database(dbPath);
    this.initSchema();
  }

  /**
   * Return the absolute path to the database file.
   * @returns {string}
   */
  getDatabasePath() {
    return this.dbPath;
  }

  /**
   * Initialize database schema
   */
  initSchema() {
    const schema = `
      CREATE TABLE IF NOT EXISTS export_analytics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        version TEXT,
        url TEXT,
        export_type TEXT NOT NULL,
        mode TEXT,
        selected_theme TEXT,
        selected_color TEXT,
        selected_layout TEXT,
        show_watermark INTEGER,
        enabled_sections_json TEXT,
        custom_section_names_json TEXT
      );

      -- Create indexes for common queries
      CREATE INDEX IF NOT EXISTS idx_timestamp ON export_analytics(timestamp);
      CREATE INDEX IF NOT EXISTS idx_export_type ON export_analytics(export_type);
      CREATE INDEX IF NOT EXISTS idx_theme ON export_analytics(selected_theme);
      CREATE INDEX IF NOT EXISTS idx_color ON export_analytics(selected_color);
      CREATE INDEX IF NOT EXISTS idx_mode ON export_analytics(mode);
    `;

    this.db.exec(schema);

    // Migrate existing databases: add selected_layout if missing
    const columns = this.db.pragma('table_info(export_analytics)').map(c => c.name);
    if (!columns.includes('selected_layout')) {
      this.db.exec(`ALTER TABLE export_analytics ADD COLUMN selected_layout TEXT`);
    }
  }

  /**
   * Insert export analytics record
   * @param {Object} data - Analytics data
   * @returns {number} - Inserted row ID
   */
  insertExportAnalytics(data) {
    const stmt = this.db.prepare(`
      INSERT INTO export_analytics (
        timestamp,
        version,
        url,
        export_type,
        mode,
        selected_theme,
        selected_color,
        selected_layout,
        show_watermark,
        enabled_sections_json,
        custom_section_names_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const meta = data.meta || {};
    const result = stmt.run(
      data.timestamp,
      data.version,
      data.url,
      data.exportType || 'pdf',
      data.mode || null,
      meta.selectedTheme || null,
      meta.selectedColor || null,
      meta.selectedLayout || null,
      meta.showWatermark ? 1 : 0,
      JSON.stringify(meta.enabledSections || {}),
      JSON.stringify(meta.customSectionNames || {})
    );

    return result.lastInsertRowid;
  }

  /**
   * Get analytics statistics
   * @param {Object} options - Query options
   * @returns {Array} - Query results
   */
  getStats(options = {}) {
    const { startDate, endDate, exportType, theme, color, limit = 1000 } = options;

    let query = 'SELECT * FROM export_analytics WHERE 1=1';
    const params = [];

    if (startDate) {
      query += ' AND timestamp >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND timestamp <= ?';
      params.push(endDate);
    }

    if (exportType) {
      query += ' AND export_type = ?';
      params.push(exportType);
    }

    if (theme) {
      query += ' AND selected_theme = ?';
      params.push(theme);
    }

    if (color) {
      query += ' AND selected_color = ?';
      params.push(color);
    }

    query += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(limit);

    const stmt = this.db.prepare(query);
    return stmt.all(...params);
  }

  /**
   * Get count by theme
   * @returns {Array} - Theme counts
   */
  getThemeCounts() {
    const stmt = this.db.prepare(`
      SELECT selected_theme, COUNT(*) as count
      FROM export_analytics
      WHERE selected_theme IS NOT NULL
      GROUP BY selected_theme
      ORDER BY count DESC
    `);
    return stmt.all();
  }

  /**
   * Get count by export type
   * @returns {Array} - Export type counts
   */
  getExportTypeCounts() {
    const stmt = this.db.prepare(`
      SELECT export_type, COUNT(*) as count
      FROM export_analytics
      GROUP BY export_type
      ORDER BY count DESC
    `);
    return stmt.all();
  }

  /**
   * Get total exports count
   * @returns {number} - Total count
   */
  getTotalCount() {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM export_analytics');
    const result = stmt.get();
    return result.count;
  }

  /**
   * Delete a specific record by ID
   * @param {number} id - Record ID to delete
   * @returns {number} - Number of rows deleted
   */
  deleteRecord(id) {
    const stmt = this.db.prepare('DELETE FROM export_analytics WHERE id = ?');
    const result = stmt.run(id);
    return result.changes;
  }

  /**
   * Delete all records
   * @returns {number} - Number of rows deleted
   */
  deleteAllRecords() {
    const stmt = this.db.prepare('DELETE FROM export_analytics');
    const result = stmt.run();
    return result.changes;
  }

  /**
   * Delete records older than a specific date
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {number} - Number of rows deleted
   */
  deleteRecordsOlderThan(date) {
    const stmt = this.db.prepare('DELETE FROM export_analytics WHERE timestamp < ?');
    const result = stmt.run(date);
    return result.changes;
  }

  /**
   * Delete records by export type
   * @param {string} exportType - Export type (pdf, html, json)
   * @returns {number} - Number of rows deleted
   */
  deleteRecordsByType(exportType) {
    const stmt = this.db.prepare('DELETE FROM export_analytics WHERE export_type = ?');
    const result = stmt.run(exportType);
    return result.changes;
  }

  /**
   * Close database connection
   */
  close() {
    this.db.close();
  }
}

module.exports = AnalyticsDatabase;
