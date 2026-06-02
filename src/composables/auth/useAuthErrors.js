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
