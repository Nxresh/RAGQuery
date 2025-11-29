import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.API_KEY;
if (!apiKey) {
    console.error('❌ API_KEY is missing');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

// A simple 1x1 red pixel base64 image
const base64Image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
const mimeType = "image/png";

async function listModels() {
    console.log('📋 Listing available models via REST API...');
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();

        if (data.models) {
            console.log('✅ Available Models:');
            const models = data.models.map(m => m.name.replace('models/', ''));
            console.log(models.join('\n'));
            return models;
        } else {
            console.error('❌ Failed to list models:', data);
            return [];
        }
    } catch (e) {
        console.error('Error listing models:', e);
        return [];
    }
}

async function testVision() {
    console.log('🔍 Testing Gemini Vision API...');
    console.log(`🔑 API Key present: ${!!apiKey}`);

    const availableModels = await listModels();

    // Filter for likely vision models
    const modelsToTry = availableModels.filter(m =>
        m.includes('gemini') && (m.includes('flash') || m.includes('pro') || m.includes('vision'))
    );

    if (modelsToTry.length === 0) {
        console.log('⚠️ No obvious vision models found in list. Trying defaults...');
        modelsToTry.push("gemini-1.5-flash", "gemini-1.5-pro");
    }

    console.log('🎯 Models to test:', modelsToTry);

    for (const modelName of modelsToTry) {
        console.log(`\n-----------------------------------`);
        console.log(`🤖 Trying model: ${modelName}`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });

            const prompt = "What color is this image?";
            const imagePart = {
                inlineData: {
                    data: base64Image,
                    mimeType: mimeType
                }
            };

            console.log('📤 Sending request...');
            const result = await model.generateContent([prompt, imagePart]);
            const response = await result.response;
            const text = response.text();

            console.log('✅ Success!');
            console.log('📝 Response:', text);
            console.log(`🎉 FOUND WORKING MODEL: ${modelName}`);
            return; // Exit on first success

        } catch (error) {
            console.error(`❌ Failed with ${modelName}`);
            if (error.statusText) console.error(`   Status: ${error.statusText}`);
            // console.error('   Details:', error);
        }
    }
    console.log('\n❌ All models failed.');
}

testVision();
