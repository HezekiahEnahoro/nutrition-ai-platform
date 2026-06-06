'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';

interface Product {
  name: string;
  brand: string;
  serving_size: string;
  image_url: string;
  per_100g: { calories: number; protein: number; carbs: number; fat: number; fiber: number };
}

interface BarcodeScannerProps {
  onAdd: (text: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onAdd, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectedRef = useRef(false);
  const scanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [phase, setPhase] = useState<'scanning' | 'loading' | 'found' | 'error' | 'manual'>('scanning');
  const [product, setProduct] = useState<Product | null>(null);
  const [grams, setGrams] = useState('100');
  const [errorMsg, setErrorMsg] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [scanCount, setScanCount] = useState(0);

  const stopStream = useCallback(() => {
    if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const lookupBarcode = useCallback(async (code: string) => {
    stopStream();
    setPhase('loading');
    const result = await api.lookupBarcode(code);
    if (result.data) {
      setProduct(result.data as Product);
      setPhase('found');
    } else {
      setErrorMsg(result.error || 'Product not found in database');
      setPhase('error');
    }
  }, [stopStream]);

  const startCamera = useCallback(async () => {
    detectedRef.current = false;
    setScanCount(0);
    setPhase('scanning');
    stopStream();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch {
      setPhase('manual');
      return;
    }

    // Raw canvas for ZXing
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Preprocessed canvas — brightness + contrast boost for dark/low-light scenes
    const pCanvas = document.createElement('canvas');
    const pCtx = pCanvas.getContext('2d');

    // ZXing with TRY_HARDER hint — handles dark, angled, and partial barcodes
    let zxingDecode: ((c: HTMLCanvasElement) => { getText(): string }) | null = null;
    try {
      const [{ BrowserMultiFormatReader }, { DecodeHintType }] = await Promise.all([
        import('@zxing/browser'),
        import('@zxing/library'),
      ]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const hints = new Map<any, unknown>();
      hints.set(DecodeHintType.TRY_HARDER, true);
      const reader = new BrowserMultiFormatReader(hints);
      zxingDecode = (c) => reader.decodeFromCanvas(c);
    } catch { /* ZXing load failed */ }

    // Native BarcodeDetector — Chrome/Edge bonus path
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const BD = typeof window !== 'undefined' && 'BarcodeDetector' in window ? (window as any).BarcodeDetector : null;
    let detector: { detect(src: HTMLCanvasElement | HTMLVideoElement): Promise<{ rawValue: string }[]> } | null = null;
    if (BD) {
      try {
        detector = new BD({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'qr_code', 'code_39'] });
      } catch { /* unsupported */ }
    }

    if (!zxingDecode && !detector) {
      setPhase('manual');
      return;
    }

    let busy = false;
    let attempts = 0;

    const tick = async () => {
      if (detectedRef.current || busy) return;
      const video = videoRef.current;

      if (!video || video.readyState < 2 || video.videoWidth === 0) {
        scanTimerRef.current = setTimeout(tick, 150);
        return;
      }

      busy = true;
      attempts++;
      setScanCount(attempts);

      const w = video.videoWidth;
      const h = video.videoHeight;

      // Draw raw frame
      if (ctx) {
        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(video, 0, 0, w, h);
      }

      // Draw brightness/contrast boosted frame (helps dark environments significantly)
      if (pCtx) {
        pCanvas.width = w;
        pCanvas.height = h;
        pCtx.filter = 'brightness(1.6) contrast(1.8) grayscale(1)';
        pCtx.drawImage(video, 0, 0, w, h);
        pCtx.filter = 'none';
      }

      let code: string | null = null;

      // 1. BarcodeDetector on boosted canvas (OS vision handles dark better with contrast pre-applied)
      if (!code && detector && pCtx) {
        try {
          const timeout = new Promise<{ rawValue: string }[]>((r) => setTimeout(() => r([]), 200));
          const hits = await Promise.race([detector.detect(pCanvas), timeout]);
          if (hits.length > 0) code = hits[0].rawValue;
        } catch { /* miss */ }
      }

      // 2. ZXing on raw canvas
      if (!code && zxingDecode && ctx) {
        try { code = zxingDecode(canvas).getText(); } catch { /* NotFoundException — normal */ }
      }

      // 3. ZXing on boosted canvas — most effective for dark/low-contrast images
      if (!code && zxingDecode && pCtx) {
        try { code = zxingDecode(pCanvas).getText(); } catch { /* NotFoundException — normal */ }
      }

      if (code && !detectedRef.current) {
        detectedRef.current = true;
        lookupBarcode(code);
        return;
      }

      busy = false;
      if (!detectedRef.current) scanTimerRef.current = setTimeout(tick, 200);
    };

    scanTimerRef.current = setTimeout(tick, 500);
  }, [lookupBarcode, stopStream]);

  useEffect(() => {
    startCamera();
    return stopStream;
  }, [startCamera, stopStream]);

  const calc = (per100: number) => Math.round((per100 * parseFloat(grams || '100')) / 100);

  const handleAdd = () => {
    if (!product) return;
    const g = parseFloat(grams) || 100;
    onAdd(`${g}g ${product.name}${product.brand ? ` (${product.brand})` : ''}`);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }} transition={{ type: 'spring', bounce: 0.2 }}
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--glass-border)' }}>

        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--glass-border)' }}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: 'var(--accent-cyan)' }}>
              Barcode Scanner
            </p>
            <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
              {phase === 'found' ? product?.name || 'Product Found' : 'Scan product barcode'}
            </h3>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <AnimatePresence mode="wait">

