<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import { i18n, t, tr } from '$lib/i18n.svelte';
	import type { Infographic } from '$lib/types';
	import BarsChart from './BarsChart.svelte';
	import Hotspots from './Hotspots.svelte';
	import ThiCalculator from './ThiCalculator.svelte';

	let { graphic }: { graphic: Infographic } = $props();

	const icon = { thi: 'thermostat', bars: 'bar_chart', hotspots: 'touch_app' } as const;
</script>

<section class="rounded-3xl border border-sand-200 bg-white p-5 sm:p-7" aria-labelledby="ig-{graphic.id}">
	<div class="mb-5 flex items-start gap-3">
		<span class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700"><Icon name={icon[graphic.kind]} /></span>
		<div>
			<p class="eyebrow">{i18n.active === 'en' ? 'Interactive graphic' : 'Interaktive Grafik'}</p>
			<h3 id="ig-{graphic.id}" class="h3" lang={i18n.langOf(graphic.title)}>{tr(graphic.title)}</h3>
			<p class="mt-1 text-[15px] text-ink-700" lang={i18n.langOf(graphic.description)}>{tr(graphic.description)}</p>
		</div>
	</div>
	{#if graphic.kind === 'thi'}
		<ThiCalculator />
	{:else if graphic.kind === 'bars'}
		<BarsChart {graphic} />
	{:else}
		<Hotspots {graphic} />
	{/if}
	{#if graphic.source}
		<p class="mt-4 text-[12px] text-ink-500">{t('info.source')}: {graphic.source}</p>
	{/if}
</section>
