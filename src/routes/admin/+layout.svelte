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
		if (href === '/admin') return page.url.pathname === '/admin';
		if (href === '/admin/spiele') return page.url.pathname.startsWith('/admin/spiele') || page.url.pathname === '/admin/api';
		return page.url.pathname === href || page.url.pathname.startsWith(`${href}/`);
	}

	function logout() {
		session.logout();
		goto('/');
	}
</script>

<div class="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
	{#if drawer}
		<button
			class="fixed inset-0 z-30 bg-ink-900/40 lg:hidden"
			aria-label="Menü schließen"
			onclick={() => (drawer = false)}
		></button>
	{/if}

	<aside
		class="nav fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col justify-between bg-brand-900 p-4 text-white transition lg:static lg:z-auto lg:flex {drawer
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

	<div class="min-w-0">
		<header
			class="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-sand-200 bg-white px-4"
		>
			<button class="b3 !p-2 lg:hidden" aria-label="Menü" onclick={() => (drawer = !drawer)}>
				<Icon name="menu" />
			</button>
			<span class="hidden text-[13px] text-ink-500 sm:inline">
				Redaktion{current ? ` / ${current.label}` : ''}
			</span>
			<div class="flex-1"></div>
			<div class="relative hidden md:block">
				<Icon name="search" class="absolute top-2 left-2 text-ink-500" />
				<input class="inp !w-56 !pl-9" placeholder="Suchen…" />
			</div>
			<a class="b2 hidden sm:inline-flex" href="/lernen">Vorschau ansehen</a>
			<a class="b1" href="/admin/spiele?new=1">+ Neu</a>
		</header>

		<main class="space-y-6 p-4 lg:p-8">
			{@render children()}
		</main>
	</div>
</div>
