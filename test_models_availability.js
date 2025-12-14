import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const apiKey = process.env.API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
    const logFile = 'models_result.log';
    fs.writeFileSync(logFile, 'Testing model availability...\n');

    const modelsToTest = [
        'gemini-1.5-flash',
        'gemini-1.5-pro',
        'gemini-1.0-pro',
        'gemini-pro',
        'gemini-2.0-flash-exp',
    ];

    console.log('Testing model availability...');
    for (const modelName of modelsToTest) {
        try {
            const m = genAI.getGenerativeModel({ model: modelName });
            await m.generateContent('Hi');
            const msg = `✅ ${modelName} is AVAILABLE (Success)\n`;
            console.log(msg.trim());
            fs.appendFileSync(logFile, msg);
        } catch (e) {
            if (e.message.includes('429') || e.status === 429) {
                const msg = `⚠️ ${modelName} is AVAILABLE (Rate Limit)\n`;
                console.log(msg.trim());
                fs.appendFileSync(logFile, msg);
            } else {
                const msg = `❌ ${modelName} failed: ${e.message.split('[')[0]}\n`;
                console.log(`❌ ${modelName} failed`);
                fs.appendFileSync(logFile, msg);
            }
        }
    }
}

listModels();
