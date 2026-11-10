<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { content } from '$lib/stores/content.svelte';
	import { session } from '$lib/stores/session.svelte';
	import { storageKeys, write } from '$lib/storage/db';
	import {
		mediaAssetsOf,
		mediaIcon,
		mediaKindLabel,
		mediaKindOf,
		mediaSupportsPolygon,
		type LastResult,
		type MediaAsset,
		type MediaKind,
		type Question
	} from '$lib/types';
	import { formatDuration, normalize } from '$lib/utils';
	import { i18n } from '$lib/i18n.svelte';

	onMount(() => {
		// Quizze sind ohne Anmeldung spielbar (LB 5.5).
		if (quiz && !adminPreview) content.trackQuizStart(quiz.id);
		// Zählt echte Zeiger-Gesten. Der synthetisierte click nach einem Drag
		// hat keinen eigenen pointerdown und ist daran eindeutig erkennbar.
		const onDown = () => {
			pointerSequence += 1;
		};
		const onMove = (event: PointerEvent) => onDragMove(event);
		const onUp = (event: PointerEvent) => endDrag(event);
		const onCancel = (event: PointerEvent) => cancelDrag(event);
		window.addEventListener('pointerdown', onDown, true);
		window.addEventListener('pointermove', onMove);
		window.addEventListener('pointerup', onUp);
		window.addEventListener('pointercancel', onCancel);
		return () => {
			window.removeEventListener('pointerdown', onDown, true);
			window.removeEventListener('pointermove', onMove);
			window.removeEventListener('pointerup', onUp);
			window.removeEventListener('pointercancel', onCancel);
		};
	});

	let quizId = $derived(page.params.quizId ?? '');
	let quiz = $derived(content.getQuiz(quizId));
	let adminPreview = $derived(page.url.searchParams.get('from') === 'admin');
	let homeExhibition = $derived(quiz ? content.exhibitionWith({ quizId: quiz.id }) : undefined);
	let backHref = $derived(
		adminPreview
			? `/admin/quiz/${quizId}?step=questions`
			: homeExhibition && content.isPublic(homeExhibition)
				? `/ausstellung/${homeExhibition.slug}`
				: '/mitmachen'
	);
	/** Oberflächentexte in der Sprache des Quiz. */
	let en = $derived((quiz?.lang ?? 'de') === 'en');
	const L = (de: string, english: string) => (en ? english : de);

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
	type Box = { x: number; y: number; w: number; h: number };
	type MatchDrag = {
		leftId: string;
		pointerId: number;
		pointerType: string;
		startX: number;
		startY: number;
		x: number; // aktuelle Zeigerposition relativ zum Container
		y: number;
		moved: boolean;
		targetRight: string | null;
	};
	type MatchLine = {
		key: string;
		x1: number;
		y1: number;
		x2: number;
		y2: number;
		stroke: string;
	};

	// Paarliste statt Map: mit `allowMultiple` darf ein Begriff mehrere Ziele haben.
	type Pair = { leftId: string; rightId: string };
	let pairs = $state<Pair[]>([]);
	let selectedLeft = $state<string | null>(null);
	let drag = $state<MatchDrag | null>(null);
	// Ein echter neuer Klick hat einen eigenen pointerdown, der synthetisierte
	// click nach einem Drag nicht. So lässt sich der Drag-Click ohne zeitlichen
	// Guard (der schnelle Klicks verschluckt) sicher abfangen.
	let pointerSequence = 0;
	let suppressClickSeq = -1;
	let suppressClickTimer: ReturnType<typeof setTimeout> | undefined;
	let clickImg = $state<HTMLImageElement>();
	let clickCanvas = $state<HTMLCanvasElement>();
	let matchContainer = $state<HTMLDivElement>();
	// Gemessene Button-Positionen relativ zum SVG-Overlay (reaktiv, aber nur Messwerte).
	let matchGeometry = $state<{ left: Record<string, Box>; right: Record<string, Box> }>({
		left: {},
		right: {}
	});

	let question = $derived<Question | undefined>(quiz?.questions[index]);
	let total = $derived(quiz?.questions.length ?? 0);
	let maxPoints = $derived(quiz?.questions.reduce((s, q) => s + q.points, 0) ?? 0);
	let questionPoints = $derived(question?.points ?? 0);

	// Ein Bilderrätsel kann Bild/Galerie, Video, Infografik oder Audio zeigen.
	let mediaKind = $derived<MediaKind>(
		question?.type === 'image' ? mediaKindOf(question) : 'image'
	);
	let mediaAssets = $derived<MediaAsset[]>(
		question?.type === 'image' ? mediaAssetsOf(question) : []
	);
	let polygonAllowed = $derived(mediaSupportsPolygon(mediaKind));
	let galleryIndex = $state(0);
	$effect(() => {
		void question?.id;
		galleryIndex = 0;
	});
	let galleryCurrent = $derived(mediaAssets[Math.min(galleryIndex, mediaAssets.length - 1)]);
	// Der Klick-Bereich nutzt bewusst nur eine Bildquelle (Polygon auf einer Fläche).
	let clickSrc = $derived(
		question?.type === 'image'
			? (question.clickImageUrl ??
				question.image ??
				mediaAssets.find((a) => a.mime.startsWith('image/'))?.src ??
				'')
			: ''
	);

	$effect(() => {
		const timer = setInterval(() => (elapsed = Date.now() - startedAt), 1000);
		return () => clearInterval(timer);
	});

	function rightUnderPointer(clientX: number, clientY: number, generous = false): string | null {
		if (!matchContainer || !question || question.type !== 'match') return null;
		const cr = matchContainer.getBoundingClientRect();
		const x = clientX - cr.left;
		const y = clientY - cr.top;
		// Finger sind ungenauer als eine Maus: auf Touch großzügigere Trefferzone.
		const pad = generous ? 16 : 0;
		let nearest: { id: string; dist: number } | null = null;
		const boxes: Box[] = [];
		for (const right of question.right) {
			const b = matchGeometry.right[right.id];
			if (!b) continue;
			boxes.push(b);
			if (x >= b.x - pad && x <= b.x + b.w + pad && y >= b.y - pad && y <= b.y + b.h + pad) {
				return right.id;
			}
			const dist = Math.abs(y - (b.y + b.h / 2));
			if (!nearest || dist < nearest.dist) nearest = { id: right.id, dist };
		}
		if (!generous || !nearest || boxes.length === 0) return null;
		// In der rechten Spalte, aber knapp neben einem Button: nächstes Ziel nehmen.
		const colLeft = Math.min(...boxes.map((b) => b.x)) - 24;
		const colRight = Math.max(...boxes.map((b) => b.x + b.w)) + 24;
		return x >= colLeft && x <= colRight ? nearest.id : null;
	}

	function measureMatch() {
		if (!matchContainer || !question || question.type !== 'match') return;
		const cr = matchContainer.getBoundingClientRect();
		const read = (side: 'left' | 'right', ids: string[]): Record<string, Box> => {
			const out: Record<string, Box> = {};
			for (const id of ids) {
				const btn = document.getElementById(`match-${side}-${id}`);
				if (!btn) continue;
				const r = btn.getBoundingClientRect();
				out[id] = { x: r.left - cr.left, y: r.top - cr.top, w: r.width, h: r.height };
			}
			return out;
		};
		matchGeometry = {
			left: read('left', question.left.map((l) => l.id)),
			right: read('right', question.right.map((r) => r.id))
		};
	}

	// Reine Ableitung aus Zustand + gemessener Geometrie. Kein innerHTML, kein
	// imperatives Nachmalen: die Linien können nicht mehr "weggeblitzt" werden.
	let matchLines = $derived.by((): MatchLine[] => {
		if (!question || question.type !== 'match') return [];
		const q = question;
		return pairs.flatMap(({ leftId, rightId }): MatchLine[] => {
			const l = matchGeometry.left[leftId];
			const r = matchGeometry.right[rightId];
			if (!l || !r) return [];
			const correct =
				phase === 'feedback' &&
				q.solution.some((p) => p.leftId === leftId && p.rightId === rightId);
			return [
				{
					key: `${leftId}::${rightId}`,
					x1: l.x + l.w,
					y1: l.y + l.h / 2,
					x2: r.x,
					y2: r.y + r.h / 2,
					stroke: correct ? '#22c55e' : '#ef4444'
				}
			];
		});
	});

	// Eine einzige Vorschau-Linie während des Drags. Sie ist ein normales
	// deklaratives <line>-Element: Svelte aktualisiert nur dessen Attribute,
	// es entstehen keine mehrfachen oder stehenbleibenden Pinselspuren.
	let dragPreview = $derived.by((): MatchLine | null => {
		if (!drag || !drag.moved) return null;
		const l = matchGeometry.left[drag.leftId];
		if (!l) return null;
		return {
			key: 'drag-preview',
			x1: l.x + l.w,
			y1: l.y + l.h / 2,
			x2: drag.x,
			y2: drag.y,
			stroke: '#ef4444'
		};
	});

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

	// Positionen nach DOM-/Layout-Änderungen neu vermessen. Die Drag-Linie
	// wird deklarativ gerendert, daher gibt es keine Geisterspuren.
	$effect(() => {
		const container = matchContainer;
		const q = question;
		const pairCount = pairs.length;
		const inFeedback = phase === 'feedback';
		if (!container || !q || q.type !== 'match') return;
		// Absichtlich gelesen: nach Zuordnung / Phasenwechsel kann sich die Geometrie
		// geringfügig ändern (Border/Klassen), also neu messen.
		void pairCount;
		void inFeedback;
		const ro = new ResizeObserver(() => measureMatch());
		ro.observe(container);
		window.addEventListener('resize', measureMatch);
		const frame = requestAnimationFrame(() => measureMatch());
		return () => {
			cancelAnimationFrame(frame);
			ro.disconnect();
			window.removeEventListener('resize', measureMatch);
		};
	});

	function startDrag(leftId: string, event: PointerEvent) {
		if (phase !== 'question' || !question || question.type !== 'match') return;
		// Nur erster Finger bzw. linke Maustaste; kein zweiter Drag parallel.
		if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0) || drag) return;
		// Bei Maus Textauswahl / natives Ziehen verhindern. Auf Touch übernimmt
		// touch-action:none das; preventDefault würde dort den Tap-Click stören.
		if (event.pointerType === 'mouse') event.preventDefault();
		measureMatch(); // Geometrie auch nach Scrollen / Resize aktuell halten
		const cr = matchContainer?.getBoundingClientRect();
		drag = {
			leftId,
			pointerId: event.pointerId,
			pointerType: event.pointerType,
			startX: event.clientX,
			startY: event.clientY,
			x: event.clientX - (cr?.left ?? 0),
			y: event.clientY - (cr?.top ?? 0),
			moved: false,
			targetRight: null
		};
	}

	function onDragMove(event: PointerEvent) {
		if (!drag || event.pointerId !== drag.pointerId) return;
		const distance = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);
		if (distance > 6) drag.moved = true;
		const cr = matchContainer?.getBoundingClientRect();
		drag.x = event.clientX - (cr?.left ?? 0);
		drag.y = event.clientY - (cr?.top ?? 0);
		drag.targetRight = drag.moved
			? rightUnderPointer(event.clientX, event.clientY, drag.pointerType !== 'mouse')
			: null;
	}

	function endDrag(event: PointerEvent) {
		const current = drag;
		if (!current || event.pointerId !== current.pointerId) return;
		drag = null;
		if (!current.moved) return; // einfacher Tap -> der click übernimmt die Auswahl
		const rightId =
			rightUnderPointer(event.clientX, event.clientY, current.pointerType !== 'mouse') ??
			current.targetRight;
		selectedLeft = null;
		armSuppressClick();
		if (rightId) connectPair(current.leftId, rightId);
	}

	function cancelDrag(event?: PointerEvent) {
		if (event && drag && event.pointerId !== drag.pointerId) return;
		const wasMoved = drag?.moved ?? false;
		drag = null;
		if (wasMoved) armSuppressClick();
	}

	function armSuppressClick() {
		suppressClickSeq = pointerSequence;
		if (suppressClickTimer) clearTimeout(suppressClickTimer);
		// Nur Sicherheitsnetz zum Aufräumen. Unterdrückt wird ausschließlich der
		// click ohne eigenen pointerdown, der direkt auf diesen Drag folgt.
		suppressClickTimer = setTimeout(() => (suppressClickSeq = -1), 1000);
	}

	function clearSuppressClick() {
		suppressClickSeq = -1;
		if (suppressClickTimer) clearTimeout(suppressClickTimer);
		suppressClickTimer = undefined;
	}

	function isDragClick(event: MouseEvent): boolean {
		if (suppressClickSeq < 0) return false;
		if (event.detail === 0) return false; // Tastatur / programmatisch
		if (suppressClickSeq !== pointerSequence) {
			// Neuer pointerdown dazwischen: echter, eigenständiger Klick.
			clearSuppressClick();
			return false;
		}
		clearSuppressClick();
		return true;
	}

	function selectLeft(leftId: string, event: MouseEvent) {
		if (isDragClick(event) || phase !== 'question') return;
		selectedLeft = selectedLeft === leftId ? null : leftId;
	}

	function chooseRight(rightId: string, event: MouseEvent) {
		if (isDragClick(event)) return;
		if (phase !== 'question' || !selectedLeft) return;
		connectPair(selectedLeft, rightId, true);
		selectedLeft = null;
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
			case 'match': {
				const expected = question.solution.map(pairKey).sort();
				const given = pairs.map(pairKey).sort();
				return expected.length === given.length && expected.every((k, i) => k === given[i]);
			}
		}
	}

	let canCheck = $derived.by(() => {
		if (!question) return false;
		if (question.type === 'mc') return selected.length > 0;
		if (question.type === 'image' && question.mode === 'input') return inputAnswer.trim().length > 0;
		if (question.type === 'image' && question.mode === 'click')
			return polygonAllowed ? selected.length > 0 : true;
		if (question.type === 'image') return selected.length > 0;
		if (question.type === 'tf') return tfAnswer !== null;
		if (question.type === 'match')
			return question.allowMultiple ? pairs.length > 0 : pairs.length === question.left.length;
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
		pairs = [];
		selectedLeft = null;
		drag = null;
		clearSuppressClick();
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

	function pairKey(p: Pair): string {
		return `${p.leftId}::${p.rightId}`;
	}

	function rightsForLeft(leftId: string): string[] {
		return pairs.filter((p) => p.leftId === leftId).map((p) => p.rightId);
	}

	function leftsForRight(rightId: string): string[] {
		return pairs.filter((p) => p.rightId === rightId).map((p) => p.leftId);
	}

	function solutionRightsForLeft(leftId: string): string[] {
		return question?.type === 'match'
			? question.solution.filter((p) => p.leftId === leftId).map((p) => p.rightId)
			: [];
	}

	function solutionLeftsForRight(rightId: string): string[] {
		return question?.type === 'match'
			? question.solution.filter((p) => p.rightId === rightId).map((p) => p.leftId)
			: [];
	}

	function connectPair(leftId: string, rightId: string, toggle = false) {
		if (phase !== 'question' || !question || question.type !== 'match') return;
		if (!question.left.some((l) => l.id === leftId) || !question.right.some((r) => r.id === rightId)) {
			return;
		}
		if (question.allowMultiple) {
			const exists = pairs.some((p) => p.leftId === leftId && p.rightId === rightId);
			if (exists) {
				// Erneuter Klick auf dieselbe Verbindung entfernt sie.
				if (toggle)
					pairs = pairs.filter((p) => !(p.leftId === leftId && p.rightId === rightId));
				return;
			}
			pairs = [...pairs, { leftId, rightId }];
			return;
		}
		// 1:1: weder Begriff noch Kategorie darf doppelt vorkommen.
		pairs = [
			...pairs.filter((p) => p.leftId !== leftId && p.rightId !== rightId),
			{ leftId, rightId }
		];
	}

	function correctAnswerText(): string {
		if (!question) return '';
		switch (question.type) {
			case 'mc':
			case 'image':
				if (question.type === 'image' && question.mode === 'input') return question.answer ?? '';
				return (question.options ?? []).filter((o) => o.correct).map((o) => o.text).join(', ');
			case 'tf':
				return question.correct ? L('Richtig', 'True') : L('Falsch', 'False');
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

<a class="skip-link" href="#quiz-main">{L('Zur Frage springen', 'Skip to question')}</a>

{#if !quiz}
	<main class="mx-auto max-w-3xl p-8">
		<div class="card text-center">
			<p class="mb-4">{i18n.active === 'en' ? 'This quiz does not exist (any more).' : 'Dieses Quiz gibt es nicht (mehr).'}</p>
			<a class="b1" href="/mitmachen">{i18n.active === 'en' ? 'All quizzes' : 'Alle Quizze'}</a>
		</div>
	</main>
{:else if quiz.questions.length === 0}
	<main class="mx-auto max-w-3xl p-8">
		<div class="card text-center">
			<p class="mb-4">{L('Dieses Quiz hat noch keine Fragen.', 'This quiz has no questions yet.')}</p>
			<a class="b1" href={backHref}>{L('Zurück', 'Back')}</a>
		</div>
	</main>
{:else}
	<div class="mx-auto max-w-[760px] space-y-4 p-4" lang={quiz.lang ?? 'de'} id="quiz-main">
		<div class="flex flex-wrap items-center gap-3">
			<button class="b3 !p-2" aria-label={L('Zurück', 'Back')} onclick={() => goto(backHref)}>
				<Icon name="arrow_back" />
			</button>
			<span class="flex-1 text-[13px] text-ink-500">
				{quiz.title} · {L('Frage', 'Question')} {index + 1} {L('von', 'of')} {total}
			</span>
			<span class="bdg" aria-label="{earned} {L('Punkte', 'points')}">{earned} {L('P.', 'pts')}</span>
			<span class="bdg !bg-sand-100 !text-ink-500">
				<Icon name="schedule" size={16} />{formatDuration(elapsed)}
			</span>
			<button class="b3" onclick={finish}>{L('Beenden', 'Finish')}</button>
		</div>

		<div class="h-2 rounded-full bg-sand-200" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={index + 1} aria-label={L('Fortschritt', 'Progress')}>
			<div class="h-2 rounded-full bg-lime-500" style:width="{((index + 1) / total) * 100}%"></div>
		</div>

		<div class="card space-y-4" class:match-card={question?.type === 'match'}>
			{#if question}
				<p class="ovl">{L('Frage', 'Question')} {index + 1}</p>
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
							<p class="text-[13px] text-ink-500">{L('Mehrfachauswahl möglich.', 'Multiple answers possible.')}</p>
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
							<Icon name="check_circle" /> {L('Richtig', 'True')}
						</button>
						<button
							class="opt justify-center py-8"
							class:sel={tfAnswer === false}
							class:ok={phase === 'feedback' && question.correct === false}
							class:err={phase === 'feedback' && tfAnswer === false && question.correct}
							disabled={phase === 'feedback'}
							onclick={() => chooseTf(false)}
						>
							<Icon name="cancel" /> {L('Falsch', 'False')}
						</button>
					</div>
				{:else if question.type === 'image'}
					{#if question.mode !== 'click'}
						<div class="rounded-xl bg-brand-100 text-brand-700">
							{#if mediaAssets.length === 0}
								<div class="grid aspect-video place-items-center">
									<div class="text-center">
										<Icon name={mediaIcon[mediaKind]} size={54} />
										<p class="text-[13px]">Medium folgt</p>
										<p class="mt-1 text-[12px] opacity-80">{mediaKindLabel[mediaKind]}</p>
									</div>
								</div>
							{:else if mediaKind === 'video'}
								<video
									class="aspect-video w-full rounded-xl bg-black object-contain"
									controls
									preload="metadata"
									src={mediaAssets[0].src}
								>
									<track kind="captions" />
								</video>
							{:else if mediaKind === 'audio'}
								<div class="grid aspect-video place-items-center gap-3 p-6">
									<Icon name="audio_file" size={54} />
									<p class="max-w-full truncate text-[13px] font-semibold text-ink-700">
										{mediaAssets[0].name}
									</p>
									<audio
										class="w-full max-w-md"
										controls
										preload="metadata"
										src={mediaAssets[0].src}
									></audio>
								</div>
							{:else if mediaAssets.length === 1}
								<div class="grid aspect-video place-items-center p-2">
									{#if mediaAssets[0].mime.startsWith('image/')}
										<img
											src={mediaAssets[0].src}
											alt={mediaAssets[0].name}
											class="max-h-full max-w-full rounded-lg object-contain"
										/>
									{:else}
										<div class="text-center">
											<div class="text-6xl">{mediaAssets[0].src}</div>
											<p class="text-[13px]">Bild folgt</p>
										</div>
									{/if}
								</div>
							{:else}
								<!-- Bildergalerie: großes Bild plus Thumbnail-Navigation. -->
								<div class="p-2">
									<div class="relative grid aspect-video place-items-center">
										{#if galleryCurrent}
											<img
												src={galleryCurrent.src}
												alt={galleryCurrent.name}
												class="max-h-full max-w-full rounded-lg object-contain"
											/>
										{/if}
										<button
											class="absolute left-2 rounded-full bg-white/80 px-2 py-1 text-ink-700 disabled:opacity-40"
											aria-label={L('Vorheriges Bild', 'Previous image')}
											disabled={galleryIndex === 0}
											onclick={() => (galleryIndex = Math.max(0, galleryIndex - 1))}
										>
											<Icon name="chevron_left" size={18} />
										</button>
										<button
											class="absolute right-2 rounded-full bg-white/80 px-2 py-1 text-ink-700 disabled:opacity-40"
											aria-label={L('Nächstes Bild', 'Next image')}
											disabled={galleryIndex >= mediaAssets.length - 1}
											onclick={() =>
												(galleryIndex = Math.min(mediaAssets.length - 1, galleryIndex + 1))}
										>
											<Icon name="chevron_right" size={18} />
										</button>
									</div>
									<div class="mt-2 flex gap-2 overflow-x-auto">
										{#each mediaAssets as asset, i (asset.id)}
											<button
												class="h-12 w-16 shrink-0 overflow-hidden rounded-lg border-2 {i === galleryIndex
													? 'border-brand-600'
													: 'border-transparent'}"
												aria-label={`Bild ${i + 1} anzeigen`}
												onclick={() => (galleryIndex = i)}
											>
												<img src={asset.src} alt="" class="h-full w-full object-cover" />
											</button>
										{/each}
									</div>
								</div>
							{/if}
						</div>
						{#if mediaAssets.length > 1}
							<p class="mt-1 text-[12px] text-ink-500">
								{L('Bild', 'Image')} {galleryIndex + 1} / {mediaAssets.length}
							</p>
						{/if}
					{/if}

					{#if question.mode === 'input'}
						<div class="flex flex-wrap gap-2">
							<input
								class="inp flex-1"
								bind:value={inputAnswer}
								placeholder={L('Antwort eingeben…', 'Type your answer…')}
								disabled={phase === 'feedback'}
								onkeydown={(e) => e.key === 'Enter' && canCheck && check()}
							/>
							<button class="b1" disabled={phase === 'feedback' || !canCheck} onclick={check}>
								Prüfen
							</button>
						</div>
					{:else if question.mode === 'click'}
						{#if !polygonAllowed || !clickSrc}
							<p class="text-[13px] text-amber-500">
								{#if !polygonAllowed}
									Ein Klick-Bereich ist nur bei Bildern und Infografiken möglich.
								{:else}
									Für den Klick-Bereich wurde noch kein Bild hinterlegt.
								{/if}
							</p>
						{:else}
							<div
								class="relative inline-block"
								role="button"
								tabindex="0"
								aria-label={question.clickInstruction ?? L('Auf dem Bild klicken', 'Click on the image')}
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
									src={clickSrc}
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
								{question.clickInstruction ?? L('Klicke in den markierten Bereich.', 'Click the marked area.')}
							</p>
							{#if phase === 'feedback'}
								<div class="text-[13px] font-semibold {lastCorrect ? 'text-brand-600' : 'text-danger-500'}">
									{lastCorrect ? L('Richtig!', 'Correct!') : L('Falsch.', 'Wrong.')}
								</div>
							{/if}
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
						<!-- Deklaratives SVG-Overlay: eine Linie pro gespeichertem Paar
						     plus einer Vorschau-Linie während des Drags. -->
						<svg
							class="absolute inset-0 w-full h-full pointer-events-none"
							style="overflow: visible;"
							aria-hidden="true"
						>
							{#each matchLines as line (line.key)}
								<line
									x1={line.x1}
									y1={line.y1}
									x2={line.x2}
									y2={line.y2}
									stroke={line.stroke}
									stroke-width="3"
									stroke-linecap="round"
								></line>
							{/each}
							{#if dragPreview}
								<line
									x1={dragPreview.x1}
									y1={dragPreview.y1}
									x2={dragPreview.x2}
									y2={dragPreview.y2}
									stroke={dragPreview.stroke}
									stroke-width="3"
									stroke-linecap="round"
									stroke-dasharray="7 5"
									opacity="0.75"
								></line>
							{/if}
						</svg>
						<div bind:this={matchContainer} class="match-grid grid grid-cols-2 gap-3 sm:gap-6 pt-6 pb-6">
							<div class="space-y-2">
								<p class="text-[12px] font-semibold text-ink-700">{L('Links', 'Left')}</p>
								{#each question.left as left (left.id)}
									{@const connected = rightsForLeft(left.id)}
									{@const hasPair = connected.length > 0}
									{@const isCorrect = phase === 'feedback' && connected.length > 0 && connected.every((r) => solutionRightsForLeft(left.id).includes(r)) && solutionRightsForLeft(left.id).every((r) => connected.includes(r))}
									<button
										id={`match-left-${left.id}`}
										class="match-opt match-drag opt text-left py-3 rounded-xl border relative"
										class:border-brand-600={selectedLeft === left.id || drag?.leftId === left.id}
										class:bg-brand-50={selectedLeft === left.id || drag?.leftId === left.id}
										class:border-err-fg={phase === 'feedback' && hasPair && !isCorrect}
										class:bg-err-bg={phase === 'feedback' && hasPair && !isCorrect}
										class:border-ok-fg={phase === 'feedback' && hasPair && isCorrect}
										class:bg-ok-bg={phase === 'feedback' && hasPair && isCorrect}
										disabled={phase === 'feedback'}
										onpointerdown={(e) => startDrag(left.id, e)}
										onclick={(e) => selectLeft(left.id, e)}
									>
										<span class="match-label flex-1 pr-6">{left.text}</span>
										<span
											class="match-dot match-dot-start absolute right-2 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 border-brand-600 bg-white shadow-sm"
											aria-hidden="true"
										></span>
										{#if phase === 'feedback'}
											<Icon name={isCorrect ? 'check_circle' : 'cancel'} size={16} class={isCorrect ? 'text-brand-600' : 'text-danger-500'} />
										{:else if hasPair}
											<Icon name="link" size={16} class="match-state-icon text-brand-600" />
										{:else}
											<Icon name="link" size={16} class="match-state-icon text-ink-400" />
										{/if}
									</button>
								{/each}
							</div>
							<div class="space-y-2">
								<p class="text-[12px] font-semibold text-ink-700">{L('Rechts', 'Right')}</p>
								{#each question.right as right (right.id)}
									{@const assigned = leftsForRight(right.id)}
									{@const isAssigned = assigned.length > 0}
									{@const isCorrect = phase === 'feedback' && assigned.length > 0 && assigned.every((l) => solutionLeftsForRight(right.id).includes(l)) && solutionLeftsForRight(right.id).every((l) => assigned.includes(l))}
									<button
										id={`match-right-${right.id}`}
										class="match-opt opt text-left py-3 rounded-xl border relative"
										class:border-brand-600={isAssigned || drag?.targetRight === right.id}
										class:bg-brand-50={isAssigned || drag?.targetRight === right.id}
										class:border-err-fg={phase === 'feedback' && isAssigned && !isCorrect}
										class:bg-err-bg={phase === 'feedback' && isAssigned && !isCorrect}
										class:border-ok-fg={phase === 'feedback' && isCorrect}
										class:bg-ok-bg={phase === 'feedback' && isCorrect}
										disabled={phase === 'feedback'}
										onclick={(e) => chooseRight(right.id, e)}
									>
										<span class="match-label flex-1 pl-6">{right.text}</span>
										<span
											class="match-dot match-dot-end absolute left-2 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 border-brand-600 bg-white shadow-sm"
											aria-hidden="true"
										></span>
										{#if phase === 'feedback'}
											<Icon name={isCorrect ? 'check_circle' : 'cancel'} size={16} class={isCorrect ? 'text-brand-600' : 'text-danger-500'} />
										{:else if isAssigned}
											<Icon name="link" size={16} class="match-state-icon text-brand-600" />
										{:else}
											<Icon name="link" size={16} class="match-state-icon text-ink-400" />
										{/if}
									</button>
								{/each}
							</div>
						</div>

						{#if question.allowMultiple}
							<p class="text-[13px] text-ink-500 text-center mt-2">
								Mehrere Verbindungen sind erlaubt. Erneut auf eine Kategorie klicken entfernt die Verbindung.
							</p>
						{/if}
						<p class="text-[13px] text-ink-500 text-center mt-2">
							{L('Tippe oder klicke erst links, dann rechts – oder ziehe die Verbindung mit Maus oder Finger von links nach rechts.', 'Tap or click left, then right – or drag the connection from left to right with mouse or finger.')}
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
							{lastCorrect ? L('Richtig!', 'Correct!') : L('Nicht ganz.', 'Not quite.')}
							{#if lastCorrect}
								<span class="bdg">+{questionPoints} {L('Punkte', 'points')}</span>
							{/if}
						</b>
						{#if question.explanation}
							<p class="mt-1 text-ink-700">{question.explanation}</p>
						{/if}
						{#if !lastCorrect}
							<p class="mt-2 text-[13px] text-ink-700">
								{L('Richtig wäre', 'Correct answer')}: <b>{correctAnswerText()}</b>
							</p>
						{/if}
					</div>
				{/if}

				<div class="flex items-center justify-between">
					<span class="text-ink-500">{L('Punkte', 'Points')}: {earned}</span>
					{#if phase === 'question'}
						<button class="b1" disabled={!canCheck} onclick={check}>{L('Prüfen', 'Check')}</button>
					{:else}
						<button class="b1" onclick={next}>
							{index + 1 < total ? L('Weiter', 'Next') : L('Auswerten', 'See result')}
						</button>
					{/if}
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	/* Nur die linken Buttons sind Zieh-Griffe. touch-action:none verhindert, dass
	   der Browser die Berührung als Scroll-Geste übernimmt und pointercancel schickt. */
	.match-opt {
		touch-action: manipulation;
	}
	.match-opt.match-drag {
		touch-action: none;
		user-select: none;
	}

	/* Auf schmalen Displays: genug Platz zwischen den Spalten für sichtbare
	   Verbindungslinien, ohne dass lange Begriffe die Buttons aufdehnen. */
	@media (max-width: 639px) {
		.match-card {
			padding-left: 1rem;
			padding-right: 1rem;
		}
		.match-grid {
			column-gap: 1.75rem;
		}
		.match-opt {
			gap: 0.25rem;
			padding-left: 0.5rem;
			padding-right: 0.5rem;
			font-size: 13px;
			line-height: 1.35;
		}
		/* Das Link-Symbol ist auf dem Phone entbehrlich: Linie und Punkt zeigen
		   den Zustand. Der frei werdende Platz verhindert hässliche Wort-Umbrüche. */
		.match-opt :global(.match-state-icon) {
			display: none;
		}
		.match-label {
			min-width: 0;
			hyphens: auto;
			overflow-wrap: break-word;
			padding-left: 0.75rem;
			padding-right: 0.25rem;
		}
		/* Punkt mittig auf die Button-Kante: die Linie endet genau dort und
		   der Text braucht keinen Innenabstand dafür zu opfern. */
		.match-dot {
			width: 0.5rem;
			height: 0.5rem;
		}
		.match-dot-start {
			right: -0.3rem;
		}
		.match-dot-end {
			left: -0.3rem;
		}
	}

	/* Sehr schmale Geräte: noch etwas dichter, damit Begriffe wie
	   „Verdauungsorgan" nicht mitten im Wort umbrechen. */
	@media (max-width: 375px) {
		.match-grid {
			column-gap: 1.25rem;
		}
		.match-opt {
			font-size: 12px;
		}
		.match-label {
			padding-left: 0.375rem;
			padding-right: 0;
			letter-spacing: -0.01em;
		}
	}
</style>
