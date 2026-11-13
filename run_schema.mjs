// Retired during the Neon migration. Prevent accidental destructive schema resets.
console.error('This legacy reset tool is disabled. Use npm run db:migrate for versioned additive Neon migrations.');
process.exitCode = 1;
