<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import { content } from '$lib/stores/content.svelte';
	import { toasts } from '$lib/stores/toast.svelte';
	import type { Player } from '$lib/types';
	import { formatDate } from '$lib/utils';

	let selected = $state<Player | null>(null);
	let search = $state('');
	let pendingDelete = $state<Player | null>(null);

	let players = $derived(
		content
			.leaderboard()
			.filter(
				(entry) =>
					!search || entry.player.name.toLowerCase().includes(search.toLowerCase())
			)
	);

	let totalPoints = $derived(content.players.reduce((sum, p) => sum + content.pointsOf(p.id), 0));

	function countOf(playerId: string, refType: 'quiz' | 'game'): number {
		return content.scores.filter((s) => s.playerId === playerId && s.refType === refType).length;
	}

	function resetScores(player: Player) {
		content.resetScores(player.id);
		toasts.push(`Punkte von ${player.name} zurückgesetzt`, 'info');
	}

	function confirmDelete() {
		if (!pendingDelete) return;
		if (selected?.id === pendingDelete.id) selected = null;
		content.deletePlayer(pendingDelete.id);
		toasts.push('Spieler gelöscht', 'info');
		pendingDelete = null;
	}
</script>

<svelte:head><title>Spieler · CMS</title></svelte:head>

<div class="flex flex-wrap items-start justify-between gap-3">
	<div>
		<h1 class="h1">Spieler</h1>
		<p class="text-ink-500">
			{content.players.length} Spieler · {totalPoints.toLocaleString('de-DE')} Punkte gesamt
		</p>
	</div>
	<input class="inp !w-56" bind:value={search} placeholder="Suchen…" />
</div>

<div class="grid gap-4 lg:grid-cols-[1fr_320px]">
	<div class="card overflow-x-auto !p-0">
		<table class="w-full min-w-[600px]">
			<thead>
				<tr>
					<th>Name</th>
					<th>Level</th>
					<th>Quizze</th>
					<th>Spiele</th>
					<th>Punkte</th>
					<th>Zuletzt aktiv</th>
					<th><span class="sr-only">Aktionen</span></th>
				</tr>
			</thead>
			<tbody>
				{#each players as entry (entry.player.id)}
					<tr
						class="cursor-pointer hover:bg-brand-50/50 {selected?.id === entry.player.id
							? 'bg-brand-50'
							: ''}"
						onclick={() => (selected = entry.player)}
					>
						<td class="font-medium">
							{entry.player.avatar} {entry.player.name}
						</td>
						<td>{content.levelOf(entry.player.id)}</td>
						<td>{countOf(entry.player.id, 'quiz')}</td>
						<td>{countOf(entry.player.id, 'game')}</td>
						<td><b>{entry.points}</b></td>
						<td class="text-[13px] text-ink-500">{formatDate(entry.player.lastActiveAt)}</td>
						<td>
							<div class="flex gap-1">
								<button
									class="rounded-lg p-1 text-ink-500 hover:text-brand-700"
									aria-label="Punkte zurücksetzen"
									onclick={(e) => (e.stopPropagation(), resetScores(entry.player))}
								>
									<Icon name="restart_alt" size={18} />
								</button>
								<button
									class="rounded-lg p-1 text-ink-500 hover:text-danger-500"
									aria-label="Löschen"
									onclick={(e) => (e.stopPropagation(), (pendingDelete = entry.player))}
								>
									<Icon name="delete" size={18} />
								</button>
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<div class="card">
		{#if selected}
			<h2 class="font-semibold">{selected.avatar} {selected.name}</h2>
			<p class="text-[13px] text-ink-500">
				{content.pointsOf(selected.id)} Punkte · {content.levelOf(selected.id)}
			</p>

			<div class="mt-3 flex h-16 items-end gap-1" aria-label="Punkte der letzten Tage">
				{#each [6, 10, 8, 14, 4, 12, 16] as height (height)}
					<i class="w-full rounded-t bg-lime-500" style:height="{height * 4}px"></i>
				{/each}
			</div>

			<h3 class="mt-4 text-[13px] font-semibold text-ink-700">Letzte Aktivitäten</h3>
			<ul class="mt-1 space-y-1 text-[13px] text-ink-500">
				{#each content.scores.filter((s) => s.playerId === selected?.id).slice(0, 3) as score (score.id)}
					<li>
						{score.refType === 'quiz' ? 'Quiz' : 'Spiel'} · {score.points} P. ·
						{formatDate(score.at)}
					</li>
				{:else}
					<li>Noch keine Aktivitäten.</li>
				{/each}
			</ul>

			<div class="mt-4 flex flex-wrap gap-2">
				<button class="b2" onclick={() => resetScores(selected!)}>Punkte zurücksetzen</button>
			</div>
		{:else}
			<div class="py-10 text-center text-ink-500">
				<Icon name="group" size={40} class="text-brand-100" />
				<p class="mt-2">Spieler auswählen für Details.</p>
			</div>
		{/if}
	</div>
</div>

{#if pendingDelete}
	<div class="fixed inset-0 z-40 grid place-items-center bg-ink-900/50 p-4">
		<div class="card w-full max-w-[420px] space-y-3">
			<span class="grid h-12 w-12 place-items-center rounded-full bg-err-bg text-danger-500">
				<Icon name="delete" />
			</span>
			<h2 class="font-serif text-xl font-semibold">Spieler löschen?</h2>
			<p>
				„{pendingDelete.name}" und alle zugehörigen Ergebnisse werden dauerhaft entfernt.
			</p>
			<div class="flex justify-end gap-2">
				<button class="b3" onclick={() => (pendingDelete = null)}>Abbrechen</button>
				<button class="b4" onclick={confirmDelete}>Endgültig löschen</button>
			</div>
		</div>
	</div>
{/if}
