import { useState, useRef, useCallback, useEffect } from 'react';

export interface UseCameraOptions {
  autoStart?: boolean;
  facingMode?: 'user' | 'environment';
}

export function useCamera(options: UseCameraOptions = {}) {
  const { autoStart = false, facingMode: initialFacingMode = 'user' } = options;
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>(initialFacingMode);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const activeStreamRef = useRef<MediaStream | null>(null);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  const stopCamera = useCallback(() => {
    console.log('CAMERA: STOPPING TRACKS');
    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach((track) => track.stop());
      activeStreamRef.current = null;
    }
    setStream(null);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraReady(false);
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async (mode: 'user' | 'environment' = facingMode) => {
    console.log('CAMERA: INIT START');
    setCameraError(null);
    setIsCameraReady(false);

    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
    }

    // 10-second initialization timeout guard
    timeoutIdRef.current = setTimeout(() => {
      setIsCameraReady((ready) => {
        if (!ready) {
          console.error('CAMERA ERROR: 10s Initialization Timeout');
          setCameraError('Camera initialization timed out (10s). Please check browser camera permissions.');
        }
        return ready;
      });
    }, 10000);

    try {
      console.log('CAMERA: MEDIA DEVICES CHECK');
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser.');
      }

      // Stop previous stream if switching facing mode
      if (activeStreamRef.current) {
        console.log('CAMERA: STOPPING PREVIOUS STREAM');
        activeStreamRef.current.getTracks().forEach((track) => track.stop());
        activeStreamRef.current = null;
      }

      console.log('CAMERA: REQUESTING STREAM');
      // Minimal camera constraints to avoid constraint errors
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
        },
        audio: false,
      });

      console.log('CAMERA: STREAM RECEIVED');
      activeStreamRef.current = newStream;
      setStream(newStream);

      const video = videoRef.current;
      if (!video) {
        console.warn('CAMERA: VIDEO REF NOT FOUND YET');
        // Fallback: mark stream ready
        setIsCameraReady(true);
        if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
        return;
      }

      console.log('CAMERA: VIDEO REF FOUND');
      video.srcObject = newStream;
      console.log('CAMERA: SRC OBJECT ASSIGNED');
      video.autoplay = true;
      video.playsInline = true;
      video.muted = true;

      const markReady = () => {
        console.log('CAMERA: VIDEO PLAYING');
        console.log('CAMERA: CAMERA READY');
        setIsCameraReady(true);
        if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
      };

      try {
        console.log('CAMERA: CALLING VIDEO PLAY');
        await video.play();
        markReady();
      } catch (playErr: any) {
        console.warn('Direct video.play() deferred, waiting for metadata/canplay event:', playErr?.message || playErr);
        
        video.onloadedmetadata = async () => {
          console.log('CAMERA: METADATA LOADED');
          try {
            await video.play();
            markReady();
          } catch (err2: any) {
            console.error('CAMERA ERROR: video.play failed inside onloadedmetadata', err2?.name, err2?.message);
            setCameraError(`Video playback failed: ${err2?.message || 'Permission or autoplay blocked'}`);
          }
        };

        video.oncanplay = () => {
          console.log('CAMERA: CAN PLAY EVENT');
          markReady();
        };
      }
    } catch (err: any) {
      console.error('CAMERA ERROR:', err?.name, err?.message);
      if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);

      let errorMsg = 'Failed to access camera. Please check permissions.';
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        errorMsg = 'Camera permission denied. Please allow camera access in browser settings.';
      } else if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
        errorMsg = 'No video camera detected on your device.';
      } else if (err?.message) {
        errorMsg = err.message;
      }
      setCameraError(errorMsg);
    }
  }, [facingMode]);

  const toggleCamera = useCallback(() => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    startCamera(nextMode);
  }, [facingMode, startCamera]);

  useEffect(() => {
    if (autoStart) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [autoStart]);

  return {
    videoRef,
    stream,
    isCameraReady,
    cameraError,
    facingMode,
    startCamera,
    stopCamera,
    toggleCamera,
  };
}
