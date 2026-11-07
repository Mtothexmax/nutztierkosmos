<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Icon from '$lib/components/Icon.svelte';
	import { content } from '$lib/stores/content.svelte';
	import { toasts } from '$lib/stores/toast.svelte';
	import { emptyQuestion, questionTypeLabel, type Question } from '$lib/types';
	import { formatDateTime } from '$lib/utils';

	type Row = {
		id: string;
		kind: 'quiz' | 'html';
		title: string;
		moduleId: string;
		typeLabel: string;
		points: number;
		published: boolean;
		updatedAt: string;
		editorHref: string;
		previewHref: string;
	};

	let search = $state('');
	let filter = $state<'alle' | 'quiz' | 'html'>('alle');
	let newOpen = $state(page.url.searchParams.get('new') === '1');
	let pendingDelete = $state<Row | null>(null);

	let rows = $derived.by<Row[]>(() => {
		const quizzes: Row[] = content.quizzes.map((quiz) => ({
			id: quiz.id,
			kind: 'quiz',
			title: quiz.title,
			moduleId: quiz.moduleId,
			typeLabel: quiz.questions.length
				? `Quiz · ${questionTypeLabel[quiz.questions[0].type]}`
				: 'Quiz',
			points: quiz.questions.reduce((sum, question) => sum + (Number(question.points) || 0), 0),
			published: quiz.published,
			updatedAt: quiz.updatedAt,
			editorHref: `/admin/quiz/${quiz.id}`,
			previewHref: `/quiz/${quiz.id}?from=admin`
		}));

		const games: Row[] = content.games.map((game) => ({
			id: game.id,
			kind: 'html',
			title: game.title,
			moduleId: game.moduleId,
			typeLabel: 'HTML-Spiel · ZIP',
			points: game.maxPoints,
			published: game.published,
			updatedAt: game.updatedAt,
			editorHref: `/admin/spiele/${game.id}`,
			previewHref: `/spielen/${game.id}?from=admin`
		}));

		return [...quizzes, ...games].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
	});

	let filtered = $derived(
		rows.filter((row) => {
			const matchesFilter = filter === 'alle' || row.kind === filter;
			const matchesSearch =
				!search ||
				row.title.toLowerCase().includes(search.toLowerCase()) ||
				row.typeLabel.toLowerCase().includes(search.toLowerCase());
			return matchesFilter && matchesSearch;
		})
	);

	let counts = $derived({
		alle: rows.length,
		quiz: rows.filter((row) => row.kind === 'quiz').length,
		html: rows.filter((row) => row.kind === 'html').length
	});

	const quizTypes: { type: Question['type']; title: string; description: string; icon: string }[] = [
		{
			type: 'mc',
			title: 'Multiple Choice',
			description: 'Eine Frage, mehrere Antwortoptionen, eine oder mehrere richtig.',
			icon: 'checklist'
		},
		{
			type: 'tf',
			title: 'Richtig / Falsch',
			description: 'Eine Aussage, die die Spielenden als wahr oder falsch einstufen.',
			icon: 'rule'
		},
		{
			type: 'image',
			title: 'Bilderrätsel',
			description: 'Visuelle Frage mit Auswahl- oder Eingabeantwort.',
			icon: 'image'
		},
		{
			type: 'match',
			title: 'Zuordnung',
			description: 'Begriffe oder Bilder einander zuordnen.',
			icon: 'join_inner'
		}
	];

	const quizTitles: Record<Question['type'], string> = {
		mc: 'Neues Multiple-Choice-Quiz',
		tf: 'Neues Richtig/Falsch-Quiz',
		image: 'Neues Bilderrätsel',
		match: 'Neue Zuordnungsaufgabe'
	};

	function createQuizOfType(type: Question['type']) {
		const quiz = content.createQuiz(content.modules[0]?.id ?? '');
		quiz.title = quizTitles[type];
		quiz.questions.push(emptyQuestion(type));
		content.updateQuiz(structuredClone($state.snapshot(quiz)));
		newOpen = false;
		goto(`/admin/quiz/${quiz.id}?step=questions`);
	}

	function createHtmlGame() {
		const game = content.createGame();
		newOpen = false;
		goto(`/admin/spiele/${game.id}?step=content`);
	}

	function deleteRow(row: Row) {
		if (row.kind === 'quiz') content.deleteQuiz(row.id);
		else content.deleteGame(row.id);
		toasts.push(row.kind === 'quiz' ? 'Quiz gelöscht' : 'Spiel gelöscht', 'info');
		pendingDelete = null;
	}
</script>

<svelte:head><title>Spiele · CMS</title></svelte:head>

<div class="flex flex-wrap items-start justify-between gap-3">
	<div>
		<h1 class="h1">Spiele</h1>
		<p class="text-ink-500">
			{rows.length} Einträge · Quizze und HTML-Spiele an einem Ort
		</p>
	</div>
	<button class="b1" onclick={() => (newOpen = true)}>+ Neues Spiel</button>
</div>

