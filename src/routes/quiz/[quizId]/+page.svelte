<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { content } from '$lib/stores/content.svelte';
	import { session } from '$lib/stores/session.svelte';
	import { storageKeys, write } from '$lib/storage/db';
	import type { LastResult, Question } from '$lib/types';
	import { formatDuration, normalize } from '$lib/utils';

	onMount(() => {
		if (!session.isLoggedIn) goto('/');
	});

	let quizId = $derived(page.params.quizId ?? '');
	let quiz = $derived(content.getQuiz(quizId));
	let adminPreview = $derived(page.url.searchParams.get('from') === 'admin');
	let backHref = $derived(
		adminPreview ? `/admin/quiz/${quizId}?step=questions` : `/lernen/${quiz?.moduleId ?? ''}`
	);

	let index = $state(0);
	let phase = $state<'question' | 'feedback'>('question');
	let lastCorrect = $state(false);
	let earned = $state(0);
	let results = $state<{ id: string; correct: boolean; points: number }[]>([]);
	let startedAt = $state(Date.now());
	let elapsed = $state(0);

	let selected = $state<string[]>([]);
	let tfAnswer = $state<boolean | null>(null);
	let inputAnswer = $state('');
	let pairs = $state<Record<string, string>>({});
	let activeLeft = $state<string | null>(null);
	let dragFrom = $state<string | null>(null);   // ID des linken Elements, das gezogen wird
	let dragPos = $state({ x: 0, y: 0 });         // Aktuelle Mausposition im Container
	let dragTarget = $state<string | null>(null); // ID des rechten Elements unter der Maus
	let dragJustEnded = $state(false);            // Schutz gegen Doppel-Klick nach Drag
	let clickImg = $state<HTMLImageElement>();
	let clickCanvas = $state<HTMLCanvasElement>();
	let clickDrawn = $state(false);
	let matchSvg = $state<SVGSVGElement>();
	let matchContainer = $state<HTMLDivElement>();

	let question = $derived<Question | undefined>(quiz?.questions[index]);
	let total = $derived(quiz?.questions.length ?? 0);
	let maxPoints = $derived(quiz?.questions.reduce((s, q) => s + q.points, 0) ?? 0);
	let questionPoints = $derived(question?.points ?? 0);

	$effect(() => {
		const timer = setInterval(() => (elapsed = Date.now() - startedAt), 1000);
		return () => clearInterval(timer);
	});

	function getMatchPos(side: 'left' | 'right', id: string): { x: number; y: number; w: number; h: number } | null {
		if (!matchContainer) return null;
		const btn = document.getElementById(`match-${side}-${id}`);
		if (!btn) return null;
		const rect = btn.getBoundingClientRect();
		const cr = matchContainer.getBoundingClientRect();
		return {
			x: rect.left - cr.left,
			y: rect.top - cr.top,
			w: rect.width,
			h: rect.height
		};
	}

	function optionCorrect(question: Question, optionId: string): boolean {
		if (question.type === 'mc' || question.type === 'image') {
			return Boolean(question.options?.find((o) => o.id === optionId)?.correct);
		}
		return false;
	}

	function toggleOption(id: string) {
		if (phase !== 'question' || !question) return;
		if (question.type === 'mc' && question.multiple) {
			selected = selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id];
		} else {
			selected = [id];
			check();
		}
	}

	function chooseTf(value: boolean) {
		if (phase !== 'question') return;
		tfAnswer = value;
		check();
	}

	function pointInPolygon(point: { x: number; y: number }, polygon: { x: number; y: number }[]): boolean {
		let inside = false;
		for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
			const xi = polygon[i].x,
				yi = polygon[i].y;
			const xj = polygon[j].x,
				yj = polygon[j].y;
			if (
				(yi > point.y) !== (yj > point.y) &&
				point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi
			) {
				inside = !inside;
			}
		}
		return inside;
	}

	function getClickPointFromEvent(event: MouseEvent): { x: number; y: number } | null {
		const target = event.currentTarget as HTMLElement;
		if (!target) return null;
		const rect = target.getBoundingClientRect();
		const mx = event.clientX - rect.left;
		const my = event.clientY - rect.top;
		if (mx < 0 || my < 0 || mx > rect.width || my > rect.height) return null;
		return { x: mx / rect.width, y: my / rect.height };
	}

	function onImageClick(event: MouseEvent) {
		if (phase !== 'question' || !question) return;
		const imgQuestion = question as { type: string; clickPolygon?: { x: number; y: number }[] };
		if (imgQuestion.type !== 'image' || !imgQuestion.clickPolygon || imgQuestion.clickPolygon.length < 3) return;
		const p = getClickPointFromEvent(event);
		if (!p) return;
		clickedImage = true;
		lastCorrect = pointInPolygon(p, imgQuestion.clickPolygon);
		if (lastCorrect) earned += question.points;
		results = [...results, { id: question.id, correct: lastCorrect, points: lastCorrect ? question.points : 0 }];
		phase = 'feedback';
		drawClickPolygon();
	}

	let clickedImage = $state(false);

	$effect(() => {
		if (question?.type === 'image' && (question as { mode: string }).mode === 'click' && clickImg && clickCanvas) {
			drawClickPolygon();
		}
	});

	function drawClickPolygon() {
		if (!clickImg || !clickCanvas) return;
		const ctx = clickCanvas.getContext('2d');
		if (!ctx) return;
		const rect = clickImg.getBoundingClientRect();
		clickCanvas.width = rect.width;
		clickCanvas.height = rect.height;
		ctx.clearRect(0, 0, rect.width, rect.height);
		const poly = (question as { clickPolygon?: { x: number; y: number }[] }).clickPolygon ?? [];
		if (poly.length === 0) return;
		ctx.beginPath();
		ctx.moveTo(poly[0].x * rect.width, poly[0].y * rect.height);
		for (let i = 1; i < poly.length; i++) {
			ctx.lineTo(poly[i].x * rect.width, poly[i].y * rect.height);
		}
		ctx.closePath();
		ctx.fillStyle = lastCorrect ? 'rgba(34, 197, 94, 0.35)' : 'rgba(239, 68, 68, 0.35)';
		ctx.fill();
		ctx.strokeStyle = lastCorrect ? '#22c55e' : '#ef4444';
		ctx.lineWidth = 3;
		ctx.stroke();
	}

	$effect(() => {
		if (question?.type === 'image' && (question as { mode: string }).mode === 'click' && clickImg && clickCanvas) {
			drawClickPolygon();
		}
	});

	$effect(() => {
		if (!matchSvg || !matchContainer || !question || question.type !== 'match') return;
		matchSvg.innerHTML = '';
		// Permanente Verbindungen
		for (const [leftId, rightId] of Object.entries(pairs)) {
			const leftPos = getMatchPos('left', leftId);
			const rightPos = getMatchPos('right', rightId);
			if (!leftPos || !rightPos) continue;
			const isCorrect = phase === 'feedback'
				? question.solution.some((p) => p.leftId === leftId && p.rightId === rightId)
				: false;
			const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
			line.setAttribute('x1', String(leftPos.x + leftPos.w));
			line.setAttribute('y1', String(leftPos.y + leftPos.h / 2));
			line.setAttribute('x2', String(rightPos.x));
			line.setAttribute('y2', String(rightPos.y + rightPos.h / 2));
			line.setAttribute('stroke', isCorrect ? '#22c55e' : '#ef4444');
			line.setAttribute('stroke-width', '3');
			line.setAttribute('stroke-linecap', 'round');
			line.setAttribute('opacity', phase === 'feedback' ? '1' : '0.45');
			matchSvg.appendChild(line);
		}
		// Drag-Faden (wenn gerade gezogen wird)
		if (dragFrom && question) {
			const leftPos = getMatchPos('left', dragFrom);
			if (leftPos) {
				const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
				line.setAttribute('x1', String(leftPos.x + leftPos.w));
				line.setAttribute('y1', String(leftPos.y + leftPos.h / 2));
				line.setAttribute('x2', String(dragPos.x));
				line.setAttribute('y2', String(dragPos.y));
				line.setAttribute('stroke', '#ef4444');
				line.setAttribute('stroke-width', '3');
				line.setAttribute('stroke-linecap', 'round');
				matchSvg.appendChild(line);
			}
		}
	});

	function startDrag(leftId: string, event: MouseEvent) {
		if (phase !== 'question' || !question) return;
		dragFrom = leftId;
		const rect = matchContainer?.getBoundingClientRect();
		if (rect) {
			dragPos = { x: event.clientX - rect.left, y: event.clientY - rect.top };
		}
		event.preventDefault();
	}

	function onDragMove(event: MouseEvent) {
		if (!dragFrom || !matchContainer || !question) return;
		const rect = matchContainer.getBoundingClientRect();
		dragPos = { x: event.clientX - rect.left, y: event.clientY - rect.top };
		dragTarget = null;
		const q = question as { right: { id: string }[] };
		for (const right of q.right) {
			const btn = document.getElementById(`match-right-${right.id}`);
			if (!btn) continue;
			const br = btn.getBoundingClientRect();
			if (
				event.clientX >= br.left &&
				event.clientX <= br.right &&
				event.clientY >= br.top &&
				event.clientY <= br.bottom
			) {
				dragTarget = right.id;
				break;
			}
		}
	}

	function endDrag() {
		if (!dragFrom) return;
		if (dragTarget) {
			assignPair(dragTarget);
		}
		dragFrom = null;
		dragTarget = null;
		dragJustEnded = true;
		setTimeout(() => (dragJustEnded = false), 80);
	}

	function cancelDrag() {
		dragFrom = null;
		dragTarget = null;
	}

	function isCorrect(): boolean {
		if (!question) return false;
		switch (question.type) {
			case 'mc':
			case 'image': {
				if (question.type === 'image' && question.mode === 'input') {
					const expected = normalize(question.answer ?? '');
					const given = normalize(inputAnswer);
					if (!expected || !given) return false;
					return question.tolerance === 'loose'
						? given.includes(expected) || expected.includes(given)
						: given === expected;
				}
				const correctIds = (question.options ?? [])
					.filter((o) => o.correct)
					.map((o) => o.id)
					.sort();
				const chosen = [...selected].sort();
				return correctIds.length === chosen.length && correctIds.every((id, i) => id === chosen[i]);
			}
			case 'tf':
				return tfAnswer === question.correct;
			case 'match':
				return (
					question.solution.length === Object.keys(pairs).length &&
					question.solution.every((pair) => pairs[pair.leftId] === pair.rightId)
				);
		}
	}

	let canCheck = $derived.by(() => {
		if (!question) return false;
		if (question.type === 'mc') return selected.length > 0;
		if (question.type === 'image' && question.mode === 'input') return inputAnswer.trim().length > 0;
		if (question.type === 'image') return selected.length > 0;
		if (question.type === 'tf') return tfAnswer !== null;
		if (question.type === 'match') return Object.keys(pairs).length === question.left.length;
		return false;
	});

	function check() {
		if (!question) return;
		lastCorrect = isCorrect();
		if (lastCorrect) earned += question.points;
		results = [...results, { id: question.id, correct: lastCorrect, points: lastCorrect ? question.points : 0 }];
		phase = 'feedback';
	}

	function resetAnswer() {
		selected = [];
		tfAnswer = null;
		inputAnswer = '';
		pairs = {};
		activeLeft = null;
		lastCorrect = false;
		phase = 'question';
	}

	function next() {
		if (!quiz) return;
		if (index + 1 < quiz.questions.length) {
			index += 1;
			resetAnswer();
			window.scrollTo({ top: 0, behavior: 'smooth' });
		} else {
			finish();
		}
	}

	function finish() {
		if (!quiz || !session.player) return;
		if (adminPreview) {
			goto(backHref);
			return;
		}
		const durationMs = Date.now() - startedAt;
		content.addScore({
			playerId: session.player.id,
			refType: 'quiz',
			refId: quiz.id,
			points: earned,
			maxPoints,
			durationMs
		});
		const result: LastResult = {
			refType: 'quiz',
			refId: quiz.id,
			title: quiz.title,
			points: earned,
			maxPoints,
			correct: results.filter((r) => r.correct).length,
			total: quiz.questions.length,
			durationMs,
			at: new Date().toISOString()
		};
		write(storageKeys.lastResult, result);
		goto(`/ergebnis/quiz/${quiz.id}`);
	}

	function assignPair(rightId: string) {
		if (!activeLeft) return;
		pairs = { ...pairs, [activeLeft]: rightId };
		activeLeft = null;
	}

	function rightText(id: string): string {
		if (!question || question.type !== 'match') return '';
		return question.right.find((r) => r.id === id)?.text ?? '';
	}

	function correctAnswerText(): string {
		if (!question) return '';
		switch (question.type) {
			case 'mc':
			case 'image':
				if (question.type === 'image' && question.mode === 'input') return question.answer ?? '';
				return (question.options ?? []).filter((o) => o.correct).map((o) => o.text).join(', ');
			case 'tf':
				return question.correct ? 'Richtig' : 'Falsch';
			case 'match':
				return question.solution
					.map((pair) => {
						const left = question.left.find((l) => l.id === pair.leftId)?.text;
						const right = question.right.find((r) => r.id === pair.rightId)?.text;
						return `${left} → ${right}`;
					})
					.join(', ');
		}
	}
