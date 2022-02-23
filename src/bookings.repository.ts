import { Booking } from "./booking";
import { DB } from "./db";
import { Traveler } from "./traveler";
import { Trip } from "./trip";

export class BookingsRepository {
  public insert(booking: Booking): Booking {
    booking.id = DB.insert<Booking>(booking);
    return booking;
  }
  public selectTripById(tripId: string): Trip {
    return DB.selectOne<Trip>(`SELECT * FROM trips WHERE id = '${tripId}'`);
  }
  public selectTravelerById(travelerId: string): Traveler {
    return DB.selectOne<Traveler>(`SELECT * FROM travelers WHERE id = '${travelerId}'`);
  }
}
