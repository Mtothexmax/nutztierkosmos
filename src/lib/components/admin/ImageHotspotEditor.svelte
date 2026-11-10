<script lang="ts">
	import { untrack } from 'svelte';
	import Icon from '$lib/components/Icon.svelte';
	type Props = { question: any };
	let { question }: Props = $props();

	let canvas = $state<HTMLCanvasElement | null>(null);
	let image = $state<HTMLImageElement | null>(null);
	// Lokale, editierbare Kopie – bewusst nur mit dem Anfangswert initialisiert.
	let imageUrl = $state(untrack(() => question.clickImageUrl ?? question.image ?? ''));
	let points = $state<{ x: number; y: number }[]>(
		untrack(() => question.clickPolygon?.map((p: { x: number; y: number }) => ({ x: p.x, y: p.y })) ?? [])
	);
	let drawing = $state(false);
	let dragIndex = $state<number | null>(null);

	// Wenn sich das Bild im Question ändert, neu laden
	$effect(() => {
		if (question.image && question.image !== imageUrl) {
			imageUrl = question.image;
			loadImage();
		}
	});

	function loadImage() {
		if (!imageUrl) return;
		const img = new Image();
		img.onload = () => {
			image = img;
			if (canvas) draw();
		};
		img.src = imageUrl;
	}

	function getPointFromEvent(event: MouseEvent): { x: number; y: number } | null {
		if (!canvas || !image) return null;
		const rect = canvas.getBoundingClientRect();
		// Canvas zeigt das Bild im "contain"-Modus: berechne das tatsächliche Bild-Rechteck im Canvas
		const cw = rect.width;
		const ch = rect.height;
		const iw = image.naturalWidth;
		const ih = image.naturalHeight;
		const scale = Math.min(cw / iw, ch / ih);
		const bw = iw * scale;
		const bh = ih * scale;
		const bx = (cw - bw) / 2;
		const by = (ch - bh) / 2;

		const mx = event.clientX - rect.left - bx;
		const my = event.clientY - rect.top - by;
		if (mx < 0 || my < 0 || mx > bw || my > bh) return null;

		return { x: mx / bw, y: my / bh }; // normalisiert 0–1
	}

	function onCanvasClick(event: MouseEvent) {
		if (!drawing) return;
		const p = getPointFromEvent(event);
		if (!p) return;
		points.push(p);
		draw();
	}

	function onCanvasMouseDown(event: MouseEvent) {
		if (!drawing) return;
		const p = getPointFromEvent(event);
		if (!p) return;
		// Prüfen, ob auf existierenden Punkt geklickt (zum Verschieben)
		const idx = points.findIndex((pt) => Math.hypot(pt.x - p.x, pt.y - p.y) < 0.02);
		if (idx >= 0) dragIndex = idx;
		else points.push(p);
		draw();
	}

	function onCanvasMouseMove(event: MouseEvent) {
		if (dragIndex === null || !drawing) return;
		const p = getPointFromEvent(event);
		if (!p) return;
		points[dragIndex] = p;
		draw();
	}

	function onCanvasMouseUp() {
		dragIndex = null;
	}

	function toggleDrawing() {
		drawing = !drawing;
		dragIndex = null;
		if (canvas) {
			canvas.style.cursor = drawing ? 'crosshair' : 'default';
		}
		draw();
	}

	function removeLastPoint() {
		points.pop();
		draw();
	}

	function clearPolygon() {
		points = [];
		draw();
	}

	function save() {
		if (!question) return;
		question.clickPolygon = points.map((p) => ({ x: Number(p.x.toFixed(4)), y: Number(p.y.toFixed(4)) }));
		question.clickImageUrl = imageUrl;
		drawing = false;
	}

	function draw() {
		if (!canvas || !image) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const rect = canvas.getBoundingClientRect();
		ctx.clearRect(0, 0, rect.width, rect.height);

		// Bild im Canvas zeichnen (contain)
		const cw = rect.width;
		const ch = rect.height;
		const iw = image.naturalWidth;
		const ih = image.naturalHeight;
		const scale = Math.min(cw / iw, ch / ih);
		const bw = iw * scale;
		const bh = ih * scale;
		const bx = (cw - bw) / 2;
		const by = (ch - bh) / 2;
		ctx.drawImage(image, bx, by, bw, bh);

		if (points.length === 0) return;

		// Polygon füllen (halbtransparent)
		ctx.beginPath();
		ctx.moveTo(points[0].x * bw + bx, points[0].y * bh + by);
		for (let i = 1; i < points.length; i++) {
			ctx.lineTo(points[i].x * bw + bx, points[i].y * bh + by);
		}
		ctx.closePath();
		ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
		ctx.fill();
		ctx.strokeStyle = 'rgba(239, 68, 68, 0.9)';
		ctx.lineWidth = 2;
		ctx.stroke();

		// Punkte und Verbindungen
		ctx.fillStyle = '#ef4444';
		ctx.strokeStyle = '#ef4444';
		ctx.lineWidth = 2;
		for (let i = 0; i < points.length; i++) {
			const px = points[i].x * bw + bx;
			const py = points[i].y * bh + by;
			ctx.beginPath();
			ctx.arc(px, py, 5, 0, Math.PI * 2);
			ctx.fill();
			ctx.stroke();
			if (i > 0) {
				const p0x = points[i - 1].x * bw + bx;
				const p0y = points[i - 1].y * bh + by;
				ctx.beginPath();
				ctx.moveTo(p0x, p0y);
				ctx.lineTo(px, py);
				ctx.stroke();
			}
		}
		// Verbindung zum ersten Punkt (geschlossen)
		if (points.length > 2) {
			const last = points[points.length - 1];
			const first = points[0];
			ctx.beginPath();
			ctx.moveTo(last.x * bw + bx, last.y * bh + by);
			ctx.lineTo(first.x * bw + bx, first.y * bh + by);
			ctx.setLineDash([4, 4]);
			ctx.stroke();
			ctx.setLineDash([]);
		}
	}

	$effect(() => {
		if (canvas) canvas.style.cursor = drawing ? 'crosshair' : 'default';
		draw();
	});
