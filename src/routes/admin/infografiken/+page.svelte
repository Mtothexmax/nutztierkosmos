<script lang="ts">
	import { withBase } from '$lib/paths';
	import L10nInput from '$lib/components/admin/L10nInput.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import InfographicView from '$lib/components/info/InfographicView.svelte';
	import { showReqs } from '$lib/requirements.svelte';
	import { content } from '$lib/stores/content.svelte';
	import { session } from '$lib/stores/session.svelte';
	import { toasts } from '$lib/stores/toast.svelte';
	import type { Infographic, InfographicKind } from '$lib/types';
	import { nowIso, uid } from '$lib/utils';

	showReqs(['infographic', 'cms-nocode', 'i18n', 'a11y']);

	const kindLabel: Record<InfographicKind, string> = {
		thi: 'Rechner (individuell programmiert)',
		bars: 'Balkendiagramm mit Erklärungen',
		hotspots: 'Bild mit Hotspots'
	};

	let selectedId = $state<string | null>(content.infographics[0]?.id ?? null);
	let draft = $state<Infographic | null>(null);
	let activeSpot = $state<string | null>(null);

	$effect(() => {
		const g = content.getInfographic(selectedId ?? '');
		const next = g ? (structuredClone($state.snapshot(g)) as Infographic) : null;
		if (next) {
			next.title.en ??= '';
			next.description.en ??= '';
			next.unit ??= { de: '', en: '' };
		}
		draft = next;
		activeSpot = next?.hotspots?.[0]?.id ?? null;
	});

	let image = $derived(content.getMedia(draft?.imageId));

	function save() {
		if (!draft) return;
		draft.updatedAt = nowIso();
		const idx = content.infographics.findIndex((g) => g.id === draft!.id);
		content.infographics[idx] = structuredClone($state.snapshot(draft)) as Infographic;
		content.persistInfographics();
		content.log(session.user!.id, 'Infografik gespeichert', draft.title.de);
		toasts.push('Infografik gespeichert');
	}

	function create(kind: InfographicKind) {
		selectedId = content.createInfographic(kind).id;
	}

	function placeSpot(event: MouseEvent) {
		if (!draft?.hotspots) return;
		const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
		const x = Math.round(((event.clientX - rect.left) / rect.width) * 1000) / 1000;
		const y = Math.round(((event.clientY - rect.top) / rect.height) * 1000) / 1000;
		const spot = draft.hotspots.find((s) => s.id === activeSpot);
		if (spot) {
			spot.x = x;
			spot.y = y;
		} else {
			const id = uid();
			draft.hotspots.push({ id, x, y, title: { de: `Punkt ${draft.hotspots.length + 1}`, en: '' }, text: { de: '', en: '' } });
			activeSpot = id;
		}
	}
</script>

<svelte:head><title>Infografiken · Redaktion</title></svelte:head>

<div class="flex flex-wrap items-start justify-between gap-3">
	<div>
		<h1 class="h1">Interaktive Infografiken</h1>
		<p class="max-w-2xl text-ink-500">Vorlagen zum Selbstpflegen (Balken, Hotspots) und individuell programmierte Grafiken wie der THI-Rechner. Alle Texte sind zweisprachig pflegbar; jede Grafik hat eine Textalternative.</p>
	</div>
	<div class="flex flex-wrap gap-2">
		<button class="b2" onclick={() => create('bars')}><Icon name="bar_chart" />Neues Balkendiagramm</button>
		<button class="b2" onclick={() => create('hotspots')}><Icon name="touch_app" />Neues Hotspot-Bild</button>
	</div>
</div>

