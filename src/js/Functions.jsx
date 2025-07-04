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

export { showMessage };