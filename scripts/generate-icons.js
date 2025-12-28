import fs from 'fs';
import path from 'path';

// Hex strings for simple PNGs (purple/blue squares)
const ICON_192_HEX = '89504e470d0a1a0a0000000d49484452000000c0000000c00802000000f688568c0000003949444154789cedc101010000008220ffaf6e48400100000000000000000000000000000000000000000000000000000000000000000010e600c0018c606620000000049454e44ae426082';

const ICON_512_HEX = '89504e470d0a1a0a0000000d4948445200000200000002000802000000f473210e0000003949444154789cedc101010000008220ffaf6e48400100000000000000000000000000000000000000000000000000000000000000000010e60020050801815e0000000049454e44ae426082';

// Ensure directories exist
const publicDir = path.join(process.cwd(), 'client', 'public');
const iconsDir = path.join(publicDir, 'icons');

if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
}

// Convert hex to buffer and write
function writeIcon(filename, hex) {
    const buffer = Buffer.from(hex, 'hex');
    fs.writeFileSync(path.join(iconsDir, filename), buffer);
    console.log(`Created ${filename}`);
}

writeIcon('icon-192.png', ICON_192_HEX);
writeIcon('icon-512.png', ICON_512_HEX);
// Use same valid PNG for badge
writeIcon('badge-72.png', ICON_192_HEX);

console.log('Icons generated successfully (placeholders)!');
