<script lang="ts">
	import '../app.css';
	import { browser } from '$app/env';
	import { page } from '$app/state';
	import ReqPanel from '$lib/components/ReqPanel.svelte';
	import SiteFooter from '$lib/components/site/SiteFooter.svelte';
	import SiteHeader from '$lib/components/site/SiteHeader.svelte';
	import ToastHost from '$lib/components/ToastHost.svelte';
	import { i18n, t } from '$lib/i18n.svelte';
	import { content } from '$lib/stores/content.svelte';
	import { pass } from '$lib/stores/pass.svelte';
	import { session } from '$lib/stores/session.svelte';

	let { children } = $props();

	if (browser) {
		content.init();
		i18n.init();
		session.init();
		pass.init();
	}

	/** Redaktion, Quiz, Spiel und Ergebnis laufen ohne Website-Kopf (Fokusmodus). */
	const bare = ['/admin', '/quiz', '/spielen', '/ergebnis'];
	let withChrome = $derived(!bare.some((p) => page.url.pathname === p || page.url.pathname.startsWith(p + '/')));
</script>

{#if withChrome}
	<a class="skip-link" href="#inhalt">{t('site.skip')}</a>
	<div class="flex min-h-screen flex-col">
		<SiteHeader />
		<main id="inhalt" tabindex="-1" class="flex-1 focus:outline-none">
			{@render children()}
		</main>
		<SiteFooter />
	</div>
{:else}
	{@render children()}
{/if}
<ToastHost />
<ReqPanel />
