import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

async function run() {
    try {
        console.log('Testing gemini-pro...');
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const result = await model.generateContent("Hello, are you working?");
        console.log('Response:', result.response.text());
        console.log('SUCCESS');
    } catch (error) {
        console.log('ERROR:', error.message);
    }
}

run();
