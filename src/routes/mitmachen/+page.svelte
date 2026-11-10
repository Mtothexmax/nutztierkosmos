<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import Breadcrumbs from '$lib/components/site/Breadcrumbs.svelte';
	import { i18n, t, tr } from '$lib/i18n.svelte';
	import { showReqs } from '$lib/requirements.svelte';
	import { content } from '$lib/stores/content.svelte';
	import { pass } from '$lib/stores/pass.svelte';

	showReqs(['gamification', 'interactive', 'feedback', 'privacy', 'i18n']);
	content.trackPage({});

	let quizzes = $derived(
		content.quizzes
			.filter((q) => q.published && !q.translationOf && content.getTopic(q.topicId)?.active)
			.map((q) => content.quizForLocale(q.id, i18n.active) ?? q)
	);
	let games = $derived(content.games.filter((g) => g.published && content.getTopic(g.topicId)?.active));
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

		<section aria-labelledby="quiz-heading" class="space-y-4">
			<h2 id="quiz-heading" class="h2">{t('part.quizzes')}</h2>
			<ul class="grid gap-4 md:grid-cols-2">
				{#each quizzes as quiz (quiz.id)}
					{@const topic = content.getTopic(quiz.topicId)}
					{@const exhibition = content.exhibitionWith({ quizId: quiz.id })}
					{@const best = pass.best(quiz.id)}
					<li class="tile flex h-full flex-col gap-3 p-5">
						<p class="eyebrow">{tr(content.getCategory(topic?.categoryId)?.title)} · {tr(topic?.title)}</p>
						<h3 class="h3" lang={quiz.lang ?? 'de'}>{quiz.title}</h3>
						<p class="text-[15px] text-ink-700" lang={quiz.lang ?? 'de'}>{quiz.description}</p>
						<p class="text-[13px] text-ink-500">
							{t('exh.questions', { n: quiz.questions.length })}
							{#if (quiz.lang ?? 'de') !== i18n.active} · {t('lang.missingShort')}{/if}
							{#if best !== undefined} · {t('part.best', { p: Math.round(best * 100) })}{/if}
						</p>
						<div class="mt-auto flex flex-wrap gap-2 pt-2">
							<a class="b1" href="/quiz/{quiz.id}"><Icon name="play_arrow" size={20} />{t('exh.startQuiz')}</a>
							{#if exhibition && content.isPublic(exhibition)}
								<a class="b3" href="/ausstellung/{exhibition.slug}">{t('part.toExhibition')}</a>
							{/if}
						</div>
					</li>
				{/each}
			</ul>
		</section>

		{#if games.length}
			<section aria-labelledby="game-heading" class="space-y-4">
				<h2 id="game-heading" class="h2">{t('part.games')}</h2>
				<ul class="grid gap-4 md:grid-cols-2">
					{#each games as game (game.id)}
						<li class="tile flex items-center gap-4 p-5">
							<span class="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-amber-500/15 text-[#8a5a17]"><Icon name="sports_esports" /></span>
							<div class="min-w-0 flex-1">
								<h3 class="h3" lang="de">{game.title}</h3>
								<p class="text-[14px] text-ink-700" lang="de">{game.description}</p>
							</div>
							<a class="b2" href="/spielen/{game.id}" aria-label="{t('exh.startGame')}: {game.title}"><Icon name="play_arrow" /></a>
						</li>
					{/each}
				</ul>
			</section>
		{/if}
	{/if}
</div>
