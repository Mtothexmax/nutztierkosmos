/** Sprache, die die Plattform dem Spiel mitteilt. */
export type GameLocale = 'de' | 'en';

export type HostMessage =
	| {
			source: 'ntk-platform';
			type: 'INIT';
			apiVersion: 1;
			payload: {
				player: { id: string; name: string; avatar: string };
				game: { id: string; title: string; maxPoints: number };
				theme: { mode: 'light'; primary: string };
				/** Sprache, in der das Spiel laufen soll: "de" oder "en". */
				locale: GameLocale;
			};
	  }
	/** Sprache während des Spiels gewechselt. */
	| { source: 'ntk-platform'; type: 'LOCALE'; payload: { locale: GameLocale } }
	| { source: 'ntk-platform'; type: 'PAUSE' }
	| { source: 'ntk-platform'; type: 'RESUME' }
	| { source: 'ntk-platform'; type: 'RESET' };

export type GameMessage =
	| { source: 'ntk-game'; type: 'READY' }
	| { source: 'ntk-game'; type: 'SCORE'; payload: { points: number; maxPoints?: number } }
	| {
			source: 'ntk-game';
			type: 'COMPLETE';
			payload: { points: number; maxPoints: number; durationMs?: number };
	  }
	| { source: 'ntk-game'; type: 'RESIZE'; payload: { height: number } }
	| { source: 'ntk-game'; type: 'STATE'; payload: { label: string } }
	| {
			source: 'ntk-game';
			type: 'LOG';
			payload: { level: 'info' | 'warn' | 'error'; message: string };
	  };

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null;

const isNumber = (value: unknown): value is number =>
	typeof value === 'number' && Number.isFinite(value);

export function parseGameMessage(data: unknown): GameMessage | null {
	if (!isRecord(data) || data.source !== 'ntk-game' || typeof data.type !== 'string') return null;
	const payload = isRecord(data.payload) ? data.payload : {};

	switch (data.type) {
		case 'READY':
			return { source: 'ntk-game', type: 'READY' };
		case 'SCORE':
			if (!isNumber(payload.points)) return null;
			return {
				source: 'ntk-game',
				type: 'SCORE',
				payload: {
					points: payload.points,
					maxPoints: isNumber(payload.maxPoints) ? payload.maxPoints : undefined
				}
			};
		case 'COMPLETE':
			if (!isNumber(payload.points) || !isNumber(payload.maxPoints)) return null;
			return {
				source: 'ntk-game',
				type: 'COMPLETE',
				payload: {
					points: payload.points,
					maxPoints: payload.maxPoints,
					durationMs: isNumber(payload.durationMs) ? payload.durationMs : undefined
				}
			};
		case 'RESIZE':
			if (!isNumber(payload.height)) return null;
			return { source: 'ntk-game', type: 'RESIZE', payload: { height: payload.height } };
		case 'STATE':
			if (typeof payload.label !== 'string') return null;
			return { source: 'ntk-game', type: 'STATE', payload: { label: payload.label } };
		case 'LOG':
			return {
				source: 'ntk-game',
				type: 'LOG',
				payload: {
					level:
						payload.level === 'warn' || payload.level === 'error' ? payload.level : 'info',
					message: typeof payload.message === 'string' ? payload.message : ''
				}
			};
		default:
			return null;
	}
}