</script>

<svelte:head><title>Quiz · {quiz?.title ?? 'Nutztierkosmos'}</title></svelte:head>

{#if !quiz}
	<main class="mx-auto max-w-3xl p-8">
		<div class="card text-center">
			<p class="mb-4">Dieses Quiz gibt es nicht (mehr).</p>
			<a class="b1" href="/lernen">Zurück zu den Modulen</a>
		</div>
	</main>
{:else if quiz.questions.length === 0}
	<main class="mx-auto max-w-3xl p-8">
		<div class="card text-center">
			<p class="mb-4">Dieses Quiz hat noch keine Fragen.</p>
			<a class="b1" href="/lernen">Zurück zu den Modulen</a>
		</div>
	</main>
{:else}
	<div class="mx-auto max-w-[760px] space-y-4 p-4">
		<div class="flex flex-wrap items-center gap-3">
			<button class="b3 !p-2" aria-label="Zurück" onclick={() => goto(backHref)}>
				<Icon name="arrow_back" />
			</button>
			<span class="flex-1 text-[13px] text-ink-500">
				{quiz.title} · Frage {index + 1} von {total}
			</span>
			<span class="bdg">{earned} P.</span>
			<span class="bdg !bg-sand-100 !text-ink-500">
				<Icon name="schedule" size={16} />{formatDuration(elapsed)}
			</span>
			<button class="b3" onclick={finish}>Beenden</button>
		</div>

		<div class="h-2 rounded-full bg-sand-200">
			<div class="h-2 rounded-full bg-lime-500" style:width="{((index + 1) / total) * 100}%"></div>
		</div>

		<div class="card space-y-4">
			{#if question}
				<p class="ovl">Frage {index + 1}</p>
				<h2 class="font-serif text-[26px] leading-tight font-semibold sm:text-[28px]">
					{question.prompt}
				</h2>

				{#if question.type === 'mc'}
					<div class="space-y-3">
						{#each question.options as option, i (option.id)}
							<button
								class="opt"
								class:sel={selected.includes(option.id)}
								class:ok={phase === 'feedback' && option.correct}
								class:err={phase === 'feedback' && selected.includes(option.id) && !option.correct}
								disabled={phase === 'feedback'}
								onclick={() => toggleOption(option.id)}
							>
								<b class="grid h-8 w-8 place-items-center rounded-lg bg-brand-100">
									{String.fromCharCode(65 + i)}
								</b>
								<span class="flex-1">{option.text}</span>
								{#if phase === 'feedback' && option.correct}
									<Icon name="check_circle" class="text-brand-600" />
								{/if}
							</button>
						{/each}
						{#if question.multiple}
							<p class="text-[13px] text-ink-500">Mehrfachauswahl möglich.</p>
						{/if}
					</div>
				{:else if question.type === 'tf'}
					<div class="grid gap-3 sm:grid-cols-2">
						<button
							class="opt justify-center py-8"
							class:sel={tfAnswer === true}
							class:ok={phase === 'feedback' && question.correct === true}
							class:err={phase === 'feedback' && tfAnswer === true && !question.correct}
							disabled={phase === 'feedback'}
							onclick={() => chooseTf(true)}
						>
							<Icon name="check_circle" /> Richtig
						</button>
						<button
							class="opt justify-center py-8"
							class:sel={tfAnswer === false}
							class:ok={phase === 'feedback' && question.correct === false}
							class:err={phase === 'feedback' && tfAnswer === false && question.correct}
							disabled={phase === 'feedback'}
							onclick={() => chooseTf(false)}
						>
							<Icon name="cancel" /> Falsch
						</button>
					</div>
				{:else if question.type === 'image'}
					<div class="grid aspect-video place-items-center rounded-xl bg-brand-100 text-brand-700">
						<div class="text-center">
							{#if question.image && question.image.length <= 4}
								<div class="text-6xl">{question.image}</div>
							{:else if question.image}
								<img src={question.image} alt="" class="max-h-48 rounded-lg" />
							{:else}
								<Icon name="image" size={54} />
							{/if}
							<p class="text-[13px]">Bild folgt</p>
						</div>
					</div>

					{#if question.mode === 'input'}
						<div class="flex flex-wrap gap-2">
							<input
								class="inp flex-1"
								bind:value={inputAnswer}
								placeholder="Antwort eingeben…"
								disabled={phase === 'feedback'}
								onkeydown={(e) => e.key === 'Enter' && canCheck && check()}
							/>
							<button class="b1" disabled={phase === 'feedback' || !canCheck} onclick={check}>
								Prüfen
							</button>
						</div>
					{:else if question.mode === 'click'}
						<div
							class="relative inline-block"
							role="button"
							tabindex="0"
							aria-label={question.clickInstruction ?? 'Auf dem Bild klicken'}
							onclick={onImageClick}
							onkeydown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault();
									onImageClick(e as unknown as MouseEvent);
								}
							}}
						>
							<img
								bind:this={clickImg}
								src={question.image}
								alt=""
								class="max-h-48 rounded-lg cursor-crosshair"
							/>
							<canvas
								bind:this={clickCanvas}
								class="absolute inset-0"
								style="pointer-events: none;"
							></canvas>
						</div>
						<p class="text-[13px] text-ink-700">
							{question.clickInstruction ?? 'Klicke in den markierten Bereich.'}
						</p>
						{#if phase === 'feedback'}
							<div class="text-[13px] font-semibold {lastCorrect ? 'text-brand-600' : 'text-danger-500'}">
								{lastCorrect ? 'Richtig!' : 'Falsch.'}
							</div>
						{/if}
					{:else}
						<div class="flex flex-wrap gap-2">
							{#each question.options ?? [] as option (option.id)}
								<button
									class="opt !w-auto"
									class:sel={selected.includes(option.id)}
									class:ok={phase === 'feedback' && option.correct}
									class:err={phase === 'feedback' && selected.includes(option.id) && !option.correct}
									disabled={phase === 'feedback'}
									onclick={() => toggleOption(option.id)}
								>
									{option.text}
								</button>
							{/each}
						</div>
					{/if}
				{:else if question.type === 'match'}
					<div class="relative min-h-[320px]">
						<!-- SVG-Overlay: echte Verbindungslinien von Button zu Button -->
						<svg
							bind:this={matchSvg}
							class="absolute inset-0 w-full h-full pointer-events-none"
							preserveAspectRatio="none"
							style="overflow: visible;"
						></svg>
						<div
							bind:this={matchContainer}
							class="grid grid-cols-2 gap-6 pt-6 pb-6"
							onmousemove={onDragMove}
							onmouseup={endDrag}
							onmouseleave={cancelDrag}
						>
							<div class="space-y-2">
								<p class="text-[12px] font-semibold text-ink-700">Links</p>
								{#each question.left as left (left.id)}
									{@const isCorrect = phase === 'feedback'
										? question.solution.some((p) => p.leftId === left.id && p.rightId === pairs[left.id])
										: false}
									{@const hasPair = !!pairs[left.id]}
									<button
										id={`match-left-${left.id}`}
										class="opt text-left py-3 rounded-xl border relative"
										class:border-brand-600={activeLeft === left.id || dragFrom === left.id}
										class:bg-brand-50={activeLeft === left.id || dragFrom === left.id}
										class:border-err-fg={phase === 'feedback' && hasPair && !isCorrect}
										class:bg-err-bg={phase === 'feedback' && hasPair && !isCorrect}
										class:border-ok-fg={phase === 'feedback' && hasPair && isCorrect}
										class:bg-ok-bg={phase === 'feedback' && hasPair && isCorrect}
										disabled={phase === 'feedback'}
										onclick={() => {
											if (!dragFrom) activeLeft = left.id;
										}}
									>
										<span class="flex-1 pr-6">{left.text}</span>
										<span
											class="absolute right-2 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 border-brand-600 bg-white shadow-sm"
											aria-hidden="true"
										/>
										{#if phase === 'feedback'}
											<Icon name={isCorrect ? 'check_circle' : 'cancel'} size={16} class={isCorrect ? 'text-brand-600' : 'text-danger-500'} />
										{:else if hasPair}
											<Icon name="link" size={16} class="text-brand-600" />
										{:else}
											<Icon name="link" size={16} class="text-ink-400" />
										{/if}
									</button>
								{/each}
							</div>
							<div class="space-y-2">
								<p class="text-[12px] font-semibold text-ink-700">Rechts</p>
								{#each question.right as right (right.id)}
									{@const userLeft = question.left.find((l) => pairs[l.id] === right.id)}
									{@const correctPair = question.solution.find((p) => p.rightId === right.id)}
									{@const correctLeftId = correctPair?.leftId ?? ''}
									{@const isCorrect = phase === 'feedback' && userLeft && userLeft.id === correctLeftId}
									{@const isAssigned = !!userLeft}
									<button
										id={`match-right-${right.id}`}
										class="opt text-left py-3 rounded-xl border relative"
										class:border-brand-600={activeLeft === null && isAssigned || dragTarget === right.id}
										class:bg-brand-50={activeLeft === null && isAssigned || dragTarget === right.id}
										class:border-err-fg={phase === 'feedback' && isAssigned && !isCorrect}
										class:bg-err-bg={phase === 'feedback' && isAssigned && !isCorrect}
										class:border-ok-fg={phase === 'feedback' && isCorrect}
										class:bg-ok-bg={phase === 'feedback' && isCorrect}
										disabled={phase === 'feedback'}
										onclick={() => {
											if (!dragJustEnded) assignPair(right.id);
										}}
									>
										<span class="flex-1 pl-6">{right.text}</span>
										<span
											class="absolute left-2 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 border-brand-600 bg-white shadow-sm"
											aria-hidden="true"
										/>
										{#if phase === 'feedback'}
											<Icon name={isCorrect ? 'check_circle' : 'cancel'} size={16} class={isCorrect ? 'text-brand-600' : 'text-danger-500'} />
										{:else if isAssigned}
											<Icon name="link" size={16} class="text-brand-600" />
										{:else}
											<Icon name="link" size={16} class="text-ink-400" />
										{/if}
									</button>
								{/each}
							</div>
						</div>

						<p class="text-[13px] text-ink-500 text-center mt-2">
							Klicke erst ein Element links, dann das passende rechts.
						</p>
					</div>
				{/if}

				{#if phase === 'feedback'}
					<div
						class="rounded-xl border-2 p-4 {lastCorrect
							? 'border-ok-fg bg-ok-bg'
							: 'border-err-fg bg-err-bg'}"
					>
						<b class="flex items-center gap-2">
							<Icon name={lastCorrect ? 'check_circle' : 'cancel'} />
							{lastCorrect ? 'Richtig!' : 'Nicht ganz.'}
							{#if lastCorrect}
								<span class="bdg">+{questionPoints} Punkte</span>
							{/if}
						</b>
						{#if question.explanation}
							<p class="mt-1 text-ink-700">{question.explanation}</p>
						{/if}
						{#if !lastCorrect}
							<p class="mt-2 text-[13px] text-ink-700">
								Richtig wäre: <b>{correctAnswerText()}</b>
							</p>
						{/if}
					</div>
				{/if}

				<div class="flex items-center justify-between">
					<span class="text-ink-500">Punkte: {earned}</span>
					{#if phase === 'question'}
						<button class="b1" disabled={!canCheck} onclick={check}>Prüfen</button>
					{:else}
						<button class="b1" onclick={next}>
							{index + 1 < total ? 'Weiter' : 'Auswerten'}
						</button>
					{/if}
				</div>
			{/if}
		</div>
	</div>
{/if}
