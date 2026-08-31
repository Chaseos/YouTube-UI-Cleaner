document.addEventListener('DOMContentLoaded', () => {
    const rateLink = document.getElementById('apple-rate');
    rateLink.addEventListener('click', event => {
        if (rateLink.getAttribute('href') === '#') {
            event.preventDefault();
            document.getElementById('apple-notice').textContent = getMessage('ratingUnavailable');
        }
    });
});
