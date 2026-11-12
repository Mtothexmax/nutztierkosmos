<script lang="ts">
	import TopicSelect from '$lib/components/admin/TopicSelect.svelte';
	import { beforeNavigate } from '$app/navigation';
	import { goto } from '$lib/paths';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import Icon from '$lib/components/Icon.svelte';
	import QuestionEditor from '$lib/components/admin/QuestionEditor.svelte';
	import LText from '$lib/components/admin/LText.svelte';
	import EditLangSwitch from '$lib/components/admin/EditLangSwitch.svelte';
	import { provideEditLang } from '$lib/components/admin/edit-lang.svelte';
	import { pick, questionTexts, quizProgress, textsMissing } from '$lib/activities';
	import { content } from '$lib/stores/content.svelte';
	import { toasts } from '$lib/stores/toast.svelte';
	import { emptyQuestion, questionTypeLabel, type Question, type Quiz } from '$lib/types';
	import { uid } from '$lib/utils';

	let quizId = page.params.id ?? '';
	const source = content.getQuiz(quizId);
	let draft = $state<Quiz | null>(source ? structuredClone($state.snapshot(source)) : null);

	let step = $state<'basics' | 'questions'>(
		page.url.searchParams.get('step') === 'questions' ? 'questions' : 'basics'
	);
	let selected = $state(0);
	/** Ein Quiz, zwei Sprachen: Umschalter oben bestimmt, welche Texte bearbeitet werden. */
	const editLang = provideEditLang(page.url.searchParams.get('lang') === 'en' ? 'en' : 'de');
	let enProgress = $derived(draft ? quizProgress(draft, 'en') : undefined);
	let savedAt = $state<string | null>(null);
	let deleteOpen = $state(false);
	let leaveOpen = $state(false);
	let pendingHref = $state<string | null>(null);
	let initialJson = $state(source ? JSON.stringify($state.snapshot(source)) : '');
	let allowLeave = false;

	let dirty = $derived(draft ? JSON.stringify($state.snapshot(draft)) !== initialJson : false);
	let current = $derived(draft?.questions[selected]);
	let totalPoints = $derived(
		draft?.questions.reduce((sum, question) => sum + (Number(question.points) || 0), 0) ?? 0
	);

	const questionTypes: Question['type'][] = ['mc', 'tf', 'image', 'match'];

	beforeNavigate(({ to, cancel }) => {
		if (!dirty || allowLeave) return;
		cancel();
		pendingHref = to ? to.url.pathname + to.url.search + to.url.hash : null;
		leaveOpen = true;
	});

	onMount(() => {
		const warn = (event: BeforeUnloadEvent) => {
			if (dirty) event.preventDefault();
		};
		window.addEventListener('beforeunload', warn);
		return () => window.removeEventListener('beforeunload', warn);
	});

	function addQuestion() {
		if (!draft) return;
		draft.questions.push(emptyQuestion('mc'));
		selected = draft.questions.length - 1;
		step = 'questions';
	}

	function removeQuestion(index: number) {
		if (!draft) return;
		draft.questions.splice(index, 1);
		selected = Math.max(0, Math.min(selected, draft.questions.length - 1));
	}

	function duplicateQuestion(index: number) {
		if (!draft) return;
		const copy = structuredClone($state.snapshot(draft.questions[index]));
		copy.id = uid();
		draft.questions.splice(index + 1, 0, copy);
		selected = index + 1;
	}

	function changeType(type: Question['type']) {
		if (!draft || !current || current.type === type) return;
		const replacement = emptyQuestion(type);
		replacement.id = current.id;
		replacement.prompt = current.prompt;
		replacement.explanation = current.explanation;
		replacement.points = current.points;
		draft.questions[selected] = replacement;
	}

	function save(): boolean {
		if (!draft) return false;
		const snapshot = structuredClone($state.snapshot(draft));
		initialJson = JSON.stringify(snapshot);
		const ok = content.updateQuiz(snapshot);
		if (!ok) {
			toasts.push('Speichern fehlgeschlagen – Browser-Speicher voll', 'error');
			return false;
		}
		savedAt = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
		toasts.push('Quiz gespeichert');
		return true;
	}

	function saveAndLeave() {
		if (!save()) return;
		allowLeave = true;
		leaveOpen = false;
		goto(pendingHref ?? '/admin/spiele');
	}

	function discardAndLeave() {
		allowLeave = true;
		leaveOpen = false;
		goto(pendingHref ?? '/admin/spiele');
	}

	function toggleTimer(enabled: boolean) {
		if (!draft) return;
		draft.timerSeconds = enabled ? 180 : null;
	}

	function removeQuiz() {
		content.deleteQuiz(quizId);
		toasts.push('Quiz gelöscht', 'info');
		allowLeave = true;
		goto('/admin/spiele');
	}
</script>

<svelte:head><title>Quiz-Editor · CMS</title></svelte:head>

