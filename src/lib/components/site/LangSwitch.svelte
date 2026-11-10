<script lang="ts">
	import { i18n, t } from '$lib/i18n.svelte';
	import type { Locale } from '$lib/types';

	let { dark = false }: { dark?: boolean } = $props();

	const options: { id: Locale; short: string; label: 'lang.de' | 'lang.en' }[] = [
		{ id: 'de', short: 'DE', label: 'lang.de' },
		{ id: 'en', short: 'EN', label: 'lang.en' }
	];
</script>

{#if i18n.englishEnabled}
	<div
		role="group"
		aria-label={t('lang.switch')}
		class="inline-flex rounded-full border p-0.5 {dark ? 'border-white/30' : 'border-sand-200 bg-white'}"
	>
		{#each options as option (option.id)}
			{@const on = i18n.locale === option.id}
			<button
				type="button"
				lang={option.id}
				aria-pressed={on}
				aria-label={option.id === 'de' ? 'Deutsch' : 'English'}
				class="min-w-10 rounded-full px-2.5 py-1 text-[13px] font-semibold transition {on
					? dark
						? 'bg-white text-brand-900'
						: 'bg-brand-700 text-white'
					: dark
						? 'text-white/85 hover:text-white'
						: 'text-ink-700 hover:text-brand-700'}"
				onclick={() => i18n.set(option.id)}
			>
				{option.short}
			</button>
		{/each}
	</div>
{/if}
