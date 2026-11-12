<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import { i18n, uiDictionary, type UiKey } from '$lib/i18n.svelte';
	import { showReqs } from '$lib/requirements.svelte';
	import { content } from '$lib/stores/content.svelte';
	import { session } from '$lib/stores/session.svelte';
	import { toasts } from '$lib/stores/toast.svelte';
	import type { L10n } from '$lib/types';
	import { quizHasLocale } from '$lib/activities';

	showReqs(['i18n', 'translation-flow', 'i18n-context', 'cms-nocode']);

	const has = (v: L10n | undefined) => !v?.de || Boolean(v.en?.trim());

	let rows = $derived([
		{ label: 'Ausstellungen (Titel, Kurztext, Textbausteine)', icon: 'museum', href: '/admin/ausstellungen', items: content.exhibitions.map((e) => ({ name: e.title.de, ok: has(e.title) && has(e.teaser) && e.blocks.every((b) => (b.type === 'text' ? has(b.body) : b.type === 'facts' ? b.items.every(has) : true)), href: `/admin/ausstellungen/${e.id}` })) },
		{ label: 'Kategorien und Themenschwerpunkte', icon: 'account_tree', href: '/admin/struktur', items: [...content.categories, ...content.topics].map((x) => ({ name: x.title.de, ok: has(x.title) && has(x.description), href: '/admin/struktur' })) },
		{ label: 'Medien (Titel, Alternativtext)', icon: 'perm_media', href: '/admin/medien', items: content.media.map((m) => ({ name: m.title.de, ok: has(m.title) && has(m.alt), href: `/admin/medien?id=${m.id}` })) },
		{ label: 'Schlagwörter', icon: 'sell', href: '/admin/schlagwoerter', items: content.keywords.map((k) => ({ name: k.label.de, ok: has(k.label), href: '/admin/schlagwoerter' })) },
		{ label: 'Quizze (alle Texte; im Editor auf Englisch umschalten)', icon: 'quiz', href: '/admin/spiele', items: content.quizzes.map((q) => ({ name: q.title.de, ok: quizHasLocale(q, 'en'), href: `/admin/quiz/${q.id}?lang=en` })) },
		{ label: 'Spiele (Titel, Beschreibung)', icon: 'sports_esports', href: '/admin/spiele', items: content.games.map((g) => ({ name: g.title.de, ok: has(g.title) && has(g.description), href: `/admin/spiele/${g.id}?lang=en` })) }
	]);

	let q = $state('');
	let keys = $derived((Object.keys(uiDictionary) as UiKey[]).filter((k) => !q || k.includes(q) || uiDictionary[k].de.toLowerCase().includes(q.toLowerCase())));
	const initial = {} as Record<UiKey, L10n>;
	for (const key of Object.keys(uiDictionary) as UiKey[]) initial[key] = { ...uiDictionary[key], ...(i18n.overrides[key] ?? {}) };
	let edits = $state<Record<UiKey, L10n>>(initial);

	function saveTexts() {
		const out: Partial<Record<UiKey, L10n>> = {};
		for (const [k, v] of Object.entries($state.snapshot(edits)) as [UiKey, L10n][]) {
			const d = uiDictionary[k];
			if (v && (v.de !== d.de || v.en !== d.en)) out[k] = { de: v.de, en: v.en };
		}
		i18n.overrides = out;
		i18n.saveOverrides();
		content.log(session.user!.id, 'Oberflächentexte geändert', `${Object.keys(out).length} Einträge`);
		toasts.push(`${Object.keys(out).length} Texte angepasst – sofort öffentlich sichtbar`);
	}

	function resetKey(key: UiKey) {
		edits[key] = { ...uiDictionary[key] };
	}
</script>

<svelte:head><title>Texte & Übersetzungen · Redaktion</title></svelte:head>

<div>
	<h1 class="h1">Texte & Übersetzungen</h1>
	<p class="max-w-2xl text-ink-500">Deutsch ist die Leitsprache. Fehlt eine englische Fassung, zeigt die Website automatisch Deutsch mit Hinweis – der Nutzungskontext bleibt beim Sprachwechsel erhalten.</p>
