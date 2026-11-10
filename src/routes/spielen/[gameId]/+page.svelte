<script lang="ts">
	import { goto } from '$lib/paths';
	import { page } from '$app/state';
	import { browser } from '$app/env';
	import { onMount } from 'svelte';
	import { GameBridge } from '$lib/bridge/bridge.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { bundleGame } from '$lib/games/files';
	import { content } from '$lib/stores/content.svelte';
	import { session } from '$lib/stores/session.svelte';
	import { read, storageKeys, write } from '$lib/storage/db';
	import type { LastResult, Preferences } from '$lib/types';
	import { toasts } from '$lib/stores/toast.svelte';

	onMount(() => {
		const onKey = (event: KeyboardEvent) => {
			if (event.key !== 'Escape') return;
			if (overlayFullscreen || fullscreen) {
				fullscreen = false;
				overlayFullscreen = false;
			}
		};
		document.addEventListener('keydown', onKey);
		return () => {
			document.removeEventListener('keydown', onKey);
		};
	});

	// Vollbild als CSS-Overlay (zuverlässiger als requestFullscreen im Iframe).
	$effect(() => {
		if (!browser) return;
		if (!fullscreen && !overlayFullscreen) return;
		const previous = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = previous;
		};
	});

	let gameId = $derived(page.params.gameId ?? '');
	let game = $derived(content.getGame(gameId));
	let homeExhibition = $derived(game ? content.exhibitionWith({ gameId: game.id }) : undefined);
	let adminPreview = $derived(page.url.searchParams.get('from') === 'admin');
	let backHref = $derived(
		adminPreview
			? `/admin/spiele/${gameId}?step=content`
			: homeExhibition && content.isPublic(homeExhibition)
				? `/ausstellung/${homeExhibition.slug}`
				: '/mitmachen'
	);
	// Spieldateien kommen aus IndexedDB – erst danach starten.
	let srcdoc = $derived(game && content.gameFilesReady ? bundleGame(game) : '');

	let iframe = $state<HTMLIFrameElement>();
	let stage = $state<HTMLDivElement>();
	let reloadKey = $state(0);
	let bridge = new GameBridge();
	let completed = $state<{ points: number; maxPoints: number; durationMs: number } | null>(null);
	let fullscreen = $state(false);
	let overlayFullscreen = $state(false);
	let prefs = $state<Preferences>(read<Preferences>(storageKeys.prefs, { hideTriggerWarnings: false }));
	let warningAccepted = $state(false);
	let hideWarningChecked = $state(false);

	let showWarning = $derived(
		Boolean(game?.triggerWarning) && !prefs.hideTriggerWarnings && !warningAccepted
	);

	bridge.onComplete = (result) => {
		if (!game || !session.player || completed) return;
		completed = result;
		if (adminPreview) {
			toasts.push('Vorschau beendet – Ergebnis wird nicht gespeichert', 'info');
			return;
		}
		content.addScore({
			playerId: session.player.id,
			refType: 'game',
			refId: game.id,
			points: result.points,
			maxPoints: result.maxPoints,
			durationMs: result.durationMs
		});
		const last: LastResult = {
			refType: 'game',
			refId: game.id,
			title: game.title,
			points: result.points,
			maxPoints: result.maxPoints,
			correct: 0,
			total: 0,
			durationMs: result.durationMs,
			at: new Date().toISOString()
		};
		write(storageKeys.lastResult, last);
		toasts.push('Spiel beendet – Ergebnis gespeichert');
	};

	$effect(() => {
		return () => bridge.destroy();
	});

	function onLoad() {
		if (!iframe || !game || !session.player) return;
		bridge.attach(iframe, {
			player: { id: session.player.id, name: session.player.name, avatar: session.player.avatar },
			game: { id: game.id, title: game.title, maxPoints: game.maxPoints }
		});
	}

	function restart() {
		completed = null;
		bridge.connected = false;
		bridge.score = 0;
		reloadKey += 1;
	}

	function toggleFullscreen() {
		fullscreen = !fullscreen;
	}
</script>

<svelte:head><title>{game?.title ?? 'Spiel'} · Nutztierkosmos</title></svelte:head>

