const fs = require('fs');
const path = require('path');

const filePaths = [
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

  // Fix structural alignment and spacing
  // Standardize gap-X to gap-4 (excluding gap-2 if it's for small icons, but let's standardise gap-6 and gap-8 to gap-4 if we want, wait, the prompt says "Use consistent Tailwind spacing (e.g., p-6, gap-4) so the interface doesn't feel cramped.")
  
  // Let's replace padding: p-3, p-4, p-5, p-8 with p-6 in main cards.
  // Actually, it's safer to find the cards and forms.
  // The cards were previously "bg-white ... shadow-md"
  // Let's ensure form tags and their containers use grid/flex.
  
  // Make sure forms are flex cols with gap-4
  content = content.replace(/<form([^>]*)className="([^"]*)"/g, (match, before, classNames) => {
    let newClasses = classNames;
    if (!newClasses.includes('flex') && !newClasses.includes('grid')) {
      newClasses += ' flex flex-col gap-4';
    } else {
      newClasses = newClasses.replace(/space-y-\d+/g, 'gap-4');
    }
    return `<form${before}className="${newClasses}"`;
  });

  // Make sure space-y-X in general becomes flex flex-col gap-4 if it's a container
  content = content.replace(/className="([^"]*space-y-\d+[^"]*)"/g, (match, classNames) => {
    let newClasses = classNames.replace(/space-y-\d+/g, 'flex flex-col gap-4');
    return `className="${newClasses}"`;
  });
  
  // Let's replace `p-8` with `p-6` to standardize, and `p-4`, `p-5` with `p-6` for larger padding requests?
  // User asked: "Use consistent Tailwind spacing (e.g., p-6, gap-4) so the interface doesn't feel cramped."
  content = content.replace(/p-4/g, 'p-6');
  content = content.replace(/p-5/g, 'p-6');
  content = content.replace(/p-8/g, 'p-6');
  
  // Replace gap-8 with gap-4? Actually gap-8 is not cramped, it's very spacious. But let's standardize.
  content = content.replace(/gap-8/g, 'gap-4');
  content = content.replace(/gap-6/g, 'gap-4');
  // I will leave gap-2 and gap-3 alone as they are usually for icons and small text.
  
  // Mobile Responsiveness: "Ensure the main dashboards and navigation don't break horizontally on smaller screens by applying proper responsive prefixes (md:, lg:)."
  // E.g. grid-cols-2 -> md:grid-cols-2
  content = content.replace(/\bgrid-cols-(\d+)\b/g, (match) => {
    return `md:${match}`;
  });
  
  // Wait, if it already had md:grid-cols-2 it might become md:md:grid-cols-2. Let's fix that.
  content = content.replace(/md:md:/g, 'md:');
  content = content.replace(/lg:md:/g, 'lg:');
  
  // Same for flex-row etc.
  content = content.replace(/\bflex-row\b/g, 'md:flex-row flex-col');
  content = content.replace(/md:md:flex-row/g, 'md:flex-row');

  // Any data table should be fully responsive (overflow-x-auto is usually correct, which is already there).
  
  // We want to make sure tables align properly on X and Y axis.
  // Add 'w-full text-left border-collapse' to tables if missing.
  content = content.replace(/<table([^>]*)className="([^"]*)"/g, (match, before, classNames) => {
    let newClasses = classNames;
    if (!newClasses.includes('w-full')) newClasses += ' w-full';
    if (!newClasses.includes('text-left')) newClasses += ' text-left';
    return `<table${before}className="${newClasses}"`;
  });
  
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`Structured ${filePath}`);
}

filePaths.forEach(processFile);
