import { ElementRef } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { CameraCaptureModalComponent } from './camera-capture-modal.component';

describe('CameraCaptureModalComponent', () => {
  let dialogRefMock: { close: ReturnType<typeof vi.fn> };
  let component: CameraCaptureModalComponent;
  let originalMediaDevices: MediaDevices;

  function videoRef(overrides: Partial<HTMLVideoElement> = {}): ElementRef<HTMLVideoElement> {
    return {
      nativeElement: { videoWidth: 640, videoHeight: 480, play: vi.fn().mockResolvedValue(undefined), ...overrides },
    } as unknown as ElementRef<HTMLVideoElement>;
  }

  function canvasRef(overrides: Partial<HTMLCanvasElement> = {}): ElementRef<HTMLCanvasElement> {
    const ctx = { drawImage: vi.fn() };
    return {
      nativeElement: {
        width: 0,
        height: 0,
        getContext: vi.fn().mockReturnValue(ctx),
        toDataURL: vi.fn().mockReturnValue('data:image/png;base64,mock'),
        toBlob: (cb: (blob: Blob | null) => void) => cb(new Blob(['x'], { type: 'image/png' })),
        ...overrides,
      },
    } as unknown as ElementRef<HTMLCanvasElement>;
  }

  beforeEach(() => {
    originalMediaDevices = navigator.mediaDevices;
    dialogRefMock = { close: vi.fn() };
    component = new CameraCaptureModalComponent(dialogRefMock as unknown as MatDialogRef<CameraCaptureModalComponent>);
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'mediaDevices', { value: originalMediaDevices, configurable: true });
    vi.restoreAllMocks();
  });

  it('should create the component when instantiated', () => {
    // Assert
    expect(component).toBeTruthy();
  });

  describe('ngAfterViewInit / camera startup', () => {
    it('should close the modal when the browser has no getUserMedia support', async () => {
      // Arrange
      Object.defineProperty(navigator, 'mediaDevices', { value: undefined, configurable: true });

      // Act
      await component.ngAfterViewInit();

      // Assert
      expect(dialogRefMock.close).toHaveBeenCalled();
    });

    it('should start the stream and attach it to the video element when getUserMedia succeeds', async () => {
      // Arrange
      const tracks = [{ stop: vi.fn() }];
      const stream = { getTracks: () => tracks } as unknown as MediaStream;
      const getUserMedia = vi.fn().mockResolvedValue(stream);
      Object.defineProperty(navigator, 'mediaDevices', { value: { getUserMedia }, configurable: true });
      component.videoEl = videoRef();

      // Act
      await component.ngAfterViewInit();

      // Assert
      expect(getUserMedia).toHaveBeenCalledWith({ video: { facingMode: 'user' }, audio: false });
      expect(component.videoEl.nativeElement.srcObject).toBe(stream);
      expect(dialogRefMock.close).not.toHaveBeenCalled();
    });

    it('should not attach the stream when the video element ref is not available', async () => {
      // Arrange
      const tracks = [{ stop: vi.fn() }];
      const stream = { getTracks: () => tracks } as unknown as MediaStream;
      const getUserMedia = vi.fn().mockResolvedValue(stream);
      Object.defineProperty(navigator, 'mediaDevices', { value: { getUserMedia }, configurable: true });

      // Act
      await component.ngAfterViewInit();

      // Assert
      expect(dialogRefMock.close).not.toHaveBeenCalled();
    });

    it('should close the modal when getUserMedia rejects', async () => {
      // Arrange
      const getUserMedia = vi.fn().mockRejectedValue(new Error('denied'));
      Object.defineProperty(navigator, 'mediaDevices', { value: { getUserMedia }, configurable: true });
      vi.spyOn(console, 'error').mockImplementation(() => {});
      component.videoEl = videoRef();

      // Act
      await component.ngAfterViewInit();

      // Assert
      expect(dialogRefMock.close).toHaveBeenCalled();
    });
  });

  describe('capture', () => {
    it('should do nothing when the video/canvas refs are missing', () => {
      // Act
      // Assert
      expect(() => component.capture()).not.toThrow();
      expect(component.capturedDataUrl).toBeNull();
    });

    it('should draw the current frame and store the resulting data URL when capture is called', () => {
      // Arrange
      component.videoEl = videoRef();
      component.canvasEl = canvasRef();

      // Act
      component.capture();

      // Assert
      expect(component.capturedDataUrl).toBe('data:image/png;base64,mock');
    });

    it('should fall back to 1280x720 when the video has no reported dimensions yet', () => {
      // Arrange
      component.videoEl = videoRef({ videoWidth: 0, videoHeight: 0 });
      component.canvasEl = canvasRef();

      // Act
      component.capture();

      // Assert
      expect(component.canvasEl.nativeElement.width).toBe(1280);
      expect(component.canvasEl.nativeElement.height).toBe(720);
    });

    it('should do nothing when the canvas cannot provide a 2d context', () => {
      // Arrange
      component.videoEl = videoRef();
      component.canvasEl = canvasRef({ getContext: vi.fn().mockReturnValue(null) });

      // Act
      component.capture();

      // Assert
      expect(component.capturedDataUrl).toBeNull();
    });
  });

  describe('retake', () => {
    it('should clear the captured preview when retake is called', () => {
      // Arrange
      component.videoEl = videoRef();
      component.canvasEl = canvasRef();
      component.capture();

      // Act
      component.retake();

      // Assert
      expect(component.capturedDataUrl).toBeNull();
    });
  });

  describe('confirm', () => {
    it('should do nothing when nothing has been captured', () => {
      // Act
      component.confirm();

      // Assert
      expect(dialogRefMock.close).not.toHaveBeenCalled();
    });

    it('should close the dialog with a File built from the captured blob when confirm is called', () => {
      // Arrange
      component.videoEl = videoRef();
      component.canvasEl = canvasRef();
      component.capture();

      // Act
      component.confirm();

      // Assert
      expect(dialogRefMock.close).toHaveBeenCalledWith(expect.any(File));
      const file = dialogRefMock.close.mock.calls[0][0] as File;
      expect(file.type).toBe('image/png');
    });
  });

  describe('close', () => {
    it('should stop the camera stream and close the dialog when close is called', async () => {
      // Arrange
      const tracks = [{ stop: vi.fn() }];
      const stream = { getTracks: () => tracks } as unknown as MediaStream;
      const getUserMedia = vi.fn().mockResolvedValue(stream);
      Object.defineProperty(navigator, 'mediaDevices', { value: { getUserMedia }, configurable: true });
      component.videoEl = videoRef();
      await component.ngAfterViewInit();

      // Act
      component.close();

      // Assert
      expect(tracks[0].stop).toHaveBeenCalled();
      expect(dialogRefMock.close).toHaveBeenCalledWith();
    });
  });

  describe('ngOnDestroy', () => {
    it('should stop any active camera stream when the component is destroyed', async () => {
      // Arrange
      const tracks = [{ stop: vi.fn() }];
      const stream = { getTracks: () => tracks } as unknown as MediaStream;
      const getUserMedia = vi.fn().mockResolvedValue(stream);
      Object.defineProperty(navigator, 'mediaDevices', { value: { getUserMedia }, configurable: true });
      component.videoEl = videoRef();
      await component.ngAfterViewInit();

      // Act
      component.ngOnDestroy();

      // Assert
      expect(tracks[0].stop).toHaveBeenCalled();
    });
  });
});
