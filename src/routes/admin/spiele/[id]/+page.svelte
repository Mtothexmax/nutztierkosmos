<script lang="ts">
	import { beforeNavigate, goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { GameBridge } from '$lib/bridge/bridge.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { skillPrompt } from '$lib/games/api-docs';
	import {
		bundleGame,
		entryFile,
		fileDataUrl,
		formatBytes,
		readZipPackage
	} from '$lib/games/files';
	import { content } from '$lib/stores/content.svelte';
	import { session } from '$lib/stores/session.svelte';
	import { toasts } from '$lib/stores/toast.svelte';
	import type { Game, GameFile } from '$lib/types';

	let gameId = page.params.id ?? '';
	const existing = content.getGame(gameId);
	let draft = $state<Game | null>(existing ? structuredClone($state.snapshot(existing)) : null);

	let step = $state<'basics' | 'content'>(
		page.url.searchParams.get('step') === 'content' ? 'content' : 'basics'
	);
	let previewSource = $state(draft ? bundleGame(draft) : '');
	let previewKey = $state(0);
	let iframe = $state<HTMLIFrameElement>();
	let device = $state<'desktop' | 'tablet' | 'mobile'>('desktop');
	let selectedPath = $state(entryFile(draft?.files ?? [])?.path ?? draft?.files[0]?.path ?? '');
	let zipInput = $state<HTMLInputElement>();
	let dragging = $state(false);
	let uploadError = $state('');
	let blockedFiles = $state<string[]>([]);
	let totalBytes = $state(draft?.files.reduce((sum, file) => sum + file.size, 0) ?? 0);
	let savedAt = $state<string | null>(null);
	let deleteOpen = $state(false);
	let leaveOpen = $state(false);
	let pendingHref = $state<string | null>(null);
	let initialJson = $state(existing ? JSON.stringify($state.snapshot(existing)) : '');
	let allowLeave = false;
	let bridge = new GameBridge();

	let dirty = $derived(draft ? JSON.stringify($state.snapshot(draft)) !== initialJson : false);
	let selectedFile = $derived(draft?.files.find((file) => file.path === selectedPath));
	let entry = $derived(draft ? entryFile(draft.files) : null);
	let deviceClass = $derived(
		device === 'desktop'
			? 'w-full'
			: device === 'tablet'
				? 'mx-auto max-w-[720px]'
				: 'mx-auto max-w-[390px]'
	);

	const fileIcon: Record<GameFile['kind'], string> = {
		html: 'html',
		css: 'css',
		js: 'javascript',
		image: 'image',
		audio: 'audiotrack',
		video: 'movie'
	};

	beforeNavigate(({ to, cancel }) => {
		if (!dirty || allowLeave) return;
		cancel();
		pendingHref = to ? to.url.pathname + to.url.search + to.url.hash : null;
		leaveOpen = true;
	});

	onMount(() => {
		const warn = (event: BeforeUnloadEvent) => {
			if (dirty) event.preventDefault();
		};
		window.addEventListener('beforeunload', warn);
		return () => window.removeEventListener('beforeunload', warn);
	});

	$effect(() => {
		return () => bridge.destroy();
	});

	function fileName(path: string): string {
		return path.split('/').at(-1) ?? path;
	}

	function folderDepth(path: string): number {
		return Math.min(path.split('/').length - 1, 4);
	}

	function refreshPreview(notify = false) {
		if (!draft) return;
		previewSource = bundleGame(draft);
		previewKey += 1;
		if (notify) toasts.push('Vorschau aktualisiert', 'info');
	}

	function onPreviewLoad() {
		if (!iframe || !draft) return;
		const player = session.player ?? { id: 'demo', name: 'Redaktion', avatar: '🧑‍💻' };
		bridge.attach(iframe, {
			player: { id: player.id, name: player.name, avatar: player.avatar },
			game: { id: draft.id, title: draft.title, maxPoints: draft.maxPoints }
		});
	}

	async function handleZip(file: File) {
		uploadError = '';
		if (!file.name.toLowerCase().endsWith('.zip')) {
			uploadError = 'Bitte eine ZIP-Datei auswählen.';
			return;
		}
		if (file.size > 8 * 1024 * 1024) {
			uploadError = 'Die ZIP-Datei ist zu groß (max. 8 MB).';
			return;
		}
		if (!draft) return;

		try {
			const result = readZipPackage(await file.arrayBuffer());
			if (!result.files.some((item) => item.kind === 'html')) {
				uploadError = 'Im ZIP fehlt eine HTML-Datei, z. B. index.html.';
				return;
			}
			draft.files = result.files;
			blockedFiles = result.blocked;
			totalBytes = result.totalBytes;
			selectedPath = entryFile(result.files)?.path ?? result.files[0]?.path ?? '';
			refreshPreview();
			toasts.push(`${result.files.length} Dateien übernommen`);
		} catch (error) {
			uploadError = error instanceof Error ? error.message : 'ZIP konnte nicht gelesen werden.';
		}
	}

	async function onFileChange(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (file) await handleZip(file);
		input.value = '';
	}

	async function onDrop(event: DragEvent) {
		event.preventDefault();
		dragging = false;
		const file = event.dataTransfer?.files?.[0];
		if (file) await handleZip(file);
	}

	function removeSelectedFile() {
		if (!draft || !selectedFile) return;
		draft.files = draft.files.filter((file) => file.path !== selectedFile.path);
		selectedPath = entryFile(draft.files)?.path ?? draft.files[0]?.path ?? '';
		totalBytes = draft.files.reduce((sum, file) => sum + file.size, 0);
		refreshPreview();
	}

	function editSelectedFile(value: string) {
		if (!selectedFile) return;
		selectedFile.content = value;
		selectedFile.size = new TextEncoder().encode(value).length;
		totalBytes = draft?.files.reduce((sum, file) => sum + file.size, 0) ?? totalBytes;
	}

	async function copySkill() {
		try {
			await navigator.clipboard.writeText(skillPrompt);
			toasts.push('KI-Skill kopiert');
		} catch {
			toasts.push('Kopieren nicht möglich – bitte in der API-Doku markieren', 'error');
		}
	}

	function save(): boolean {
		if (!draft) return false;
		const snapshot = structuredClone($state.snapshot(draft));
		initialJson = JSON.stringify(snapshot);
		const ok = content.updateGame(snapshot);
		if (!ok) {
			toasts.push('Speichern fehlgeschlagen – Browser-Speicher voll', 'error');
			return false;
		}
		savedAt = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
		toasts.push('Spiel gespeichert');
		return true;
	}

	function saveAndLeave() {
		if (!save()) return;
		allowLeave = true;
		leaveOpen = false;
		goto(pendingHref ?? '/admin/spiele');
	}

	function discardAndLeave() {
		allowLeave = true;
		leaveOpen = false;
		goto(pendingHref ?? '/admin/spiele');
	}

	function removeGame() {
		content.deleteGame(gameId);
		toasts.push('Spiel gelöscht', 'info');
		allowLeave = true;
		goto('/admin/spiele');
	}
</script>

<svelte:head><title>Spiel-Editor · CMS</title></svelte:head>

{#if !draft}
	<main class="mx-auto max-w-3xl p-8">
		<div class="card text-center">
			<p class="mb-4">Dieses Spiel gibt es nicht (mehr).</p>
			<a class="b1" href="/admin/spiele">Zur Spiele-Liste</a>
		</div>
	</main>
{:else}
	<div class="mb-4 flex flex-wrap items-center gap-2">
		<a class="b3 !p-2" href="/admin/spiele" aria-label="Zurück zur Spiele-Liste">
			<Icon name="arrow_back" />
		</a>
		<div class="flex-1">
			<h1 class="font-serif text-xl font-bold text-brand-700">{draft.title || 'Ohne Titel'}</h1>
			<p class="text-[13px] text-ink-500">
				{draft.files.length} Dateien · {formatBytes(totalBytes)} · max. {draft.maxPoints} Punkte
			</p>
		</div>
		<a class="b2" href={`/spielen/${gameId}?from=admin`} target="_blank" rel="noreferrer">
			Im Spielerbereich öffnen
		</a>
	</div>

	<div class="mb-4 flex flex-wrap items-center gap-2">
		<button
			class="flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-[13px] transition {step ===
			'basics'
				? 'border-brand-500 bg-brand-50 text-brand-700'
				: 'border-sand-200 bg-white text-ink-500 hover:border-brand-500'}"
			onclick={() => (step = 'basics')}
		>
			<span class="grid h-6 w-6 place-items-center rounded-full bg-brand-600 text-[12px] font-bold text-white"
				>1</span
			>
			Grundeinstellungen
		</button>
		<Icon name="chevron_right" class="text-ink-500" size={18} />
		<button
			class="flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-[13px] transition {step ===
			'content'
				? 'border-brand-500 bg-brand-50 text-brand-700'
				: 'border-sand-200 bg-white text-ink-500 hover:border-brand-500'}"
			onclick={() => (step = 'content')}
		>
			<span class="grid h-6 w-6 place-items-center rounded-full bg-brand-600 text-[12px] font-bold text-white"
				>2</span
			>
			Dateien &amp; Vorschau ({draft.files.length})
		</button>
		<span class="ml-auto text-[13px] {dirty ? 'text-amber-700' : 'text-brand-600'}">
			{dirty ? 'Nicht gespeichert' : savedAt ? `Gespeichert ${savedAt}` : 'Keine Änderungen'}
		</span>
	</div>

	{#if step === 'basics'}
		<div class="grid gap-4 lg:grid-cols-[1fr_320px]">
			<div class="card space-y-3">
				<h2 class="font-serif text-xl font-semibold text-brand-700">Grundeinstellungen</h2>

				<div>
					<label class="lbl" for="game-title">Titel</label>
					<input id="game-title" class="inp" bind:value={draft.title} />
				</div>

				<div>
					<label class="lbl" for="game-module">Modul</label>
					<select id="game-module" class="inp" bind:value={draft.moduleId}>
						{#each content.modules as module (module.id)}
							<option value={module.id}>{module.title}</option>
						{/each}
					</select>
				</div>

				<div>
					<label class="lbl" for="game-desc">Beschreibung</label>
					<textarea id="game-desc" class="inp" rows="3" bind:value={draft.description}></textarea>
				</div>

				<p class="rounded-xl bg-brand-50 p-3 text-[13px] text-ink-700">
					Im zweiten Schritt lädst du das komplette ZIP-Paket hoch und siehst die Dateien im
					Explorer. Das Spiel läuft isoliert im iframe.
				</p>
			</div>

			<div class="card space-y-3">
				<div>
					<label class="lbl" for="game-points">Max. Punkte</label>
					<input id="game-points" class="inp" type="number" min="0" bind:value={draft.maxPoints} />
				</div>

				<span class="bdg">API v1</span>

				<label class="flex items-center gap-2">
					<input type="checkbox" bind:checked={draft.published} />
					Veröffentlicht
				</label>

				<a class="b2 w-full" href="/admin/api" target="_blank">
					API-Doku &amp; KI-Skill
				</a>

				<button class="b3 w-full !text-danger-500" onclick={() => (deleteOpen = true)}>
					Spiel löschen
				</button>
			</div>
		</div>

		<div class="mt-4 flex flex-wrap items-center gap-2 border-t border-sand-200 pt-3">
			<a class="b3" href="/admin/spiele">Abbrechen</a>
			<button class="b2" onclick={save}>Speichern</button>
			<button class="b1" onclick={() => (step = 'content')}>Weiter zu Dateien &amp; Vorschau</button>
			<span class="ml-auto text-[13px] text-ink-500">Schritt 1 von 2</span>
		</div>
	{:else}
		<div class="grid gap-4 xl:grid-cols-[340px_1fr]">
			<div class="space-y-3">
				<div class="card space-y-2">
					<div class="flex items-center justify-between gap-2">
						<h2 class="font-serif text-xl font-semibold text-brand-700">ZIP-Paket</h2>
						<span class="bdg">{formatBytes(totalBytes)}</span>
					</div>

					<div
						class="grid place-items-center rounded-xl border-2 border-dashed p-5 text-center transition {dragging
							? 'border-brand-500 bg-brand-50'
							: 'border-sand-200'} text-ink-500"
						role="button"
						tabindex="0"
						onclick={() => zipInput?.click()}
						onkeydown={(e) => e.key === 'Enter' && zipInput?.click()}
						ondragover={(e) => (e.preventDefault(), (dragging = true))}
						ondragleave={() => (dragging = false)}
						ondrop={onDrop}
					>
						<Icon name="folder_zip" size={40} class="text-brand-600" />
						<p class="mt-1 font-medium text-brand-700">
							{draft.files.length ? 'ZIP ersetzen' : 'ZIP hochladen'}
						</p>
						<small>oder hierher ziehen · max. 2,5 MB entpackt</small>
					</div>
					<input
						bind:this={zipInput}
						type="file"
						accept=".zip,application/zip,application/x-zip-compressed"
						class="hidden"
						onchange={onFileChange}
					/>

					{#if uploadError}
						<p class="rounded-lg bg-err-bg p-2 text-[13px] text-danger-500" role="alert">
							{uploadError}
						</p>
					{/if}

					<p class="text-[12px] text-ink-500">
						Erlaubt: HTML, CSS, JS, Bilder, Audio und Video. Alle anderen Dateien werden aus
						Sicherheitsgründen nicht übernommen.
					</p>

					{#if blockedFiles.length}
						<details class="rounded-lg bg-amber-500/10 p-2 text-[12px] text-ink-700">
							<summary class="cursor-pointer font-medium">
								{blockedFiles.length} Dateien nicht übernommen
							</summary>
							<ul class="mt-1 list-disc pl-5 font-mono">
								{#each blockedFiles as path (path)}
									<li>{path}</li>
								{/each}
							</ul>
						</details>
					{/if}
				</div>

				<div class="card !p-0">
					<div class="flex items-center justify-between gap-2 border-b border-sand-200 p-3">
						<b>Explorer</b>
						<span class="text-[13px] text-ink-500">{draft.files.length} Dateien</span>
					</div>
					<ul class="max-h-[380px] overflow-auto p-1">
						{#each draft.files as file (file.path)}
							<li>
								<button
									class="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] transition {file.path ===
									selectedPath
										? 'bg-brand-100 text-brand-700'
										: 'hover:bg-sand-100'}"
									style:padding-left="{0.5 + folderDepth(file.path) * 0.9}rem"
									onclick={() => (selectedPath = file.path)}
								>
									<Icon name={fileIcon[file.kind]} size={18} />
									<span class="flex-1 truncate font-mono">{fileName(file.path)}</span>
									{#if entry?.path === file.path}
										<span class="bdg !px-2 !py-0 !text-[10px]">Start</span>
									{/if}
									<small class="text-ink-500">{formatBytes(file.size)}</small>
								</button>
							</li>
						{/each}
					</ul>
					{#if draft.files.length === 0}
						<p class="p-6 text-center text-[13px] text-ink-500">
							Noch keine Dateien. Lade oben ein ZIP-Paket hoch.
						</p>
					{/if}
				</div>
			</div>

			<div class="space-y-3">
				<div class="card space-y-2">
					<div class="flex flex-wrap items-center gap-2">
						<Icon name={selectedFile ? fileIcon[selectedFile.kind] : 'draft'} class="text-brand-600" />
						<code class="flex-1 truncate text-[13px]">{selectedFile?.path ?? 'Keine Datei ausgewählt'}</code>
						{#if selectedFile}
							<span class="bdg">{selectedFile.kind.toUpperCase()}</span>
							<span class="text-[12px] text-ink-500">{formatBytes(selectedFile.size)}</span>
							<button
								class="b3 !py-1 !text-danger-500"
								onclick={removeSelectedFile}
								disabled={draft.files.length <= 1}
							>
								Datei löschen
							</button>
						{/if}
					</div>

					{#if selectedFile}
						{#if selectedFile.encoding === 'utf8' && selectedFile.kind !== 'image'}
							<textarea
								class="h-[320px] w-full rounded-xl border border-sand-200 bg-[#0E1A15] p-3 font-mono text-[12px] leading-5 text-gray-300 focus:ring-2 focus:ring-brand-500 focus:outline-none"
								spellcheck="false"
								aria-label={`Inhalt von ${selectedFile.path} bearbeiten`}
								value={selectedFile.content}
								oninput={(e) => editSelectedFile(e.currentTarget.value)}
							></textarea>
							<p class="text-[12px] text-ink-500">
								Nach dem Bearbeiten „Vorschau aktualisieren“ klicken und speichern.
							</p>
						{:else if selectedFile.kind === 'image'}
							<div class="grid place-items-center rounded-xl bg-sand-100 p-3">
								<img
									src={fileDataUrl(selectedFile)}
									alt={selectedFile.path}
									class="max-h-[300px] max-w-full rounded-lg"
								/>
							</div>
						{:else if selectedFile.kind === 'audio'}
							<audio class="w-full" controls src={fileDataUrl(selectedFile)}></audio>
						{:else if selectedFile.kind === 'video'}
							<video class="max-h-[320px] w-full rounded-lg" controls src={fileDataUrl(selectedFile)}>
								<track kind="captions" label="Untertitel" />
							</video>
						{/if}
					{:else}
						<p class="py-8 text-center text-ink-500">Wähle links eine Datei aus.</p>
					{/if}
				</div>

				<div class="card space-y-2">
					<div class="flex flex-wrap items-center gap-2">
						<h2 class="flex-1 font-serif text-xl font-semibold text-brand-700">Live-Vorschau</h2>
						{#each ['desktop', 'tablet', 'mobile'] as option (option)}
							<button
								class="bdg {device === option ? '' : '!bg-sand-100 !text-ink-700'}"
								onclick={() => (device = option as typeof device)}
							>
								{option === 'desktop' ? 'Desktop' : option === 'tablet' ? 'Tablet' : 'Mobil'}
							</button>
						{/each}
						<button class="b2" onclick={() => refreshPreview(true)}>Vorschau aktualisieren</button>
					</div>

					<div class="overflow-hidden rounded-2xl border border-sand-200 bg-[#F1F8F4] p-2">
						{#key previewKey}
							<iframe
								bind:this={iframe}
								title="Spiel-Vorschau"
								srcdoc={previewSource}
								sandbox="allow-scripts allow-forms allow-popups"
								class="aspect-video {deviceClass} rounded-xl border-0 bg-white"
								onload={onPreviewLoad}
							></iframe>
						{/key}
					</div>

					<div class="rounded-2xl bg-brand-900 p-3 text-white/90">
						<div class="flex flex-wrap items-center justify-between gap-2 text-sm">
							<b>Bridge-Konsole</b>
							<span class="text-[12px] {bridge.connected ? 'text-lime-500' : 'text-amber-500'}">
								● {bridge.connected ? 'verbunden' : 'warte auf READY'}
							</span>
						</div>
						<div class="mt-2 h-40 overflow-auto rounded-lg bg-black/20 p-2">
							{#if bridge.log.length === 0}
								<p class="font-mono text-[11px] text-white/60">Noch keine Nachrichten.</p>
							{:else}
								{#each bridge.log as logEntry (logEntry.id)}
									<p class="font-mono text-[11px] leading-4">
										<span class="text-white/60">{logEntry.time}</span>
										<span class="text-lime-500">{logEntry.direction}</span>
										<span class="text-amber-500">{logEntry.type}</span>
										<span class="text-white/70">{logEntry.detail}</span>
									</p>
								{/each}
							{/if}
						</div>
						<div class="mt-2 flex flex-wrap gap-1">
							<button class="b2 !py-1" onclick={() => bridge.sendInit()}>INIT erneut senden</button>
							<button class="b2 !py-1" onclick={() => bridge.simulate('SCORE')}>Test-SCORE</button>
						</div>
					</div>

					{#if !bridge.connected}
						<div class="rounded-xl border border-amber-500 bg-amber-500/10 p-3 text-[13px]">
							Kein READY vom Spiel. Prüfe, ob das Bridge-Skript eingebunden ist.
						</div>
					{/if}
				</div>

				<div class="card flex flex-wrap items-center gap-2">
					<Icon name="terminal" class="text-brand-600" />
					<div class="min-w-0 flex-1 text-[13px]">
						<b>API v1:</b> INIT, PAUSE, RESUME, RESET → Spiel; READY, SCORE, COMPLETE → Plattform.
					</div>
					<a class="b3" href="/admin/api" target="_blank">API-Doku</a>
					<button class="b2" onclick={copySkill}>KI-Skill kopieren</button>
				</div>
			</div>
		</div>

		<div class="mt-4 flex flex-wrap items-center gap-2 border-t border-sand-200 pt-3">
			<button class="b3" onclick={() => (step = 'basics')}>
				<Icon name="arrow_back" size={18} />Einstellungen
			</button>
			<a class="b3" href="/admin/spiele">Abbrechen</a>
			<button class="b1" onclick={save}>Änderungen speichern</button>
			<span class="ml-auto text-[13px] text-ink-500">Schritt 2 von 2</span>
		</div>
	{/if}

	{#if leaveOpen}
		<div
			class="fixed inset-0 z-40 grid place-items-center bg-ink-900/50 p-4"
			role="dialog"
			aria-modal="true"
			aria-labelledby="leave-game-title"
		>
			<div class="card w-full max-w-[440px] space-y-3">
				<span class="grid h-12 w-12 place-items-center rounded-full bg-amber-500/15 text-amber-500">
					<Icon name="warning" />
				</span>
				<h2 id="leave-game-title" class="font-serif text-xl font-semibold">Änderungen verwerfen?</h2>
				<p class="text-[14px] text-ink-500">
					Deine Änderungen am Spiel wurden noch nicht gespeichert.
				</p>
				<div class="flex flex-wrap justify-end gap-2">
					<button class="b3" onclick={() => (leaveOpen = false)}>Weiter bearbeiten</button>
					<button class="b2" onclick={discardAndLeave}>Verwerfen</button>
					<button class="b1" onclick={saveAndLeave}>Speichern &amp; verlassen</button>
				</div>
			</div>
		</div>
	{/if}

	{#if deleteOpen}
		<div
			class="fixed inset-0 z-40 grid place-items-center bg-ink-900/50 p-4"
			role="dialog"
			aria-modal="true"
			aria-labelledby="delete-game-title"
		>
			<div class="card w-full max-w-[420px] space-y-3">
				<span class="grid h-12 w-12 place-items-center rounded-full bg-err-bg text-danger-500">
					<Icon name="delete" />
				</span>
				<h2 id="delete-game-title" class="font-serif text-xl font-semibold">Spiel löschen?</h2>
				<p>„{draft.title}" wird dauerhaft entfernt.</p>
				<div class="flex justify-end gap-2">
					<button class="b3" onclick={() => (deleteOpen = false)}>Abbrechen</button>
					<button class="b4" onclick={removeGame}>Endgültig löschen</button>
				</div>
			</div>
		</div>
	{/if}
{/if}
