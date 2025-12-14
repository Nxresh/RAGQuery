import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

async function testFlash() {
    const models = ['gemini-1.5-flash-8b', 'gemini-1.0-pro', 'gemini-pro'];
    for (const mName of models) {
        try {
            const model = genAI.getGenerativeModel({ model: mName });
            console.log(`Testing ${mName}...`);
            const result = await model.generateContent('Hi');
            console.log(`Success ${mName}:`, result.response.text());
        } catch (e) {
            console.log(`Error ${mName}:`, e.message.split('[')[0]);
            if (e.message.includes('404')) console.log(`CONFIRMED 404 for ${mName}`);
            if (e.message.includes('429')) console.log(`CONFIRMED 429 for ${mName}`);
        }
    }
}

testFlash();
