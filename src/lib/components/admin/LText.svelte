<script lang="ts">
	import type { L10n } from '$lib/types';
	import { useEditLang } from './edit-lang.svelte';

	/**
	 * Eingabefeld für einen zweisprachigen Text. Bearbeitet wird die Sprache, die im Editor
	 * oben umgeschaltet ist. Auf Englisch steht der deutsche Text als Vorlage darunter.
	 */
	let {
		value = $bindable(),
		id,
		label,
		ariaLabel,
		placeholder = '',
		multiline = false,
		rows = 2,
		class: cls = '',
		compact = false,
		autofocus = false,
		onkeydown
	}: {
		value?: L10n;
		id?: string;
		label?: string;
		ariaLabel?: string;
		placeholder?: string;
		multiline?: boolean;
		rows?: number;
		class?: string;
		/** Ohne Vorlage-Zeile, z. B. für kurze Antworten in Listen (Vorlage dann als Platzhalter). */
		compact?: boolean;
		autofocus?: boolean;
		onkeydown?: (event: KeyboardEvent) => void;
	} = $props();

	const lang = useEditLang();

	// Ältere Daten können ein fehlendes optionales Feld haben.
	if (!value) value = { de: '', en: '' };

	const getText = () => (lang.locale === 'en' ? value?.en : value?.de) ?? '';
	function setText(next: string) {
		if (!value) value = { de: '', en: '' };
		if (lang.locale === 'en') value.en = next;
		else value.de = next;
	}

	let german = $derived(value?.de?.trim() ?? '');
	let missing = $derived(lang.locale === 'en' && Boolean(german) && !value?.en?.trim());
	let hint = $derived(lang.locale === 'en' && compact && german ? german : placeholder);

	function focus(node: HTMLElement) {
		if (autofocus) node.focus();
	}
</script>

<div class={cls}>
	{#if label}
		<label class="lbl flex items-center gap-1.5" for={id}>
			{label}
			<span class="rounded bg-sand-100 px-1.5 text-[11px] font-semibold text-ink-500">{lang.locale.toUpperCase()}</span>
			{#if missing}<span class="rounded bg-sky-500/10 px-1.5 text-[11px] font-semibold text-sky-500">fehlt</span>{/if}
		</label>
	{/if}
	{#if multiline}
		<textarea
			{id}
			class="inp"
			class:ntk-missing={missing}
			{rows}
			lang={lang.locale}
			placeholder={hint}
			aria-label={label ? undefined : ariaLabel}
			bind:value={getText, setText}
			{onkeydown}
			use:focus
		></textarea>
	{:else}
		<input
			{id}
			class="inp"
			class:ntk-missing={missing}
			lang={lang.locale}
			placeholder={hint}
			aria-label={label ? undefined : ariaLabel}
			bind:value={getText, setText}
			{onkeydown}
			use:focus
		/>
	{/if}
	{#if lang.locale === 'en' && german && !compact}
		<p class="mt-1 truncate text-[12px] text-ink-500" lang="de" title={german}>
			<span class="font-semibold">DE:</span> {german}
		</p>
	{/if}
</div>

<style>
	.ntk-missing {
		border-color: var(--color-sky-500, #3b82f6);
		border-style: dashed;
	}
</style>