{#if !draft}
	<main class="mx-auto max-w-3xl p-8">
		<div class="card text-center">
			<p class="mb-4">Dieses Quiz gibt es nicht (mehr).</p>
			<a class="b1" href="/admin/spiele">Zur Spiele-Liste</a>
		</div>
	</main>
{:else}
	<div class="mb-4 flex flex-wrap items-center gap-2">
		<a class="b3 !p-2" href="/admin/spiele" aria-label="Zurück zur Spiele-Liste">
			<Icon name="arrow_back" />
		</a>
		<div class="flex-1">
			<h1 class="font-serif text-xl font-bold text-brand-700">{draft.title.de || 'Ohne Titel'}</h1>
			<p class="text-[13px] text-ink-500">
				{draft.questions.length} Fragen · {totalPoints} Punkte · Quiz
			</p>
		</div>
		<a class="b2" href={`/quiz/${quizId}?from=admin&lang=${editLang.locale}`} target="_blank" rel="noreferrer">
			Vorschau ({editLang.locale.toUpperCase()})
		</a>
	</div>

	<div class="mb-4 flex flex-wrap items-center gap-2">
		<button
			class="flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-[13px] transition {step ===
			'basics'
				? 'border-brand-500 bg-brand-50 text-brand-700'
				: 'border-sand-200 bg-white text-ink-500 hover:border-brand-500'}"
			onclick={() => (step = 'basics')}
		>
			<span class="grid h-6 w-6 place-items-center rounded-full bg-brand-600 text-[12px] font-bold text-white"
				>1</span
			>
			Grundeinstellungen
		</button>
		<Icon name="chevron_right" class="text-ink-500" size={18} />
		<button
			class="flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-[13px] transition {step ===
			'questions'
				? 'border-brand-500 bg-brand-50 text-brand-700'
				: 'border-sand-200 bg-white text-ink-500 hover:border-brand-500'}"
			onclick={() => (step = 'questions')}
		>
			<span class="grid h-6 w-6 place-items-center rounded-full bg-brand-600 text-[12px] font-bold text-white"
				>2</span
			>
			Fragen ({draft.questions.length})
		</button>
		<span class="ml-auto text-[13px] {dirty ? 'text-amber-700' : 'text-brand-600'}">
			{dirty ? 'Nicht gespeichert' : savedAt ? `Gespeichert ${savedAt}` : 'Keine Änderungen'}
		</span>
	</div>

	<div class="mb-4">
		<EditLangSwitch
			lang={editLang}
			progress={enProgress}
			note="Fragentyp, Punkte, richtige Antworten und Medien gelten für beide Sprachen. Auf Englisch erscheint das Quiz erst, wenn alle Texte übersetzt sind."
		/>
	</div>

	{#if step === 'basics'}
		<div class="grid gap-4 lg:grid-cols-[1fr_320px]">
			<div class="card space-y-3">
				<h2 class="font-serif text-xl font-semibold text-brand-700">Grundeinstellungen</h2>

				<LText id="quiz-title" label="Titel" bind:value={draft.title} />

				<div>
					<label class="lbl" for="quiz-module">Themenschwerpunkt</label>
					<TopicSelect id="quiz-module" bind:value={draft.topicId} />
				</div>

				<LText id="quiz-desc" label="Beschreibung" multiline rows={3} bind:value={draft.description} />

				<p class="rounded-xl bg-brand-50 p-3 text-[13px] text-ink-700">
					Im zweiten Schritt legst du die Fragen an. Alle vier Formate – Multiple Choice,
					Richtig/Falsch, Bilderrätsel und Zuordnung – können in einem Quiz gemischt werden.
				</p>
			</div>

			<div class="card space-y-3">
				<div>
					<label class="lbl" for="quiz-points">Punkte gesamt</label>
					<input id="quiz-points" class="inp bg-sand-100" readonly value={totalPoints} />
				</div>

				<label class="flex items-center gap-2">
					<input type="checkbox" bind:checked={draft.published} />
					Veröffentlicht
				</label>

				<label class="flex items-center gap-2">
					<input
						type="checkbox"
						checked={draft.timerSeconds !== null}
						onchange={(e) => toggleTimer(e.currentTarget.checked)}
					/>
					Timer verwenden
				</label>

				{#if draft.timerSeconds !== null}
					<div>
						<label class="lbl" for="quiz-timer">Sekunden</label>
						<input id="quiz-timer" class="inp" type="number" min="10" bind:value={draft.timerSeconds} />
					</div>
				{/if}

				<button class="b3 w-full !text-danger-500" onclick={() => (deleteOpen = true)}>
					Quiz löschen
				</button>
			</div>
		</div>

		<div class="mt-4 flex flex-wrap items-center gap-2 border-t border-sand-200 pt-3">
			<a class="b3" href="/admin/spiele">Abbrechen</a>
			<button class="b2" onclick={save}>Speichern</button>
			<button class="b1" onclick={() => (step = 'questions')}>Weiter zu den Fragen</button>
			<span class="ml-auto text-[13px] text-ink-500">Schritt 1 von 2</span>
		</div>
	{:else}
		<div class="grid gap-4 xl:grid-cols-[320px_1fr]">
			<div class="space-y-2">
				<div class="flex flex-wrap items-center justify-between gap-2">
					<h2 class="font-serif text-xl font-semibold text-brand-700">
						Fragen ({draft.questions.length})
					</h2>
					<button class="b2" onclick={addQuestion}>+ Frage</button>
				</div>

				<div class="space-y-2">
					{#each draft.questions as question, index (question.id)}
						<div
							class="card flex items-center gap-2 !p-3 {index === selected
								? 'ring-2 ring-brand-500'
								: ''}"
							role="button"
							tabindex="0"
							onclick={() => (selected = index)}
							onkeydown={(e) => e.key === 'Enter' && (selected = index)}
						>
							<Icon name="drag_indicator" class="text-ink-500" />
							<b>{index + 1}</b>
							<span class="bdg shrink-0">{questionTypeLabel[question.type]}</span>
							<span class="min-w-0 flex-1 truncate text-[14px]">{pick(question.prompt, editLang.locale) || 'Ohne Frage'}</span>
							{#if textsMissing(questionTexts(question), editLang.locale)}
								<span class="bdg shrink-0 !bg-sky-500/10 !text-sky-500" title="Englische Texte fehlen">EN fehlt</span>
							{/if}
							<small class="shrink-0">{question.points} P.</small>
							<button
								class="rounded-lg p-1 text-ink-500 hover:text-brand-700"
								aria-label="Frage duplizieren"
								onclick={(e) => (e.stopPropagation(), duplicateQuestion(index))}
							>
								<Icon name="content_copy" size={18} />
							</button>
							<button
								class="rounded-lg p-1 text-ink-500 hover:text-danger-500"
								aria-label="Frage löschen"
								onclick={(e) => (e.stopPropagation(), removeQuestion(index))}
							>
								<Icon name="delete" size={18} />
							</button>
						</div>
					{/each}
				</div>

				{#if draft.questions.length === 0}
					<div class="rounded-xl border-2 border-dashed border-sand-200 p-8 text-center text-ink-500">
						Noch keine Fragen. Lege die erste Frage an.
					</div>
				{/if}
			</div>

			<div class="card space-y-3">
				<div class="flex flex-wrap gap-1 text-[13px]">
					{#each questionTypes as type (type)}
						<button
							class="bdg {current?.type === type ? '' : '!bg-sand-100 !text-ink-700'}"
							onclick={() => changeType(type)}
						>
							{questionTypeLabel[type]}
						</button>
					{/each}
				</div>

				{#if current}
					{#key current.id + current.type}
						<QuestionEditor question={current} />
					{/key}
				{:else}
					<p class="py-8 text-center text-ink-500">Wähle links eine Frage aus.</p>
				{/if}

				<div class="sticky bottom-0 flex flex-wrap items-center gap-2 border-t border-sand-200 bg-white pt-3">
					<button class="b3" onclick={() => (step = 'basics')}>
						<Icon name="arrow_back" size={18} />Einstellungen
					</button>
					<a class="b3" href="/admin/spiele">Abbrechen</a>
					<button class="b1" onclick={save}>Änderungen speichern</button>
					<span class="ml-auto text-[13px] text-ink-500">Schritt 2 von 2</span>
				</div>
			</div>
		</div>
	{/if}

	{#if leaveOpen}
		<div
			class="fixed inset-0 z-40 grid place-items-center bg-ink-900/50 p-4"
			role="dialog"
			aria-modal="true"
			aria-labelledby="leave-title"
		>
			<div class="card w-full max-w-[440px] space-y-3">
				<span class="grid h-12 w-12 place-items-center rounded-full bg-amber-500/15 text-amber-500">
					<Icon name="warning" />
				</span>
				<h2 id="leave-title" class="font-serif text-xl font-semibold">Änderungen verwerfen?</h2>
				<p class="text-[14px] text-ink-500">
					Deine Änderungen am Quiz wurden noch nicht gespeichert.
				</p>
				<div class="flex flex-wrap justify-end gap-2">
					<button class="b3" onclick={() => (leaveOpen = false)}>Weiter bearbeiten</button>
					<button class="b2" onclick={discardAndLeave}>Verwerfen</button>
					<button class="b1" onclick={saveAndLeave}>Speichern &amp; verlassen</button>
				</div>
			</div>
		</div>
	{/if}

	{#if deleteOpen}
		<div
			class="fixed inset-0 z-40 grid place-items-center bg-ink-900/50 p-4"
			role="dialog"
			aria-modal="true"
			aria-labelledby="delete-quiz-title"
		>
			<div class="card w-full max-w-[420px] space-y-3">
				<span class="grid h-12 w-12 place-items-center rounded-full bg-err-bg text-danger-500">
					<Icon name="delete" />
				</span>
				<h2 id="delete-quiz-title" class="font-serif text-xl font-semibold">Quiz löschen?</h2>
				<p>„{draft.title.de}" wird dauerhaft entfernt. Das kann nicht rückgängig gemacht werden.</p>
				<div class="flex justify-end gap-2">
					<button class="b3" onclick={() => (deleteOpen = false)}>Abbrechen</button>
					<button class="b4" onclick={removeQuiz}>Endgültig löschen</button>
				</div>
			</div>
		</div>
	{/if}
{/if}
