import { useEffect, useMemo, useRef } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { WebView } from "react-native-webview";

type Props = {
  token?: string;
  initialCenter: { lat: number; lng: number };
  onCenterChange: (coords: { lat: number; lng: number }) => void;
  interactive?: boolean;
  height?: number;
  badgeText?: string;
  loadingText?: string;
  fallbackHintText?: string;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const buildHtml = (
  lat: number,
  lng: number,
  token?: string,
  interactive = true,
  badgeText = "Move map and set center as location",
  loadingText = "Loading map..."
) => {
  const safeToken = token ? escapeHtml(token) : "";
  const safeBadgeText = escapeHtml(badgeText);
  const safeLoadingText = escapeHtml(loadingText);

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
    />
    <link
      rel="stylesheet"
      href="https://api.mapbox.com/mapbox-gl-js/v3.6.0/mapbox-gl.css"
    />
    <link
      rel="stylesheet"
      href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      crossorigin=""
    />
    <style>
      html, body, #map {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        background: #eef5f8;
      }
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      #map {
        position: absolute;
        inset: 0;
        ${interactive ? "" : "pointer-events: none;"}
      }
      .pin-wrap {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: none;
        z-index: 9;
      }
      .pin {
        width: 34px;
        height: 34px;
        border-radius: 999px;
        background: #2286BE;
        border: 3px solid #fff;
        box-shadow: 0 10px 24px rgba(0, 0, 0, 0.2);
        transform: translateY(-10px);
      }
      .badge {
        position: absolute;
        left: 50%;
        bottom: 12px;
        transform: translateX(-50%);
        padding: 7px 12px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.96);
        color: #334155;
        font-size: 11px;
        font-weight: 700;
        white-space: nowrap;
        box-shadow: 0 8px 18px rgba(0, 0, 0, 0.08);
        z-index: 9;
      }
      .status {
        position: absolute;
        top: 12px;
        left: 12px;
        right: 12px;
        padding: 10px 12px;
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.94);
        color: #475569;
        font-size: 12px;
        font-weight: 600;
        box-shadow: 0 8px 18px rgba(0, 0, 0, 0.08);
        z-index: 10;
      }
      .hidden {
        display: none;
      }
      .mapboxgl-ctrl-top-right,
      .leaflet-top.leaflet-right {
        top: 10px;
        right: 10px;
        ${interactive ? "" : "display: none;"}
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <div id="status" class="status">${safeLoadingText}</div>
    <div class="pin-wrap"><div class="pin"></div></div>
    <div class="badge">${safeBadgeText}</div>

    <script src="https://api.mapbox.com/mapbox-gl-js/v3.6.0/mapbox-gl.js"></script>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
    <script>
      const initialCenter = { lat: ${lat}, lng: ${lng} };
      const mapboxToken = "${safeToken}";
      const statusEl = document.getElementById("status");
      let activeMap = null;
      let centerReader = null;

      const post = (payload) => {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify(payload));
        }
      };

      const setStatus = (message, persistent) => {
        statusEl.textContent = message;
        statusEl.classList.remove("hidden");
        if (!persistent) {
          window.setTimeout(() => statusEl.classList.add("hidden"), 1500);
        }
      };

      const postCenter = () => {
        if (!centerReader) return;
        const center = centerReader();
        post({ type: "center", lat: center.lat, lng: center.lng });
      };

      window.setCenterFromNative = (lat, lng) => {
        if (!activeMap) return;
        if (activeMap.easeTo) {
          activeMap.easeTo({ center: [lng, lat], duration: 400 });
          return;
        }
        if (activeMap.setView) {
          activeMap.setView([lat, lng], activeMap.getZoom ? activeMap.getZoom() : 13, {
            animate: true,
          });
        }
      };

      const setupLeaflet = () => {
        const map = L.map("map", {
          zoomControl: false,
          attributionControl: false,
        }).setView([initialCenter.lat, initialCenter.lng], 13);

        if (${interactive ? "true" : "false"}) {
          L.control.zoom({ position: "topright" }).addTo(map);
        }
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
        }).addTo(map);

        if (!${interactive ? "true" : "false"}) {
          map.dragging.disable();
          map.touchZoom.disable();
          map.doubleClickZoom.disable();
          map.scrollWheelZoom.disable();
          map.boxZoom.disable();
          map.keyboard.disable();
          if (map.tap) map.tap.disable();
        }

        activeMap = map;
        centerReader = () => map.getCenter();
        map.whenReady(() => {
          setStatus("Fallback map loaded", false);
          post({ type: "ready", provider: "leaflet" });
          postCenter();
        });
        map.on("moveend", postCenter);
      };

      const setupMapbox = () => {
        if (!mapboxToken || !window.mapboxgl) {
          setupLeaflet();
          return;
        }

        try {
          mapboxgl.accessToken = mapboxToken;
          const map = new mapboxgl.Map({
            container: "map",
            style: "mapbox://styles/mapbox/streets-v12",
            center: [initialCenter.lng, initialCenter.lat],
            zoom: 13,
            attributionControl: false,
          });

          if (${interactive ? "true" : "false"}) {
            map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "top-right");
          }

          if (!${interactive ? "true" : "false"}) {
            map.dragPan.disable();
            map.scrollZoom.disable();
            map.boxZoom.disable();
            map.doubleClickZoom.disable();
            map.touchZoomRotate.disable();
            map.keyboard.disable();
          }

          activeMap = map;
          centerReader = () => map.getCenter();
          map.on("load", () => {
            setStatus("Map loaded", false);
            post({ type: "ready", provider: "mapbox" });
            postCenter();
          });
          map.on("moveend", postCenter);
          map.on("error", () => {
            if (activeMap && activeMap.remove) activeMap.remove();
            document.getElementById("map").innerHTML = "";
            setStatus("Mapbox failed, loading fallback map...", true);
            setupLeaflet();
          });
        } catch (error) {
          setStatus("Mapbox failed, loading fallback map...", true);
          setupLeaflet();
        }
      };

      window.onerror = function() {
        post({ type: "error", message: "Map rendering failed" });
      };

      setupMapbox();
    </script>
  </body>
