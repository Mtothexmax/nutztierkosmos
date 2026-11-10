<script lang="ts">
	import { i18n, t, tr } from '$lib/i18n.svelte';
	import type { Infographic } from '$lib/types';

	let { graphic }: { graphic: Infographic } = $props();

	let bars = $derived(graphic.bars ?? []);
	let max = $derived(Math.max(1, ...bars.map((b) => b.value)));
	let selected = $state<string | null>(null);
	let current = $derived(bars.find((b) => b.id === selected));
	const uid = Math.random().toString(36).slice(2, 7);
</script>

<div class="space-y-4">
	<p class="text-[14px] text-ink-500">{t('info.selectBar')}</p>
	<ul class="space-y-2.5" role="list">
		{#each bars as bar, i (bar.id)}
			{@const on = selected === bar.id}
			<li>
				<button
					type="button"
					class="group grid w-full grid-cols-[minmax(7rem,11rem)_1fr_3.5rem] items-center gap-3 rounded-xl p-2 text-left transition hover:bg-sand-50 {on ? 'bg-brand-50' : ''}"
					aria-expanded={on}
					aria-controls="bar-note-{uid}"
					onclick={() => (selected = on ? null : bar.id)}
				>
					<span class="text-[14px] font-medium text-ink-900" lang={i18n.langOf(bar.label)}>{tr(bar.label)}</span>
					<span class="relative h-6 rounded-md bg-sand-100">
						<span
							class="absolute inset-y-0 left-0 rounded-md transition-all duration-500 {on ? 'bg-brand-700' : 'bg-brand-500 group-hover:bg-brand-600'}"
							style:width="{(bar.value / max) * 100}%"
							style:opacity={1 - i * 0.12}
						></span>
					</span>
					<span class="text-right text-[14px] font-semibold text-ink-900 tabular-nums">{bar.value}</span>
				</button>
			</li>
		{/each}
	</ul>
	<div id="bar-note-{uid}" aria-live="polite" class="min-h-[4.5rem] rounded-xl border border-sand-200 bg-white p-4 text-[15px] text-ink-700">
		{#if current}
			<strong class="block text-ink-900" lang={i18n.langOf(current.label)}>{tr(current.label)}: {current.value} {tr(graphic.unit)}</strong>
			<span lang={i18n.langOf(current.note)}>{tr(current.note)}</span>
		{:else}
			<span class="text-ink-500">{tr(graphic.unit)}</span>
		{/if}
	</div>
	<details class="text-[14px]">
		<summary class="cursor-pointer font-medium text-brand-700">{t('info.asTable')}</summary>
		<table class="mt-2 w-full">
			<caption class="sr-only">{tr(graphic.title)}</caption>
			<tbody>
				{#each bars as bar (bar.id)}
					<tr><th scope="row" class="!text-ink-900">{tr(bar.label)}</th><td class="text-right tabular-nums">{bar.value} {tr(graphic.unit)}</td></tr>
				{/each}
			</tbody>
		</table>
	</details>
</div>
