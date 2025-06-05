const showError = (elementId, message) => {
    document.getElementById(elementId).textContent = message;
    document.getElementById(elementId).style.display = "block";
}

const hideError = (elementId) => {
    document.getElementById(elementId).textContent = "";
    document.getElementById(elementId).style.display = "none";
}

const addError = (message, type = 'error') => {
	const newError = document.createElement('div');
	newError.classList.add(type === 'success' ? 'success' : 'error' );
	newError.textContent = message;
	document.querySelector('.error_container').appendChild(newError);

	setTimeout(() => { 
		newError.remove();
	}, 5300);
}

export { showError, hideError, addError };