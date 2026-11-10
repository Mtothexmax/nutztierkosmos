<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import { showReqs } from '$lib/requirements.svelte';
	import { content } from '$lib/stores/content.svelte';
	import { permissionLabel, permissions, roleDescription, roleLabel, session, type Permission } from '$lib/stores/session.svelte';
	import { toasts } from '$lib/stores/toast.svelte';
	import type { Role } from '$lib/types';
	import { formatDateTime, uid } from '$lib/utils';

	showReqs(['roles', 'auth', 'audit']);

	const roles: Role[] = ['admin', 'editor', 'reviewer', 'analyst'];
	let name = $state('');
	let email = $state('');
	let role = $state<Role>('editor');

	function changeRole(id: string, next: Role) {
		const u = content.getUser(id);
		if (!u) return;
		if (u.id === session.user?.id && next !== 'admin') {
			toasts.push('Die eigene Administrationsrolle kann nicht entzogen werden.', 'error');
			return;
		}
		const before = roleLabel[u.role];
		u.role = next;
		content.persistUsers();
		content.log(session.user!.id, `Rolle geändert: ${before} → ${roleLabel[next]}`, u.name, 'security');
		toasts.push(`${u.name}: ${roleLabel[next]}`);
	}

	function toggleActive(id: string) {
		const u = content.getUser(id);
		if (!u || u.id === session.user?.id) return;
		u.active = !u.active;
		content.persistUsers();
		content.log(session.user!.id, u.active ? 'Konto aktiviert' : 'Konto deaktiviert', u.name, 'security');
	}

	function invite(event: SubmitEvent) {
		event.preventDefault();
		if (!name.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
			toasts.push('Bitte Name und gültige E-Mail-Adresse angeben.', 'error');
			return;
		}
		content.users.push({ id: uid(), name: name.trim(), email: email.trim(), role, active: true });
		content.persistUsers();
		content.log(session.user!.id, `Konto angelegt (${roleLabel[role]})`, name.trim(), 'security');
		toasts.push('Konto angelegt – Passwort in der Demo: „demo“');
		name = email = '';
	}
</script>

<svelte:head><title>Benutzer & Rollen · Redaktion</title></svelte:head>

<div>
	<h1 class="h1">Benutzer & Rollen</h1>
	<p class="max-w-2xl text-ink-500">Mehrbenutzerbetrieb mit Rollen nach dem Prinzip der erforderlichen Berechtigungen. Jede Änderung wird im Sicherheitsprotokoll erfasst. Im Echtbetrieb: Anmeldung über das FBN-Verzeichnis (z. B. SSO), Zwei-Faktor optional.</p>
</div>

<div class="card overflow-x-auto !p-0">
	<table class="w-full min-w-[720px]">
		<thead><tr><th>Name</th><th>E-Mail</th><th>Rolle</th><th>Letzte Anmeldung</th><th>Status</th></tr></thead>
		<tbody>
			{#each content.users as u (u.id)}
				<tr class={u.active ? '' : 'opacity-60'}>
					<td class="font-medium">{u.name}{u.id === session.user?.id ? ' (Sie)' : ''}</td>
					<td class="text-[14px]">{u.email}</td>
					<td>
						<label class="sr-only" for="role-{u.id}">Rolle von {u.name}</label>
						<select id="role-{u.id}" class="inp !w-auto !py-1.5" value={u.role} onchange={(e) => changeRole(u.id, (e.currentTarget as HTMLSelectElement).value as Role)}>
							{#each roles as r (r)}<option value={r}>{roleLabel[r]}</option>{/each}
						</select>
					</td>
					<td class="text-[13px] text-ink-500">{u.lastLoginAt ? formatDateTime(u.lastLoginAt) : '–'}</td>
					<td>
						<button class="b3 !py-1.5 text-[14px]" disabled={u.id === session.user?.id} onclick={() => toggleActive(u.id)}>
							<Icon name={u.active ? 'toggle_on' : 'toggle_off'} class={u.active ? 'text-brand-600' : 'text-ink-500'} />{u.active ? 'Aktiv' : 'Deaktiviert'}
						</button>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<form class="card flex flex-wrap items-end gap-3" onsubmit={invite} novalidate>
	<div class="min-w-48 flex-1"><label class="lbl" for="nu-name">Name</label><input id="nu-name" class="inp" bind:value={name} /></div>
	<div class="min-w-48 flex-1"><label class="lbl" for="nu-mail">E-Mail</label><input id="nu-mail" type="email" class="inp" bind:value={email} /></div>
	<div><label class="lbl" for="nu-role">Rolle</label><select id="nu-role" class="inp" bind:value={role}>{#each roles as r (r)}<option value={r}>{roleLabel[r]}</option>{/each}</select></div>
	<button class="b1" type="submit"><Icon name="person_add" />Konto anlegen</button>
</form>

<section class="card overflow-x-auto" aria-labelledby="matrix">
	<h2 id="matrix" class="mb-1 font-serif text-lg font-semibold">Rechtekonzept</h2>
	<p class="mb-4 text-[14px] text-ink-500">Diese Matrix ist zugleich Teil der Dokumentation des Rollen- und Rechtekonzepts (LB 12).</p>
	<table class="w-full min-w-[640px]">
		<thead>
			<tr><th>Recht</th>{#each roles as r (r)}<th class="!text-center">{roleLabel[r]}</th>{/each}</tr>
		</thead>
		<tbody>
			{#each Object.entries(permissions) as [perm, allowed] (perm)}
				<tr>
					<td class="text-[14px]">{permissionLabel[perm as Permission]}</td>
					{#each roles as r (r)}
						<td class="text-center">
							{#if allowed.includes(r)}<Icon name="check" class="text-brand-600" /><span class="sr-only">ja</span>{:else}<span class="text-ink-500" aria-hidden="true">–</span><span class="sr-only">nein</span>{/if}
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
	<ul class="mt-4 grid gap-2 md:grid-cols-2">
		{#each roles as r (r)}<li class="rounded-xl bg-sand-50 p-3 text-[13px]"><strong>{roleLabel[r]}:</strong> {roleDescription[r]}</li>{/each}
	</ul>
</section>
