<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import type { MatchQuestion } from '$lib/types';
	import { uid } from '$lib/utils';
	import { onMount } from 'svelte';

	type Props = { question: MatchQuestion };
	let { question }: Props = $props();

	type Side = 'left' | 'right';
	type Box = { x: number; y: number; w: number; h: number };
	type Connection = { leftId: string; rightId: string };
	type Line = { key: string; x1: number; y1: number; x2: number; y2: number };
	type Drag = {
		leftId: string;
		pointerId: number;
		pointerType: string;
		startX: number;
		startY: number;
		x: number;
		y: number;
		moved: boolean;
		targetRight: string | null;
	};

	let board = $state<HTMLDivElement>();
	let geometry = $state<{ left: Record<string, Box>; right: Record<string, Box> }>({
		left: {},
		right: {}
	});
	let drag = $state<Drag | null>(null);
	let selectedLeft = $state<string | null>(null);
	let editing = $state<{ side: Side; id: string } | null>(null);

	// Ein echter neuer Klick hat einen eigenen pointerdown, der synthetisierte
	// Klick nach einem Drag nicht. So verschluckt die Unterdrückung keine
	// schnellen, echten Klicks.
	let pointerSequence = 0;
	let suppressClickSeq = -1;
	let suppressClickTimer: ReturnType<typeof setTimeout> | undefined;

	let solution = $derived<Connection[]>(question.solution ?? []);
	let allowMultiple = $derived(!!question.allowMultiple);
	let pairCount = $derived(solution.length);
	let layoutKey = $derived(
		JSON.stringify({
			l: (question.left ?? []).map((i) => [i.id, i.text]),
			r: (question.right ?? []).map((i) => [i.id, i.text]),
			s: pairCount,
			e: editing?.id ?? ''
		})
	);

	let validPairs = $derived(
		solution.filter(
			(p) =>
				question.left?.some((l) => l.id === p.leftId) &&
				question.right?.some((r) => r.id === p.rightId)
		)
	);

	function labelFor(side: Side, id: string): string {
		const list = side === 'left' ? question.left : question.right;
		return list?.find((i) => i.id === id)?.text || '–';
	}

	function addSide(side: Side) {
		const entry = { id: uid(), text: '' };
		if (side === 'left') question.left = [...(question.left ?? []), entry];
		else question.right = [...(question.right ?? []), entry];
		// Neuer Eintrag startet direkt im Bearbeitungsmodus.
		editing = { side, id: entry.id };
	}

	function removeSide(side: Side, id: string) {
		if (side === 'left') question.left = (question.left ?? []).filter((i) => i.id !== id);
		else question.right = (question.right ?? []).filter((i) => i.id !== id);
		question.solution = solution.filter((p) => p.leftId !== id && p.rightId !== id);
		if (editing?.id === id) editing = null;
		if (selectedLeft === id) selectedLeft = null;
	}

	function connect(leftId: string, rightId: string) {
		if (!question.left?.some((l) => l.id === leftId)) return;
		if (!question.right?.some((r) => r.id === rightId)) return;
		const current = question.solution ?? [];
		if (allowMultiple) {
			// Keine doppelte Linie: das Entfernen läuft über die Verbindungs-Chips.
			if (current.some((p) => p.leftId === leftId && p.rightId === rightId)) return;
			question.solution = [...current, { leftId, rightId }];
		} else {
			// 1:1: weder der Begriff noch die Kategorie darf zweimal vorkommen.
			question.solution = [
				...current.filter((p) => p.leftId !== leftId && p.rightId !== rightId),
				{ leftId, rightId }
			];
		}
	}

	function removePair(leftId: string, rightId: string) {
		question.solution = (question.solution ?? []).filter(
			(p) => !(p.leftId === leftId && p.rightId === rightId)
		);
	}

	function setAllowMultiple(value: boolean) {
		question.allowMultiple = value;
		if (value) return;
		// Beim Zurückschalten auf 1:1 die Daten bereinigen, damit keine
		// mehrfachen Verbindungen in einer Frage stehen bleiben.
		const seenLeft = new Set<string>();
		const seenRight = new Set<string>();
		question.solution = (question.solution ?? []).filter((p) => {
			if (seenLeft.has(p.leftId) || seenRight.has(p.rightId)) return false;
			seenLeft.add(p.leftId);
			seenRight.add(p.rightId);
			return true;
		});
	}

	function measure() {
		if (!board) return;
		const br = board.getBoundingClientRect();
		const next: { left: Record<string, Box>; right: Record<string, Box> } = { left: {}, right: {} };
		for (const node of board.querySelectorAll<HTMLElement>('[data-match-id]')) {
			const side = node.dataset.matchSide as Side;
			const id = node.dataset.matchId;
			if (!id || (side !== 'left' && side !== 'right')) continue;
			const r = node.getBoundingClientRect();
			next[side][id] = { x: r.left - br.left, y: r.top - br.top, w: r.width, h: r.height };
		}
		geometry = next;
	}

	$effect(() => {
		const el = board;
		void layoutKey;
		if (!el) return;
		const ro = new ResizeObserver(() => measure());
		ro.observe(el);
		for (const node of el.querySelectorAll('[data-match-id]')) ro.observe(node);
		const frame = requestAnimationFrame(measure);
		window.addEventListener('resize', measure);
		return () => {
			cancelAnimationFrame(frame);
			ro.disconnect();
			window.removeEventListener('resize', measure);
		};
	});

	let lines = $derived.by((): Line[] =>
		validPairs.flatMap((p): Line[] => {
			const l = geometry.left[p.leftId];
			const r = geometry.right[p.rightId];
			if (!l || !r) return [];
			return [
				{
					key: `${p.leftId}::${p.rightId}`,
					x1: l.x + l.w,
					y1: l.y + l.h / 2,
					x2: r.x,
					y2: r.y + r.h / 2
				}
			];
		})
	);

	let preview = $derived.by((): Line | null => {
		if (!drag || !drag.moved) return null;
		const l = geometry.left[drag.leftId];
		if (!l) return null;
		return {
			key: 'drag-preview',
			x1: l.x + l.w,
			y1: l.y + l.h / 2,
			x2: drag.x,
			y2: drag.y
		};
	});

	function rightUnderPointer(clientX: number, clientY: number, generous: boolean): string | null {
		if (!board) return null;
		const br = board.getBoundingClientRect();
		const x = clientX - br.left;
		const y = clientY - br.top;
		const pad = generous ? 16 : 0;
		const boxes: Box[] = [];
		let nearest: { id: string; dist: number } | null = null;
		for (const right of question.right ?? []) {
			const b = geometry.right[right.id];
			if (!b) continue;
			boxes.push(b);
			if (x >= b.x - pad && x <= b.x + b.w + pad && y >= b.y - pad && y <= b.y + b.h + pad) {
				return right.id;
			}
			const dist = Math.abs(y - (b.y + b.h / 2));
			if (!nearest || dist < nearest.dist) nearest = { id: right.id, dist };
		}
		if (!generous || !nearest || boxes.length === 0) return null;
		const colLeft = Math.min(...boxes.map((b) => b.x)) - 24;
		const colRight = Math.max(...boxes.map((b) => b.x + b.w)) + 24;
		return x >= colLeft && x <= colRight ? nearest.id : null;
	}

	function startDrag(leftId: string, event: PointerEvent) {
		if (editing?.id === leftId) return;
		if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0) || drag) return;
		// Auf Touch übernimmt touch-action:none das Verhindern von Scroll-Gesten.
		if (event.pointerType === 'mouse') event.preventDefault();
		measure();
		const br = board?.getBoundingClientRect();
		drag = {
			leftId,
			pointerId: event.pointerId,
			pointerType: event.pointerType,
			startX: event.clientX,
			startY: event.clientY,
			x: event.clientX - (br?.left ?? 0),
			y: event.clientY - (br?.top ?? 0),
			moved: false,
			targetRight: null
		};
	}

	function onDragMove(event: PointerEvent) {
		if (!drag || event.pointerId !== drag.pointerId) return;
		if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 6) drag.moved = true;
		const br = board?.getBoundingClientRect();
		drag.x = event.clientX - (br?.left ?? 0);
		drag.y = event.clientY - (br?.top ?? 0);
		drag.targetRight = drag.moved
			? rightUnderPointer(event.clientX, event.clientY, drag.pointerType !== 'mouse')
			: null;
	}

	function endDrag(event: PointerEvent) {
		const current = drag;
		if (!current || event.pointerId !== current.pointerId) return;
		drag = null;
		if (!current.moved) return; // einfacher Klick -> Auswahl über den click-Handler
		const rightId =
			rightUnderPointer(event.clientX, event.clientY, current.pointerType !== 'mouse') ??
			current.targetRight;
		selectedLeft = null;
		armSuppressClick();
		if (rightId) connect(current.leftId, rightId);
	}

	function cancelDrag(event: PointerEvent) {
		if (drag && event.pointerId === drag.pointerId) drag = null;
	}

	function armSuppressClick() {
		suppressClickSeq = pointerSequence;
		if (suppressClickTimer) clearTimeout(suppressClickTimer);
		suppressClickTimer = setTimeout(() => (suppressClickSeq = -1), 1000);
	}

	function clearSuppressClick() {
		if (suppressClickTimer) clearTimeout(suppressClickTimer);
		suppressClickSeq = -1;
	}

	function isDragClick(event: MouseEvent): boolean {
		if (suppressClickSeq < 0) return false;
		if (!event.detail) return false; // Tastatur / programmatisch
		if (suppressClickSeq !== pointerSequence) {
			clearSuppressClick();
			return false;
		}
		clearSuppressClick();
		return true;
	}

	function selectLeftCard(id: string) {
		selectedLeft = selectedLeft === id ? null : id;
	}

	function connectRightCard(id: string) {
		if (!selectedLeft) return;
		connect(selectedLeft, id);
		selectedLeft = null;
	}

	function clickLeft(id: string, event: MouseEvent) {
		if (isDragClick(event) || editing?.id === id) return;
		selectLeftCard(id);
	}

	function clickRight(id: string, event: MouseEvent) {
		if (isDragClick(event) || editing?.id === id) return;
		connectRightCard(id);
	}

	function focusInput(node: HTMLInputElement) {
		node.focus();
		node.select();
	}

	onMount(() => {
		const onDown = () => {
			pointerSequence += 1;
		};
		const onMove = (e: PointerEvent) => onDragMove(e);
		const onUp = (e: PointerEvent) => endDrag(e);
		const onCancel = (e: PointerEvent) => cancelDrag(e);
		window.addEventListener('pointerdown', onDown, true);
		window.addEventListener('pointermove', onMove);
		window.addEventListener('pointerup', onUp);
		window.addEventListener('pointercancel', onCancel);
		return () => {
			window.removeEventListener('pointerdown', onDown, true);
			window.removeEventListener('pointermove', onMove);
			window.removeEventListener('pointerup', onUp);
			window.removeEventListener('pointercancel', onCancel);
			clearSuppressClick();
		};
	});
