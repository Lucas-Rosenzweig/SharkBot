import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RoleBadge } from '../../app/_components/RoleBadge';

describe('RoleBadge', () => {
    it('renders the role name', () => {
        render(<RoleBadge name="Admin" color="#FF0000" />);
        expect(screen.getByText('Admin')).toBeInTheDocument();
    });

    it('applies the color to the dot indicator', () => {
        const { container } = render(<RoleBadge name="Mod" color="#00FF00" />);
        const dots = container.querySelectorAll('span[style]');
        const hasColor = Array.from(dots).some(
            (dot) => (dot as HTMLElement).style.backgroundColor === 'rgb(0, 255, 0)',
        );
        expect(hasColor).toBe(true);
    });

    it('accepts custom className', () => {
        const { container } = render(
            <RoleBadge name="Test" color="#000" className="my-custom-class" />,
        );
        expect(container.firstChild).toHaveClass('my-custom-class');
    });
});