{#if !game}
	<main class="mx-auto max-w-3xl p-8">
		<div class="card text-center">
			<p class="mb-4">Dieses Spiel gibt es nicht (mehr).</p>
			<a class="b1" href="/mitmachen">Zu den Spielen</a>
		</div>
	</main>
{:else}
	<div class="mx-auto max-w-4xl space-y-3 p-4">
		<div class="flex flex-wrap items-center gap-3">
			<button class="b3 !p-2" aria-label="Zurück" onclick={() => goto(backHref)}>
				<Icon name="arrow_back" />
			</button>
			<h1 class="flex-1 font-serif text-2xl font-bold text-brand-700">{game.title}</h1>
			<span class="bdg border border-amber-500 !bg-white !text-amber-700">Demo-Modus</span>
			{#if adminPreview}
				<span class="bdg !bg-berry-500/20 !text-berry-700">Redaktions-Vorschau</span>
			{/if}

			<span class="bdg">{bridge.score} P.</span>
		</div>

		{#if completed}
			<div class="card flex flex-wrap items-center gap-3 border-brand-600 !bg-ok-bg">
				<Icon name="check_circle" class="text-brand-600" />
				<div class="flex-1">
					<b>Spiel beendet: {completed.points} / {completed.maxPoints} Punkte</b>
					<p class="text-[13px] text-ink-700">
						{adminPreview
							? 'Redaktions-Vorschau – das Ergebnis wird nicht gespeichert.'
							: 'Dein Ergebnis wurde gespeichert.'}
					</p>
				</div>
				{#if !adminPreview}
					<button class="b1" onclick={() => goto(`/ergebnis/game/${game.id}`)}>
						Ergebnis ansehen
					</button>
				{:else}
					<button class="b2" onclick={() => goto(backHref)}>Zurück zum Editor</button>
				{/if}
			</div>
		{/if}

	{#if showWarning}
		<div class="card rounded-2xl border-4 border-err-fg bg-err-bg p-6">
			<div class="flex items-start gap-3">
				<Icon name="warning" class="text-err-fg mt-0.5" />
				<div class="flex-1">
					<h2 class="font-serif text-xl font-bold text-err-fg">Epilepsie-Triggerwarnung</h2>
					<p class="text-[14px] text-ink-700 mt-2">
						Dieses Spiel enthält möglicherweise schnell wechselnde Bilder, blinkende Elemente oder
						starke Kontraste, die bei empfindlichen Personen Anfälle auslösen können.
					</p>
					<label class="flex items-center gap-2 mt-4">
						<input
							type="checkbox"
							bind:checked={hideWarningChecked}
							class="text-err-fg"
						/>
						Diese Warnung nicht wieder anzeigen, egal für welches Spiel
					</label>
				</div>
			</div>
			<div class="mt-6 flex justify-end">
				<button
					class="b1"
					onclick={() => {
						if (hideWarningChecked) {
							prefs.hideTriggerWarnings = true;
							write(storageKeys.prefs, prefs);
						}
						warningAccepted = true;
					}}
				>
					Ich habe verstanden – Spiel starten
				</button>
			</div>
		</div>
	{:else}

		<div
			bind:this={stage}
			class="stage overflow-hidden rounded-2xl border-4 border-dashed border-brand-100 bg-[#F2F4F7] {fullscreen ||
			overlayFullscreen
				? 'fixed inset-0 z-40 flex w-full h-full flex-col !aspect-auto !rounded-none !border-0 bg-[#F2F4F7]'
				: 'relative aspect-video'}"
		>
			{#if fullscreen || overlayFullscreen}
				<!-- Eigene Leiste über dem Spiel, damit nichts die Spielfläche verdeckt.
				     Esc reicht nicht: Hat das Spiel den Fokus, kommt die Taste hier nicht an. -->
				<div class="flex shrink-0 items-center justify-between gap-3 bg-brand-900 px-3 py-1.5 text-white">
					<span class="truncate text-[13px] font-semibold">{game.title}</span>
					<button
						class="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1 text-[13px] font-semibold hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-white"
						onclick={toggleFullscreen}
					>
						<Icon name="fullscreen_exit" size={18} />Vollbild beenden
					</button>
				</div>
			{/if}
			{#if content.gameFilesReady}
			{#key reloadKey}
				<iframe
					bind:this={iframe}
					title={game.title}
					srcdoc={srcdoc}
					sandbox="allow-scripts allow-forms allow-popups"
					class="w-full min-h-0 flex-1 border-0 bg-white {fullscreen || overlayFullscreen ? '' : 'h-full'}"
					onload={onLoad}
				></iframe>
			{/key}
			{/if}
			<code
				class="pointer-events-none absolute bottom-2 left-3 font-mono text-[11px] text-ink-500 {fullscreen ||
				overlayFullscreen
					? 'hidden'
					: ''}"
			>
				Spiel erhält: anonymen Gast · api v1
			</code>
		</div>
	{/if}

		<div class="card flex flex-wrap items-center justify-between gap-2 !p-3">
			<span class="text-[13px] font-medium">
				<span
					class="inline-block h-2 w-2 rounded-full {bridge.connected
						? 'bg-lime-500'
						: 'bg-amber-500'}"
				></span>
				{bridge.connected ? 'Bridge verbunden' : 'Warte auf Spiel…'}
			</span>
			<b>Score {bridge.score} / {game.maxPoints}</b>
			<div class="flex flex-wrap gap-1">
				<button class="b3" onclick={restart}><Icon name="refresh" />Neu starten</button>
				<button class="b3" onclick={toggleFullscreen}>
					<Icon name="fullscreen" />{fullscreen || overlayFullscreen
						? 'Vollbild beenden'
						: 'Vollbild'}
				</button>
				<button class="b2" onclick={() => goto(backHref)}>Beenden</button>
			</div>
		</div>

		{#if !bridge.connected}
			<div class="flex items-center gap-3 rounded-xl border border-amber-500 bg-amber-500/10 p-3">
				<Icon name="warning" class="text-amber-500" />
				<span class="flex-1">Das Spiel antwortet nicht. Prüfe das Bridge-Skript.</span>
				<button class="b2" onclick={() => bridge.sendInit()}>Erneut senden</button>
			</div>
		{/if}

		<details class="rounded-2xl bg-brand-900 p-4 text-white/90">
			<summary class="cursor-pointer font-medium">Bridge-Konsole</summary>
			{#if bridge.log.length === 0}
				<p class="mt-2 font-mono text-[12px] text-white/60">Noch keine Nachrichten.</p>
			{:else}
				<pre class="mt-2 overflow-x-auto font-mono text-[12px] leading-5">{bridge.log
						.map((entry) => `${entry.time}  ${entry.direction.padEnd(12)} ${entry.type.padEnd(9)} ${entry.detail}`)
						.join('\n')}</pre>
			{/if}
		</details>
	</div>
{/if}
