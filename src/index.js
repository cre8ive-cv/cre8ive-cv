const { runCli } = require('./cli');

runCli().catch(() => process.exit(1));
