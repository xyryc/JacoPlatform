import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type Coordinates = { lat: number; lng: number } | null;

type LocationState = {
  city: string;
  radius: number;
  coordinates: Coordinates;
};

const DEFAULT_COORDS = { lat: 40.7128, lng: -74.006 };

const initialState: LocationState = {
  city: "Dhaka, Bangladesh",
  radius: 15,
  coordinates: DEFAULT_COORDS,
};

const locationSlice = createSlice({
  name: "location",
  initialState,
  reducers: {
    setLocationCity: (state, action: PayloadAction<string>) => {
      state.city = action.payload;
    },
    setLocationRadius: (state, action: PayloadAction<number>) => {
      state.radius = action.payload;
    },
    setLocationCoordinates: (state, action: PayloadAction<Coordinates>) => {
      state.coordinates = action.payload;
    },
  },
});

export const { setLocationCity, setLocationRadius, setLocationCoordinates } =
  locationSlice.actions;
export default locationSlice.reducer;
