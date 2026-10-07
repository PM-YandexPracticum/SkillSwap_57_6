import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { fetchSkills } from '../../../api/skills';
import { fetchUsers } from '../../../api/users';
import {TCatalogData} from '../../../shared/types/index'
import type { RootState } from '../../../store';
export const getCatalogThunk = createAsyncThunk(
  'catalog/getCatalog',
  async () => {
    const [users, skills] = await Promise.all([
      fetchUsers(),
      fetchSkills(),
    ]);
      
        
    return {
      users,
      skills,
    };
  
  },
  {
    condition: (_, { getState }) => {
      const state = getState() as RootState;

      if (state.catalog.status === 'loading') {
        return false;
      }

      return true;
    },
  }
);


const initialState: TCatalogData = {
  users: [],
  skills: [],
  status: 'idle',
  error: null,
};

export const catalogSlice = createSlice({
  name: 'catalog',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(getCatalogThunk.pending, (state) => {
      state.status = 'loading';
      state.error = null;
    });

    builder.addCase(getCatalogThunk.rejected, (state, action) => {
      state.status = 'error';
      state.error = action.error.message?? 'Ошибка загрузки каталога';
    });

    builder.addCase(getCatalogThunk.fulfilled, (state, { payload }) => {
      state.status = 'success';

      state.users = payload.users;
      state.skills = payload.skills;
    });
  },
});

export default catalogSlice.reducer;