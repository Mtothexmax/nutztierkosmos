<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import ImageHotspotEditor from '$lib/components/admin/ImageHotspotEditor.svelte';
	import type { Question } from '$lib/types';
	import { uid } from '$lib/utils';

	type Props = { question: Question };
	let { question }: Props = $props();

	function handleImage(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = () => {
			question.image = reader.result as string;
		};
		reader.readAsDataURL(file);
		input.value = '';
	}

	function addOption() {
		if (question.type !== 'mc' && question.type !== 'image') return;
		question.options = [
			...(question.options ?? []),
			{ id: uid(), text: '', correct: false }
		];
	}

	function removeOption(id: string) {
		if (question.type !== 'mc' && question.type !== 'image') return;
		question.options = (question.options ?? []).filter((option) => option.id !== id);
	}

	function setSingleCorrect(id: string) {
		if (question.type !== 'mc' && question.type !== 'image') return;
		(question.options ?? []).forEach((option) => (option.correct = option.id === id));
	}

	function toggleCorrect(id: string) {
		if (question.type !== 'mc') return;
		const option = question.options.find((o) => o.id === id);
		if (option) option.correct = !option.correct;
	}

	function addMatchSide(side: 'left' | 'right') {
		if (question.type !== 'match') return;
		const entry = { id: uid(), text: '' };
		if (side === 'left') question.left = [...question.left, entry];
		else question.right = [...question.right, entry];
	}

	function removeMatchSide(side: 'left' | 'right', id: string) {
		if (question.type !== 'match') return;
		if (side === 'left') question.left = question.left.filter((item) => item.id !== id);
		else question.right = question.right.filter((item) => item.id !== id);
		question.solution = question.solution.filter(
			(pair) => pair.leftId !== id && pair.rightId !== id
		);
	}

	function solutionFor(leftId: string): string {
		if (question.type !== 'match') return '';
		return question.solution.find((pair) => pair.leftId === leftId)?.rightId ?? '';
	}

	function setSolution(leftId: string, rightId: string) {
		if (question.type !== 'match') return;
		question.solution = [
			...question.solution.filter((pair) => pair.leftId !== leftId && pair.rightId !== rightId),
			...(rightId ? [{ leftId, rightId }] : [])
		];
	}
</script>

