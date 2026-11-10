<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import AdminLogin from '$lib/components/admin/AdminLogin.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import Logo from '$lib/components/site/Logo.svelte';
	import { content } from '$lib/stores/content.svelte';
	import { roleLabel, session, type Permission } from '$lib/stores/session.svelte';
	import { untrack } from 'svelte';

	let { children } = $props();

	let drawer = $state(false);

	type NavItem = { href: string; label: string; icon: string; perm?: Permission };
	const groups: { title: string; items: NavItem[] }[] = [
		{ title: '', items: [{ href: '/admin', label: 'Übersicht', icon: 'dashboard' }] },
		{
			title: 'Inhalte',
			items: [
				{ href: '/admin/ausstellungen', label: 'Ausstellungen', icon: 'museum', perm: 'content.edit' },
				{ href: '/admin/struktur', label: 'Struktur', icon: 'account_tree', perm: 'structure.edit' },
				{ href: '/admin/publikationen', label: 'Publikationen', icon: 'article', perm: 'content.edit' },
				{ href: '/admin/schlagwoerter', label: 'Schlagwörter', icon: 'sell', perm: 'content.edit' },
				{ href: '/admin/medien', label: 'Medien', icon: 'perm_media', perm: 'media.edit' }
			]
		},
		{
			title: 'Interaktiv',
			items: [
				{ href: '/admin/spiele', label: 'Quiz & Spiele', icon: 'quiz', perm: 'interactive.edit' },
				{ href: '/admin/infografiken', label: 'Infografiken', icon: 'insert_chart', perm: 'interactive.edit' }
			]
		},
		{
			title: 'Sprache & Auswertung',
			items: [
				{ href: '/admin/uebersetzungen', label: 'Texte & Übersetzungen', icon: 'translate', perm: 'translations.edit' },
				{ href: '/admin/statistik', label: 'Statistik', icon: 'monitoring', perm: 'stats.view' }
			]
		},
		{
			title: 'System',
			items: [
				{ href: '/admin/benutzer', label: 'Benutzer & Rollen', icon: 'manage_accounts', perm: 'users.manage' },
				{ href: '/admin/protokoll', label: 'Protokoll', icon: 'shield', perm: 'audit.view' },
				{ href: '/admin/einstellungen', label: 'Einstellungen', icon: 'settings', perm: 'settings.edit' }
			]
		}
	];

	/** Rechte je Bereich – zusätzlich zur ausgeblendeten Navigation (LB 6: nur gemäß Rolle zugänglich). */
	const routePerms: [string, Permission][] = [
		['/admin/ausstellungen', 'content.edit'],
		['/admin/struktur', 'structure.edit'],
		['/admin/publikationen', 'content.edit'],
		['/admin/schlagwoerter', 'content.edit'],
		['/admin/medien', 'media.edit'],
		['/admin/spiele', 'interactive.edit'],
		['/admin/quiz', 'interactive.edit'],
		['/admin/infografiken', 'interactive.edit'],
		['/admin/api', 'interactive.edit'],
		['/admin/uebersetzungen', 'translations.edit'],
		['/admin/statistik', 'stats.view'],
		['/admin/benutzer', 'users.manage'],
		['/admin/protokoll', 'audit.view'],
		['/admin/einstellungen', 'settings.edit']
	];

	let required = $derived(routePerms.find(([prefix]) => page.url.pathname.startsWith(prefix))?.[1]);
	let allowed = $derived(!required || session.can(required));

	$effect(() => {
		if (session.isAdmin && !allowed) {
			const path = page.url.pathname;
			untrack(() => content.log(session.user!.id, 'Zugriff verweigert', path, 'security'));
		}
	});

	function isActive(href: string): boolean {
		const path = page.url.pathname;
		if (href === '/admin') return path === '/admin';
		if (href === '/admin/spiele') return path.startsWith('/admin/spiele') || path.startsWith('/admin/quiz') || path.startsWith('/admin/api');
		return path === href || path.startsWith(`${href}/`);
	}

	function logout() {
		session.logout();
		goto('/admin');
	}
