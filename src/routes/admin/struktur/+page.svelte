<script lang="ts">
	import L10nInput from '$lib/components/admin/L10nInput.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { showReqs } from '$lib/requirements.svelte';
	import { content } from '$lib/stores/content.svelte';
	import { session } from '$lib/stores/session.svelte';
	import { toasts } from '$lib/stores/toast.svelte';
	import type { ModuleColor } from '$lib/types';

	showReqs(['hierarchy', 'categories', 'cms-nocode', 'i18n', 'filter']);

	let editing = $state<string | null>(null);
	let categories = $derived([...content.categories].sort((a, b) => a.order - b.order));
	const colors: ModuleColor[] = ['forest', 'amber', 'sky', 'berry'];

	function persist(msg = 'Struktur gespeichert') {
		content.persistStructure();
		content.log(session.user!.id, 'Struktur geändert', msg);
		toasts.push(msg);
	}

	function addCategory() {
		const c = content.addCategory();
		editing = c.id;
	}

	function addTopic(categoryId: string) {
		const t = content.addTopic(categoryId);
		editing = t.id;
	}

	function delCategory(id: string) {
		if (!content.deleteCategory(id)) toasts.push('Kategorie enthält noch Themenschwerpunkte – zuerst verschieben oder löschen.', 'error');
	}

	function delTopic(id: string) {
		if (!content.deleteTopic(id)) toasts.push('Themenschwerpunkt enthält noch Ausstellungen – zuerst verschieben.', 'error');
	}
</script>

<svelte:head><title>Struktur · Redaktion</title></svelte:head>

<div class="flex flex-wrap items-start justify-between gap-3">
	<div>
		<h1 class="h1">Struktur</h1>
		<p class="max-w-2xl text-ink-500">Ebene 1 Themenkategorien, Ebene 2 Themenschwerpunkte. Anzahl, Namen und Reihenfolge sind frei pflegbar – nichts davon ist im Code festgelegt. Deaktivierte Einträge sind öffentlich unsichtbar.</p>
	</div>
	<button class="b1" onclick={addCategory}><Icon name="add" />Neue Kategorie</button>
</div>

