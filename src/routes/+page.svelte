<script lang="ts">
	import { goto } from '$app/navigation';
	import Icon from '$lib/components/Icon.svelte';
	import { content } from '$lib/stores/content.svelte';
	import { session } from '$lib/stores/session.svelte';

	const avatars = ['🦊', '🐻', '🦉', '🐺', '🐰', '🐴'];

	let name = $state('');
	let avatar = $state(avatars[0]);
	let error = $state('');

	let moduleCount = $derived(content.modules.filter((m) => m.published).length);
	let stationCount = $derived(
		content.quizzes.filter((q) => q.published).length +
			content.games.filter((g) => g.published).length
	);

	function start() {
		const player = session.login(name, avatar);
		if (!player) {
			error = 'Bitte gib mindestens 2 Zeichen ein.';
			return;
		}
		error = '';
		goto('/lernen');
	}

	function enterAdmin() {
		session.enterAdmin();
		goto('/admin');
	}
</script>

<svelte:head><title>Anmelden · Nutztierkosmos</title></svelte:head>

<section class="grid min-h-screen lg:grid-cols-[55fr_45fr]">
	<div
		class="flex flex-col justify-center gap-6 bg-gradient-to-br from-brand-900 to-brand-600 p-8 text-white lg:p-16"
	>
		<div class="text-6xl">🐄</div>
		<h1 class="font-serif text-[34px] leading-[1.1] font-bold lg:text-5xl">Nutztierkosmos</h1>
		<p class="max-w-md text-white/80">{content.settings.subtitle}</p>
		<div class="flex flex-wrap gap-2">
			<span class="bdg !bg-white/15 !text-white">{moduleCount} Module</span>
			<span class="bdg !bg-white/15 !text-white">{stationCount} Spiele & Quizze</span>
			<span class="bdg !bg-white/15 !text-white">Forschen & punkten</span>
		</div>
	</div>

	<div class="flex items-center justify-center p-6">
		<form class="card w-full max-w-md space-y-4" onsubmit={(e) => (e.preventDefault(), start())}>
			<p class="ovl">Willkommen</p>
			<h2 class="h1">Wie heißt du?</h2>
			<p class="text-ink-500">Dein Name erscheint in der Bestenliste. Kein Passwort, keine E-Mail.</p>

			<div>
				<label class="lbl" for="nm">Dein Name</label>
				<input id="nm" class="inp" bind:value={name} placeholder="z. B. Lena" maxlength="20" />
				<p class="mt-1 text-[13px] text-ink-500">2–20 Zeichen</p>
				{#if error}<p class="mt-1 text-[13px] text-danger-500">{error}</p>{/if}
			</div>

			<div>
				<p class="lbl">Wähle deinen Avatar</p>
				<div class="flex flex-wrap gap-2" role="radiogroup" aria-label="Avatar">
					{#each avatars as option (option)}
						<button
							type="button"
							role="radio"
							aria-checked={avatar === option}
							class="grid h-12 w-12 place-items-center rounded-full text-2xl transition {avatar === option
								? 'bg-brand-50 ring-2 ring-brand-600'
								: 'border border-sand-200 hover:bg-sand-50'}"
							onclick={() => (avatar = option)}
						>
							{option}
						</button>
					{/each}
				</div>
			</div>

			<button class="b1 w-full" type="submit">
				Los geht's <Icon name="arrow_forward" />
			</button>
			<button class="b3 w-full" type="button" onclick={enterAdmin}>
				<Icon name="admin_panel_settings" /> Als Redaktion anmelden
			</button>
			<p class="text-center text-[13px] text-ink-500">
				Demo-Modus · Daten bleiben nur in diesem Browser.
			</p>

			{#if session.player}
				<p class="text-center text-[13px] text-ink-500">
					Angemeldet als {session.player.avatar}
					<button type="button" class="text-brand-600 underline" onclick={() => goto('/lernen')}>
						weiterlernen
					</button>
				</p>
			{/if}
		</form>
	</div>
</section>
