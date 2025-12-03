import dotenv from 'dotenv';
dotenv.config();
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.API_KEY;
if (!apiKey) {
    console.error("❌ API_KEY is missing");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

const models = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-001",
    "gemini-1.5-flash-latest",
    "gemini-1.5-flash-8b",
    "gemini-1.5-pro",
    "gemini-1.5-pro-001",
    "gemini-1.5-pro-latest",
    "gemini-pro",
    "gemini-1.0-pro",
    "gemini-1.0-pro-latest"
];

async function test() {
    console.log("🔍 Starting Comprehensive Model Test...");

    for (const modelName of models) {
        process.stdout.write(`Testing ${modelName.padEnd(25)} ... `);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            // Set a timeout to avoid hanging
            const resultPromise = model.generateContent("Hi");
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 5000));

            const result = await Promise.race([resultPromise, timeoutPromise]);
            const response = await result.response;
            const text = response.text();

            if (text) {
                console.log(`✅ WORKING`);
            } else {
                console.log(`⚠️  Empty Response`);
            }
        } catch (error) {
            let msg = error.message;
            if (msg.includes("404")) msg = "404 Not Found";
            else if (msg.includes("403")) msg = "403 Forbidden";
            else if (msg.includes("400")) msg = "400 Bad Request";
            else if (msg.includes("Timeout")) msg = "Timeout";

            console.log(`❌ FAILED (${msg})`);
        }
    }
    console.log("🏁 Test Complete");
}

test();
