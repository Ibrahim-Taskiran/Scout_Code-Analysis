const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectDir = path.resolve(__dirname, '..');
const desktopPath = 'C:\\Users\\ibrah\\Desktop\\Scout Code Analysis.lnk';
const launchVbs = path.join(projectDir, 'launch.vbs');

const psScript = `
$sh = New-Object -ComObject WScript.Shell
$s = $sh.CreateShortcut('${desktopPath}')
$s.TargetPath = '${launchVbs}'
$s.WorkingDirectory = '${projectDir}'
$s.IconLocation = '${path.join(projectDir, 'node_modules', 'electron', 'dist', 'electron.exe')},0'
$s.Save()
`;

fs.writeFileSync(path.join(__dirname, 'create_shortcut.ps1'), psScript);
try {
  execSync('powershell -ExecutionPolicy Bypass -File "' + path.join(__dirname, 'create_shortcut.ps1') + '"');
  console.log('Successfully updated Desktop shortcut!');
} catch (err) {
  console.error('Failed to update shortcut:', err.message);
} finally {
  if (fs.existsSync(path.join(__dirname, 'create_shortcut.ps1'))) {
    fs.unlinkSync(path.join(__dirname, 'create_shortcut.ps1'));
  }
}
