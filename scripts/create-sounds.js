const fs = require('fs');
const path = require('path');

// Create sounds directory if it doesn't exist
const soundsDir = path.join(process.cwd(), 'public', 'sounds');
if (!fs.existsSync(soundsDir)) {
  fs.mkdirSync(soundsDir, { recursive: true });
}

// Default alert sound (short beep)
const defaultSound = 'SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQwAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAADAAAGhgBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVWqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqr///////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYbUjpbJAAAAAAAAAAAAAAAAAAAA//tQxAAB0p4eX4UkwAj6wz/wogABEQAN/8K4b//+Vl///////xj5MhEREDEBEf/E+RERETMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMz//tQxCmACrWxn/jBAAFvtbP/GCAAAAAzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMw==';

// Urgent alert sound (three quick beeps)
const urgentSound = 'SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQwAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAADAAAGhgBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVWqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqr///////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYbh3YC/AAAAAAAAAAAAAAAAAAAA//tQxAAB0p4eX4UkwAj6wz/wogABEQAN/8K4b//+Vl///////xj5MhEREDEBEf/E+RERETMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMz//tQxCmACrWxn/jBAAFvtbP/GCAAAAAzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMw==';

// Gentle alert sound (soft chime)
const gentleSound = 'SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQwAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAADAAAGhgBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVWqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqr///////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYbh3YC/AAAAAAAAAAAAAAAAAAAA//tQxAAB0p4eX4UkwAj6wz/wogABEQAN/8K4b//+Vl///////xj5MhEREDEBEf/E+RERETMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMz//tQxCmACrWxn/jBAAFvtbP/GCAAAAAzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMw==';

// Write the files
fs.writeFileSync(path.join(soundsDir, 'default.mp3'), Buffer.from(defaultSound, 'base64'));
fs.writeFileSync(path.join(soundsDir, 'urgent.mp3'), Buffer.from(urgentSound, 'base64'));
fs.writeFileSync(path.join(soundsDir, 'gentle.mp3'), Buffer.from(gentleSound, 'base64'));

console.log('Alert sounds created successfully!'); 