<div class="space-y-4">
	{#each categories as category, ci (category.id)}
		{@const topics = content.topicsOf(category.id, false)}
		<section class="card !p-0" aria-labelledby="c-{category.id}">
			<div class="flex flex-wrap items-center gap-3 border-b border-sand-200 p-4">
				<span class="flex flex-col">
					<button class="b3 !p-0.5" aria-label="{category.title.de} nach oben" disabled={ci === 0} onclick={() => content.move(content.categories, category.id, -1)}><Icon name="keyboard_arrow_up" size={20} /></button>
					<button class="b3 !p-0.5" aria-label="{category.title.de} nach unten" disabled={ci === categories.length - 1} onclick={() => content.move(content.categories, category.id, 1)}><Icon name="keyboard_arrow_down" size={20} /></button>
				</span>
				<span class="ovl">Kategorie {ci + 1}</span>
				<h2 id="c-{category.id}" class="font-serif text-xl font-semibold">{category.title.de}</h2>
				<span class="text-[13px] text-ink-500">/{category.slug} · {topics.length} Themen</span>
				<label class="ml-auto inline-flex items-center gap-2 text-[14px]">
					<input type="checkbox" bind:checked={category.active} onchange={() => persist(`${category.title.de}: ${category.active ? 'aktiviert' : 'deaktiviert'}`)} />
					{category.active ? 'Aktiv' : 'Deaktiviert'}
				</label>
				<button class="b2 !py-1.5 text-[14px]" aria-expanded={editing === category.id} onclick={() => (editing = editing === category.id ? null : category.id)}><Icon name="edit" size={18} />Bearbeiten</button>
				<button class="b3 !p-2 !text-danger-500" aria-label="{category.title.de} löschen" onclick={() => delCategory(category.id)}><Icon name="delete" size={18} /></button>
			</div>

			{#if editing === category.id}
				<form class="space-y-4 border-b border-sand-200 bg-sand-50 p-4" onsubmit={(e) => (e.preventDefault(), persist(), (editing = null))}>
					<L10nInput id="c-{category.id}-t" label="Name" bind:value={category.title} required />
					<L10nInput id="c-{category.id}-d" label="Beschreibung" bind:value={category.description} multiline rows={2} />
					<div class="grid gap-4 md:grid-cols-3">
						<div>
							<label class="lbl" for="c-{category.id}-s">Adresse (URL)</label>
							<input id="c-{category.id}-s" class="inp" bind:value={category.slug} />
						</div>
						<div>
							<label class="lbl" for="c-{category.id}-i">Bild</label>
							<select id="c-{category.id}-i" class="inp" bind:value={category.imageId}>
								<option value={undefined}>– keins –</option>
								{#each content.media.filter((m) => m.type === 'image') as m (m.id)}<option value={m.id}>{m.title.de}</option>{/each}
							</select>
						</div>
						<div>
							<label class="lbl" for="c-{category.id}-c">Farbe</label>
							<select id="c-{category.id}-c" class="inp" bind:value={category.color}>
								{#each colors as c (c)}<option value={c}>{c}</option>{/each}
							</select>
						</div>
					</div>
					<button class="b1" type="submit">Übernehmen</button>
				</form>
			{/if}

			<ul class="divide-y divide-sand-200">
				{#each topics as topic, ti (topic.id)}
					{@const count = content.exhibitions.filter((e) => e.topicId === topic.id).length}
					<li>
						<div class="flex flex-wrap items-center gap-3 px-4 py-3 pl-8">
							<span class="flex">
								<button class="b3 !p-0.5" aria-label="{topic.title.de} nach oben" disabled={ti === 0} onclick={() => content.move(topics, topic.id, -1)}><Icon name="arrow_upward" size={18} /></button>
								<button class="b3 !p-0.5" aria-label="{topic.title.de} nach unten" disabled={ti === topics.length - 1} onclick={() => content.move(topics, topic.id, 1)}><Icon name="arrow_downward" size={18} /></button>
							</span>
							<span class="min-w-0 flex-1">
								<span class="block font-medium">{topic.title.de}{#if !topic.title.en}<span class="ml-2 rounded bg-sky-500/10 px-1.5 text-[11px] font-semibold text-sky-500">EN fehlt</span>{/if}</span>
								<span class="block text-[13px] text-ink-500">{content.getField(topic.fieldId)?.title.de} · {count} Ausstellungen</span>
							</span>
							<label class="inline-flex items-center gap-2 text-[14px]">
								<input type="checkbox" bind:checked={topic.active} onchange={() => persist(`${topic.title.de}: ${topic.active ? 'aktiviert' : 'deaktiviert'}`)} />
								{topic.active ? 'Aktiv' : 'Deaktiviert'}
							</label>
							<button class="b3 !p-2" aria-label="{topic.title.de} bearbeiten" aria-expanded={editing === topic.id} onclick={() => (editing = editing === topic.id ? null : topic.id)}><Icon name="edit" size={18} /></button>
							<button class="b3 !p-2 !text-danger-500" aria-label="{topic.title.de} löschen" onclick={() => delTopic(topic.id)}><Icon name="delete" size={18} /></button>
						</div>
						{#if editing === topic.id}
							<form class="space-y-4 bg-sand-50 p-4 pl-8" onsubmit={(e) => (e.preventDefault(), persist(), (editing = null))}>
								<L10nInput id="t-{topic.id}-t" label="Name" bind:value={topic.title} required />
								<L10nInput id="t-{topic.id}-d" label="Beschreibung" bind:value={topic.description} multiline rows={2} />
								<div class="grid gap-4 md:grid-cols-3">
									<div>
										<label class="lbl" for="t-{topic.id}-s">Adresse (URL)</label>
										<input id="t-{topic.id}-s" class="inp" bind:value={topic.slug} />
									</div>
									<div>
										<label class="lbl" for="t-{topic.id}-f">Themengebiet (Filter)</label>
										<select id="t-{topic.id}-f" class="inp" bind:value={topic.fieldId}>
											{#each content.fields as f (f.id)}<option value={f.id}>{f.title.de}</option>{/each}
										</select>
									</div>
									<div>
										<label class="lbl" for="t-{topic.id}-c">Kategorie</label>
										<select id="t-{topic.id}-c" class="inp" bind:value={topic.categoryId}>
											{#each content.categories as c (c.id)}<option value={c.id}>{c.title.de}</option>{/each}
										</select>
									</div>
								</div>
								<button class="b1" type="submit">Übernehmen</button>
							</form>
						{/if}
					</li>
				{/each}
				<li class="px-4 py-3 pl-8">
					<button class="b3 !py-1.5 text-[14px]" onclick={() => addTopic(category.id)}><Icon name="add" size={18} />Themenschwerpunkt hinzufügen</button>
				</li>
			</ul>
		</section>
	{/each}
</div>

<section class="card space-y-3">
	<h2 class="font-serif text-lg font-semibold">Themengebiete (Querschnittsfilter)</h2>
	<p class="text-[14px] text-ink-500">Neben der Tierart filtert die Suche nach Themengebiet. Auch diese Liste ist pflegbar.</p>
	<ul class="space-y-3">
		{#each content.fields as field (field.id)}
			<li><L10nInput id="f-{field.id}" label="Themengebiet" bind:value={field.title} /></li>
		{/each}
	</ul>
	<div class="flex gap-2">
		<button class="b2" onclick={() => content.fields.push({ id: crypto.randomUUID(), title: { de: 'Neues Themengebiet', en: '' }, order: content.fields.length + 1 })}><Icon name="add" size={18} />Hinzufügen</button>
		<button class="b1" onclick={() => persist('Themengebiete gespeichert')}>Speichern</button>
	</div>
</section>
