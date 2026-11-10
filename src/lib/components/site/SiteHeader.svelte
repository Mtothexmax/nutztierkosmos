<script lang="ts">
	import { page } from '$app/state';
	import Icon from '$lib/components/Icon.svelte';
	import { t } from '$lib/i18n.svelte';
	import { content } from '$lib/stores/content.svelte';
	import LangSwitch from './LangSwitch.svelte';
	import Logo from './Logo.svelte';

	let open = $state(false);

	let nav = $derived([
		{ href: '/themen', label: t('nav.topics'), icon: 'category' },
		{ href: '/suche', label: t('nav.search'), icon: 'search' },
		...(content.settings.gamification ? [{ href: '/mitmachen', label: t('nav.participate'), icon: 'extension' }] : []),
		{ href: '/info/ueber', label: t('nav.about'), icon: 'info' }
	]);

	const isCurrent = (href: string) => page.url.pathname === href || page.url.pathname.startsWith(href + '/');

	$effect(() => {
		void page.url.pathname;
		open = false;
	});
</script>

<header class="sticky top-0 z-30 border-b border-sand-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
	<div class="wrap flex h-16 items-center gap-4">
		<a href="/" class="flex shrink-0 items-center gap-2.5" aria-label="Nutztierkosmos – {t('nav.home')}">
			<Logo />
			<span class="leading-tight">
				<span class="block font-serif text-[19px] font-semibold text-ink-900">Nutztierkosmos</span>
				<span class="hidden text-[11px] font-medium tracking-wide text-ink-500 sm:block">{t('site.tagline')}</span>
			</span>
		</a>

		<nav aria-label={t('nav.main')} class="ml-auto hidden md:block">
			<ul class="flex items-center gap-1">
				{#each nav as item (item.href)}
					<li>
						<a
							href={item.href}
							aria-current={isCurrent(item.href) ? 'page' : undefined}
							class="rounded-lg px-3 py-2 text-[15px] font-medium transition {isCurrent(item.href)
								? 'bg-brand-50 text-brand-700'
								: 'text-ink-700 hover:bg-sand-50 hover:text-brand-700'}"
						>
							{item.label}
						</a>
					</li>
				{/each}
			</ul>
		</nav>

		<div class="ml-auto flex items-center gap-2 md:ml-2">
			<LangSwitch />
			<button
				type="button"
				class="grid h-10 w-10 place-items-center rounded-lg text-ink-700 hover:bg-sand-50 md:hidden"
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
			<ul class="wrap space-y-1 py-3">
				{#each nav as item (item.href)}
					<li>
						<a
							href={item.href}
							aria-current={isCurrent(item.href) ? 'page' : undefined}
							class="flex items-center gap-3 rounded-lg px-3 py-3 text-[16px] font-medium {isCurrent(item.href)
								? 'bg-brand-50 text-brand-700'
								: 'text-ink-900'}"
						>
							<Icon name={item.icon} class="text-brand-600" />{item.label}
						</a>
					</li>
				{/each}
			</ul>
		</nav>
	{/if}
</header>
