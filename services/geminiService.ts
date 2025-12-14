import { RAGResult, ChatMessage } from '../types';

export interface StoredDocument {
	id: number;
	title: string;
	type: 'text' | 'url';
	created_at: string;
}

export interface AresChatResponse {
	response: string;
	sources: { text: string; source: string; score: number }[];
}

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

async function postJson<T>(path: string, body: unknown, userId?: string): Promise<T> {
	console.log(`[Service] POST ${API_BASE_URL}${path}`, body);
	const headers: Record<string, string> = { 'Content-Type': 'application/json' };
	if (userId) headers['X-User-Id'] = userId;

	const res = await fetch(`${API_BASE_URL}${path}`, {
		method: 'POST',
		headers,
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
		return (await postJson<{ content: string }>('/proxy', {
			action: 'scrape',
			payload: { url },
		})).content;
	} catch (error) {
		console.error('Error scraping URL:', error);
		throw error;
	}
}


export async function saveDocument(title: string, content: string, type: 'text' | 'url', userId?: string): Promise<{ id: number }> {
	return await postJson<{ id: number }>('/documents', { title, content, type }, userId);
}

export async function uploadFile(file: File, userId?: string): Promise<{ id: number; content: string; title: string }> {
	const formData = new FormData();
	formData.append('file', file);

	const headers: Record<string, string> = {};
	if (userId) headers['X-User-Id'] = userId;

	console.log(`[Service] Uploading file: ${file.name}`);
	const res = await fetch(`${API_BASE_URL}/upload`, {
		method: 'POST',
		headers,
		body: formData, // fetch automatically sets Content-Type to multipart/form-data
	});

	if (!res.ok) {
		const errorData = await res.json().catch(() => ({}));
		throw new Error(errorData.error || `Upload failed: ${res.status}`);
	}

	return await res.json();
}

export async function getDocuments(userId?: string): Promise<{ documents: StoredDocument[] }> {
	try {
		const headers: Record<string, string> = {};
		if (userId) headers['X-User-Id'] = userId;

		const res = await fetch(`${API_BASE_URL}/documents`, { headers });
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		return await res.json();
	} catch (error) {
		console.error('Error fetching documents:', error);
		throw error;
	}
}

export async function deleteDocument(id: number, userId?: string): Promise<void> {
	try {
		const headers: Record<string, string> = {};
		if (userId) headers['X-User-Id'] = userId;

		const res = await fetch(`${API_BASE_URL}/documents/${id}`, {
			method: 'DELETE',
			headers
		});
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
	} catch (error) {
		console.error('Error deleting document:', error);
		throw error;
	}
}

export async function chatWithAres(query: string, history: ChatMessage[]): Promise<AresChatResponse> {
	return await postJson<AresChatResponse>('/chat/ares', { query, history });
}
