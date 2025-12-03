import dotenv from 'dotenv';
dotenv.config();
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.API_KEY);

async function listModels() {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Dummy init to get client
        // Actually, the SDK doesn't expose listModels directly on the client instance easily in all versions,
        // but we can try to use the model manager if available or just try a standard one.
        // Wait, the error message suggested: "Call ListModels to see the list of available models".
        // In the Node SDK, usually it's not directly exposed on the main class in older versions, but let's check.

        // Actually, for the Node SDK, we might not have a direct listModels method on the genAI instance in 0.24.0.
        // Let's try a different approach: just try 'gemini-pro' which is the standard.

        console.log("Testing gemini-pro...");
        const modelPro = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await modelPro.generateContent("Hello");
        console.log("gemini-pro works!");

        console.log("Testing gemini-1.5-flash...");
        const modelFlash = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const resultFlash = await modelFlash.generateContent("Hello");
        console.log("gemini-1.5-flash works!");

    } catch (error) {
        console.error("Error:", error.message);
    }
}

listModels();
