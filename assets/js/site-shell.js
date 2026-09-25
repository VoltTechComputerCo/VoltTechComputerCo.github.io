import { enhanceNavigation } from './navigation.js';
import { enhanceDialogs } from './components/dialog.js';
import { enhanceSearch } from './components/search.js';

// No HTML replacement, backend access, tracking, storage or launch-flag overrides.
enhanceNavigation();
enhanceDialogs();
enhanceSearch();
