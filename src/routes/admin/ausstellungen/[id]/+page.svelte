<script lang="ts">
	import { withBase } from '$lib/paths';
	import { beforeNavigate } from '$app/navigation';
	import { goto } from '$lib/paths';
	import { page } from '$app/state';
	import L10nInput from '$lib/components/admin/L10nInput.svelte';
	import TopicSelect from '$lib/components/admin/TopicSelect.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { showReqs } from '$lib/requirements.svelte';
	import { content } from '$lib/stores/content.svelte';
	import { session } from '$lib/stores/session.svelte';
	import { toasts } from '$lib/stores/toast.svelte';
	import type { Audience, Block, BlockType, Exhibition, L10n, MediaType, Status } from '$lib/types';
	import { formatDateTime, uid } from '$lib/utils';
	import { quizHasLocale } from '$lib/activities';

	showReqs(['cms-nocode', 'exhibitions', 'publication-fields', 'media', 'media-alt', 'preview', 'versions', 'roles', 'i18n', 'translation-flow', 'interactive']);

	const statusLabel: Record<Status, string> = { draft: 'Entwurf', review: 'In Prüfung', published: 'Veröffentlicht', archived: 'Archiviert' };
	const blockMeta: Record<BlockType, { label: string; icon: string; hint: string }> = {
		text: { label: 'Text', icon: 'notes', hint: 'Zwischenüberschrift und Fließtext. Leerzeile = neuer Absatz.' },
		facts: { label: 'Kernaussagen', icon: 'lightbulb', hint: 'Das Wichtigste in Kürze – 2 bis 5 Sätze.' },
		media: { label: 'Medium', icon: 'perm_media', hint: 'Bild, Video, Audio oder PDF aus der Medienbibliothek.' },
		gallery: { label: 'Bildergalerie', icon: 'photo_library', hint: 'Mehrere Bilder zum Durchblättern.' },
		infographic: { label: 'Infografik', icon: 'insert_chart', hint: 'Interaktive Grafik aus „Infografiken“.' },
		quiz: { label: 'Quiz', icon: 'quiz', hint: 'Freiwilliges Quiz. Englische Fassung wird automatisch gewählt.' },
		game: { label: 'Spiel', icon: 'sports_esports', hint: 'HTML-Spiel aus „Quiz & Spiele“.' }
	};
	const audiences: { id: Audience; label: string }[] = [
		{ id: 'allgemein', label: 'Allgemeine Öffentlichkeit' },
		{ id: 'schule', label: 'Schule' },
		{ id: 'studium', label: 'Studium & Wissenschaft' },
		{ id: 'presse', label: 'Presse' }
	];

	const id = page.params.id ?? '';
	const source = content.getExhibition(id);

	function normalize(e: Exhibition): Exhibition {
		const copy = structuredClone($state.snapshot(e)) as Exhibition;
		copy.teaser.en ??= '';
		copy.title.en ??= '';
		for (const b of copy.blocks) {
			if (b.type === 'text' || b.type === 'facts' || b.type === 'gallery') b.heading ??= { de: '', en: '' };
			if (b.type === 'text') b.body.en ??= '';
		}
		return copy;
	}

	let draft = $state<Exhibition | null>(source ? normalize(source) : null);
	let saved = $state(source ? JSON.stringify(normalize(source)) : "");
	let dirty = $derived(JSON.stringify(draft) !== saved);
	let tab = $state<'content' | 'meta' | 'versions'>('content');
	let reviewNote = $state('');
	let confirmDelete = $state(false);

	let stored = $derived(content.getExhibition(id));
	let canEdit = $derived(session.can('content.edit'));
	let hero = $derived(content.getMedia(draft?.heroMediaId));

	let checks = $derived(
		draft
			? [
					{ ok: Boolean(draft.title.de.trim()), label: 'Titel (Deutsch)', required: true },
					{ ok: Boolean(draft.teaser.de.trim()), label: 'Kurztext (Deutsch)', required: true },
					{ ok: draft.publicationIds.length > 0, label: 'Mindestens eine Publikation verknüpft', required: true },
					{ ok: !hero || Boolean(hero.alt.de.trim()), label: 'Alternativtext für das Titelbild', required: true },
					{ ok: draft.keywordIds.length > 0, label: 'Schlagwörter vergeben', required: false },
					{ ok: Boolean(draft.title.en?.trim() && draft.teaser.en?.trim()), label: 'Englische Fassung (Titel, Kurztext)', required: false }
				]
			: []
	);
	let ready = $derived(checks.filter((c) => c.required).every((c) => c.ok));

	beforeNavigate(({ cancel, to }) => {
		if (dirty && !to?.url.searchParams.has('vorschau') && !confirm('Ungespeicherte Änderungen verwerfen?')) cancel();
	});

	function save(note = 'Gespeichert'): boolean {
		if (!draft) return false;
		if (!draft.title.de.trim()) {
			toasts.push('Bitte einen deutschen Titel eingeben.', 'error');
			tab = 'content';
			return false;
		}
		const ok = content.saveExhibition(draft, session.user!.id, note);
		if (ok) {
			saved = JSON.stringify(draft);
			toasts.push('Gespeichert – neue Version angelegt');
		} else toasts.push('Speichern fehlgeschlagen (Speicher voll?)', 'error');
		return ok;
	}

	function preview() {
		if (dirty && !save('Für Vorschau gespeichert')) return;
		goto(`/ausstellung/${draft!.slug}?vorschau=1`);
	}

	function setStatus(status: Status, note?: string) {
		if (dirty) save();
		content.setStatus(id, status, session.user!.id, note);
		const fresh = content.getExhibition(id);
		if (fresh && draft) {
			draft.status = fresh.status;
			draft.versions = fresh.versions;
			draft.publishedAt = fresh.publishedAt;
			draft.reviewNote = fresh.reviewNote;
			saved = JSON.stringify(draft);
		}
		reviewNote = '';
		toasts.push(`Status: ${statusLabel[status]}`);
	}

	function restore(versionId: string) {
		if (!confirm('Diese Version wiederherstellen? Der aktuelle Stand bleibt in der Historie erhalten.')) return;
		content.restoreVersion(id, versionId, session.user!.id);
		draft = normalize(content.getExhibition(id)!);
		saved = JSON.stringify(draft);
		toasts.push('Version wiederhergestellt (als Entwurf)');
	}

	function remove() {
		content.deleteExhibition(id, session.user!.id);
		saved = JSON.stringify(draft);
		toasts.push('Ausstellung gelöscht', 'info');
		goto('/admin/ausstellungen');
	}

	const emptyL = (): L10n => ({ de: '', en: '' });

	function addBlock(type: BlockType) {
		if (!draft) return;
		const firstOf = (t: MediaType[]) => content.media.find((m) => t.includes(m.type))?.id ?? '';
		const blocks: Record<BlockType, () => Block> = {
			text: () => ({ id: uid(), type: 'text', heading: emptyL(), body: emptyL() }),
			facts: () => ({ id: uid(), type: 'facts', heading: { de: 'Das Wichtigste in Kürze', en: 'Key points' }, items: [emptyL(), emptyL()] }),
			media: () => ({ id: uid(), type: 'media', mediaId: firstOf(['image', 'video', 'audio', 'pdf']) }),
			gallery: () => ({ id: uid(), type: 'gallery', heading: emptyL(), mediaIds: [] }),
			infographic: () => ({ id: uid(), type: 'infographic', infographicId: content.infographics[0]?.id ?? '' }),
			quiz: () => ({ id: uid(), type: 'quiz', quizId: content.quizzes[0]?.id ?? '' }),
			game: () => ({ id: uid(), type: 'game', gameId: content.games[0]?.id ?? '' })
		};
		draft.blocks.push(blocks[type]());
	}

	function moveBlock(i: number, dir: -1 | 1) {
		if (!draft) return;
		const j = i + dir;
		if (j < 0 || j >= draft.blocks.length) return;
		[draft.blocks[i], draft.blocks[j]] = [draft.blocks[j], draft.blocks[i]];
	}

	function toggle(list: string[], value: string): string[] {
		return list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
	}

	let newKeyword = $state('');
	function addKeyword() {
		const k = content.addKeyword(newKeyword);
		if (k && draft && !draft.keywordIds.includes(k.id)) draft.keywordIds.push(k.id);
		newKeyword = '';
	}

	const mediaIcon: Record<MediaType, string> = { image: 'image', video: 'movie', audio: 'headphones', pdf: 'picture_as_pdf' };
