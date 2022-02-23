import { DateRangeVO } from "./dateRangeVO";
import { DB } from "./db";
import { FindTripsDTO } from "./findTripsDTO";
import { Trip } from "./trip";
export class TripsFinder {
  public findTrips(findTripsDTO: FindTripsDTO): Trip[] {
    const dates = new DateRangeVO(findTripsDTO.startDate, findTripsDTO.endDate);
    const trips: Trip[] = DB.select(
      `SELECT * FROM trips WHERE destination = '${findTripsDTO.destination}' AND start_date >= '${dates.start}' AND end_date <= '${dates.end}'`,
    );
    return trips;
  }
}
