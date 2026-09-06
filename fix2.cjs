const fs = require('fs');

let spay = fs.readFileSync('src/views/SpaylaterView.tsx', 'utf8');
spay = spay.replace(/payInstallment\(inst\.id\)/g, "payInstallment(inst.id, new Date().toISOString().split('T')[0])");
fs.writeFileSync('src/views/SpaylaterView.tsx', spay);

let spin = fs.readFileSync('src/views/SpinjamView.tsx', 'utf8');
spin = spin.replace(/payInstallment\(inst\.id\)/g, "payInstallment(inst.id, new Date().toISOString().split('T')[0])");
fs.writeFileSync('src/views/SpinjamView.tsx', spin);

let settings = fs.readFileSync('src/views/SettingsView.tsx', 'utf8');
settings = settings.replace(/exportDataToJSON\(backupData, /g, "exportDataToJSON(JSON.parse(backupData), ");
fs.writeFileSync('src/views/SettingsView.tsx', settings);
