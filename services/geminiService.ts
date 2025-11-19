import { RAGResult } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

async function postJson<T>(path: string, body: unknown): Promise<T> {
	console.log(`[Service] POST ${API_BASE_URL}${path}`, body);
	const res = await fetch(`${API_BASE_URL}${path}`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	});
	console.log(`[Service] Response status: ${res.status}`);
	if (!res.ok) {
		// Try JSON first
		try {
			const data = await res.json();
			console.error('[Service] Error response JSON:', data);
			throw new Error(data?.error || `HTTP ${res.status}`);
		} catch (e) {
			// Fallback to text
			const text = await res.text().catch(() => '');
			console.error('[Service] Error response text:', text);
			throw new Error(text || `HTTP ${res.status}`);
		}
	}
	// Parse JSON normally
	try {
		const result = (await res.json()) as T;
		console.log('[Service] Success response:', result);
		return result;
	} catch (e) {
		const text = await res.text().catch(() => '');
		console.error('[Service] JSON parse error, fallback text:', text);
		throw new Error(text || 'Invalid JSON from server');
	}
}

export async function performRAG(documentContent: string, query: string): Promise<RAGResult> {
	try {
		return await postJson<RAGResult>('/proxy', {
			action: 'rag',
			payload: { documentContent, query },
		});
	} catch (error) {
		console.error('Error performing RAG:', error);
		throw error;
	}
}

export async function scrapeContentFromURL(url: string): Promise<string> {
	try {
		const result = await postJson<{ content: string }>('/proxy', {
			action: 'scrape',
			payload: { url },
		});
		return result.content;
	} catch (error) {
		console.error('Error scraping URL:', error);
		throw error;
	}
}

