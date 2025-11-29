import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const apiKey = process.env.API_KEY;

async function listModels() {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();

        let output = '';
        if (data.models) {
            output += 'Available Models:\n';
            data.models.forEach(m => {
                if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent')) {
                    output += `- ${m.name}\n`;
                }
            });
        } else {
            output += 'No models found or error: ' + JSON.stringify(data);
        }

        fs.writeFileSync('available_models.txt', output);
        console.log('Models written to available_models.txt');

    } catch (error) {
        console.error('Script Error:', error);
    }
}

listModels();
