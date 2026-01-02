import type { Component } from 'svelte';
import AlertFragment from '../components/modals/AlertFragment.svelte';
import ConfirmFragment from '../components/modals/ConfirmFragment.svelte';
import SettingsFragment from '../components/modals/SettingsFragment.svelte';

// Define the available modal keys
export const MODAL_KEYS = {
  ALERT: 'alert',
  CONFIRM: 'confirm',
  SETTINGS: 'settings',
} as const;

// The Registry Map
export const modalRegistry: Record<string, Component<any>> = {
  [MODAL_KEYS.ALERT]: AlertFragment,
  [MODAL_KEYS.CONFIRM]: ConfirmFragment,
  [MODAL_KEYS.SETTINGS]: SettingsFragment,
};
