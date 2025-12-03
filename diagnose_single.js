import dotenv from 'dotenv';
dotenv.config();
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

async function test() {
    console.log("Testing gemini-1.5-flash...");
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Hi");
        console.log("Success:", await result.response.text());
    } catch (error) {
        console.error("FULL ERROR DETAILS:");
        console.error(JSON.stringify(error, null, 2));
        console.error(error.message);
        if (error.response) {
            console.error("Response:", await error.response.text());
        }
    }
}

test();
