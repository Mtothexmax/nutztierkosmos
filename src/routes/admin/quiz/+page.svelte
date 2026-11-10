<script lang="ts">
	import { goto } from '$lib/paths';
	import { onMount } from 'svelte';

	onMount(() => goto('/admin/spiele', { replaceState: true }));
</script>

<svelte:head><title>Spiele · CMS</title></svelte:head>

<main class="mx-auto max-w-xl p-8 text-center">
	<p class="mb-4">Quizze findest du jetzt in der gemeinsamen Spiele-Liste.</p>
	<a class="b1" href="/admin/spiele">Zu den Spielen</a>
</main>