</div>

<section class="card space-y-4" aria-labelledby="status">
	<h2 id="status" class="font-serif text-lg font-semibold">Übersetzungsstand Inhalte</h2>
	<ul class="divide-y divide-sand-200">
		{#each rows as row (row.label)}
			{@const done = row.items.filter((x) => x.ok).length}
			{@const pct = row.items.length ? Math.round((done / row.items.length) * 100) : 100}
			<li class="py-3">
				<details>
					<summary class="flex cursor-pointer flex-wrap items-center gap-3">
						<Icon name={row.icon} class="text-brand-600" />
						<span class="min-w-48 flex-1 font-medium">{row.label}</span>
						<span class="h-2 w-40 rounded-full bg-sand-100" role="img" aria-label="{pct} % übersetzt"><span class="block h-2 rounded-full bg-brand-500" style:width="{pct}%"></span></span>
						<span class="w-28 text-right text-[14px] tabular-nums">{done} / {row.items.length} EN</span>
					</summary>
					<ul class="mt-3 grid gap-1 pl-9 sm:grid-cols-2">
						{#each row.items.filter((x) => !x.ok) as item (item.name)}
							<li><a class="link text-[14px]" href={item.href}>{item.name}</a> <span class="text-[12px] text-sky-500">EN fehlt</span></li>
						{:else}
							<li class="text-[14px] text-brand-700">Alles übersetzt.</li>
						{/each}
					</ul>
				</details>
			</li>
		{/each}
	</ul>
	<p class="rounded-xl bg-sand-50 p-3 text-[13px] text-ink-700"><strong>Workflow-Vorschlag:</strong> Redaktion schreibt Deutsch → Fachprüfung gibt frei → Übersetzung (intern oder Dienstleister) ergänzt EN-Felder → EN-Fassung erscheint sofort. Offene Übersetzungen tauchen auf der Übersicht als Aufgabe auf.</p>
</section>

<section class="card space-y-4" aria-labelledby="ui">
	<div class="flex flex-wrap items-end justify-between gap-3">
		<div>
			<h2 id="ui" class="font-serif text-lg font-semibold">Oberflächentexte (Navigation, Buttons, Hinweise)</h2>
			<p class="text-[14px] text-ink-500">{Object.keys(uiDictionary).length} Einträge, je Deutsch und Englisch.</p>
		</div>
		<div class="flex gap-2">
			<label class="sr-only" for="ui-q">Suchen</label>
			<input id="ui-q" class="inp !w-56" placeholder="Suchen…" bind:value={q} />
			<button class="b1" onclick={saveTexts}><Icon name="save" size={20} />Speichern</button>
		</div>
	</div>
	<div class="max-h-[60vh] overflow-auto rounded-xl border border-sand-200">
		<table class="w-full min-w-[720px]">
			<thead class="sticky top-0 bg-white"><tr><th class="w-48">Schlüssel</th><th>Deutsch</th><th>Englisch</th><th><span class="sr-only">Zurücksetzen</span></th></tr></thead>
			<tbody>
				{#each keys as key (key)}
										<tr>
						<td class="align-top text-[12px] text-ink-500"><code>{key}</code></td>
						<td><label class="sr-only" for="ui-{key}-de">{key} Deutsch</label><input id="ui-{key}-de" class="inp !py-1.5 !text-[14px]" bind:value={edits[key].de} lang="de" /></td>
						<td><label class="sr-only" for="ui-{key}-en">{key} Englisch</label><input id="ui-{key}-en" class="inp !py-1.5 !text-[14px]" bind:value={edits[key].en} lang="en" /></td>
						<td><button class="b3 !p-1.5" aria-label="{key} auf Standard zurücksetzen" title="Standard" onclick={() => resetKey(key)}><Icon name="restart_alt" size={18} /></button></td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</section>
