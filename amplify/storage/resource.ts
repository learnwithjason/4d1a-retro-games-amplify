import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
	name: 'retro-games-4d1a',
	access: (allow) => ({
		'images/*': [allow.authenticated.to(['read', 'write', 'delete'])],
	}),
});
