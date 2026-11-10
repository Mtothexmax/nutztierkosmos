<script lang="ts">
	import { browser } from '$app/env';
	import Icon from '$lib/components/Icon.svelte';
	import { reqState, requirements } from '$lib/requirements.svelte';
	import { read, storageKeys, write } from '$lib/storage/db';
	import { content } from '$lib/stores/content.svelte';

	/** Präsentationsmodus für die Vorstellung beim Auftraggeber – im Echtbetrieb abschaltbar. */
	let open = $state(browser ? read(storageKeys.reqPanel, false) : false);
	let items = $derived(requirements.filter((r) => reqState.ids.includes(r.id)));

	function toggle() {
		open = !open;
		write(storageKeys.reqPanel, open);
	}
</script>

{#if content.settings.presentationMode && items.length}
	<div class="fixed right-4 bottom-4 z-40 flex max-w-[calc(100vw-2rem)] flex-col items-end gap-2 print:hidden" lang="de">
		{#if open}
			<div id="req-panel" class="max-h-[60vh] w-[22rem] max-w-full overflow-y-auto rounded-2xl border border-brand-700 bg-white p-4 shadow-2xl" role="region" aria-label="Abgedeckte Anforderungen">
				<div class="mb-2 flex items-center justify-between gap-2">
					<p class="text-[13px] font-semibold text-brand-700">Leistungsbeschreibung – auf diesem Screen</p>
					<button type="button" class="text-ink-500 hover:text-ink-900" aria-label="Panel schließen" onclick={toggle}><Icon name="close" size={20} /></button>
				</div>
				<ul class="space-y-2.5">
					{#each items as req (req.id)}
						<li class="flex gap-2 text-[13px] leading-snug">
							<Icon name="check_circle" size={18} filled class="mt-0.5 shrink-0 text-brand-600" />
							<span>
								<strong class="font-semibold text-ink-900">{req.title}</strong>
								<span class="ml-1 rounded bg-sand-100 px-1.5 text-[11px] font-semibold text-ink-700">LB {req.ref}</span>
								<span class="block text-ink-700">{req.how}</span>
							</span>
						</li>
					{/each}
				</ul>
				<p class="mt-3 border-t border-sand-200 pt-2 text-[11px] text-ink-500">Präsentationsmodus · abschaltbar unter Redaktion → Einstellungen</p>
			</div>
		{/if}
		<button
			type="button"
			class="inline-flex items-center gap-2 rounded-full bg-brand-900 px-4 py-2.5 text-[13px] font-semibold text-white shadow-lg hover:bg-brand-800"
			aria-expanded={open}
			aria-controls="req-panel"
			onclick={toggle}
		>
			<Icon name="fact_check" size={18} />
			<span>{items.length}<span class="max-sm:sr-only">&nbsp;Anforderungen</span></span>
		</button>
	</div>
{/if}
