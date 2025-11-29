import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.API_KEY;
console.log('API Key present:', !!apiKey);

const ai = new GoogleGenAI({ apiKey });

async function testModel(modelName) {
    console.log(`\nTesting model: ${modelName}`);
    try {
        // Try the new SDK method
        try {
            const model = ai.getGenerativeModel({ model: modelName });
            const result = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: 'Hello' }] }]
            });
            console.log(`SUCCESS with getGenerativeModel! Response:`, result.response.text());
            return;
        } catch (e) {
            console.log(`Failed with getGenerativeModel: ${e.message}`);
        }

        // Try the old SDK method (just in case)
        try {
            const result = await ai.models.generateContent({
                model: modelName,
                contents: [{ role: 'user', parts: [{ text: 'Hello' }] }]
            });
            console.log(`SUCCESS with ai.models.generateContent!`);
            return;
        } catch (e) {
            console.log(`Failed with ai.models.generateContent: ${e.message}`);
        }

    } catch (error) {
        console.error(`FATAL ERROR for ${modelName}:`, error);
    }
}

async function run() {
    await testModel('gemini-1.5-flash');
    await testModel('models/gemini-1.5-flash');
    await testModel('gemini-2.0-flash-exp');
    await testModel('gemini-pro');
}

run();
