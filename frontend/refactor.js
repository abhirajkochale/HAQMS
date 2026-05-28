const fs = require('fs');
const path = require('path');

const filePaths = [
  'src/app/layout.js',
  'src/app/page.js',
  'src/app/login/page.js',
  'src/app/queue/page.js',
  'src/app/dashboard/page.js',
  'src/components/common/Navbar.js'
];

function processFile(filePath) {
  const fullPath = path.join(__dirname, filePath);
  if (!fs.existsSync(fullPath)) return;
  
  let content = fs.readFileSync(fullPath, 'utf8');

  // 1. Remove vibe-coded classes (glass, gradient-bg)
  content = content.replace(/\bglass\b/g, 'bg-white');
  content = content.replace(/\bgradient-bg\b/g, 'bg-slate-50');

  // 2. Remove all dark mode prefixes
  content = content.replace(/dark:[^\s"']+/g, '');

  // 3. Change teal/emerald/rose to blue (except error messages where red is better, let's just make everything consistent first, wait, rose-500 is used for errors. I will keep rose-500 for errors, but replace teal and emerald with blue)
  content = content.replace(/teal-(\d+)/g, 'blue-$1');
  content = content.replace(/emerald-(\d+)/g, 'blue-$1');
  
  // 4. Update data cards and structure to plain white with subtle shadows
  // We already replaced 'glass' with 'bg-white'. Let's ensure it has shadow-sm or shadow-md instead of shadow-lg or shadow-xl
  content = content.replace(/shadow-lg/g, 'shadow-md');
  content = content.replace(/shadow-xl/g, 'shadow-md');
  content = content.replace(/shadow-inner/g, 'shadow-sm');

  // 5. Breathing Room (Spacing)
  // Ensure consistent padding/margins
  // For dashboard/page.js, we have a lot of p-4, p-5, p-6. We can standardize some of the container padding.
  
  // 6. Medical Palette Backgrounds
  // "slate-50 for page backgrounds" -> in layout.js, we should have bg-slate-50
  
  // Clean up multiple spaces
  content = content.replace(/ {2,}/g, ' ');
  // Clean up spaces before closing quotes
  content = content.replace(/ \+"/g, '"');
  
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`Processed ${filePath}`);
}

filePaths.forEach(processFile);
