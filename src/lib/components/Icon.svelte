<script lang="ts">
	type Props = {
		name: string;
		class?: string;
		filled?: boolean;
		size?: number;
	};

	let { name, class: className = '', filled = false, size }: Props = $props();
</script>

<span
	class="material-symbols-outlined {className}"
	style:font-size={size ? `${size}px` : undefined}
	style:font-variation-settings={filled ? "'FILL' 1" : undefined}
	aria-hidden="true">{name}</span
>
