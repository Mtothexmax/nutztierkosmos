<script lang="ts">
	import { withBase } from '$lib/paths';
	import { page } from '$app/state';
	import L10nInput from '$lib/components/admin/L10nInput.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { showReqs } from '$lib/requirements.svelte';
	import { content } from '$lib/stores/content.svelte';
	import { session } from '$lib/stores/session.svelte';
	import { toasts } from '$lib/stores/toast.svelte';
	import type { MediaItem, MediaType } from '$lib/types';
	import { nowIso } from '$lib/utils';

	showReqs(['media-library', 'media', 'media-alt', 'downloads', 'cls', 'a11y']);

	const typeLabel: Record<MediaType, string> = { image: 'Bild', video: 'Video', audio: 'Audio', pdf: 'PDF' };
	const typeIcon: Record<MediaType, string> = { image: 'image', video: 'movie', audio: 'headphones', pdf: 'picture_as_pdf' };
	/** Demo-Grenze: Dateien landen im Browser-Speicher. Im Echtbetrieb: Upload auf den Server mit Bildoptimierung. */
	const MAX_KB = 1500;

	let filter = $state<MediaType | ''>('');
	let selectedId = $state<string | null>(page.url.searchParams.get('id') ?? content.media[0]?.id ?? null);
	let draft = $state<MediaItem | null>(null);
	let uploading = $state(false);

	let list = $derived(content.media.filter((m) => !filter || m.type === filter));
	let usage = $derived(draft ? content.mediaUsage(draft.id) : []);
	let altMissing = $derived(draft?.type === 'image' && !draft.alt.de.trim());

	$effect(() => {
		const m = content.getMedia(selectedId ?? '');
		const next = m ? (structuredClone($state.snapshot(m)) as MediaItem) : null;
		if (next) {
			next.caption ??= { de: '', en: '' };
			next.transcript ??= { de: '', en: '' };
			next.alt.en ??= '';
			next.title.en ??= '';
			next.captions ??= {};
		}
		draft = next;
	});

	function readFile(file: File): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(String(reader.result));
			reader.onerror = () => reject(reader.error);
			reader.readAsDataURL(file);
		});
	}

	function typeOf(mime: string): MediaType | null {
		if (mime.startsWith('image/')) return 'image';
		if (mime.startsWith('video/')) return 'video';
		if (mime.startsWith('audio/')) return 'audio';
		if (mime === 'application/pdf') return 'pdf';
		return null;
	}

	async function upload(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const files = [...(input.files ?? [])];
		uploading = true;
		for (const file of files) {
			const type = typeOf(file.type);
			if (!type) {
				toasts.push(`${file.name}: Dateityp nicht erlaubt.`, 'error');
				continue;
			}
			const kb = Math.round(file.size / 1024);
			if (kb > MAX_KB) {
				toasts.push(`${file.name}: ${kb} KB – in der Demo sind höchstens ${MAX_KB} KB möglich.`, 'error');
				continue;
			}
			const src = await readFile(file);
			const name = file.name.replace(/\.[^.]+$/, '');
			const item = content.addMedia({ type, title: { de: name, en: '' }, alt: { de: '', en: '' }, src, mime: file.type, sizeKb: kb, downloadable: type === 'pdf', credit: '' });
			if (!item) toasts.push('Browser-Speicher voll. Bitte kleinere Datei wählen.', 'error');
			else {
				content.log(session.user!.id, 'Medium hochgeladen', name);
				selectedId = item.id;
				toasts.push(type === 'image' ? 'Hochgeladen – bitte Alternativtext ergänzen.' : 'Hochgeladen');
			}
		}
		uploading = false;
		input.value = '';
	}

	async function uploadVtt(event: Event, lang: 'de' | 'en') {
		const file = (event.currentTarget as HTMLInputElement).files?.[0];
		if (!file || !draft) return;
		if (!file.name.endsWith('.vtt')) {
			toasts.push('Bitte eine WebVTT-Datei (.vtt) wählen.', 'error');
			return;
		}
		draft.captions = { ...draft.captions, [lang]: await readFile(file) };
	}

	function save() {
		if (!draft) return;
		if (altMissing && !confirm('Ohne Alternativtext ist das Bild für Screenreader nicht nutzbar. Trotzdem speichern?')) return;
		draft.updatedAt = nowIso();
		const idx = content.media.findIndex((m) => m.id === draft!.id);
		content.media[idx] = structuredClone($state.snapshot(draft)) as MediaItem;
		if (!content.persistMedia()) toasts.push('Speichern fehlgeschlagen', 'error');
		else toasts.push('Medium gespeichert');
	}

	function remove() {
		if (!draft) return;
		if (!content.deleteMedia(draft.id)) {
			toasts.push('Wird noch verwendet – zuerst aus den Inhalten entfernen.', 'error');
			return;
		}
		content.log(session.user!.id, 'Medium gelöscht', draft.title.de, 'security');
		selectedId = content.media[0]?.id ?? null;
	}
