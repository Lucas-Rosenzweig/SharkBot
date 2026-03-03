import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ConfirmDeleteModal } from '../../app/_components/ConfirmDeleteModal';

afterEach(() => {
    cleanup();
});

describe('ConfirmDeleteModal', () => {
    it('renders when open', () => {
        render(
            <ConfirmDeleteModal
                isOpen={true}
                onOpenChange={vi.fn()}
                onConfirm={vi.fn()}
            />,
        );
        expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });

    it('does not render alertdialog when closed', () => {
        render(
            <ConfirmDeleteModal
                isOpen={false}
                onOpenChange={vi.fn()}
                onConfirm={vi.fn()}
            />,
        );
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });

    it('shows custom title', () => {
        render(
            <ConfirmDeleteModal
                isOpen={true}
                onOpenChange={vi.fn()}
                onConfirm={vi.fn()}
                title="Custom Title"
            />,
        );
        expect(screen.getByText('Custom Title')).toBeInTheDocument();
    });

    it('shows custom description', () => {
        render(
            <ConfirmDeleteModal
                isOpen={true}
                onOpenChange={vi.fn()}
                onConfirm={vi.fn()}
                description="Custom description text"
            />,
        );
        expect(screen.getByText('Custom description text')).toBeInTheDocument();
    });

    it('shows custom button labels', () => {
        render(
            <ConfirmDeleteModal
                isOpen={true}
                onOpenChange={vi.fn()}
                onConfirm={vi.fn()}
                cancelText="Nah"
                confirmText="Do it"
            />,
        );
        expect(screen.getByText('Nah')).toBeInTheDocument();
        expect(screen.getByText('Do it')).toBeInTheDocument();
    });

    it('calls onConfirm when confirm button is clicked', () => {
        const onConfirm = vi.fn();
        const onOpenChange = vi.fn();
        render(
            <ConfirmDeleteModal
                isOpen={true}
                onOpenChange={onOpenChange}
                onConfirm={onConfirm}
            />,
        );
        const buttons = screen.getAllByText('Supprimer');
        fireEvent.click(buttons[0]);
        expect(onConfirm).toHaveBeenCalledTimes(1);
    });
});
