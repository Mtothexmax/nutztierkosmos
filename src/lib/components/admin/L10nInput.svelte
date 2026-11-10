<script lang="ts">
	import type { L10n } from '$lib/types';

	/**
	 * Zweisprachiges Eingabefeld. Deutsch ist Pflicht, Englisch optional.
	 * Leeres Englisch bedeutet: öffentlich erscheint Deutsch mit Hinweis.
	 */
	let {
		value = $bindable({ de: '', en: '' }),
		id,
		label,
		multiline = false,
		rows = 4,
		required = false,
		hint
	}: {
		value?: L10n;
		id: string;
		label: string;
		multiline?: boolean;
		rows?: number;
		required?: boolean;
		hint?: string;
	} = $props();

	let missingDe = $derived(required && !value.de?.trim());
</script>

<fieldset class="space-y-2">
	<legend class="lbl">{label}{required ? ' *' : ''}</legend>
	<div class="grid gap-2 md:grid-cols-2">
		<div>
			<label for="{id}-de" class="mb-1 flex items-center gap-1 text-[12px] font-semibold text-ink-500"><span class="rounded bg-sand-100 px-1.5">DE</span> Deutsch</label>
			{#if multiline}
				<textarea id="{id}-de" class="inp" {rows} bind:value={value.de} lang="de" aria-invalid={missingDe} aria-describedby={missingDe ? `${id}-err` : undefined}></textarea>
			{:else}
				<input id="{id}-de" class="inp" bind:value={value.de} lang="de" aria-invalid={missingDe} aria-describedby={missingDe ? `${id}-err` : undefined} />
			{/if}
		</div>
		<div>
			<label for="{id}-en" class="mb-1 flex items-center gap-1 text-[12px] font-semibold text-ink-500">
				<span class="rounded bg-sand-100 px-1.5">EN</span> Englisch
				{#if !value.en?.trim()}<span class="ml-auto rounded bg-sky-500/10 px-1.5 text-sky-500">fehlt</span>{/if}
			</label>
			{#if multiline}
				<textarea id="{id}-en" class="inp" {rows} bind:value={value.en} lang="en"></textarea>
			{:else}
				<input id="{id}-en" class="inp" bind:value={value.en} lang="en" />
			{/if}
		</div>
	</div>
	{#if missingDe}<p id="{id}-err" class="text-[13px] text-danger-500">Bitte einen deutschen Text eingeben.</p>{/if}
	{#if hint}<p class="text-[13px] text-ink-500">{hint}</p>{/if}
</fieldset>
