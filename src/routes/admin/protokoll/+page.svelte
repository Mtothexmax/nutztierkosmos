<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import { showReqs } from '$lib/requirements.svelte';
	import { content } from '$lib/stores/content.svelte';
	import { formatDateTime } from '$lib/utils';

	showReqs(['audit', 'auth', 'roles']);

	let level = $state<'all' | 'security'>('all');
	let rows = $derived(content.audit.filter((a) => level === 'all' || a.level === 'security'));

	function exportCsv() {
		const lines = [['Zeitpunkt', 'Benutzer', 'Aktion', 'Ziel', 'Art'], ...rows.map((a) => [a.at, content.getUser(a.userId)?.name ?? a.userId, a.action, a.target ?? '', a.level])];
		const csv = lines.map((l) => l.map((x) => `"${String(x).replaceAll('"', '""')}"`).join(';')).join('\n');
		const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
		const a = Object.assign(document.createElement('a'), { href: url, download: 'protokoll.csv' });
		a.click();
		URL.revokeObjectURL(url);
	}
</script>

<svelte:head><title>Protokoll · Redaktion</title></svelte:head>

<div class="flex flex-wrap items-start justify-between gap-3">
	<div>
		<h1 class="h1">Protokoll</h1>
		<p class="max-w-2xl text-ink-500">Sicherheitsrelevante und redaktionelle Ereignisse: Anmeldungen, Fehlversuche, Rollenänderungen, Veröffentlichungen, Löschungen. Aufbewahrungsfrist wird im Feinkonzept festgelegt.</p>
	</div>
	<button class="b2" onclick={exportCsv}><Icon name="download" />CSV exportieren</button>
</div>

<div class="flex gap-1" role="group" aria-label="Filter">
	<button class="chip" aria-pressed={level === 'all'} onclick={() => (level = 'all')}>Alle ({content.audit.length})</button>
	<button class="chip" aria-pressed={level === 'security'} onclick={() => (level = 'security')}>Sicherheit ({content.audit.filter((a) => a.level === 'security').length})</button>
</div>

<div class="card overflow-x-auto !p-0">
	<table class="w-full min-w-[640px]">
		<thead><tr><th>Zeitpunkt</th><th>Benutzer</th><th>Aktion</th><th>Ziel</th></tr></thead>
		<tbody>
			{#each rows as a (a.id)}
				<tr>
					<td class="text-[13px] whitespace-nowrap text-ink-500">{formatDateTime(a.at)}</td>
					<td class="text-[14px]">{content.getUser(a.userId)?.name ?? a.userId}</td>
					<td class="text-[14px]">
						{#if a.level === 'security'}<Icon name="shield" size={16} class="text-[#8a5a17]" /><span class="sr-only">Sicherheit: </span>{/if}
						{a.action}
					</td>
					<td class="text-[14px] text-ink-700">{a.target ?? '–'}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
