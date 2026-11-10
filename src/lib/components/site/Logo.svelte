<script lang="ts">
	let { size = 36, light = false }: { size?: number; light?: boolean } = $props();
</script>

<svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
	<rect width="40" height="40" rx="11" fill={light ? '#ffffff' : '#1c6b4c'} />
	<ellipse
		cx="20"
		cy="20"
		rx="13"
		ry="6.5"
		fill="none"
		stroke={light ? '#1c6b4c' : '#dcefe5'}
		stroke-width="1.8"
		transform="rotate(-28 20 20)"
	/>
	<circle cx="20" cy="20" r="5" fill={light ? '#1c6b4c' : '#ffffff'} />
	<circle cx="30.2" cy="14.4" r="2.6" fill="#8dbf3f" />
</svg>
