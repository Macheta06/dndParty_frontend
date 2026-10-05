import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Vitest corre sin `globals`, así que @testing-library/react no puede
// registrar su auto-cleanup: sin esto el DOM se acumula entre tests y un
// assert encuentra los nodos del test anterior.
afterEach(cleanup);