</script>

<svelte:head><title>Medien · Redaktion</title></svelte:head>

<div class="flex flex-wrap items-start justify-between gap-3">
	<div>
		<h1 class="h1">Medienbibliothek</h1>
		<p class="max-w-2xl text-ink-500">Zentrale Verwaltung für Bilder, Galerien, Videos, Audio und PDF. Jedes Medium wird einmal gepflegt und überall verwendet.</p>
	</div>
	<label class="b1 cursor-pointer">
		<Icon name="upload" />{uploading ? 'Lädt …' : 'Dateien hochladen'}
		<input type="file" class="sr-only" multiple accept="image/*,video/*,audio/*,application/pdf" onchange={upload} />
	</label>
</div>

<div class="flex flex-wrap gap-1" role="group" aria-label="Medientyp filtern">
	<button class="chip" aria-pressed={filter === ''} onclick={() => (filter = '')}>Alle ({content.media.length})</button>
	{#each Object.entries(typeLabel) as [type, label] (type)}
		<button class="chip" aria-pressed={filter === type} onclick={() => (filter = type as MediaType)}>{label} ({content.media.filter((m) => m.type === type).length})</button>
	{/each}
</div>

<div class="grid gap-6 xl:grid-cols-[1fr_28rem]">
	<ul class="grid content-start gap-3 sm:grid-cols-2 lg:grid-cols-3">
		{#each list as m (m.id)}
			<li>
				<button class="w-full overflow-hidden rounded-2xl border-2 bg-white text-left transition {selectedId === m.id ? 'border-brand-600' : 'border-sand-200 hover:border-brand-500/60'}" aria-current={selectedId === m.id} onclick={() => (selectedId = m.id)}>
					<span class="relative grid aspect-[16/9] place-items-center bg-sand-100">
						{#if m.type === 'image'}
							<img src={withBase(m.src)} alt="" class="h-full w-full object-cover" width="320" height="180" />
						{:else if m.poster}
							<img src={withBase(m.poster)} alt="" class="h-full w-full object-cover" width="320" height="180" />
						{:else}
							<Icon name={typeIcon[m.type]} size={40} class="text-ink-500" />
						{/if}
						<span class="absolute top-2 left-2 rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-semibold"><Icon name={typeIcon[m.type]} size={14} /> {typeLabel[m.type]}</span>
						{#if m.type === 'image' && !m.alt.de.trim()}
							<span class="absolute top-2 right-2 rounded-full bg-danger-500 px-2 py-0.5 text-[11px] font-semibold text-white">Alt-Text fehlt</span>
						{:else if m.type === 'video' && !m.captions?.de}
							<span class="absolute top-2 right-2 rounded-full bg-danger-500 px-2 py-0.5 text-[11px] font-semibold text-white">Untertitel fehlen</span>
						{/if}
					</span>
					<span class="block truncate px-3 pt-2 text-[14px] font-semibold">{m.title.de}</span>
					<span class="block px-3 pb-2 text-[12px] text-ink-500">{m.sizeKb} KB · {m.downloadable ? 'Download frei' : 'kein Download'}</span>
				</button>
			</li>
		{/each}
	</ul>

	{#if draft}
		<form class="card space-y-4 self-start xl:sticky xl:top-0" onsubmit={(e) => (e.preventDefault(), save())}>
			<h2 class="font-serif text-lg font-semibold">Medium bearbeiten</h2>
			{#if draft.type === 'image'}
				<img src={withBase(draft.src)} alt="" class="aspect-[16/9] w-full rounded-xl object-cover" width="440" height="248" />
			{:else if draft.type === 'video'}
				<!-- svelte-ignore a11y_media_has_caption -->
				<video src={withBase(draft.src)} poster={withBase(draft.poster)} controls class="aspect-[16/9] w-full rounded-xl bg-ink-900"></video>
			{:else if draft.type === 'audio'}
				<audio src={withBase(draft.src)} controls class="w-full"></audio>
			{/if}
			<L10nInput id="m-title" label="Titel" bind:value={draft.title} required />
			<L10nInput id="m-alt" label={draft.type === 'image' ? 'Alternativtext (Pflicht)' : 'Kurzbeschreibung'} bind:value={draft.alt} multiline rows={2} required={draft.type === 'image'} hint={draft.type === 'image' ? 'Beschreibt, was auf dem Bild zu sehen ist – für Menschen, die es nicht sehen können. Rein dekorative Bilder bleiben leer.' : undefined} />
			<L10nInput id="m-cap" label="Bildunterschrift" bind:value={draft.caption} />
			<div>
				<label class="lbl" for="m-credit">Urheber / Lizenz</label>
				<input id="m-credit" class="inp" bind:value={draft.credit} />
			</div>
			{#if draft.type === 'video'}
				<fieldset class="space-y-2">
					<legend class="lbl">Untertitel (WebVTT)</legend>
					{#each ['de', 'en'] as lang (lang)}
						{@const has = draft.captions?.[lang as 'de' | 'en']}
						<div class="flex items-center gap-2 text-[14px]">
							<span class="w-8 font-semibold uppercase">{lang}</span>
							<span class="flex-1 {has ? 'text-brand-700' : 'text-danger-500'}">{has ? 'vorhanden' : 'fehlt'}</span>
							<label class="b2 cursor-pointer !py-1.5 text-[13px]">Datei wählen<input type="file" accept=".vtt,text/vtt" class="sr-only" onchange={(e) => uploadVtt(e, lang as 'de' | 'en')} /></label>
						</div>
					{/each}
				</fieldset>
			{/if}
			{#if draft.type === 'video' || draft.type === 'audio'}
				<L10nInput id="m-tr" label="Transkript (Textalternative)" bind:value={draft.transcript} multiline rows={3} />
			{/if}
			<label class="flex items-start gap-2 rounded-xl bg-sand-50 p-3 text-[14px]">
				<input type="checkbox" class="mt-1" bind:checked={draft.downloadable} />
				<span>Download freigeben<span class="block text-[12px] text-ink-500">Wirkt bei der Einstellung „Nur freigegebene Medien“ (aktuell: {content.settings.downloads === 'released' ? 'aktiv' : content.settings.downloads === 'all' ? 'alles erlaubt' : 'keine Downloads'}).</span></span>
			</label>
			<p class="text-[13px] text-ink-500"><strong>Verwendet in:</strong> {usage.length ? usage.join(' · ') : 'nirgends'}</p>
			<div class="flex flex-wrap gap-2 border-t border-sand-200 pt-4">
				<button class="b1" type="submit"><Icon name="save" size={20} />Speichern</button>
				<button class="b3 !text-danger-500" type="button" disabled={usage.length > 0} title={usage.length ? 'Wird verwendet' : undefined} onclick={remove}><Icon name="delete" size={20} />Löschen</button>
			</div>
		</form>
	{/if}
</div>
