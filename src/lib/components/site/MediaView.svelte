<script lang="ts">
	import { withBase } from '$lib/paths';
	import Icon from '$lib/components/Icon.svelte';
	import { i18n, t, tr } from '$lib/i18n.svelte';
	import { content } from '$lib/stores/content.svelte';
	import type { MediaItem } from '$lib/types';

	let { media, aspect }: { media: MediaItem; aspect?: string } = $props();

	let ratio = $derived(aspect ?? (media.width && media.height ? `${media.width} / ${media.height}` : '16 / 9'));
	let downloadable = $derived(content.canDownload(media));
	let caption = $derived(tr(media.caption));
</script>

{#snippet meta()}
	{#if caption || media.credit}
		<!-- svelte-ignore a11y_figcaption_parent -->
		<figcaption class="mt-2 text-[14px] text-ink-500">
			{#if caption}<span lang={i18n.langOf(media.caption)}>{caption}</span>{/if}
			{#if media.credit}<span class="block text-[12px]">{media.credit}</span>{/if}
		</figcaption>
	{/if}
{/snippet}

{#snippet transcript()}
	{#if media.transcript?.de}
		<details class="mt-3 rounded-xl border border-sand-200 bg-white px-4 py-3">
			<summary class="cursor-pointer text-[14px] font-semibold text-brand-700">{t('media.transcript')}</summary>
			<p class="mt-2 text-[15px] text-ink-700" lang={i18n.langOf(media.transcript)}>{tr(media.transcript)}</p>
		</details>
	{/if}
{/snippet}

{#if media.type === 'image'}
	<figure>
		<div class="media-frame" style:aspect-ratio={ratio}>
			<img src={withBase(media.src)} alt={tr(media.alt)} lang={i18n.langOf(media.alt)} class="h-full w-full object-cover" loading="lazy" width={media.width} height={media.height} />
		</div>
		{@render meta()}
	</figure>
{:else if media.type === 'video'}
	<figure>
		<div class="media-frame bg-ink-900" style:aspect-ratio={ratio}>
			<!-- Untertitel als WebVTT; die Sprache folgt der Oberfläche (LB 5.3 / 8) -->
			<video
				class="h-full w-full"
				controls
				preload="metadata"
				poster={withBase(media.poster)}
				aria-label={tr(media.title)}
				controlslist={downloadable ? undefined : 'nodownload'}
			>
				<source src={withBase(media.src)} type={media.mime} />
				{#if media.captions?.de}
					<track kind="subtitles" srclang="de" label="Deutsch" src={withBase(media.captions.de)} default={i18n.active === 'de'} />
				{/if}
				{#if media.captions?.en}
					<track kind="subtitles" srclang="en" label="English" src={withBase(media.captions.en)} default={i18n.active === 'en'} />
				{/if}
			</video>
		</div>
		<div class="mt-2 flex flex-wrap items-center gap-2 text-[14px] text-ink-700">
			<strong class="font-semibold" lang={i18n.langOf(media.title)}>{tr(media.title)}</strong>
			{#if media.captions?.de || media.captions?.en}
				<span class="bdg !bg-sand-100 !text-ink-700"><Icon name="subtitles" size={16} />{t('media.subtitles')}</span>
			{/if}
		</div>
		{@render meta()}
		{@render transcript()}
	</figure>
{:else if media.type === 'audio'}
	<figure class="rounded-2xl border border-sand-200 bg-white p-5">
		<div class="mb-3 flex items-center gap-3">
			<span class="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700"><Icon name="headphones" /></span>
			<strong class="font-semibold" lang={i18n.langOf(media.title)}>{tr(media.title)}</strong>
		</div>
		<audio class="w-full" controls preload="metadata" aria-label={tr(media.title)} controlslist={downloadable ? undefined : 'nodownload'}>
			<source src={withBase(media.src)} type={media.mime} />
		</audio>
		{@render meta()}
		{@render transcript()}
	</figure>
{:else if media.type === 'pdf'}
	<div class="flex flex-wrap items-center gap-4 rounded-2xl border border-sand-200 bg-white p-5">
		<span class="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-danger-500/10 text-danger-500"><Icon name="picture_as_pdf" /></span>
		<div class="min-w-0 flex-1">
			<p class="font-semibold" lang={i18n.langOf(media.title)}>{tr(media.title)}</p>
			<p class="text-[14px] text-ink-500" lang={i18n.langOf(media.alt)}>{tr(media.alt)} · PDF, {media.sizeKb} KB</p>
		</div>
		{#if downloadable}
			<a class="b2" href={media.src} download>
				<Icon name="download" size={20} />{t('media.download')}
			</a>
		{:else}
			<span class="inline-flex items-center gap-1 text-[14px] text-ink-500"><Icon name="lock" size={18} />{t('media.noDownload')}</span>
		{/if}
	</div>
{/if}
