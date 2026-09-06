const fs = require('fs');

let dbCode = fs.readFileSync('src/lib/db/index.ts', 'utf8');
dbCode = dbCode.replace(/accountNumber TEXT,\s*description TEXT,/g, 'accountNumber TEXT,');
dbCode = dbCode.replace(/account\.description \|\| null,/g, '');
dbCode = dbCode.replace(/acc\.description \|\| null,/g, '');
dbCode = dbCode.replace(/a\.description \|\| null,/g, '');
dbCode = dbCode.replace(/accountNumber, description, createdAt/g, 'accountNumber, createdAt');

dbCode = dbCode.replace(/isRecurring INTEGER DEFAULT 0,\s*recurringId TEXT,\s*goalId TEXT,\s*installmentId TEXT,/g, 'isRecurring INTEGER DEFAULT 0,\n      goalId TEXT,');
dbCode = dbCode.replace(/isRecurring, recurringId, goalId, installmentId, adminFee/g, 'isRecurring, goalId, adminFee');
dbCode = dbCode.replace(/tx\.recurringId \|\| null, tx\.goalId \|\| null, tx\.installmentId \|\| null,/g, 'tx.goalId || null,');
dbCode = dbCode.replace(/t\.recurringId \|\| null, t\.goalId \|\| null, t\.installmentId \|\| null,/g, 't.goalId || null,');
dbCode = dbCode.replace(/, recurringId, goalId, installmentId, adminFee, createdAt/g, ', goalId, adminFee, createdAt');

dbCode = dbCode.replace(/CREATE TABLE IF NOT EXISTS recurringTransactions \([\s\S]*?\)/, `CREATE TABLE IF NOT EXISTS recurringTransactions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      categoryId TEXT NOT NULL,
      accountId TEXT NOT NULL,
      toAccountId TEXT,
      frequency TEXT NOT NULL,
      dayOfMonth INTEGER,
      nextDueDate TEXT,
      notes TEXT,
      isActive INTEGER DEFAULT 1,
      autoCreate INTEGER DEFAULT 0,
      createdAt TEXT
    )`);
dbCode = dbCode.replace(/INSERT INTO recurringTransactions \(id, name, amount, type, categoryId, accountId, toAccountId, frequency, startDate, nextDueDate, lastProcessedDate, isActive, createdAt\)/g, 'INSERT INTO recurringTransactions (id, title, amount, type, categoryId, accountId, toAccountId, frequency, dayOfMonth, nextDueDate, notes, isActive, autoCreate, createdAt)');
dbCode = dbCode.replace(/\[r\.id, r\.name, r\.amount, r\.type, r\.categoryId, r\.accountId, r\.toAccountId \|\| null, r\.frequency, r\.startDate, r\.nextDueDate \|\| null, r\.lastProcessedDate \|\| null, r\.isActive \? 1 : 0, r\.createdAt \|\| new Date\(\)\.toISOString\(\)\]/g, '[r.id, r.title, r.amount, r.type, r.categoryId, r.accountId, r.toAccountId || null, r.frequency, r.dayOfMonth || null, r.nextDueDate || null, r.notes || null, r.isActive ? 1 : 0, r.autoCreate ? 1 : 0, r.createdAt || new Date().toISOString()]');

dbCode = dbCode.replace(/CREATE TABLE IF NOT EXISTS installments \([\s\S]*?\)/, `CREATE TABLE IF NOT EXISTS installments (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      totalAmount REAL,
      monthlyAmount REAL NOT NULL,
      totalTenorMonths INTEGER NOT NULL,
      currentInstallment INTEGER NOT NULL,
      dueDayOfMonth INTEGER NOT NULL,
      nextDueDate TEXT,
      accountId TEXT NOT NULL,
      notes TEXT,
      isCompleted INTEGER DEFAULT 0,
      createdAt TEXT
    )`);
dbCode = dbCode.replace(/INSERT INTO installments \(id, name, type, totalLoan, totalRepayment, monthlyAmount, totalTenorMonths, remainingMonths, interestRate, accountId, categoryId, dueDateDay, nextDueDate, isCompleted, createdAt\)/g, 'INSERT INTO installments (id, type, title, totalAmount, monthlyAmount, totalTenorMonths, currentInstallment, dueDayOfMonth, nextDueDate, accountId, notes, isCompleted, createdAt)');
dbCode = dbCode.replace(/\[i\.id, i\.name, i\.type, i\.totalLoan, i\.totalRepayment, i\.monthlyAmount, i\.totalTenorMonths, i\.remainingMonths, i\.interestRate \|\| null, i\.accountId, i\.categoryId, i\.dueDateDay, i\.nextDueDate \|\| null, i\.isCompleted \? 1 : 0, i\.createdAt \|\| new Date\(\)\.toISOString\(\)\]/g, '[i.id, i.type, i.title, i.totalAmount || null, i.monthlyAmount, i.totalTenorMonths, i.currentInstallment, i.dueDayOfMonth, i.nextDueDate || null, i.accountId, i.notes || null, i.isCompleted ? 1 : 0, i.createdAt || new Date().toISOString()]');

