<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	onMount(() => goto('/admin/spiele?new=1', { replaceState: true }));
</script>

<svelte:head><title>Neues Spiel · CMS</title></svelte:head>

<main class="mx-auto max-w-xl p-8 text-center">
	<p class="mb-4">HTML-Spiele werden jetzt als ZIP-Paket über „Neues Spiel“ angelegt.</p>
	<a class="b1" href="/admin/spiele?new=1">Neues Spiel anlegen</a>
</main>
