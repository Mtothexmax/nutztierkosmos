export const uid = (): string =>
	typeof crypto !== 'undefined' && 'randomUUID' in crypto
		? crypto.randomUUID()
		: `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const nowIso = (): string => new Date().toISOString();

export const formatDate = (iso: string): string => {
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return '–';
	return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export const formatDateTime = (iso: string): string => {
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return '–';
	return `${formatDate(iso)}, ${d.toLocaleTimeString('de-DE', {
		hour: '2-digit',
		minute: '2-digit'
	})}`;
};

export const formatDuration = (ms: number): string => {
	const total = Math.max(0, Math.round(ms / 1000));
	const m = Math.floor(total / 60);
	const s = total % 60;
	return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export const normalize = (value: string): string =>
	value
		.toLowerCase()
		.trim()
		.replace(/[.,!?;:]/g, '')
		.replace(/\s+/g, ' ');

export const clamp = (value: number, min: number, max: number): number =>
	Math.min(max, Math.max(min, value));

export const levelFor = (points: number, forscher = 300, forscherin = 150): string => {
	if (points >= forscher) return 'Forscherin';
	if (points >= forscherin) return 'Forscher';
	return 'Einsteiger';
};