</script>

<div data-match-editor class="space-y-3">
	<label class="flex items-center gap-2 text-[13px] font-semibold text-ink-700">
		<input
			id="q-match-multiple"
			type="checkbox"
			checked={allowMultiple}
			onchange={(e) => setAllowMultiple(e.currentTarget.checked)}
		/>
		Mehrere Verbindungen erlauben
	</label>
	<p class="text-[12px] text-ink-500">
		{#if allowMultiple}
			Ein Begriff darf mit mehreren Kategorien verbunden werden – auch beim Spielen im Quiz. Beim
			Abschalten werden überzählige Verbindungen entfernt.
		{:else}
			Jeder Begriff hat genau eine Verbindung. Mit der Checkbox sind auch mehrfache Verbindungen
			möglich – im Editor und im Quiz.
		{/if}
	</p>

	<p class="text-[12px] text-ink-500">
		Ziehe mit Maus oder Finger von einem linken Begriff zu einer rechten Kategorie – oder klicke
		erst links, dann rechts. Ein Klick auf eine Verbindung unten entfernt sie. Über den Stift
		änderst du den Text eines Eintrags.
	</p>

	<div bind:this={board} data-match-board class="match-editor-board">
		<svg class="match-editor-svg" aria-hidden="true">
			{#each lines as line (line.key)}
				<line
					x1={line.x1}
					y1={line.y1}
					x2={line.x2}
					y2={line.y2}
					stroke="#111111"
					stroke-width="3"
					stroke-linecap="round"
				></line>
			{/each}
			{#if preview}
				<line
					x1={preview.x1}
					y1={preview.y1}
					x2={preview.x2}
					y2={preview.y2}
					stroke="#111111"
					stroke-width="3"
					stroke-linecap="round"
					stroke-dasharray="7 5"
					opacity="0.75"
				></line>
			{/if}
		</svg>

		<div class="match-editor-grid">
			<div class="space-y-2">
				<p class="lbl">Links (Begriffe)</p>
				{#each question.left ?? [] as item (item.id)}
					<div
						class="match-editor-item"
						class:match-editor-selected={selectedLeft === item.id || drag?.leftId === item.id}
						data-match-id={item.id}
						data-match-side="left"
					>
						{#if editing?.side === 'left' && editing.id === item.id}
							<input
								class="inp match-editor-input"
								bind:value={item.text}
								placeholder="Begriff"
								aria-label="Begriff bearbeiten"
								use:focusInput
								onkeydown={(e) => e.key === 'Enter' && (editing = null)}
							/>
							<button
								class="match-editor-icon"
								aria-label="Text übernehmen"
								onclick={() => (editing = null)}
							>
								<Icon name="check" size={16} />
							</button>
						{:else}
							<button
								class="match-editor-main match-drag"
								aria-label={`${item.text || 'Begriff'} verbinden`}
								onpointerdown={(e) => startDrag(item.id, e)}
								onclick={(e) => clickLeft(item.id, e)}
							>
								<span class="match-editor-text" data-match-label>{item.text || '–'}</span>
							</button>
							<button
								class="match-editor-icon"
								aria-label={`${item.text || 'Begriff'} bearbeiten`}
								onclick={() => (editing = { side: 'left', id: item.id })}
							>
								<Icon name="edit" size={16} />
							</button>
							<button
								class="match-editor-icon match-editor-remove"
								aria-label={`${item.text || 'Begriff'} entfernen`}
								onclick={() => removeSide('left', item.id)}
							>
								<Icon name="close" size={16} />
							</button>
						{/if}
						<span class="match-editor-dot match-editor-dot-start" aria-hidden="true"></span>
					</div>
				{/each}
				<button class="b3" onclick={() => addSide('left')}>
					<Icon name="add" size={18} />Begriff
				</button>
			</div>

			<div class="space-y-2">
				<p class="lbl">Rechts (Kategorien)</p>
				{#each question.right ?? [] as item (item.id)}
					<div
						class="match-editor-item"
						class:match-editor-selected={drag?.targetRight === item.id}
						data-match-id={item.id}
						data-match-side="right"
					>
						{#if editing?.side === 'right' && editing.id === item.id}
							<input
								class="inp match-editor-input"
								bind:value={item.text}
								placeholder="Kategorie"
								aria-label="Kategorie bearbeiten"
								use:focusInput
								onkeydown={(e) => e.key === 'Enter' && (editing = null)}
							/>
							<button
								class="match-editor-icon"
								aria-label="Text übernehmen"
								onclick={() => (editing = null)}
							>
								<Icon name="check" size={16} />
							</button>
						{:else}
							<button
								class="match-editor-main"
								aria-label={`${item.text || 'Kategorie'} als Ziel wählen`}
								onclick={(e) => clickRight(item.id, e)}
							>
								<span class="match-editor-text" data-match-label>{item.text || '–'}</span>
							</button>
							<button
								class="match-editor-icon"
								aria-label={`${item.text || 'Kategorie'} bearbeiten`}
								onclick={() => (editing = { side: 'right', id: item.id })}
							>
								<Icon name="edit" size={16} />
							</button>
							<button
								class="match-editor-icon match-editor-remove"
								aria-label={`${item.text || 'Kategorie'} entfernen`}
								onclick={() => removeSide('right', item.id)}
							>
								<Icon name="close" size={16} />
							</button>
						{/if}
						<span class="match-editor-dot match-editor-dot-end" aria-hidden="true"></span>
					</div>
				{/each}
				<button class="b3" onclick={() => addSide('right')}>
					<Icon name="add" size={18} />Kategorie
				</button>
			</div>
		</div>
	</div>

	<div class="space-y-2">
		<p class="lbl mb-0">Verbindungen ({validPairs.length})</p>
		{#if validPairs.length === 0}
			<p class="text-[12px] text-ink-500">Noch keine Verbindung gezogen.</p>
		{:else}
			<div class="flex flex-wrap gap-2">
				{#each validPairs as pair (`${pair.leftId}::${pair.rightId}`)}
					<button
						class="match-editor-chip"
						data-pair-left={pair.leftId}
						data-pair-right={pair.rightId}
						aria-label={`Verbindung ${labelFor('left', pair.leftId)} – ${labelFor('right', pair.rightId)} entfernen`}
						onclick={() => removePair(pair.leftId, pair.rightId)}
					>
						<span>{labelFor('left', pair.leftId)} → {labelFor('right', pair.rightId)}</span>
						<Icon name="close" size={14} />
					</button>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	.match-editor-board {
		position: relative;
	}
	.match-editor-svg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		overflow: visible;
		pointer-events: none;
	}
	.match-editor-grid {
		position: relative;
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		column-gap: 3.5rem;
		row-gap: 0.25rem;
		align-items: start;
	}
	.match-editor-item {
		position: relative;
		display: flex;
		align-items: center;
		gap: 0.15rem;
		min-height: 2.75rem;
		padding: 0.35rem 0.45rem;
		border: 1px solid var(--color-sand-200);
		border-radius: 0.75rem;
		background: #fff;
	}
	.match-editor-selected {
		border-color: var(--color-brand-600);
		background: var(--color-brand-50);
	}
	.match-editor-main {
		display: flex;
		flex: 1;
		align-items: center;
		min-width: 0;
		border: 0;
		background: none;
		padding: 0.15rem 0.25rem;
		text-align: left;
		font-size: 13px;
		line-height: 1.35;
		color: var(--color-ink-700);
		cursor: pointer;
	}
	.match-editor-text {
		min-width: 0;
		overflow-wrap: anywhere;
	}
	.match-editor-input {
		flex: 1;
		min-width: 0;
		font-size: 13px;
	}
	.match-editor-icon {
		display: grid;
		flex: none;
		place-items: center;
		width: 1.6rem;
		height: 1.6rem;
		border-radius: 0.5rem;
		color: var(--color-ink-500);
	}
	.match-editor-icon:hover {
		background: var(--color-sand-100);
	}
	.match-editor-remove:hover {
		background: var(--color-err-bg);
		color: var(--color-danger-500);
	}
	.match-editor-dot {
		position: absolute;
		top: 50%;
		width: 0.6rem;
		height: 0.6rem;
		border: 2px solid var(--color-brand-600);
		border-radius: 9999px;
		background: #fff;
		transform: translateY(-50%);
	}
	.match-editor-dot-start {
		right: -0.3rem;
	}
	.match-editor-dot-end {
		left: -0.3rem;
	}
	.match-editor-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		border: 1px solid var(--color-sand-200);
		border-radius: 9999px;
		background: var(--color-sand-50);
		padding: 0.2rem 0.6rem;
		font-size: 12px;
		color: var(--color-ink-700);
	}
	.match-editor-chip:hover {
		border-color: var(--color-danger-500);
		background: var(--color-err-bg);
	}
	/* Nur die linken Zieh-Griffe blockieren Scroll-Gesten, damit ein Finger-Drag
	   nicht vom Browser als Scrollen interpretiert wird. */
	.match-drag {
		touch-action: none;
		user-select: none;
	}
	@media (max-width: 639px) {
		.match-editor-grid {
			column-gap: 1.75rem;
		}
		.match-editor-main {
			font-size: 12px;
		}
		.match-editor-item {
			padding-left: 0.3rem;
			padding-right: 0.3rem;
		}
	}
</style>
