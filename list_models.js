import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
    try {
        // Note: The SDK might not expose listModels directly on the client in all versions,
        // but let's try accessing the model manager if possible or just a simple generation to debug.
        // Actually, for @google/generative-ai, we can't easily list models without using the REST API directly
        // or a specific method if exposed.
        // Let's try a direct REST call to list models to be 100% sure what's available.

        console.log('Fetching available models via REST API...');
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();

        if (data.error) {
            console.error('API Error:', JSON.stringify(data.error, null, 2));
        } else if (data.models) {
            console.log('Available Models:');
            data.models.forEach(m => {
                if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent')) {
                    console.log(`- ${m.name} (${m.displayName})`);
                }
            });
        } else {
            console.log('No models found or unexpected response:', data);
        }

    } catch (error) {
        console.error('Script Error:', error);
    }
}

listModels();
