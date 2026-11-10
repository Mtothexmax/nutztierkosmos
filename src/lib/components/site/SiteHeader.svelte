<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Icon from '$lib/components/Icon.svelte';
	import { t } from '$lib/i18n.svelte';
	import { content } from '$lib/stores/content.svelte';
	import LangSwitch from './LangSwitch.svelte';
	import Logo from './Logo.svelte';

	// Aufbau angelehnt an fbn-dummerstorf.de: Logo links, oben eine Servicezeile
	// (Links, Sprache, Suche), darunter die Hauptnavigation in Großbuchstaben.
	let open = $state(false);
	let query = $state('');

	let nav = $derived([
		{ href: '/themen', label: t('nav.topics'), icon: 'category' },
		...(content.settings.gamification ? [{ href: '/mitmachen', label: t('nav.participate'), icon: 'extension' }] : []),
		{ href: '/info/ueber', label: t('nav.about'), icon: 'info' }
	]);

	const isCurrent = (href: string) => page.url.pathname === href || page.url.pathname.startsWith(href + '/');

	function search(event: SubmitEvent) {
		event.preventDefault();
		const q = query.trim();
		goto(q ? `/suche?q=${encodeURIComponent(q)}` : '/suche');
		query = '';
	}

	$effect(() => {
		void page.url.pathname;
		open = false;
	});
</script>

<header class="sticky top-0 z-30 border-b border-sand-200 bg-white shadow-[0_2px_6px_-4px_rgba(0,37,85,.25)]">
	<div class="wrap flex items-center gap-4 py-3 md:py-4">
		<a href="/" class="flex shrink-0 items-center gap-3" aria-label="Nutztierkosmos – {t('nav.home')}">
			<Logo size={44} />
			<span class="leading-[1.15]">
				<span class="block text-[20px] font-normal text-brand-700 sm:text-[22px]">Nutztierkosmos</span>
				<span class="hidden text-[13px] text-ink-500 sm:block">{t('site.tagline')}</span>
			</span>
		</a>

		<div class="ml-auto hidden flex-col items-end gap-3 md:flex">
			<div class="flex items-center gap-5 text-[15px]">
				<a class="text-brand-700 hover:underline" href="/info/barrierefreiheit">{t('footer.accessibility')}</a>
				<a class="text-brand-700 hover:underline" href="mailto:{content.settings.contactEmail}">{t('footer.contact')}</a>
				<LangSwitch />
				<form role="search" class="relative" onsubmit={search}>
					<label class="sr-only" for="header-search">{t('nav.search')}</label>
					<input
						id="header-search"
						type="search"
						bind:value={query}
						placeholder={t('nav.search')}
						class="h-9 w-48 rounded-md border border-sand-200 bg-white py-1.5 pr-9 pl-3 text-[15px] text-brand-700 placeholder:text-ink-500 focus:border-brand-500 focus:outline-none lg:w-56"
					/>
					<button type="submit" class="absolute top-0 right-0 grid h-9 w-9 place-items-center text-brand-700" aria-label={t('nav.search')}>
						<Icon name="search" size={20} />
					</button>
				</form>
			</div>

			<nav aria-label={t('nav.main')}>
				<ul class="flex items-center gap-1">
					{#each nav as item (item.href)}
						<li>
							<a
								href={item.href}
								aria-current={isCurrent(item.href) ? 'page' : undefined}
								class="block rounded-sm px-3 py-2 text-[16px] font-bold tracking-wide text-brand-700 uppercase transition lg:text-[17px] {isCurrent(item.href)
									? 'bg-[#e8e8e8]'
									: 'hover:bg-sand-100'}"
							>
								{item.label}
							</a>
						</li>
					{/each}
				</ul>
			</nav>
		</div>

		<div class="ml-auto flex items-center gap-1 md:hidden">
			<LangSwitch />
			<button
				type="button"
				class="grid h-10 w-10 place-items-center rounded-sm text-brand-700 hover:bg-sand-100"
				aria-expanded={open}
				aria-controls="mobile-nav"
				aria-label={open ? t('nav.close') : t('nav.menu')}
				onclick={() => (open = !open)}
			>
				<Icon name={open ? 'close' : 'menu'} />
			</button>
		</div>
	</div>

	{#if open}
		<nav id="mobile-nav" aria-label={t('nav.main')} class="border-t border-sand-200 bg-white md:hidden">
			<div class="wrap py-3">
				<form role="search" class="relative mb-2" onsubmit={search}>
					<label class="sr-only" for="mobile-search">{t('nav.search')}</label>
					<input
						id="mobile-search"
						type="search"
						bind:value={query}
						placeholder={t('nav.search')}
						class="h-11 w-full rounded-md border border-sand-200 bg-white pr-11 pl-3 text-[16px] text-brand-700 placeholder:text-ink-500 focus:border-brand-500 focus:outline-none"
					/>
					<button type="submit" class="absolute top-0 right-0 grid h-11 w-11 place-items-center text-brand-700" aria-label={t('nav.search')}>
						<Icon name="search" />
					</button>
				</form>
				<ul class="divide-y divide-sand-200">
					{#each nav as item (item.href)}
						<li>
							<a
								href={item.href}
								aria-current={isCurrent(item.href) ? 'page' : undefined}
								class="flex items-center gap-3 px-2 py-3 text-[16px] font-bold tracking-wide text-brand-700 uppercase {isCurrent(item.href)
									? 'bg-[#e8e8e8]'
									: ''}"
							>
								{item.label}
							</a>
						</li>
					{/each}
					<li><a class="block px-2 py-3 text-[15px] text-brand-700" href="/info/barrierefreiheit">{t('footer.accessibility')}</a></li>
					<li><a class="block px-2 py-3 text-[15px] text-brand-700" href="mailto:{content.settings.contactEmail}">{t('footer.contact')}</a></li>
				</ul>
			</div>
		</nav>
	{/if}
</header>
