
/**
 * Admin Settings Configuration
 * Use SHOW_ADMIN_PANEL to toggle the visibility of the Admin Panel access point.
 */
export const adminSettings = {
  SHOW_ADMIN_PANEL: true, // Set to false to hide the gear icon in the UI
  
  // Default Application Settings
  defaultLanguage: 'en' as 'en' | 'es',
  
  // Default Data Entries
  defaultPeople: [
    { id: '1', name: 'ALEX', paid: 120 },
    { id: '2', name: 'JORDAN', paid: 45 },
    { id: '3', name: 'SAM', paid: 0 },
  ],
  
  defaultCostItems: [
    { id: '1', name: 'DINNER', amount: 85, paidById: '1' },
    { id: '2', name: 'DRINKS', amount: 35, paidById: '1' },
    { id: '3', name: 'TAXI', amount: 45, paidById: '2' },
  ],
};
