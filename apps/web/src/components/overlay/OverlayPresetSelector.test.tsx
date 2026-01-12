import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OverlayPresetSelector } from './OverlayPresetSelector';
import { PRESET_CATEGORIES } from '../../data/overlay-presets.data';

describe('OverlayPresetSelector', () => {
  it('renders preset selector with label', () => {
    render(<OverlayPresetSelector selectedPresetId="none" onPresetChange={() => {}} />);

    expect(screen.getByText('Preset:')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('renders all categories as optgroups', () => {
    render(<OverlayPresetSelector selectedPresetId="none" onPresetChange={() => {}} />);

    const select = screen.getByRole('combobox');

    // Check that optgroups exist for categories with presets
    PRESET_CATEGORIES.forEach((category) => {
      const optgroup = select.querySelector(`optgroup[label="${category}"]`);
      // Not all categories may have presets, so just check that expected ones exist
      if (['Basic', 'Resolution', 'HDR', 'Audio'].includes(category)) {
        expect(optgroup).toBeInTheDocument();
      }
    });
  });

  it('shows selected preset value', () => {
    render(<OverlayPresetSelector selectedPresetId="4k-badge" onPresetChange={() => {}} />);

    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('4k-badge');
  });

  it('calls onPresetChange when selection changes', () => {
    const handleChange = vi.fn();
    render(<OverlayPresetSelector selectedPresetId="none" onPresetChange={handleChange} />);

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '4k-badge' } });

    expect(handleChange).toHaveBeenCalledWith('4k-badge');
  });

  it('renders preset options with correct names', () => {
    render(<OverlayPresetSelector selectedPresetId="none" onPresetChange={() => {}} />);

    // Check for specific preset names
    expect(screen.getByRole('option', { name: 'None' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '4K Badge' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Dolby Vision' })).toBeInTheDocument();
  });
});
