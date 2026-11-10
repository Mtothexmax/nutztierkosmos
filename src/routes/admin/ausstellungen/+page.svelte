<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import TopicSelect from '$lib/components/admin/TopicSelect.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { showReqs } from '$lib/requirements.svelte';
	import { content } from '$lib/stores/content.svelte';
	import { session } from '$lib/stores/session.svelte';
	import type { Status } from '$lib/types';
	import { formatDateTime } from '$lib/utils';

	showReqs(['exhibitions', 'cms-nocode', 'roles', 'hierarchy', 'i18n']);

	const statusLabel: Record<Status, string> = { draft: 'Entwurf', review: 'In Prüfung', published: 'Veröffentlicht', archived: 'Archiviert' };
	let status = $state<Status | ''>((page.url.searchParams.get('status') as Status) ?? '');
	let categoryId = $state('');
	let q = $state('');
	let newOpen = $state(false);
	let newTopic = $state(content.topics[0]?.id ?? '');

	let rows = $derived(
		[...content.exhibitions]
			.filter((e) => !status || e.status === status)
			.filter((e) => !categoryId || content.getTopic(e.topicId)?.categoryId === categoryId)
			.filter((e) => !q || e.title.de.toLowerCase().includes(q.toLowerCase()))
			.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
	);

	function create() {
		const e = content.createExhibition(newTopic, session.user!.id);
		content.log(session.user!.id, 'Ausstellung angelegt', e.title.de);
		goto(`/admin/ausstellungen/${e.id}`);
	}
</script>

<svelte:head><title>Ausstellungen · Redaktion</title></svelte:head>

<div class="flex flex-wrap items-start justify-between gap-3">
	<div>
		<h1 class="h1">Ausstellungen</h1>
		<p class="text-ink-500">Ebene 3 der Inhaltsstruktur · jede Ausstellung basiert auf Publikationen</p>
	</div>
	<button class="b1" onclick={() => (newOpen = !newOpen)} aria-expanded={newOpen}><Icon name="add" />Neue Ausstellung</button>
</div>

{#if newOpen}
	<form class="card flex flex-wrap items-end gap-3" onsubmit={(e) => (e.preventDefault(), create())}>
		<div class="min-w-64 flex-1">
			<label class="lbl" for="new-topic">Themenschwerpunkt</label>
			<TopicSelect id="new-topic" bind:value={newTopic} />
		</div>
		<button class="b1" type="submit">Anlegen und bearbeiten</button>
	</form>
{/if}

<div class="flex flex-wrap items-center gap-2">
	<div class="flex flex-wrap gap-1" role="group" aria-label="Status filtern">
		{#each [['', 'Alle'], ['published', 'Veröffentlicht'], ['review', 'In Prüfung'], ['draft', 'Entwurf']] as [id, label] (id)}
			<button class="chip" aria-pressed={status === id} onclick={() => (status = id as Status | '')}>
				{label} ({id ? content.exhibitions.filter((e) => e.status === id).length : content.exhibitions.length})
			</button>
		{/each}
	</div>
	<label class="sr-only" for="ex-cat">Kategorie</label>
	<select id="ex-cat" class="inp !w-auto !py-2" bind:value={categoryId}>
		<option value="">Alle Kategorien</option>
		{#each content.categories as c (c.id)}<option value={c.id}>{c.title.de}</option>{/each}
	</select>
	<label class="sr-only" for="ex-q">Suchen</label>
	<input id="ex-q" class="inp !w-56 !py-2" placeholder="Titel suchen…" bind:value={q} />
</div>

<div class="card overflow-x-auto !p-0">
	<table class="w-full min-w-[760px]">
		<thead>
			<tr><th>Titel</th><th>Kategorie · Thema</th><th>Status</th><th>Sprachen</th><th>Geändert</th><th><span class="sr-only">Aktionen</span></th></tr>
		</thead>
		<tbody>
			{#each rows as e (e.id)}
				{@const topic = content.getTopic(e.topicId)}
				<tr class="hover:bg-sand-50">
					<td><a class="font-semibold text-brand-700 hover:underline" href="/admin/ausstellungen/{e.id}">{e.title.de}</a></td>
					<td class="text-[14px]">{content.getCategory(topic?.categoryId)?.title.de} · {topic?.title.de}</td>
					<td><span class="status status-{e.status}">{statusLabel[e.status]}</span></td>
					<td class="text-[13px]">
						<span class="rounded bg-brand-100 px-1.5 font-semibold text-brand-700">DE</span>
						<span class="rounded px-1.5 font-semibold {e.title.en && e.teaser.en ? 'bg-brand-100 text-brand-700' : 'bg-sand-100 text-ink-500 line-through'}">EN</span>
					</td>
					<td class="text-[13px] text-ink-500">{formatDateTime(e.updatedAt)}</td>
					<td class="whitespace-nowrap">
						<a class="b3 !p-2" href="/admin/ausstellungen/{e.id}" aria-label="{e.title.de} bearbeiten" title="Bearbeiten"><Icon name="edit" size={18} /></a>
						<a class="b3 !p-2" href="/ausstellung/{e.slug}?vorschau=1" aria-label="{e.title.de} in der Vorschau öffnen" title="Vorschau"><Icon name="visibility" size={18} /></a>
					</td>
				</tr>
			{:else}
				<tr><td colspan="6" class="p-6 text-center text-ink-500">Keine Ausstellungen für diese Filter.</td></tr>
			{/each}
		</tbody>
	</table>
</div>