</html>
`;
};

export function MapboxLocationPicker({
  token,
  initialCenter,
  onCenterChange,
  interactive = true,
  height = 260,
  badgeText = "Move map and set center as location",
  loadingText = "Loading map...",
  fallbackHintText = "Using fallback map tiles. Add EXPO_PUBLIC_MAPBOX_TOKEN for the same Mapbox styling as web.",
}: Props) {
  const webViewRef = useRef<WebView>(null);
  const initialMountCenterRef = useRef(initialCenter);
  const lastCenterRef = useRef(initialCenter);
  const html = useMemo(
    () =>
      buildHtml(
        initialMountCenterRef.current.lat,
        initialMountCenterRef.current.lng,
        token,
        interactive,
        badgeText,
        loadingText
      ),
    [badgeText, interactive, loadingText, token]
  );

  useEffect(() => {
    const previous = lastCenterRef.current;
    const latChanged = Math.abs(previous.lat - initialCenter.lat) > 0.0001;
    const lngChanged = Math.abs(previous.lng - initialCenter.lng) > 0.0001;

    if (!latChanged && !lngChanged) return;

    webViewRef.current?.injectJavaScript(`
      window.setCenterFromNative && window.setCenterFromNative(${initialCenter.lat}, ${initialCenter.lng});
      true;
    `);
  }, [initialCenter.lat, initialCenter.lng]);

  return (
    <View
      className="rounded-[24px] overflow-hidden border border-gray-200 bg-white"
      style={{ height }}
    >
      <WebView
        ref={webViewRef}
        originWhitelist={["*"]}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="always"
        cacheEnabled={false}
        nestedScrollEnabled
        startInLoadingState
        androidLayerType="hardware"
        setSupportMultipleWindows={false}
        renderLoading={() => (
          <View className="flex-1 items-center justify-center bg-[#F8FBFD]">
            <ActivityIndicator color="#2286BE" />
          </View>
        )}
        source={{ html }}
        onMessage={(event) => {
          try {
            const payload = JSON.parse(event.nativeEvent.data) as {
              type?: string;
              lat?: number;
              lng?: number;
            };
            if (
              payload.type === "center" &&
              typeof payload.lat === "number" &&
              typeof payload.lng === "number"
            ) {
              lastCenterRef.current = { lat: payload.lat, lng: payload.lng };
              onCenterChange({ lat: payload.lat, lng: payload.lng });
            }
          } catch {
            // Ignore malformed WebView messages.
          }
        }}
      />
      {!token ? (
        <View className="absolute left-3 right-3 top-3 rounded-xl bg-white/90 px-3 py-2">
          <Text className="text-[12px] font-medium text-[#7C8B95]">
            {fallbackHintText}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
