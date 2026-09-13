import { ChangeDetectorRef, ElementRef, NgZone } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { ImageCroppedEvent } from 'ngx-image-cropper';
import { ImageCropModalComponent, ImageCropModalData } from './image-crop-modal.component';

describe('ImageCropModalComponent', () => {
  let dialogRefMock: { close: ReturnType<typeof vi.fn>; afterOpened: ReturnType<typeof vi.fn> };
  let elementRefMock: ElementRef<HTMLElement>;
  let ngZone: NgZone;
  let source: File;
  let cdrMock: { markForCheck: ReturnType<typeof vi.fn> };

  function createComponent(dialogData?: ImageCropModalData) {
    source = new File(['x'], 'photo.png', { type: 'image/png' });
    dialogRefMock = { close: vi.fn(), afterOpened: vi.fn().mockReturnValue(of(undefined)) };
    elementRefMock = { nativeElement: document.createElement('div') };
    ngZone = { run: (fn: () => void) => fn() } as unknown as NgZone;
    cdrMock = { markForCheck: vi.fn() };

    return new ImageCropModalComponent(
      dialogRefMock as unknown as MatDialogRef<ImageCropModalComponent>,
      dialogData ?? { source },
      elementRefMock,
      ngZone,
      cdrMock as unknown as ChangeDetectorRef,
    );
  }

  beforeEach(() => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe = vi.fn();
        disconnect = vi.fn();
      },
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should create with the source file from dialogData', () => {
    // Arrange
    const component = createComponent();

    // Assert
    expect(component.source).toBe(source);
  });

  it('should start at zoom 1 with a 300px default frame size', () => {
    // Arrange
    const component = createComponent();

    // Assert
    expect(component.zoom).toBe(1);
    expect(component.frameSize).toBe(300);
  });

  describe('onImageCropped', () => {
    it('should cache the cropped blob for a later confirm() call', () => {
      // Arrange
      const component = createComponent();
      const blob = new Blob(['x']);

      // Act
      component.onImageCropped({ blob } as ImageCroppedEvent);
      component.confirm();

      // Assert
      expect(dialogRefMock.close).toHaveBeenCalledWith(blob);
    });

    it('should cache null when the event has no blob', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.onImageCropped({} as ImageCroppedEvent);
      component.confirm();

      // Assert
      expect(dialogRefMock.close).not.toHaveBeenCalled();
    });
  });

  describe('confirm', () => {
    it('should do nothing when nothing has been cropped yet', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.confirm();

      // Assert
      expect(dialogRefMock.close).not.toHaveBeenCalled();
    });
  });

  describe('close', () => {
    it('should close the dialog with no result', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.close();

      // Assert
      expect(dialogRefMock.close).toHaveBeenCalledWith();
    });
  });

  describe('zoom controls', () => {
    it('should read the input value and clamp it into range when onZoomChange is called', () => {
      // Arrange
      const component = createComponent();
      const event = { target: { value: '10' } } as unknown as Event;

      // Act
      component.onZoomChange(event);

      // Assert
      expect(component.zoom).toBe(3);
    });

    it('should not zoom below the minimum of 1', () => {
      // Arrange
      const component = createComponent();
      const event = { target: { value: '0' } } as unknown as Event;

      // Act
      component.onZoomChange(event);

      // Assert
      expect(component.zoom).toBe(1);
    });

    it('should zoom in and prevent default when onWheelZoom scrolls up', () => {
      // Arrange
      const component = createComponent();
      const event = { deltaY: -10, preventDefault: vi.fn() } as unknown as WheelEvent;

      // Act
      component.onWheelZoom(event);

      // Assert
      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.zoom).toBeCloseTo(1.05);
    });

    it('should zoom out when onWheelZoom scrolls down', () => {
      // Arrange
      const component = createComponent();
      component.zoom = 2;
      const event = { deltaY: 10, preventDefault: vi.fn() } as unknown as WheelEvent;

      // Act
      component.onWheelZoom(event);

      // Assert
      expect(component.zoom).toBeCloseTo(1.95);
    });

    it('should step zoom by the configured increment in either direction when onZoomStep is called', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.onZoomStep(1);

      // Assert
      expect(component.zoom).toBeCloseTo(1.25);

      // Act
      component.onZoomStep(-1);

      // Assert
      expect(component.zoom).toBeCloseTo(1);
    });
  });

  describe('onTransformChange / pan clamping', () => {
    it('should pass through translate values unchanged before the image has been measured', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.onTransformChange({ scale: 1, translateH: 999, translateV: -999 });

      // Assert
      expect(component.transform.translateH).toBe(999);
      expect(component.transform.translateV).toBe(-999);
      expect(component.transform.translateUnit).toBe('px');
    });

    it('should clamp the pan so the image cannot uncover the crop frame', () => {
      // Arrange
      const component = createComponent();
      // Simulate a measured 500x500 image with a 200px frame at scale 1: max pan is
      // (500*1 - 200) / 2 = 150px on each axis.
      (component as unknown as { baseImgWidth: number }).baseImgWidth = 500;
      (component as unknown as { baseImgHeight: number }).baseImgHeight = 500;
      component.frameSize = 200;

      // Act
      component.onTransformChange({ scale: 1, translateH: 999, translateV: -999 });

      // Assert
      expect(component.transform.translateH).toBe(150);
      expect(component.transform.translateV).toBe(-150);
    });

    it('should update zoom to match the new transform scale', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.onTransformChange({ scale: 2.5 });

      // Assert
      expect(component.zoom).toBe(2.5);
    });

    it('should keep the current zoom when the transform carries no scale', () => {
      // Arrange
      const component = createComponent();
      component.zoom = 1.75;

      // Act
      component.onTransformChange({ translateH: 0, translateV: 0 });

      // Assert
      expect(component.zoom).toBe(1.75);
    });

    it('should fall back to the current zoom and translate values when the transform omits them, once measured', () => {
      // Arrange
      const component = createComponent();
      (component as unknown as { baseImgWidth: number }).baseImgWidth = 500;
      (component as unknown as { baseImgHeight: number }).baseImgHeight = 500;
      component.frameSize = 200;
      component.zoom = 1;

      // Act
      component.onTransformChange({});

      // Assert
      // scale ?? this.zoom -> 1; translateH/V ?? 0 -> already-centered pan needs no clamping.
      expect(component.transform.translateH).toBe(0);
      expect(component.transform.translateV).toBe(0);
    });
  });

  describe('ngAfterViewInit', () => {
    it('should do nothing when the cropper wrapper is not in the DOM yet', () => {
      // Arrange
      const component = createComponent();

      // Assert
      expect(() => component.ngAfterViewInit()).not.toThrow();
      expect((component as unknown as { resizeObserver?: unknown }).resizeObserver).toBeUndefined();
    });

    it('should observe the wrapper and re-measure and mark for check after the dialog finishes opening', () => {
      // Arrange
      const component = createComponent();
      const wrapper = document.createElement('div');
      wrapper.className = 'cropper-wrapper';
      elementRefMock.nativeElement.appendChild(wrapper);

      // Act
      component.ngAfterViewInit();

      // Assert
      expect((component as unknown as { resizeObserver?: { observe: unknown } }).resizeObserver).toBeTruthy();
      expect(dialogRefMock.afterOpened).toHaveBeenCalled();
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });
  });

  describe('measure (via ngAfterViewInit -> afterOpened)', () => {
    it('should read the rendered image and wrapper sizes to compute the frame size', () => {
      // Arrange
      const component = createComponent();
      const wrapper = document.createElement('div');
      wrapper.className = 'cropper-wrapper';
      const img = document.createElement('img');
      img.className = 'ngx-ic-source-image';
      wrapper.appendChild(img);
      elementRefMock.nativeElement.appendChild(wrapper);

      vi.spyOn(img, 'getBoundingClientRect').mockReturnValue({
        width: 400,
        height: 300,
      } as DOMRect);
      vi.spyOn(wrapper, 'getBoundingClientRect').mockReturnValue({
        width: 500,
        height: 500,
      } as DOMRect);

      // Act
      component.ngAfterViewInit();

      // Assert
      // shorterSide = min(500, 500, 400, 300) = 300; frameSize = max(60, 300 - 8) = 292.
      expect(component.frameSize).toBe(292);
    });

    it('should leave frameSize unchanged when the image has not rendered with real dimensions yet', () => {
      // Arrange
      const component = createComponent();
      const wrapper = document.createElement('div');
      wrapper.className = 'cropper-wrapper';
      const img = document.createElement('img');
      img.className = 'ngx-ic-source-image';
      wrapper.appendChild(img);
      elementRefMock.nativeElement.appendChild(wrapper);
      // jsdom's default getBoundingClientRect() returns all-zero dimensions.
      const before = component.frameSize;

      // Act
      component.ngAfterViewInit();

      // Assert
      expect(component.frameSize).toBe(before);
    });

    it('should not throw when the wrapper has no source image yet', () => {
      // Arrange
      const component = createComponent();
      const wrapper = document.createElement('div');
      wrapper.className = 'cropper-wrapper';
      elementRefMock.nativeElement.appendChild(wrapper);

      // Assert
      expect(() => component.ngAfterViewInit()).not.toThrow();
    });

    it('should do nothing when there is no wrapper to measure at all', () => {
      // Arrange
      const component = createComponent();

      // Assert
      expect(() => (component as unknown as { measure: () => void }).measure()).not.toThrow();
    });

    it('should re-measure whenever the resize observer fires', () => {
      // Arrange
      let capturedCallback: (() => void) | undefined;
      vi.stubGlobal(
        'ResizeObserver',
        class {
          constructor(cb: () => void) {
            capturedCallback = cb;
          }
          observe = vi.fn();
          disconnect = vi.fn();
        },
      );
      const component = createComponent();
      const wrapper = document.createElement('div');
      wrapper.className = 'cropper-wrapper';
      elementRefMock.nativeElement.appendChild(wrapper);

      // Act
      component.ngAfterViewInit();

      // Assert
      expect(() => capturedCallback!()).not.toThrow();
    });
  });

  describe('ngOnDestroy', () => {
    it('should disconnect the resize observer when one was attached', () => {
      // Arrange
      const component = createComponent();
      const disconnect = vi.fn();
      (component as unknown as { resizeObserver: { disconnect: () => void } }).resizeObserver = { disconnect };

      // Act
      component.ngOnDestroy();

      // Assert
      expect(disconnect).toHaveBeenCalled();
    });

    it('should not throw when no resize observer was ever attached', () => {
      // Arrange
      const component = createComponent();

      // Assert
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});
