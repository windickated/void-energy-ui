import { MODAL_KEYS } from '../config/modal-registry';

class ModalManager {
  // The Key determines which component renders
  activeKey = $state<VoidModalKey | null>(null);

  // The Props are passed directly to that component
  props = $state<Record<string, any>>({});

  // Window options (size) are separate from component props
  windowOptions = $state<VoidModalOptions>({ size: 'md', preventClose: false });

  private resolvePromise: ((value: any) => void) | null = null;
  private previousActiveElement: HTMLElement | null = null;

  /**
   * Opens any modal by Key.
   * @param key - The registry key (e.g., 'confirm')
   * @param props - Data to pass to the fragment (title, body, etc.)
   * @param windowOpts - Window settings (size)
   */
  open<T = any>(
    key: VoidModalKey,
    props: Record<string, any> = {},
    windowOpts: VoidModalOptions = {},
  ): Promise<T | null> {
    if (this.activeKey) this.close(null);

    if (typeof document !== 'undefined') {
      this.previousActiveElement = document.activeElement as HTMLElement;
    }

    this.activeKey = key;
    this.props = props;

    // Default to 'md' size if not specified
    // and preventClose to false if not provided
    this.windowOptions = {
      size: 'md',
      preventClose: false,
      ...windowOpts,
    };

    return new Promise((resolve) => {
      this.resolvePromise = resolve;
    });
  }

  close(result: any) {
    if (this.resolvePromise) this.resolvePromise(result);

    this.activeKey = null;
    this.props = {};
    this.resolvePromise = null;

    if (this.previousActiveElement) {
      this.previousActiveElement.focus();
      this.previousActiveElement = null;
    }
  }

  // --- Convenience Helpers ---

  async confirm(title: string, body: string, cost = 0): Promise<boolean> {
    const result = await this.open<boolean>(
      MODAL_KEYS.CONFIRM,
      { title, body, cost },
      { size: 'sm' },
    );
    return result ?? false;
  }

  async alert(title: string, body: string): Promise<boolean> {
    const result = await this.open<boolean>(
      MODAL_KEYS.ALERT,
      { title, body },
      { size: 'sm' },
    );
    return result ?? true;
  }
}

export const modal = new ModalManager();
