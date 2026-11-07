<script lang="ts">
	import { goto } from '$app/navigation';
	import Icon from '$lib/components/Icon.svelte';
	import { content } from '$lib/stores/content.svelte';
	import { session } from '$lib/stores/session.svelte';
	import { toasts } from '$lib/stores/toast.svelte';

	let draft = $state(structuredClone($state.snapshot(content.settings)));
	let resetOpen = $state(false);
	let protocolOpen = $state(false);
	let savedAt = $state<string | null>(null);

	const protocolSample = `// Host -> Spiel
{ source: 'ntk-platform', type: 'INIT', apiVersion: 1, payload: {
    player: { id, name, avatar },
    game: { id, title, maxPoints },
    theme: { mode: 'light', primary },
    locale: 'de-DE' } }
{ source: 'ntk-platform', type: 'PAUSE' | 'RESUME' | 'RESET' }

// Spiel -> Host
{ source: 'ntk-game', type: 'READY' }
{ source: 'ntk-game', type: 'SCORE',    payload: { points, maxPoints } }
{ source: 'ntk-game', type: 'COMPLETE', payload: { points, maxPoints, durationMs } }
{ source: 'ntk-game', type: 'RESIZE',   payload: { height } }
{ source: 'ntk-game', type: 'STATE',    payload: { label } }
{ source: 'ntk-game', type: 'LOG',      payload: { level, message } }`;

	function save() {
		content.settings = draft;
		content.persistSettings();
		savedAt = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
		toasts.push('Einstellungen gespeichert');
	}

	function resetDemo() {
		content.resetDemo();
		session.logout();
		toasts.push('Demo-Daten zurückgesetzt', 'info');
		goto('/');
	}
</script>

<svelte:head><title>Einstellungen · CMS</title></svelte:head>

<div class="max-w-[820px] space-y-4">
	<h1 class="h1">Einstellungen</h1>

	<div class="card space-y-3">
		<h2 class="font-semibold">Branding</h2>
		<div>
			<label class="lbl" for="s-name">Plattformname</label>
			<input id="s-name" class="inp" bind:value={draft.platformName} />
		</div>
		<div>
			<label class="lbl" for="s-sub">Untertitel</label>
			<input id="s-sub" class="inp" bind:value={draft.subtitle} />
		</div>
	</div>

	<div class="card space-y-3">
		<h2 class="font-semibold">Punkte & Level</h2>
		<div class="grid gap-3 sm:grid-cols-3">
			<div>
				<label class="lbl" for="s-points">Punkte pro richtiger Antwort</label>
				<input id="s-points" class="inp" type="number" bind:value={draft.pointsPerAnswer} />
			</div>
			<div>
				<label class="lbl" for="s-level1">Forscher ab</label>
				<input id="s-level1" class="inp" type="number" bind:value={draft.levelThresholds.forscher} />
			</div>
			<div>
				<label class="lbl" for="s-level2">Forscherin ab</label>
				<input
					id="s-level2"
					class="inp"
					type="number"
					bind:value={draft.levelThresholds.forscherin}
				/>
			</div>
		</div>
		<label class="flex items-center gap-2">
			<input type="checkbox" bind:checked={draft.leaderboardPublic} />
			Bestenliste öffentlich
		</label>
	</div>

	<div class="card space-y-2">
		<h2 class="font-semibold">Bridge</h2>
		<p class="text-ink-500">
			API-Version <b>v1</b> · Erlaubt: INIT, SCORE, COMPLETE, RESIZE, STATE, LOG
		</p>
		<button class="b3 !px-0" onclick={() => (protocolOpen = true)}>
			<Icon name="code" size={18} />Protokoll ansehen
		</button>
	</div>

	<div class="card border-danger-500">
		<h2 class="font-semibold text-danger-500">Demo-Daten</h2>
		<p class="text-[13px] text-ink-500">
			Löscht alle lokalen Inhalte und lädt die Beispielmodule neu.
		</p>
		<button class="b4 mt-2" onclick={() => (resetOpen = true)}>Alle Daten zurücksetzen</button>
	</div>

	<div class="flex items-center gap-2">
		<button class="b1" onclick={save}>Einstellungen speichern</button>
		<span class="text-[13px] {savedAt ? 'text-brand-600' : 'text-amber-700'}">
			{savedAt ? `Gespeichert ${savedAt}` : 'Nicht gespeichert'}
		</span>
	</div>
</div>

{#if resetOpen}
	<div class="fixed inset-0 z-40 grid place-items-center bg-ink-900/50 p-4">
		<div class="card w-full max-w-[420px] space-y-3">
			<span class="grid h-12 w-12 place-items-center rounded-full bg-err-bg text-danger-500">
				<Icon name="delete" />
			</span>
			<h2 class="font-serif text-xl font-semibold">Alle Daten zurücksetzen?</h2>
			<p>Quizze, Spiele, Spieler und Ergebnisse werden gelöscht und neu geseedet.</p>
			<div class="flex justify-end gap-2">
				<button class="b3" onclick={() => (resetOpen = false)}>Abbrechen</button>
				<button class="b4" onclick={resetDemo}>Zurücksetzen</button>
			</div>
		</div>
	</div>
{/if}

{#if protocolOpen}
	<div class="fixed inset-0 z-40 grid place-items-center bg-ink-900/50 p-4">
		<div class="card w-full max-w-2xl space-y-3">
			<div class="flex items-center justify-between">
				<h2 class="font-serif text-xl font-semibold">postMessage-Protokoll v1</h2>
				<button aria-label="Schließen" onclick={() => (protocolOpen = false)}>
					<Icon name="close" />
				</button>
			</div>
			<pre class="overflow-x-auto rounded-xl bg-brand-900 p-4 font-mono text-[12px] leading-5 text-white/90">{protocolSample}</pre>
			<p class="text-[13px] text-ink-500">
				Der Host prüft <code>event.source === iframe.contentWindow</code> und das
				<code>source</code>-Feld, bevor eine Nachricht verarbeitet wird.
			</p>
		</div>
	</div>
{/if}
