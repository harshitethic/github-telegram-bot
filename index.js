const TelegramBot = require('node-telegram-bot-api');
const simpleGit = require('simple-git');
const archiver = require('archiver');
const axios = require('axios');
const fs = require('fs');

// Replace 'YOUR_TELEGRAM_TOKEN' with your actual Telegram bot token
const token = 'YOUR_TELEGRAM_TOKEN';
const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const imageUrl = 'https://kinsta.com/wp-content/uploads/2018/04/what-is-github-1-1.png';

  bot.sendPhoto(chatId, imageUrl, { caption: 'Welcome to the GitHub Clone Bot! 🤖' });

  const keyboard = {
    inline_keyboard: [[{ text: 'Developer', url: 'https://harshitethic.in' }]],
  };

  bot.sendMessage(chatId, 'You can clone a GitHub repository using this bot. Just send me the repository URL.\nType /help - For Help Menu', {
    reply_markup: JSON.stringify(keyboard),
  });
});

bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  const helpMessage =
    'To clone a GitHub repository, use the /clone command followed by the repository URL.\n\nFor example:\n/clone https://github.com/username/repository';

  bot.sendMessage(chatId, helpMessage);
});

bot.onText(/\/clone (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const gitUrl = match[1];

  try {
    bot.sendMessage(chatId, 'Cloning the repository... ⌛️');

    // Clone the repository
    const repoName = gitUrl.split('/').pop().replace('.git', '');
    const cloneDir = `./${repoName}`;
    await simpleGit().clone(gitUrl, cloneDir);

    bot.sendMessage(chatId, 'Repository cloned successfully! Zipping the files... ⌛️');

    // Create a ZIP archive
    const output = fs.createWriteStream(`${repoName}.zip`);
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(output);
    archive.directory(cloneDir, repoName);
    await archive.finalize();

    bot.sendMessage(chatId, 'Files zipped successfully! Uploading the ZIP file... ⌛️');

    // Read the ZIP file as a buffer
    const zipFile = fs.readFileSync(`${repoName}.zip`);

    // Send the ZIP file to Telegram
    await bot.sendDocument(chatId, zipFile, {}, { filename: `${repoName}.zip` });

    bot.sendMessage(chatId, 'ZIP file uploaded successfully! Cleaning up... ⌛️');

    // Delete the cloned directory and ZIP file
    fs.rmdirSync(cloneDir, { recursive: true });
    fs.unlinkSync(`${repoName}.zip`);

    bot.sendMessage(chatId, 'Clean up complete! 🧹');
  } catch (error) {
    bot.sendMessage(chatId, 'An error occurred while cloning the repository. Please try again later.');
  }
});

