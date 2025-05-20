// Marcel Test

function showLoginPopup() {
    document.getElementById('loginPopup').style.display = 'block';
    document.getElementById('overlay').style.display = 'block';
}

function hideLoginPopup() {
    document.getElementById('loginPopup').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
}

function submitLogin() {
    const userId = document.getElementById('userId').value;
    const password = document.getElementById('password').value;

    console.log('Submitted ID:', userId);
    console.log('Submitted Password:', password);

    // TODO: You could now send this to your server via fetch() or AJAX
    hideLoginPopup();
}
