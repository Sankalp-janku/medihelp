export const config = Object.freeze({
  apiUrl: import.meta.env.VITE_API_URL || '/api/v1',
  demoVideoUrl: import.meta.env.VITE_DEMO_VIDEO_URL || '',
  contactEmail: import.meta.env.VITE_CONTACT_EMAIL || 'support@example.com',
});
