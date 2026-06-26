import admin from 'firebase-admin';

// We initialize the admin SDK with just the projectId
// This is sufficient for verifyIdToken, without needing a full service account JSON!
admin.initializeApp({
  projectId: 'wealth-cap-auth-xyz',
});

export default admin;
