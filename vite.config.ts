import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-auto';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, type Plugin } from 'vite';
import { generateIcons, LOGO_SVG } from './scripts/generate-icons.mjs';
import { gameSources, GAMES_DIR, syncGames } from './scripts/sync-games.mjs';

/**
 * Erzeugt die PNG-Icons aus static/logo.svg: beim Start von dev/build und im
 * Dev-Server jedes Mal, wenn logo.svg gespeichert wird.
 */
function iconsFromLogo(): Plugin {
	const slash = (path: string) => path.replace(/\\/g, '/').toLowerCase();
	const logo = slash(LOGO_SVG);
	return {
		name: 'ntk-icons-from-logo',
		async buildStart() {
			await generateIcons({ quiet: true });
		},
		configureServer(server) {
			server.watcher.add(logo);
			server.watcher.on('change', async (file) => {
				if (slash(file) !== logo) return;
				try {
					await generateIcons({ quiet: true });
					server.config.logger.info('Icons aus logo.svg neu erzeugt', { timestamp: true });
				} catch (error) {
					server.config.logger.error(`Icons konnten nicht erzeugt werden: ${error}`);
				}
			});
		}
	};
}

/**
 * Spielpakete: holt beim Start von dev/build die neuesten Quell-ZIPs nach games/,
 * prüft alle Pakete samt game.json und stellt sie der App bereit.
 * Im Build bricht ein fehlerhaftes Paket den Build ab; im Dev-Server erscheint nur ein Fehler im Log.
 * Der Dev-Server beobachtet games/ und die Quellen und gleicht bei Änderungen neu ab.
 */
function gamesFromFolder(): Plugin {
	const slash = (path: string) => path.replace(/\\/g, '/').toLowerCase();
	let isBuild = false;
	return {
		name: 'ntk-games-from-folder',
		configResolved(config) {
			isBuild = config.command === 'build';
		},
		async buildStart() {
			const { errors } = await syncGames({
				log: { info: (m: string) => this.info(m), warn: (m: string) => this.warn(m), error: (m: string) => this.warn(m) }
			});
			if (errors.length && isBuild) this.error(`Ungültige Spielpakete:\n${errors.join('\n')}`);
		},
		async configureServer(server) {
			const logger = server.config.logger;
			const log = {
				info: (m: string) => logger.info(m, { timestamp: true }),
				warn: (m: string) => logger.warn(m, { timestamp: true }),
				error: (m: string) => logger.error(m, { timestamp: true })
			};
			const watched = [GAMES_DIR, ...(await gameSources())].map(slash);
			server.watcher.add([GAMES_DIR, ...(await gameSources())]);
			let timer: ReturnType<typeof setTimeout> | undefined;
			const onChange = (file: string) => {
				const f = slash(file);
				if (!f.endsWith('.zip') && !f.endsWith('.json')) return;
				if (!watched.some((dir) => f.startsWith(dir))) return;
				clearTimeout(timer);
				timer = setTimeout(() => void syncGames({ log }).catch((e) => log.error(String(e))), 400);
			};
			server.watcher.on('add', onChange);
			server.watcher.on('change', onChange);
			server.watcher.on('unlink', onChange);
		}
	};
}

export default defineConfig({
	resolve: {
		alias: {
			$lib: fileURLToPath(new URL('./src/lib', import.meta.url))
		}
	},
	plugins: [
		iconsFromLogo(),
		gamesFromFolder(),
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
			// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
			// See https://svelte.dev/docs/kit/adapters for more information about adapters.
			adapter: adapter()
		})
	]
});
