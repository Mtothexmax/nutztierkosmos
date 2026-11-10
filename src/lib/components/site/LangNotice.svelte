<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import { i18n, t } from '$lib/i18n.svelte';
	import type { L10n } from '$lib/types';

	/** Zeigt einen Hinweis, wenn einer der Texte nicht übersetzt ist. */
	let { values }: { values: (L10n | undefined)[] } = $props();

	let missing = $derived(values.some((v) => i18n.missing(v)));
</script>

{#if missing}
	<p class="flex items-start gap-2 rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 py-3 text-[14px] text-ink-900" role="note" lang="en">
		<Icon name="translate" class="text-sky-500" size={20} />
		<span>{t('lang.missing')}</span>
	</p>
{/if}
