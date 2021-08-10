import React from 'react';
import './styles/App.css';
import './markers/Location.svg';
import {
  GoogleMap,
  useLoadScript,
  Marker,
  InfoWindow,
} from "@react-google-maps/api";

// import { formatRelative } from "date-fns";

import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";
import {
  Combobox,
  ComboboxInput,
  ComboboxPopover,
  ComboboxList,
  ComboboxOption,
} from "@reach/combobox";
import "@reach/combobox/styles.css";

import mapStyles from './mapStyles';

const libraries = ['places'];

const mapContainerStyle = {
  width: "100vw",
  height: "100vh",
};
const center = {
  lat: 43.653225,
  lng: -79.383186,
};
const options ={
  styles: mapStyles,
  mapTypeControl: false,
};

function airq(lat, lng) {
  var requestOptions = {
      method: 'GET',
      redirect: 'follow'
    };
    fetch("http://api.airvisual.com/v2/nearest_city?lat=" + lat + "8&lon=" + lng + "&key=" + process.env.REACT_APP_AIRVISUAL_API_KEY, requestOptions)
      .then(response => response.json())
      .then(result => {
        console.log(result)
        
        var city = result.data.city
        var prov = result.data.state
        var aq = result.data.current.pollution.aqius
        var mainUS = result.data.current.pollution.mainus
        let data = [city, prov, aq, mainUS]
        
        document.querySelector("#city").innerText = `City: ${city}`
        document.querySelector("#state").innerText = `Prov: ${prov}`
        
        if(aq <= 50){
          document.getElementById("aqius").style.backgroundColor="Chartreuse";

        } else if (aq > 50 & aq <= 100){
          document.getElementById("aqius").style.backgroundColor="Yellow";
          
        } else if (aq > 100 & aq <= 150){
          document.getElementById("aqius").style.backgroundColor="Tomato";
          
        } else if (aq > 150 & aq <= 200){
          document.getElementById("aqius").style.backgroundColor="Red";
          
        } else if (aq > 200 & aq <= 300){
          document.getElementById("aqius").style.backgroundColor="Purple";
          
        } else if (aq > 300){
          document.getElementById("aqius").style.backgroundColor="Maroon";
        }

        document.querySelector("#aqius").innerText = `AirQuality US: ${result.data.current.pollution.aqius}`
        document.querySelector("#mainus").innerText = `Main US: ${result.data.current.pollution.maincn}`
        return data
      })
      .catch(error => console.log('error', error));
  };

export default function App() {

  let libRef = React.useRef(libraries)

  const {isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: libRef.current,
  });

  const  [markers, setMarkers] = React.useState([]);
  const [selected, setSelected] = React.useState(null);

  const onMapClick = React.useCallback((event) => {
    setMarkers(current => [
      ...current, 
      {
        lat: event.latLng.lat(),
        lng: event.latLng.lng(),
        time: new Date(),
      },
    ]);
  }, []);

  const mapRef = React.useRef();
  const OnMapLoad = React.useCallback((map) => {
    mapRef.current = map;
  }, []);

  const panTo = React.useCallback(({ lat, lng }) => {
    mapRef.current.panTo({lat, lng});
    mapRef.current.setZoom(14);
  }, []);

  if (loadError) return "Error loading Maps";
  if (!isLoaded) return "Loading Map"; 

  return ( 
    <div>
      <h1>
        Smoggle - Air Quality Search 
        <span role="img" aria-label="earth">
          🌏
          </span>
      </h1>

    <Search panTo={panTo} />

    <GoogleMap 
    mapContainerStyle={mapContainerStyle} 
    zoom={8} 
    center={center}
    options={options}
    onClick={onMapClick}
    onLoad={OnMapLoad}
  >
      {markers.map((marker) => (
        <Marker 
          key={marker.time.toISOString()} 
          position={{ lat: marker.lat, lng: marker.lng}} 
          icon={{
            url: "/Location.svg",
            scaledSize: new window.google.maps.Size(45,45),
            origin: new window.google.maps.Point(0,0),
            anchor: new window.google.maps.Point(15,15)
          }}
          onClick={() => {
            setSelected(marker);
          }}
        />
      ))}

      {selected ? (

        <InfoWindow position={{lat: selected.lat, lng:selected.lng}} 
        onCloseClick={() => {
          setSelected(null);
        }}
      >
        <div id="info-box">

          {
          
          airq(selected.lat, selected.lng)
          
          }

          <h2>Check out the air quality!</h2>
          <div id="location">
            <p id="city"></p>
            <p id="state"></p>
            </div>
          <div id="score">
            <p id="aqius"></p>
            <p id="mainus"></p>
            <p id="weather"></p>
          </div>
        </div>
      </InfoWindow>
      ) : null }
    </GoogleMap>
  </div>
  );  
}

function Search({ panTo }) {
  const {
    ready, 
    value, 
    suggestions: {status, data}, 
    setValue, 
    clearSuggestions,
  } = usePlacesAutocomplete ({
    requestOptions: {
      location: { lat: () => 43.653225, lng: () => -79.383186 },
      radius: 200 * 1000,
    },
  });

  return (
    <div className="search">
      <Combobox  
        onSelect={async (address) => {
          setValue(address, false);
          clearSuggestions();
          
          try {
            const result = await getGeocode({address});
            const { lat, lng } = await getLatLng(result[0]);
            panTo({lat, lng });
          } catch (error) {
            console.log.apply("error!")
          }
          console.log(address);
        }}
      >
        <ComboboxInput 
          value={value} 
          onChange={(e) => {
            setValue(e.target.value);
        }} 
        disabled={!ready}
        placeholder="Enter an address"
      />

      <ComboboxPopover>
        <ComboboxList>
          {status === "OK" &&
            data.map(({ place_id, description }) => (
            <ComboboxOption 
              key={place_id} 
              value={description}
            />
            ))}
        </ComboboxList>
      </ComboboxPopover>
    </Combobox>
  </div>
  );
}
