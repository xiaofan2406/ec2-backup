const chalk = require('chalk');
const scheduler = require('./src/scheduler');

process.stdout.write('\x1bc');

scheduler('0 0 23 * * *'); // every day 23:00:00

console.log(chalk.green('Back up program running...'));
console.log();
console.log(chalk.cyan('The scheduler will run every day on 23:00'));
console.log(chalk.cyan('The following backups are kept at any given time'));
console.log(chalk.cyan('--- 4 weeks ago, 3 weeks ago, 2 weeks ago, 1 week ago (Sunday)'));
console.log(chalk.cyan('--- All 7 days of the current week'));
console.log();
console.log(chalk.dim('--- Keep this program running, otherwise the scheduled jobs will not run'));
console.log(chalk.dim('--- Inspect ./logs/ folder for log information'));
console.log(chalk.dim('--- In case of failure, inspect and snapshots-state.json, and AWS console'));
console.log(chalk.dim('        make sure the snapshots information are correct, then relaunch the program'));
console.log();
