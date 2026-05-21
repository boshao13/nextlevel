import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NotFound from './NotFound';

function renderNotFound() {
  return render(
    <MemoryRouter>
      <NotFound />
    </MemoryRouter>
  );
}

test('renders the witty headline as the single h1', () => {
  renderNotFound();
  const h1s = screen.getAllByRole('heading', { level: 1 });
  expect(h1s).toHaveLength(1);
  expect(h1s[0]).toHaveTextContent(/crack in the concrete/i);
});

test('renders both navigation buttons pointing home', () => {
  renderNotFound();
  const quote = screen.getByRole('link', { name: /get a free quote/i });
  const home = screen.getByRole('link', { name: /back to home/i });
  expect(quote).toHaveAttribute('href', '/');
  expect(home).toHaveAttribute('href', '/');
});
