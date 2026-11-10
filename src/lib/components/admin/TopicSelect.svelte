<script lang="ts">
	import { content } from '$lib/stores/content.svelte';

	/** Auswahl eines Themenschwerpunkts, gruppiert nach Kategorie. */
	let { value = $bindable(''), id, required = false }: { value?: string; id: string; required?: boolean } = $props();
</script>

<select {id} class="inp" bind:value {required}>
	{#each [...content.categories].sort((a, b) => a.order - b.order) as category (category.id)}
		<optgroup label="{category.title.de}{category.active ? '' : ' (deaktiviert)'}">
			{#each content.topicsOf(category.id, false) as topic (topic.id)}
				<option value={topic.id}>{topic.title.de}{topic.active ? '' : ' (deaktiviert)'}</option>
			{/each}
		</optgroup>
	{/each}
</select>
