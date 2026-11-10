<script lang="ts">
	import { i18n, t, type UiKey } from '$lib/i18n.svelte';

	let temperature = $state(28);
	let humidity = $state(60);

	/** Temperatur-Feuchte-Index nach NRC (1971). */
	let thi = $derived(
		Math.round((1.8 * temperature + 32 - (0.55 - 0.0055 * humidity) * (1.8 * temperature - 26)) * 10) / 10
	);

	const levels = [
		{ min: -Infinity, max: 68, color: '#2a8560', key: 0 },
		{ min: 68, max: 72, color: '#8dbf3f', key: 1, dark: true },
		{ min: 72, max: 80, color: '#e0a23a', key: 2, dark: true },
		{ min: 80, max: 90, color: '#d9542b', key: 3 },
		{ min: 90, max: Infinity, color: '#9b1c1c', key: 4 }
	];

	let level = $derived(levels.find((l) => thi >= l.min && thi < l.max) ?? levels[0]);
	const SCALE_MIN = 50;
	const SCALE_MAX = 100;
	let marker = $derived(Math.max(0, Math.min(100, ((thi - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)) * 100)));
	const pos = (v: number) => ((Math.max(SCALE_MIN, Math.min(SCALE_MAX, v)) - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)) * 100;

	const presets: { de: string; en: string; t: number; h: number }[] = [
		{ de: 'Frühlingstag', en: 'Spring day', t: 18, h: 60 },
		{ de: 'Sommertag', en: 'Summer day', t: 27, h: 45 },
		{ de: 'Schwüler Tag', en: 'Muggy day', t: 31, h: 80 },
		{ de: 'Hitzewelle', en: 'Heatwave', t: 37, h: 55 }
	];

	const levelTitle = (k: number) => t(`info.level${k}` as UiKey);
	const levelText = (k: number) => t(`info.level${k}.text` as UiKey);

</script>

<div class="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
	<div class="space-y-5">
		<div>
			<label class="lbl !text-[14px]" for="thi-temp">{t('info.temperature')}: <strong class="text-ink-900">{temperature} °C</strong></label>
			<input id="thi-temp" type="range" min="10" max="40" step="1" bind:value={temperature} class="w-full accent-brand-600" aria-valuetext="{temperature} °C" />
		</div>
		<div>
			<label class="lbl !text-[14px]" for="thi-hum">{t('info.humidity')}: <strong class="text-ink-900">{humidity} %</strong></label>
			<input id="thi-hum" type="range" min="20" max="100" step="5" bind:value={humidity} class="w-full accent-brand-600" aria-valuetext="{humidity} %" />
		</div>
		<div class="flex flex-wrap gap-2" role="group" aria-label={t('info.example')}>
			{#each presets as p (p.de)}
				<button
					type="button"
					class="chip"
					aria-pressed={temperature === p.t && humidity === p.h}
					onclick={() => {
						temperature = p.t;
						humidity = p.h;
					}}
				>
					{i18n.active === 'en' ? p.en : p.de} · {p.t} °C / {p.h} %
				</button>
			{/each}
		</div>
	</div>

	<div class="rounded-2xl bg-sand-50 p-5">
		<output for="thi-temp thi-hum" aria-live="polite" class="block">
			<span class="text-[13px] font-medium text-ink-500">{t('info.thi')}</span>
			<span class="mt-1 flex items-baseline gap-3">
				<span class="font-serif text-[48px] leading-none font-semibold text-ink-900 tabular-nums">{thi.toFixed(0)}</span>
				<span class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[14px] font-semibold {'dark' in level ? 'text-ink-900' : 'text-white'}" style:background={level.color}>
					{levelTitle(level.key)}
				</span>
			</span>
			<span class="mt-2 block text-[15px] text-ink-700">{levelText(level.key)}</span>
		</output>

		<div class="mt-5" aria-hidden="true">
			<div class="relative h-3 overflow-hidden rounded-full">
				{#each levels as l (l.key)}
					<span class="absolute inset-y-0" style:left="{pos(l.min)}%" style:width="{pos(l.max) - pos(l.min)}%" style:background={l.color}></span>
				{/each}
			</div>
			<div class="relative h-8">
				<span class="absolute -top-5 h-7 w-1 -translate-x-1/2 rounded bg-ink-900 shadow-[0_0_0_3px_white] transition-[left] duration-300" style:left="{marker}%"></span>
				{#each [68, 72, 80, 90] as v (v)}
					<span class="absolute top-1 -translate-x-1/2 text-[11px] text-ink-500 tabular-nums" style:left="{pos(v)}%">{v}</span>
				{/each}
			</div>
		</div>
	</div>
</div>
