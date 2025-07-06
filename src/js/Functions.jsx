/**
 * Adds an error or success message
 * @param {*} message - the message
 * @param {*} type - the type
 */
const showMessage = (message, type = 'error') => {
	const newError = document.createElement('div');
	newError.classList.add(type === 'success' ? 'success' : 'error');
	newError.textContent = message;
	document.querySelector('.error_container').appendChild(newError);

	setTimeout(() => {
		newError.remove();
	}, 5300);
}

// Encrypt data using RSA public key on the frontend
const encryptData = async (publicKeyPem, data) => {
	try {
		const dataString = typeof data === 'string' ? data : JSON.stringify(data);
        const byteLength = new TextEncoder().encode(dataString).length;
		if (byteLength > 200) {
            throw new Error(`Data too long`)
		}

		// Convert PEM to CryptoKey
		const pemHeader = "-----BEGIN PUBLIC KEY-----";
		const pemFooter = "-----END PUBLIC KEY-----";
		const pemContents = publicKeyPem
			.replace(pemHeader, '')
			.replace(pemFooter, '')
			.replace(/\s+/g, '');

		const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

		const publicKey = await crypto.subtle.importKey(
			'spki',
			binaryDer,
			{ name: 'RSA-OAEP', hash: 'SHA-256' },
			true,
			['encrypt']
		);

		// Encrypt data
		const encodedData = new TextEncoder().encode(data);
		const encrypted = await crypto.subtle.encrypt(
			{ name: 'RSA-OAEP' },
			publicKey,
			encodedData
		);

		// Convert to Base64
		return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
	} catch (err) {
		console.error(err);
		throw new Error(`Encryption failed: ${err}`);
	}
};

const decryptData = async (clientPrivateKey, encryptedBase64) => {
	try {
		// 1. Clean the Base64 string (remove non-alphanumeric chars)
		const cleanBase64 = encryptedBase64
			.replace(/-/g, '+')  // Convert URL-safe Base64
			.replace(/_/g, '/')  // Convert URL-safe Base64
			.replace(/\s/g, ''); // Remove whitespace

		// 2. Add padding if needed
		const paddedBase64 = cleanBase64.padEnd(
			cleanBase64.length + (4 - (cleanBase64.length % 4)) % 4,
			'='
		);

		// 3. Decode Base64 to ArrayBuffer
		const binaryString = atob(paddedBase64);
		const bytes = new Uint8Array(binaryString.length);
		for (let i = 0; i < binaryString.length; i++) {
			bytes[i] = binaryString.charCodeAt(i);
		}

		// 4. Decrypt
		const decrypted = await crypto.subtle.decrypt(
			{ name: "RSA-OAEP" },
			clientPrivateKey,
			bytes
		);

		return new TextDecoder().decode(decrypted);
	} catch (error) {
		console.error("Decryption failed:", error);
		throw new Error(`Decryption error: ${error}`);
	}
};

/**
 * Generates client public and private keys
 */
const generateKeys = async () => {
	try {
		const { publicKey, privateKey } = await crypto.subtle.generateKey(
			{
				name: "RSA-OAEP",
				modulusLength: 2048,
				publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
				hash: "SHA-256",
			},
			true,
			["encrypt", "decrypt"]
		);

		// Export and store public key as PEM
		const exportedPublicKey = await crypto.subtle.exportKey("spki", publicKey);
		const publicKeyPem = `-----BEGIN PUBLIC KEY-----\n${btoa(String.fromCharCode(...new Uint8Array(exportedPublicKey)))}\n-----END PUBLIC KEY-----`;

		return { privateKey, publicKeyPem };
	} catch (error) {
		console.error('Key generation failed:', error);
	}
}

export { showMessage, encryptData, decryptData, generateKeys };