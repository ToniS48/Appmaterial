// @ts-nocheck - Desactiva temporalmente la verificación de tipos
import React from 'react';
import { render, screen } from '@testing-library/react';

// Test simple sin dependencias complejas
describe('App Component', () => {
  test('can import App component', () => {
    const App = require('./App').default;
    expect(App).toBeDefined();
  });

  test('can import messages', () => {
    const messages = require('./constants/messages').default;
    expect(messages).toBeDefined();
    expect(messages.auth).toBeDefined();
    expect(messages.auth.login).toBeDefined();
  });
});
