import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapDisplayProps {
    lat: number;
    lon: number;
    address: string;
}

const MapDisplay = ({ lat, lon, address }: MapDisplayProps) => {
    if (!lat || !lon) return null;

    return (
        <div className="h-[300px] w-full rounded-lg overflow-hidden shadow-md border border-border mt-6">
            <MapContainer center={[lat, lon]} zoom={15} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[lat, lon]}>
                    <Popup>
                        {address}
                    </Popup>
                </Marker>
            </MapContainer>
        </div>
    );
};

export default MapDisplay;

