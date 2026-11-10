<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import { showReqs } from '$lib/requirements.svelte';
	import { content } from '$lib/stores/content.svelte';
	import { roleLabel, session } from '$lib/stores/session.svelte';
	import { formatDateTime } from '$lib/utils';

	showReqs(['cms-nocode', 'roles', 'versions', 'audit', 'stats']);

	const statusLabel = { draft: 'Entwurf', review: 'In Prüfung', published: 'Veröffentlicht', archived: 'Archiviert' } as const;

	let counts = $derived({
		published: content.exhibitions.filter((e) => e.status === 'published').length,
		review: content.exhibitions.filter((e) => e.status === 'review').length,
		draft: content.exhibitions.filter((e) => e.status === 'draft').length
	});
	let waiting = $derived(content.exhibitions.filter((e) => e.status === 'review'));
	let missingEn = $derived(content.exhibitions.filter((e) => e.status === 'published' && (!e.title.en || !e.teaser.en)).length);
	let missingAlt = $derived(content.media.filter((m) => m.type === 'image' && !m.alt.de.trim() ).length);
	let views30 = $derived(Object.values(content.stats.daily).reduce((a, b) => a + b, 0));
	let recent = $derived(content.recentItems());
	let user = $derived(session.user);

	let kpis = $derived([
		{ label: 'Veröffentlichte Ausstellungen', value: counts.published, icon: 'public', href: '/admin/ausstellungen?status=published' },
		{ label: 'Warten auf Prüfung', value: counts.review, icon: 'rate_review', href: '/admin/ausstellungen?status=review' },
		{ label: 'Entwürfe', value: counts.draft, icon: 'edit_note', href: '/admin/ausstellungen?status=draft' },
		{ label: 'Seitenaufrufe (30 Tage)', value: views30.toLocaleString('de-DE'), icon: 'monitoring', href: '/admin/statistik' }
	]);
</script>

<svelte:head><title>Übersicht · Redaktion</title></svelte:head>

<div>
	<h1 class="h1">Guten Tag, {user?.name.replace('Dr. ', '').split(' ')[0]}</h1>
	<p class="text-ink-500">Angemeldet als {roleLabel[user?.role ?? 'editor']} · Demo-Daten</p>
</div>

<div class="grid grid-cols-2 gap-4 xl:grid-cols-4">
	{#each kpis as kpi (kpi.label)}
		<a href={kpi.href} class="card block !p-5 transition hover:border-brand-500">
			<Icon name={kpi.icon} class="text-brand-600" />
			<div class="mt-2 font-serif text-[34px] leading-none font-semibold">{kpi.value}</div>
			<div class="mt-1 text-[13px] text-ink-500">{kpi.label}</div>
		</a>
	{/each}
</div>

<div class="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
	<section class="card space-y-4" aria-labelledby="todo">
		<h2 id="todo" class="font-serif text-xl font-semibold">Aufgaben</h2>
		<ul class="divide-y divide-sand-200">
			{#each waiting as e (e.id)}
				<li class="flex flex-wrap items-center gap-3 py-3">
					<span class="status status-review"><Icon name="rate_review" size={14} />In Prüfung</span>
					<span class="min-w-0 flex-1 font-medium">{e.title.de}</span>
					<a class="b2 !py-1.5 text-[14px]" href="/admin/ausstellungen/{e.id}">{session.can('content.publish') ? 'Prüfen' : 'Ansehen'}</a>
				</li>
			{/each}
			{#if missingEn}
				<li class="flex flex-wrap items-center gap-3 py-3">
					<span class="status bg-sky-500/10 text-sky-500"><Icon name="translate" size={14} />Übersetzung</span>
					<span class="flex-1">{missingEn} veröffentlichte Ausstellungen ohne englischen Titel/Teaser</span>
					<a class="b2 !py-1.5 text-[14px]" href="/admin/uebersetzungen">Ansehen</a>
				</li>
			{/if}
			{#if missingAlt}
				<li class="flex flex-wrap items-center gap-3 py-3">
					<span class="status bg-err-bg text-err-fg"><Icon name="image_not_supported" size={14} />Barrierefreiheit</span>
					<span class="flex-1">{missingAlt} Bilder ohne Alternativtext</span>
					<a class="b2 !py-1.5 text-[14px]" href="/admin/medien">Ansehen</a>
				</li>
			{/if}
			{#if !waiting.length && !missingEn && !missingAlt}
				<li class="py-3 text-ink-500">Keine offenen Aufgaben.</li>
			{/if}
		</ul>
	</section>

	<section class="card space-y-3" aria-labelledby="recent">
		<h2 id="recent" class="font-serif text-xl font-semibold">Zuletzt geändert</h2>
		<ul class="divide-y divide-sand-200">
			{#each recent as item (item.id)}
				<li>
					<a href={item.href} class="flex items-center gap-3 py-2.5 hover:text-brand-700">
						<Icon name={item.type === 'Quiz' ? 'quiz' : 'museum'} size={20} class="text-brand-600" />
						<span class="min-w-0 flex-1 truncate font-medium">{item.title}</span>
						{#if item.status}<span class="status status-{item.status}">{statusLabel[item.status]}</span>{/if}
						<span class="hidden text-[13px] text-ink-500 sm:inline">{formatDateTime(item.updatedAt)}</span>
					</a>
				</li>
			{/each}
		</ul>
	</section>
</div>

{#if session.can('content.edit')}
	<section class="card" aria-labelledby="flow">
		<h2 id="flow" class="mb-4 font-serif text-xl font-semibold">So entsteht eine Ausstellung</h2>
		<ol class="grid gap-4 md:grid-cols-4">
			{#each [
				{ icon: 'article', t: 'Publikation erfassen', d: 'Titel, Autor/innen, Datum, Schlagwörter, Link.' },
				{ icon: 'edit_note', t: 'Ausstellung schreiben', d: 'Bausteine: Text, Kernaussagen, Medien, Infografik, Quiz.' },
				{ icon: 'rate_review', t: 'Fachlich prüfen', d: 'Die Fachprüfung gibt frei oder schickt mit Kommentar zurück.' },
				{ icon: 'public', t: 'Veröffentlichen', d: 'Jeder Schritt wird als Version gespeichert.' }
			] as step, i (step.t)}
				<li class="rounded-xl bg-sand-50 p-4">
					<span class="mb-2 flex items-center gap-2 text-[13px] font-semibold text-brand-700"><span class="grid h-6 w-6 place-items-center rounded-full bg-brand-600 text-white">{i + 1}</span><Icon name={step.icon} size={18} /></span>
					<p class="font-semibold">{step.t}</p>
					<p class="text-[14px] text-ink-500">{step.d}</p>
				</li>
			{/each}
		</ol>
	</section>
{/if}