</script>

{#if !session.ready}
	<p class="p-8 text-ink-500">Lade …</p>
{:else if !session.isAdmin}
	<AdminLogin />
{:else}
	<a class="skip-link" href="#admin-main">Zum Inhalt springen</a>
	<div class="h-screen lg:grid lg:grid-cols-[264px_1fr]">
		{#if drawer}
			<button class="fixed inset-0 z-30 bg-ink-900/40 lg:hidden" aria-label="Menü schließen" onclick={() => (drawer = false)}></button>
		{/if}

		<aside
			class="nav fixed inset-y-0 left-0 z-40 w-[264px] flex-col justify-between overflow-y-auto bg-brand-900 p-4 text-white lg:static lg:z-auto lg:flex lg:h-full {drawer ? 'flex' : 'hidden'}"
		>
			<nav aria-label="Redaktion" class="space-y-5">
				<a href="/" class="mb-2 flex items-center gap-2.5 px-1" title="Zur öffentlichen Seite">
					<Logo light size={32} />
					<span class="leading-tight">
						<span class="block font-serif font-semibold">Nutztierkosmos</span>
						<span class="block text-[11px] text-white/70">Redaktion · zur Website ↗</span>
					</span>
				</a>
				{#each groups as group (group.title)}
					{@const items = group.items.filter((item) => !item.perm || session.can(item.perm))}
					{#if items.length}
						<div class="space-y-1">
							{#if group.title}<p class="px-3 text-[11px] font-semibold tracking-wider text-white/60 uppercase">{group.title}</p>{/if}
							{#each items as item (item.href)}
								<a href={item.href} class:on={isActive(item.href)} aria-current={isActive(item.href) ? 'page' : undefined} onclick={() => (drawer = false)}>
									<Icon name={item.icon} size={20} />{item.label}
								</a>
							{/each}
						</div>
					{/if}
				{/each}
			</nav>

			<div class="mt-6 flex items-center gap-2 rounded-xl bg-white/10 p-3">
				<span class="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-lime-500 font-bold text-brand-900">
					{session.user?.name.replace('Dr. ', '').charAt(0)}
				</span>
				<div class="min-w-0 flex-1 text-sm leading-tight">
					<span class="block truncate">{session.user?.name}</span>
					<span class="text-[11px] text-white/70">{roleLabel[session.user?.role ?? 'editor']}</span>
				</div>
				<button class="text-white/80 hover:text-white" aria-label="Abmelden" title="Abmelden" onclick={logout}>
					<Icon name="logout" />
				</button>
			</div>
		</aside>

		<div class="flex h-full min-w-0 flex-col">
			<div class="flex items-center gap-2 border-b border-sand-200 bg-white px-4 py-2 lg:hidden">
				<button class="b3 !p-2" aria-label="Menü" aria-expanded={drawer} onclick={() => (drawer = !drawer)}>
					<Icon name="menu" />
				</button>
				<span class="font-serif font-semibold">Redaktion</span>
			</div>
			<main id="admin-main" tabindex="-1" class="flex-1 space-y-6 overflow-y-auto p-4 focus:outline-none lg:p-8">
				{#if allowed}
					{@render children()}
				{:else}
					<div class="card mx-auto max-w-lg space-y-3 text-center">
						<Icon name="lock" size={40} class="text-ink-500" />
						<h1 class="h1 !text-[26px]">Keine Berechtigung</h1>
						<p class="text-ink-500">Ihre Rolle „{roleLabel[session.user?.role ?? 'editor']}“ darf diesen Bereich nicht öffnen. Der Zugriff wurde protokolliert.</p>
						<a class="b1" href="/admin">Zur Übersicht</a>
					</div>
				{/if}
			</main>
		</div>
	</div>
{/if}
