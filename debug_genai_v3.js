import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.API_KEY;
console.log('KEY_LOADED:', !!apiKey);

const genAI = new GoogleGenerativeAI(apiKey);

async function run() {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent("Hi");
        console.log('SUCCESS');
    } catch (error) {
        console.log('ERROR_MSG:', error.message);
        if (error.response) {
            console.log('ERROR_STATUS:', error.response.status);
        }
    }
}

run();
