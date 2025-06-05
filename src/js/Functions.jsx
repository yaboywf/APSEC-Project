const showError = (elementId, message) => {
    document.getElementById(elementId).textContent = message;
    document.getElementById(elementId).style.display = "block";
}

const hideError = (elementId) => {
    document.getElementById(elementId).textContent = "";
    document.getElementById(elementId).style.display = "none";
}

export { showError, hideError }