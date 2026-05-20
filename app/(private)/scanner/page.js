"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../hooks/useAuthSimple";
import { toast } from "sonner";
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  Camera,
  CameraOff,
  Check,
  ShoppingCart,
  Package,
  RefreshCw,
} from "lucide-react";

// Browsers that support the Shape Detection API (Chrome / Edge / Samsung Internet
// on Android, partial on desktop). Safari and Firefox don't ship it yet — we
// detect at runtime and fall back to a clear message + manual SKU input.

export default function ScannerPage() {
  const router = useRouter();
  const { session, loading: authLoading } = useAuth();

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const rafRef = useRef(null);

  const [supported, setSupported] = useState(null); // null=unknown | true | false
  const [scanning, setScanning] = useState(false);
  const [permissionError, setPermissionError] = useState(null);
  const [lastScan, setLastScan] = useState(null);
  const [history, setHistory] = useState([]);   // last 5 scans this session
  const [manualSku, setManualSku] = useState("");
  const [lookupResult, setLookupResult] = useState(null);
  const [looking, setLooking] = useState(false);

  // 1. Check BarcodeDetector availability
  useEffect(() => {
    if (typeof window === "undefined") return;
    if ("BarcodeDetector" in window) {
      setSupported(true);
    } else {
      setSupported(false);
    }
  }, []);

  // 2. Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScan();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopScan = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setScanning(false);
  }, []);

  const startScan = useCallback(async () => {
    if (!supported) {
      toast.error("Browser ini tidak support BarcodeDetector. Pakai Chrome / Edge di Android.");
      return;
    }
    setPermissionError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // BarcodeDetector formats — covers most retail barcodes
      // (EAN-13, UPC, Code128, QR)
      try {
        // eslint-disable-next-line no-undef
        detectorRef.current = new BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'],
        });
      } catch {
        // eslint-disable-next-line no-undef
        detectorRef.current = new BarcodeDetector();
      }

      setScanning(true);
      tickDetect();
    } catch (err) {
      console.error("Camera error:", err);
      setPermissionError(err.message || "Gagal akses kamera");
      stopScan();
    }
  }, [supported, stopScan]);

  const tickDetect = useCallback(() => {
    const tick = async () => {
      if (!videoRef.current || !detectorRef.current) return;
      if (videoRef.current.readyState >= 2) {
        try {
          const codes = await detectorRef.current.detect(videoRef.current);
          if (codes && codes.length > 0) {
            const value = codes[0].rawValue;
            // Debounce: ignore the same code if scanned in the last 2s
            if (lastScan?.value !== value || (Date.now() - (lastScan?.at || 0)) > 2000) {
              const scan = { value, at: Date.now() };
              setLastScan(scan);
              setHistory(prev => [scan, ...prev].slice(0, 5));
              // Vibrate feedback if supported
              if (navigator.vibrate) navigator.vibrate(80);
              await lookupSku(value);
            }
          }
        } catch (err) {
          console.warn("[scanner] detect error", err);
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastScan]);

  const lookupSku = useCallback(async (sku) => {
    if (!session) return;
    setLooking(true);
    setLookupResult(null);
    try {
      const res = await fetch(`/api/products/${encodeURIComponent(sku)}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setLookupResult({ found: true, product: json.data });
      } else {
        setLookupResult({ found: false, sku, error: json.error });
      }
    } catch (err) {
      setLookupResult({ found: false, sku, error: err.message });
    } finally {
      setLooking(false);
    }
  }, [session]);

  const handleManualLookup = (e) => {
    e.preventDefault();
    const sku = manualSku.trim();
    if (!sku) return;
    setLastScan({ value: sku, at: Date.now() });
    lookupSku(sku);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-10 w-10 text-gray-700" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link href="/dashboard" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Scanner</h1>
        <p className="text-gray-600 mt-1">Scan barcode produk dengan kamera HP.</p>
      </div>

      {supported === false && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-sm text-amber-900">
          <p className="font-medium mb-1">Browser tidak support barcode detection</p>
          <p className="text-xs">
            Chrome / Edge / Samsung Internet di Android punya support penuh.
            Safari iOS dan Firefox belum support. Anda masih bisa input SKU secara manual di bawah.
          </p>
        </div>
      )}

      {/* Camera viewport */}
      <div className="bg-black rounded-lg overflow-hidden mb-4 relative" style={{ aspectRatio: "16/9" }}>
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
        />
        {!scanning && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <div className="text-center text-white">
              <CameraOff className="h-12 w-12 mx-auto mb-2 opacity-60" />
              <p className="text-sm opacity-80">Kamera belum aktif</p>
            </div>
          </div>
        )}
        {scanning && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Scan target overlay */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-1/3 border-2 border-white/70 rounded-lg">
              <div className="absolute -top-px -left-px w-6 h-6 border-t-4 border-l-4 border-green-400 rounded-tl-lg" />
              <div className="absolute -top-px -right-px w-6 h-6 border-t-4 border-r-4 border-green-400 rounded-tr-lg" />
              <div className="absolute -bottom-px -left-px w-6 h-6 border-b-4 border-l-4 border-green-400 rounded-bl-lg" />
              <div className="absolute -bottom-px -right-px w-6 h-6 border-b-4 border-r-4 border-green-400 rounded-br-lg" />
            </div>
          </div>
        )}
      </div>

      {/* Camera controls */}
      <div className="flex gap-2 mb-6">
        {!scanning ? (
          <button
            onClick={startScan}
            disabled={supported === false}
            className="flex-1 inline-flex items-center justify-center px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
          >
            <Camera className="h-5 w-5 mr-2" /> Start Scanning
          </button>
        ) : (
          <button
            onClick={stopScan}
            className="flex-1 inline-flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <CameraOff className="h-5 w-5 mr-2" /> Stop
          </button>
        )}
      </div>

      {permissionError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-800 text-sm">Akses kamera ditolak</p>
            <p className="text-xs text-red-700 mt-1">{permissionError}</p>
          </div>
        </div>
      )}

      {/* Manual fallback */}
      <form onSubmit={handleManualLookup} className="mb-6 flex gap-2">
        <input
          type="text"
          value={manualSku}
          onChange={(e) => setManualSku(e.target.value)}
          placeholder="Atau ketik SKU manual..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
        />
        <button type="submit" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm">
          Cari
        </button>
      </form>

      {/* Lookup result */}
      {looking && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
          <p className="text-sm text-gray-600">Mencari produk...</p>
        </div>
      )}

      {!looking && lookupResult && (
        lookupResult.found ? (
          <div className="bg-white border border-green-200 rounded-lg p-5 mb-4">
            <div className="flex items-start gap-3 mb-3">
              <div className="bg-green-100 rounded-full p-2">
                <Check className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{lookupResult.product.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{lookupResult.product.sku}</p>
                <div className="mt-2 flex flex-wrap gap-3 text-sm">
                  <span className="inline-flex items-center text-gray-700">
                    <Package className="h-4 w-4 mr-1 text-gray-400" />
                    Stok: <strong className="ml-1">{lookupResult.product.stock}</strong>
                  </span>
                  {lookupResult.product.warehouse_name && (
                    <span className="text-gray-500">{lookupResult.product.warehouse_name}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Link
                href={`/sales?sku=${encodeURIComponent(lookupResult.product.sku)}`}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800"
              >
                <ShoppingCart className="h-4 w-4 mr-2" /> Catat Penjualan
              </Link>
              <Link
                href={`/products/edit/${encodeURIComponent(lookupResult.product.sku)}`}
                className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200"
              >
                Edit
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-red-200 rounded-lg p-5 mb-4">
            <div className="flex items-start gap-3 mb-3">
              <div className="bg-red-100 rounded-full p-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">Produk tidak ditemukan</p>
                <p className="text-xs text-gray-500 mt-0.5">SKU: {lookupResult.sku}</p>
              </div>
            </div>
            <Link
              href={`/products/new?sku=${encodeURIComponent(lookupResult.sku)}`}
              className="w-full inline-flex items-center justify-center px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800"
            >
              Tambah produk baru
            </Link>
          </div>
        )
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
            Scan terakhir
          </p>
          <ul className="space-y-1.5">
            {history.map((s, i) => (
              <li key={`${s.value}-${s.at}`} className="flex items-center justify-between text-sm">
                <button
                  onClick={() => lookupSku(s.value)}
                  className="text-gray-700 hover:text-blue-600 hover:underline truncate"
                >
                  {s.value}
                </button>
                <button
                  onClick={() => lookupSku(s.value)}
                  className="text-gray-400 hover:text-gray-600 ml-2"
                  title="Cari ulang"
                >
                  <RefreshCw className="h-3 w-3" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
