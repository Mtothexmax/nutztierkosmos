<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import { showReqs } from '$lib/requirements.svelte';
	import { content } from '$lib/stores/content.svelte';
	import { session } from '$lib/stores/session.svelte';
	import { toasts } from '$lib/stores/toast.svelte';

	showReqs(['search', 'i18n', 'cms-nocode']);

	let de = $state('');
	let en = $state('');
	let keywords = $derived([...content.keywords].sort((a, b) => a.label.de.localeCompare(b.label.de)));

	function add(event: SubmitEvent) {
		event.preventDefault();
		const k = content.addKeyword(de, en);
		if (k) {
			content.log(session.user!.id, 'Schlagwort angelegt', k.label.de);
			toasts.push(`Schlagwort „${k.label.de}“ angelegt`);
		}
		de = en = '';
	}

	function remove(id: string, label: string, used: number) {
		if (used && !confirm(`„${label}“ wird ${used}× verwendet. Trotzdem löschen?`)) return;
		content.deleteKeyword(id);
		toasts.push('Schlagwort gelöscht', 'info');
	}
</script>

<svelte:head><title>Schlagwörter · Redaktion</title></svelte:head>

<div>
	<h1 class="h1">Schlagwortkatalog</h1>
	<p class="max-w-2xl text-ink-500">Redaktionell gepflegte Schlagwörter für Ausstellungen und Publikationen. Sie erscheinen öffentlich als Filter und Links – in beiden Sprachen.</p>
</div>

<form class="card flex flex-wrap items-end gap-3" onsubmit={add}>
	<div class="min-w-48 flex-1">
		<label class="lbl" for="kw-de">Deutsch *</label>
		<input id="kw-de" class="inp" bind:value={de} required />
	</div>
	<div class="min-w-48 flex-1">
		<label class="lbl" for="kw-en">Englisch</label>
		<input id="kw-en" class="inp" bind:value={en} lang="en" />
	</div>
	<button class="b1" type="submit" disabled={!de.trim()}><Icon name="add" />Hinzufügen</button>
</form>

<div class="card overflow-x-auto !p-0">
	<table class="w-full min-w-[560px]">
		<thead><tr><th>Deutsch</th><th>Englisch</th><th>Verwendet</th><th><span class="sr-only">Aktionen</span></th></tr></thead>
		<tbody>
			{#each keywords as k (k.id)}
				{@const used = content.keywordUsage(k.id)}
				<tr>
					<td><label class="sr-only" for="k-{k.id}-de">Deutsch</label><input id="k-{k.id}-de" class="inp !py-1.5" bind:value={k.label.de} onchange={() => content.persistKeywords()} /></td>
					<td><label class="sr-only" for="k-{k.id}-en">Englisch</label><input id="k-{k.id}-en" class="inp !py-1.5" lang="en" bind:value={k.label.en} placeholder="– fehlt –" onchange={() => content.persistKeywords()} /></td>
					<td class="text-[14px]">{used}×</td>
					<td><button class="b3 !p-2 !text-danger-500" aria-label="{k.label.de} löschen" onclick={() => remove(k.id, k.label.de, used)}><Icon name="delete" size={18} /></button></td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
