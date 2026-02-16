/**
 * 네이버 지도 API v3 전역 타입 선언
 * @see https://navermaps.github.io/maps.js.ncp/docs/
 */
declare global {
  interface Window {
    naver?: typeof naver
  }

  const naver: {
    maps: {
      Map: new (element: HTMLElement, options: naver.maps.MapOptions) => naver.maps.Map
      LatLng: new (lat: number, lng: number) => naver.maps.LatLng
      Marker: new (options: naver.maps.MarkerOptions) => naver.maps.Marker
      InfoWindow: new (options?: naver.maps.InfoWindowOptions) => naver.maps.InfoWindow
      Event: {
        addListener(
          target: naver.maps.Map | naver.maps.Marker,
          eventName: string,
          listener: (e?: any) => void
        ): naver.maps.MapEventListener
      }
      MapEventListener: unknown
    }
  }

  namespace naver.maps {
    interface MapOptions {
      center?: LatLng
      zoom?: number
      zoomControl?: boolean
      zoomControlOptions?: { position: number }
    }
    interface Map {
      setCenter(center: LatLng): void
      setZoom(level: number): void
      getCenter(): LatLng
      getZoom(): number
      panTo(center: LatLng): void
    }
    interface LatLng {
      lat(): number
      lng(): number
    }
    interface MarkerOptions {
      position: LatLng
      map: Map
      title?: string
      icon?: string
    }
    interface Marker {
      setMap(map: Map | null): void
      getPosition(): LatLng
    }
    interface InfoWindowOptions {
      content?: string
      maxWidth?: number
      pixelOffset?: { x: number; y: number }
    }
    interface InfoWindow {
      open(map: Map, marker: Marker): void
      close(): void
      setContent(content: string): void
    }
  }
}

export {}
