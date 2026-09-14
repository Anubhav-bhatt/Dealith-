import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ActionLink, Button, StatusNote } from '@dealith/ui';
describe('accessible foundation states', () => {
  it('announces unavailable access without presenting an enabled action', () => {
    const act = vi.fn();
    render(
      <>
        <StatusNote>Access is not yet available.</StatusNote>
        <Button disabled onClick={act}>
          Sign in
        </Button>
      </>,
    );
    expect(screen.getByRole('status')).toHaveTextContent('Access is not yet available.');
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(act).not.toHaveBeenCalled();
    expect(screen.getByRole('button')).toBeDisabled();
  });
  it('preserves native link semantics for the available process navigation', () => {
    render(<ActionLink href="#how-it-works">Explore the process</ActionLink>);
    expect(screen.getByRole('link')).toHaveAttribute('href', '#how-it-works');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
