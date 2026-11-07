import { browser } from '$app/env';
import { parseGameMessage, type GameMessage, type HostMessage } from './protocol';

export type BridgeDirection = 'host → game' | 'game → host' | 'system';

export type BridgeLogEntry = {
	id: number;
	time: string;
	direction: BridgeDirection;
	type: string;
	detail: string;
	tone: 'neutral' | 'ok' | 'warn' | 'err';
};

export type BridgeInit = {
	player: { id: string; name: string; avatar: string };
	game: { id: string; title: string; maxPoints: number };
};

export class GameBridge {
	log = $state<BridgeLogEntry[]>([]);
	connected = $state(false);
	score = $state(0);
	stateLabel = $state('');
	completed = $state<{ points: number; maxPoints: number; durationMs: number } | null>(null);

	private iframe: HTMLIFrameElement | null = null;
	private initData: BridgeInit | null = null;
	private counter = 0;
	private initSent = false;
	private readyTimer: ReturnType<typeof setTimeout> | null = null;
	onComplete: ((result: { points: number; maxPoints: number; durationMs: number }) => void) | null =
		null;

	constructor() {
		if (browser) window.addEventListener('message', this.handleMessage);
	}

	destroy(): void {
		if (browser) window.removeEventListener('message', this.handleMessage);
		if (this.readyTimer) clearTimeout(this.readyTimer);
	}

	attach(iframe: HTMLIFrameElement, init: BridgeInit): void {
		this.iframe = iframe;
		this.initData = init;
		this.initSent = false;
		this.completed = null;
		this.score = 0;
		this.connected = false;
		this.pushLog('system', 'ATTACH', `${init.game.title} · ${init.player.name}`, 'neutral');

		if (this.readyTimer) clearTimeout(this.readyTimer);
		this.readyTimer = setTimeout(() => {
			if (!this.connected) {
				this.pushLog('system', 'TIMEOUT', 'Kein READY vom Spiel', 'warn');
			}
		}, 1500);

		// Das Spiel sendet sein READY oft schon während des Ladens – bevor der
		// iframe hier bekannt ist. Ein INIT direkt nach dem Attach löst ein
		// weiteres READY aus und verbindet die Bridge zuverlässig.
		this.sendInit();
	}

	sendInit(): void {
		if (!this.iframe?.contentWindow || !this.initData) return;
		const message: HostMessage = {
			source: 'ntk-platform',
			type: 'INIT',
			apiVersion: 1,
			payload: {
				player: this.initData.player,
				game: this.initData.game,
				theme: { mode: 'light', primary: '#1C6B4C' },
				locale: 'de-DE'
			}
		};
		this.iframe.contentWindow.postMessage(message, '*');
		this.initSent = true;
		this.pushLog(
			'host → game',
			'INIT',
			`{ player: "${this.initData.player.name}", game: "${this.initData.game.title}" }`,
			'neutral'
		);
	}

	sendControl(type: 'PAUSE' | 'RESUME' | 'RESET'): void {
		if (!this.iframe?.contentWindow) return;
		this.iframe.contentWindow.postMessage({ source: 'ntk-platform', type }, '*');
		this.pushLog('host → game', type, '', 'neutral');
	}

	/** Nur für die Editor-Konsole: simuliert eine Spiel-Nachricht. */
	simulate(type: 'SCORE' | 'COMPLETE', points = this.score + 10): void {
		const maxPoints = this.initData?.game.maxPoints ?? 100;
		const message: GameMessage =
			type === 'SCORE'
				? { source: 'ntk-game', type: 'SCORE', payload: { points, maxPoints } }
				: {
						source: 'ntk-game',
						type: 'COMPLETE',
						payload: { points, maxPoints, durationMs: 60000 }
					};
		this.receive(message);
	}

	private handleMessage = (event: MessageEvent): void => {
		if (!this.iframe || event.source !== this.iframe.contentWindow) return;
		const message = parseGameMessage(event.data);
		if (!message) return;
		this.receive(message);
	};

	private receive(message: GameMessage): void {
		switch (message.type) {
			case 'READY':
				if (this.connected) break;
				this.connected = true;
				this.pushLog('game → host', 'READY', '', 'ok');
				if (!this.initSent) this.sendInit();
				break;
			case 'SCORE':
				this.score = message.payload.points;
				this.pushLog(
					'game → host',
					'SCORE',
					String(message.payload.points),
					message.payload.points > 0 ? 'ok' : 'neutral'
				);
				break;
			case 'COMPLETE': {
				this.score = message.payload.points;
				const result = {
					points: message.payload.points,
					maxPoints: message.payload.maxPoints,
					durationMs: message.payload.durationMs ?? 0
				};
				this.completed = result;
				this.pushLog(
					'game → host',
					'COMPLETE',
					`{ points: ${result.points}, maxPoints: ${result.maxPoints} }`,
					'ok'
				);
				this.onComplete?.(result);
				break;
			}
			case 'RESIZE':
				this.pushLog('game → host', 'RESIZE', `${message.payload.height}px`, 'neutral');
				break;
			case 'STATE':
				this.stateLabel = message.payload.label;
				this.pushLog('game → host', 'STATE', message.payload.label, 'neutral');
				break;
			case 'LOG':
				this.pushLog(
					'game → host',
					'LOG',
					message.payload.message,
					message.payload.level === 'error'
						? 'err'
						: message.payload.level === 'warn'
							? 'warn'
							: 'neutral'
				);
				break;
		}
	}

	private pushLog(
		direction: BridgeDirection,
		type: string,
		detail: string,
		tone: BridgeLogEntry['tone']
	): void {
		const time = new Date().toLocaleTimeString('de-DE', {
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit'
		});
		this.log = [...this.log.slice(-49), { id: ++this.counter, time, direction, type, detail, tone }];
	}
}
