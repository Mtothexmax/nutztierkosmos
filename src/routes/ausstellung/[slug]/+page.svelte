<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import Icon from '$lib/components/Icon.svelte';
	import InfographicView from '$lib/components/info/InfographicView.svelte';
	import Breadcrumbs from '$lib/components/site/Breadcrumbs.svelte';
	import ExhibitionCard from '$lib/components/site/ExhibitionCard.svelte';
	import Gallery from '$lib/components/site/Gallery.svelte';
	import LangNotice from '$lib/components/site/LangNotice.svelte';
	import MediaView from '$lib/components/site/MediaView.svelte';
	import { i18n, t, tr, type UiKey } from '$lib/i18n.svelte';
	import { showReqs } from '$lib/requirements.svelte';
	import { content } from '$lib/stores/content.svelte';
	import { pass } from '$lib/stores/pass.svelte';
	import { session } from '$lib/stores/session.svelte';
	import { toasts } from '$lib/stores/toast.svelte';
	import type { Block, L10n, MediaItem } from '$lib/types';

	showReqs(['exhibitions', 'publication-fields', 'plain', 'media', 'media-alt', 'cls', 'downloads', 'infographic', 'interactive', 'gamification', 'i18n-context', 'a11y', 'preview']);

	let exhibition = $derived(content.getExhibitionBySlug(page.params.slug ?? ''));
	let preview = $derived(page.url.searchParams.has('vorschau') && session.isAdmin);
	let visible = $derived(exhibition && (content.isPublic(exhibition) || preview));
	let topic = $derived(content.getTopic(exhibition?.topicId));
	let category = $derived(content.getCategory(topic?.categoryId));
	let hero = $derived(content.getMedia(exhibition?.heroMediaId));
	let publications = $derived(
		(exhibition?.publicationIds ?? []).map((id) => content.getPublication(id)).filter((p) => p !== undefined)
	);
	let keywords = $derived(
		(exhibition?.keywordIds ?? []).map((id) => content.getKeyword(id)).filter((k) => k !== undefined)
	);
	let related = $derived(
		exhibition && category
			? content
					.exhibitionsOfCategory(category.id)
					.filter((e) => e.id !== exhibition!.id)
					.slice(0, 3)
			: []
	);
	let toc = $derived(
		(exhibition?.blocks ?? [])
			.filter((b): b is Extract<Block, { heading?: L10n }> => 'heading' in b && Boolean(b.heading?.de))
			.map((b) => ({ id: b.id, label: tr(b.heading) }))
	);
	let allTexts = $derived(
		exhibition
			? [exhibition.title, exhibition.teaser, ...exhibition.blocks.flatMap((b) => (b.type === 'text' ? [b.body] : b.type === 'facts' ? b.items : []))]
			: []
	);

	const mediaList = (ids: string[]) => ids.map((id) => content.getMedia(id)).filter((m): m is MediaItem => Boolean(m));

	onMount(() => {
		if (!exhibition || !visible) return;
		if (!preview) content.trackPage({ exhibitionId: exhibition.id, categoryId: category?.id });
		const started = Date.now();
		const id = exhibition.id;
		const timer = setTimeout(() => pass.markRead(id), 4000);
		return () => {
			clearTimeout(timer);
			if (!preview) content.trackDwell(id, (Date.now() - started) / 1000);
		};
	});

	async function copyCitation(text: string) {
		try {
			await navigator.clipboard.writeText(text);
			toasts.push(i18n.active === 'en' ? 'Citation copied' : 'Quellenangabe kopiert');
		} catch {
			toasts.push(text, 'info');
		}
	}
</script>

