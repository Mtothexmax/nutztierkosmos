<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { browser } from '$app/env';
	import Icon from '$lib/components/Icon.svelte';
	import { session } from '$lib/stores/session.svelte';

	let { children } = $props();

	if (browser) session.enterAdmin();

	let drawer = $state(false);

	const nav = [
		{ href: '/admin', label: 'Dashboard', icon: 'dashboard' },
		{ href: '/admin/spiele', label: 'Spiele', icon: 'sports_esports' },
		{ href: '/admin/spieler', label: 'Spieler', icon: 'group' },
		{ href: '/admin/mediathek', label: 'Mediathek', icon: 'photo_library' },
		{ href: '/admin/einstellungen', label: 'Einstellungen', icon: 'settings' }
	];

	let current = $derived(nav.find((item) => isActive(item.href)));

	function isActive(href: string): boolean {
		const path = page.url.pathname;
		if (href === '/admin') return path === '/admin';
		if (href === '/admin/spiele') return path === '/admin/spiele' || path.startsWith('/admin/spiele/');
		if (href === '/admin/spieler') return path === '/admin/spieler';
		return path === href || path.startsWith(`${href}/`);
	}

	function logout() {
		session.logout();
		goto('/');
	}
</script>

<div class="h-screen lg:grid lg:grid-cols-[260px_1fr]">
	{#if drawer}
		<button
			class="fixed inset-0 z-30 bg-ink-900/40 lg:hidden"
			aria-label="Menü schließen"
			onclick={() => (drawer = false)}
		></button>
	{/if}

	<aside
		class="nav fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col justify-between bg-brand-900 p-4 text-white transition lg:static lg:z-auto lg:flex lg:h-full {drawer
			? 'flex'
			: 'hidden'}"
	>
		<div class="space-y-1">
			<div class="mb-6 flex items-center gap-2 font-serif font-bold">
				<span class="grid h-8 w-8 place-items-center rounded-full bg-brand-600">
					<Icon name="pets" />
				</span>
				<div class="leading-tight">
					Nutztierkosmos
					<div class="font-sans text-[11px] font-normal text-white/60">Redaktion</div>
				</div>
			</div>

			{#each nav as item (item.href)}
				<a href={item.href} class:on={isActive(item.href)} onclick={() => (drawer = false)}>
					<Icon name={item.icon} />{item.label}
				</a>
			{/each}
		</div>

		<div class="flex items-center gap-2 rounded-xl bg-white/10 p-3">
			<span class="grid h-8 w-8 place-items-center rounded-full bg-lime-500 font-bold text-brand-900">
				R
			</span>
			<div class="flex-1 text-sm leading-tight">
				Redaktion<br />
				<span class="text-[11px] text-white/60">Demo-Anmeldung</span>
			</div>
			<button class="text-white/70 hover:text-white" aria-label="Abmelden" onclick={logout}>
				<Icon name="logout" />
			</button>
		</div>
	</aside>

	<div class="min-w-0 flex flex-col h-full">
		<button class="b3 !p-2 lg:hidden" aria-label="Menü" onclick={() => (drawer = !drawer)}>
			<Icon name="menu" />
		</button>
		<main class="flex-1 overflow-y-auto space-y-6 p-4 lg:p-8">
			{@render children()}
		</main>
	</div>
</div>
