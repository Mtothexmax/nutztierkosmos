<script lang="ts">
	import { withBase } from '$lib/paths';
	import Icon from '$lib/components/Icon.svelte';
	import ImageHotspotEditor from '$lib/components/admin/ImageHotspotEditor.svelte';
	import MatchConnectionsEditor from '$lib/components/admin/MatchConnectionsEditor.svelte';
	import {
		mediaAccept,
		mediaAssetsOf,
		mediaIcon,
		mediaKindHint,
		mediaKindLabel,
		mediaKindOf,
		mediaMaxFiles,
		mediaSupportsPolygon,
		type MediaAsset,
		type MediaKind,
		type Question
	} from '$lib/types';
	import { uid } from '$lib/utils';

	type Props = { question: Question };
	let { question }: Props = $props();

	const mediaKindOptions: MediaKind[] = ['image', 'video', 'infographic', 'audio'];
	const MAX_MEDIA_BYTES = 2 * 1024 * 1024;
	const MAX_MEDIA_TOTAL = 3 * 1024 * 1024;

	let mediaError = $state('');
	let currentKind = $derived<MediaKind>(
		question.type === 'image' ? mediaKindOf(question) : 'image'
	);
	let assets = $derived<MediaAsset[]>(
		question.type === 'image' ? mediaAssetsOf(question) : []
	);
	let polygonAllowed = $derived(mediaSupportsPolygon(currentKind));
	let uploadLabel = $derived(
		currentKind === 'video'
			? 'Video auswählen'
			: currentKind === 'audio'
				? 'Audiodatei auswählen'
				: currentKind === 'infographic'
					? 'Infografik auswählen'
					: 'Bild(er) auswählen'
	);

	function readAsDataUrl(file: File): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(reader.result as string);
			reader.onerror = () => reject(reader.error);
			reader.readAsDataURL(file);
		});
	}

	// `image` bleibt als Spiegel des ersten Bildes erhalten: der Polygon-Editor
	// und ältere Quiz-Daten lesen dieses Feld.
	function syncLegacyImage() {
		if (question.type !== 'image') return;
		const first = (question.media ?? [])[0];
		question.image =
			first && mediaSupportsPolygon(mediaKindOf(question)) && first.mime.startsWith('image/')
				? first.src
				: undefined;
	}

	function setMediaKind(value: string) {
		if (question.type !== 'image') return;
		const kind = value as MediaKind;
		const before = mediaKindOf(question);
		if (kind === before) return;
		question.mediaKind = kind;
		mediaError = '';
		if (!mediaSupportsPolygon(kind) && question.mode === 'click') question.mode = 'choice';
		// Bild <-> Infografik behält die Dateien. Ein Wechsel zu Video/Audio
		// entfernt sie, weil sie dort nicht dargestellt werden können.
		if (mediaSupportsPolygon(before) && mediaSupportsPolygon(kind)) {
			question.media = (question.media ?? []).slice(0, mediaMaxFiles[kind]);
			syncLegacyImage();
			return;
		}
		question.media = [];
		question.image = undefined;
		question.clickImageUrl = undefined;
		question.clickPolygon = [];
	}

	function handleMedia(event: Event) {
		if (question.type !== 'image') return;
		const input = event.currentTarget as HTMLInputElement;
		const files = Array.from(input.files ?? []);
		input.value = '';
		if (files.length === 0) return;
		const kind = mediaKindOf(question);
		const prefix = kind === 'video' ? 'video/' : kind === 'audio' ? 'audio/' : 'image/';
		const max = mediaMaxFiles[kind];
		mediaError = '';
		if (files.some((file) => !file.type.startsWith(prefix))) {
			mediaError = `Bitte eine passende Datei für „${mediaKindLabel[kind]}“ auswählen.`;
			return;
		}
		const keep: MediaAsset[] = max === 1 ? [] : [...(question.media ?? [])];
		if (files.length > max - keep.length) {
			mediaError = `Für „${mediaKindLabel[kind]}“ sind maximal ${max} Dateien möglich.`;
			return;
		}
		const tooBig = files.find((file) => file.size > MAX_MEDIA_BYTES);
		if (tooBig) {
			mediaError = `${tooBig.name} ist zu groß (max. 2 MB pro Datei).`;
			return;
		}
		const used = keep.reduce((n, asset) => n + Math.round(asset.src.length * 0.75), 0);
		const added = files.reduce((n, file) => n + file.size, 0);
		if (used + added > MAX_MEDIA_TOTAL) {
			mediaError = 'Max. 3 MB pro Frage – Dateien werden als Data-URL im Browser gespeichert.';
			return;
		}
		Promise.all(files.map(readAsDataUrl))
			.then((urls) => {
				if (question.type !== 'image') return;
				question.media = [
					...keep,
					...files.map((file, i) => ({
						id: uid(),
						name: file.name,
						mime: file.type,
						src: urls[i]
					}))
				];
				syncLegacyImage();
				// Ein neues Bild macht die alten Polygon-Koordinaten ungültig.
				question.clickPolygon = [];
				question.clickImageUrl = undefined;
			})
			.catch(() => (mediaError = 'Die Datei konnte nicht gelesen werden.'));
	}

	function removeMedia(id: string) {
		if (question.type !== 'image') return;
		if (!question.media || question.media.length === 0) question.image = undefined;
		else question.media = question.media.filter((asset) => asset.id !== id);
		syncLegacyImage();
		question.clickPolygon = [];
		question.clickImageUrl = undefined;
		mediaError = '';
	}

	function clearMedia() {
		if (question.type !== 'image') return;
		question.media = [];
		question.image = undefined;
		question.clickImageUrl = undefined;
		question.clickPolygon = [];
		mediaError = '';
	}

	function addOption() {
		if (question.type !== 'mc' && question.type !== 'image') return;
		question.options = [
			...(question.options ?? []),
			{ id: uid(), text: '', correct: false }
		];
	}

	function removeOption(id: string) {
		if (question.type !== 'mc' && question.type !== 'image') return;
		question.options = (question.options ?? []).filter((option) => option.id !== id);
	}

	function setSingleCorrect(id: string) {
		if (question.type !== 'mc' && question.type !== 'image') return;
		(question.options ?? []).forEach((option) => (option.correct = option.id === id));
	}

	function toggleCorrect(id: string) {
		if (question.type !== 'mc') return;
		const option = question.options.find((o) => o.id === id);
		if (option) option.correct = !option.correct;
	}

