<script lang="ts">
	type Props = {
		value: number;
		size?: number;
		thickness?: number;
		label?: string;
		sublabel?: string;
		track?: string;
		innerClass?: string;
	};

	let {
		value,
		size = 72,
		thickness = 5,
		label,
		sublabel,
		track = 'rgba(255,255,255,.18)',
		innerClass = 'bg-brand-900 text-white'
	}: Props = $props();

	let inner = $derived(size - thickness * 4);
	let pct = $derived(Math.max(0, Math.min(100, value)));
</script>

<div
	class="grid place-items-center rounded-full"
	style:width="{size}px"
	style:height="{size}px"
	style:background="conic-gradient(#8DBF3F {pct}%, {track} 0)"
	role="img"
	aria-label="{label ?? `${pct} %`}"
>
	<div
		class="grid place-items-center rounded-full text-center {innerClass}"
		style:width="{inner}px"
		style:height="{inner}px"
	>
		{#if label}
			<span class="text-[13px] leading-tight font-semibold">{label}</span>
			{#if sublabel}<span class="text-[10px] leading-none opacity-60">{sublabel}</span>{/if}
		{:else}
			<span class="text-[13px] font-semibold">{pct} %</span>
		{/if}
	</div>
</div>
