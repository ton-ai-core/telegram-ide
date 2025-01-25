import TelegramBot from 'node-telegram-bot-api';
import { config } from 'dotenv';
import * as fs from 'fs/promises';
import * as path from 'path';
import https from 'https';
import { compileTactCode } from './bot';
import * as fsSync from 'fs';

// Загружаем переменные окружения
config();

const TOKEN = process.env.BOT_TOKEN || '';
const bot = new TelegramBot(TOKEN, { polling: true });

// Создаем временную директорию, если её нет
const tempDir = './temp';
if (!fsSync.existsSync(tempDir)) {
    fsSync.mkdirSync(tempDir);
}

// Функция для скачивания файла
const downloadFile = (url: string, dest: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        const file = fsSync.createWriteStream(dest);
        https.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', async (err) => {
            await fs.unlink(dest);
            reject(err);
        });
    });
};

// Handle /start command
bot.onText(/\/start/, (msg: TelegramBot.Message) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Hello! You can:\n1. Send me a .tact file\n2. Use /build command with code in ``` ``` block');
});

// Handle /build command
bot.onText(/\/build/, async (msg: TelegramBot.Message) => {
    const chatId = msg.chat.id;
    
    console.log('Received message:', JSON.stringify(msg.text, null, 2));
    
    // Remove /build command from the text and trim
    const text = msg.text?.replace(/^\/build\s*/, '').trim();
    console.log('After removing command:', JSON.stringify(text, null, 2));
    
    if (!text) {
        await bot.sendMessage(chatId, 'Please provide the contract code after /build command');
        return;
    }

    if (!text.trim().startsWith('contract')) {
        await bot.sendMessage(chatId, 'The code should start with "contract" keyword');
        return;
    }

    try {
        const output = await compileTactCode(text);
        await bot.sendMessage(chatId, '✅ ' + output);
    } catch (error: any) {
        // Extract error information
        const errorMessage = error.message || '';
        
        // Look for error details in "Line X, col Y:" format
        const match = errorMessage.match(/Line (\d+), col (\d+):\n([\s\S]*?)\n\n/);
        
        if (match) {
            const [, line, col, context] = match;
            await bot.sendMessage(chatId, '❌ ' + `Compilation error at line ${line}, position ${col}:\n${context}\nPlease check your contract syntax.`);
        } else {
            await bot.sendMessage(chatId, '❌ ' + `Compilation error: ${errorMessage}\nPlease check your contract syntax.`);
        }
    }
});

// Handle file uploads
bot.on('document', async (msg) => {
    const chatId = msg.chat.id;
    const doc = msg.document;
    let filePath: string | undefined;

    if (!doc) {
        await bot.sendMessage(chatId, 'Error: No file received');
        return;
    }

    // Check if it's a .tact file
    if (!doc.file_name?.endsWith('.tact')) {
        await bot.sendMessage(chatId, 'Please send a .tact file');
        return;
    }

    try {
        // Download the file
        filePath = await bot.downloadFile(doc.file_id, tempDir);
        const source = await fs.readFile(filePath, 'utf8');

        // Compile the contract
        try {
            const output = await compileTactCode(source);
            await bot.sendMessage(chatId, '✅ ' + output);
        } catch (error: any) {
            // Extract error information
            const errorMessage = error.message || '';
            
            // Look for error details in "Line X, col Y:" format
            const match = errorMessage.match(/Line (\d+), col (\d+):\n([\s\S]*?)\n\n/);
            
            if (match) {
                const [, line, col, context] = match;
                await bot.sendMessage(chatId, '❌ ' + `Compilation error at line ${line}, position ${col}:\n${context}\nPlease check your contract syntax.`);
            } else {
                await bot.sendMessage(chatId, '❌ ' + `Compilation error: ${errorMessage}\nPlease check your contract syntax.`);
            }
        }

        // Clean up
        if (filePath) {
            await fs.unlink(filePath);
        }
    } catch (error: any) {
        await bot.sendMessage(chatId, 'Error processing file: ' + error.message);
        // Clean up on error
        if (filePath) {
            try {
                await fs.unlink(filePath);
            } catch (e) {
                console.error('Error cleaning up file:', e);
            }
        }
    }
});

// Remove the old text message handler since we now use /build command
bot.on('message', (msg) => {
    // Handle only commands and documents
    if (!msg.text?.startsWith('/') && !msg.document) {
        return;
    }
});

console.log('Bot is running and waiting for files...'); 