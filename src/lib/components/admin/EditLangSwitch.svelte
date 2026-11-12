<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import type { Locale } from '$lib/types';
	import type { EditLang } from './edit-lang.svelte';

	/**
	 * Umschalter „Texte bearbeiten in: Deutsch | Englisch“ für Quiz- und Spiele-Editor.
	 * Einstellungen wie Punkte, richtige Antworten oder Medien gelten für beide Sprachen.
	 */
	let {
		lang,
		progress,
		note
	}: {
		lang: EditLang;
		/** Stand der englischen Texte (gezählt werden Texte mit deutschem Inhalt). */
		progress?: { done: number; total: number };
		note?: string;
	} = $props();

	const options: { value: Locale; label: string }[] = [
		{ value: 'de', label: 'Deutsch' },
		{ value: 'en', label: 'Englisch' }
	];

	let complete = $derived(progress ? progress.total > 0 && progress.done === progress.total : false);
</script>

<div class="flex flex-wrap items-center gap-3 rounded-xl border border-sand-200 bg-white px-3 py-2">
	<span class="flex items-center gap-1.5 text-[13px] font-semibold text-ink-700" id="edit-lang-label">
		<Icon name="translate" size={18} class="text-ink-500" />Texte bearbeiten in
	</span>
	<div class="inline-flex overflow-hidden rounded-xl border border-sand-200" role="radiogroup" aria-labelledby="edit-lang-label">
		{#each options as option (option.value)}
			<button
				type="button"
				role="radio"
				aria-checked={lang.locale === option.value}
				class="px-3 py-1.5 text-[13px] font-semibold {lang.locale === option.value
					? 'bg-brand-600 text-white'
					: 'bg-white text-ink-700 hover:bg-sand-50'}"
				onclick={() => (lang.locale = option.value)}
			>
				<span class="mr-1 rounded bg-black/10 px-1 text-[11px]">{option.value.toUpperCase()}</span>{option.label}
			</button>
		{/each}
	</div>
	{#if progress}
		<span class="text-[13px] {complete ? 'text-brand-600' : 'text-sky-500'}">
			{#if complete}
				<Icon name="check_circle" size={16} /> Englisch vollständig
			{:else}
				Englisch: {progress.done} von {progress.total} Texten
			{/if}
		</span>
	{/if}
	{#if note}<span class="w-full text-[12px] text-ink-500 sm:ml-auto sm:w-auto">{note}</span>{/if}
</div>
