import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { connectFunctionsEmulator, getFunctions, type Functions } from 'firebase/functions';
import { config } from '$lib/config';

type FirebaseConfig = {
	apiKey: string;
	authDomain: string;
	projectId: string;
	appId: string;
	messagingSenderId: string;
	storageBucket?: string;
};

const firebaseConfig: FirebaseConfig = {
	apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY ?? 'dev-api-key',
	authDomain: import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN ?? 'localhost',
	projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID ?? 'dosematch',
	appId: import.meta.env.PUBLIC_FIREBASE_APP_ID ?? 'dosematch-app',
	messagingSenderId: import.meta.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '000000000000',
	storageBucket: import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET
};

let app: FirebaseApp | null = null;
let functionsInstance: Functions | null = null;

function ensureFirebaseApp(): FirebaseApp {
	if (!app) {
		if (!getApps().length) {
			app = initializeApp(firebaseConfig);
		} else {
			app = getApps()[0]!;
		}
	}

	return app;
}

export function getFirebaseFunctions(): Functions {
	if (!functionsInstance) {
		const firebaseApp = ensureFirebaseApp();
		functionsInstance = getFunctions(firebaseApp, 'us-central1');

		const shouldUseEmulator =
			import.meta.env.DEV &&
			(config.functions.baseUrl.includes('127.0.0.1') ||
				config.functions.baseUrl.includes('localhost'));

		if (shouldUseEmulator) {
			connectFunctionsEmulator(functionsInstance, '127.0.0.1', 5001);
		}
	}

	return functionsInstance;
}

