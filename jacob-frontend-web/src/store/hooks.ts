import { useDispatch, useSelector, useStore } from 'react-redux';
import type { AppDispatch, RootState } from './index';
import { store } from './index';

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
export const useAppStore = useStore.withTypes<typeof store>();
