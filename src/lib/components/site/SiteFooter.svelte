<script lang="ts">
	import { t, tr } from '$lib/i18n.svelte';
	import { content } from '$lib/stores/content.svelte';
	import Logo from './Logo.svelte';
</script>

<footer class="mt-20 bg-brand-900 text-white">
	<div class="wrap grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
		<div class="space-y-3">
			<div class="flex items-center gap-2.5">
				<Logo light />
				<span class="font-serif text-[19px] font-semibold">Nutztierkosmos</span>
			</div>
			<p class="max-w-sm text-[14px] text-white/80">{tr(content.settings.subtitle)}</p>
			<p class="text-[13px] text-white/70">{t('footer.institute')}</p>
		</div>

		<nav aria-label={t('nav.topics')}>
			<h2 class="mb-3 text-[13px] font-semibold tracking-wide text-white/70 uppercase">{t('nav.topics')}</h2>
			<ul class="space-y-2 text-[15px]">
				{#each content.activeCategories() as category (category.id)}
					<li><a class="text-white/90 hover:text-white hover:underline" href="/themen/{category.slug}">{tr(category.title)}</a></li>
				{/each}
			</ul>
		</nav>

		<nav aria-label="Service">
			<h2 class="mb-3 text-[13px] font-semibold tracking-wide text-white/70 uppercase">Service</h2>
			<ul class="space-y-2 text-[15px]">
				<li><a class="text-white/90 hover:text-white hover:underline" href="/info/barrierefreiheit">{t('footer.accessibility')}</a></li>
				<li><a class="text-white/90 hover:text-white hover:underline" href="/info/datenschutz">{t('footer.privacy')}</a></li>
				<li><a class="text-white/90 hover:text-white hover:underline" href="/info/impressum">{t('footer.imprint')}</a></li>
				<li><a class="text-white/90 hover:text-white hover:underline" href="mailto:{content.settings.contactEmail}">{t('footer.contact')}</a></li>
				<li><a class="text-white/90 hover:text-white hover:underline" href="/admin">{t('footer.editor')}</a></li>
			</ul>
		</nav>
	</div>
	<div class="border-t border-white/15">
		<p class="wrap py-4 text-[13px] text-white/70">{t('footer.demo')}</p>
	</div>
</footer>
