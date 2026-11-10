<script lang="ts">
	import { t, tr } from '$lib/i18n.svelte';
	import { content } from '$lib/stores/content.svelte';
	import Logo from './Logo.svelte';

	// Heller Fußbereich wie auf fbn-dummerstorf.de: Linkspalten oben,
	// unten Copyright links und Rechtliches rechts, getrennt durch „|“.
</script>

<footer class="mt-20 bg-sand-100 text-brand-700">
	<div class="wrap grid gap-10 py-10 md:grid-cols-[1.4fr_1fr_1fr]">
		<div class="space-y-3">
			<div class="flex items-center gap-2.5">
				<Logo size={32} />
				<span class="text-[18px]">Nutztierkosmos</span>
			</div>
			<p class="max-w-sm text-[15px] text-ink-700">{tr(content.settings.subtitle)}</p>
			<p class="text-[14px] text-ink-700">{t('footer.institute')}</p>
		</div>

		<nav aria-label={t('nav.topics')}>
			<h2 class="mb-3 text-[17px] font-semibold">{t('nav.topics')}</h2>
			<ul class="space-y-1.5 text-[15px]">
				{#each content.activeCategories() as category (category.id)}
					<li><a class="text-ink-500 hover:text-brand-700 hover:underline" href="/themen/{category.slug}">{tr(category.title)}</a></li>
				{/each}
			</ul>
		</nav>

		<nav aria-label="Service">
			<h2 class="mb-3 text-[17px] font-semibold">Service</h2>
			<ul class="space-y-1.5 text-[15px]">
				<li><a class="text-ink-500 hover:text-brand-700 hover:underline" href="/suche">{t('nav.search')}</a></li>
				<li><a class="text-ink-500 hover:text-brand-700 hover:underline" href="/info/barrierefreiheit">{t('footer.accessibility')}</a></li>
				<li><a class="text-ink-500 hover:text-brand-700 hover:underline" href="mailto:{content.settings.contactEmail}">{t('footer.contact')}</a></li>
				<li><a class="text-ink-500 hover:text-brand-700 hover:underline" href="/admin">{t('footer.editor')}</a></li>
			</ul>
		</nav>
	</div>
	<div class="wrap">
		<div class="flex flex-col gap-2 border-t border-sand-200 py-5 text-[14px] sm:flex-row sm:items-center sm:justify-between">
			<p>© Forschungsinstitut für Nutztierbiologie (FBN) · <span class="text-ink-500">{t('footer.demo')}</span></p>
			<p class="text-ink-500">
				<a class="hover:text-brand-700 hover:underline" href="/info/impressum">{t('footer.imprint')}</a>
				<span aria-hidden="true" class="px-1">|</span>
				<a class="hover:text-brand-700 hover:underline" href="/info/datenschutz">{t('footer.privacy')}</a>
				<span aria-hidden="true" class="px-1">|</span>
				<a class="hover:text-brand-700 hover:underline" href="/info/barrierefreiheit">{t('footer.accessibility')}</a>
			</p>
		</div>
	</div>
</footer>
