import axios from 'axios';
import { createAction } from '@reduxjs/toolkit';

// Define a standard action to trigger the API middleware
export const apiCallBegan = createAction('api/callBegan');
export const apiCallSuccess = createAction('api/callSuccess');
export const apiCallFailed = createAction('api/callFailed');

const apiMiddleware = ({ dispatch }) => next => async action => {
  if (action.type !== apiCallBegan.type) {
    return next(action);
  }

  const {
    url,
    method,
    data,
    onStart,
    onSuccess,
    onError
  } = action.payload;

  if (onStart) {
    dispatch({ type: onStart });
  }

  next(action); // To allow for optimistic updates

  try {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await axios.request({
      baseURL: process.env.REACT_APP_API_URL,
      url,
      method,
      data,
      headers,
    });

    // General success action
    dispatch(apiCallSuccess(response.data));
    // Specific success action for the slice
    if (onSuccess) {
      dispatch({ type: onSuccess, payload: response.data });
    }
  } catch (error) {
    const errorMessage = error.response ? error.response.data.message : error.message;
    // General failure action
    dispatch(apiCallFailed(errorMessage));
    // Specific failure action for the slice
    if (onError) {
      dispatch({ type: onError, payload: errorMessage });
    }
  }
};

export default apiMiddleware;