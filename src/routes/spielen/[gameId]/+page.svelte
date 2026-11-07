<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { GameBridge } from '$lib/bridge/bridge.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { bundleGame } from '$lib/games/files';
	import { content } from '$lib/stores/content.svelte';
	import { session } from '$lib/stores/session.svelte';
	import { storageKeys, write } from '$lib/storage/db';
	import type { LastResult } from '$lib/types';
	import { toasts } from '$lib/stores/toast.svelte';

	onMount(() => {
		if (!session.isLoggedIn) goto('/');
	});

	let gameId = $derived(page.params.gameId ?? '');
	let game = $derived(content.getGame(gameId));
	let moduleId = $derived(game?.moduleId ?? '');
	let adminPreview = $derived(page.url.searchParams.get('from') === 'admin');
	let backHref = $derived(
		adminPreview ? `/admin/spiele/${gameId}?step=content` : `/lernen/${moduleId}`
	);
	let srcdoc = $derived(game ? bundleGame(game) : '');

	let iframe = $state<HTMLIFrameElement>();
	let reloadKey = $state(0);
	let bridge = new GameBridge();
	let completed = $state<{ points: number; maxPoints: number; durationMs: number } | null>(null);
	let fullscreen = $state(false);

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
</script>

<svelte:head><title>{game?.title ?? 'Spiel'} · Nutztierkosmos</title></svelte:head>

{#if !game}
	<main class="mx-auto max-w-3xl p-8">
		<div class="card text-center">
			<p class="mb-4">Dieses Spiel gibt es nicht (mehr).</p>
			<a class="b1" href="/lernen">Zurück zu den Modulen</a>
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
			{#if session.player}
				<span class="bdg">{session.player.avatar} {session.player.name}</span>
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

		<div
			class="relative aspect-video overflow-hidden rounded-2xl border-4 border-dashed border-brand-100 bg-[#F1F8F4] {fullscreen
				? 'fixed inset-2 z-40 !aspect-auto'
				: ''}"
		>
			{#key reloadKey}
				<iframe
					bind:this={iframe}
					title={game.title}
					srcdoc={srcdoc}
					sandbox="allow-scripts allow-forms allow-popups"
					class="h-full w-full border-0 bg-white"
					onload={onLoad}
				></iframe>
			{/key}
			<code class="pointer-events-none absolute bottom-2 left-3 font-mono text-[11px] text-ink-500">
				Spiel erhält: {session.player?.name ?? '–'} · api v1
			</code>
		</div>

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
				<button class="b3" onclick={() => (fullscreen = !fullscreen)}>
					<Icon name="fullscreen" />{fullscreen ? 'Vollbild beenden' : 'Vollbild'}
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
