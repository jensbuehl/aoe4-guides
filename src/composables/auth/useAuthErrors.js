// Messages here are read by players, not developers. No code, no "credential",
// no "provider" — if a string here needs one of those words to make sense, the
// message is wrong rather than the vocabulary.
const MESSAGES = {
  "auth/invalid-credential":     "Incorrect email or password. Please try again.",
  "auth/wrong-password":         "Incorrect email or password. Please try again.",
  "auth/user-not-found":         "Incorrect email or password. Please try again.",
  "auth/invalid-email":          "Enter a valid email address.",
  "auth/user-disabled":          "This account has been disabled.",
  "auth/too-many-requests":      "Too many attempts. Please wait a moment and try again.",
  "auth/email-already-in-use":   "An account with this email already exists.",
  "auth/weak-password":          "Use a stronger password (at least 6 characters).",
  "auth/network-request-failed": "Network error. Check your connection and try again.",

  // Google sign-in. `popup-closed-by-user` and `cancelled-popup-request` are
  // deliberately absent: those are someone changing their mind, and the caller
  // drops them before they ever reach here (see isPopupCancelled).
  "auth/popup-blocked":
    "Your browser blocked the Google sign-in window. Allow pop-ups for this site, or sign in with your email and password below.",
  "auth/account-exists-with-different-credential":
    "This email already has an account with a password. Enter it below to sign in — or use “Forgot password?” if you don't remember it.",
  "auth/unauthorized-domain":
    "Google sign-in isn't available here right now. Please sign in with your email and password.",
  "auth/operation-not-allowed":
    "Google sign-in isn't available right now. Please sign in with your email and password.",
};

export function mapAuthError(errOrCode) {
  const s = (errOrCode?.message || errOrCode || "").toString();
  const hit = Object.keys(MESSAGES).find((code) => s.includes(code));
  return hit ? MESSAGES[hit] : "Something went wrong. Please try again.";
}

export function isEmailAlreadyInUse(errOrCode) {
  const s = (errOrCode?.message || errOrCode || "").toString();
  return s.includes("auth/email-already-in-use");
}

/**
 * The address already belongs to an account that signs in with a password.
 * The dialog answers this by returning to the login form with the address
 * filled in, rather than by joining the two sign-in methods (spec 032, FR-011a).
 */
export function isAccountExistsWithDifferentCredential(errOrCode) {
  const s = (errOrCode?.message || errOrCode || "").toString();
  return s.includes("auth/account-exists-with-different-credential");
}

/**
 * The user closed the Google window, or a second window superseded the first.
 * Not a failure and must never be shown as one (spec 032, FR-017).
 */
export function isPopupCancelled(errOrCode) {
  const s = (errOrCode?.message || errOrCode || "").toString();
  return (
    s.includes("auth/popup-closed-by-user") ||
    s.includes("auth/cancelled-popup-request") ||
    s.includes("auth/user-cancelled")
  );
}