<svelte:head>
	<title>{tr(exhibition?.title)} · Nutztierkosmos</title>
	{#if exhibition}<meta name="description" content={tr(exhibition.teaser)} />{/if}
</svelte:head>

{#if !exhibition || !visible}
	<div class="wrap py-20 text-center">
		<h1 class="h2">{t('exh.notFound')}</h1>
		<a class="b1 mt-6" href="/themen">{t('topics.title')}</a>
	</div>
{:else}
	{#if preview}
		<div class="sticky top-16 z-20 border-b border-amber-500/40 bg-[#fdf3e1]">
			<div class="wrap flex flex-wrap items-center gap-3 py-2.5 text-[14px]">
				<Icon name="visibility" class="text-[#8a5a17]" />
				<span class="font-semibold text-[#6b450f]">{t('exh.preview')}</span>
				<span class="status status-{exhibition.status}">{exhibition.status}</span>
				<a class="link ml-auto" href="/admin/ausstellungen/{exhibition.id}">{t('exh.backToEditor')}</a>
			</div>
		</div>
	{/if}

	<article>
		<header class="wrap space-y-5 pt-8 sm:pt-12">
			<Breadcrumbs
				items={[
					{ href: '/themen', label: t('topics.title') },
					{ href: `/themen/${category?.slug}`, label: tr(category?.title) },
					{ href: `/themen/${category?.slug}/${topic?.slug}`, label: tr(topic?.title) },
					{ label: tr(exhibition.title) }
				]}
			/>
			<div class="max-w-3xl space-y-4">
				<p class="eyebrow">{tr(category?.title)} · <span lang={i18n.langOf(topic?.title)}>{tr(topic?.title)}</span></p>
				<h1 class="display" lang={i18n.langOf(exhibition.title)}>{tr(exhibition.title)}</h1>
				<p class="lead" lang={i18n.langOf(exhibition.teaser)}>{tr(exhibition.teaser)}</p>
				<ul class="flex flex-wrap items-center gap-x-4 gap-y-2 text-[14px] text-ink-500">
					<li class="inline-flex items-center gap-1"><Icon name="schedule" size={18} />{t('exh.minutes', { n: exhibition.readingMinutes })}</li>
					<li class="inline-flex items-center gap-1"><Icon name="calendar_today" size={18} />{t('exh.updated')}: {i18n.date(exhibition.updatedAt, true)}</li>
					{#each exhibition.audiences as a (a)}
						<li><span class="bdg !bg-sand-100 !text-ink-700">{t(`audience.${a}` as UiKey)}</span></li>
					{/each}
				</ul>
				<LangNotice values={allTexts} />
			</div>
		</header>

		{#if hero}
			<div class="wrap mt-8">
				<MediaView media={hero} aspect="21 / 8" />
			</div>
		{/if}

		<div class="wrap mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_18rem]">
			<div class="min-w-0 space-y-12">
				{#each exhibition.blocks as block (block.id)}
					<div id="block-{block.id}">
						{#if block.type === 'text'}
							<section class="space-y-4">
								{#if block.heading?.de}<h2 class="h2" lang={i18n.langOf(block.heading)}>{tr(block.heading)}</h2>{/if}
								<div class="prose-ntk" lang={i18n.langOf(block.body)}>
									{#each tr(block.body).split(/\n\s*\n/) as paragraph, i (i)}
										<p>{paragraph}</p>
									{/each}
								</div>
							</section>
						{:else if block.type === 'facts'}
							<section class="rounded-3xl border border-brand-100 bg-brand-50 p-6 sm:p-8">
								<h2 class="h3 mb-4 flex items-center gap-2" lang={i18n.langOf(block.heading)}>
									<Icon name="lightbulb" class="text-brand-600" />{tr(block.heading) || t('exh.contents')}
								</h2>
								<ul class="space-y-3">
									{#each block.items as item, i (i)}
										<li class="flex gap-3 text-[16px] leading-relaxed text-ink-900" lang={i18n.langOf(item)}>
											<span class="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-600 text-[13px] font-bold text-white">{i + 1}</span>
											<span>{tr(item)}</span>
										</li>
									{/each}
								</ul>
							</section>
						{:else if block.type === 'media'}
							{@const media = content.getMedia(block.mediaId)}
							{#if media}<MediaView {media} />{/if}
						{:else if block.type === 'gallery'}
							<section class="space-y-3">
								{#if block.heading?.de}<h2 class="h3" lang={i18n.langOf(block.heading)}>{tr(block.heading)}</h2>{/if}
								<Gallery items={mediaList(block.mediaIds)} heading={tr(block.heading)} />
							</section>
						{:else if block.type === 'infographic'}
							{@const graphic = content.getInfographic(block.infographicId)}
							{#if graphic}<InfographicView {graphic} />{/if}
						{:else if block.type === 'quiz' && content.settings.gamification}
							{@const quiz = content.quizForLocale(block.quizId, i18n.active)}
							{#if quiz?.published}
								{@const best = pass.best(quiz.id)}
								<section class="relative overflow-hidden rounded-3xl bg-brand-900 p-6 text-white sm:p-8">
									<div class="absolute -top-16 -right-10 h-48 w-48 rounded-full bg-brand-600/40" aria-hidden="true"></div>
									<div class="relative flex flex-wrap items-center gap-6">
										<div class="min-w-0 flex-1 space-y-2">
											<p class="text-[12px] font-semibold tracking-[0.12em] text-lime-500 uppercase">{t('exh.testKnowledge')}</p>
											<h2 class="font-serif text-[24px] font-semibold" lang={quiz.lang ?? 'de'}>{quiz.title}</h2>
											<p class="text-white/85" lang={quiz.lang ?? 'de'}>{quiz.description}</p>
											<p class="text-[13px] text-white/70">
												{t('exh.questions', { n: quiz.questions.length })} · {t('exh.optional')}
												{#if best !== undefined} · {t('part.best', { p: Math.round(best * 100) })}{/if}
											</p>
										</div>
										<a class="btn bg-white text-brand-900 hover:bg-brand-50" href="/quiz/{quiz.id}"><Icon name="play_arrow" />{t('exh.startQuiz')}</a>
									</div>
								</section>
							{/if}
						{:else if block.type === 'game' && content.settings.gamification}
							{@const game = content.getGame(block.gameId)}
							{#if game?.published}
								<section class="flex flex-wrap items-center gap-5 rounded-3xl border border-sand-200 bg-white p-6">
									<span class="grid h-12 w-12 place-items-center rounded-xl bg-amber-500/15 text-[#8a5a17]"><Icon name="sports_esports" /></span>
									<div class="min-w-0 flex-1">
										<p class="eyebrow">{t('exh.game')}</p>
										<h2 class="h3" lang="de">{game.title}</h2>
										<p class="text-[15px] text-ink-700" lang="de">{game.description}</p>
									</div>
									<a class="b2" href="/spielen/{game.id}"><Icon name="play_arrow" />{t('exh.startGame')}</a>
								</section>
							{/if}
						{/if}
					</div>
				{/each}

				{#if publications.length}
					<section id="publikationen" aria-labelledby="pub-heading" class="space-y-4 border-t border-sand-200 pt-10">
						<h2 id="pub-heading" class="h2">{t('exh.basedOn')}</h2>
						{#each publications as pub (pub.id)}
							<article class="rounded-2xl border border-sand-200 bg-white p-5 sm:p-6">
								<p class="eyebrow mb-1">{t('exh.publication')} · {i18n.date(pub.date, true)}</p>
								<h3 class="h3" lang="de">{pub.title}</h3>
								<p class="mt-1 text-[14px] text-ink-500"><span class="sr-only">{t('exh.authors')}: </span>{pub.authors.join(', ')}</p>
								<p class="mt-3 text-[15px] text-ink-700" lang={i18n.langOf(pub.summary)}>{tr(pub.summary)}</p>
								<div class="mt-4 rounded-xl bg-sand-50 p-3 text-[13px] text-ink-700">
									<span class="font-semibold">{t('exh.cite')}:</span>
									<span lang="de">{pub.citation}</span>
								</div>
								<div class="mt-4 flex flex-wrap gap-2">
									{#if pub.url}
										<a class="b2 !py-2 text-[14px]" href={pub.url} target="_blank" rel="noopener noreferrer"><Icon name="open_in_new" size={18} />{t('exh.toPublication')}</a>
									{/if}
									<button type="button" class="b3 !py-2 text-[14px]" onclick={() => copyCitation(pub.citation)}><Icon name="content_copy" size={18} />{t('exh.cite')}</button>
									{#each mediaList(pub.mediaIds) as m (m.id)}
										{#if content.canDownload(m)}
											<a class="b3 !py-2 text-[14px]" href={m.src} download><Icon name="download" size={18} />{tr(m.title)}</a>
										{/if}
									{/each}
								</div>
							</article>
						{/each}
					</section>
				{/if}
			</div>

			<aside class="space-y-6 lg:sticky lg:top-24 lg:self-start">
				{#if toc.length}
					<nav aria-labelledby="toc-heading" class="rounded-2xl border border-sand-200 bg-white p-5 max-lg:hidden">
						<h2 id="toc-heading" class="mb-3 text-[13px] font-semibold tracking-wide text-ink-500 uppercase">{t('exh.contents')}</h2>
						<ol class="space-y-2 text-[14px]">
							{#each toc as entry (entry.id)}
								<li><a class="text-ink-700 hover:text-brand-700 hover:underline" href="#block-{entry.id}">{entry.label}</a></li>
							{/each}
							{#if publications.length}
								<li><a class="text-ink-700 hover:text-brand-700 hover:underline" href="#publikationen">{t('exh.basedOn')}</a></li>
							{/if}
						</ol>
					</nav>
				{/if}
				{#if keywords.length}
					<div class="rounded-2xl border border-sand-200 bg-white p-5">
						<h2 class="mb-3 text-[13px] font-semibold tracking-wide text-ink-500 uppercase">{t('exh.keywords')}</h2>
						<ul class="flex flex-wrap gap-2">
							{#each keywords as k (k.id)}
								<li><a class="chip" href="/suche?schlagwort={k.id}" lang={i18n.langOf(k.label)}>{tr(k.label)}</a></li>
							{/each}
						</ul>
					</div>
				{/if}
			</aside>
		</div>
	</article>

	{#if related.length}
		<section class="wrap mt-16" aria-labelledby="related">
			<h2 id="related" class="h2 mb-6">{t('exh.related')}</h2>
			<ul class="grid gap-5 md:grid-cols-3">
				{#each related as e (e.id)}
					<li><ExhibitionCard exhibition={e} /></li>
				{/each}
			</ul>
		</section>
	{/if}
{/if}
