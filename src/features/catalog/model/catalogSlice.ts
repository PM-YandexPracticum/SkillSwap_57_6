import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { fetchSkills } from '../../../api/skills';
import { fetchUsers } from '../../../api/users';

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
      state.error = action.error;
    });

    builder.addCase(getCatalogThunk.fulfilled, (state, { payload }) => {
      state.status = 'success';

      state.users = payload.users;
      state.skills = payload.skills;
    });
  },
});