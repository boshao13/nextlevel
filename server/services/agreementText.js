// Canonical signing-agreement text. NEVER accept this from the client.
// Adding a new version: define a new key here; bump CURRENT_AGREEMENT_VERSION.
// Old events stay reconstructible against their original wording via the version key.

const AGREEMENTS = {
  'v1-2026-05-14':
    'I agree to use an electronic signature for this document. ' +
    'I understand my electronic signature is legally binding and equivalent to a handwritten signature.',
};

const CURRENT_AGREEMENT_VERSION = 'v1-2026-05-14';

function currentAgreement() {
  return { version: CURRENT_AGREEMENT_VERSION, text: AGREEMENTS[CURRENT_AGREEMENT_VERSION] };
}

function agreementText(version) {
  return AGREEMENTS[version] || null;
}

module.exports = { AGREEMENTS, CURRENT_AGREEMENT_VERSION, currentAgreement, agreementText };
