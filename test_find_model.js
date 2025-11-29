// Test different model names
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const modelsToTry = [
    'gemini-pro',
    'gemini-1.5-pro',
    'gemini-1.5-flash-latest',
    'gemini-flash',
    'models/gemini-pro',
    'models/gemini-1.5-flash'
];

async function testModels() {
    const genAI = new GoogleGenerativeAI(process.env.API_KEY);

    for (const modelName of modelsToTry) {
        try {
            console.log(`\nTrying model: ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Say hello");
            const response = await result.response;
            const text = response.text();

            console.log(`✅ SUCCESS with ${modelName}!`);
            console.log(`Response: ${text.substring(0, 50)}...`);
            console.log(`\n🎯 USE THIS MODEL: ${modelName}`);
            break;
        } catch (error) {
            console.log(`❌ Failed: ${error.message}`);
        }
    }
}

testModels();
