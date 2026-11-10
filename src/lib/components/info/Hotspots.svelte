<script lang="ts">
	import { i18n, t, tr } from '$lib/i18n.svelte';
	import { content } from '$lib/stores/content.svelte';
	import type { Infographic } from '$lib/types';

	let { graphic }: { graphic: Infographic } = $props();

	let image = $derived(content.getMedia(graphic.imageId));
	let spots = $derived(graphic.hotspots ?? []);
	let selected = $state<string | null>(null);
	let current = $derived(spots.find((s) => s.id === selected));
</script>

<div class="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
	<div class="media-frame aspect-[16/9]">
		{#if image}
			<img src={image.src} alt={tr(image.alt)} class="h-full w-full object-cover" width="1600" height="900" />
		{/if}
		{#each spots as spot, i (spot.id)}
			{@const on = selected === spot.id}
			<button
				type="button"
				class="absolute grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white text-[14px] font-bold shadow-lg transition {on
					? 'scale-110 bg-ink-900 text-white'
					: 'bg-brand-600 text-white hover:scale-110'}"
				style:left="{spot.x * 100}%"
				style:top="{spot.y * 100}%"
				aria-label="{i + 1}: {tr(spot.title)}"
				aria-pressed={on}
				onclick={() => (selected = on ? null : spot.id)}
			>
				{i + 1}
				{#if !on}<span class="absolute inset-0 animate-ping rounded-full bg-brand-500/40 motion-reduce:hidden"></span>{/if}
			</button>
		{/each}
	</div>
	<div class="space-y-3">
		<ol class="space-y-1.5">
			{#each spots as spot, i (spot.id)}
				{@const on = selected === spot.id}
				<li>
					<button
						type="button"
						class="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-[15px] font-medium transition {on ? 'bg-brand-50 text-brand-700' : 'hover:bg-sand-50'}"
						aria-pressed={on}
						onclick={() => (selected = on ? null : spot.id)}
					>
						<span class="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[13px] font-bold {on ? 'bg-ink-900 text-white' : 'bg-brand-100 text-brand-700'}">{i + 1}</span>
						<span lang={i18n.langOf(spot.title)}>{tr(spot.title)}</span>
					</button>
				</li>
			{/each}
		</ol>
		<div aria-live="polite" class="rounded-xl border border-sand-200 bg-white p-4 text-[15px] text-ink-700">
			{#if current}
				<strong class="block text-ink-900">{tr(current.title)}</strong>
				<span lang={i18n.langOf(current.text)}>{tr(current.text)}</span>
			{:else}
				<span class="text-ink-500">{t('info.tapHotspot')}</span>
			{/if}
		</div>
	</div>
</div>
