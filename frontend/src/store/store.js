import { configureStore } from "@reduxjs/toolkit";
import interactionReducer from "./interactionSlice.js";

export const store = configureStore({
  reducer: {
    interaction: interactionReducer,
  },
});
