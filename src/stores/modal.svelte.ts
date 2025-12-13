/*
 * ROLE: Modal visibility state for Svelte surfaces.
 * RESPONSIBILITY: Provides a shared flag to coordinate dialog presentation across the Triad UI.
 */

import { writable } from 'svelte/store';

export const showModal = writable<boolean>(false);
