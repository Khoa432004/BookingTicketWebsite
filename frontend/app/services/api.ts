import axios from 'axios';
import getApiBaseUrl from '@/services/env';

const BASE_URL = getApiBaseUrl();

export interface Trip {
  id: number;
  tripId: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  busType: string;
  price: number;
  availableSeats: number;
  bus: {
    id: number;
    busNumber: string;
    busType: string;
    totalSeats: number;
  };
}

export const tripApi = {
  async getTrips(): Promise<Trip[]> {
    try {
      const url = `${BASE_URL}/trips`;
      console.log('Request URL:', url);
      const response = await axios.get<Trip[]>(url);
      console.log('API Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching trips:', error);
      throw error;
    }
  },

  async getTripById(id: string): Promise<Trip> {
    try {
      const url = `${BASE_URL}/trips/${id}`;
      console.log('Request URL:', url);
      const response = await axios.get<Trip>(url);
      console.log('API Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching trip details:', error);
      throw error;
    }
  }
}; 