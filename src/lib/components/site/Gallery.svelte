<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import { i18n, t, tr } from '$lib/i18n.svelte';
	import type { MediaItem } from '$lib/types';

	let { items, heading }: { items: MediaItem[]; heading?: string } = $props();

	let index = $state(0);
	let current = $derived(items[Math.min(index, items.length - 1)]);

	function go(delta: number) {
		index = (index + delta + items.length) % items.length;
	}

	function onKey(event: KeyboardEvent) {
		if (event.key === 'ArrowRight') go(1);
		if (event.key === 'ArrowLeft') go(-1);
	}
</script>

{#if current}
	<!-- Galerie: Pfeiltasten, Buttons und Miniaturen; Position wird angesagt -->
	<section aria-roledescription="carousel" aria-label={heading ?? 'Galerie'} class="space-y-3">
		<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
		<div class="media-frame aspect-[16/9]" tabindex="0" role="group" aria-roledescription="slide" aria-label={t('media.imageOf', { i: index + 1, n: items.length })} onkeydown={onKey}>
			<img src={current.src} alt={tr(current.alt)} lang={i18n.langOf(current.alt)} class="h-full w-full object-cover" width="1600" height="900" />
			<div class="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/55 to-transparent p-3">
				<button type="button" class="grid h-10 w-10 place-items-center rounded-full bg-white/95 text-ink-900 hover:bg-white" aria-label={t('media.prev')} onclick={() => go(-1)}>
					<Icon name="chevron_left" />
				</button>
				<span class="rounded-full bg-black/50 px-3 py-1 text-[13px] font-medium text-white" aria-live="polite">{index + 1} / {items.length}</span>
				<button type="button" class="grid h-10 w-10 place-items-center rounded-full bg-white/95 text-ink-900 hover:bg-white" aria-label={t('media.next')} onclick={() => go(1)}>
					<Icon name="chevron_right" />
				</button>
			</div>
		</div>
		<p class="text-[14px] text-ink-500" lang={i18n.langOf(current.title)}>{tr(current.title)}{#if current.credit} · {current.credit}{/if}</p>
		<div class="flex gap-2 overflow-x-auto pb-1">
			{#each items as item, i (item.id)}
				<button
					type="button"
					class="h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition {i === index ? 'border-brand-600' : 'border-transparent opacity-75 hover:opacity-100'}"
					aria-label={t('media.imageOf', { i: i + 1, n: items.length }) + ': ' + tr(item.title)}
					aria-current={i === index ? 'true' : undefined}
					onclick={() => (index = i)}
				>
					<img src={item.src} alt="" class="h-full w-full object-cover" width="96" height="64" />
				</button>
			{/each}
		</div>
	</section>
{/if}
