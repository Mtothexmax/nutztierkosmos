<script lang="ts">
	import { i18n } from '$lib/i18n.svelte';
	import type { Locale } from '$lib/types';

	// Wie auf fbn-dummerstorf.de: Es wird nur die jeweils andere Sprache angeboten
	// (kleine Flagge + Kürzel). Der Name steht in der Zielsprache, mit passendem lang-Attribut.
	let { dark = false }: { dark?: boolean } = $props();

	let target = $derived<Locale>(i18n.locale === 'de' ? 'en' : 'de');
	const names: Record<Locale, string> = { de: 'Deutsch', en: 'English' };
</script>

{#if i18n.englishEnabled}
	<button
		type="button"
		lang={target}
		aria-label={names[target]}
		title={names[target]}
		class="inline-flex items-center gap-1.5 rounded-sm px-1.5 py-1 text-[13px] font-semibold tracking-wide transition {dark
			? 'text-white/85 hover:text-white'
			: 'text-ink-500 hover:text-brand-700'}"
		onclick={() => i18n.set(target)}
	>
		{#if target === 'en'}
			<!-- Union Jack, vereinfacht -->
			<svg width="18" height="12" viewBox="0 0 60 40" aria-hidden="true" class="shrink-0 rounded-[1px] ring-1 ring-black/10">
				<clipPath id="uk-clip"><rect width="60" height="40" /></clipPath>
				<g clip-path="url(#uk-clip)">
					<rect width="60" height="40" fill="#012169" />
					<path d="M0,0 60,40 M60,0 0,40" stroke="#fff" stroke-width="8" />
					<path d="M0,0 60,40 M60,0 0,40" stroke="#C8102E" stroke-width="3" />
					<path d="M30,0 V40 M0,20 H60" stroke="#fff" stroke-width="12" />
					<path d="M30,0 V40 M0,20 H60" stroke="#C8102E" stroke-width="7" />
				</g>
			</svg>
		{:else}
			<svg width="18" height="12" viewBox="0 0 5 3" aria-hidden="true" class="shrink-0 rounded-[1px] ring-1 ring-black/10">
				<rect width="5" height="1" fill="#000" />
				<rect y="1" width="5" height="1" fill="#DD0000" />
				<rect y="2" width="5" height="1" fill="#FFCE00" />
			</svg>
		{/if}
		{target.toUpperCase()}
	</button>
{/if}
