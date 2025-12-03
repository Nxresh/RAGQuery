import dotenv from 'dotenv';
dotenv.config();
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.API_KEY;
if (!apiKey) {
    console.error("❌ API_KEY is missing in .env");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

const modelsToTest = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-001",
    "gemini-1.5-pro",
    "gemini-pro",
    "gemini-1.0-pro"
];

async function testModel(modelName) {
    console.log(`\nTesting model: ${modelName}...`);
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Say 'OK' if you can hear me.");
        const response = await result.response;
        console.log(`✅ ${modelName} SUCCESS: ${response.text()}`);
        return true;
    } catch (error) {
        console.error(`❌ ${modelName} FAILED: ${error.message}`);
        return false;
    }
}

async function runTests() {
    console.log("Starting GenAI Model Diagnostics...");
    let successCount = 0;

    for (const model of modelsToTest) {
        if (await testModel(model)) {
            successCount++;
        }
    }

    if (successCount === 0) {
        console.error("\n❌ ALL MODELS FAILED. Check your API Key or Quota.");
    } else {
        console.log(`\n✅ ${successCount} models working.`);
    }
}

runTests();
