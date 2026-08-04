import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type Coordinates = { lat: number; lng: number } | null;

interface LocationState {
  city: string;
  radius: number;
  coordinates: Coordinates;
}

const DEFAULT_COORDS = { lat: 40.7128, lng: -74.0060 };

const initialState: LocationState = {
  city: 'New York, USA',
  radius: 15,
  coordinates: DEFAULT_COORDS,
};

const locationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {
    setLocationCity: (state, action: PayloadAction<string>) => {
      const nextCity = action.payload;
      state.city = nextCity;

      if (nextCity.toLowerCase().includes('new york')) {
        state.coordinates = DEFAULT_COORDS;
      } else if (nextCity.toLowerCase().includes('chattogram')) {
        state.coordinates = { lat: 22.3569, lng: 91.7832 };
      } else if (nextCity !== 'Current Location') {
        state.coordinates = DEFAULT_COORDS;
      }
    },
    setLocationRadius: (state, action: PayloadAction<number>) => {
      state.radius = action.payload;
    },
    setLocationCoordinates: (state, action: PayloadAction<Coordinates>) => {
      state.coordinates = action.payload;
    },
  },
});

export const { setLocationCity, setLocationRadius, setLocationCoordinates } = locationSlice.actions;
export default locationSlice.reducer;