<div class="flex flex-wrap items-center gap-2">
	<div class="flex flex-wrap gap-1">
		{#each [{ id: 'alle', label: 'Alle' }, { id: 'quiz', label: 'Quizze' }, { id: 'html', label: 'HTML-Spiele' }] as option (option.id)}
			<button
				class="bdg {filter === option.id ? '' : '!bg-sand-100 !text-ink-700'}"
				onclick={() => (filter = option.id as typeof filter)}
			>
				{option.label} ({counts[option.id as keyof typeof counts]})
			</button>
		{/each}
	</div>
	<input class="inp !w-64" bind:value={search} placeholder="Suchen…" />
</div>

<div class="card overflow-x-auto !p-0">
	<table class="w-full min-w-[760px]">
		<thead>
			<tr>
				<th>Titel</th>
				<th>Modul</th>
				<th>Spielart</th>
				<th>Punkte</th>
				<th>Status</th>
				<th>Geändert</th>
				<th><span class="sr-only">Aktionen</span></th>
			</tr>
		</thead>
		<tbody>
			{#each filtered as row (row.kind + row.id)}
				<tr class="hover:bg-brand-50/50">
					<td>
						<a class="font-medium text-brand-700" href={row.editorHref}>{row.title}</a>
					</td>
					<td>{content.getModule(row.moduleId)?.title ?? '–'}</td>
					<td><span class="bdg">{row.typeLabel}</span></td>
					<td>{row.points}</td>
					<td>
						<span class="bdg {row.published ? '' : '!bg-amber-500/15 !text-amber-800'}">
							{row.published ? 'Veröffentlicht' : 'Entwurf'}
						</span>
					</td>
					<td class="text-[13px] text-ink-500">{formatDateTime(row.updatedAt)}</td>
					<td>
						<div class="flex items-center gap-1">
							<a
								class="rounded-lg p-1 text-ink-500 hover:bg-brand-50 hover:text-brand-700"
								href={row.editorHref}
								aria-label="Bearbeiten"
							>
								<Icon name="edit" size={18} />
							</a>
							<a
								class="rounded-lg p-1 text-ink-500 hover:bg-brand-50 hover:text-brand-700"
								href={row.previewHref}
								target="_blank"
								rel="noreferrer"
								aria-label="Vorschau öffnen"
							>
								<Icon name="play_arrow" size={18} />
							</a>
							<button
								class="rounded-lg p-1 text-ink-500 hover:bg-err-bg hover:text-danger-500"
								aria-label="Löschen"
								onclick={() => (pendingDelete = row)}
							>
								<Icon name="delete" size={18} />
							</button>
						</div>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>

	{#if filtered.length === 0}
		<div class="p-10 text-center text-ink-500">
			<Icon name="sports_esports" size={40} class="text-brand-100" />
			<p>Keine Spiele gefunden.</p>
		</div>
	{/if}
</div>

{#if newOpen}
	<div
		class="fixed inset-0 z-40 grid place-items-center overflow-y-auto bg-ink-900/50 p-4"
		role="dialog"
		aria-modal="true"
		aria-labelledby="new-game-title"
	>
		<div class="card my-auto w-full max-w-[760px] space-y-4">
			<div class="flex items-start justify-between gap-3">
				<div>
					<h2 id="new-game-title" class="font-serif text-2xl font-semibold">Neues Spiel anlegen</h2>
					<p class="text-[13px] text-ink-500">
						Fünf gleichwertige Spielarten – wähle den passenden Einstieg.
					</p>
				</div>
				<button class="b3 !p-2" aria-label="Schließen" onclick={() => (newOpen = false)}>
					<Icon name="close" />
				</button>
			</div>

			<div class="grid gap-3 sm:grid-cols-2">
				{#each quizTypes as option (option.type)}
					<button
						class="flex items-start gap-3 rounded-xl border border-sand-200 p-4 text-left transition hover:-translate-y-0.5 hover:border-brand-500 hover:shadow-md"
						onclick={() => createQuizOfType(option.type)}
					>
						<span class="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-brand-100 text-brand-700">
							<Icon name={option.icon} />
						</span>
						<span>
							<b class="block">{option.title}</b>
							<small class="text-ink-500">{option.description}</small>
						</span>
					</button>
				{/each}

				<button
					class="flex items-start gap-3 rounded-xl border border-sand-200 p-4 text-left transition hover:-translate-y-0.5 hover:border-brand-500 hover:shadow-md sm:col-span-2"
					onclick={createHtmlGame}
				>
					<span class="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-berry-500/20 text-berry-700">
						<Icon name="folder_zip" />
					</span>
					<span>
						<b class="block">HTML-Spiel (ZIP-Paket)</b>
						<small class="text-ink-500">
							Kompletten Ordner als ZIP hochladen – mit HTML, CSS, JS, Bildern, Audio und Video.
						</small>
					</span>
				</button>
			</div>

			<p class="text-[12px] text-ink-500">
				Quizze können später alle vier Frageformate mischen. HTML-Spiele laufen isoliert im iframe
				und kommunizieren über die Bridge.
			</p>
		</div>
	</div>
{/if}

{#if pendingDelete}
	<div
		class="fixed inset-0 z-40 grid place-items-center bg-ink-900/50 p-4"
		role="dialog"
		aria-modal="true"
		aria-labelledby="delete-title"
	>
		<div class="card w-full max-w-[420px] space-y-3">
			<span class="grid h-12 w-12 place-items-center rounded-full bg-err-bg text-danger-500">
				<Icon name="delete" />
			</span>
			<h2 id="delete-title" class="font-serif text-xl font-semibold">
				{pendingDelete.kind === 'quiz' ? 'Quiz löschen?' : 'Spiel löschen?'}
			</h2>
			<p>„{pendingDelete.title}" wird dauerhaft entfernt.</p>
			<div class="flex justify-end gap-2">
				<button class="b3" onclick={() => (pendingDelete = null)}>Abbrechen</button>
				<button class="b4" onclick={() => pendingDelete && deleteRow(pendingDelete)}>
					Endgültig löschen
				</button>
			</div>
		</div>
	</div>
{/if}