          {phase === 'scanning' && (
            <motion.div key="scan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="relative bg-black overflow-hidden" style={{ height: 210 }}>
                <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" muted playsInline autoPlay />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative w-60 h-28">
                    {(['top-0 left-0 border-t-2 border-l-2 rounded-tl-md',
                       'top-0 right-0 border-t-2 border-r-2 rounded-tr-md',
                       'bottom-0 left-0 border-b-2 border-l-2 rounded-bl-md',
                       'bottom-0 right-0 border-b-2 border-r-2 rounded-br-md'] as const).map((cls, i) => (
                      <div key={i} className={`absolute w-6 h-6 ${cls}`} style={{ borderColor: 'var(--accent-cyan)' }} />
                    ))}
                    <motion.div
                      className="absolute left-2 right-2 h-0.5 rounded-full"
                      style={{ background: 'linear-gradient(90deg, transparent, var(--accent-cyan), transparent)' }}
                      animate={{ top: ['10%', '90%', '10%'] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  </div>
                </div>
                {scanCount > 0 && (
                  <div className="absolute top-2 right-3 text-xs px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(0,0,0,0.5)', color: 'rgba(255,255,255,0.45)' }}>
                    {scanCount}
                  </div>
                )}
                <div className="absolute bottom-2 left-0 right-0 text-center text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  Hold barcode steady in good light
                </div>
              </div>
              <div className="px-5 py-4">
                <button onClick={() => { stopStream(); setPhase('manual'); }}
                  className="w-full py-2.5 rounded-xl text-sm font-medium"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                  Enter barcode manually instead
                </button>
              </div>
            </motion.div>
          )}

          {phase === 'loading' && (
            <motion.div key="load" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-14 gap-4">
              <motion.div className="w-10 h-10 rounded-full border-2 border-transparent"
                style={{ borderTopColor: 'var(--accent-cyan)' }}
                animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Looking up product…</p>
            </motion.div>
          )}

          {phase === 'found' && product && (
            <motion.div key="found" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="p-5 space-y-4">
              <div className="flex items-start gap-3">
                {product.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.image_url} alt={product.name}
                    className="w-14 h-14 rounded-xl object-cover shrink-0"
                    style={{ border: '1px solid var(--glass-border)' }} />
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{product.name}</p>
                  {product.brand && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{product.brand}</p>}
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Per 100g reference</p>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                  Quantity (grams)
                </label>
                <input type="number" value={grams} onChange={(e) => setGrams(e.target.value)}
                  min="1" max="2000" className="w-full px-4 py-2.5 rounded-xl text-sm input-dark" />
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Kcal', val: calc(product.per_100g.calories), color: '#22d3ee' },
                  { label: 'Protein', val: `${calc(product.per_100g.protein)}g`, color: '#34d399' },
                  { label: 'Carbs', val: `${calc(product.per_100g.carbs)}g`, color: '#fbbf24' },
                  { label: 'Fat', val: `${calc(product.per_100g.fat)}g`, color: '#a78bfa' },
                ].map((m) => (
                  <div key={m.label} className="rounded-xl p-2.5 text-center"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)' }}>
                    <div className="text-base font-bold" style={{ color: m.color }}>{m.val}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{m.label}</div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={startCamera} className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                  Scan again
                </button>
                <button onClick={handleAdd} className="flex-1 py-2.5 rounded-xl text-sm font-semibold btn-primary">
                  Add to Meal
                </button>
              </div>
            </motion.div>
          )}

          {(phase === 'error' || phase === 'manual') && (
            <motion.div key="manual" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="p-5 space-y-4">
              {phase === 'error' && (
                <div className="rounded-xl px-4 py-3 text-sm"
                  style={{ background: 'rgba(251,113,133,0.08)', border: '1px solid rgba(251,113,133,0.2)', color: '#fb7185' }}>
                  {errorMsg}
                </div>
              )}
              {phase === 'manual' && (
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Enter the barcode number from the product label.</p>
              )}
              <div className="flex gap-2">
                <input type="text" value={manualCode} onChange={(e) => setManualCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && manualCode.trim() && lookupBarcode(manualCode.trim())}
                  placeholder="e.g. 5449000000996"
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm input-dark" />
                <button onClick={() => manualCode.trim() && lookupBarcode(manualCode.trim())}
                  disabled={!manualCode.trim()}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold btn-primary disabled:opacity-40">
                  Look up
                </button>
              </div>
              <button onClick={startCamera} className="w-full py-2.5 rounded-xl text-sm font-medium"
                style={{ background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.2)', color: 'var(--accent-cyan)' }}>
                Try camera again
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
