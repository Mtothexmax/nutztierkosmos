<script lang="ts">
	import { goto } from '$app/navigation';
	import L10nInput from '$lib/components/admin/L10nInput.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { i18n } from '$lib/i18n.svelte';
	import { showReqs } from '$lib/requirements.svelte';
	import { content } from '$lib/stores/content.svelte';
	import { session } from '$lib/stores/session.svelte';
	import { toasts } from '$lib/stores/toast.svelte';
	import type { DownloadPolicy, Settings } from '$lib/types';

	showReqs(['downloads', 'gamification', 'i18n', 'privacy', 'cms-nocode']);

	let draft = $state<Settings>(structuredClone($state.snapshot(content.settings)) as Settings);
	let resetOpen = $state(false);

	const downloadOptions: { id: DownloadPolicy; label: string; text: string }[] = [
		{ id: 'released', label: 'Nur freigegebene Medien', text: 'Download nur, wenn er beim Medium erlaubt ist (Standard).' },
		{ id: 'all', label: 'Alle Medien', text: 'Jedes Medium kann heruntergeladen werden.' },
		{ id: 'none', label: 'Keine Downloads', text: 'Download-Schaltflächen ausblenden. Hinweis: Ein vollständiger Kopierschutz ist im Browser technisch nicht möglich.' }
	];

	function save() {
		content.settings = draft;
		content.persistSettings();
		if (!draft.englishEnabled) i18n.set('de');
		content.log(session.user!.id, 'Einstellungen geändert', `Downloads: ${draft.downloads}, Gamification: ${draft.gamification ? 'an' : 'aus'}, EN: ${draft.englishEnabled ? 'an' : 'aus'}`, 'security');
		toasts.push('Einstellungen gespeichert');
	}

	function resetDemo() {
		content.resetDemo();
		session.logout();
		toasts.push('Demo-Daten zurückgesetzt', 'info');
		goto('/');
	}
</script>

<svelte:head><title>Einstellungen · Redaktion</title></svelte:head>

<div class="max-w-[860px] space-y-5">
	<h1 class="h1">Einstellungen</h1>

	<section class="card space-y-4">
		<h2 class="font-semibold">Allgemein</h2>
		<div>
			<label class="lbl" for="s-name">Name der Plattform</label>
			<input id="s-name" class="inp" bind:value={draft.platformName} />
		</div>
		<L10nInput id="s-sub" label="Untertitel / Leitsatz" bind:value={draft.subtitle} multiline rows={2} />
		<div>
			<label class="lbl" for="s-mail">Kontakt-E-Mail (Barrierefreiheit, Feedback)</label>
			<input id="s-mail" type="email" class="inp" bind:value={draft.contactEmail} />
		</div>
	</section>

	<section class="card space-y-3">
		<h2 class="font-semibold">Sprachen</h2>
		<label class="flex items-start gap-3">
			<input type="checkbox" class="mt-1 h-4 w-4" bind:checked={draft.englishEnabled} />
			<span>Englische Fassung anbieten<span class="block text-[13px] text-ink-500">Blendet den Sprachumschalter ein. Fehlende Übersetzungen werden auf Deutsch mit Hinweis angezeigt.</span></span>
		</label>
	</section>

	<section class="card space-y-3">
		<h2 class="font-semibold">Downloads (restriktive Bereitstellung)</h2>
		<div class="space-y-2" role="radiogroup" aria-label="Download-Regel">
			{#each downloadOptions as o (o.id)}
				<label class="flex items-start gap-3 rounded-xl border p-3 {draft.downloads === o.id ? 'border-brand-600 bg-brand-50' : 'border-sand-200'}">
					<input type="radio" name="downloads" class="mt-1" value={o.id} bind:group={draft.downloads} />
					<span><span class="font-medium">{o.label}</span><span class="block text-[13px] text-ink-500">{o.text}</span></span>
				</label>
			{/each}
		</div>
	</section>

	<section class="card space-y-3">
		<h2 class="font-semibold">Gamification</h2>
		<label class="flex items-start gap-3">
			<input type="checkbox" class="mt-1 h-4 w-4" bind:checked={draft.gamification} />
			<span>Quizze, Spiele und Forscherpass öffentlich anbieten<span class="block text-[13px] text-ink-500">Ausgeschaltet bleiben alle Inhalte vollständig erreichbar – nur die spielerischen Elemente verschwinden.</span></span>
		</label>
		<div class="max-w-xs">
			<label class="lbl" for="s-pts">Standard-Punkte je Frage</label>
			<input id="s-pts" type="number" min="1" class="inp" bind:value={draft.pointsPerAnswer} />
		</div>
	</section>

	<section class="card space-y-3">
		<h2 class="font-semibold">Präsentation</h2>
		<label class="flex items-start gap-3">
			<input type="checkbox" class="mt-1 h-4 w-4" bind:checked={draft.presentationMode} />
			<span>Präsentationsmodus<span class="block text-[13px] text-ink-500">Zeigt unten rechts, welche Anforderungen der Leistungsbeschreibung der aktuelle Screen abdeckt. Für die Vorstellung beim Auftraggeber – im Echtbetrieb aus.</span></span>
		</label>
	</section>

	<div class="flex flex-wrap gap-2">
		<button class="b1" onclick={save}><Icon name="save" size={20} />Speichern</button>
	</div>

	<section class="card space-y-3 border-danger-500/40">
		<h2 class="font-semibold">Demo-Daten</h2>
		<p class="text-[14px] text-ink-500">Löscht alle Änderungen in diesem Browser und lädt die Beispielinhalte neu.</p>
		{#if resetOpen}
			<div class="flex gap-2">
				<button class="b4" onclick={resetDemo}>Jetzt zurücksetzen</button>
				<button class="b3" onclick={() => (resetOpen = false)}>Abbrechen</button>
			</div>
		{:else}
			<button class="b2" onclick={() => (resetOpen = true)}><Icon name="restart_alt" size={20} />Demo-Daten zurücksetzen</button>
		{/if}
	</section>
</div>
