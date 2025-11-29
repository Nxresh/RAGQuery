import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey });

async function run() {
    console.log('SDK Version Check');

    // 1. Try to list models if possible (this might not exist on this SDK, but worth a try)
    try {
        // Some SDKs have listModels on the client or a specific manager
        if (ai.listModels) {
            const models = await ai.listModels();
            console.log('Available models:', models);
        } else if (ai.models && ai.models.list) {
            const models = await ai.models.list();
            console.log('Available models (ai.models.list):', models);
        } else {
            console.log('No listModels method found on SDK instance');
        }
    } catch (e) {
        console.log('Error listing models:', e.message);
    }

    // 2. Test specific model names with the getGenerativeModel pattern (most likely for 1.x)
    const modelNames = [
        'gemini-1.5-flash',
        'models/gemini-1.5-flash',
        'gemini-1.5-pro',
        'models/gemini-1.5-pro',
        'gemini-pro',
        'models/gemini-pro'
    ];

    for (const name of modelNames) {
        console.log(`\n--- Testing ${name} ---`);
        try {
            // Pattern A: ai.getGenerativeModel
            if (ai.getGenerativeModel) {
                const model = ai.getGenerativeModel({ model: name });
                const result = await model.generateContent({
                    contents: [{ role: 'user', parts: [{ text: 'Hi' }] }]
                });
                console.log(`SUCCESS with getGenerativeModel!`);
                return; // Found a working one!
            }
        } catch (e) {
            console.log(`Failed getGenerativeModel: ${e.message}`);
        }

        try {
            // Pattern B: ai.models.generateContent (older/different SDKs)
            if (ai.models && ai.models.generateContent) {
                await ai.models.generateContent({
                    model: name,
                    contents: [{ role: 'user', parts: [{ text: 'Hi' }] }]
                });
                console.log(`SUCCESS with ai.models.generateContent!`);
                return;
            }
        } catch (e) {
            console.log(`Failed ai.models.generateContent: ${e.message}`);
        }
    }
}

run();
