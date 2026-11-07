<script lang="ts">
	import { goto } from '$app/navigation';
	import { content } from '$lib/stores/content.svelte';
	import { session } from '$lib/stores/session.svelte';
	import Icon from './Icon.svelte';

	let points = $derived(session.player ? content.pointsOf(session.player.id) : 0);
	let menuOpen = $state(false);

	function logout() {
		session.logout();
		goto('/');
	}
</script>

<header
	class="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-sand-200 bg-white px-4 lg:px-8"
>
	<a href="/lernen" class="flex items-center gap-2 font-serif font-bold text-brand-700">
		<span class="grid h-8 w-8 place-items-center rounded-full bg-brand-600 text-white">
			<Icon name="pets" />
		</span>
		Nutztierkosmos
	</a>

	<div class="flex items-center gap-3">
		<span class="bdg"><Icon name="stars" size={16} />{points} Punkte</span>
		{#if session.player}
			<span class="text-xl">{session.player.avatar}</span>
			<span class="hidden font-medium sm:inline">{session.player.name}</span>
		{/if}
		<button
			class="text-ink-500 hover:text-ink-900"
			aria-label="Konto-Menü"
			aria-expanded={menuOpen}
			onclick={() => (menuOpen = !menuOpen)}
		>
			<Icon name="expand_more" />
		</button>

		{#if menuOpen}
			<div class="card absolute top-14 right-4 z-20 w-56 !p-2">
				<a href="/admin" class="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-sand-50">
					<Icon name="admin_panel_settings" size={18} /> Redaktion (Demo)
				</a>
				<button
					class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-sand-50"
					onclick={logout}
				>
					<Icon name="logout" size={18} /> Abmelden
				</button>
			</div>
		{/if}
	</div>
</header>
