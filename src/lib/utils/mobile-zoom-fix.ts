/**
 * 移动端防放大工具函数
 * 一体化解决方案，适配所有主流浏览器
 */

'use client';

interface MobileZoomFixConfig {
  /** 是否启用防放大 */
  enabled?: boolean;
  /** 输入框字体大小阈值 */
  fontSizeThreshold?: number;
  /** 是否强制恢复缩放 */
  forceRestore?: boolean;
  /** 是否动态控制viewport */
  dynamicViewport?: boolean;
  /** 是否在iOS Safari中特殊处理 */
  iosSpecialHandling?: boolean;
}

class MobileZoomFix {
  private config: Required<MobileZoomFixConfig>;
  private viewport: HTMLMetaElement | null = null;
  private initialViewport: string = '';
  private isInitialized = false;
  private styleElement: HTMLStyleElement | null = null;

  constructor(config: MobileZoomFixConfig = {}) {
    this.config = {
      enabled: true,
      fontSizeThreshold: 16,
      forceRestore: true,
      dynamicViewport: true,
      iosSpecialHandling: true,
      ...config
    };
  }

  /**
   * 初始化防放大功能
   */
  init(): void {
    if (this.isInitialized || typeof window === 'undefined') return;

    // 检测是否为移动设备
    if (!this.isMobile()) return;

    this.setupViewport();
    this.setupStyles();
    this.setupEventListeners();
    
    this.isInitialized = true;
    console.log('🔧 Mobile zoom fix initialized');
  }

  /**
   * 销毁防放大功能
   */
  destroy(): void {
    if (!this.isInitialized) return;

    this.removeEventListeners();
    this.restoreViewport();
    this.removeStyles();
    
    this.isInitialized = false;
    console.log('🔧 Mobile zoom fix destroyed');
  }

  /**
   * 检测是否为移动设备
   */
  private isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           window.innerWidth < 768;
  }

  /**
   * 设置viewport
   */
  private setupViewport(): void {
    this.viewport = document.querySelector('meta[name=viewport]') as HTMLMetaElement;
    if (this.viewport) {
      this.initialViewport = this.viewport.getAttribute('content') || '';
    }
  }

  /**
   * 设置样式
   */
  private setupStyles(): void {
    if (!this.config.enabled) return;

    this.styleElement = document.createElement('style');
    this.styleElement.textContent = `
      /* 全局输入框字体大小设置 */
      input, textarea, select {
        font-size: ${this.config.fontSizeThreshold}px !important;
      }
      
      /* 特定组件输入框 */
      .record-input textarea,
      .timeline-item textarea,
      .search-input input,
      .form-input input,
      .form-input textarea {
        font-size: ${this.config.fontSizeThreshold}px !important;
      }
      
      /* 防止iOS Safari自动缩放 */
      @media screen and (max-width: 768px) {
        input, textarea, select {
          font-size: ${this.config.fontSizeThreshold}px !important;
          -webkit-text-size-adjust: 100%;
        }
      }
    `;
    document.head.appendChild(this.styleElement);
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    if (!this.config.enabled) return;

    // 输入框聚焦事件
    document.addEventListener('focusin', this.handleFocusIn.bind(this), { passive: true });
    document.addEventListener('focusout', this.handleFocusOut.bind(this), { passive: true });

    // iOS Safari特殊处理
    if (this.config.iosSpecialHandling && this.isIOS()) {
      window.addEventListener('resize', this.handleIOSKeyboardShow.bind(this), { passive: true });
      document.addEventListener('visibilitychange', this.handleIOSKeyboardHide.bind(this), { passive: true });
    }
  }

  /**
   * 移除事件监听器
   */
  private removeEventListeners(): void {
    document.removeEventListener('focusin', this.handleFocusIn.bind(this));
    document.removeEventListener('focusout', this.handleFocusOut.bind(this));
    window.removeEventListener('resize', this.handleIOSKeyboardShow.bind(this));
    document.removeEventListener('visibilitychange', this.handleIOSKeyboardHide.bind(this));
  }

  /**
   * 处理输入框聚焦
   */
  private handleFocusIn(e: FocusEvent): void {
    const target = e.target as HTMLElement;
    if (!this.isInputElement(target)) return;

    if (this.config.dynamicViewport && this.viewport) {
      this.viewport.setAttribute('content', 
        'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'
      );
    }
  }

  /**
   * 处理输入框失焦
   */
  private handleFocusOut(e: FocusEvent): void {
    const target = e.target as HTMLElement;
    if (!this.isInputElement(target)) return;

    if (this.config.dynamicViewport && this.viewport) {
      this.viewport.setAttribute('content', this.initialViewport);
    }

    if (this.config.forceRestore) {
      this.forceRestoreZoom();
    }
  }

  /**
   * 处理iOS键盘显示
   */
  private handleIOSKeyboardShow(): void {
    if (this.config.dynamicViewport && this.viewport) {
      this.viewport.setAttribute('content', 
        'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'
      );
    }
  }

  /**
   * 处理iOS键盘隐藏
   */
  private handleIOSKeyboardHide(): void {
    if (this.config.dynamicViewport && this.viewport) {
      this.viewport.setAttribute('content', this.initialViewport);
    }
    
    if (this.config.forceRestore) {
      this.forceRestoreZoom();
    }
  }

  /**
   * 强制恢复缩放
   */
  private forceRestoreZoom(): void {
    setTimeout(() => {
      document.body.style.zoom = '1.01';
      setTimeout(() => {
        document.body.style.zoom = '1';
        // 滚动到顶部，防止页面位置偏移
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
      }, 0);
    }, 100);
  }

  /**
   * 检测是否为输入元素
   */
  private isInputElement(element: HTMLElement): boolean {
    return element && (
      element.tagName === 'INPUT' || 
      element.tagName === 'TEXTAREA' || 
      element.tagName === 'SELECT'
    );
  }

  /**
   * 检测是否为iOS设备
   */
  private isIOS(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  }

  /**
   * 恢复原始viewport
   */
  private restoreViewport(): void {
    if (this.viewport && this.initialViewport) {
      this.viewport.setAttribute('content', this.initialViewport);
    }
  }

  /**
   * 移除样式
   */
  private removeStyles(): void {
    if (this.styleElement && this.styleElement.parentNode) {
      this.styleElement.parentNode.removeChild(this.styleElement);
      this.styleElement = null;
    }
  }
}

// 创建全局实例
let mobileZoomFix: MobileZoomFix | null = null;

/**
 * 初始化移动端防放大功能
 */
export function initMobileZoomFix(config?: MobileZoomFixConfig): void {
  if (typeof window === 'undefined') return;
  
  mobileZoomFix = new MobileZoomFix(config);
  mobileZoomFix.init();
}

/**
 * 销毁移动端防放大功能
 */
export function destroyMobileZoomFix(): void {
  if (mobileZoomFix) {
    mobileZoomFix.destroy();
    mobileZoomFix = null;
  }
}

/**
 * 获取当前实例
 */
export function getMobileZoomFix(): MobileZoomFix | null {
  return mobileZoomFix;
}

export default MobileZoomFix;
