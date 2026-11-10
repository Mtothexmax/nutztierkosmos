<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import Breadcrumbs from '$lib/components/site/Breadcrumbs.svelte';
	import { i18n, t, tr } from '$lib/i18n.svelte';
	import { showReqs } from '$lib/requirements.svelte';
	import { content } from '$lib/stores/content.svelte';
	import { pass } from '$lib/stores/pass.svelte';
	import ActivityCard from '$lib/components/site/ActivityCard.svelte';

	showReqs(['gamification', 'interactive', 'feedback', 'privacy', 'i18n']);
	content.trackPage({});

	// Quizze und Spiele gleichrangig, gegliedert nach Kategorie (Tierart) – nicht nach Art.
	let groups = $derived(
		content
			.activeCategories()
			.map((category) => ({ category, items: content.activities({ categoryId: category.id }, i18n.active) }))
			.filter((group) => group.items.length > 0)
	);
	let readCount = $derived(pass.data.read.length);
	let quizCount = $derived(Object.keys(pass.data.quizzes).length);
</script>

<svelte:head><title>{t('part.title')} · Nutztierkosmos</title></svelte:head>

<div class="wrap space-y-10 py-8 sm:py-12">
	<Breadcrumbs items={[{ label: t('part.title') }]} />
	<header class="max-w-2xl space-y-3">
		<h1 class="display">{t('part.title')}</h1>
		<p class="lead">{t('part.intro')}</p>
	</header>

	{#if !content.settings.gamification}
		<p class="rounded-2xl border border-sand-200 bg-white p-6">{t('part.disabled')}</p>
	{:else}
		<section aria-labelledby="pass-heading" class="rounded-3xl border border-sand-200 bg-white p-6 sm:p-8">
			<div class="flex flex-wrap items-start gap-5">
				<span class="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-900 text-lime-500"><Icon name="badge" size={30} /></span>
				<div class="min-w-0 flex-1 space-y-2">
					<h2 id="pass-heading" class="h2">{t('part.pass')}</h2>
					<p class="max-w-2xl text-[15px] text-ink-700">{t('part.passIntro')}</p>
					{#if pass.enabled}
						<p class="text-[14px] font-semibold text-brand-700">
							<Icon name="check_circle" size={18} filled />
							{t('part.passActive')} · {t('part.progress', { a: readCount, b: content.publicExhibitions().length, c: quizCount })}
						</p>
					{/if}
				</div>
				{#if pass.enabled}
					<button type="button" class="b3" onclick={() => pass.disable()}><Icon name="delete" size={20} />{t('part.passDisable')}</button>
				{:else}
					<button type="button" class="b1" onclick={() => pass.enable()}><Icon name="add_task" size={20} />{t('part.passEnable')}</button>
				{/if}
			</div>

			{#if pass.enabled}
				<h3 class="mt-8 mb-3 text-[13px] font-semibold tracking-wide text-ink-500 uppercase">{t('part.badges')}</h3>
				<ul class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
					{#each pass.badges as badge (badge.id)}
						<li class="flex items-center gap-3 rounded-2xl border p-4 {badge.earned ? 'border-brand-500/50 bg-brand-50' : 'border-dashed border-sand-200'}">
							<span class="grid h-11 w-11 shrink-0 place-items-center rounded-full {badge.earned ? 'bg-brand-600 text-white' : 'bg-sand-100 text-ink-500'}">
								<Icon name={badge.earned ? badge.icon : 'lock'} />
							</span>
							<span>
								<span class="block font-semibold">{t(badge.title)}</span>
								<span class="block text-[13px] text-ink-500">{t(badge.text)}</span>
								<span class="sr-only">{t(badge.earned ? 'part.badgeEarned' : 'part.badgeLocked')}</span>
							</span>
						</li>
					{/each}
				</ul>
			{/if}
		</section>

		<section aria-labelledby="activities-heading" class="space-y-8">
			<header class="space-y-1">
				<h2 id="activities-heading" class="h2">{t('part.activities')}</h2>
				<p class="text-[15px] text-ink-700">{t('part.activitiesIntro')}</p>
			</header>
			{#each groups as group (group.category.id)}
				<section aria-labelledby="cat-{group.category.id}" class="space-y-4">
					<h3 id="cat-{group.category.id}" class="h3 flex items-baseline gap-3 border-b border-sand-200 pb-2">
						<a class="hover:underline" href="/themen/{group.category.slug}">{tr(group.category.title)}</a>
						<span class="text-[14px] font-normal text-ink-500">{group.items.length}</span>
					</h3>
					<ul class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{#each group.items as activity (activity.kind + activity.item.id)}
							<li><ActivityCard {activity} headingLevel={4} context="topic" showExhibition /></li>
						{/each}
					</ul>
				</section>
			{:else}
				<p class="rounded-2xl border border-dashed border-sand-200 p-6 text-[15px] text-ink-500">{t('part.none')}</p>
			{/each}
		</section>
	{/if}
</div>
