/* Aide pour fabriquer le HTML d'un bouton "interactive hover" depuis du JavaScript. */
window.ihbMarkup = function (text) {
    var safe = String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return '<span class="ihb__label">' + safe + '</span>' +
        '<span class="ihb__over" aria-hidden="true"><span>' + safe + '</span>' +
        '<svg class="ihb__arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" focusable="false"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span>' +
        '<span class="ihb__dot" aria-hidden="true"></span>';
};
