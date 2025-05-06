import axios from 'axios';
import getApiBaseUrl from './env';

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
      const response = await axios.get<Trip[]>(`${BASE_URL}/trips`);
      return response.data;
    } catch (error) {
      console.error('Error fetching trips:', error);
      throw error;
    }
  },

  async getTripById(id: string | number): Promise<Trip> {
    try {
      const response = await axios.get<Trip>(`${BASE_URL}/trips/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching trip details:', error);
      throw error;
    }
  }
}; 