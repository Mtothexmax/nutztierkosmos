export type ToastVariant = 'success' | 'error' | 'info';

export type Toast = {
	id: number;
	variant: ToastVariant;
	message: string;
};

class ToastStore {
	items = $state<Toast[]>([]);
	private counter = 0;

	push(message: string, variant: ToastVariant = 'success'): void {
		const id = ++this.counter;
		this.items = [...this.items, { id, variant, message }];
		setTimeout(() => this.dismiss(id), 4000);
	}

	dismiss(id: number): void {
		this.items = this.items.filter((t) => t.id !== id);
	}
}

export const toasts = new ToastStore();