<div class="space-y-3">
	<div>
		<label class="lbl" for="q-prompt">Frage</label>
		<textarea id="q-prompt" class="inp" rows="2" bind:value={question.prompt}></textarea>
	</div>

	<div>
		<label class="lbl" for="q-exp">Erklärung (optional)</label>
		<textarea id="q-exp" class="inp" rows="2" bind:value={question.explanation}></textarea>
	</div>

	{#if question.type === 'mc'}
		<div class="space-y-2">
			<p class="lbl">Antwortoptionen</p>
			{#each question.options as option (option.id)}
				<div class="flex items-center gap-2">
					{#if question.multiple}
						<input
							type="checkbox"
							checked={option.correct}
							aria-label="Richtig"
							onchange={() => toggleCorrect(option.id)}
						/>
					{:else}
						<input
							type="radio"
							name={`correct-${question.id}`}
							checked={option.correct}
							aria-label="Richtig"
							onchange={() => setSingleCorrect(option.id)}
						/>
					{/if}
					<input class="inp flex-1" bind:value={option.text} placeholder="Antworttext" />
					<button
						class="rounded-lg p-1 text-ink-500 hover:bg-err-bg hover:text-danger-500"
						aria-label="Option entfernen"
						onclick={() => removeOption(option.id)}
					>
						<Icon name="close" size={18} />
					</button>
				</div>
			{/each}
			<button class="b3" onclick={addOption}><Icon name="add" size={18} />Antwort hinzufügen</button>
			<label class="flex items-center gap-2 text-[13px]">
				<input type="checkbox" bind:checked={question.multiple} />
				Mehrfachauswahl erlauben
			</label>
		</div>
	{:else if question.type === 'tf'}
		<div>
			<p class="lbl">Aussage ist</p>
			<div class="inline-flex overflow-hidden rounded-xl border border-sand-200">
				<button
					class="px-4 py-2 text-[14px] font-semibold {question.correct
						? 'bg-brand-600 text-white'
						: 'bg-white text-ink-700 hover:bg-sand-50'}"
					onclick={() => (question.correct = true)}
				>
					Richtig
				</button>
				<button
					class="px-4 py-2 text-[14px] font-semibold {!question.correct
						? 'bg-brand-600 text-white'
						: 'bg-white text-ink-700 hover:bg-sand-50'}"
					onclick={() => (question.correct = false)}
				>
					Falsch
				</button>
			</div>
		</div>
	{:else if question.type === 'image'}
		<div>
			<label class="lbl" for="q-img">Bild</label>
			<div class="flex flex-wrap gap-2">
				<label class="flex items-center gap-2 rounded-xl border border-sand-200 bg-sand-50 p-3 cursor-pointer">
					<Icon name="image" class="text-ink-500" />
					<span>Bilddatei wählen</span>
					<input
						id="q-img"
						type="file"
						accept="image/*"
						class="hidden"
						onchange={handleImage}
					/>
				</label>
				{#if question.image}
					<div class="relative">
						<img
							src={question.image}
							alt="Vorschau"
							class="max-h-32 max-w-32 rounded-lg border border-sand-200"
						/>
						<button
							class="absolute top-1 right-1 rounded-full bg-err-bg p-1 hover:bg-danger-500 hover:text-white transition"
							aria-label="Bild entfernen"
							onclick={(e) => { e.stopPropagation(); question.image = undefined; }}
						>
							<Icon name="close" size={14} />
						</button>
					</div>
				{/if}
			</div>
			<p class="mt-1 text-[12px] text-ink-500">
				PNG, JPG, GIF, WebP. Das Bild wird als Data-URL direkt im Quiz gespeichert.
			</p>
		</div>

		<div>
			<p class="lbl">Antwortmodus</p>
			<div class="inline-flex overflow-hidden rounded-xl border border-sand-200">
				<button
					class="px-4 py-2 text-[14px] font-semibold {question.mode === 'choice'
						? 'bg-brand-600 text-white'
						: 'bg-white text-ink-700 hover:bg-sand-50'}"
					onclick={() => (question.mode = 'choice')}
				>
					Auswahl
				</button>
				<button
					class="px-4 py-2 text-[14px] font-semibold {question.mode === 'input'
						? 'bg-brand-600 text-white'
						: 'bg-white text-ink-700 hover:bg-sand-50'}"
					onclick={() => (question.mode = 'input')}
				>
					Eingabe
				</button>
				<button
					class="px-4 py-2 text-[14px] font-semibold {question.mode === 'click'
						? 'bg-brand-600 text-white'
						: 'bg-white text-ink-700 hover:bg-sand-50'}"
					onclick={() => {
						question.mode = 'click';
						if (!question.clickPolygon) question.clickPolygon = [];
						if (!question.clickInstruction) question.clickInstruction = '';
					}}
				>
					Klick-Bereich
				</button>
			</div>
		</div>

		{#if question.mode === 'choice'}
			<div class="space-y-2">
				{#each question.options ?? [] as option (option.id)}
					<div class="flex items-center gap-2">
						<input
							type="radio"
							name={`correct-${question.id}`}
							checked={option.correct}
							aria-label="Richtig"
							onchange={() => setSingleCorrect(option.id)}
						/>
						<input class="inp flex-1" bind:value={option.text} placeholder="Antworttext" />
						<button
							class="rounded-lg p-1 text-ink-500 hover:bg-err-bg hover:text-danger-500"
							aria-label="Option entfernen"
							onclick={() => removeOption(option.id)}
						>
							<Icon name="close" size={18} />
						</button>
					</div>
				{/each}
				<button class="b3" onclick={addOption}>
					<Icon name="add" size={18} />Antwort hinzufügen
				</button>
			</div>
		{:else if question.mode === 'input'}
			<div class="grid gap-2 sm:grid-cols-[1fr_auto]">
				<div>
					<label class="lbl" for="q-answer">Korrekte Antwort</label>
					<input id="q-answer" class="inp" bind:value={question.answer} />
				</div>
				<div>
					<label class="lbl" for="q-tol">Toleranz</label>
					<select id="q-tol" class="inp" bind:value={question.tolerance}>
						<option value="loose">Großzügig</option>
						<option value="exact">Exakt</option>
					</select>
				</div>
			</div>
		{:else if question.mode === 'click'}
			<ImageHotspotEditor {question} />
		{/if}
	{:else if question.type === 'match'}
		<div class="grid gap-3 sm:grid-cols-2">
			<div>
				<p class="lbl">Links (Begriffe)</p>
				<div class="space-y-2">
					{#each question.left as item (item.id)}
						<div class="flex items-center gap-1">
							<input class="inp" bind:value={item.text} placeholder="Begriff" />
							<button
								class="rounded-lg p-1 text-ink-500 hover:text-danger-500"
								aria-label="Entfernen"
								onclick={() => removeMatchSide('left', item.id)}
							>
								<Icon name="close" size={18} />
							</button>
						</div>
					{/each}
					<button class="b3" onclick={() => addMatchSide('left')}>
						<Icon name="add" size={18} />Begriff
					</button>
				</div>
			</div>
			<div>
				<p class="lbl">Rechts (Kategorien)</p>
				<div class="space-y-2">
					{#each question.right as item (item.id)}
						<div class="flex items-center gap-1">
							<input class="inp" bind:value={item.text} placeholder="Kategorie" />
							<button
								class="rounded-lg p-1 text-ink-500 hover:text-danger-500"
								aria-label="Entfernen"
								onclick={() => removeMatchSide('right', item.id)}
							>
								<Icon name="close" size={18} />
							</button>
						</div>
					{/each}
					<button class="b3" onclick={() => addMatchSide('right')}>
						<Icon name="add" size={18} />Kategorie
					</button>
				</div>
			</div>
		</div>

		<div class="space-y-2">
			<p class="lbl">Lösungen verbinden</p>
			{#each question.left as item (item.id)}
				<div class="flex items-center gap-2">
					<span class="w-28 truncate text-[13px]">{item.text || '–'}</span>
					<Icon name="arrow_forward" size={16} class="text-ink-500" />
					<select
						class="inp"
						value={solutionFor(item.id)}
						onchange={(e) => setSolution(item.id, e.currentTarget.value)}
					>
						<option value="">– keine –</option>
						{#each question.right as right (right.id)}
							<option value={right.id}>{right.text || '–'}</option>
						{/each}
					</select>
				</div>
			{/each}
		</div>
	{/if}

	<div class="max-w-32">
		<label class="lbl" for="q-points">Punkte</label>
		<input id="q-points" class="inp" type="number" min="0" bind:value={question.points} />
	</div>
</div>
