<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import Logo from '$lib/components/site/Logo.svelte';
	import { showReqs } from '$lib/requirements.svelte';
	import { content } from '$lib/stores/content.svelte';
	import { roleDescription, roleLabel, session } from '$lib/stores/session.svelte';

	showReqs(['auth', 'roles', 'audit', 'browser']);

	let email = $state('');
	let password = $state('');
	let error = $state('');

	function submit(event: SubmitEvent) {
		event.preventDefault();
		const user = session.login(email, password);
		error = user ? '' : 'Anmeldung fehlgeschlagen. Bitte E-Mail-Adresse und Passwort prüfen.';
	}

	function pick(mail: string) {
		email = mail;
		password = 'demo';
	}
</script>

<svelte:head><title>Anmeldung · Redaktion Nutztierkosmos</title></svelte:head>

<main class="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
	<section class="flex flex-col justify-between gap-10 bg-brand-900 p-8 text-white lg:p-14">
		<a href="/" class="flex items-center gap-2.5"><Logo light /><span class="font-serif text-[20px] font-semibold">Nutztierkosmos</span></a>
		<div class="max-w-md space-y-4">
			<p class="text-[12px] font-semibold tracking-[0.14em] text-lime-500 uppercase">Redaktionssystem</p>
			<h1 class="font-serif text-[36px] leading-tight font-semibold">Inhalte pflegen – ohne eine Zeile Code.</h1>
			<p class="text-white/80">Kategorien, Ausstellungen, Publikationen, Medien und Quizze. Mit Freigabe-Workflow, Vorschau und Versionshistorie.</p>
		</div>
		<p class="text-[13px] text-white/60">Demo: Die Anmeldung ist simuliert. Passwort für alle Konten: <code class="rounded bg-white/10 px-1.5">demo</code></p>
	</section>

	<section class="flex items-center justify-center p-6">
		<div class="w-full max-w-md space-y-6">
			<form class="card space-y-4" onsubmit={submit} novalidate>
				<h2 class="h1 !text-[28px]">Anmelden</h2>
				<div>
					<label class="lbl" for="login-mail">E-Mail-Adresse</label>
					<input id="login-mail" class="inp" type="email" autocomplete="username" bind:value={email} aria-invalid={Boolean(error)} aria-describedby={error ? 'login-error' : undefined} />
				</div>
				<div>
					<label class="lbl" for="login-pw">Passwort</label>
					<input id="login-pw" class="inp" type="password" autocomplete="current-password" bind:value={password} aria-invalid={Boolean(error)} aria-describedby={error ? 'login-error' : undefined} />
				</div>
				{#if error}
					<p id="login-error" role="alert" class="flex items-start gap-2 rounded-xl bg-err-bg p-3 text-[14px] text-err-fg"><Icon name="error" size={20} />{error}</p>
				{/if}
				<button class="b1 w-full" type="submit"><Icon name="login" />Anmelden</button>
			</form>

			<div class="space-y-2">
				<p class="text-[13px] font-semibold text-ink-500">Demo-Konten – zum Ausprobieren der Rollen</p>
				<ul class="space-y-2">
					{#each content.users.filter((u) => u.active) as user (user.id)}
						<li>
							<button type="button" class="flex w-full items-start gap-3 rounded-xl border border-sand-200 bg-white p-3 text-left hover:border-brand-500" onclick={() => pick(user.email)}>
								<span class="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-100 font-semibold text-brand-700">{user.name.replace('Dr. ', '').charAt(0)}</span>
								<span class="min-w-0">
									<span class="block text-[14px] font-semibold">{user.name} · {roleLabel[user.role]}</span>
									<span class="block text-[12px] text-ink-500">{roleDescription[user.role]}</span>
								</span>
							</button>
						</li>
					{/each}
				</ul>
			</div>
		</div>
	</section>
</main>
