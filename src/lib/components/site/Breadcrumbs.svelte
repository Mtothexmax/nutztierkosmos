<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import { t } from '$lib/i18n.svelte';

	let { items }: { items: { href?: string; label: string }[] } = $props();
</script>

<nav aria-label={t('nav.breadcrumb')}>
	<ol class="flex flex-wrap items-center gap-1 text-[14px] text-ink-500">
		<li><a class="hover:text-brand-700 hover:underline" href="/">{t('nav.home')}</a></li>
		{#each items as item, i (i)}
			<li class="flex items-center gap-1">
				<Icon name="chevron_right" size={16} />
				{#if item.href && i < items.length - 1}
					<a class="hover:text-brand-700 hover:underline" href={item.href}>{item.label}</a>
				{:else}
					<span aria-current="page" class="text-ink-700">{item.label}</span>
				{/if}
			</li>
		{/each}
	</ol>
</nav>
