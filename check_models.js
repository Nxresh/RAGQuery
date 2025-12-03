import dotenv from 'dotenv';
dotenv.config();
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.API_KEY);

async function listModels() {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        // Note: getGenerativeModel doesn't list models, we need to use the model manager if available or just test standard ones.
        // Actually, the SDK doesn't have a direct "listModels" method exposed easily in the high level helper sometimes, 
        // but we can try a simple generation with a known fallback like 'gemini-pro'.

        // However, the error message suggested calling ListModels. 
        // In the Node SDK, it might not be directly exposed or I might need to use the REST API.
        // Let's try to just test 'gemini-pro' and 'gemini-1.5-flash-001'.

        console.log("Testing gemini-1.5-flash-001...");
        try {
            const m1 = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });
            await m1.generateContent("Hello");
            console.log("✅ gemini-1.5-flash-001 is WORKING");
        } catch (e) {
            console.log("❌ gemini-1.5-flash-001 failed:", e.message);
        }

        console.log("Testing gemini-pro...");
        try {
            const m2 = genAI.getGenerativeModel({ model: "gemini-pro" });
            await m2.generateContent("Hello");
            console.log("✅ gemini-pro is WORKING");
        } catch (e) {
            console.log("❌ gemini-pro failed:", e.message);
        }

        console.log("Testing gemini-1.5-pro...");
        try {
            const m3 = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
            await m3.generateContent("Hello");
            console.log("✅ gemini-1.5-pro is WORKING");
        } catch (e) {
            console.log("❌ gemini-1.5-pro failed:", e.message);
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

listModels();
