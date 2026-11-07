<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import { toasts } from '$lib/stores/toast.svelte';

	const files = [
		{ name: 'methan-quelle.jpg', emoji: '🌿', meta: '1200×800 · 180 KB', tone: 'from-brand-100 to-lime-500/30' },
		{ name: 'kuh-weide.jpg', emoji: '🐄', meta: '1600×900 · 240 KB', tone: 'from-sand-100 to-sand-200' },
		{ name: 'pansen-skizze.png', emoji: '🫀', meta: '800×800 · 96 KB', tone: 'from-berry-500/20 to-sand-100' },
		{ name: 'stall-luft.jpg', emoji: '🏠', meta: '1400×900 · 210 KB', tone: 'from-sky-500/20 to-sand-100' },
		{ name: 'futter-raps.jpg', emoji: '🫒', meta: '1000×750 · 140 KB', tone: 'from-lime-500/30 to-brand-100' },
		{ name: 'huehner-auslauf.jpg', emoji: '🐔', meta: '1200×800 · 165 KB', tone: 'from-amber-500/20 to-sand-100' },
		{ name: 'sensor-halsband.png', emoji: '🛰️', meta: '900×900 · 88 KB', tone: 'from-brand-100 to-sky-500/20' },
		{ name: 'messkammer.jpg', emoji: '🧪', meta: '1100×700 · 132 KB', tone: 'from-sand-100 to-berry-500/20' }
	];

	let filter = $state('alle');
	let fileInput: HTMLInputElement;
</script>

<svelte:head><title>Mediathek · CMS</title></svelte:head>

<div class="flex flex-wrap items-start justify-between gap-3">
	<div>
		<h1 class="h1">Mediathek</h1>
		<p class="text-ink-500">8 Dateien · Demo (keine echten Uploads)</p>
	</div>
	<button class="b1" onclick={() => fileInput.click()}>
		<Icon name="upload" />Hochladen
	</button>
	<input
		bind:this={fileInput}
		type="file"
		accept="image/*"
		class="hidden"
		onchange={() => toasts.push('Demo-Modus: Uploads werden nicht gespeichert', 'info')}
	/>
</div>

<div class="flex flex-wrap gap-2">
	{#each ['alle', 'bilder', 'verwendet'] as option (option)}
		<button
			class="bdg {filter === option ? '!bg-brand-600 !text-white' : '!bg-sand-100 !text-ink-700'}"
			onclick={() => (filter = option)}
		>
			{option === 'alle' ? 'Alle' : option === 'bilder' ? 'Bilder' : 'Verwendet in'}
		</button>
	{/each}
</div>

<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
	{#each files as file (file.name)}
		<div class="card !p-3">
			<div
				class="grid aspect-[3/2] place-items-center rounded-xl bg-gradient-to-br text-4xl {file.tone}"
			>
				{file.emoji}
			</div>
			<p class="mt-2 text-sm font-medium">{file.name}</p>
			<p class="text-[13px] text-ink-500">{file.meta}</p>
			<div class="mt-1 flex gap-1 text-ink-500">
				<button class="rounded-lg p-1 hover:bg-sand-100 hover:text-brand-700" aria-label="Bearbeiten">
					<Icon name="edit" size={16} />
				</button>
				<button
					class="rounded-lg p-1 hover:bg-err-bg hover:text-danger-500"
					aria-label="Löschen"
					onclick={() => toasts.push('Demo: Datei kann nicht gelöscht werden', 'info')}
				>
					<Icon name="delete" size={16} />
				</button>
			</div>
		</div>
	{/each}
</div>