<div class="grid gap-6 xl:grid-cols-[18rem_1fr]">
	<ul class="card space-y-1 self-start !p-3">
		{#each content.infographics as g (g.id)}
			<li>
				<button class="w-full rounded-xl p-3 text-left {selectedId === g.id ? 'bg-brand-50 ring-1 ring-brand-500' : 'hover:bg-sand-50'}" aria-current={selectedId === g.id} onclick={() => (selectedId = g.id)}>
					<span class="block text-[14px] font-semibold">{g.title.de}</span>
					<span class="block text-[12px] text-ink-500">{kindLabel[g.kind]}</span>
				</button>
			</li>
		{/each}
	</ul>

	{#if draft}
		<div class="min-w-0 space-y-5">
			<form class="card space-y-4" onsubmit={(e) => (e.preventDefault(), save())}>
				<p class="bdg">{kindLabel[draft.kind]}</p>
				<L10nInput id="ig-t" label="Titel" bind:value={draft.title} required />
				<L10nInput id="ig-d" label="Beschreibung / Anleitung" bind:value={draft.description} multiline rows={2} />
				<div>
					<label class="lbl" for="ig-src">Quelle</label>
					<input id="ig-src" class="inp" bind:value={draft.source} />
				</div>

				{#if draft.kind === 'thi'}
					<p class="rounded-xl bg-sand-50 p-4 text-[14px] text-ink-700">
						<Icon name="code" size={18} /> Diese Grafik wurde individuell programmiert (Rechenlogik, Schwellenwerte). Titel, Beschreibung und Quelle sind pflegbar; die Stufen-Texte unter „Texte &amp; Übersetzungen“ (Schlüssel <code>info.level…</code>).
					</p>
				{:else if draft.kind === 'bars' && draft.bars}
					<L10nInput id="ig-u" label="Einheit" bind:value={draft.unit} />
					<fieldset class="space-y-3">
						<legend class="lbl">Balken</legend>
						{#each draft.bars as bar, i (bar.id)}
							<div class="space-y-2 rounded-xl border border-sand-200 p-3">
								<div class="flex items-end gap-2">
									<div class="flex-1"><L10nInput id="bar-{bar.id}-l" label="Beschriftung {i + 1}" bind:value={bar.label} /></div>
									<div class="w-24">
										<label class="lbl" for="bar-{bar.id}-v">Wert</label>
										<input id="bar-{bar.id}-v" type="number" class="inp" bind:value={bar.value} />
									</div>
									<button type="button" class="b3 !p-2 !text-danger-500" aria-label="Balken {i + 1} entfernen" onclick={() => draft?.bars?.splice(i, 1)}><Icon name="delete" size={18} /></button>
								</div>
								<L10nInput id="bar-{bar.id}-n" label="Erklärung" bind:value={bar.note} />
							</div>
						{/each}
						<button type="button" class="b2 !py-2 text-[14px]" onclick={() => draft?.bars?.push({ id: uid(), label: { de: '', en: '' }, value: 10, note: { de: '', en: '' } })}><Icon name="add" size={18} />Balken hinzufügen</button>
					</fieldset>
				{:else if draft.kind === 'hotspots' && draft.hotspots}
					<div>
						<label class="lbl" for="ig-img">Bild</label>
						<select id="ig-img" class="inp" bind:value={draft.imageId}>
							{#each content.media.filter((m) => m.type === 'image') as m (m.id)}<option value={m.id}>{m.title.de}</option>{/each}
						</select>
					</div>
					<p class="text-[13px] text-ink-500">Punkt in der Liste wählen und ins Bild klicken, um ihn zu platzieren. Ohne Auswahl entsteht ein neuer Punkt. Für Tastatur: Position unten als Zahl (0–1) eingeben.</p>
					<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
					<div class="media-frame relative aspect-[16/9] cursor-crosshair" onclick={placeSpot}>
						{#if image}<img src={withBase(image.src)} alt="" class="h-full w-full object-cover" width="800" height="450" />{/if}
						{#each draft.hotspots as s, i (s.id)}
							<span class="pointer-events-none absolute grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white text-[13px] font-bold text-white {activeSpot === s.id ? 'bg-ink-900' : 'bg-brand-600'}" style:left="{s.x * 100}%" style:top="{s.y * 100}%">{i + 1}</span>
						{/each}
					</div>
					{#each draft.hotspots as s, i (s.id)}
						<div class="space-y-2 rounded-xl border p-3 {activeSpot === s.id ? 'border-brand-600' : 'border-sand-200'}">
							<div class="flex flex-wrap items-center gap-2">
								<button type="button" class="chip" aria-pressed={activeSpot === s.id} onclick={() => (activeSpot = activeSpot === s.id ? null : s.id)}>Punkt {i + 1} {activeSpot === s.id ? '(ausgewählt)' : 'auswählen'}</button>
								<label class="text-[13px]" for="s-{s.id}-x">x</label><input id="s-{s.id}-x" type="number" step="0.01" min="0" max="1" class="inp !w-24 !py-1" bind:value={s.x} />
								<label class="text-[13px]" for="s-{s.id}-y">y</label><input id="s-{s.id}-y" type="number" step="0.01" min="0" max="1" class="inp !w-24 !py-1" bind:value={s.y} />
								<button type="button" class="b3 ml-auto !p-2 !text-danger-500" aria-label="Punkt {i + 1} entfernen" onclick={() => draft?.hotspots?.splice(i, 1)}><Icon name="delete" size={18} /></button>
							</div>
							<L10nInput id="s-{s.id}-t" label="Titel" bind:value={s.title} />
							<L10nInput id="s-{s.id}-x2" label="Erklärung" bind:value={s.text} multiline rows={2} />
						</div>
					{/each}
				{/if}
				<button class="b1" type="submit"><Icon name="save" size={20} />Speichern</button>
			</form>

			<section aria-label="Vorschau">
				<p class="ovl mb-2">Live-Vorschau</p>
				<InfographicView graphic={draft} />
			</section>
		</div>
	{/if}
</div>
