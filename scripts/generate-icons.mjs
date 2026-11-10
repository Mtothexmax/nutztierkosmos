/**
 * Erzeugt die PNG-Icons aus der Bildmarke static/logo.svg.
 *
 * Quelle ist allein die SVG – sie dient auch direkt als Favicon und als Logo
 * auf der Website. Die PNGs braucht es nur dort, wo kein SVG unterstützt wird
 * (iOS-Homescreen, ältere Browser, Android/Manifest). Sie werden nicht
 * versioniert, sondern bei `npm run dev` und `npm run build` automatisch
 * erzeugt (Vite-Plugin in vite.config.ts) – im Dev-Server auch sofort neu,
 * sobald logo.svg gespeichert wird. Manuell: `npm run icons`.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';

const root = fileURLToPath(new URL('..', import.meta.url));

export const LOGO_SVG = `${root}static/logo.svg`;

/**
 * Ausgabedatei → Kantenlänge in Pixeln und Hintergrund.
 * iOS füllt Transparenz schwarz und rundet selbst ab – daher dort ein voller Hintergrund.
 * 'logo' = Füllfarbe des ersten <rect> im SVG (das Hintergrundfeld), so folgt sie Änderungen am SVG.
 * @type {Record<string, { size: number; background?: string }>}
 */
export const ICONS = {
	'static/apple-touch-icon.png': { size: 180, background: 'logo' },
	'static/favicon-32.png': { size: 32 },
	'static/icon-192.png': { size: 192 },
	'static/icon-512.png': { size: 512 }
};

export async function generateIcons({ quiet = false } = {}) {
	const svg = await readFile(LOGO_SVG);
	const logoColor = /<rect\s[^>]*fill="([^"]+)"/.exec(svg.toString('utf8'))?.[1] ?? '#ffffff';
	for (const [file, { size, background = 'rgba(0,0,0,0)' }] of Object.entries(ICONS)) {
		const png = new Resvg(svg, {
			fitTo: { mode: 'width', value: size },
			background: background === 'logo' ? logoColor : background
		})
			.render()
			.asPng();
		await writeFile(`${root}${file}`, png);
	}
	if (!quiet) console.log(`Icons aus static/logo.svg erzeugt: ${Object.keys(ICONS).join(', ')}`);
}

// Direkt aufgerufen (npm run icons)?
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
	generateIcons().catch((error) => {
		console.error('Icons konnten nicht erzeugt werden:', error);
		process.exit(1);
	});
}
