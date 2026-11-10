<script lang="ts">
	import { withBase } from '$lib/paths';
	// Bildmarke Nutztierkosmos (Kuhkopf in einer Umlaufbahn). Dieselbe Datei dient als Favicon.
	// Sie bringt ein eigenes blaues Feld mit und funktioniert daher auf hellem wie dunklem Grund;
	// `light` bleibt nur, damit bestehende Aufrufe gültig sind.
	let { size = 36 }: { size?: number; light?: boolean } = $props();
</script>

<img src={withBase('/logo.svg')} width={size} height={size} alt="" class="shrink-0" draggable="false" />
