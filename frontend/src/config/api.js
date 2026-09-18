// RetinaAI API Configuration
// Easily switch between deployed Render Cloud endpoints and local development

export const DEFAULT_API_CONFIG = {
  // Live deployed Render microservices
  idridUrl: import.meta.env.VITE_IDRID_API_URL || 'https://sih-diabetes-idrid.onrender.com',
  aptosUrl: import.meta.env.VITE_APTOS_API_URL || 'https://sih-diabetes-aptos.onrender.com',
  driveUrl: import.meta.env.VITE_DRIVE_API_URL || 'https://sih-diabetes-drive.onrender.com',
  // Keep this empty for health checks. Enter the inference API key locally in
  // the settings dialog; VITE_* values are embedded into the public bundle.
  apiKey: import.meta.env.VITE_MODEL_API_KEY || '',
  
  // Local fallback
  localUrl: import.meta.env.VITE_LOCAL_API_URL || 'http://localhost:8000',
  
  useLocalFallback: false,
  timeoutMs: 30000
};

export const getStoredApiConfig = () => {
  try {
    const saved = localStorage.getItem('retina_ai_config');
    if (saved) {
      return { ...DEFAULT_API_CONFIG, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.warn('Could not read API config from localStorage', e);
  }
  return DEFAULT_API_CONFIG;
};

export const saveApiConfig = (newConfig) => {
  try {
    localStorage.setItem('retina_ai_config', JSON.stringify(newConfig));
  } catch (e) {
    console.error('Failed to save API config', e);
  }
};