</script>

<div class="space-y-3">
	{#if question.mode === 'click'}
		<div>
			<label class="lbl" for="hs-instr">Aufgabe / Anweisung</label>
			<textarea
				id="hs-instr"
				class="inp"
				rows="2"
				bind:value={question.clickInstruction}
				placeholder="z. B. Klicke auf die Milchkuh"
			></textarea>
			<p class="mt-1 text-[12px] text-ink-500">
				Die Spielenden müssen in den markierten Bereich klicken.
			</p>
		</div>

		<div>
			<label class="lbl" for="hs-img">Bild</label>
			<div class="flex flex-wrap gap-2">
				<label class="flex items-center gap-2 rounded-xl border border-sand-200 bg-sand-50 p-3 cursor-pointer">
					<Icon name="image" class="text-ink-500" />
					<span>Bilddatei wählen</span>
					<input
						id="hs-img"
						type="file"
						accept="image/*"
						class="hidden"
						onchange={(e) => {
							const input = e.currentTarget as HTMLInputElement;
							const file = input.files?.[0];
							if (!file) return;
							const reader = new FileReader();
							reader.onload = () => {
								imageUrl = reader.result as string;
								question.image = imageUrl;
								// Haupteditor und Polygon-Editor auf denselben Stand bringen.
								if (!question.mediaKind) question.mediaKind = 'image';
								question.media = [
									{
										id: crypto.randomUUID(),
										name: file.name,
										mime: file.type || 'image/png',
										src: imageUrl
									}
								];
								question.clickImageUrl = imageUrl;
								question.clickPolygon = [];
								points = [];
								loadImage();
							};
							reader.readAsDataURL(file);
							input.value = '';
						}}
					/>
				</label>
				{#if imageUrl}
					<button
						class="rounded-lg p-1 text-ink-500 hover:bg-err-bg hover:text-danger-500"
						aria-label="Bild entfernen"
						onclick={(e) => {
								e.stopPropagation();
								imageUrl = '';
								question.image = undefined;
								question.media = [];
								question.clickImageUrl = undefined;
								question.clickPolygon = [];
								points = [];
							}}
					>
						<Icon name="close" size={14} />
					</button>
				{/if}
			</div>
			<p class="mt-1 text-[12px] text-ink-500">
				Der Klick-Bereich bezieht sich auf dieses Bild; bei einer Bildergalerie auf das erste
				Bild. Ein Polygon ist nur bei Bildern und Infografiken möglich.
			</p>
		</div>

		{#if imageUrl}
			<div class="relative inline-block">
				<canvas
					bind:this={canvas}
					class="max-w-full max-h-[500px] cursor-crosshair block rounded-lg border border-sand-200"
					onclick={onCanvasClick}
					onmousedown={onCanvasMouseDown}
					onmousemove={onCanvasMouseMove}
					onmouseup={onCanvasMouseUp}
				></canvas>
				<div class="absolute top-1 left-1 flex flex-col gap-1 pointer-events-none">
					{#if drawing}
						<span class="text-[11px] bg-black/70 text-white px-2 py-1 rounded">Polygon zeichnen – klicke für Punkte</span>
					{:else}
						<span class="text-[11px] bg-amber-500/90 text-white px-2 py-1 rounded">Polygons-Modus aktiv</span>
					{/if}
					<span class="text-[11px] bg-ink-900/80 text-white px-2 py-1 rounded">
						{points.length} Punkt{points.length === 1 ? '' : 'e'}
					</span>
				</div>
			</div>

			<div class="flex flex-wrap items-center gap-2">
				<button
					class="b3"
					onclick={toggleDrawing}
					class:!bg-brand-600={drawing}
					class:!text-white={drawing}
				>
					<Icon name={drawing ? 'stop' : 'edit'} size={16} />
					{drawing ? 'Zeichnen stoppen' : 'Polygon zeichnen'}
				</button>
				<button class="b3" onclick={removeLastPoint} disabled={points.length === 0}>
					<Icon name="undo" size={16} /> Letzten Punkt entfernen
				</button>
				<button class="b3" onclick={clearPolygon} disabled={points.length === 0}>
					<Icon name="delete" size={16} /> Polygon löschen
				</button>
				<button class="b2" onclick={save} disabled={points.length < 3}>
					<Icon name="save" size={16} /> Polygon speichern
				</button>
				<p class="ml-auto text-[12px] text-ink-500">
					{points.length < 3 ? 'Mindestens 3 Punkte für ein Polygon' : 'Bereit zum Speichern'}
				</p>
			</div>
		{/if}

		{:else}
			<p class="text-[12px] text-ink-500 italic">
				Wähle oben den Modus „Klick-Bereich“ (Click), um ein Polygon auf dem Bild zu zeichnen.
			</p>
		{/if}
	</div>