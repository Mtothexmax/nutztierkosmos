<script lang="ts">
	import { toasts } from '$lib/stores/toast.svelte';
	import Icon from './Icon.svelte';

	const styles = {
		success: { border: 'border-brand-600', icon: 'check_circle', color: 'text-brand-600' },
		error: { border: 'border-danger-500', icon: 'error', color: 'text-danger-500' },
		info: { border: 'border-sand-200', icon: 'info', color: 'text-ink-500' }
	} as const;
</script>

<div class="pointer-events-none fixed top-4 right-4 z-50 flex w-80 flex-col gap-2">
	{#each toasts.items as toast (toast.id)}
		<div
			class="card pointer-events-auto flex items-start gap-2 !p-3 {styles[toast.variant].border}"
			role="status"
		>
			<Icon name={styles[toast.variant].icon} class={styles[toast.variant].color} />
			<span class="flex-1 text-[14px]">{toast.message}</span>
			<button
				class="text-ink-500 hover:text-ink-900"
				aria-label="Schließen"
				onclick={() => toasts.dismiss(toast.id)}
			>
				<Icon name="close" size={18} />
			</button>
		</div>
	{/each}
</div>
