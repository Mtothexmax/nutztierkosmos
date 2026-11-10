<script lang="ts">
	import L10nInput from '$lib/components/admin/L10nInput.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { showReqs } from '$lib/requirements.svelte';
	import { content } from '$lib/stores/content.svelte';
	import { session } from '$lib/stores/session.svelte';
	import { toasts } from '$lib/stores/toast.svelte';
	import type { Publication } from '$lib/types';
	import { nowIso } from '$lib/utils';

	showReqs(['publication-fields', 'exhibitions', 'search', 'cms-nocode']);

	let selectedId = $state<string | null>(content.publications[0]?.id ?? null);
	let q = $state('');
	let draft = $state<Publication | null>(null);
	let authorsText = $state('');

	let list = $derived(
		content.publications.filter((p) => !q || `${p.title} ${p.authors.join(' ')}`.toLowerCase().includes(q.toLowerCase()))
	);

	$effect(() => {
		const p = content.getPublication(selectedId ?? '');
		const next = p ? (structuredClone($state.snapshot(p)) as Publication) : null;
		if (next) {
			next.summary.en ??= '';
			next.url ??= '';
		}
		draft = next;
		authorsText = p?.authors.join('; ') ?? '';
	});

	let usedIn = $derived(content.exhibitions.filter((e) => draft && e.publicationIds.includes(draft.id)));
	let errors = $derived({
		title: !draft?.title.trim(),
		authors: !authorsText.trim(),
		date: !draft?.date
	});

	function save() {
		if (!draft) return;
		if (errors.title || errors.authors || errors.date) {
			toasts.push('Bitte die Pflichtfelder ausfüllen.', 'error');
			return;
		}
		draft.authors = authorsText.split(';').map((a) => a.trim()).filter(Boolean);
		draft.updatedAt = nowIso();
		const idx = content.publications.findIndex((p) => p.id === draft!.id);
		content.publications[idx] = structuredClone($state.snapshot(draft)) as Publication;
		content.persistPublications();
		content.log(session.user!.id, 'Publikation gespeichert', draft.title);
		toasts.push('Publikation gespeichert');
	}

	function create() {
		const p = content.createPublication();
		selectedId = p.id;
	}

	function remove() {
		if (!draft || !confirm(`„${draft.title}“ löschen? Verknüpfungen in Ausstellungen werden entfernt.`)) return;
		content.deletePublication(draft.id);
		content.log(session.user!.id, 'Publikation gelöscht', draft.title, 'security');
		selectedId = content.publications[0]?.id ?? null;
	}

	function toggle(list: string[], id: string) {
		return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
	}
</script>

<svelte:head><title>Publikationen · Redaktion</title></svelte:head>

<div class="flex flex-wrap items-start justify-between gap-3">
	<div>
		<h1 class="h1">Publikationen</h1>
		<p class="text-ink-500">Fachliche Grundlage der Ausstellungen · Demo-Einträge sind Platzhalter</p>
	</div>
	<button class="b1" onclick={create}><Icon name="add" />Neue Publikation</button>
</div>

<div class="grid gap-6 xl:grid-cols-[22rem_1fr]">
	<div class="card space-y-3 !p-4">
		<label class="sr-only" for="pub-q">Suchen</label>
		<input id="pub-q" class="inp" placeholder="Titel oder Autor/in…" bind:value={q} />
		<ul class="max-h-[70vh] space-y-1 overflow-y-auto">
			{#each list as p (p.id)}
				<li>
					<button class="w-full rounded-xl p-3 text-left {selectedId === p.id ? 'bg-brand-50 ring-1 ring-brand-500' : 'hover:bg-sand-50'}" aria-current={selectedId === p.id} onclick={() => (selectedId = p.id)}>
						<span class="line-clamp-2 block text-[14px] font-semibold">{p.title}</span>
						<span class="block text-[12px] text-ink-500">{p.authors.join(', ') || '–'} · {p.date}</span>
					</button>
				</li>
			{/each}
		</ul>
	</div>

	{#if draft}
		<form class="card space-y-5" onsubmit={(e) => (e.preventDefault(), save())} novalidate>
			<div>
				<label class="lbl" for="pub-title">Titel *</label>
				<input id="pub-title" class="inp" bind:value={draft.title} aria-invalid={errors.title} />
			</div>
			<div class="grid gap-4 md:grid-cols-[1fr_12rem]">
				<div>
					<label class="lbl" for="pub-authors">Autorinnen und Autoren * <span class="font-normal text-ink-500">(mit Semikolon trennen)</span></label>
					<input id="pub-authors" class="inp" bind:value={authorsText} aria-invalid={errors.authors} aria-describedby="pub-authors-hint" />
					<p id="pub-authors-hint" class="mt-1 text-[12px] text-ink-500">z. B. „A. Muster; B. Beispiel“</p>
				</div>
				<div>
					<label class="lbl" for="pub-date">Veröffentlichungsdatum *</label>
					<input id="pub-date" type="date" class="inp" bind:value={draft.date} aria-invalid={errors.date} />
				</div>
			</div>
			<L10nInput id="pub-sum" label="Kurzbeschreibung" bind:value={draft.summary} multiline rows={3} />
			<div>
				<label class="lbl" for="pub-cite">Quellenangabe</label>
				<textarea id="pub-cite" class="inp" rows="2" bind:value={draft.citation}></textarea>
			</div>
			<div>
				<label class="lbl" for="pub-url">Link zur Publikation (DOI oder URL)</label>
				<input id="pub-url" type="url" class="inp" bind:value={draft.url} placeholder="https://doi.org/…" />
			</div>
			<fieldset>
				<legend class="lbl">Schlagwörter</legend>
				<div class="flex flex-wrap gap-2">
					{#each [...content.keywords].sort((a, b) => a.label.de.localeCompare(b.label.de)) as k (k.id)}
						<button type="button" class="chip" aria-pressed={draft.keywordIds.includes(k.id)} onclick={() => draft && (draft.keywordIds = toggle(draft.keywordIds, k.id))}>{k.label.de}</button>
					{/each}
				</div>
			</fieldset>
			<fieldset>
				<legend class="lbl">Verknüpfte Medien</legend>
				<div class="flex flex-wrap gap-2">
					{#each content.media.filter((m) => !m.id.startsWith('md-kat')) as m (m.id)}
						<button type="button" class="chip" aria-pressed={draft.mediaIds.includes(m.id)} onclick={() => draft && (draft.mediaIds = toggle(draft.mediaIds, m.id))}>[{m.type}] {m.title.de}</button>
					{/each}
				</div>
			</fieldset>
			<p class="text-[13px] text-ink-500">
				Verwendet in: {usedIn.length ? usedIn.map((e) => e.title.de).join(', ') : 'noch keiner Ausstellung'}
			</p>
			<div class="flex flex-wrap gap-2 border-t border-sand-200 pt-4">
				<button class="b1" type="submit"><Icon name="save" size={20} />Speichern</button>
				{#if session.can('content.delete')}
					<button class="b3 !text-danger-500" type="button" onclick={remove}><Icon name="delete" size={20} />Löschen</button>
				{/if}
			</div>
		</form>
	{/if}
</div>
