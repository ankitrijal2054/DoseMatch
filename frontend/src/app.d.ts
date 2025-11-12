// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	interface ImportMetaEnv {
		readonly PUBLIC_FIREBASE_API_KEY?: string;
		readonly PUBLIC_FIREBASE_AUTH_DOMAIN?: string;
		readonly PUBLIC_FIREBASE_PROJECT_ID?: string;
		readonly PUBLIC_FIREBASE_APP_ID?: string;
		readonly PUBLIC_FIREBASE_MESSAGING_SENDER_ID?: string;
		readonly PUBLIC_FIREBASE_STORAGE_BUCKET?: string;
	}

	interface ImportMeta {
		readonly env: ImportMetaEnv;
	}
}

export {};