</script>

<div class="space-y-3">
	<div>
		<label class="lbl" for="q-prompt">Frage</label>
		<textarea id="q-prompt" class="inp" rows="2" bind:value={question.prompt}></textarea>
	</div>

	<div>
		<label class="lbl" for="q-exp">Erklärung (optional)</label>
		<textarea id="q-exp" class="inp" rows="2" bind:value={question.explanation}></textarea>
	</div>

	{#if question.type === 'mc'}
		<div class="space-y-2">
			<p class="lbl">Antwortoptionen</p>
			{#each question.options as option (option.id)}
				<div class="flex items-center gap-2">
					{#if question.multiple}
						<input
							type="checkbox"
							checked={option.correct}
							aria-label="Richtig"
							onchange={() => toggleCorrect(option.id)}
						/>
					{:else}
						<input
							type="radio"
							name={`correct-${question.id}`}
							checked={option.correct}
							aria-label="Richtig"
							onchange={() => setSingleCorrect(option.id)}
						/>
					{/if}
					<input class="inp flex-1" bind:value={option.text} placeholder="Antworttext" />
					<button
						class="rounded-lg p-1 text-ink-500 hover:bg-err-bg hover:text-danger-500"
						aria-label="Option entfernen"
						onclick={() => removeOption(option.id)}
					>
						<Icon name="close" size={18} />
					</button>
				</div>
			{/each}
			<button class="b3" onclick={addOption}><Icon name="add" size={18} />Antwort hinzufügen</button>
			<label class="flex items-center gap-2 text-[13px]">
				<input type="checkbox" bind:checked={question.multiple} />
				Mehrfachauswahl erlauben
			</label>
		</div>
	{:else if question.type === 'tf'}
		<div>
			<p class="lbl">Aussage ist</p>
			<div class="inline-flex overflow-hidden rounded-xl border border-sand-200">
				<button
					class="px-4 py-2 text-[14px] font-semibold {question.correct
						? 'bg-brand-600 text-white'
						: 'bg-white text-ink-700 hover:bg-sand-50'}"
					onclick={() => (question.correct = true)}
				>
					Richtig
				</button>
				<button
					class="px-4 py-2 text-[14px] font-semibold {!question.correct
						? 'bg-brand-600 text-white'
						: 'bg-white text-ink-700 hover:bg-sand-50'}"
					onclick={() => (question.correct = false)}
				>
					Falsch
				</button>
			</div>
		</div>
	{:else if question.type === 'image'}
		<div class="space-y-2">
			<div>
				<label class="lbl" for="q-media-kind">Medium</label>
				<select
					id="q-media-kind"
					class="inp"
					value={currentKind}
					onchange={(e) => setMediaKind(e.currentTarget.value)}
				>
					{#each mediaKindOptions as kind (kind)}
						<option value={kind}>{mediaKindLabel[kind]}</option>
					{/each}
				</select>
				<p class="mt-1 text-[12px] text-ink-500">{mediaKindHint[currentKind]}</p>
			</div>

			<div class="flex flex-wrap items-center gap-2">
				<label class="flex items-center gap-2 rounded-xl border border-sand-200 bg-sand-50 p-3 cursor-pointer">
					<Icon name={mediaIcon[currentKind]} class="text-ink-500" />
					<span>{uploadLabel}</span>
					<input
						id="q-media-file"
						type="file"
						accept={mediaAccept[currentKind]}
						multiple={mediaMaxFiles[currentKind] > 1}
						class="hidden"
						onchange={handleMedia}
					/>
				</label>
				{#if assets.length > 0}
					<button class="b3" onclick={clearMedia}>Medium entfernen</button>
				{/if}
				<span class="text-[12px] text-ink-500">
					{assets.length}{mediaMaxFiles[currentKind] > 1 ? ` / ${mediaMaxFiles[currentKind]}` : ''}
					Datei{assets.length === 1 ? '' : 'en'}
				</span>
			</div>
			{#if mediaError}
				<p class="text-[12px] text-danger-500" role="alert">{mediaError}</p>
			{/if}
			<p class="text-[12px] text-ink-500">
				Max. 2 MB pro Datei, 3 MB pro Frage. Dateien werden als Data-URL direkt im Quiz
				gespeichert – bitte kurze Videos und Audios verwenden. Das Wechseln auf eine andere
				Medienart entfernt bisherige Dateien.
			</p>

			{#if assets.length > 0}
				<span class="bdg">{mediaKindLabel[currentKind]}</span>
				{#if currentKind === 'video'}
					<video class="max-h-56 w-full rounded-lg bg-black" controls src={withBase(assets[0].src)}>
						<track kind="captions" />
					</video>
					<p class="text-[12px] text-ink-500">{assets[0].name}</p>
				{:else if currentKind === 'audio'}
					<div class="rounded-xl border border-sand-200 bg-sand-50 p-3">
						<p class="mb-2 truncate text-[13px] font-semibold">{assets[0].name}</p>
						<audio class="w-full" controls src={withBase(assets[0].src)}></audio>
					</div>
				{:else}
					<div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
						{#each assets as asset (asset.id)}
							<div class="relative">
								{#if asset.mime.startsWith('image/')}
									<img
										src={withBase(asset.src)}
										alt={asset.name}
										class="h-24 w-full rounded-lg border border-sand-200 bg-white object-contain"
									/>
								{:else}
									<div class="grid h-24 place-items-center rounded-lg border border-sand-200 bg-white text-4xl">
										{asset.src}
									</div>
								{/if}
								<button
									class="absolute top-1 right-1 rounded-full bg-err-bg p-1 hover:bg-danger-500 hover:text-white transition"
									aria-label={`${asset.name} entfernen`}
									onclick={() => removeMedia(asset.id)}
								>
									<Icon name="close" size={14} />
								</button>
								<p class="truncate text-[11px] text-ink-500">{asset.name}</p>
							</div>
						{/each}
					</div>
				{/if}
			{/if}
		</div>

		<div>
			<p class="lbl">Antwortmodus</p>
			<div class="inline-flex overflow-hidden rounded-xl border border-sand-200">
				<button
					class="px-4 py-2 text-[14px] font-semibold {question.mode === 'choice'
						? 'bg-brand-600 text-white'
						: 'bg-white text-ink-700 hover:bg-sand-50'}"
					onclick={() => (question.mode = 'choice')}
				>
					Auswahl
				</button>
				<button
					class="px-4 py-2 text-[14px] font-semibold {question.mode === 'input'
						? 'bg-brand-600 text-white'
						: 'bg-white text-ink-700 hover:bg-sand-50'}"
					onclick={() => (question.mode = 'input')}
				>
					Eingabe
				</button>
				<button
					class="px-4 py-2 text-[14px] font-semibold disabled:cursor-not-allowed disabled:opacity-50 {question.mode === 'click'
						? 'bg-brand-600 text-white'
						: 'bg-white text-ink-700 hover:bg-sand-50'}"
					disabled={!polygonAllowed}
					title={polygonAllowed
						? 'Polygon auf dem Bild zeichnen'
						: 'Klick-Bereich ist nur bei Bildern und Infografiken möglich'}
					onclick={() => {
						question.mode = 'click';
						if (!question.clickPolygon) question.clickPolygon = [];
						if (!question.clickInstruction) question.clickInstruction = '';
					}}
				>
					Klick-Bereich
				</button>
			</div>
			{#if !polygonAllowed}
				<p class="mt-1 text-[12px] text-amber-500">
					Die Position im Polygon lässt sich nur bei Bildern und Infografiken bestimmen.
				</p>
			{/if}
		</div>

		{#if question.mode === 'choice'}
			<div class="space-y-2">
				{#each question.options ?? [] as option (option.id)}
					<div class="flex items-center gap-2">
						<input
							type="radio"
							name={`correct-${question.id}`}
							checked={option.correct}
							aria-label="Richtig"
							onchange={() => setSingleCorrect(option.id)}
						/>
						<input class="inp flex-1" bind:value={option.text} placeholder="Antworttext" />
						<button
							class="rounded-lg p-1 text-ink-500 hover:bg-err-bg hover:text-danger-500"
							aria-label="Option entfernen"
							onclick={() => removeOption(option.id)}
						>
							<Icon name="close" size={18} />
						</button>
					</div>
				{/each}
				<button class="b3" onclick={addOption}>
					<Icon name="add" size={18} />Antwort hinzufügen
				</button>
			</div>
		{:else if question.mode === 'input'}
			<div class="grid gap-2 sm:grid-cols-[1fr_auto]">
				<div>
					<label class="lbl" for="q-answer">Korrekte Antwort</label>
					<input id="q-answer" class="inp" bind:value={question.answer} />
				</div>
				<div>
					<label class="lbl" for="q-tol">Toleranz</label>
					<select id="q-tol" class="inp" bind:value={question.tolerance}>
						<option value="loose">Großzügig</option>
						<option value="exact">Exakt</option>
					</select>
				</div>
			</div>
		{:else if question.mode === 'click'}
			{#if polygonAllowed}
				<ImageHotspotEditor {question} />
			{:else}
				<p class="text-[12px] text-amber-500">
					Klick-Bereich ist nur bei Bildern und Infografiken möglich.
				</p>
			{/if}
		{/if}
	{:else if question.type === 'match'}
		<MatchConnectionsEditor {question} />
	{/if}

	<div class="max-w-32">
		<label class="lbl" for="q-points">Punkte</label>
		<input id="q-points" class="inp" type="number" min="0" bind:value={question.points} />
	</div>
</div>