</script>

<svelte:head><title>{draft?.title.de ?? 'Ausstellung'} · Redaktion</title></svelte:head>

{#if !draft || !stored}
	<div class="card text-center">
		<p class="mb-4">Diese Ausstellung gibt es nicht.</p>
		<a class="b1" href="/admin/ausstellungen">Zur Liste</a>
	</div>
{:else}
	<div class="flex flex-wrap items-start gap-3">
		<a class="b3 !p-2" href="/admin/ausstellungen" aria-label="Zurück zur Liste"><Icon name="arrow_back" /></a>
		<div class="min-w-0 flex-1">
			<p class="ovl">Ausstellung bearbeiten</p>
			<h1 class="h1 !text-[28px]">{draft.title.de || 'Ohne Titel'}</h1>
			<p class="mt-1 flex flex-wrap items-center gap-2 text-[13px] text-ink-500">
				<span class="status status-{stored.status}">{statusLabel[stored.status]}</span>
				Zuletzt gespeichert {formatDateTime(stored.updatedAt)} · {stored.versions.length} Versionen
				{#if dirty}<span class="font-semibold text-[#8a5a17]">· Ungespeicherte Änderungen</span>{/if}
			</p>
		</div>
		<button class="b2" onclick={preview}><Icon name="visibility" size={20} />Vorschau</button>
		<button class="b1" onclick={() => save()} disabled={!dirty || !canEdit}><Icon name="save" size={20} />Speichern</button>
	</div>

	<div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
		<div class="min-w-0 space-y-5">
			<div role="tablist" aria-label="Bereiche" class="flex gap-1 border-b border-sand-200">
				{#each [['content', 'Inhalt', 'edit_note'], ['meta', 'Zuordnung & Quellen', 'link'], ['versions', 'Versionen', 'history']] as [key, label, icon] (key)}
					<button
						role="tab"
						id="tab-{key}"
						aria-selected={tab === key}
						aria-controls="panel-{key}"
						class="-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-[15px] font-medium {tab === key ? 'border-brand-600 text-brand-700' : 'border-transparent text-ink-500 hover:text-ink-900'}"
						onclick={() => (tab = key as typeof tab)}
					>
						<Icon name={icon} size={20} />{label}
					</button>
				{/each}
			</div>

			{#if tab === 'content'}
				<div id="panel-content" role="tabpanel" aria-labelledby="tab-content" class="space-y-5">
					<section class="card space-y-4">
						<L10nInput id="ex-title" label="Titel" bind:value={draft.title} required />
						<L10nInput id="ex-teaser" label="Kurztext (Teaser)" bind:value={draft.teaser} multiline rows={3} required hint="Erscheint auf Karten, in der Suche und unter dem Titel. 1–2 Sätze, ohne Fachjargon." />
						<div class="grid gap-4 md:grid-cols-[1fr_auto]">
							<div>
								<label class="lbl" for="ex-hero">Titelbild</label>
								<select id="ex-hero" class="inp" bind:value={draft.heroMediaId}>
									<option value={undefined}>– kein Bild –</option>
									{#each content.media.filter((m) => m.type === 'image') as m (m.id)}<option value={m.id}>{m.title.de}</option>{/each}
								</select>
								{#if hero && !hero.alt.de.trim()}
									<p class="mt-1 text-[13px] text-danger-500">Diesem Bild fehlt ein Alternativtext. <a class="link" href="/admin/medien?id={hero.id}">In der Medienbibliothek ergänzen</a></p>
								{/if}
							</div>
							{#if hero}<img src={withBase(hero.src)} alt="" class="h-20 w-36 rounded-lg object-cover" width="144" height="80" />{/if}
						</div>
					</section>

					<h2 class="font-serif text-xl font-semibold">Bausteine</h2>
					{#each draft.blocks as block, i (block.id)}
						{@const meta = blockMeta[block.type]}
						<section class="card space-y-4 !p-5" aria-label="Baustein {i + 1}: {meta.label}">
							<div class="flex flex-wrap items-center gap-2">
								<span class="grid h-8 w-8 place-items-center rounded-lg bg-brand-50 text-brand-700"><Icon name={meta.icon} size={20} /></span>
								<span class="font-semibold">{i + 1}. {meta.label}</span>
								<span class="hidden text-[13px] text-ink-500 md:inline">– {meta.hint}</span>
								<span class="ml-auto flex gap-1">
									<button class="b3 !p-1.5" aria-label="Baustein {i + 1} nach oben" disabled={i === 0} onclick={() => moveBlock(i, -1)}><Icon name="arrow_upward" size={18} /></button>
									<button class="b3 !p-1.5" aria-label="Baustein {i + 1} nach unten" disabled={i === draft.blocks.length - 1} onclick={() => moveBlock(i, 1)}><Icon name="arrow_downward" size={18} /></button>
									<button class="b3 !p-1.5 !text-danger-500" aria-label="Baustein {i + 1} entfernen" onclick={() => draft && draft.blocks.splice(i, 1)}><Icon name="delete" size={18} /></button>
								</span>
							</div>

							{#if block.type === 'text'}
								<L10nInput id="b-{block.id}-h" label="Zwischenüberschrift (optional)" bind:value={block.heading} />
								<L10nInput id="b-{block.id}-b" label="Text" bind:value={block.body} multiline rows={6} />
							{:else if block.type === 'facts'}
								<L10nInput id="b-{block.id}-h" label="Überschrift" bind:value={block.heading} />
								{#each block.items as _item, k (k)}
									<div class="flex items-start gap-2">
										<div class="flex-1"><L10nInput id="b-{block.id}-i{k}" label="Aussage {k + 1}" bind:value={block.items[k]} /></div>
										<button class="b3 mt-6 !p-2" aria-label="Aussage {k + 1} entfernen" onclick={() => block.items.splice(k, 1)}><Icon name="close" size={18} /></button>
									</div>
								{/each}
								<button class="b2 !py-2 text-[14px]" onclick={() => block.items.push(emptyL())}><Icon name="add" size={18} />Aussage hinzufügen</button>
							{:else if block.type === 'media'}
								{@const m = content.getMedia(block.mediaId)}
								<div class="flex flex-wrap items-end gap-3">
									<div class="min-w-64 flex-1">
										<label class="lbl" for="b-{block.id}-m">Medium</label>
										<select id="b-{block.id}-m" class="inp" bind:value={block.mediaId}>
											{#each content.media as item (item.id)}<option value={item.id}>[{item.type.toUpperCase()}] {item.title.de}</option>{/each}
										</select>
									</div>
									{#if m}
										<span class="inline-flex items-center gap-1 text-[13px] text-ink-500"><Icon name={mediaIcon[m.type]} size={18} />{m.type === 'video' ? (m.captions?.de ? 'mit Untertiteln' : 'ohne Untertitel!') : m.type === 'image' ? (m.alt.de ? 'Alt-Text vorhanden' : 'Alt-Text fehlt!') : m.transcript?.de ? 'mit Transkript' : ''}</span>
									{/if}
								</div>
							{:else if block.type === 'gallery'}
								<L10nInput id="b-{block.id}-h" label="Überschrift (optional)" bind:value={block.heading} />
								<fieldset>
									<legend class="lbl">Bilder auswählen</legend>
									<div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
										{#each content.media.filter((x) => x.type === 'image') as m (m.id)}
											{@const on = block.mediaIds.includes(m.id)}
											<label class="relative cursor-pointer overflow-hidden rounded-xl border-2 {on ? 'border-brand-600' : 'border-sand-200'}">
												<input type="checkbox" class="absolute top-2 left-2 h-4 w-4" checked={on} onchange={() => (block.mediaIds = toggle(block.mediaIds, m.id))} />
												<img src={withBase(m.src)} alt="" class="aspect-[16/9] w-full object-cover" width="160" height="90" />
												<span class="block truncate px-2 py-1 text-[12px]">{m.title.de}</span>
											</label>
										{/each}
									</div>
								</fieldset>
							{:else if block.type === 'infographic'}
								<label class="lbl" for="b-{block.id}-ig">Infografik</label>
								<select id="b-{block.id}-ig" class="inp" bind:value={block.infographicId}>
									{#each content.infographics as g (g.id)}<option value={g.id}>{g.title.de}</option>{/each}
								</select>
								<a class="link text-[14px]" href="/admin/infografiken">Infografiken bearbeiten</a>
							{:else if block.type === 'quiz'}
								<label class="lbl" for="b-{block.id}-q">Quiz</label>
								<select id="b-{block.id}-q" class="inp" bind:value={block.quizId}>
									{#each content.quizzes as q (q.id)}
										<option value={q.id}>{q.title.de}{q.published ? '' : ' (Entwurf)'}{quizHasLocale(q, 'en') ? ' · EN vollständig' : ''}</option>
									{/each}
								</select>
								<a class="link text-[14px]" href="/admin/quiz/{block.quizId}">Quiz bearbeiten</a>
							{:else if block.type === 'game'}
								<label class="lbl" for="b-{block.id}-g">Spiel</label>
								<select id="b-{block.id}-g" class="inp" bind:value={block.gameId}>
									{#each content.games as g (g.id)}<option value={g.id}>{g.title.de}</option>{/each}
								</select>
							{/if}
						</section>
					{/each}

					<div class="card !p-4">
						<p class="mb-2 text-[13px] font-semibold text-ink-500">Baustein hinzufügen</p>
						<div class="flex flex-wrap gap-2">
							{#each Object.entries(blockMeta) as [type, meta] (type)}
								<button class="b2 !py-2 text-[14px]" onclick={() => addBlock(type as BlockType)}><Icon name={meta.icon} size={18} />{meta.label}</button>
							{/each}
						</div>
					</div>
				</div>
			{:else if tab === 'meta'}
				<div id="panel-meta" role="tabpanel" aria-labelledby="tab-meta" class="space-y-5">
					<section class="card grid gap-4 md:grid-cols-2">
						<div>
							<label class="lbl" for="ex-topic">Themenschwerpunkt</label>
							<TopicSelect id="ex-topic" bind:value={draft.topicId} />
						</div>
						<div>
							<label class="lbl" for="ex-slug">Adresse (URL)</label>
							<div class="flex items-center gap-1 text-[14px] text-ink-500">/ausstellung/<input id="ex-slug" class="inp" bind:value={draft.slug} pattern="[a-z0-9-]+" /></div>
						</div>
						<div>
							<label class="lbl" for="ex-min">Lesezeit in Minuten</label>
							<input id="ex-min" class="inp" type="number" min="1" max="60" bind:value={draft.readingMinutes} />
						</div>
						<fieldset>
							<legend class="lbl">Zielgruppen</legend>
							<div class="flex flex-wrap gap-2">
								{#each audiences as a (a.id)}
									<button type="button" class="chip" aria-pressed={draft.audiences.includes(a.id)} onclick={() => draft && (draft.audiences = toggle(draft.audiences, a.id) as Audience[])}>{a.label}</button>
								{/each}
							</div>
						</fieldset>
					</section>

					<section class="card space-y-3">
						<div class="flex items-center justify-between gap-2">
							<h2 class="font-serif text-lg font-semibold">Publikationen (Grundlage)</h2>
							<a class="link text-[14px]" href="/admin/publikationen">Publikationen verwalten</a>
						</div>
						<ul class="space-y-2">
							{#each content.publications as p (p.id)}
								<li>
									<label class="flex cursor-pointer items-start gap-3 rounded-xl border p-3 {draft.publicationIds.includes(p.id) ? 'border-brand-600 bg-brand-50' : 'border-sand-200'}">
										<input type="checkbox" class="mt-1" checked={draft.publicationIds.includes(p.id)} onchange={() => draft && (draft.publicationIds = toggle(draft.publicationIds, p.id))} />
										<span>
											<span class="block text-[15px] font-semibold">{p.title}</span>
											<span class="block text-[13px] text-ink-500">{p.authors.join(', ')} · {p.date}</span>
										</span>
									</label>
								</li>
							{/each}
						</ul>
					</section>

					<section class="card space-y-3">
						<h2 class="font-serif text-lg font-semibold">Schlagwörter</h2>
						<div class="flex flex-wrap gap-2">
							{#each [...content.keywords].sort((a, b) => a.label.de.localeCompare(b.label.de)) as k (k.id)}
								<button type="button" class="chip" aria-pressed={draft.keywordIds.includes(k.id)} onclick={() => draft && (draft.keywordIds = toggle(draft.keywordIds, k.id))}>{k.label.de}</button>
							{/each}
						</div>
						<form class="flex gap-2" onsubmit={(e) => (e.preventDefault(), addKeyword())}>
							<label class="sr-only" for="new-kw">Neues Schlagwort</label>
							<input id="new-kw" class="inp !w-64" placeholder="Neues Schlagwort…" bind:value={newKeyword} />
							<button class="b2" type="submit" disabled={!newKeyword.trim()}>Hinzufügen</button>
						</form>
					</section>
				</div>
			{:else}
				<div id="panel-versions" role="tabpanel" aria-labelledby="tab-versions" class="card !p-0">
					<ol class="divide-y divide-sand-200">
						{#each stored.versions as v, i (v.id)}
							<li class="flex flex-wrap items-center gap-3 p-4">
								<Icon name={i === 0 ? 'radio_button_checked' : 'history'} class={i === 0 ? 'text-brand-600' : 'text-ink-500'} />
								<div class="min-w-0 flex-1">
									<p class="font-medium">{v.note}</p>
									<p class="text-[13px] text-ink-500">{formatDateTime(v.at)} · {content.getUser(v.by)?.name ?? v.by} · Status: {statusLabel[v.snapshot.status]} · „{v.snapshot.title.de}“</p>
								</div>
								{#if i === 0}
									<span class="bdg">Aktuell</span>
								{:else if canEdit}
									<button class="b2 !py-1.5 text-[14px]" onclick={() => restore(v.id)}><Icon name="restore" size={18} />Wiederherstellen</button>
								{/if}
							</li>
						{/each}
					</ol>
				</div>
			{/if}
		</div>

		<aside class="space-y-4 xl:sticky xl:top-0 xl:self-start">
			<section class="card space-y-3 !p-5" aria-labelledby="wf">
				<h2 id="wf" class="font-semibold">Freigabe</h2>
				<ol class="flex items-center gap-1 text-[12px] font-semibold" aria-label="Workflow">
					{#each ['draft', 'review', 'published'] as s, i (s)}
						{@const current = stored.status === s}
						<li class="flex items-center gap-1">
							<span class="rounded-full px-2 py-1 whitespace-nowrap {current ? 'bg-brand-600 text-white' : 'bg-sand-100 text-ink-500'}" aria-current={current ? 'step' : undefined}>{statusLabel[s as Status]}</span>
							{#if i < 2}<Icon name="chevron_right" size={16} class="text-ink-500" />{/if}
						</li>
					{/each}
				</ol>

				{#if stored.reviewNote}
					<p class="rounded-xl bg-[#fdf3e1] p-3 text-[13px]"><strong>Kommentar der Fachprüfung:</strong> {stored.reviewNote}</p>
				{/if}

				<ul class="space-y-1.5 text-[13px]">
					{#each checks as c (c.label)}
						<li class="flex items-start gap-2">
							<Icon name={c.ok ? 'check_circle' : c.required ? 'cancel' : 'warning'} size={18} filled class={c.ok ? 'text-brand-600' : c.required ? 'text-danger-500' : 'text-[#b07a1a]'} />
							<span>{c.label}{c.required ? '' : ' (empfohlen)'}<span class="sr-only">: {c.ok ? 'erfüllt' : 'offen'}</span></span>
						</li>
					{/each}
				</ul>

				{#if stored.status === 'draft'}
					{#if session.can('content.submit')}
						<button class="b1 w-full" disabled={!ready} onclick={() => setStatus('review')}><Icon name="send" size={20} />Zur Prüfung einreichen</button>
					{/if}
					{#if session.can('content.publish')}
						<button class="b2 w-full" disabled={!ready} onclick={() => setStatus('published')}><Icon name="public" size={20} />Direkt veröffentlichen</button>
					{/if}
				{:else if stored.status === 'review'}
					{#if session.can('content.publish')}
						<label class="lbl" for="review-note">Kommentar (bei Rückgabe)</label>
						<textarea id="review-note" class="inp" rows="3" bind:value={reviewNote}></textarea>
						<button class="b1 w-full" disabled={!ready} onclick={() => setStatus('published', '')}><Icon name="verified" size={20} />Freigeben & veröffentlichen</button>
						<button class="b2 w-full" disabled={!reviewNote.trim()} onclick={() => setStatus('draft', reviewNote.trim())}><Icon name="undo" size={20} />Zur Überarbeitung zurück</button>
					{:else}
						<p class="text-[13px] text-ink-500">Wartet auf die Fachprüfung. Sie können weiter speichern; die Fachprüfung sieht immer die aktuelle Fassung.</p>
					{/if}
				{:else if stored.status === 'published'}
					<a class="b2 w-full" href="/ausstellung/{stored.slug}"><Icon name="open_in_new" size={20} />Live ansehen</a>
					{#if session.can('content.publish')}
						<button class="b3 w-full" onclick={() => setStatus('draft', 'Offline genommen')}><Icon name="unpublished" size={20} />Offline nehmen</button>
					{/if}
				{/if}
			</section>

			{#if session.can('content.delete')}
				<section class="card space-y-2 !p-5">
					{#if confirmDelete}
						<p class="text-[14px]">Wirklich löschen? Das lässt sich nicht rückgängig machen.</p>
						<div class="flex gap-2">
							<button class="b4" onclick={remove}>Löschen</button>
							<button class="b3" onclick={() => (confirmDelete = false)}>Abbrechen</button>
						</div>
					{:else}
						<button class="b3 w-full !text-danger-500" onclick={() => (confirmDelete = true)}><Icon name="delete" size={20} />Ausstellung löschen</button>
					{/if}
				</section>
			{/if}
		</aside>
	</div>
{/if}
