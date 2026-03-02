import { API } from './lib/config.js';

console.log('=== API Import Test ===');
console.log('API exists:', API !== undefined);
console.log('API type:', typeof API);
console.log('API length:', API ? API.length : 0);
console.log('API is truthy:', !!API);
console.log('if (API) will be:', API ? 'TRUE' : 'FALSE');
console.log('First 30 chars:', API ? API.substring(0, 30) : 'N/A');
