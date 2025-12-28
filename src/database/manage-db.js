#!/usr/bin/env node

/**
 * Database management CLI tool
 * Usage: node manage-db.js <command> [options]
 */

const AnalyticsDatabase = require('./db.js');
const path = require('path');

const dbPath = path.join(__dirname, 'analytics.db');
const db = new AnalyticsDatabase(dbPath);

const command = process.argv[2];
const arg = process.argv[3];

function showHelp() {
  console.log(`
Database Management Tool
========================

Usage: node manage-db.js <command> [options]

Commands:
  stats                    Show database statistics
  list [limit]            List all records (default: 10, use 'all' for all)
  delete <id>             Delete record by ID
  delete-all              Delete all records (use with caution!)
  delete-before <date>    Delete records before date (YYYY-MM-DD)
  delete-type <type>      Delete records by type (pdf, html, json)
  help                    Show this help message

Examples:
  node manage-db.js stats
  node manage-db.js list 20
  node manage-db.js delete 5
  node manage-db.js delete-all
  node manage-db.js delete-before 2025-01-01
  node manage-db.js delete-type pdf
  `);
}

function showStats() {
  console.log('\n📊 Database Statistics\n');
  console.log(`Total records: ${db.getTotalCount()}\n`);

  console.log('By Theme:');
  const byTheme = db.getThemeCounts();
  byTheme.forEach(row => {
    console.log(`  ${row.selected_theme}: ${row.count}`);
  });

  console.log('\nBy Export Type:');
  const byType = db.getExportTypeCounts();
  byType.forEach(row => {
    console.log(`  ${row.export_type}: ${row.count}`);
  });
  console.log('');
}

function listRecords(limit = 10) {
  const limitNum = limit === 'all' ? 999999 : parseInt(limit) || 10;
  const records = db.getStats({ limit: limitNum });

  console.log(`\n📝 Records (showing ${records.length}):\n`);

  if (records.length === 0) {
    console.log('No records found.\n');
    return;
  }

  records.forEach(record => {
    console.log(`ID: ${record.id}`);
    console.log(`  Timestamp: ${record.timestamp}`);
    console.log(`  Type: ${record.export_type}`);
    console.log(`  Theme: ${record.selected_theme}`);
    console.log(`  Color: ${record.selected_color}`);
    console.log(`  Mode: ${record.mode}`);
    console.log(`  Watermark: ${record.show_watermark ? 'Yes' : 'No'}`);
    console.log('');
  });
}

function deleteRecord(id) {
  const idNum = parseInt(id);
  if (isNaN(idNum)) {
    console.error('❌ Invalid ID. Must be a number.');
    process.exit(1);
  }

  const deleted = db.deleteRecord(idNum);
  if (deleted > 0) {
    console.log(`✅ Deleted record ${idNum}`);
  } else {
    console.log(`⚠️  No record found with ID ${idNum}`);
  }
}

function deleteAll() {
  console.log('⚠️  WARNING: This will delete ALL records!');
  console.log('Press Ctrl+C to cancel...');

  // Simple confirmation (in a real CLI, you'd use readline)
  setTimeout(() => {
    const deleted = db.deleteAllRecords();
    console.log(`✅ Deleted ${deleted} records`);
    db.close();
    process.exit(0);
  }, 2000);
}

function deleteOlderThan(date) {
  if (!/^\d{4}-\d{2}-\d{2}/.test(date)) {
    console.error('❌ Invalid date format. Use YYYY-MM-DD');
    process.exit(1);
  }

  const deleted = db.deleteRecordsOlderThan(date);
  console.log(`✅ Deleted ${deleted} records before ${date}`);
}

function deleteByType(type) {
  const validTypes = ['pdf', 'html', 'json'];
  if (!validTypes.includes(type)) {
    console.error(`❌ Invalid type. Must be one of: ${validTypes.join(', ')}`);
    process.exit(1);
  }

  const deleted = db.deleteRecordsByType(type);
  console.log(`✅ Deleted ${deleted} ${type} records`);
}

// Main command handler
try {
  switch (command) {
    case 'stats':
      showStats();
      break;

    case 'list':
      listRecords(arg);
      break;

    case 'delete':
      if (!arg) {
        console.error('❌ Missing ID. Usage: node manage-db.js delete <id>');
        process.exit(1);
      }
      deleteRecord(arg);
      break;

    case 'delete-all':
      deleteAll();
      return; // Don't close DB yet, setTimeout will handle it

    case 'delete-before':
      if (!arg) {
        console.error('❌ Missing date. Usage: node manage-db.js delete-before <YYYY-MM-DD>');
        process.exit(1);
      }
      deleteOlderThan(arg);
      break;

    case 'delete-type':
      if (!arg) {
        console.error('❌ Missing type. Usage: node manage-db.js delete-type <pdf|html|json>');
        process.exit(1);
      }
      deleteByType(arg);
      break;

    case 'help':
    case '--help':
    case '-h':
      showHelp();
      break;

    default:
      console.error(`❌ Unknown command: ${command}\n`);
      showHelp();
      process.exit(1);
  }

  db.close();
} catch (error) {
  console.error('❌ Error:', error.message);
  db.close();
  process.exit(1);
}
