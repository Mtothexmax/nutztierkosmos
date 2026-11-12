import { getContext, setContext } from 'svelte';
import type { Locale } from '$lib/types';

/**
 * Sprache, in der die Redaktion gerade Texte eines Quiz oder Spiels einträgt.
 * Der Editor stellt sie per Context bereit; alle `LText`-Felder darunter folgen ihr.
 */
export class EditLang {
	locale = $state<Locale>('de');
}

const KEY = Symbol('edit-lang');

export function provideEditLang(initial: Locale = 'de'): EditLang {
	const lang = new EditLang();
	lang.locale = initial;
	setContext(KEY, lang);
	return lang;
}

/** Ohne Editor drumherum (z. B. einzeln genutzt) wird Deutsch bearbeitet. */
export function useEditLang(): EditLang {
	return getContext<EditLang | undefined>(KEY) ?? new EditLang();
}
