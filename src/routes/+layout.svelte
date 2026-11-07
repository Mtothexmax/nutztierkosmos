<script lang="ts">
	import '../app.css';
	import { browser } from '$app/env';
	import ToastHost from '$lib/components/ToastHost.svelte';
	import { content } from '$lib/stores/content.svelte';
	import { session } from '$lib/stores/session.svelte';

	let { children } = $props();

	if (browser) {
		content.init();
		session.init();
	}
</script>

{@render children()}
<ToastHost />