dbCode = dbCode.replace(/inst\.remainingMonths <= 0/g, 'inst.currentInstallment >= inst.totalTenorMonths');
dbCode = dbCode.replace(/inst\.categoryId/g, "'cat_installments'");
dbCode = dbCode.replace(/inst\.name/g, 'inst.title');
dbCode = dbCode.replace(/Sisa: \$\{inst\.remainingMonths - 1\}x/g, 'Ke-${inst.currentInstallment + 1}/${inst.totalTenorMonths}');
dbCode = dbCode.replace(/const newRemaining = inst\.remainingMonths - 1;/g, 'const newCurrentInstall = inst.currentInstallment + 1;');
dbCode = dbCode.replace(/newRemaining > 0/g, 'newCurrentInstall < inst.totalTenorMonths');
dbCode = dbCode.replace(/UPDATE installments SET remainingMonths = \$1/g, 'UPDATE installments SET currentInstallment = $1');
dbCode = dbCode.replace(/newRemaining, nextDueDate, newRemaining === 0 \? 1 : 0/g, 'newCurrentInstall, nextDueDate, newCurrentInstall >= inst.totalTenorMonths ? 1 : 0');

fs.writeFileSync('src/lib/db/index.ts', dbCode);


let storeCode = fs.readFileSync('src/hooks/useBudgetStore.ts', 'utf8');
storeCode = storeCode.replace(/accountNumber, description, createdAt/g, 'accountNumber, createdAt');
storeCode = storeCode.replace(/account\.description \|\| null, new Date\(\)\.toISOString\(\)/g, 'new Date().toISOString()');

storeCode = storeCode.replace(/INSERT INTO recurringTransactions \(id, name, amount, type, categoryId, accountId, toAccountId, frequency, startDate, nextDueDate, lastProcessedDate, isActive, createdAt\)/g, 'INSERT INTO recurringTransactions (id, title, amount, type, categoryId, accountId, toAccountId, frequency, dayOfMonth, nextDueDate, notes, isActive, autoCreate, createdAt)');
storeCode = storeCode.replace(/\[id, rec\.name, rec\.amount, rec\.type, rec\.categoryId, rec\.accountId, rec\.toAccountId \|\| null, rec\.frequency, rec\.startDate, rec\.nextDueDate \|\| null, rec\.lastProcessedDate \|\| null, rec\.isActive \? 1 : 0, new Date\(\)\.toISOString\(\)\]/g, '[id, rec.title, rec.amount, rec.type, rec.categoryId, rec.accountId, rec.toAccountId || null, rec.frequency, rec.dayOfMonth || null, rec.nextDueDate || null, rec.notes || null, rec.isActive ? 1 : 0, rec.autoCreate ? 1 : 0, new Date().toISOString()]');

storeCode = storeCode.replace(/INSERT INTO installments \(id, name, type, totalLoan, totalRepayment, monthlyAmount, totalTenorMonths, remainingMonths, interestRate, accountId, categoryId, dueDateDay, nextDueDate, isCompleted, createdAt\)/g, 'INSERT INTO installments (id, type, title, totalAmount, monthlyAmount, totalTenorMonths, currentInstallment, dueDayOfMonth, nextDueDate, accountId, notes, isCompleted, createdAt)');
storeCode = storeCode.replace(/\[id, installment\.name, installment\.type, installment\.totalLoan, installment\.totalRepayment, installment\.monthlyAmount, installment\.totalTenorMonths, installment\.remainingMonths, installment\.interestRate \|\| null, installment\.accountId, installment\.categoryId, installment\.dueDateDay, installment\.nextDueDate \|\| null, installment\.isCompleted \? 1 : 0, new Date\(\)\.toISOString\(\)\]/g, '[id, installment.type, installment.title, installment.totalAmount || null, installment.monthlyAmount, installment.totalTenorMonths, installment.currentInstallment, installment.dueDayOfMonth, installment.nextDueDate || null, installment.accountId, installment.notes || null, installment.isCompleted ? 1 : 0, new Date().toISOString()]');

fs.writeFileSync('src/hooks/useBudgetStore.ts', storeCode);


let spayCode = fs.readFileSync('src/views/SpaylaterView.tsx', 'utf8');
spayCode = spayCode.replace(/payInstallment\(selectedInst\.id\)/g, "payInstallment(selectedInst.id, new Date().toISOString().split('T')[0])");
fs.writeFileSync('src/views/SpaylaterView.tsx', spayCode);

let spinCode = fs.readFileSync('src/views/SpinjamView.tsx', 'utf8');
spinCode = spinCode.replace(/payInstallment\(selectedInst\.id\)/g, "payInstallment(selectedInst.id, new Date().toISOString().split('T')[0])");
fs.writeFileSync('src/views/SpinjamView.tsx', spinCode);

let settingsCode = fs.readFileSync('src/views/SettingsView.tsx', 'utf8');
settingsCode = settingsCode.replace(/await importDatabaseBackup\(pendingImportData\);/g, "await importDatabaseBackup(JSON.stringify(pendingImportData));");
fs.writeFileSync('src/views/SettingsView.tsx', settingsCode);
