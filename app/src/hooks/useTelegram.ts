import { useState, useEffect, useCallback } from 'react';
import type { Theme, TelegramUser } from '@/types';

// Telegram WebApp types
interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: TelegramUser;
    query_id?: string;
    auth_date?: number;
    hash?: string;
  };
  version: string;
  platform: string;
  colorScheme: Theme;
  themeParams: {
    bg_color: string;
    text_color: string;
    hint_color: string;
    link_color: string;
    button_color: string;
    button_text_color: string;
    secondary_bg_color: string;
  };
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  headerColor: string;
  backgroundColor: string;
  BackButton: {
    isVisible: boolean;
    show: () => void;
    hide: () => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
  };
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    isProgressVisible: boolean;
    setText: (text: string) => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    showProgress: (leaveActive: boolean) => void;
    hideProgress: () => void;
  };
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
  ready: () => void;
  expand: () => void;
  close: () => void;
  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  enableClosingConfirmation: () => void;
  disableClosingConfirmation: () => void;
  onEvent: (eventType: string, eventHandler: () => void) => void;
  offEvent: (eventType: string, eventHandler: () => void) => void;
  sendData: (data: string) => void;
  switchInlineQuery: (query: string, choose_chat_types?: string[]) => void;
  openLink: (url: string, options?: { try_instant_view?: boolean }) => void;
  openTelegramLink: (url: string) => void;
  openInvoice: (url: string, callback?: (status: string) => void) => void;
  showPopup: (params: {
    title?: string;
    message: string;
    buttons?: Array<{
      id?: string;
      type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive';
      text: string;
    }>;
  }, callback?: (buttonId: string) => void) => void;
  showAlert: (message: string, callback?: () => void) => void;
  showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void;
  showScanQrPopup: (params: {
    text?: string;
  }, callback?: (data: string) => boolean) => void;
  closeScanQrPopup: () => void;
  readTextFromClipboard: (callback?: (text: string) => void) => void;
  requestWriteAccess: (callback?: (access: boolean) => void) => void;
  requestContact: (callback?: (contact: boolean) => void) => void;
  invokeCustomMethod: (method: string, params: object, callback?: (error: string | null, result: object | null) => void) => void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

export const useTelegram = () => {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [theme, setTheme] = useState<Theme>('light');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initTelegram = () => {
      if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        setWebApp(tg);
        setUser(tg.initDataUnsafe.user || null);
        setTheme(tg.colorScheme);
        
        // Notify Telegram that the app is ready
        tg.ready();
        
        // Expand to full height
        tg.expand();
        
        setIsReady(true);

        // Listen for theme changes
        tg.onEvent('themeChanged', () => {
          setTheme(tg.colorScheme);
        });
      }
    };

    // Try to initialize immediately
    initTelegram();

    // Also try after a short delay in case Telegram script loads slowly
    const timeout = setTimeout(initTelegram, 500);

    return () => {
      clearTimeout(timeout);
    };
  }, []);

  const showBackButton = useCallback((onClick: () => void) => {
    if (webApp) {
      webApp.BackButton.show();
      webApp.BackButton.onClick(onClick);
    }
  }, [webApp]);

  const hideBackButton = useCallback(() => {
    if (webApp) {
      webApp.BackButton.hide();
    }
  }, [webApp]);

  const showMainButton = useCallback((text: string, onClick: () => void, options?: {
    color?: string;
    textColor?: string;
  }) => {
    if (webApp) {
      webApp.MainButton.setText(text);
      if (options?.color) webApp.MainButton.color = options.color;
      if (options?.textColor) webApp.MainButton.textColor = options.textColor;
      webApp.MainButton.onClick(onClick);
      webApp.MainButton.show();
    }
  }, [webApp]);

  const hideMainButton = useCallback(() => {
    if (webApp) {
      webApp.MainButton.hide();
    }
  }, [webApp]);

  const setMainButtonLoading = useCallback((loading: boolean) => {
    if (webApp) {
      if (loading) {
        webApp.MainButton.showProgress(true);
      } else {
        webApp.MainButton.hideProgress();
      }
    }
  }, [webApp]);

  const hapticFeedback = useCallback((type: 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning') => {
    if (webApp?.HapticFeedback) {
      if (type === 'success' || type === 'error' || type === 'warning') {
        webApp.HapticFeedback.notificationOccurred(type);
      } else {
        webApp.HapticFeedback.impactOccurred(type);
      }
    }
  }, [webApp]);

  const showPopup = useCallback((params: {
    title?: string;
    message: string;
    buttons?: Array<{
      id?: string;
      type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive';
      text: string;
    }>;
  }): Promise<string> => {
    return new Promise((resolve) => {
      if (webApp) {
        webApp.showPopup(params, (buttonId: string) => {
          resolve(buttonId);
        });
      } else {
        resolve('');
      }
    });
  }, [webApp]);

  const showAlert = useCallback((message: string): Promise<void> => {
    return new Promise((resolve) => {
      if (webApp) {
        webApp.showAlert(message, () => resolve());
      } else {
        alert(message);
        resolve();
      }
    });
  }, [webApp]);

  const showConfirm = useCallback((message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (webApp) {
        webApp.showConfirm(message, (confirmed: boolean) => resolve(confirmed));
      } else {
        resolve(confirm(message));
      }
    });
  }, [webApp]);

  const shareUrl = useCallback((url: string, text?: string) => {
    if (webApp) {
      const shareText = text ? `${text}\n${url}` : url;
      webApp.switchInlineQuery(shareText);
    }
  }, [webApp]);

  const openLink = useCallback((url: string) => {
    if (webApp) {
      webApp.openLink(url);
    } else {
      window.open(url, '_blank');
    }
  }, [webApp]);

  return {
    webApp,
    user,
    theme,
    isReady,
    isInTelegram: !!webApp,
    showBackButton,
    hideBackButton,
    showMainButton,
    hideMainButton,
    setMainButtonLoading,
    hapticFeedback,
    showPopup,
    showAlert,
    showConfirm,
    shareUrl,
    openLink,
  };
};
